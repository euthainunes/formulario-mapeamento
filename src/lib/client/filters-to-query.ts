import { GlobalFilters } from "@/types/filters";

/** Achata GlobalFilters (formato aninhado do front-end) para o formato flat que o backend espera em GlobalFiltersDto (src/common/dto/global-filters.dto.ts). */
export function filtersToQuery(filters: GlobalFilters): Record<string, string | null | undefined> {
  return {
    period: filters.period,
    from: filters.dateRange?.from,
    to: filters.dateRange?.to,
    company: filters.company,
    department: filters.department,
    jobTitle: filters.jobTitle,
    team: filters.team,
  };
}
