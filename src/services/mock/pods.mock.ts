import { IPodsRepository, PodsData } from "@/services/contracts/pods.contract";
import { GlobalFilters } from "@/types/filters";
import { delay, chance } from "./_shared";
import { MOCK_PODS } from "@/mocks/pods.mock";
import { calcVariation } from "@/lib/metrics";
import { KpiCard } from "@/types/metrics";
import { seededRandom } from "@/lib/utils";
import { differenceInCalendarDays } from "date-fns";

export class MockPodsRepository implements IPodsRepository {
  async getPodsData(filters: GlobalFilters): Promise<PodsData> {
    const range = filters.dateRange;
    const pods = MOCK_PODS;
    const sorted = [...pods].sort((a, b) => b.accessCount - a.accessCount);
    const mostAccessed = sorted[0];
    const leastAccessed = sorted[sorted.length - 1];
    const growing = pods.filter((p) => p.status === "crescimento").length;
    const declining = pods.filter((p) => p.status === "queda").length;

    const kpis: KpiCard[] = [
      { id: "most-accessed", label: "Pod mais acessado", value: mostAccessed.accessCount, formattedValue: mostAccessed.name, variation: calcVariation(mostAccessed.accessCount, Math.round(mostAccessed.accessCount * 0.9)) },
      { id: "least-accessed", label: "Pod menos acessado", value: leastAccessed.accessCount, formattedValue: leastAccessed.name, variation: calcVariation(leastAccessed.accessCount, Math.round(leastAccessed.accessCount * 1.05)) },
      { id: "growing", label: "Pods em crescimento", value: growing, variation: { current: growing, previous: growing, comparable: false, percentChange: null, direction: "none" } },
      { id: "declining", label: "Pods em queda", value: declining, variation: { current: declining, previous: declining, comparable: false, percentChange: null, direction: "none" } },
    ];

    const days = Math.max(7, differenceInCalendarDays(new Date(range.to), new Date(range.from)) + 1);
    const rnd = seededRandom(88);
    const totalAccess = pods.reduce((acc, p) => acc + p.accessCount, 0);
    const evolution = Array.from({ length: days }, (_, i) => {
      const date = new Date(range.from);
      date.setDate(date.getDate() + i);
      const base = totalAccess / days;
      return { date: date.toISOString().slice(0, 10), value: Math.round(base * (0.6 + rnd() * 0.8)) };
    });

    return delay({ kpis, pods, evolution, partialCoverage: chance(0.08) });
  }
}
