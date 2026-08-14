import { appConfig } from "@/lib/app-config";
import { IPodsRepository, PodsData } from "@/services/contracts/pods.contract";
import { MockPodsRepository } from "@/services/mock/pods.mock";
import { GlobalFilters } from "@/types/filters";
import { apiFetch, toQueryString } from "@/lib/client/api-fetch";
import { filtersToQuery } from "@/lib/client/filters-to-query";

class ApiPodsRepository implements IPodsRepository {
  async getPodsData(filters: GlobalFilters): Promise<PodsData> {
    return apiFetch<PodsData>(`/api/pods${toQueryString(filtersToQuery(filters))}`);
  }
}

export function getPodsRepository(): IPodsRepository {
  return appConfig.dataSource === "mock" ? new MockPodsRepository() : new ApiPodsRepository();
}
