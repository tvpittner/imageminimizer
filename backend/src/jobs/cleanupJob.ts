import { Job } from 'bull';
import { Op } from 'sequelize';
import { CleanupJobData } from '../types';
import { ProcessedImage } from '../models';
import { FileHelper } from '../utils/fileHelper';
import { config } from '../utils/config';

export async function processCleanupJob(job: Job<CleanupJobData>): Promise<void> {
  const { type } = job.data;

  console.log(`Running cleanup job: ${type}`);

  if (type === 'originals') {
    // Delete original images older than retention period
    const deletedCount = await FileHelper.cleanupOldFiles(
      config.storage.originalRetentionDays,
      'original'
    );
    console.log(`✓ Deleted ${deletedCount} original files older than ${config.storage.originalRetentionDays} days`);
  } else if (type === 'expired') {
    // Find and delete expired processed images
    const expiredImages = await ProcessedImage.findAll({
      where: {
        expiresAt: {
          [Op.lt]: new Date(),
        },
        status: 'completed',
      },
    });

    let deletedCount = 0;

    for (const image of expiredImages) {
      try {
        // Delete processed file
        await FileHelper.deleteFile(image.processedPath);

        // Delete original if it exists
        await FileHelper.deleteFile(image.originalPath);

        // Update database record
        await image.update({
          status: 'failed',
          error: 'Expired',
        });

        deletedCount++;
      } catch (error) {
        console.error(`Error deleting expired image ${image.id}:`, error);
      }
    }

    console.log(`✓ Deleted ${deletedCount} expired processed images`);
  }
}

// Standalone script for manual cleanup
if (require.main === module) {
  (async () => {
    const { sequelize } = await import('../models');

    try {
      await sequelize.authenticate();
      console.log('Connected to database');

      // Run both cleanup types
      await processCleanupJob({
        data: { type: 'originals' },
      } as any);

      await processCleanupJob({
        data: { type: 'expired' },
      } as any);

      console.log('✓ Cleanup completed');
      process.exit(0);
    } catch (error) {
      console.error('✗ Cleanup failed:', error);
      process.exit(1);
    }
  })();
}
