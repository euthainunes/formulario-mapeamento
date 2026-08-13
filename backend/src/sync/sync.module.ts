import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncQueueModule } from './queue/sync-queue.module';
import { SyncCoreModule } from './sync-core.module';

@Module({
  imports: [SyncCoreModule, SyncQueueModule.register()],
  controllers: [SyncController],
  exports: [SyncCoreModule],
})
export class SyncModule {}
