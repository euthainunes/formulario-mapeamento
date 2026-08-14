import { TeamAlert, TeamTask, TeamCampaign } from "@/types/team-management";
import {
  overdueTasks,
  criticalDueSoonTasks,
  longUnassignedTasks,
  staleTasks,
  workloadByAssignee,
  loadConcentration,
  campaignRiskScore,
  tasksForCampaign,
  CRITICAL_DUE_HOURS,
  STALE_TASK_DAYS,
  UNASSIGNED_ALERT_HOURS,
} from "@/lib/team-metrics";
import { formatDate } from "@/lib/formatters";

/**
 * Alertas operacionais CALCULADOS a partir dos dados mockados (não
 * hardcoded) — para o painel ficar coerente com o restante do módulo mesmo
 * se os mocks de tarefas/campanhas forem editados depois. Simplificação das
 * regras da especificação da Bruna para as 6 mais importantes:
 *   1. Tarefa vencida
 *   2. Prazo próximo (≤48h) com progresso baixo
 *   3. Tarefa sem responsável há mais de 72h
 *   4. Tarefa parada (sem alteração há mais de 7 dias)
 *   5. Concentração de carga elevada (informativo — nunca avaliação individual)
 *   6. Campanha em risco alto
 */
export function computeTeamAlerts(tasks: TeamTask[], campaigns: TeamCampaign[], referenceDate: Date): TeamAlert[] {
  const alerts: TeamAlert[] = [];
  const campaignById = new Map(campaigns.map((c) => [c.id, c]));
  const nowIso = referenceDate.toISOString();

  // 1. Tarefa vencida
  for (const task of overdueTasks(tasks, referenceDate)) {
    const campaign = campaignById.get(task.campaignId);
    alerts.push({
      id: `alert-overdue-${task.id}`,
      level: "critico",
      title: `Tarefa vencida: "${task.title}"`,
      description: `Prazo era ${formatDate(task.dueDateTime!)}${campaign ? ` — campanha "${campaign.name}"` : ""}. Responsável: ${task.assigneeNames.join(", ") || "sem responsável definido"}.`,
      relatedCampaignId: task.campaignId,
      relatedTaskId: task.id,
      detectedAt: nowIso,
      status: "novo",
    });
  }

  // 2. Prazo próximo (≤48h) com progresso baixo
  for (const task of criticalDueSoonTasks(tasks, referenceDate, CRITICAL_DUE_HOURS)) {
    if (task.percentComplete >= 70) continue;
    const campaign = campaignById.get(task.campaignId);
    alerts.push({
      id: `alert-due-soon-${task.id}`,
      level: task.percentComplete < 40 ? "critico" : "atencao",
      title: `Prazo em até 48h com progresso baixo: "${task.title}"`,
      description: `${task.percentComplete}% concluído, vence em ${formatDate(task.dueDateTime!)}${campaign ? ` — campanha "${campaign.name}"` : ""}.`,
      relatedCampaignId: task.campaignId,
      relatedTaskId: task.id,
      detectedAt: nowIso,
      status: "novo",
    });
  }

  // 3. Tarefa sem responsável há mais de 72h
  for (const task of longUnassignedTasks(tasks, referenceDate, UNASSIGNED_ALERT_HOURS)) {
    const campaign = campaignById.get(task.campaignId);
    alerts.push({
      id: `alert-unassigned-${task.id}`,
      level: "critico",
      title: `Tarefa sem responsável há mais de 72h: "${task.title}"`,
      description: `Criada em ${formatDate(task.createdDateTime)}${campaign ? ` — campanha "${campaign.name}"` : ""}, ainda sem ninguém atribuído.`,
      relatedCampaignId: task.campaignId,
      relatedTaskId: task.id,
      detectedAt: nowIso,
      status: "novo",
    });
  }

  // 4. Tarefa parada (sem alteração há mais de 7 dias)
  for (const task of staleTasks(tasks, referenceDate, STALE_TASK_DAYS)) {
    const campaign = campaignById.get(task.campaignId);
    alerts.push({
      id: `alert-stale-${task.id}`,
      level: "atencao",
      title: `Tarefa parada: "${task.title}"`,
      description: `Sem atualização desde ${formatDate(task.lastModifiedDateTime)}${campaign ? ` — campanha "${campaign.name}"` : ""}.`,
      relatedCampaignId: task.campaignId,
      relatedTaskId: task.id,
      detectedAt: nowIso,
      status: "novo",
    });
  }

  // 5. Concentração de carga elevada (informativo — distribuição de demanda, não desempenho)
  const workload = workloadByAssignee(tasks);
  const concentration = loadConcentration(workload);
  if (concentration != null && concentration >= 0.3) {
    const top = [...workload].sort((a, b) => b.openTaskLoad - a.openTaskLoad)[0];
    alerts.push({
      id: "alert-load-concentration",
      level: "informativo",
      title: "Concentração de demanda entre a equipe",
      description: `${Math.round(concentration * 100)}% da carga aberta do time está concentrada em uma única pessoa (${top.name}). Isso indica um ponto de atenção na distribuição de demanda, não uma avaliação de desempenho individual — considere redistribuir tarefas.`,
      detectedAt: nowIso,
      status: "novo",
    });
  }

  // 6. Campanha em risco alto
  for (const campaign of campaigns) {
    if (campaign.status !== "planejamento" && campaign.status !== "em_andamento") continue;
    const risk = campaignRiskScore(campaign, tasksForCampaign(tasks, campaign.id), referenceDate);
    if (risk.score >= 60) {
      alerts.push({
        id: `alert-campaign-risk-${campaign.id}`,
        level: risk.score >= 80 ? "critico" : "atencao",
        title: `Campanha em risco: "${campaign.name}"`,
        description: `Score de risco ${risk.score}/100. ${risk.signals[0] ?? ""}`,
        relatedCampaignId: campaign.id,
        detectedAt: nowIso,
        status: "novo",
      });
    }
  }

  return alerts;
}
