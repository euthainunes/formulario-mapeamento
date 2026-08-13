import { appConfig } from "@/lib/app-config";
import { IContentRepository, ContentData } from "@/services/contracts/content.contract";
import { MockContentRepository } from "@/services/mock/content.mock";
import { GlobalFilters } from "@/types/filters";

class ApiContentRepository implements IContentRepository {
  async getContentData(_filters: GlobalFilters): Promise<ContentData> {
    throw new Error("ApiContentRepository não implementado — integração real ainda não disponível.");
  }
}

export function getContentRepository(): IContentRepository {
  return appConfig.dataSource === "mock" ? new MockContentRepository() : new ApiContentRepository();
}
