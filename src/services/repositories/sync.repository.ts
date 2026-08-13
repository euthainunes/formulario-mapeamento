import { appConfig } from "@/lib/app-config";
import { ISyncRepository } from "@/services/contracts/sync.contract";
import { MockSyncRepository } from "@/services/mock/sync.mock";
import { SyncJob, SyncStatusSnapshot } from "@/types/sync";

class ApiSyncRepository implements ISyncRepository {
  async getLatestStatus(): Promise<SyncStatusSnapshot> {
    throw new Error("ApiSyncRepository não implementado — integração real ainda não disponível.");
  }
  async listJobs(): Promise<SyncJob[]> {
    throw new Error("ApiSyncRepository não implementado — integração real ainda não disponível.");
  }
}

export function getSyncRepository(): ISyncRepository {
  return appConfig.dataSource === "mock" ? new MockSyncRepository() : new ApiSyncRepository();
}
