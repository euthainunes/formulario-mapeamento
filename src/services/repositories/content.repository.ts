import { appConfig } from "@/lib/app-config";
import { IContentRepository, ContentData } from "@/services/contracts/content.contract";
import { MockContentRepository } from "@/services/mock/content.mock";
import { GlobalFilters } from "@/types/filters";
import { apiFetch, toQueryString } from "@/lib/client/api-fetch";
import { filtersToQuery } from "@/lib/client/filters-to-query";

class ApiContentRepository implements IContentRepository {
  async getContentData(filters: GlobalFilters): Promise<ContentData> {
    return apiFetch<ContentData>(`/api/content${toQueryString(filtersToQuery(filters))}`);
  }
}

export function getContentRepository(): IContentRepository {
  return appConfig.dataSource === "mock" ? new MockContentRepository() : new ApiContentRepository();
}
