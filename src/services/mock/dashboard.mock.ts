import { IDashboardRepository } from "@/services/contracts/dashboard.contract";
import { GlobalFilters } from "@/types/filters";
import { ExecutiveDashboardData } from "@/types/dashboard";
import { delay, chance } from "./_shared";
import { filterCollaborators } from "@/mocks/audience.mock";
import { loginsInRange, dailyTotals } from "@/mocks/logins.mock";
import { MOCK_CONTENT } from "@/mocks/news.mock";
import { MOCK_BEEZZ } from "@/mocks/beezz.mock";
import { MOCK_PODS } from "@/mocks/pods.mock";
import { MOCK_REACTIONS_DAILY, reactionTotalsInRange } from "@/mocks/reactions.mock";
import { MOCK_PRIORITY_ALERTS } from "@/mocks/alerts.mock";
import { MOCK_AUTO_INSIGHTS } from "@/mocks/insights.mock";
import { MOCK_SYNC_STATUS } from "@/mocks/sync.mock";
import { previousRange, isWithinRange } from "@/lib/date-range";
import { calcVariation, METRIC_FORMULAS } from "@/lib/metrics";
import { KpiCard, RankingItem, DeviceBreakdown, MultiSeriesPoint } from "@/types/metrics";

function toRanking(items: { id: string; name: string; value: number }[], desc: boolean): RankingItem[] {
  const sorted = [...items].sort((a, b) => (desc ? b.value - a.value : a.value - b.value));
  return sorted.slice(0, 5).map((i) => ({ id: i.id, name: i.name, value: i.value }));
}

function buildKpis(filters: GlobalFilters): KpiCard[] {
  const range = filters.dateRange;
  const prevRange = previousRange(range);
  const collaborators = filterCollaborators(filters);
  const collaboratorIds = new Set(collaborators.map((c) => c.id));

  const activeCurrent = collaborators.filter((c) => isWithinRange(c.lastActivity, range)).length;
  const activePrevious = collaborators.filter((c) => isWithinRange(c.lastActivity, prevRange)).length;

  const engagedCurrent = collaborators.filter(
    (c, idx) => isWithinRange(c.lastActivity, range) && idx % 5 !== 0
  ).length;
  const engagedPrevious = collaborators.filter(
    (c, idx) => isWithinRange(c.lastActivity, prevRange) && idx % 5 !== 0
  ).length;

  const loginsCurrent = loginsInRange(range.from, range.to).filter((l) => collaboratorIds.has(l.collaboratorId)).length;
  const loginsPrevious = loginsInRange(prevRange.from, prevRange.to).filter((l) => collaboratorIds.has(l.collaboratorId)).length;

  const pubsCurrent = MOCK_CONTENT.filter((c) => isWithinRange(c.publishedAt, range)).length;
  const pubsPrevious = MOCK_CONTENT.filter((c) => isWithinRange(c.publishedAt, prevRange)).length;

  const interactionsCurrent = reactionTotalsInRange(range.from, range.to).reduce((acc, r) => acc + r.count, 0);
  const interactionsPrevious = reactionTotalsInRange(prevRange.from, prevRange.to).reduce((acc, r) => acc + r.count, 0);

  return [
    {
      id: "active-users",
      label: "Usuários ativos",
      value: activeCurrent,
      variation: calcVariation(activeCurrent, activePrevious),
      formula: METRIC_FORMULAS.activeUsersRate,
      unit: "number",
    },
    {
      id: "engaged-users",
      label: "Usuários engajados",
      value: engagedCurrent,
      variation: calcVariation(engagedCurrent, engagedPrevious),
      formula: "colaboradores ativos com pelo menos uma interação registrada no período",
      unit: "number",
    },
    {
      id: "total-access",
      label: "Total de acessos",
      value: loginsCurrent,
      variation: calcVariation(loginsCurrent, loginsPrevious),
      unit: "number",
    },
    {
      id: "publications",
      label: "Publicações",
      value: pubsCurrent,
      variation: calcVariation(pubsCurrent, pubsPrevious),
      unit: "number",
    },
    {
      id: "total-interactions",
      label: "Interações totais",
      value: interactionsCurrent,
      variation: calcVariation(interactionsCurrent, interactionsPrevious),
      formula: "soma de todas as curtidas e comentários registrados em Beezz, notícias, vídeos, enquetes, photobooks, blog e podcast",
      unit: "number",
    },
    {
      id: "audience-variation",
      label: "Variação de audiência",
      value: activeCurrent,
      variation: calcVariation(activeCurrent, activePrevious),
      formula: METRIC_FORMULAS.variation,
      unit: "percent",
    },
  ];
}

export class MockDashboardRepository implements IDashboardRepository {
  async getExecutiveDashboard(filters: GlobalFilters): Promise<ExecutiveDashboardData> {
    const range = filters.dateRange;
    const collaborators = filterCollaborators(filters);
    const collaboratorIds = new Set(collaborators.map((c) => c.id));

    const logins = loginsInRange(range.from, range.to).filter((l) => collaboratorIds.has(l.collaboratorId));
    const accessEvolution = dailyTotals(logins).map((t) => ({ date: t.date, value: t.total }));

    const activeByDateMap = new Map<string, Set<string>>();
    for (const l of logins) {
      if (!activeByDateMap.has(l.date)) activeByDateMap.set(l.date, new Set());
      activeByDateMap.get(l.date)!.add(l.collaboratorId);
    }
    const activeUsersEvolution = Array.from(activeByDateMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, set]) => ({ date, value: set.size }));

    const engagementByType: MultiSeriesPoint[] = [];
    const groupedByDate = new Map<string, { beezz: number; news: number; video: number; outros: number }>();
    for (const r of MOCK_REACTIONS_DAILY) {
      if (!isWithinRange(r.date, range)) continue;
      if (!groupedByDate.has(r.date)) groupedByDate.set(r.date, { beezz: 0, news: 0, video: 0, outros: 0 });
      const bucket = groupedByDate.get(r.date)!;
      if (r.type.toLowerCase().includes("beezz")) bucket.beezz += r.count;
      else if (r.type.toLowerCase().includes("news")) bucket.news += r.count;
      else if (r.type.toLowerCase().includes("video")) bucket.video += r.count;
      else bucket.outros += r.count;
    }
    Array.from(groupedByDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .forEach(([date, v]) => engagementByType.push({ date, ...v }));

    const deviceCounts = new Map<string, number>();
    for (const c of collaborators) deviceCounts.set(c.device, (deviceCounts.get(c.device) ?? 0) + 1);
    const totalDevices = collaborators.length || 1;
    const deviceBreakdown: DeviceBreakdown[] = Array.from(deviceCounts.entries()).map(([device, count]) => ({
      device,
      count,
      percent: Number(((count / totalDevices) * 100).toFixed(1)),
    }));

    const contentInRange = MOCK_CONTENT.filter((c) => isWithinRange(c.publishedAt, range));
    const contentRankItems = contentInRange.map((c) => ({ id: c.id, name: c.title, value: c.views }));
    const beezzInRange = MOCK_BEEZZ.filter((b) => isWithinRange(b.createdAt, range));
    const beezzRankItems = beezzInRange.map((b) => ({ id: b.id, name: b.title, value: b.likes }));
    const podRankItems = MOCK_PODS.map((p) => ({ id: p.id, name: p.name, value: p.accessCount }));

    const result: ExecutiveDashboardData = {
      kpis: buildKpis(filters),
      accessEvolution,
      activeUsersEvolution,
      engagementByType,
      deviceBreakdown,
      topContent: toRanking(contentRankItems, true),
      bottomContent: toRanking(contentRankItems, false),
      topBeezz: toRanking(beezzRankItems, true),
      bottomBeezz: toRanking(beezzRankItems, false),
      topPods: toRanking(podRankItems, true),
      bottomPods: toRanking(podRankItems, false),
      priorityAlerts: MOCK_PRIORITY_ALERTS,
      autoInsights: MOCK_AUTO_INSIGHTS,
      syncStatus: MOCK_SYNC_STATUS,
      partialCoverage: chance(0.08),
    };

    return delay(result);
  }
}
