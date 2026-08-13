import { appConfig } from "@/lib/app-config";
import { IAccessRepository, AccessData } from "@/services/contracts/access.contract";
import { MockAccessRepository } from "@/services/mock/access.mock";
import { GlobalFilters } from "@/types/filters";

class ApiAccessRepository implements IAccessRepository {
  async getAccessData(_filters: GlobalFilters): Promise<AccessData> {
    throw new Error("ApiAccessRepository não implementado — integração real ainda não disponível.");
  }
}

export function getAccessRepository(): IAccessRepository {
  return appConfig.dataSource === "mock" ? new MockAccessRepository() : new ApiAccessRepository();
}
