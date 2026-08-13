import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SYNC_QUEUE_NAME } from './sync-queue.tokens';
import { SyncOrchestratorService } from '../sync-orchestrator.service';

/** Worker BullMQ que consome jobs de sincronização (só ativo com Redis configurado). */
@Processor(SYNC_QUEUE_NAME)
export class SyncQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncQueueProcessor.name);

  constructor(private readonly orchestrator: SyncOrchestratorService) {
    super();
  }

  async process(job: Job<{ tenantId: string; triggeredBy?: 'manual' | 'scheduler' }>): Promise<void> {
    this.logger.log(`Processando job de sync ${job.id} para tenant ${job.data.tenantId}`);
    await this.orchestrator.runFullSync(job.data.tenantId, job.data.triggeredBy ?? 'scheduler');
  }
}
