export const SYNC_QUEUE_PRODUCER = 'SYNC_QUEUE_PRODUCER';
export const SYNC_QUEUE_NAME = 'beehome-sync';

export interface SyncQueueProducer {
  /** Enfileira (ou executa em processo, no fallback sem Redis) uma sincronização completa. */
  enqueueFullSync(tenantId: string, triggeredBy?: 'manual' | 'scheduler'): Promise<void>;
}
