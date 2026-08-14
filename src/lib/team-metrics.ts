import { addDays, differenceInCalendarDays, differenceInHours, subWeeks, startOfWeek } from "date-fns";
import {
  TeamTask,
  TeamCampaign,
  TeamMeeting,
  TeamDocument,
  OperationScoreBreakdown,
  OperationScoreDimension,
  OperationScoreLabel,
} from "@/types/team-management";
import { COMMUNICATION_TEAM } from "@/mocks/team.mock";
import { MultiSeriesPoint } from "@/types/metrics";

/**
 * Motor de métricas do módulo "Gestão do Time". Todas as funções são puras
 * (recebem os dados + uma data de referência) e nunca dividem por zero —
 * quando não há denominador válido, retornam `null` explicitamente em vez
 * de fingir "0", seguindo o mesmo cuidado de src/lib/metrics.ts
 * (calcVariation com `comparable:false`).
 *
 * REGRA DE NEGÓCIO DURA: nada aqui rankeia ou avalia produtividade
 * individual. "Carga por responsável" é sempre contexto de distribuição de
 * demanda entre a equipe — nunca desempenho.
 */

// ---------------------------------------------------------------------------
// Constantes documentadas (provisórias — a calibrar com o time depois)
// ---------------------------------------------------------------------------

/** Capacidade produtiva semanal do time, em horas — número fixo configurável, não medido. */
export const WEEKLY_CAPACITY_HOURS = 120;
/** Esforço padrão estimado por tarefa quando não há esforço real informado (o Planner não modela isso nativamente). */
export const DEFAULT_TASK_EFFORT_HOURS = 4;
/** Tarefa aberta é considerada "parada" quando não é alterada há mais de N dias. */
export const STALE_TASK_DAYS = 7;
/** Tarefa aberta sem responsável é considerada crítica quando criada há mais de N horas. */
export const UNASSIGNED_ALERT_HOURS = 72;
/** Janela de "vencimento crítico iminente" usada nos alertas e no KPI de tarefas críticas. */
export const CRITICAL_DUE_HOURS = 48;
/** Documento é considerado desatualizado quando não é alterado há mais de N dias (e a campanha ainda está ativa). */
export const DOCUMENT_STALE_DAYS = 45;

export const TEAM_METRIC_FORMULAS: Record<string, string> = {
  completionRate: "tarefas concluídas no período ÷ (tarefas concluídas + tarefas abertas com prazo vencido) × 100",
  onTimeRate: "tarefas concluídas até a data de prazo ÷ tarefas concluídas com prazo definido × 100",
  lateRate: "tarefas abertas com prazo vencido ÷ tarefas abertas com prazo definido × 100",
  backlogAging: "média de (data de referência − data de criação) das tarefas ainda abertas, em dias",
  leadTime: "média de (data de conclusão − data de criação) das tarefas concluídas, em dias",
  cycleTime: "média de (data de conclusão − data de início) das tarefas concluídas, em dias",
  workload: "tarefas abertas atribuídas à pessoa (dividido igualmente entre corresponsáveis quando há mais de um responsável)",
  concentration: "maior carga individual ÷ carga total do time",
  balanceIndex: "1 − (desvio padrão da carga ÷ maior desvio padrão possível), normalizado entre 0 e 1",
  campaignProgress: "média do percentual de conclusão das tarefas vinculadas à campanha",
  campaignRisk:
    "0,30 × proximidade do prazo + 0,25 × progresso insuficiente + 0,20 × tarefas bloqueadas + 0,15 × concentração de responsável + 0,10 × atraso histórico da campanha",
  documentHealth: "campanhas com pelo menos 1 documento vinculado ÷ total de campanhas ativas × 100",
  agendaDensity: "horas em reunião no período ÷ (capacidade semanal do time × número de semanas do período) × 100",
  capacityVsDemand: "esforço estimado das tarefas abertas (4h por tarefa, padrão) ÷ capacidade produtiva semanal do time",
};

// ---------------------------------------------------------------------------
// Utilitários internos
// ---------------------------------------------------------------------------

function isOpen(task: TeamTask): boolean {
  return task.completedDateTime == null;
}

function hasDueDate(task: TeamTask): task is TeamTask & { dueDateTime: string } {
  return task.dueDateTime != null;
}

function isOverdue(task: TeamTask, referenceDate: Date): boolean {
  return isOpen(task) && hasDueDate(task) && new Date(task.dueDateTime) < referenceDate;
}

// ---------------------------------------------------------------------------
// Fluxo / backlog
// ---------------------------------------------------------------------------

export function activeBacklogCount(tasks: TeamTask[]): number {
  return tasks.filter(isOpen).length;
}

export function tasksEnteredInPeriod(tasks: TeamTask[], fromIso: string, toIso: string): number {
  return tasks.filter((t) => t.createdDateTime >= fromIso && t.createdDateTime <= toIso).length;
}

export function tasksDeliveredInPeriod(tasks: TeamTask[], fromIso: string, toIso: string): number {
  return tasks.filter((t) => t.completedDateTime != null && t.completedDateTime >= fromIso && t.completedDateTime <= toIso).length;
}

export interface RateResult {
  rate: number | null; // 0-100, null quando não há denominador válido
  numerator: number;
  denominator: number;
}

/** Cumprimento de prazo: das tarefas concluídas com prazo definido, quantas foram entregues até o prazo. */
export function onTimeRate(tasks: TeamTask[]): RateResult {
  const withDueCompleted = tasks.filter((t) => t.completedDateTime != null && t.dueDateTime != null);
  if (withDueCompleted.length === 0) return { rate: null, numerator: 0, denominator: 0 };
  const onTime = withDueCompleted.filter((t) => new Date(t.completedDateTime!) <= new Date(t.dueDateTime!)).length;
  return { rate: (onTime / withDueCompleted.length) * 100, numerator: onTime, denominator: withDueCompleted.length };
}

/** Taxa de atraso: das tarefas abertas com prazo definido, quantas já venceram. */
export function lateRate(tasks: TeamTask[], referenceDate: Date): RateResult {
  const openWithDue = tasks.filter((t) => isOpen(t) && t.dueDateTime != null);
  if (openWithDue.length === 0) return { rate: null, numerator: 0, denominator: 0 };
  const late = openWithDue.filter((t) => new Date(t.dueDateTime!) < referenceDate).length;
  return { rate: (late / openWithDue.length) * 100, numerator: late, denominator: openWithDue.length };
}

export function overdueTasks(tasks: TeamTask[], referenceDate: Date): TeamTask[] {
  return tasks.filter((t) => isOverdue(t, referenceDate));
}

export function criticalDueSoonTasks(tasks: TeamTask[], referenceDate: Date, withinHours = CRITICAL_DUE_HOURS): TeamTask[] {
  return tasks.filter((t) => {
    if (!isOpen(t) || !t.dueDateTime) return false;
    const hours = differenceInHours(new Date(t.dueDateTime), referenceDate);
    return hours >= 0 && hours <= withinHours;
  });
}

export function unassignedOpenTasks(tasks: TeamTask[]): TeamTask[] {
  return tasks.filter((t) => isOpen(t) && t.assigneeNames.length === 0);
}

export interface TaskRiskFlags {
  isOverdue: boolean;
  isUnassigned: boolean;
  isBlocked: boolean;
  isDueSoon: boolean;
  isStale: boolean;
}

/** Flags de risco de uma única tarefa, calculadas a partir das mesmas regras usadas nos KPIs/alertas. */
export function taskRiskFlags(task: TeamTask, referenceDate: Date): TaskRiskFlags {
  const overdue = isOverdue(task, referenceDate);
  const dueSoon =
    !overdue && isOpen(task) && task.dueDateTime != null && (() => {
      const hours = differenceInHours(new Date(task.dueDateTime!), referenceDate);
      return hours >= 0 && hours <= CRITICAL_DUE_HOURS;
    })();
  return {
    isOverdue: overdue,
    isUnassigned: isOpen(task) && task.assigneeNames.length === 0,
    isBlocked: task.isBlocked,
    isDueSoon: dueSoon,
    isStale: isOpen(task) && differenceInCalendarDays(referenceDate, new Date(task.lastModifiedDateTime)) > STALE_TASK_DAYS,
  };
}

/** Tarefas sem responsável há mais de N horas (padrão 72h) — usado no alerta crítico de governança. */
export function longUnassignedTasks(tasks: TeamTask[], referenceDate: Date, hours = UNASSIGNED_ALERT_HOURS): TeamTask[] {
  return unassignedOpenTasks(tasks).filter((t) => differenceInHours(referenceDate, new Date(t.createdDateTime)) > hours);
}

/** Tarefas abertas sem alteração há mais de N dias (padrão 7) — "paradas". */
export function staleTasks(tasks: TeamTask[], referenceDate: Date, days = STALE_TASK_DAYS): TeamTask[] {
  return tasks.filter((t) => isOpen(t) && differenceInCalendarDays(referenceDate, new Date(t.lastModifiedDateTime)) > days);
}

/** Aging médio do backlog: média de dias desde a criação das tarefas ainda abertas. */
export function averageBacklogAgingDays(tasks: TeamTask[], referenceDate: Date): number | null {
  const open = tasks.filter(isOpen);
  if (open.length === 0) return null;
  const totalDays = open.reduce((acc, t) => acc + differenceInCalendarDays(referenceDate, new Date(t.createdDateTime)), 0);
  return totalDays / open.length;
}

/** Lead time médio (criação → conclusão) das tarefas concluídas, em dias. */
export function averageLeadTimeDays(tasks: TeamTask[]): number | null {
  const completed = tasks.filter((t) => t.completedDateTime != null);
  if (completed.length === 0) return null;
  const total = completed.reduce(
    (acc, t) => acc + differenceInCalendarDays(new Date(t.completedDateTime!), new Date(t.createdDateTime)),
    0
  );
  return total / completed.length;
}

/** Cycle time médio (início → conclusão) das tarefas concluídas, em dias. Usa createdDateTime quando não há startDateTime. */
export function averageCycleTimeDays(tasks: TeamTask[]): number | null {
  const completed = tasks.filter((t) => t.completedDateTime != null);
  if (completed.length === 0) return null;
  const total = completed.reduce((acc, t) => {
    const start = new Date(t.startDateTime ?? t.createdDateTime);
    return acc + differenceInCalendarDays(new Date(t.completedDateTime!), start);
  }, 0);
  return total / completed.length;
}

/** Entradas x entregas por semana, para o gráfico de tendência (últimas `weeks` semanas até a data de referência). */
export function entriesAndDeliveriesByWeek(tasks: TeamTask[], referenceDate: Date, weeks = 8): MultiSeriesPoint[] {
  const points: MultiSeriesPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(referenceDate, i), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const fromIso = weekStart.toISOString().slice(0, 10);
    const toIso = weekEnd.toISOString().slice(0, 10);
    points.push({
      date: fromIso,
      entradas: tasksEnteredInPeriod(tasks, fromIso, `${toIso}T23:59:59`),
      entregas: tasksDeliveredInPeriod(tasks, fromIso, `${toIso}T23:59:59`),
    });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Carga por responsável (SEMPRE distribuição de demanda, nunca desempenho)
// ---------------------------------------------------------------------------

export const WORKLOAD_POLICY_NOTICE =
  "Estes números mostram distribuição de demanda entre a equipe, nunca avaliação de desempenho individual.";

export interface WorkloadEntry {
  name: string;
  openTaskLoad: number; // fracionado (tarefas com múltiplos responsáveis dividem igualmente)
  openTaskCount: number; // contagem inteira de tarefas em que a pessoa aparece
}

/** Carga por responsável: tarefas abertas por pessoa, dividindo igualmente entre corresponsáveis. Inclui todo o time, mesmo com carga zero. */
export function workloadByAssignee(tasks: TeamTask[]): WorkloadEntry[] {
  const load = new Map<string, number>();
  const count = new Map<string, number>();
  for (const member of COMMUNICATION_TEAM) {
    load.set(member.name, 0);
    count.set(member.name, 0);
  }
  for (const task of tasks) {
    if (!isOpen(task) || task.assigneeNames.length === 0) continue;
    const share = 1 / task.assigneeNames.length;
    for (const name of task.assigneeNames) {
      load.set(name, (load.get(name) ?? 0) + share);
      count.set(name, (count.get(name) ?? 0) + 1);
    }
  }
  return COMMUNICATION_TEAM.map((member) => ({
    name: member.name,
    openTaskLoad: load.get(member.name) ?? 0,
    openTaskCount: count.get(member.name) ?? 0,
  }));
}

/** Concentração de carga: maior carga individual ÷ carga total do time. Retorna null se não houver carga alguma. */
export function loadConcentration(workload: WorkloadEntry[]): number | null {
  const total = workload.reduce((acc, w) => acc + w.openTaskLoad, 0);
  if (total === 0) return null;
  const max = Math.max(...workload.map((w) => w.openTaskLoad));
  return max / total;
}

/** Índice de equilíbrio: 1 − desvio padrão normalizado da carga (1 = distribuição perfeitamente equilibrada). */
export function balanceIndex(workload: WorkloadEntry[]): number | null {
  if (workload.length === 0) return null;
  const total = workload.reduce((acc, w) => acc + w.openTaskLoad, 0);
  if (total === 0) return null;
  const mean = total / workload.length;
  if (mean === 0) return null;
  const variance = workload.reduce((acc, w) => acc + (w.openTaskLoad - mean) ** 2, 0) / workload.length;
  const stdDev = Math.sqrt(variance);
  // Maior desvio-padrão possível para este N e esta soma total: um único membro concentra tudo, os demais ficam com zero.
  const maxStdDev = Math.sqrt(((total - mean) ** 2 + (workload.length - 1) * mean ** 2) / workload.length);
  if (maxStdDev === 0) return 1;
  return Math.max(0, 1 - stdDev / maxStdDev);
}

// ---------------------------------------------------------------------------
// Campanhas
// ---------------------------------------------------------------------------

export function tasksForCampaign(tasks: TeamTask[], campaignId: string): TeamTask[] {
  return tasks.filter((t) => t.campaignId === campaignId);
}

/** Progresso ponderado da campanha: média simples do percentComplete das suas tarefas (simplificação documentada — sem pesos por prioridade/esforço real). */
export function weightedCampaignProgress(campaignTasks: TeamTask[]): number | null {
  if (campaignTasks.length === 0) return null;
  return campaignTasks.reduce((acc, t) => acc + t.percentComplete, 0) / campaignTasks.length;
}

export function lateTasksForCampaign(campaignTasks: TeamTask[], referenceDate: Date): RateResult {
  const withDue = campaignTasks.filter((t) => isOpen(t) && t.dueDateTime != null);
  if (withDue.length === 0) return { rate: null, numerator: 0, denominator: 0 };
  const late = withDue.filter((t) => new Date(t.dueDateTime!) < referenceDate).length;
  return { rate: (late / withDue.length) * 100, numerator: late, denominator: withDue.length };
}

export interface CampaignRiskResult {
  score: number; // 0-100, quanto maior mais arriscado
  signals: string[];
}

/**
 * Score de risco de campanha (0-100, quanto maior mais risco). Pesos
 * documentados conforme especificação: 0,30 proximidade do prazo + 0,25
 * progresso insuficiente + 0,20 tarefas bloqueadas + 0,15 concentração de
 * responsável na campanha + 0,10 histórico simplificado (aqui, taxa de
 * atraso já observada na campanha — não temos histórico real de outras
 * edições da campanha). Pesos provisórios, a calibrar com o time depois.
 */
export function campaignRiskScore(
  campaign: TeamCampaign,
  campaignTasks: TeamTask[],
  referenceDate: Date
): CampaignRiskResult {
  const signals: string[] = [];

  // Proximidade do prazo (0 = prazo distante ou já concluída, 1 = vencido/muito próximo)
  const daysToTarget = differenceInCalendarDays(new Date(campaign.targetDate), referenceDate);
  const isDone = campaign.status === "concluida" || campaign.status === "cancelada";
  let proximity = 0;
  if (!isDone) {
    if (daysToTarget <= 0) proximity = 1;
    else if (daysToTarget <= 30) proximity = 1 - daysToTarget / 30;
    if (proximity >= 0.7) signals.push(`Prazo final em ${Math.max(daysToTarget, 0)} dia(s)`);
  }

  // Progresso insuficiente frente ao tempo já decorrido do período da campanha
  const progress = weightedCampaignProgress(campaignTasks) ?? 0;
  const totalSpan = Math.max(1, differenceInCalendarDays(new Date(campaign.targetDate), new Date(campaign.startDate)));
  const elapsed = Math.min(1, Math.max(0, differenceInCalendarDays(referenceDate, new Date(campaign.startDate)) / totalSpan));
  const expectedProgress = elapsed * 100;
  const progressGap = isDone ? 0 : Math.max(0, Math.min(1, (expectedProgress - progress) / 100));
  if (progressGap >= 0.25) signals.push(`Progresso de ${Math.round(progress)}% frente a um esperado de ~${Math.round(expectedProgress)}% do prazo decorrido`);

  // Tarefas bloqueadas
  const openTasks = campaignTasks.filter(isOpen);
  const blockedCount = openTasks.filter((t) => t.isBlocked).length;
  const blockedRatio = openTasks.length > 0 ? blockedCount / openTasks.length : 0;
  if (blockedCount > 0) signals.push(`${blockedCount} tarefa(s) bloqueada(s) de ${openTasks.length} em aberto`);

  // Concentração de responsável dentro da campanha (mesma fórmula da carga do time, aplicada só às tarefas desta campanha)
  const campaignWorkload = workloadByAssignee(openTasks).filter((w) => w.openTaskLoad > 0);
  const campaignConcentration = loadConcentration(campaignWorkload) ?? 0;
  if (campaignConcentration >= 0.6 && campaignWorkload.length > 1) {
    signals.push(`Concentração de responsável na campanha: ${Math.round(campaignConcentration * 100)}% da carga aberta`);
  }

  // "Histórico" simplificado: taxa de atraso já observada nas tarefas da campanha
  const late = lateTasksForCampaign(campaignTasks, referenceDate);
  const lateRatio = (late.rate ?? 0) / 100;
  if ((late.rate ?? 0) >= 30) signals.push(`${late.numerator} de ${late.denominator} tarefa(s) com prazo já vencido`);

  const score = isDone
    ? 0
    : Math.round((0.3 * proximity + 0.25 * progressGap + 0.2 * blockedRatio + 0.15 * campaignConcentration + 0.1 * lateRatio) * 100);

  if (signals.length === 0) signals.push("Nenhum sinal de risco relevante identificado no momento.");

  return { score: Math.max(0, Math.min(100, score)), signals };
}

export type DocumentHealthLevel = "alta" | "media" | "baixa";

export interface DocumentHealthResult {
  level: DocumentHealthLevel;
  documentCount: number;
  reason: string;
}

/** Saúde documental da campanha: regra simples — campanha ativa em Produção/Aprovação sem nenhum documento vinculado = saúde baixa. */
export function documentHealthForCampaign(
  campaign: TeamCampaign,
  campaignTasks: TeamTask[],
  campaignDocuments: TeamDocument[],
  bucketNameById: (bucketId: string) => string | undefined
): DocumentHealthResult {
  const documentCount = campaignDocuments.length;
  const isActive = campaign.status === "planejamento" || campaign.status === "em_andamento";
  const inProducaoOuAprovacao = campaignTasks.some((t) => {
    const bucketName = bucketNameById(t.bucketId);
    return isOpen(t) && (bucketName === "Produção" || bucketName === "Aprovação");
  });

  if (isActive && inProducaoOuAprovacao && documentCount === 0) {
    return { level: "baixa", documentCount, reason: "Campanha em Produção/Aprovação sem nenhum documento vinculado." };
  }
  if (documentCount === 0) {
    return { level: "media", documentCount, reason: "Nenhum documento vinculado ainda." };
  }
  const staleCount = campaignDocuments.filter((d) => d.isStale).length;
  if (staleCount > 0 && staleCount >= documentCount / 2) {
    return { level: "media", documentCount, reason: `${staleCount} de ${documentCount} documento(s) desatualizado(s).` };
  }
  return { level: "alta", documentCount, reason: `${documentCount} documento(s) vinculado(s), atualizados.` };
}

/** Cobertura documental: campanhas com pelo menos 1 documento ÷ total de campanhas. */
export function documentCoverageRate(campaigns: TeamCampaign[], documents: TeamDocument[]): RateResult {
  if (campaigns.length === 0) return { rate: null, numerator: 0, denominator: 0 };
  const withDocs = campaigns.filter((c) => documents.some((d) => d.campaignId === c.id)).length;
  return { rate: (withDocs / campaigns.length) * 100, numerator: withDocs, denominator: campaigns.length };
}

// ---------------------------------------------------------------------------
// Agenda institucional
// ---------------------------------------------------------------------------

function meetingHours(meeting: TeamMeeting): number {
  return (new Date(meeting.end).getTime() - new Date(meeting.start).getTime()) / (1000 * 60 * 60);
}

export function meetingsInPeriod(meetings: TeamMeeting[], fromIso: string, toIso: string): TeamMeeting[] {
  return meetings.filter((m) => !m.isCancelled && m.start >= fromIso && m.start <= toIso);
}

/** Horas de reunião da área no período (calendário compartilhado, exclui reuniões canceladas). */
export function meetingHoursInPeriod(meetings: TeamMeeting[], fromIso: string, toIso: string): number {
  return meetingsInPeriod(meetings, fromIso, toIso).reduce((acc, m) => acc + meetingHours(m), 0);
}

export function meetingsPerWeek(meetings: TeamMeeting[], fromIso: string, toIso: string): number | null {
  const days = differenceInCalendarDays(new Date(toIso), new Date(fromIso)) + 1;
  const weeks = days / 7;
  if (weeks <= 0) return null;
  return meetingsInPeriod(meetings, fromIso, toIso).length / weeks;
}

/** Densidade de agenda: horas em reunião ÷ (capacidade semanal do time × nº de semanas do período), em percentual. */
export function agendaDensity(hoursInPeriod: number, periodWeeks: number, capacityHoursPerWeek = WEEKLY_CAPACITY_HOURS): number | null {
  if (periodWeeks <= 0) return null;
  return (hoursInPeriod / (capacityHoursPerWeek * periodWeeks)) * 100;
}

// ---------------------------------------------------------------------------
// Capacidade vs demanda
// ---------------------------------------------------------------------------

export interface CapacityResult {
  demandHours: number;
  capacityHours: number;
  ratio: number; // demanda ÷ capacidade
}

/** Capacidade vs demanda: soma do esforço estimado (4h/tarefa, padrão) das tarefas abertas frente à capacidade semanal do time. */
export function capacityVsDemand(tasks: TeamTask[], capacityHoursPerWeek = WEEKLY_CAPACITY_HOURS): CapacityResult {
  const demandHours = activeBacklogCount(tasks) * DEFAULT_TASK_EFFORT_HOURS;
  return { demandHours, capacityHours: capacityHoursPerWeek, ratio: demandHours / capacityHoursPerWeek };
}

// ---------------------------------------------------------------------------
// Score operacional (7 dimensões)
// ---------------------------------------------------------------------------

/**
 * Pesos das 7 dimensões do score operacional — PROVISÓRIOS, a calibrar com
 * o time de Comunicação depois de um período de observação real. Somam 1.
 */
export const OPERATION_SCORE_WEIGHTS = {
  confiabilidade: 0.2,
  fluxo: 0.15,
  capacidade: 0.15,
  saudeDeProjetos: 0.2,
  governanca: 0.1,
  prontidaoDocumental: 0.1,
  agendaOperacional: 0.1,
} as const;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function scoreLabel(score: number): OperationScoreLabel {
  if (score >= 80) return "Saudável";
  if (score >= 60) return "Atenção";
  return "Crítico";
}

export function computeOperationScore(
  tasks: TeamTask[],
  campaigns: TeamCampaign[],
  meetings: TeamMeeting[],
  documents: TeamDocument[],
  referenceDate: Date
): OperationScoreBreakdown {
  const dimensions: OperationScoreDimension[] = [];

  // 1. Confiabilidade — cumprimento de prazo e taxa de atraso atual
  const onTime = onTimeRate(tasks);
  const late = lateRate(tasks, referenceDate);
  const confiabilidadeScore = clamp(
    0.6 * (onTime.rate ?? 70) + 0.4 * (100 - (late.rate ?? 20))
  );
  dimensions.push({
    key: "confiabilidade",
    label: "Confiabilidade",
    score: Math.round(confiabilidadeScore),
    weight: OPERATION_SCORE_WEIGHTS.confiabilidade,
    explanation: "Mede se o time entrega dentro do prazo combinado.",
    signals: [
      onTime.rate != null
        ? `Cumprimento de prazo: ${Math.round(onTime.rate)}% (${onTime.numerator} de ${onTime.denominator} tarefas concluídas no prazo)`
        : "Sem tarefas concluídas com prazo definido para calcular cumprimento de prazo ainda.",
      late.rate != null
        ? `${late.numerator} de ${late.denominator} tarefas abertas com prazo já estão vencidas (${Math.round(late.rate)}%)`
        : "Nenhuma tarefa aberta com prazo definido no momento.",
    ],
  });

  // 2. Fluxo — equilíbrio entrada/saída das últimas semanas e lead time
  const weekly = entriesAndDeliveriesByWeek(tasks, referenceDate, 8);
  const totalEntradas = weekly.reduce((acc, w) => acc + (Number(w.entradas) || 0), 0);
  const totalEntregas = weekly.reduce((acc, w) => acc + (Number(w.entregas) || 0), 0);
  const flowGap = Math.max(totalEntradas, totalEntregas) > 0 ? Math.abs(totalEntradas - totalEntregas) / Math.max(totalEntradas, totalEntregas) : 0;
  const leadTime = averageLeadTimeDays(tasks);
  const fluxoScore = clamp(100 - flowGap * 100 * 0.7 - (leadTime != null ? Math.max(0, leadTime - 10) * 1.5 : 0));
  dimensions.push({
    key: "fluxo",
    label: "Fluxo",
    score: Math.round(fluxoScore),
    weight: OPERATION_SCORE_WEIGHTS.fluxo,
    explanation: "Mede o equilíbrio entre novas demandas e entregas nas últimas 8 semanas.",
    signals: [
      `Entradas: ${totalEntradas}, entregas: ${totalEntregas} nas últimas 8 semanas`,
      leadTime != null ? `Lead time médio das tarefas concluídas: ${leadTime.toFixed(1)} dias` : "Ainda sem tarefas concluídas suficientes para calcular lead time.",
    ],
  });

  // 3. Capacidade — demanda estimada das tarefas abertas vs capacidade semanal
  const capacity = capacityVsDemand(tasks);
  const unassignedCount = unassignedOpenTasks(tasks).length;
  const capacidadeScore = clamp(100 - Math.max(0, capacity.ratio - 1) * 100 - unassignedCount * 3);
  dimensions.push({
    key: "capacidade",
    label: "Capacidade",
    score: Math.round(capacidadeScore),
    weight: OPERATION_SCORE_WEIGHTS.capacidade,
    explanation: "Compara a demanda estimada das tarefas abertas com a capacidade produtiva semanal do time.",
    signals: [
      `Demanda estimada: ${capacity.demandHours}h vs. capacidade de ${capacity.capacityHours}h/semana (${Math.round(capacity.ratio * 100)}%)`,
      `${unassignedCount} tarefa(s) aberta(s) sem responsável definido`,
    ],
  });

  // 4. Saúde de Projetos — média de (100 - risco) das campanhas ativas
  const activeCampaigns = campaigns.filter((c) => c.status === "planejamento" || c.status === "em_andamento");
  const risks = activeCampaigns.map((c) => campaignRiskScore(c, tasksForCampaign(tasks, c.id), referenceDate));
  const avgRisk = risks.length > 0 ? risks.reduce((acc, r) => acc + r.score, 0) / risks.length : 20;
  const highRiskCount = risks.filter((r) => r.score >= 60).length;
  const saudeScore = clamp(100 - avgRisk);
  dimensions.push({
    key: "saudeDeProjetos",
    label: "Saúde de Projetos",
    score: Math.round(saudeScore),
    weight: OPERATION_SCORE_WEIGHTS.saudeDeProjetos,
    explanation: "Combina o score de risco de todas as campanhas ativas no momento.",
    signals: [
      `${highRiskCount} de ${activeCampaigns.length} campanha(s) ativa(s) em risco alto (score ≥ 60)`,
      `Score de risco médio das campanhas ativas: ${Math.round(avgRisk)}/100`,
    ],
  });

  // 5. Governança — tarefas sem responsável, bloqueadas e paradas
  const openTasks = tasks.filter(isOpen);
  const unassignedRatio = openTasks.length > 0 ? unassignedOpenTasks(tasks).length / openTasks.length : 0;
  const blockedRatio = openTasks.length > 0 ? openTasks.filter((t) => t.isBlocked).length / openTasks.length : 0;
  const staleRatio = openTasks.length > 0 ? staleTasks(tasks, referenceDate).length / openTasks.length : 0;
  const governancaScore = clamp(100 - (unassignedRatio * 40 + blockedRatio * 30 + staleRatio * 30) * 100);
  dimensions.push({
    key: "governanca",
    label: "Governança",
    score: Math.round(governancaScore),
    weight: OPERATION_SCORE_WEIGHTS.governanca,
    explanation: "Mede a saúde operacional das tarefas: responsabilidade definida, sem bloqueios acumulados e com atualização recente.",
    signals: [
      `${unassignedOpenTasks(tasks).length} de ${openTasks.length} tarefas abertas sem responsável`,
      `${staleTasks(tasks, referenceDate).length} tarefa(s) parada(s) há mais de ${STALE_TASK_DAYS} dias`,
    ],
  });

  // 6. Prontidão Documental — cobertura + documentos desatualizados
  const coverage = documentCoverageRate(campaigns, documents);
  const staleDocs = documents.filter((d) => d.isStale).length;
  const staleDocRatio = documents.length > 0 ? staleDocs / documents.length : 0;
  const prontidaoScore = clamp((coverage.rate ?? 50) * 0.7 + (100 - staleDocRatio * 100) * 0.3);
  dimensions.push({
    key: "prontidaoDocumental",
    label: "Prontidão Documental",
    score: Math.round(prontidaoScore),
    weight: OPERATION_SCORE_WEIGHTS.prontidaoDocumental,
    explanation: "Mede se as campanhas têm a documentação de referência esperada e atualizada no SharePoint.",
    signals: [
      coverage.rate != null
        ? `Cobertura documental: ${Math.round(coverage.rate)}% das campanhas (${coverage.numerator} de ${coverage.denominator}) com pelo menos 1 documento`
        : "Sem campanhas para calcular cobertura documental.",
      `${staleDocs} de ${documents.length} documento(s) desatualizado(s) (sem alteração há mais de ${DOCUMENT_STALE_DAYS} dias)`,
    ],
  });

  // 7. Agenda Operacional — densidade de agenda nas últimas 2 semanas, numa faixa saudável de 15%-35% da capacidade
  const twoWeeksAgo = addDays(referenceDate, -14).toISOString();
  const nowIso = referenceDate.toISOString();
  const recentHours = meetingHoursInPeriod(meetings, twoWeeksAgo, nowIso);
  const density = agendaDensity(recentHours, 2) ?? 0;
  const idealMid = 25; // meio da faixa saudável (15%-35% da capacidade em reunião)
  const agendaScore = clamp(100 - Math.abs(density - idealMid) * 2);
  dimensions.push({
    key: "agendaOperacional",
    label: "Agenda Operacional",
    score: Math.round(agendaScore),
    weight: OPERATION_SCORE_WEIGHTS.agendaOperacional,
    explanation: "Verifica se o tempo em reunião da área está numa faixa saudável — nem sobrecarregado, nem sem alinhamento.",
    signals: [
      `${recentHours.toFixed(1)}h em reunião nas últimas 2 semanas (${Math.round(density)}% da capacidade do time)`,
      `${meetingsInPeriod(meetings, twoWeeksAgo, nowIso).length} reunião(ões) no calendário institucional no período`,
    ],
  });

  const overallScore = Math.round(
    dimensions.reduce((acc, d) => acc + d.score * d.weight, 0)
  );

  return { overallScore, label: scoreLabel(overallScore), dimensions };
}
