import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BeeHomeConnector } from './connectors/beehome.connector';
import { SyncOrchestratorService } from './sync-orchestrator.service';
import { InsightsModule } from '../insights/insights.module';

/**
 * Núcleo do SyncModule (connector + orquestrador), separado em módulo
 * próprio para poder ser importado tanto pelo SyncModule (controller HTTP)
 * quanto pelo SyncQueueModule (worker BullMQ) sem criar dependência
 * circular entre os dois.
 */
@Module({
  imports: [ConfigModule, InsightsModule],
  providers: [BeeHomeConnector, SyncOrchestratorService],
  exports: [BeeHomeConnector, SyncOrchestratorService],
})
export class SyncCoreModule {}
