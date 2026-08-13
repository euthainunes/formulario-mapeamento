import { appConfig } from "@/lib/app-config";
import { IDirectoryRepository, DirectoryData } from "@/services/contracts/directory.contract";
import { MockDirectoryRepository } from "@/services/mock/directory.mock";
import { GlobalFilters } from "@/types/filters";

class ApiDirectoryRepository implements IDirectoryRepository {
  async getDirectory(_filters: GlobalFilters, _search: string): Promise<DirectoryData> {
    throw new Error("ApiDirectoryRepository não implementado — integração real ainda não disponível.");
  }
}

export function getDirectoryRepository(): IDirectoryRepository {
  return appConfig.dataSource === "mock" ? new MockDirectoryRepository() : new ApiDirectoryRepository();
}
