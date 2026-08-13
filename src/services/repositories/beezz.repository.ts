import { appConfig } from "@/lib/app-config";
import { IBeezzRepository, BeezzData } from "@/services/contracts/beezz.contract";
import { MockBeezzRepository } from "@/services/mock/beezz.mock";
import { GlobalFilters } from "@/types/filters";

class ApiBeezzRepository implements IBeezzRepository {
  async getBeezzData(_filters: GlobalFilters): Promise<BeezzData> {
    throw new Error("ApiBeezzRepository não implementado — integração real ainda não disponível.");
  }
}

export function getBeezzRepository(): IBeezzRepository {
  return appConfig.dataSource === "mock" ? new MockBeezzRepository() : new ApiBeezzRepository();
}
