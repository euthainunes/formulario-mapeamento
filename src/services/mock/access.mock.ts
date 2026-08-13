import { IAccessRepository, AccessData, HourAverage, WeekdayAverage, HeatmapCell } from "@/services/contracts/access.contract";
import { GlobalFilters } from "@/types/filters";
import { delay, chance } from "./_shared";
import { filterCollaborators } from "@/mocks/audience.mock";
import { loginsInRange, dailyTotals } from "@/mocks/logins.mock";
import { previousRange } from "@/lib/date-range";
import { calcVariation, METRIC_FORMULAS } from "@/lib/metrics";
import { differenceInCalendarDays } from "date-fns";
import { KpiCard } from "@/types/metrics";

const WEEKDAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export class MockAccessRepository implements IAccessRepository {
  async getAccessData(filters: GlobalFilters): Promise<AccessData> {
    const range = filters.dateRange;
    const prevRange = previousRange(range);
    const collaboratorIds = new Set(filterCollaborators(filters).map((c) => c.id));

    const logins = loginsInRange(range.from, range.to).filter((l) => collaboratorIds.has(l.collaboratorId));
    const loginsPrev = loginsInRange(prevRange.from, prevRange.to).filter((l) => collaboratorIds.has(l.collaboratorId));

    const days = Math.max(1, differenceInCalendarDays(new Date(range.to), new Date(range.from)) + 1);
    const dailyAverage = logins.length / days;

    const hourCounts = new Map<number, number>();
    for (const l of logins) hourCounts.set(l.hour, (hourCounts.get(l.hour) ?? 0) + 1);
    let peakHour = 0;
    let peakValue = -1;
    for (const [hour, count] of hourCounts.entries()) {
      if (count > peakValue) {
        peakValue = count;
        peakHour = hour;
      }
    }

    const kpis: KpiCard[] = [
      {
        id: "total-logins",
        label: "Total de logins",
        value: logins.length,
        variation: calcVariation(logins.length, loginsPrev.length),
      },
      {
        id: "daily-average",
        label: "Média diária",
        value: Math.round(dailyAverage),
        variation: calcVariation(dailyAverage, loginsPrev.length / days),
        formula: METRIC_FORMULAS.dailyAverage,
      },
      {
        id: "peak-hour",
        label: "Horário de pico",
        value: peakHour,
        formattedValue: `${peakHour}h`,
        variation: { current: peakHour, previous: peakHour, comparable: false, percentChange: null, direction: "none" },
        formula: METRIC_FORMULAS.peakHour,
      },
      {
        id: "access-variation",
        label: "Variação de acessos",
        value: logins.length,
        variation: calcVariation(logins.length, loginsPrev.length),
        unit: "percent",
      },
    ];

    const loginTable = dailyTotals(logins);

    const averageByHour: HourAverage[] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      average: Number(((hourCounts.get(hour) ?? 0) / days).toFixed(1)),
    }));

    const weekdayCounts = new Map<number, number>();
    const weekdayDayCount = new Map<number, Set<string>>();
    for (const l of logins) {
      const dow = new Date(l.date).getDay();
      weekdayCounts.set(dow, (weekdayCounts.get(dow) ?? 0) + 1);
      if (!weekdayDayCount.has(dow)) weekdayDayCount.set(dow, new Set());
      weekdayDayCount.get(dow)!.add(l.date);
    }
    const averageByWeekday: WeekdayAverage[] = WEEKDAY_LABELS.map((label, dow) => {
      const total = weekdayCounts.get(dow) ?? 0;
      const occurrences = weekdayDayCount.get(dow)?.size ?? 1;
      return { weekday: label, average: Number((total / Math.max(1, occurrences)).toFixed(1)) };
    });

    const heatmapMap = new Map<string, number>();
    for (const l of logins) {
      const dow = new Date(l.date).getDay();
      const key = `${dow}-${l.hour}`;
      heatmapMap.set(key, (heatmapMap.get(key) ?? 0) + 1);
    }
    const heatmap: HeatmapCell[] = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      for (let hour = 0; hour < 24; hour++) {
        heatmap.push({ weekday, hour, value: heatmapMap.get(`${weekday}-${hour}`) ?? 0 });
      }
    }

    return delay({
      kpis,
      loginsByDate: loginTable.map((t) => ({ date: t.date, value: t.total })),
      averageByHour,
      averageByWeekday,
      heatmap,
      loginTable,
      partialCoverage: chance(0.08),
    });
  }
}
