import { appConfig } from "@/lib/app-config";
import { IReportsRepository } from "@/services/contracts/reports.contract";
import { MockReportsRepository } from "@/services/mock/reports.mock";
import { ReportHistoryItem, ReportRequest } from "@/types/report";
import { apiFetch, ApiError } from "@/lib/client/api-fetch";

/** Formato bruto devolvido pelo backend (Prisma Report + ReportExport, ver schema.prisma) — metadataJson só é preenchido depois que o relatório termina de processar. */
interface RawReport {
  id: string;
  name: string;
  type: ReportHistoryItem["type"];
  format: ReportHistoryItem["format"];
  status: ReportHistoryItem["status"];
  createdById: string | null;
  createdAt: string;
  finishedAt: string | null;
  filtersJson: { dateRange?: { from: string; to: string }; filters?: Record<string, string | null> };
  metadataJson: ReportHistoryItem["metadata"] | null;
}

function adaptReport(raw: RawReport): ReportHistoryItem {
  return {
    id: raw.id,
    name: raw.name,
    type: raw.type,
    format: raw.format,
    createdBy: raw.createdById ?? "—",
    createdAt: raw.createdAt,
    status: raw.status,
    finishedAt: raw.finishedAt ?? undefined,
    metadata:
      raw.metadataJson ?? {
        period: raw.filtersJson?.dateRange ?? { from: "", to: "" },
        filtersApplied: JSON.stringify(raw.filtersJson?.filters ?? {}),
        generatedAt: "",
        lastSyncConsidered: "",
        dataSource: "Intranet BeeHome (via MetricSnapshot/normalizado)",
        metricDefinitions: [],
      },
  };
}

class ApiReportsRepository implements IReportsRepository {
  async listHistory(): Promise<ReportHistoryItem[]> {
    const raw = await apiFetch<RawReport[]>("/api/reports");
    return raw.map(adaptReport);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- assinatura fixa pelo contrato IReportsRepository; em modo api o autor é derivado do JWT no backend, não deste parâmetro (usado apenas pelo MockReportsRepository).
  async generateReport(request: ReportRequest, _createdBy: string): Promise<ReportHistoryItem> {
    const raw = await apiFetch<RawReport>("/api/reports", {
      method: "POST",
      body: JSON.stringify({
        type: request.type,
        format: request.format,
        from: request.dateRange.from,
        to: request.dateRange.to,
        company: request.filters.company ?? undefined,
        department: request.filters.department ?? undefined,
        jobTitle: request.filters.jobTitle ?? undefined,
        team: request.filters.team ?? undefined,
      }),
    });
    return adaptReport(raw);
  }

  async getReportStatus(id: string): Promise<ReportHistoryItem | undefined> {
    try {
      const raw = await apiFetch<RawReport>(`/api/reports/${id}/status`);
      return adaptReport(raw);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return undefined;
      throw err;
    }
  }
}

export function getReportsRepository(): IReportsRepository {
  return appConfig.dataSource === "mock" ? new MockReportsRepository() : new ApiReportsRepository();
}
