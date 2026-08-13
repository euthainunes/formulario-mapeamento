import { IEngagementRepository, EngagementData } from "@/services/contracts/engagement.contract";
import { GlobalFilters } from "@/types/filters";
import { delay, chance } from "./_shared";
import { MOCK_REACTIONS_DAILY, reactionTotalsInRange } from "@/mocks/reactions.mock";
import { previousRange, isWithinRange } from "@/lib/date-range";
import { calcVariation } from "@/lib/metrics";
import { KpiCard, MultiSeriesPoint } from "@/types/metrics";

export class MockEngagementRepository implements IEngagementRepository {
  async getEngagementData(filters: GlobalFilters): Promise<EngagementData> {
    const range = filters.dateRange;
    const prevRange = previousRange(range);

    const totals = reactionTotalsInRange(range.from, range.to);
    const totalsPrev = reactionTotalsInRange(prevRange.from, prevRange.to);

    const totalInteractions = totals.reduce((acc, t) => acc + t.count, 0);
    const totalInteractionsPrev = totalsPrev.reduce((acc, t) => acc + t.count, 0);

    const likesTotal = totals.filter((t) => t.type.toLowerCase().includes("like")).reduce((acc, t) => acc + t.count, 0);
    const likesPrev = totalsPrev.filter((t) => t.type.toLowerCase().includes("like")).reduce((acc, t) => acc + t.count, 0);
    const commentsTotal = totals.filter((t) => t.type.toLowerCase().includes("comment")).reduce((acc, t) => acc + t.count, 0);
    const commentsPrev = totalsPrev.filter((t) => t.type.toLowerCase().includes("comment")).reduce((acc, t) => acc + t.count, 0);

    const kpis: KpiCard[] = [
      { id: "total-interactions", label: "Interações totais", value: totalInteractions, variation: calcVariation(totalInteractions, totalInteractionsPrev) },
      { id: "likes", label: "Curtidas", value: likesTotal, variation: calcVariation(likesTotal, likesPrev) },
      { id: "comments", label: "Comentários", value: commentsTotal, variation: calcVariation(commentsTotal, commentsPrev) },
      { id: "variation", label: "Variação de engajamento", value: totalInteractions, variation: calcVariation(totalInteractions, totalInteractionsPrev), unit: "percent" },
    ];

    const byDate = new Map<string, number>();
    for (const r of MOCK_REACTIONS_DAILY) {
      if (!isWithinRange(r.date, range)) continue;
      byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.count);
    }
    const evolution = Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, value]) => ({ date, value }));

    const groupedByDate = new Map<string, { beezz: number; news: number; video: number; outros: number }>();
    for (const r of MOCK_REACTIONS_DAILY) {
      if (!isWithinRange(r.date, range)) continue;
      if (!groupedByDate.has(r.date)) groupedByDate.set(r.date, { beezz: 0, news: 0, video: 0, outros: 0 });
      const bucket = groupedByDate.get(r.date)!;
      const t = r.type.toLowerCase();
      if (t.includes("beezz")) bucket.beezz += r.count;
      else if (t.includes("news")) bucket.news += r.count;
      else if (t.includes("video")) bucket.video += r.count;
      else bucket.outros += r.count;
    }
    const byContentType: MultiSeriesPoint[] = Array.from(groupedByDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, v]) => ({ date, ...v }));

    return delay({ kpis, evolution, byContentType, reactionTotals: totals, partialCoverage: chance(0.08) });
  }
}
