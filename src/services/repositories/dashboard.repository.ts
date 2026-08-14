import { appConfig } from "@/lib/app-config";
import { IDashboardRepository } from "@/services/contracts/dashboard.contract";
import { MockDashboardRepository } from "@/services/mock/dashboard.mock";
import { GlobalFilters } from "@/types/filters";
import { ExecutiveDashboardData } from "@/types/dashboard";
import { apiFetch, toQueryString } from "@/lib/client/api-fetch";
import { filtersToQuery } from "@/lib/client/filters-to-query";

/** Chama o Route Handler /api/dashboard (BFF), que repassa autenticado para GET /analytics/dashboard no backend. */
class ApiDashboardRepository implements IDashboardRepository {
  async getExecutiveDashboard(filters: GlobalFilters): Promise<ExecutiveDashboardData> {
    return apiFetch<ExecutiveDashboardData>(`/api/dashboard${toQueryString(filtersToQuery(filters))}`);
  }
}

export function getDashboardRepository(): IDashboardRepository {
  return appConfig.dataSource === "mock" ? new MockDashboardRepository() : new ApiDashboardRepository();
}
