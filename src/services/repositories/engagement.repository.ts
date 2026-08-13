import { appConfig } from "@/lib/app-config";
import { IEngagementRepository, EngagementData } from "@/services/contracts/engagement.contract";
import { MockEngagementRepository } from "@/services/mock/engagement.mock";
import { GlobalFilters } from "@/types/filters";

class ApiEngagementRepository implements IEngagementRepository {
  async getEngagementData(_filters: GlobalFilters): Promise<EngagementData> {
    throw new Error("ApiEngagementRepository não implementado — integração real ainda não disponível.");
  }
}

export function getEngagementRepository(): IEngagementRepository {
  return appConfig.dataSource === "mock" ? new MockEngagementRepository() : new ApiEngagementRepository();
}
