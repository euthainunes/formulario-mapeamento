import { ReportHistoryItem, ReportRequest } from "@/types/report";

export interface IReportsRepository {
  listHistory(): Promise<ReportHistoryItem[]>;
  generateReport(request: ReportRequest, createdBy: string): Promise<ReportHistoryItem>;
  /** Consulta o status atual de um relatório em processamento (polling simulado). */
  getReportStatus(id: string): Promise<ReportHistoryItem | undefined>;
}
