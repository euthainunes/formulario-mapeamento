export type ReportType =
  | "audiencia"
  | "acessos"
  | "conteudos"
  | "engajamento"
  | "pods"
  | "executivo";

export type ReportFormat = "pdf" | "excel" | "csv";
export type ReportStatus = "processando" | "concluido" | "falha";

export interface ReportRequest {
  type: ReportType;
  format: ReportFormat;
  dateRange: { from: string; to: string };
  filters: {
    company: string | null;
    department: string | null;
    jobTitle: string | null;
    team: string | null;
  };
}

export interface ReportHistoryItem {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  createdBy: string;
  createdAt: string;
  status: ReportStatus;
  finishedAt?: string;
  metadata: {
    period: { from: string; to: string };
    filtersApplied: string;
    generatedAt: string;
    lastSyncConsidered: string;
    dataSource: string;
    metricDefinitions: { metric: string; definition: string }[];
  };
}
