import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GlobalFiltersDto, defaultDateRange } from '../../common/dto/global-filters.dto';
import { resolvePeriod } from '../../common/period/period.util';
import { calculateVariation } from '../../common/metrics/variation.util';
import { buildKpi } from '../../common/metrics/kpi.dto';

@Injectable()
export class BeezzService {
  constructor(private readonly prisma: PrismaService) {}

  async getBeezzData(filters: GlobalFiltersDto) {
    const { from, to } = defaultDateRange(filters);
    const period = resolvePeriod(from, to);

    const [current, previousCount] = await Promise.all([
      this.prisma.beezz.findMany({ where: { createdAt: { gte: period.from, lte: period.to } }, orderBy: { createdAt: 'desc' } }),
      this.prisma.beezz.count({ where: { createdAt: { gte: period.previousFrom, lte: period.previousTo } } }),
    ]);

    const variation = calculateVariation(current.length, previousCount);

    const posts = current.map((b) => ({
      id: b.id,
      title: b.title ?? '',
      author: b.authorName ?? '',
      createdAt: b.createdAt.toISOString(),
      likes: b.likes,
      comments: b.comments,
    }));

    const activityTimeline = Object.entries(
      current.reduce<Record<string, number>>((acc, b) => {
        const key = b.createdAt.toISOString().slice(0, 10);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));

    const toRanking = (items: typeof posts, key: 'likes' | 'comments') =>
      [...items]
        .sort((a, b) => b[key] - a[key])
        .slice(0, 10)
        .map((p) => ({ id: p.id, name: p.title || p.author, value: p[key] }));

    const authorCounts = new Map<string, number>();
    for (const p of posts) authorCounts.set(p.author, (authorCounts.get(p.author) ?? 0) + 1);
    const topCreators = Array.from(authorCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, value], idx) => ({ id: `creator-${idx}`, name, value }));

    return {
      kpis: [
        buildKpi({
          id: 'beezz-total',
          label: 'Beezz Publicados',
          value: current.length,
          variation,
          formula: 'Contagem de Beezz com createdAt no período',
          version: 1,
          source: 'BeeHome beedata/beezz/* (normalizado)',
          unit: 'number',
        }),
      ],
      posts,
      activityTimeline,
      topLiked: toRanking(posts, 'likes'),
      topCommented: toRanking(posts, 'comments'),
      topCreators,
      partialCoverage: current.length === 0,
    };
  }
}
