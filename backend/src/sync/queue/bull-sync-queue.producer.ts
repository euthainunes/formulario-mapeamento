import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SyncQueueProducer, SYNC_QUEUE_NAME } from './sync-queue.tokens';

/** Produtor real, baseado em BullMQ/Redis. Ativo quando REDIS_URL está configurado. */
@Injectable()
export class BullSyncQueueProducer implements SyncQueueProducer {
  constructor(@InjectQueue(SYNC_QUEUE_NAME) private readonly queue: Queue) {}

  async enqueueFullSync(tenantId: string, triggeredBy: 'manual' | 'scheduler' = 'manual'): Promise<void> {
    await this.queue.add('full-sync', { tenantId, triggeredBy }, { removeOnComplete: true, removeOnFail: 50 });
  }
}
