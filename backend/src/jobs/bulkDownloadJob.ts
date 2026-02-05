import { Job } from 'bull';
import { Op } from 'sequelize';
import { BulkDownloadJobData } from '../types';
import { ProcessedImage, BulkDownloadJob } from '../models';
import { downloadService } from '../services/downloadService';

export async function processBulkDownloadJob(job: Job<BulkDownloadJobData>): Promise<void> {
  const { jobId, serviceId, recordIds } = job.data;

  console.log(`Creating bulk download for ${recordIds.length} records`);

  // Update job status
  await BulkDownloadJob.update(
    { status: 'processing' },
    { where: { id: jobId } }
  );

  try {
    // Get all processed images for the specified records
    const whereClause: any = {
      recordId: { [Op.in]: recordIds },
      status: 'completed',
    };

    if (serviceId) {
      whereClause.serviceId = serviceId;
    }

    const images = await ProcessedImage.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });

    if (images.length === 0) {
      throw new Error('No processed images found for the specified records');
    }

    console.log(`Found ${images.length} processed images to include in zip`);

    // Create ZIP file
    const { zipPath, downloadUrl } = await downloadService.createZip(images);

    // Update job with completion status
    await BulkDownloadJob.update(
      {
        status: 'completed',
        zipPath,
        downloadUrl,
      },
      { where: { id: jobId } }
    );

    console.log(`✓ Bulk download zip created: ${downloadUrl}`);
  } catch (error: any) {
    console.error('✗ Error creating bulk download:', error);

    // Update job with error
    await BulkDownloadJob.update(
      {
        status: 'failed',
        error: error.message,
      },
      { where: { id: jobId } }
    );

    throw error;
  }
}
