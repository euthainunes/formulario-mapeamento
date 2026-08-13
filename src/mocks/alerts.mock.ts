import { Alert, AlertRule, AlertSummary } from "@/types/alert";
import { REFERENCE_TODAY } from "@/lib/date-range";

function daysAgoIso(d: number): string {
  const date = new Date(REFERENCE_TODAY);
  date.setDate(date.getDate() - d);
  return date.toISOString();
}

export const MOCK_ALERT_RULES: AlertRule[] = [
  {
    id: "rule-1",
    name: "Queda de acessos diários",
    metric: "Total de acessos",
    condition: "Queda superior a 15% comparado à média dos 7 dias anteriores",
    threshold: 15,
    severity: "warning",
    active: true,
    createdBy: "Bruna Albuquerque",
    createdAt: daysAgoIso(120),
  },
  {
    id: "rule-2",
    name: "Baixo engajamento em publicações",
    metric: "Curtidas + comentários por publicação",
    condition: "Publicação com engajamento 30% abaixo da média do mês",
    threshold: 30,
    severity: "info",
    active: true,
    createdBy: "Mariana Souza",
    createdAt: daysAgoIso(95),
  },
  {
    id: "rule-3",
    name: "Falha de sincronização",
    metric: "Status da sincronização",
    condition: "Sincronização com status 'falha' ou 'parcial'",
    threshold: 1,
    severity: "critical",
    active: true,
    createdBy: "Bruna Albuquerque",
    createdAt: daysAgoIso(150),
  },
  {
    id: "rule-4",
    name: "Pod em queda sustentada",
    metric: "Acessos ao Pod",
    condition: "Queda superior a 20% por 3 períodos consecutivos",
    threshold: 20,
    severity: "warning",
    active: false,
    createdBy: "Thainá Nunes",
    createdAt: daysAgoIso(60),
  },
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: "alert-1",
    ruleId: "rule-3",
    ruleName: "Falha de sincronização",
    title: "Sincronização falhou há 3 dias",
    description:
      "A sincronização simulada com a Intranet BeeHome apresentou status 'falha'. Nenhum dado novo foi importado nesse ciclo.",
    severity: "critical",
    status: "em_analise",
    createdAt: daysAgoIso(3),
    metric: "Status da sincronização",
    history: [
      { id: "h-1-1", status: "novo", changedBy: "Sistema", changedAt: daysAgoIso(3) },
      { id: "h-1-2", status: "em_analise", changedBy: "Bruna Albuquerque", changedAt: daysAgoIso(2) },
    ],
  },
  {
    id: "alert-2",
    ruleId: "rule-1",
    ruleName: "Queda de acessos diários",
    title: "Queda de 18% nos acessos da última semana",
    description:
      "O volume de acessos caiu 18% em relação à média dos 7 dias anteriores, ultrapassando o limite configurado.",
    severity: "warning",
    status: "novo",
    createdAt: daysAgoIso(1),
    metric: "Total de acessos",
    history: [{ id: "h-2-1", status: "novo", changedBy: "Sistema", changedAt: daysAgoIso(1) }],
  },
  {
    id: "alert-3",
    ruleId: "rule-2",
    ruleName: "Baixo engajamento em publicações",
    title: "Notícia 'Atualização da política de home office' com baixo engajamento",
    description: "O engajamento ficou 34% abaixo da média do mês para o tipo de conteúdo.",
    severity: "info",
    status: "resolvido",
    createdAt: daysAgoIso(12),
    metric: "Curtidas + comentários por publicação",
    history: [
      { id: "h-3-1", status: "novo", changedBy: "Sistema", changedAt: daysAgoIso(12) },
      { id: "h-3-2", status: "em_analise", changedBy: "Hector Ramos", changedAt: daysAgoIso(10) },
      { id: "h-3-3", status: "resolvido", changedBy: "Hector Ramos", changedAt: daysAgoIso(9), note: "Reforço de divulgação feito." },
    ],
  },
  {
    id: "alert-4",
    ruleId: "rule-1",
    ruleName: "Queda de acessos diários",
    title: "Queda de 22% observada em período anterior",
    description: "Alerta histórico de queda de acessos, já revisado pela equipe de Comunicação.",
    severity: "warning",
    status: "ignorado",
    createdAt: daysAgoIso(45),
    metric: "Total de acessos",
    history: [
      { id: "h-4-1", status: "novo", changedBy: "Sistema", changedAt: daysAgoIso(45) },
      { id: "h-4-2", status: "ignorado", changedBy: "Mariana Souza", changedAt: daysAgoIso(44), note: "Período de feriado prolongado, esperado." },
    ],
  },
];

export const MOCK_PRIORITY_ALERTS: AlertSummary[] = MOCK_ALERTS.filter(
  (a) => a.status === "novo" || a.status === "em_analise"
).map((a) => ({ id: a.id, title: a.title, severity: a.severity, createdAt: a.createdAt }));
