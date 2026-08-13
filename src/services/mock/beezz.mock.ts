import { IBeezzRepository, BeezzData } from "@/services/contracts/beezz.contract";
import { GlobalFilters } from "@/types/filters";
import { delay, chance } from "./_shared";
import { MOCK_BEEZZ } from "@/mocks/beezz.mock";
import { previousRange, isWithinRange } from "@/lib/date-range";
import { calcVariation } from "@/lib/metrics";
import { KpiCard, RankingItem } from "@/types/metrics";

export class MockBeezzRepository implements IBeezzRepository {
  async getBeezzData(filters: GlobalFilters): Promise<BeezzData> {
    const range = filters.dateRange;
    const prevRange = previousRange(range);

    const posts = MOCK_BEEZZ.filter((b) => isWithinRange(b.createdAt, range));
    const postsPrev = MOCK_BEEZZ.filter((b) => isWithinRange(b.createdAt, prevRange));

    const sum = (arr: typeof posts, key: "likes" | "comments") => arr.reduce((acc, p) => acc + p[key], 0);
    const activeCreators = new Set(posts.map((p) => p.author)).size;
    const activeCreatorsPrev = new Set(postsPrev.map((p) => p.author)).size;

    const kpis: KpiCard[] = [
      { id: "total-beezz", label: "Total de Beezz", value: posts.length, variation: calcVariation(posts.length, postsPrev.length) },
      { id: "beezz-likes", label: "Curtidas", value: sum(posts, "likes"), variation: calcVariation(sum(posts, "likes"), sum(postsPrev, "likes")) },
      { id: "beezz-comments", label: "Comentários", value: sum(posts, "comments"), variation: calcVariation(sum(posts, "comments"), sum(postsPrev, "comments")) },
      { id: "active-creators", label: "Criadores ativos", value: activeCreators, variation: calcVariation(activeCreators, activeCreatorsPrev) },
    ];

    const byDate = new Map<string, number>();
    for (const p of posts) byDate.set(p.createdAt, (byDate.get(p.createdAt) ?? 0) + 1);
    const activityTimeline = Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, value]) => ({ date, value }));

    const topLiked: RankingItem[] = [...posts]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 5)
      .map((p) => ({ id: p.id, name: p.title, value: p.likes }));

    const topCommented: RankingItem[] = [...posts]
      .sort((a, b) => b.comments - a.comments)
      .slice(0, 5)
      .map((p) => ({ id: p.id, name: p.title, value: p.comments }));

    const creatorTotals = new Map<string, number>();
    for (const p of posts) creatorTotals.set(p.author, (creatorTotals.get(p.author) ?? 0) + p.likes + p.comments);
    const topCreators: RankingItem[] = Array.from(creatorTotals.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value], idx) => ({ id: `creator-${idx}`, name, value }));

    return delay({ kpis, posts, activityTimeline, topLiked, topCommented, topCreators, partialCoverage: chance(0.08) });
  }
}
