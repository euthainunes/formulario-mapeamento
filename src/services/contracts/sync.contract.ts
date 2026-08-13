import { SyncJob, SyncStatusSnapshot } from "@/types/sync";

export interface ISyncRepository {
  getLatestStatus(): Promise<SyncStatusSnapshot>;
  listJobs(): Promise<SyncJob[]>;
}
