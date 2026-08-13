import { Injectable, Logger } from '@nestjs/common';
import { SyncQueueProducer } from './sync-queue.tokens';
import { SyncOrchestratorService } from '../sync-orchestrator.service';

/**
 * Fallback usado quando REDIS_URL não está configurado (ex: este sandbox de
 * desenvolvimento). Em vez de enfileirar via BullMQ, executa a sincronização
 * diretamente no processo atual. Funcionalmente equivalente para dev/testes,
 * mas sem os benefícios de fila (retry distribuído, concorrência controlada,
 * persistência do job fora do processo) — por isso NÃO deve ser usado em
 * produção; configure REDIS_URL para habilitar o BullSyncQueueProducer real.
 */
@Injectable()
export class InProcessSyncQueueProducer implements SyncQueueProducer {
  private readonly logger = new Logger(InProcessSyncQueueProducer.name);

  constructor(private readonly orchestrator: SyncOrchestratorService) {
    this.logger.warn('REDIS_URL não configurado — SyncQueueProducer rodando em modo fallback (execução direta, sem fila).');
  }

  async enqueueFullSync(tenantId: string, triggeredBy: 'manual' | 'scheduler' = 'manual'): Promise<void> {
    await this.orchestrator.runFullSync(tenantId, triggeredBy);
  }
}
