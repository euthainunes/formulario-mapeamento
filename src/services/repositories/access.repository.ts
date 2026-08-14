import { appConfig } from "@/lib/app-config";
import { IAccessRepository, AccessData } from "@/services/contracts/access.contract";
import { MockAccessRepository } from "@/services/mock/access.mock";
import { GlobalFilters } from "@/types/filters";
import { apiFetch, toQueryString } from "@/lib/client/api-fetch";
import { filtersToQuery } from "@/lib/client/filters-to-query";

class ApiAccessRepository implements IAccessRepository {
  async getAccessData(filters: GlobalFilters): Promise<AccessData> {
    return apiFetch<AccessData>(`/api/access${toQueryString(filtersToQuery(filters))}`);
  }
}

export function getAccessRepository(): IAccessRepository {
  return appConfig.dataSource === "mock" ? new MockAccessRepository() : new ApiAccessRepository();
}
