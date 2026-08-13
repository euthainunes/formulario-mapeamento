import { ReportHistoryItem } from "@/types/report";
import { REFERENCE_TODAY } from "@/lib/date-range";
import { MOCK_SYNC_STATUS } from "./sync.mock";

function daysAgoIso(d: number): string {
  const date = new Date(REFERENCE_TODAY);
  date.setDate(date.getDate() - d);
  return date.toISOString();
}

const METRIC_DEFINITIONS = [
  { metric: "Usuários ativos", definition: "Colaboradores com pelo menos 1 acesso registrado no período." },
  { metric: "Variação percentual", definition: "(valor atual − valor anterior) ÷ valor anterior × 100. Não calculada se o período anterior for zero." },
  { metric: "Taxa de engajamento", definition: "(curtidas + comentários) ÷ visualizações × 100." },
];

export const MOCK_REPORT_HISTORY: ReportHistoryItem[] = [
  {
    id: "report-1",
    name: "Relatório Executivo — Julho 2026",
    type: "executivo",
    format: "pdf",
    createdBy: "Bruna Albuquerque",
    createdAt: daysAgoIso(14),
    status: "concluido",
    finishedAt: daysAgoIso(14),
    metadata: {
      period: { from: "2026-07-01", to: "2026-07-31" },
      filtersApplied: "Empresa: todas · Departamento: todos",
      generatedAt: daysAgoIso(14),
      lastSyncConsidered: MOCK_SYNC_STATUS.lastSyncAt,
      dataSource: "Mock — Intranet BeeHome (simulado)",
      metricDefinitions: METRIC_DEFINITIONS,
    },
  },
  {
    id: "report-2",
    name: "Relatório de Audiência — Departamento Comunicação",
    type: "audiencia",
    format: "excel",
    createdBy: "Mariana Souza",
    createdAt: daysAgoIso(6),
    status: "concluido",
    finishedAt: daysAgoIso(6),
    metadata: {
      period: { from: "2026-07-15", to: "2026-08-13" },
      filtersApplied: "Departamento: Comunicação",
      generatedAt: daysAgoIso(6),
      lastSyncConsidered: MOCK_SYNC_STATUS.lastSyncAt,
      dataSource: "Mock — Intranet BeeHome (simulado)",
      metricDefinitions: METRIC_DEFINITIONS,
    },
  },
  {
    id: "report-3",
    name: "Relatório de Conteúdos — Últimos 30 dias",
    type: "conteudos",
    format: "csv",
    createdBy: "Hector Ramos",
    createdAt: daysAgoIso(2),
    status: "falha",
    finishedAt: daysAgoIso(2),
    metadata: {
      period: { from: "2026-07-14", to: "2026-08-13" },
      filtersApplied: "Empresa: todas",
      generatedAt: daysAgoIso(2),
      lastSyncConsidered: MOCK_SYNC_STATUS.lastSyncAt,
      dataSource: "Mock — Intranet BeeHome (simulado)",
      metricDefinitions: METRIC_DEFINITIONS,
    },
  },
];
