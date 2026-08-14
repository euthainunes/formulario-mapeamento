import { appConfig } from "@/lib/app-config";
import { IBeezzRepository, BeezzData } from "@/services/contracts/beezz.contract";
import { MockBeezzRepository } from "@/services/mock/beezz.mock";
import { GlobalFilters } from "@/types/filters";
import { apiFetch, toQueryString } from "@/lib/client/api-fetch";
import { filtersToQuery } from "@/lib/client/filters-to-query";

class ApiBeezzRepository implements IBeezzRepository {
  async getBeezzData(filters: GlobalFilters): Promise<BeezzData> {
    return apiFetch<BeezzData>(`/api/beezz${toQueryString(filtersToQuery(filters))}`);
  }
}

export function getBeezzRepository(): IBeezzRepository {
  return appConfig.dataSource === "mock" ? new MockBeezzRepository() : new ApiBeezzRepository();
}
