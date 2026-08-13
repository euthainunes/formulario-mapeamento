import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GlobalFiltersDto, defaultDateRange } from '../../common/dto/global-filters.dto';
import { resolvePeriod } from '../../common/period/period.util';
import { calculateVariation } from '../../common/metrics/variation.util';
import { buildKpi } from '../../common/metrics/kpi.dto';

const REACTION_TYPES = [
  'countBeezzLiked',
  'countCommentsBeezz',
  'countBeezzCommentLike',
  'countNewsLiked',
  'countCommentsNews',
  'countNewsCommentLike',
  'countVideoLiked',
  'countCommentsVideos',
  'countPollLiked',
  'countPhotobookLiked',
  'countBlogLiked',
  'countPodcastLiked',
] as const;

const REACTION_LABELS: Record<(typeof REACTION_TYPES)[number], string> = {
  countBeezzLiked: 'Curtidas em Beezz',
  countCommentsBeezz: 'Comentários em Beezz',
  countBeezzCommentLike: 'Curtidas em comentários de Beezz',
  countNewsLiked: 'Curtidas em notícias',
  countCommentsNews: 'Comentários em notícias',
  countNewsCommentLike: 'Curtidas em comentários de notícias',
  countVideoLiked: 'Curtidas em vídeos',
  countCommentsVideos: 'Comentários em vídeos',
  countPollLiked: 'Curtidas em enquetes',
  countPhotobookLiked: 'Curtidas em photobooks',
  countBlogLiked: 'Curtidas em blog',
  countPodcastLiked: 'Curtidas em podcast',
};

@Injectable()
export class EngagementService {
  constructor(private readonly prisma: PrismaService) {}

  async getEngagementData(filters: GlobalFiltersDto) {
    const { from, to } = defaultDateRange(filters);
    const period = resolvePeriod(from, to);

    const [current, previous] = await Promise.all([
      this.prisma.reaction.findMany({ where: { capturedAt: { gte: period.from, lte: period.to } } }),
      this.prisma.reaction.findMany({ where: { capturedAt: { gte: period.previousFrom, lte: period.previousTo } } }),
    ]);

    const sumField = (rows: typeof current, field: (typeof REACTION_TYPES)[number]) => rows.reduce((s, r) => s + r[field], 0);

    const reactionTotals = REACTION_TYPES.map((type) => ({ type, label: REACTION_LABELS[type], count: sumField(current, type) }));
    const currentTotal = reactionTotals.reduce((s, r) => s + r.count, 0);
    const previousTotal = REACTION_TYPES.reduce((s, type) => s + sumField(previous, type), 0);
    const variation = calculateVariation(currentTotal, previousTotal);

    const evolution = Object.entries(
      current.reduce<Record<string, number>>((acc, r) => {
        const key = r.capturedAt.toISOString().slice(0, 10);
        const total = REACTION_TYPES.reduce((s, type) => s + r[type], 0);
        acc[key] = (acc[key] ?? 0) + total;
        return acc;
      }, {}),
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));

    const byContentType = Object.entries(
      current.reduce<Record<string, Record<string, number>>>((acc, r) => {
        const key = r.capturedAt.toISOString().slice(0, 10);
        acc[key] = acc[key] ?? { date: key } as unknown as Record<string, number>;
        acc[key].news = (acc[key].news ?? 0) + r.countNewsLiked;
        acc[key].beezz = (acc[key].beezz ?? 0) + r.countBeezzLiked;
        acc[key].video = (acc[key].video ?? 0) + r.countVideoLiked;
        acc[key].poll = (acc[key].poll ?? 0) + r.countPollLiked;
        acc[key].photobook = (acc[key].photobook ?? 0) + r.countPhotobookLiked;
        acc[key].blog = (acc[key].blog ?? 0) + r.countBlogLiked;
        acc[key].podcast = (acc[key].podcast ?? 0) + r.countPodcastLiked;
        return acc;
      }, {}),
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => value);

    return {
      kpis: [
        buildKpi({
          id: 'engagement-total-reactions',
          label: 'Total de Reações',
          value: currentTotal,
          variation,
          formula: 'Soma dos 12 campos count* documentados (Reaction) no período',
          version: 1,
          source: 'BeeHome (news/beedata, normalizado em Reaction)',
          unit: 'number',
        }),
      ],
      evolution,
      byContentType,
      reactionTotals,
      partialCoverage: currentTotal === 0,
    };
  }
}
