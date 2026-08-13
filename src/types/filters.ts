export type PeriodPreset = "7d" | "30d" | "90d" | "custom";

export interface DateRange {
  from: string; // ISO date
  to: string; // ISO date
}

export interface GlobalFilters {
  period: PeriodPreset;
  dateRange: DateRange;
  company: string | null;
  department: string | null;
  jobTitle: string | null;
  team: string | null;
}

export interface OrgOption {
  value: string;
  label: string;
}
