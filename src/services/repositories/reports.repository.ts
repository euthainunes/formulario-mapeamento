import { appConfig } from "@/lib/app-config";
import { IReportsRepository } from "@/services/contracts/reports.contract";
import { MockReportsRepository } from "@/services/mock/reports.mock";
import { ReportHistoryItem, ReportRequest } from "@/types/report";

class ApiReportsRepository implements IReportsRepository {
  async listHistory(): Promise<ReportHistoryItem[]> {
    throw new Error("ApiReportsRepository não implementado — integração real ainda não disponível.");
  }
  async generateReport(_request: ReportRequest, _createdBy: string): Promise<ReportHistoryItem> {
    throw new Error("ApiReportsRepository não implementado — integração real ainda não disponível.");
  }
  async getReportStatus(_id: string): Promise<ReportHistoryItem | undefined> {
    throw new Error("ApiReportsRepository não implementado — integração real ainda não disponível.");
  }
}

// Singleton do mock para manter o histórico em memória durante a sessão do navegador.
const mockInstance = new MockReportsRepository();

export function getReportsRepository(): IReportsRepository {
  return appConfig.dataSource === "mock" ? mockInstance : new ApiReportsRepository();
}
