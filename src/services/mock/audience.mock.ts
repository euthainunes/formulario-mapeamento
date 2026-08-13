import { IAudienceRepository } from "@/services/contracts/audience.contract";
import { AudienceData, AudienceComparisonPoint } from "@/services/contracts/audience.contract";
import { GlobalFilters } from "@/types/filters";
import { delay, chance } from "./_shared";
import { filterCollaborators } from "@/mocks/audience.mock";
import { previousRange, isWithinRange } from "@/lib/date-range";
import { calcVariation, METRIC_FORMULAS } from "@/lib/metrics";
import { KpiCard } from "@/types/metrics";

export class MockAudienceRepository implements IAudienceRepository {
  async getAudienceData(filters: GlobalFilters): Promise<AudienceData> {
    const range = filters.dateRange;
    const prevRange = previousRange(range);
    const collaborators = filterCollaborators(filters);

    const activeInRange = collaborators.filter((c) => isWithinRange(c.lastActivity, range));
    const activePrev = collaborators.filter((c) => isWithinRange(c.lastActivity, prevRange));

    const today = range.to;
    const activeToday = collaborators.filter((c) => c.lastActivity === today).length;
    const activeThisWeek = collaborators.filter((c) => c.lastActivity >= range.to && c.lastActivity <= range.to).length;

    const engaged = activeInRange.filter((_, idx) => idx % 5 !== 0).length;
    const engagedPrev = activePrev.filter((_, idx) => idx % 5 !== 0).length;

    const kpis: KpiCard[] = [
      {
        id: "active-period",
        label: "Ativos no período",
        value: activeInRange.length,
        variation: calcVariation(activeInRange.length, activePrev.length),
        formula: METRIC_FORMULAS.activeUsersRate,
      },
      {
        id: "active-today",
        label: "Ativos hoje",
        value: activeToday,
        variation: calcVariation(activeToday, Math.max(0, activeToday - 3)),
      },
      {
        id: "active-week",
        label: "Ativos na semana",
        value: activeThisWeek,
        variation: calcVariation(activeThisWeek, Math.max(0, activeThisWeek - 5)),
      },
      {
        id: "engaged",
        label: "Engajados",
        value: engaged,
        variation: calcVariation(engaged, engagedPrev),
      },
    ];

    const deviceCounts = new Map<string, number>();
    for (const c of collaborators) deviceCounts.set(c.device, (deviceCounts.get(c.device) ?? 0) + 1);
    const total = collaborators.length || 1;
    const deviceBreakdown = Array.from(deviceCounts.entries()).map(([device, count]) => ({
      device,
      count,
      percent: Number(((count / total) * 100).toFixed(1)),
    }));

    const activeByDateMap = new Map<string, number>();
    for (const c of collaborators) {
      if (isWithinRange(c.lastActivity, range)) {
        activeByDateMap.set(c.lastActivity, (activeByDateMap.get(c.lastActivity) ?? 0) + 1);
      }
    }
    const activeEvolution = Array.from(activeByDateMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, value]) => ({ date, value }));

    const periodComparison: AudienceComparisonPoint[] = [
      { label: "Ativos", currentPeriod: activeInRange.length, previousPeriod: activePrev.length },
      { label: "Engajados", currentPeriod: engaged, previousPeriod: engagedPrev },
    ];

    return delay({
      kpis,
      activeEvolution,
      deviceBreakdown,
      periodComparison,
      collaborators,
      partialCoverage: chance(0.08),
    });
  }
}
