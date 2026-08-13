export type SyncStatus = "sucesso" | "parcial" | "falha";

export interface SyncLog {
  id: string;
  message: string;
  level: "info" | "warning" | "error";
  timestamp: string;
}

export interface SyncJob {
  id: string;
  source: string; // e.g. "Intranet BeeHome"
  startedAt: string;
  finishedAt: string;
  status: SyncStatus;
  recordsProcessed: number;
  logs: SyncLog[];
}

export interface SyncStatusSnapshot {
  lastSyncAt: string;
  status: SyncStatus;
  source: string;
}
