import { IContentRepository, ContentData } from "@/services/contracts/content.contract";
import { GlobalFilters } from "@/types/filters";
import { delay, chance } from "./_shared";
import { MOCK_CONTENT } from "@/mocks/news.mock";
import { previousRange, isWithinRange } from "@/lib/date-range";
import { calcVariation } from "@/lib/metrics";
import { KpiCard } from "@/types/metrics";

export class MockContentRepository implements IContentRepository {
  async getContentData(filters: GlobalFilters): Promise<ContentData> {
    const range = filters.dateRange;
    const prevRange = previousRange(range);

    const items = MOCK_CONTENT.filter((c) => isWithinRange(c.publishedAt, range));
    const itemsPrev = MOCK_CONTENT.filter((c) => isWithinRange(c.publishedAt, prevRange));

    const sum = (arr: typeof items, key: "views" | "likes" | "comments") =>
      arr.reduce((acc, i) => acc + i[key], 0);

    const aboveAverage = items.filter((i) => i.performance === "acima_media").length;
    const belowAverage = items.filter((i) => i.performance === "abaixo_media").length;

    const kpis: KpiCard[] = [
      {
        id: "publications",
        label: "Publicações",
        value: items.length,
        variation: calcVariation(items.length, itemsPrev.length),
      },
      {
        id: "views",
        label: "Visualizações",
        value: sum(items, "views"),
        variation: calcVariation(sum(items, "views"), sum(itemsPrev, "views")),
      },
      {
        id: "likes",
        label: "Curtidas",
        value: sum(items, "likes"),
        variation: calcVariation(sum(items, "likes"), sum(itemsPrev, "likes")),
      },
      {
        id: "comments",
        label: "Comentários",
        value: sum(items, "comments"),
        variation: calcVariation(sum(items, "comments"), sum(itemsPrev, "comments")),
      },
      {
        id: "above-average",
        label: "Acima da média",
        value: aboveAverage,
        variation: calcVariation(aboveAverage, itemsPrev.filter((i) => i.performance === "acima_media").length),
      },
      {
        id: "below-average",
        label: "Abaixo da média",
        value: belowAverage,
        variation: calcVariation(belowAverage, itemsPrev.filter((i) => i.performance === "abaixo_media").length),
      },
    ];

    const byDate = new Map<string, number>();
    for (const i of items) byDate.set(i.publishedAt, (byDate.get(i.publishedAt) ?? 0) + 1);
    const publicationsByDate = Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, value]) => ({ date, value }));

    const performanceDistribution = [
      { bucket: "Acima da média", count: aboveAverage },
      { bucket: "Na média", count: items.filter((i) => i.performance === "na_media").length },
      { bucket: "Abaixo da média", count: belowAverage },
    ];

    const mostViewed = [...items].sort((a, b) => b.views - a.views).slice(0, 10);
    const mostLiked = [...items].sort((a, b) => b.likes - a.likes).slice(0, 10);
    const mostCommented = [...items].sort((a, b) => b.comments - a.comments).slice(0, 10);

    return delay({
      kpis,
      items,
      publicationsByDate,
      performanceDistribution,
      mostViewed,
      mostLiked,
      mostCommented,
      partialCoverage: chance(0.08),
    });
  }
}
