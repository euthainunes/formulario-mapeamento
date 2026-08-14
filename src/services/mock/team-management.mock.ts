import { addDays, differenceInCalendarDays } from "date-fns";
import {
  ITeamManagementRepository,
  TeamOverviewData,
  TeamBoardData,
  TeamTaskListData,
  TeamTaskDetailData,
  TeamWorkloadData,
  TeamCampaignsData,
  TeamCampaignDetailData,
  TeamAgendaData,
  TeamDocumentsData,
  TeamTaskViewItem,
  TeamCampaignSummary,
  TeamInsightAnswer,
} from "@/services/contracts/team-management.contract";
import { KpiCard } from "@/types/metrics";
import { TeamTask, TeamCampaign } from "@/types/team-management";
import { REFERENCE_TODAY } from "@/lib/date-range";
import { calcVariation } from "@/lib/metrics";
import { formatDate, formatPercent } from "@/lib/formatters";
import { delay, chance } from "./_shared";
import {
  TEAM_PLAN,
  TEAM_BUCKETS,
  TEAM_CAMPAIGNS,
  TEAM_TASKS,
  TEAM_MEETINGS,
  TEAM_DOCUMENTS,
  findTeamTask,
  findTeamTaskDetails,
  historyForTask,
  historyForCampaign,
  computeTeamAlerts,
} from "@/mocks/team-management";
import {
  activeBacklogCount,
  onTimeRate,
  overdueTasks,
  criticalDueSoonTasks,
  staleTasks,
  entriesAndDeliveriesByWeek,
  workloadByAssignee,
  loadConcentration,
  balanceIndex,
  tasksForCampaign,
  weightedCampaignProgress,
  lateTasksForCampaign,
  campaignRiskScore,
  documentHealthForCampaign,
  documentCoverageRate,
  meetingHoursInPeriod,
  meetingsPerWeek,
  agendaDensity,
  capacityVsDemand,
  computeOperationScore,
  taskRiskFlags,
  WEEKLY_CAPACITY_HOURS,
  WORKLOAD_POLICY_NOTICE,
  TEAM_METRIC_FORMULAS,
} from "@/lib/team-metrics";

function bucketNameById(bucketId: string): string | undefined {
  return TEAM_BUCKETS.find((b) => b.id === bucketId)?.name;
}

function campaignById(campaignId: string): TeamCampaign | undefined {
  return TEAM_CAMPAIGNS.find((c) => c.id === campaignId);
}

function toViewItem(task: TeamTask, referenceDate: Date): TeamTaskViewItem {
  const campaign = campaignById(task.campaignId);
  return {
    task,
    campaignId: task.campaignId,
    campaignName: campaign?.name ?? "Campanha não identificada",
    campaignCriticality: campaign?.criticality ?? "media",
    bucketId: task.bucketId,
    bucketName: bucketNameById(task.bucketId) ?? "—",
    risk: taskRiskFlags(task, referenceDate),
    hasDocument: TEAM_DOCUMENTS.some((d) => d.taskId === task.id),
  };
}

function buildCampaignSummary(campaign: TeamCampaign, referenceDate: Date): TeamCampaignSummary {
  const campaignTasks = tasksForCampaign(TEAM_TASKS, campaign.id);
  const campaignDocs = TEAM_DOCUMENTS.filter((d) => d.campaignId === campaign.id);
  return {
    campaign,
    progress: weightedCampaignProgress(campaignTasks),
    risk: campaignRiskScore(campaign, campaignTasks, referenceDate),
    lateTasks: lateTasksForCampaign(campaignTasks, referenceDate),
    documentHealth: documentHealthForCampaign(campaign, campaignTasks, campaignDocs, bucketNameById),
    openTaskCount: campaignTasks.filter((t) => t.completedDateTime == null).length,
  };
}

const SUGGESTED_QUESTIONS = [
  "Quais atividades estão atrasadas?",
  "Qual campanha apresenta maior risco?",
  "Como está a carga do time esta semana?",
  "Quais tarefas não tiveram atualização nos últimos sete dias?",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export class MockTeamManagementRepository implements ITeamManagementRepository {
  async getOverview(): Promise<TeamOverviewData> {
    const referenceDate = REFERENCE_TODAY;
    const tasks = TEAM_TASKS;

    const backlog = activeBacklogCount(tasks);
    const sevenDaysAgoIso = addDays(referenceDate, -7).toISOString();
    const backlogSevenDaysAgo = tasks.filter(
      (t) => t.createdDateTime <= sevenDaysAgoIso && (t.completedDateTime == null || t.completedDateTime > sevenDaysAgoIso)
    ).length;

    const onTime = onTimeRate(tasks);
    const overdue = overdueTasks(tasks, referenceDate);
    const dueSoon = criticalDueSoonTasks(tasks, referenceDate);
    const capacity = capacityVsDemand(tasks, WEEKLY_CAPACITY_HOURS);

    const kpis: KpiCard[] = [
      {
        id: "backlog-ativo",
        label: "Backlog ativo",
        value: backlog,
        variation: calcVariation(backlog, backlogSevenDaysAgo),
        formula: "Tarefas do Planner ainda não concluídas (qualquer bucket exceto Concluído)",
      },
      {
        id: "cumprimento-prazo",
        label: "Cumprimento de prazo",
        value: onTime.rate ?? 0,
        formattedValue: onTime.rate != null ? formatPercent(onTime.rate) : "sem dado",
        variation: { current: onTime.rate ?? 0, previous: 0, comparable: false, percentChange: null, direction: "none" },
        formula: TEAM_METRIC_FORMULAS.onTimeRate,
        unit: "percent",
      },
      {
        id: "tarefas-atrasadas",
        label: "Tarefas atrasadas",
        value: overdue.length,
        variation: { current: overdue.length, previous: 0, comparable: false, percentChange: null, direction: "none" },
        formula: "Tarefas abertas com data de prazo já vencida em relação a hoje",
      },
      {
        id: "tarefas-criticas-48h",
        label: "Tarefas críticas (≤48h)",
        value: dueSoon.length,
        variation: { current: dueSoon.length, previous: 0, comparable: false, percentChange: null, direction: "none" },
        formula: `Tarefas abertas cujo prazo vence dentro das próximas ${48} horas`,
      },
      {
        id: "capacidade-demanda",
        label: "Capacidade vs. demanda",
        value: capacity.ratio * 100,
        formattedValue: `${Math.round(capacity.ratio * 100)}%`,
        variation: { current: capacity.ratio * 100, previous: 0, comparable: false, percentChange: null, direction: "none" },
        formula: TEAM_METRIC_FORMULAS.capacityVsDemand,
        unit: "percent",
      },
    ];

    const summaries = TEAM_CAMPAIGNS.filter((c) => c.status === "planejamento" || c.status === "em_andamento").map((c) =>
      buildCampaignSummary(c, referenceDate)
    );
    const riskCampaigns = [...summaries].sort((a, b) => b.risk.score - a.risk.score).slice(0, 3);

    const alerts = computeTeamAlerts(tasks, TEAM_CAMPAIGNS, referenceDate);
    const criticalAlerts = alerts.filter((a) => a.level === "critico");

    const nowIso = referenceDate.toISOString();
    const next7Iso = addDays(referenceDate, 7).toISOString();
    const past14Iso = addDays(referenceDate, -14).toISOString();
    const hoursNext7Days = meetingHoursInPeriod(TEAM_MEETINGS, nowIso, next7Iso);
    const density = agendaDensity(meetingHoursInPeriod(TEAM_MEETINGS, past14Iso, nowIso), 2, WEEKLY_CAPACITY_HOURS);
    const perWeek = meetingsPerWeek(TEAM_MEETINGS, addDays(referenceDate, -28).toISOString(), nowIso);

    const coverage = documentCoverageRate(TEAM_CAMPAIGNS, TEAM_DOCUMENTS);
    const staleCount = TEAM_DOCUMENTS.filter((d) => d.isStale).length;

    const workload = workloadByAssignee(tasks);
    const concentration = loadConcentration(workload);
    const topCampaignRisk = riskCampaigns[0];

    const autoInsights: string[] = [];
    if (overdue.length > 0) {
      autoInsights.push(`${overdue.length} tarefa(s) estão com prazo vencido no momento — a maior parte concentrada em campanhas próximas do prazo final.`);
    }
    if (topCampaignRisk && topCampaignRisk.risk.score >= 50) {
      autoInsights.push(`A campanha "${topCampaignRisk.campaign.name}" é a que mais concentra sinais de risco (score ${topCampaignRisk.risk.score}/100) no momento.`);
    }
    if (concentration != null && concentration >= 0.25) {
      autoInsights.push(`A distribuição de demanda entre a equipe está concentrada: ${Math.round(concentration * 100)}% da carga aberta está com uma única pessoa.`);
    }
    if (staleCount > 0) {
      autoInsights.push(`${staleCount} documento(s) estão desatualizados (sem alteração há mais de 45 dias) em campanhas ainda ativas.`);
    }

    return delay({
      plan: TEAM_PLAN,
      score: computeOperationScore(tasks, TEAM_CAMPAIGNS, TEAM_MEETINGS, TEAM_DOCUMENTS, referenceDate),
      kpis,
      weeklyTrend: entriesAndDeliveriesByWeek(tasks, referenceDate, 8),
      riskCampaigns,
      criticalAlerts,
      agendaSummary: { hoursNext7Days, meetingsPerWeek: perWeek, density, capacityHoursPerWeek: WEEKLY_CAPACITY_HOURS },
      documentSummary: { coverage, staleCount, totalCount: TEAM_DOCUMENTS.length },
      autoInsights,
      partialCoverage: chance(0.06),
    });
  }

  async getBoard(): Promise<TeamBoardData> {
    const referenceDate = REFERENCE_TODAY;
    const items = TEAM_TASKS.map((t) => toViewItem(t, referenceDate));
    return delay({ buckets: TEAM_BUCKETS, items, partialCoverage: chance(0.05) });
  }

  async getTaskList(): Promise<TeamTaskListData> {
    const referenceDate = REFERENCE_TODAY;
    const items = TEAM_TASKS.map((t) => toViewItem(t, referenceDate)).sort((a, b) => {
      // Prioriza risco (atrasada/crítica) e depois prazo mais próximo, sem nunca ordenar por responsável/produtividade.
      const riskScore = (i: TeamTaskViewItem) => (i.risk.isOverdue ? 3 : i.risk.isDueSoon ? 2 : i.risk.isBlocked ? 1 : 0);
      const diff = riskScore(b) - riskScore(a);
      if (diff !== 0) return diff;
      return (a.task.dueDateTime ?? "9999").localeCompare(b.task.dueDateTime ?? "9999");
    });
    return delay({
      items,
      campaignOptions: TEAM_CAMPAIGNS.map((c) => ({ id: c.id, name: c.name })),
      assigneeOptions: Array.from(new Set(TEAM_TASKS.flatMap((t) => t.assigneeNames))).sort(),
      partialCoverage: chance(0.05),
    });
  }

  async getTaskDetail(taskId: string): Promise<TeamTaskDetailData | undefined> {
    const task = findTeamTask(taskId);
    if (!task) return delay(undefined);
    const campaign = campaignById(task.campaignId);
    return delay({
      task,
      details: findTeamTaskDetails(taskId),
      history: historyForTask(taskId),
      campaignName: campaign?.name ?? "Campanha não identificada",
      documents: TEAM_DOCUMENTS.filter((d) => d.taskId === taskId),
    });
  }

  async getWorkload(): Promise<TeamWorkloadData> {
    const workload = workloadByAssignee(TEAM_TASKS);
    return delay({
      workload,
      concentration: loadConcentration(workload),
      balanceIndex: balanceIndex(workload),
      partialCoverage: chance(0.05),
    });
  }

  async getCampaigns(): Promise<TeamCampaignsData> {
    const referenceDate = REFERENCE_TODAY;
    const campaigns = TEAM_CAMPAIGNS.map((c) => buildCampaignSummary(c, referenceDate)).sort((a, b) => b.risk.score - a.risk.score);
    return delay({ campaigns, partialCoverage: chance(0.05) });
  }

  async getCampaignDetail(campaignId: string): Promise<TeamCampaignDetailData | undefined> {
    const campaign = campaignById(campaignId);
    if (!campaign) return delay(undefined);
    const referenceDate = REFERENCE_TODAY;
    const campaignTasks = tasksForCampaign(TEAM_TASKS, campaignId);
    const campaignDocs = TEAM_DOCUMENTS.filter((d) => d.campaignId === campaignId);
    return delay({
      campaign,
      tasks: campaignTasks.map((t) => toViewItem(t, referenceDate)),
      history: historyForCampaign(campaignTasks.map((t) => t.id)),
      meetings: TEAM_MEETINGS.filter((m) => m.campaignId === campaignId),
      documents: campaignDocs,
      risk: campaignRiskScore(campaign, campaignTasks, referenceDate),
      progress: weightedCampaignProgress(campaignTasks),
      documentHealth: documentHealthForCampaign(campaign, campaignTasks, campaignDocs, bucketNameById),
    });
  }

  async getAgenda(): Promise<TeamAgendaData> {
    const referenceDate = REFERENCE_TODAY;
    const fromIso = addDays(referenceDate, -21).toISOString();
    const toIso = addDays(referenceDate, 21).toISOString();
    const meetings = TEAM_MEETINGS.filter((m) => m.start >= fromIso && m.start <= toIso).sort((a, b) => a.start.localeCompare(b.start));
    const hoursInPeriod = meetingHoursInPeriod(TEAM_MEETINGS, fromIso, toIso);
    return delay({
      meetings,
      hoursInPeriod,
      meetingsPerWeek: meetingsPerWeek(TEAM_MEETINGS, fromIso, toIso),
      density: agendaDensity(hoursInPeriod, differenceInCalendarDays(new Date(toIso), new Date(fromIso)) / 7, WEEKLY_CAPACITY_HOURS),
      capacityHoursPerWeek: WEEKLY_CAPACITY_HOURS,
      partialCoverage: chance(0.05),
    });
  }

  async getDocuments(): Promise<TeamDocumentsData> {
    const documents = TEAM_DOCUMENTS.map((d) => ({ ...d, campaignName: d.campaignId ? campaignById(d.campaignId)?.name : undefined })).sort(
      (a, b) => b.lastModifiedDateTime.localeCompare(a.lastModifiedDateTime)
    );
    return delay({
      documents,
      coverage: documentCoverageRate(TEAM_CAMPAIGNS, TEAM_DOCUMENTS),
      partialCoverage: chance(0.05),
    });
  }

  async getSuggestedQuestions(): Promise<string[]> {
    return delay(SUGGESTED_QUESTIONS, 200, 400);
  }

  async askOperationQuestion(question: string): Promise<TeamInsightAnswer | null> {
    const referenceDate = REFERENCE_TODAY;
    const tasks = TEAM_TASKS;
    const q = normalize(question);

    if (q.includes("atrasad")) {
      const overdue = overdueTasks(tasks, referenceDate);
      const sample = overdue.slice(0, 5).map((t) => `"${t.title}" (${campaignById(t.campaignId)?.name ?? "—"})`);
      return delay(
        {
          id: "ans-atrasadas",
          question,
          conclusion:
            overdue.length > 0
              ? `Há ${overdue.length} tarefa(s) com prazo vencido no momento, sem conclusão registrada.`
              : "Não há tarefas com prazo vencido no momento.",
          evidence: [
            { label: "Tarefas atrasadas", value: String(overdue.length) },
            { label: "Exemplos", value: sample.join("; ") || "—" },
          ],
          confidenceNote: `Resposta calculada por regra sobre os dados mockados do Planner na data de referência ${formatDate(referenceDate.toISOString())}. Não é uma IA conversacional livre.`,
        },
        400,
        700
      );
    }

    if (q.includes("risco")) {
      const summaries = TEAM_CAMPAIGNS.filter((c) => c.status === "planejamento" || c.status === "em_andamento").map((c) =>
        buildCampaignSummary(c, referenceDate)
      );
      const top = [...summaries].sort((a, b) => b.risk.score - a.risk.score)[0];
      return delay(
        {
          id: "ans-risco",
          question,
          conclusion: top
            ? `A campanha com maior risco no momento é "${top.campaign.name}", com score ${top.risk.score}/100.`
            : "Não há campanhas ativas para avaliar risco no momento.",
          evidence: top
            ? [
                { label: "Score de risco", value: `${top.risk.score}/100` },
                { label: "Principal sinal", value: top.risk.signals[0] ?? "—" },
                { label: "Progresso da campanha", value: top.progress != null ? formatPercent(top.progress) : "sem dado" },
              ]
            : [],
          confidenceNote: "Score calculado por fórmula explicável (prazo, progresso, bloqueios, concentração de responsável) — ver detalhe da campanha para a lista completa de sinais.",
        },
        400,
        700
      );
    }

    if (q.includes("carga") || q.includes("time esta semana") || q.includes("equipe")) {
      const workload = workloadByAssignee(tasks);
      const concentration = loadConcentration(workload);
      const balance = balanceIndex(workload);
      return delay(
        {
          id: "ans-carga",
          question,
          conclusion:
            "A carga aberta está distribuída de forma desigual entre a equipe no momento — isso é contexto de distribuição de demanda, não uma avaliação de desempenho individual.",
          evidence: [
            { label: "Concentração de carga", value: concentration != null ? formatPercent(concentration * 100) : "sem dado" },
            { label: "Índice de equilíbrio", value: balance != null ? balance.toFixed(2) : "sem dado" },
            { label: "Tarefas abertas no time", value: String(activeBacklogCount(tasks)) },
          ],
          confidenceNote: WORKLOAD_POLICY_NOTICE,
        },
        400,
        700
      );
    }

    if (q.includes("sete dias") || q.includes("7 dias") || q.includes("atualiza")) {
      const stale = staleTasks(tasks, referenceDate);
      const sample = stale.slice(0, 5).map((t) => `"${t.title}"`);
      return delay(
        {
          id: "ans-paradas",
          question,
          conclusion:
            stale.length > 0
              ? `${stale.length} tarefa(s) aberta(s) não têm atualização há mais de 7 dias.`
              : "Todas as tarefas abertas foram atualizadas nos últimos 7 dias.",
          evidence: [
            { label: "Tarefas paradas", value: String(stale.length) },
            { label: "Exemplos", value: sample.join("; ") || "—" },
          ],
          confidenceNote: "Considera apenas a data de última modificação registrada no Planner simulado.",
        },
        400,
        700
      );
    }

    return delay(null, 300, 500);
  }
}
