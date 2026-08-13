export interface TimeSeriesPoint {
  date: string; // ISO date (yyyy-MM-dd)
  value: number;
}

export interface MultiSeriesPoint {
  date: string;
  [seriesKey: string]: string | number;
}

/**
 * Resultado de uma variação percentual entre dois períodos.
 * `comparable` é false quando o período anterior é zero — nesse caso
 * a UI deve exibir "sem dado comparável" em vez de calcular a variação.
 */
export interface VariationResult {
  current: number;
  previous: number;
  comparable: boolean;
  percentChange: number | null;
  direction: "up" | "down" | "flat" | "none";
}

export interface KpiCard {
  id: string;
  label: string;
  value: number;
  formattedValue?: string;
  variation: VariationResult;
  formula?: string;
  unit?: "number" | "percent";
  partialCoverage?: boolean;
}

export type DataState = "loading" | "success" | "empty" | "error" | "partial";

export interface DeviceBreakdown {
  device: string;
  count: number;
  percent: number;
}

export interface RankingItem {
  id: string;
  name: string;
  value: number;
  secondaryValue?: number;
  variation?: VariationResult;
}
