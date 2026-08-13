import { Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { SYNC_QUEUE_PRODUCER, SyncQueueProducer } from './queue/sync-queue.tokens';

@ApiTags('sync')
@ApiBearerAuth()
@Controller('sync')
export class SyncController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SYNC_QUEUE_PRODUCER) private readonly queueProducer: SyncQueueProducer,
  ) {}

  @Get('status')
  @RequirePermissions('sync.view')
  async getLatestStatus() {
    const lastJob = await this.prisma.syncJob.findFirst({ orderBy: { startedAt: 'desc' } });
    return {
      lastSyncAt: lastJob?.finishedAt?.toISOString() ?? null,
      status: lastJob?.status ?? 'nunca_executado',
      source: lastJob?.source ?? 'Intranet BeeHome',
    };
  }

  @Get('jobs')
  @RequirePermissions('sync.view')
  listJobs() {
    return this.prisma.syncJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: { logs: { orderBy: { startedAt: 'asc' } } },
    });
  }

  @Post('trigger')
  @RequirePermissions('integration.manage')
  async trigger(@CurrentUser() user: AuthenticatedUser) {
    await this.queueProducer.enqueueFullSync(user.tenantId, 'manual');
    return { success: true, message: 'Sincronização disparada' };
  }
}
