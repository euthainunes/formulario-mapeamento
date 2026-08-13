import { GlobalFilters } from "@/types/filters";
import { KpiCard, TimeSeriesPoint, DeviceBreakdown } from "@/types/metrics";
import { Collaborator } from "@/types/user";

export interface AudienceComparisonPoint {
  label: string;
  currentPeriod: number;
  previousPeriod: number;
}

export interface AudienceData {
  kpis: KpiCard[];
  activeEvolution: TimeSeriesPoint[];
  deviceBreakdown: DeviceBreakdown[];
  periodComparison: AudienceComparisonPoint[];
  collaborators: Collaborator[];
  partialCoverage?: boolean;
}

export interface IAudienceRepository {
  getAudienceData(filters: GlobalFilters): Promise<AudienceData>;
}
