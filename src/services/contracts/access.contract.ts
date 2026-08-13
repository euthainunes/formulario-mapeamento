import { GlobalFilters } from "@/types/filters";
import { KpiCard, TimeSeriesPoint } from "@/types/metrics";

export interface HourAverage {
  hour: number;
  average: number;
}

export interface WeekdayAverage {
  weekday: string;
  average: number;
}

export interface HeatmapCell {
  weekday: number; // 0-6
  hour: number; // 0-23
  value: number;
}

export interface AccessData {
  kpis: KpiCard[];
  loginsByDate: TimeSeriesPoint[];
  averageByHour: HourAverage[];
  averageByWeekday: WeekdayAverage[];
  heatmap: HeatmapCell[];
  loginTable: { date: string; total: number }[];
  partialCoverage?: boolean;
}

export interface IAccessRepository {
  getAccessData(filters: GlobalFilters): Promise<AccessData>;
}
