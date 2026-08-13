import { appConfig } from "@/lib/app-config";
import { IAudienceRepository, AudienceData } from "@/services/contracts/audience.contract";
import { MockAudienceRepository } from "@/services/mock/audience.mock";
import { GlobalFilters } from "@/types/filters";

class ApiAudienceRepository implements IAudienceRepository {
  async getAudienceData(_filters: GlobalFilters): Promise<AudienceData> {
    throw new Error("ApiAudienceRepository não implementado — integração real ainda não disponível.");
  }
}

export function getAudienceRepository(): IAudienceRepository {
  return appConfig.dataSource === "mock" ? new MockAudienceRepository() : new ApiAudienceRepository();
}
