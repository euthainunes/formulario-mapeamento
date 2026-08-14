import { appConfig } from "@/lib/app-config";
import { IEngagementRepository, EngagementData } from "@/services/contracts/engagement.contract";
import { MockEngagementRepository } from "@/services/mock/engagement.mock";
import { GlobalFilters } from "@/types/filters";
import { apiFetch, toQueryString } from "@/lib/client/api-fetch";
import { filtersToQuery } from "@/lib/client/filters-to-query";

class ApiEngagementRepository implements IEngagementRepository {
  async getEngagementData(filters: GlobalFilters): Promise<EngagementData> {
    return apiFetch<EngagementData>(`/api/engagement${toQueryString(filtersToQuery(filters))}`);
  }
}

export function getEngagementRepository(): IEngagementRepository {
  return appConfig.dataSource === "mock" ? new MockEngagementRepository() : new ApiEngagementRepository();
}
