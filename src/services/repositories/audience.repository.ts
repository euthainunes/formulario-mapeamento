import { appConfig } from "@/lib/app-config";
import { IAudienceRepository, AudienceData } from "@/services/contracts/audience.contract";
import { MockAudienceRepository } from "@/services/mock/audience.mock";
import { GlobalFilters } from "@/types/filters";
import { apiFetch, toQueryString } from "@/lib/client/api-fetch";
import { filtersToQuery } from "@/lib/client/filters-to-query";

class ApiAudienceRepository implements IAudienceRepository {
  async getAudienceData(filters: GlobalFilters): Promise<AudienceData> {
    return apiFetch<AudienceData>(`/api/audience${toQueryString(filtersToQuery(filters))}`);
  }
}

export function getAudienceRepository(): IAudienceRepository {
  return appConfig.dataSource === "mock" ? new MockAudienceRepository() : new ApiAudienceRepository();
}
