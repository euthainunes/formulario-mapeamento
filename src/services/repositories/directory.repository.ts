import { appConfig } from "@/lib/app-config";
import { IDirectoryRepository, DirectoryData } from "@/services/contracts/directory.contract";
import { MockDirectoryRepository } from "@/services/mock/directory.mock";
import { GlobalFilters } from "@/types/filters";
import { apiFetch, toQueryString } from "@/lib/client/api-fetch";
import { filtersToQuery } from "@/lib/client/filters-to-query";

class ApiDirectoryRepository implements IDirectoryRepository {
  async getDirectory(filters: GlobalFilters, search: string): Promise<DirectoryData> {
    return apiFetch<DirectoryData>(`/api/directory${toQueryString({ ...filtersToQuery(filters), search })}`);
  }
}

export function getDirectoryRepository(): IDirectoryRepository {
  return appConfig.dataSource === "mock" ? new MockDirectoryRepository() : new ApiDirectoryRepository();
}
