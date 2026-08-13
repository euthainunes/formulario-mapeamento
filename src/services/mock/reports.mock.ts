import { IReportsRepository } from "@/services/contracts/reports.contract";
import { ReportHistoryItem, ReportRequest, ReportType } from "@/types/report";
import { delay } from "./_shared";
import { MOCK_REPORT_HISTORY } from "@/mocks/reports.mock";
import { MOCK_SYNC_STATUS } from "@/mocks/sync.mock";

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  audiencia: "Audiência",
  acessos: "Acessos",
  conteudos: "Conteúdos",
  engajamento: "Engajamento",
  pods: "Pods",
  executivo: "Executivo",
};

const METRIC_DEFINITIONS = [
  { metric: "Usuários ativos", definition: "Colaboradores com pelo menos 1 acesso registrado no período." },
  { metric: "Variação percentual", definition: "(valor atual − valor anterior) ÷ valor anterior × 100. Não calculada se o período anterior for zero." },
  { metric: "Taxa de engajamento", definition: "(curtidas + comentários) ÷ visualizações × 100." },
];

// Estado em memória compartilhado entre chamadas — simula um histórico persistido no backend.
const historyStore: ReportHistoryItem[] = [...MOCK_REPORT_HISTORY];

export class MockReportsRepository implements IReportsRepository {
  async listHistory(): Promise<ReportHistoryItem[]> {
    return delay([...historyStore].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)));
  }

  async generateReport(request: ReportRequest, createdBy: string): Promise<ReportHistoryItem> {
    const id = `report-${Date.now()}`;
    const now = new Date().toISOString();
    const filtersLabel = [
      request.filters.company ? `Empresa: ${request.filters.company}` : null,
      request.filters.department ? `Departamento: ${request.filters.department}` : null,
      request.filters.jobTitle ? `Cargo: ${request.filters.jobTitle}` : null,
      request.filters.team ? `Time: ${request.filters.team}` : null,
    ]
      .filter(Boolean)
      .join(" · ") || "Nenhum filtro adicional aplicado";

    const item: ReportHistoryItem = {
      id,
      name: `Relatório de ${REPORT_TYPE_LABELS[request.type]} — ${request.dateRange.from} a ${request.dateRange.to}`,
      type: request.type,
      format: request.format,
      createdBy,
      createdAt: now,
      status: "processando",
      metadata: {
        period: request.dateRange,
        filtersApplied: filtersLabel,
        generatedAt: now,
        lastSyncConsidered: MOCK_SYNC_STATUS.lastSyncAt,
        dataSource: "Mock — Intranet BeeHome (simulado)",
        metricDefinitions: METRIC_DEFINITIONS,
      },
    };
    historyStore.unshift(item);

    // Simula processamento assíncrono: conclui após alguns segundos.
    setTimeout(() => {
      const stored = historyStore.find((r) => r.id === id);
      if (stored) {
        stored.status = "concluido";
        stored.finishedAt = new Date().toISOString();
      }
    }, 3500 + Math.random() * 2500);

    return delay(item, 300, 600);
  }

  async getReportStatus(id: string): Promise<ReportHistoryItem | undefined> {
    return delay(historyStore.find((r) => r.id === id), 150, 350);
  }
}
