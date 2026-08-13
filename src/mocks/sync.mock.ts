import { SyncJob, SyncStatusSnapshot } from "@/types/sync";
import { REFERENCE_TODAY } from "@/lib/date-range";

function hoursAgo(h: number): string {
  const d = new Date(REFERENCE_TODAY);
  d.setHours(d.getHours() - h);
  return d.toISOString();
}

export const MOCK_SYNC_JOBS: SyncJob[] = [
  {
    id: "sync-1",
    source: "Intranet BeeHome",
    startedAt: hoursAgo(2.2),
    finishedAt: hoursAgo(2),
    status: "sucesso",
    recordsProcessed: 18420,
    logs: [
      { id: "log-1-1", message: "Conexão simulada com BeeHome estabelecida", level: "info", timestamp: hoursAgo(2.2) },
      { id: "log-1-2", message: "18.420 registros importados com sucesso", level: "info", timestamp: hoursAgo(2.05) },
      { id: "log-1-3", message: "Sincronização concluída", level: "info", timestamp: hoursAgo(2) },
    ],
  },
  {
    id: "sync-2",
    source: "Intranet BeeHome",
    startedAt: hoursAgo(26.2),
    finishedAt: hoursAgo(26),
    status: "parcial",
    recordsProcessed: 15980,
    logs: [
      { id: "log-2-1", message: "Conexão simulada com BeeHome estabelecida", level: "info", timestamp: hoursAgo(26.2) },
      { id: "log-2-2", message: "Timeout parcial ao importar módulo de Beezz", level: "warning", timestamp: hoursAgo(26.1) },
      { id: "log-2-3", message: "Sincronização concluída com cobertura parcial", level: "warning", timestamp: hoursAgo(26) },
    ],
  },
  {
    id: "sync-3",
    source: "Intranet BeeHome",
    startedAt: hoursAgo(50.3),
    finishedAt: hoursAgo(50),
    status: "sucesso",
    recordsProcessed: 17650,
    logs: [
      { id: "log-3-1", message: "Conexão simulada com BeeHome estabelecida", level: "info", timestamp: hoursAgo(50.3) },
      { id: "log-3-2", message: "17.650 registros importados com sucesso", level: "info", timestamp: hoursAgo(50.1) },
      { id: "log-3-3", message: "Sincronização concluída", level: "info", timestamp: hoursAgo(50) },
    ],
  },
  {
    id: "sync-4",
    source: "Intranet BeeHome",
    startedAt: hoursAgo(74.4),
    finishedAt: hoursAgo(74.2),
    status: "falha",
    recordsProcessed: 0,
    logs: [
      { id: "log-4-1", message: "Conexão simulada com BeeHome estabelecida", level: "info", timestamp: hoursAgo(74.4) },
      { id: "log-4-2", message: "Falha simulada de autenticação com a origem", level: "error", timestamp: hoursAgo(74.3) },
      { id: "log-4-3", message: "Sincronização interrompida", level: "error", timestamp: hoursAgo(74.2) },
    ],
  },
  {
    id: "sync-5",
    source: "Intranet BeeHome",
    startedAt: hoursAgo(98.5),
    finishedAt: hoursAgo(98.2),
    status: "sucesso",
    recordsProcessed: 17210,
    logs: [
      { id: "log-5-1", message: "Conexão simulada com BeeHome estabelecida", level: "info", timestamp: hoursAgo(98.5) },
      { id: "log-5-2", message: "17.210 registros importados com sucesso", level: "info", timestamp: hoursAgo(98.3) },
      { id: "log-5-3", message: "Sincronização concluída", level: "info", timestamp: hoursAgo(98.2) },
    ],
  },
];

export const MOCK_SYNC_STATUS: SyncStatusSnapshot = {
  lastSyncAt: MOCK_SYNC_JOBS[0].finishedAt,
  status: MOCK_SYNC_JOBS[0].status,
  source: MOCK_SYNC_JOBS[0].source,
};
