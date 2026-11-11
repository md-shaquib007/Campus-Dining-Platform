import logger from '../logger';

type JobHandler = () => Promise<void>;

interface Job {
  id: string;
  name: string;
  handler: JobHandler;
  retries: number;
  maxRetries: number;
}

class JobQueue {
  private queue: Job[] = [];
  private processing = false;

  enqueue(name: string, handler: JobHandler, maxRetries = 3): string {
    const id = `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    this.queue.push({ id, name, handler, retries: 0, maxRetries });
    this.process();
    return id;
  }

  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      try {
        await job.handler();
        logger.debug(`Job completed: ${job.name} (${job.id})`);
      } catch (error) {
        job.retries++;
        if (job.retries < job.maxRetries) {
          logger.warn(`Job retry ${job.retries}/${job.maxRetries}: ${job.name}`);
          this.queue.push(job);
        } else {
          logger.error(`Job failed permanently: ${job.name}`, error);
        }
      }
    }

    this.processing = false;
  }
}

export const jobQueue = new JobQueue();

export function scheduleReportGeneration(handler: JobHandler) {
  return jobQueue.enqueue('report-generation', handler);
}

export function scheduleEmail(name: string, handler: JobHandler) {
  return jobQueue.enqueue(`email:${name}`, handler);
}

export function scheduleNotification(handler: JobHandler) {
  return jobQueue.enqueue('notification', handler);
}
