import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GlobalFiltersDto, defaultDateRange } from '../../common/dto/global-filters.dto';
import { resolvePeriod } from '../../common/period/period.util';
import { calculateVariation } from '../../common/metrics/variation.util';
import { buildKpi } from '../../common/metrics/kpi.dto';

function toContentItem(n: { id: string; title: string; publishedAt: Date | null; authorName: string | null; views: number; likes: number; comments: number }, avgViews: number) {
  const performance = n.views > avgViews * 1.2 ? 'acima_media' : n.views < avgViews * 0.8 ? 'abaixo_media' : 'na_media';
  return {
    id: n.id,
    title: n.title,
    type: 'noticia' as const,
    publishedAt: n.publishedAt?.toISOString() ?? '',
    author: n.authorName ?? '',
    views: n.views,
    likes: n.likes,
    comments: n.comments,
    performance,
  };
}

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  async getContentData(filters: GlobalFiltersDto) {
    const { from, to } = defaultDateRange(filters);
    const period = resolvePeriod(from, to);

    const [currentNews, previousCount, allInPeriod] = await Promise.all([
      this.prisma.news.findMany({ where: { publishedAt: { gte: period.from, lte: period.to } }, orderBy: { publishedAt: 'desc' } }),
      this.prisma.news.count({ where: { publishedAt: { gte: period.previousFrom, lte: period.previousTo } } }),
      this.prisma.news.findMany({ where: { publishedAt: { gte: period.from, lte: period.to } } }),
    ]);

    const avgViews = allInPeriod.length ? allInPeriod.reduce((s, n) => s + n.views, 0) / allInPeriod.length : 0;
    const variation = calculateVariation(currentNews.length, previousCount);

    const publicationsByDate = Object.entries(
      currentNews.reduce<Record<string, number>>((acc, n) => {
        if (!n.publishedAt) return acc;
        const key = n.publishedAt.toISOString().slice(0, 10);
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({ date, value }));

    const items = currentNews.map((n) => toContentItem(n, avgViews));

    const buckets = { acima_media: 0, na_media: 0, abaixo_media: 0 };
    for (const i of items) buckets[i.performance]++;

    return {
      kpis: [
        buildKpi({
          id: 'content-publications',
          label: 'Publicações no Período',
          value: currentNews.length,
          variation,
          formula: 'Contagem de News com publishedAt no período (BeeHome news/*)',
          version: 1,
          source: 'BeeHome news/getPublishedNewsChart (normalizado)',
          unit: 'number',
        }),
      ],
      items,
      publicationsByDate,
      performanceDistribution: Object.entries(buckets).map(([bucket, count]) => ({ bucket, count })),
      mostViewed: [...items].sort((a, b) => b.views - a.views).slice(0, 10),
      mostLiked: [...items].sort((a, b) => b.likes - a.likes).slice(0, 10),
      mostCommented: [...items].sort((a, b) => b.comments - a.comments).slice(0, 10),
      partialCoverage: currentNews.length === 0,
    };
  }
}
