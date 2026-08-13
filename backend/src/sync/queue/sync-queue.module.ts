import { DynamicModule, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SYNC_QUEUE_NAME, SYNC_QUEUE_PRODUCER } from './sync-queue.tokens';
import { InProcessSyncQueueProducer } from './in-process-sync-queue.producer';
import { BullSyncQueueProducer } from './bull-sync-queue.producer';
import { SyncQueueProcessor } from './sync-queue.processor';
import { SyncCoreModule } from '../sync-core.module';

/**
 * Módulo de fila de sincronização com fallback gracioso.
 *
 * Por padrão (e sempre que SYNC_QUEUE_DRIVER !== "redis"), usa um produtor
 * "em processo" que executa a sincronização diretamente, sem depender de
 * Redis estar de pé. Isso é proposital: mesmo com REDIS_URL preenchido no
 * .env (ex: copiado de .env.example), um Redis real pode não estar
 * disponível em dev/sandbox — e o BullMQ/ioredis, ao tentar conectar,
 * derruba o processo com erro não tratado em vez de falhar graciosamente.
 * Por isso a ativação do driver real exige opt-in explícito via
 * SYNC_QUEUE_DRIVER=redis (além de REDIS_URL configurado).
 */
@Module({})
export class SyncQueueModule {
  static register(): DynamicModule {
    const redisUrl = process.env.REDIS_URL;
    const driver = process.env.SYNC_QUEUE_DRIVER;
    const useRealQueue = driver === 'redis' && !!redisUrl;

    if (!useRealQueue) {
      return {
        module: SyncQueueModule,
        imports: [SyncCoreModule],
        providers: [{ provide: SYNC_QUEUE_PRODUCER, useClass: InProcessSyncQueueProducer }],
        exports: [SYNC_QUEUE_PRODUCER],
      };
    }

    return {
      module: SyncQueueModule,
      imports: [
        SyncCoreModule,
        BullModule.forRoot({
          connection: {
            url: redisUrl,
            maxRetriesPerRequest: null,
            lazyConnect: true,
          },
        }),
        BullModule.registerQueue({ name: SYNC_QUEUE_NAME }),
      ],
      providers: [{ provide: SYNC_QUEUE_PRODUCER, useClass: BullSyncQueueProducer }, SyncQueueProcessor],
      exports: [SYNC_QUEUE_PRODUCER],
    };
  }
}
