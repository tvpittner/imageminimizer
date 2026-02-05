import { imageProcessingQueue, bulkDownloadQueue, cleanupQueue } from '../services/queueService';
import { processImageJob } from './imageProcessingJob';
import { processBulkDownloadJob } from './bulkDownloadJob';
import { processCleanupJob } from './cleanupJob';

export const registerJobProcessors = () => {
  // Image processing queue processor
  imageProcessingQueue.process(5, async (job) => {
    await processImageJob(job);
  });

  // Bulk download queue processor
  bulkDownloadQueue.process(2, async (job) => {
    await processBulkDownloadJob(job);
  });

  // Cleanup queue processor
  cleanupQueue.process(1, async (job) => {
    await processCleanupJob(job);
  });

  console.log('✓ Job processors registered');
};
