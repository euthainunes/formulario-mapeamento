import { ISyncRepository } from "@/services/contracts/sync.contract";
import { SyncJob, SyncStatusSnapshot } from "@/types/sync";
import { delay } from "./_shared";
import { MOCK_SYNC_JOBS, MOCK_SYNC_STATUS } from "@/mocks/sync.mock";

export class MockSyncRepository implements ISyncRepository {
  async getLatestStatus(): Promise<SyncStatusSnapshot> {
    return delay(MOCK_SYNC_STATUS, 200, 400);
  }

  async listJobs(): Promise<SyncJob[]> {
    return delay(MOCK_SYNC_JOBS);
  }
}
