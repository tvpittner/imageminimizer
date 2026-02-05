import Bull from 'bull';
import { config } from '../utils/config';
import { JobData, BulkDownloadJobData, CleanupJobData } from '../types';

// Create queues
export const imageProcessingQueue = new Bull<JobData>('image-processing', config.redis.url, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

export const bulkDownloadQueue = new Bull<BulkDownloadJobData>('bulk-download', config.redis.url, {
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

export const cleanupQueue = new Bull<CleanupJobData>('cleanup', config.redis.url, {
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 20,
  },
});

// Queue event handlers
imageProcessingQueue.on('completed', (job) => {
  console.log(`✓ Image processing job ${job.id} completed`);
});

imageProcessingQueue.on('failed', (job, err) => {
  console.error(`✗ Image processing job ${job?.id} failed:`, err.message);
});

bulkDownloadQueue.on('completed', (job) => {
  console.log(`✓ Bulk download job ${job.id} completed`);
});

bulkDownloadQueue.on('failed', (job, err) => {
  console.error(`✗ Bulk download job ${job?.id} failed:`, err.message);
});

cleanupQueue.on('completed', (job) => {
  console.log(`✓ Cleanup job ${job.id} completed`);
});

cleanupQueue.on('failed', (job, err) => {
  console.error(`✗ Cleanup job ${job?.id} failed:`, err.message);
});

export const initQueues = async () => {
  console.log('✓ Bull queues initialized');
};
