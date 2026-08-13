import { KpiCard, RankingItem, DeviceBreakdown, MultiSeriesPoint, TimeSeriesPoint } from "./metrics";
import { AlertSummary } from "./alert";
import { InsightSummary } from "./insight";
import { SyncStatusSnapshot } from "./sync";

export interface ExecutiveDashboardData {
  kpis: KpiCard[];
  accessEvolution: TimeSeriesPoint[];
  activeUsersEvolution: TimeSeriesPoint[];
  engagementByType: MultiSeriesPoint[];
  deviceBreakdown: DeviceBreakdown[];
  topContent: RankingItem[];
  bottomContent: RankingItem[];
  topBeezz: RankingItem[];
  bottomBeezz: RankingItem[];
  topPods: RankingItem[];
  bottomPods: RankingItem[];
  priorityAlerts: AlertSummary[];
  autoInsights: InsightSummary[];
  syncStatus: SyncStatusSnapshot;
  partialCoverage?: boolean;
}
