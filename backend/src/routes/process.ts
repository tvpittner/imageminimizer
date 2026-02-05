import express from 'express';
import { Service } from '../models';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { imageProcessingQueue } from '../services/queueService';
import { airtableService } from '../services/airtableService';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Process images for a specific record
router.post('/record', async (req, res, next) => {
  try {
    const { serviceId, recordId } = req.body;

    if (!serviceId || !recordId) {
      throw new AppError('serviceId and recordId are required', 400);
    }

    // Get service
    const service = await Service.findByPk(serviceId);
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    if (!service.enabled) {
      throw new AppError('Service is disabled', 400);
    }

    // Get attachments from Airtable
    const attachments = await airtableService.getAttachments(
      service.tableName,
      recordId,
      service.attachmentFieldName
    );

    if (attachments.length === 0) {
      throw new AppError('No attachments found in the specified field', 400);
    }

    // Queue processing job
    const job = await imageProcessingQueue.add({
      serviceId,
      recordId,
      attachments,
    });

    res.json({
      message: 'Image processing job queued',
      jobId: job.id,
      attachmentCount: attachments.length,
    });
  } catch (error) {
    next(error);
  }
});

// Process images for multiple records
router.post('/batch', async (req, res, next) => {
  try {
    const { serviceId, recordIds } = req.body;

    if (!serviceId || !recordIds || !Array.isArray(recordIds)) {
      throw new AppError('serviceId and recordIds array are required', 400);
    }

    // Get service
    const service = await Service.findByPk(serviceId);
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    if (!service.enabled) {
      throw new AppError('Service is disabled', 400);
    }

    const jobs = [];

    // Queue job for each record
    for (const recordId of recordIds) {
      try {
        const attachments = await airtableService.getAttachments(
          service.tableName,
          recordId,
          service.attachmentFieldName
        );

        if (attachments.length > 0) {
          const job = await imageProcessingQueue.add({
            serviceId,
            recordId,
            attachments,
          });

          jobs.push({
            jobId: job.id,
            recordId,
            attachmentCount: attachments.length,
          });
        }
      } catch (error) {
        console.error(`Error queuing job for record ${recordId}:`, error);
      }
    }

    res.json({
      message: `Queued ${jobs.length} image processing jobs`,
      jobs,
    });
  } catch (error) {
    next(error);
  }
});

// Get job status
router.get('/job/:jobId', async (req, res, next) => {
  try {
    const job = await imageProcessingQueue.getJob(req.params.jobId);

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    const state = await job.getState();
    const progress = job.progress();
    const failedReason = job.failedReason;

    res.json({
      jobId: job.id,
      state,
      progress,
      failedReason,
      data: job.data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
