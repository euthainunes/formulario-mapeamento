import { TeamTaskHistoryEvent } from "@/types/team-management";
import { relativeIso } from "./_helpers";

/**
 * Histórico plausível (mudança de prazo, responsável, status) para ~18
 * tarefas — usado na timeline de detalhe de campanha/tarefa. Cada evento
 * tem `occurredAt` coerente com as datas de criação/conclusão definidas em
 * tasks.mock.ts.
 */
let seq = 0;
function ev(
  taskId: string,
  eventType: TeamTaskHistoryEvent["eventType"],
  offsetDays: number,
  oldValue?: string,
  newValue?: string
): TeamTaskHistoryEvent {
  seq += 1;
  return {
    id: `hist-${String(seq).padStart(3, "0")}`,
    taskId,
    eventType,
    oldValue,
    newValue,
    occurredAt: relativeIso(offsetDays, 10, 0),
  };
}

export const TEAM_TASK_HISTORY: TeamTaskHistoryEvent[] = [
  // Dia dos Pais — fluxo completo até conclusão
  ev("t-dia-dos-pais-1", "created", -42),
  ev("t-dia-dos-pais-1", "status_changed", -39, "Backlog", "Planejamento"),
  ev("t-dia-dos-pais-1", "completed", -38),
  ev("t-dia-dos-pais-2", "created", -38),
  ev("t-dia-dos-pais-2", "assignee_changed", -34, "Larissa Prado", "Camila Duarte"),
  ev("t-dia-dos-pais-2", "completed", -28),
  ev("t-dia-dos-pais-3", "created", -30),
  ev("t-dia-dos-pais-3", "due_date_changed", -27, "26 dias atrás", "24 dias atrás"),
  ev("t-dia-dos-pais-3", "completed", -24),
  ev("t-dia-dos-pais-6", "created", -25),
  ev("t-dia-dos-pais-6", "assignee_changed", -22, "Mariana Souza", "Sem responsável"),
  ev("t-dia-dos-pais-6", "status_changed", -20, "Planejamento", "Aprovação"),

  // Campanha de segurança — tarefa bloqueada e crítica
  ev("t-seguranca-4", "created", -10),
  ev("t-seguranca-4", "status_changed", -7, "Produção", "Aprovação"),
  ev("t-seguranca-4", "due_date_changed", -5, "7 dias a partir de hoje", "2 dias a partir de hoje"),
  ev("t-seguranca-3", "created", -14),
  ev("t-seguranca-3", "assignee_changed", -12, "Sarah Lima", "Larissa Prado"),
  ev("t-seguranca-5", "created", -5),
  ev("t-seguranca-5", "due_date_changed", -2, "5 dias a partir de hoje", "1 dia a partir de hoje"),

  // Evento corporativo — bloqueio de fornecedor e orçamento atrasado
  ev("t-evento-3", "created", -18),
  ev("t-evento-3", "status_changed", -14, "Produção", "Aprovação"),
  ev("t-evento-4", "created", -15),
  ev("t-evento-4", "due_date_changed", -10, "6 dias a partir de hoje", "4 dias atrás"),

  // Newsletter interna
  ev("t-newsletter-2", "created", -5),
  ev("t-newsletter-4", "created", -20),
  ev("t-newsletter-4", "assignee_changed", -18, "Thainá Nunes", "Hector Ramos"),

  // Comunicação de benefícios
  ev("t-beneficios-3", "created", -8),
  ev("t-beneficios-3", "due_date_changed", -5, "3 dias a partir de hoje", "2 dias atrás"),
  ev("t-beneficios-4", "created", -6),
  ev("t-beneficios-4", "status_changed", -3, "Produção", "Aprovação"),

  // Comunicação de resultados
  ev("t-resultados-1", "created", -8),
  ev("t-resultados-1", "due_date_changed", -4, "3 dias a partir de hoje", "1 dia atrás"),
  ev("t-resultados-2", "created", -6),
  ev("t-resultados-3", "created", -3),

  // Atualização de portal
  ev("t-portal-1", "created", -20),
  ev("t-portal-1", "status_changed", -18, "Backlog", "Produção"),

  // Produção de peças de comunicação
  ev("t-pecas-3", "created", -7),
  ev("t-pecas-3", "assignee_changed", -4, "Camila Duarte", "Mariana Souza"),

  // Reconhecimento e pesquisa de clima
  ev("t-reconhecimento-4", "created", -4),
  ev("t-pesquisa-3", "created", -6),
  ev("t-pesquisa-3", "status_changed", -3, "Produção", "Aprovação"),
];

export function historyForTask(taskId: string): TeamTaskHistoryEvent[] {
  return TEAM_TASK_HISTORY.filter((h) => h.taskId === taskId).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

export function historyForCampaign(taskIds: string[]): TeamTaskHistoryEvent[] {
  const set = new Set(taskIds);
  return TEAM_TASK_HISTORY.filter((h) => set.has(h.taskId)).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
