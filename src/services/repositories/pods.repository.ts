import { appConfig } from "@/lib/app-config";
import { IPodsRepository, PodsData } from "@/services/contracts/pods.contract";
import { MockPodsRepository } from "@/services/mock/pods.mock";
import { GlobalFilters } from "@/types/filters";

class ApiPodsRepository implements IPodsRepository {
  async getPodsData(_filters: GlobalFilters): Promise<PodsData> {
    throw new Error("ApiPodsRepository não implementado — integração real ainda não disponível.");
  }
}

export function getPodsRepository(): IPodsRepository {
  return appConfig.dataSource === "mock" ? new MockPodsRepository() : new ApiPodsRepository();
}
