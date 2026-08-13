import { GlobalFilters } from "@/types/filters";
import { KpiCard, TimeSeriesPoint, RankingItem } from "@/types/metrics";
import { BeezzPost } from "@/types/content";

export interface BeezzData {
  kpis: KpiCard[];
  posts: BeezzPost[];
  activityTimeline: TimeSeriesPoint[];
  topLiked: RankingItem[];
  topCommented: RankingItem[];
  topCreators: RankingItem[];
  partialCoverage?: boolean;
}

export interface IBeezzRepository {
  getBeezzData(filters: GlobalFilters): Promise<BeezzData>;
}
