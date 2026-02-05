import { config } from './config';

export class RateLimiter {
  private queue: Array<() => void> = [];
  private processing = false;
  private lastExecutionTime = 0;
  private minInterval: number;

  constructor(requestsPerSecond: number = config.airtable.rateLimitPerSecond) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastExecution = now - this.lastExecutionTime;

      if (timeSinceLastExecution < this.minInterval) {
        await this.sleep(this.minInterval - timeSinceLastExecution);
      }

      const task = this.queue.shift();
      if (task) {
        this.lastExecutionTime = Date.now();
        await task();
      }
    }

    this.processing = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const airtableRateLimiter = new RateLimiter();
