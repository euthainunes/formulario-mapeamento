import { appConfig } from "@/lib/app-config";
import { ISyncRepository } from "@/services/contracts/sync.contract";
import { MockSyncRepository } from "@/services/mock/sync.mock";
import { SyncJob, SyncLog, SyncStatusSnapshot } from "@/types/sync";
import { apiFetch } from "@/lib/client/api-fetch";

/** Formato bruto devolvido por GET /sync/jobs (Prisma SyncJob + SyncLog, ver schema.prisma) — os campos de log não têm os mesmos nomes do tipo SyncLog do front (message/level/timestamp), por isso o adaptador abaixo. */
interface RawSyncLog {
  id: string;
  endpointAlias: string;
  startedAt: string;
  finishedAt: string | null;
  status: "sucesso" | "parcial" | "falha";
  recordsRead: number;
  recordsUpserted: number;
  errorDetail?: string | null;
}

interface RawSyncJob {
  id: string;
  source: string;
  startedAt: string;
  finishedAt: string | null;
  status: SyncJob["status"];
  recordsProcessed: number;
  logs: RawSyncLog[];
}

function logLevel(status: RawSyncLog["status"]): SyncLog["level"] {
  if (status === "falha") return "error";
  if (status === "parcial") return "warning";
  return "info";
}

function adaptJob(raw: RawSyncJob): SyncJob {
  return {
    id: raw.id,
    source: raw.source,
    startedAt: raw.startedAt,
    finishedAt: raw.finishedAt ?? "",
    status: raw.status,
    recordsProcessed: raw.recordsProcessed,
    logs: raw.logs.map((log) => ({
      id: log.id,
      message: log.errorDetail || `${log.endpointAlias}: ${log.recordsUpserted}/${log.recordsRead} registros (${log.status})`,
      level: logLevel(log.status),
      timestamp: log.startedAt,
    })),
  };
}

class ApiSyncRepository implements ISyncRepository {
  async getLatestStatus(): Promise<SyncStatusSnapshot> {
    return apiFetch<SyncStatusSnapshot>("/api/sync/status");
  }
  async listJobs(): Promise<SyncJob[]> {
    const raw = await apiFetch<RawSyncJob[]>("/api/sync/jobs");
    return raw.map(adaptJob);
  }
}

export function getSyncRepository(): ISyncRepository {
  return appConfig.dataSource === "mock" ? new MockSyncRepository() : new ApiSyncRepository();
}
