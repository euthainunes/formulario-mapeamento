import { GlobalFilters } from "@/types/filters";
import { KpiCard, TimeSeriesPoint, MultiSeriesPoint } from "@/types/metrics";
import { ReactionTotal } from "@/types/content";

export interface EngagementData {
  kpis: KpiCard[];
  evolution: TimeSeriesPoint[];
  byContentType: MultiSeriesPoint[];
  reactionTotals: ReactionTotal[];
  partialCoverage?: boolean;
}

export interface IEngagementRepository {
  getEngagementData(filters: GlobalFilters): Promise<EngagementData>;
}
