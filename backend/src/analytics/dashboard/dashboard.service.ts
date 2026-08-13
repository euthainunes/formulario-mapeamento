import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GlobalFiltersDto } from '../../common/dto/global-filters.dto';
import { AudienceService } from '../audience/audience.service';
import { AccessService } from '../access/access.service';
import { ContentService } from '../content/content.service';
import { BeezzService } from '../beezz/beezz.service';
import { PodsService } from '../pods/pods.service';
import { EngagementService } from '../engagement/engagement.service';
import { AlertsService } from '../../alerts/alerts.service';
import { InsightsService } from '../../insights/insights.service';

export interface RankingItem {
  id: string;
  name: string;
  value: number;
}

function toRanking(items: { id: string; name?: string; title?: string; author?: string }[], valueKey: string): RankingItem[] {
  return items.map((i) => ({ id: i.id, name: (i as any).name ?? (i as any).title ?? (i as any).author ?? i.id, value: (i as any)[valueKey] ?? 0 }));
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audienceService: AudienceService,
    private readonly accessService: AccessService,
    private readonly contentService: ContentService,
    private readonly beezzService: BeezzService,
    private readonly podsService: PodsService,
    private readonly engagementService: EngagementService,
    private readonly alertsService: AlertsService,
    private readonly insightsService: InsightsService,
  ) {}

  async getExecutiveDashboard(filters: GlobalFiltersDto) {
    const [audience, access, content, beezz, pods, engagement, alerts, autoInsights, lastSyncJob] = await Promise.all([
      this.audienceService.getAudienceData(filters),
      this.accessService.getAccessData(filters),
      this.contentService.getContentData(filters),
      this.beezzService.getBeezzData(filters),
      this.podsService.getPodsData(filters),
      this.engagementService.getEngagementData(filters),
      this.alertsService.listAlerts('novo'),
      this.insightsService.getAutoInsights(),
      this.prisma.syncJob.findFirst({ orderBy: { startedAt: 'desc' } }),
    ]);

    const sortedContentByViews = [...content.items].sort((a, b) => b.views - a.views);
    const sortedBeezzByLikes = [...beezz.posts].sort((a, b) => b.likes - a.likes);
    const sortedPodsByAccess = [...pods.pods].sort((a, b) => b.accessCount - a.accessCount);

    return {
      kpis: [...audience.kpis, ...access.kpis, ...content.kpis, ...beezz.kpis, ...engagement.kpis, ...pods.kpis],
      accessEvolution: access.loginsByDate,
      activeUsersEvolution: audience.activeEvolution,
      engagementByType: engagement.byContentType,
      deviceBreakdown: audience.deviceBreakdown,
      topContent: toRanking(sortedContentByViews.slice(0, 5), 'views'),
      bottomContent: toRanking(sortedContentByViews.slice(-5).reverse(), 'views'),
      topBeezz: toRanking(sortedBeezzByLikes.slice(0, 5), 'likes'),
      bottomBeezz: toRanking(sortedBeezzByLikes.slice(-5).reverse(), 'likes'),
      topPods: sortedPodsByAccess.slice(0, 5).map((p) => ({ id: p.id, name: p.name, value: p.accessCount })),
      bottomPods: sortedPodsByAccess.slice(-5).reverse().map((p) => ({ id: p.id, name: p.name, value: p.accessCount })),
      priorityAlerts: alerts.slice(0, 5).map((a) => ({ id: a.id, title: a.title, severity: a.severity as 'info' | 'warning' | 'critical', createdAt: a.createdAt.toISOString() })),
      autoInsights,
      syncStatus: {
        lastSyncAt: lastSyncJob?.finishedAt?.toISOString() ?? '',
        status: (lastSyncJob?.status as 'sucesso' | 'parcial' | 'falha') ?? 'falha',
        source: lastSyncJob?.source ?? 'Intranet BeeHome',
      },
      partialCoverage: audience.partialCoverage || access.partialCoverage || content.partialCoverage || beezz.partialCoverage || pods.partialCoverage || engagement.partialCoverage,
    };
  }
}
