import { GlobalFilters } from "@/types/filters";
import { KpiCard, TimeSeriesPoint } from "@/types/metrics";
import { Pod } from "@/types/content";

export interface PodsData {
  kpis: KpiCard[];
  pods: Pod[];
  evolution: TimeSeriesPoint[];
  partialCoverage?: boolean;
}

export interface IPodsRepository {
  getPodsData(filters: GlobalFilters): Promise<PodsData>;
}
