import express from 'express';
import path from 'path';
import { BulkDownloadJob } from '../models';
import { authMiddleware } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { bulkDownloadQueue } from '../services/queueService';
import { downloadService } from '../services/downloadService';

const router = express.Router();

// Create bulk download job (requires auth)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { serviceId, recordIds } = req.body;

    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      throw new AppError('recordIds array is required', 400);
    }

    // Create download job record
    const downloadJob = await BulkDownloadJob.create({
      serviceId,
      recordIds,
      status: 'pending',
    });

    // Queue processing
    await bulkDownloadQueue.add({
      jobId: downloadJob.id,
      serviceId,
      recordIds,
    });

    res.json({
      message: 'Bulk download job created',
      jobId: downloadJob.id,
    });
  } catch (error) {
    next(error);
  }
});

// Get download job status (requires auth)
router.get('/:jobId', authMiddleware, async (req, res, next) => {
  try {
    const downloadJob = await BulkDownloadJob.findByPk(req.params.jobId);

    if (!downloadJob) {
      throw new AppError('Download job not found', 404);
    }

    res.json({ job: downloadJob });
  } catch (error) {
    next(error);
  }
});

// Download ZIP file (public - no auth required, but uses unique ID)
router.get('/file/:filename', async (req, res, next) => {
  try {
    const filename = req.params.filename;

    // Validate filename format (should be UUID.zip)
    if (!filename.match(/^images_[a-f0-9-]+\.zip$/)) {
      throw new AppError('Invalid filename format', 400);
    }

    const zipPath = await downloadService.getZipPath(filename);

    if (!zipPath) {
      throw new AppError('File not found', 404);
    }

    res.download(zipPath, filename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          next(err);
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
