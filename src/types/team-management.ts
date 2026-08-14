/**
 * Modelo de dados do módulo "Gestão do Time".
 *
 * Os nomes de campo foram inspirados nas entidades reais da Microsoft Graph
 * API (Planner, Outlook/Calendar, SharePoint/Drive) para que, quando a
 * integração real acontecer, a troca de camada de dados (mock -> API) não
 * exija redesenhar as telas — apenas trocar o repository (ver
 * src/services/repositories/team-management.repository.ts).
 *
 * IMPORTANTE — regra de negócio dura: nenhum campo ou derivação aqui pode
 * ser usado para rankear/avaliar produtividade individual. "Carga por
 * responsável" é sempre contexto de distribuição de demanda, nunca
 * desempenho (ver src/lib/team-metrics.ts).
 */

// ---------------------------------------------------------------------------
// Planner — plano, buckets (etapas do fluxo) e tarefas
// ---------------------------------------------------------------------------

/** Corresponde a um `plannerPlan` do Graph API. */
export interface TeamPlan {
  id: string;
  title: string;
  ownerName: string;
}

/** Corresponde a um `plannerBucket` do Graph API. */
export interface TeamBucket {
  id: string;
  planId: string;
  name: string;
  orderHint: number;
}

/** Nomes fixos dos 7 buckets do fluxo de Comunicação Interna, nesta ordem. */
export const TEAM_BUCKET_NAMES = [
  "Backlog",
  "Briefing",
  "Planejamento",
  "Produção",
  "Aprovação",
  "Agendamento/Publicação",
  "Concluído",
] as const;

export type TeamBucketName = (typeof TEAM_BUCKET_NAMES)[number];

export type CampaignType = "campanha" | "projeto" | "iniciativa";
export type CampaignChannel = "E-mail" | "Intranet" | "Teams" | "Evento" | "Portal" | "Impresso";
export type CommunicationType = "institucional" | "educativa" | "engajamento" | "reconhecimento";
export type CampaignAudience = "Liderança" | "Operação" | "Toda empresa";
export type CampaignCriticality = "baixa" | "media" | "alta" | "critica";
export type CampaignStatus = "planejamento" | "em_andamento" | "concluida" | "cancelada";

/**
 * Classificação complementar de campanha/projeto/iniciativa — o Planner por
 * si só não tem esse conceito nativamente, então tratamos como metadado
 * próprio da BeeHome, correlacionado a um subconjunto de tarefas via
 * `campaignId`.
 */
export interface TeamCampaign {
  id: string;
  name: string;
  type: CampaignType;
  channel: CampaignChannel[];
  communicationType: CommunicationType;
  audience: CampaignAudience[];
  criticality: CampaignCriticality;
  startDate: string; // ISO date
  targetDate: string; // ISO date
  ownerName: string;
  status: CampaignStatus;
}

/** Convenção de prioridade do Planner usada neste mock: 1=baixa, 3=média, 5=alta, 9=urgente. */
export type TeamTaskPriority = 1 | 3 | 5 | 9;

export const TASK_PRIORITY_LABELS: Record<TeamTaskPriority, string> = {
  1: "Baixa",
  3: "Média",
  5: "Alta",
  9: "Urgente",
};

/** Corresponde a um `plannerTask` do Graph API, com campos complementares (campaignId, labels, bloqueio). */
export interface TeamTask {
  id: string;
  planId: string;
  bucketId: string;
  campaignId: string;
  title: string;
  percentComplete: number; // 0-100
  priority: TeamTaskPriority;
  startDateTime: string | null; // ISO datetime
  dueDateTime: string | null; // ISO datetime
  completedDateTime: string | null; // ISO datetime
  createdDateTime: string; // ISO datetime
  lastModifiedDateTime: string; // ISO datetime
  assigneeNames: string[]; // 0, 1 ou mais responsáveis (subconjunto de COMMUNICATION_TEAM)
  primaryAssigneeName: string | null;
  labels: string[]; // texto livre, ex: "urgente", "aguardando aprovação"
  isBlocked: boolean;
  blockerType?: string; // ex: "aguardando aprovação jurídica", "aguardando fornecedor"
  blockedSince?: string; // ISO datetime
  dependencyOwner?: string; // pessoa/área da qual a tarefa depende
  nextAction?: string; // próxima ação sugerida para destravar
  sourceUrl: string; // link fictício, formato https://tasks.office.com/...
}

export interface TeamTaskChecklistItem {
  title: string;
  isChecked: boolean;
}

export interface TeamTaskReference {
  label: string;
  url: string;
}

export interface TeamTaskDetails {
  taskId: string;
  description: string;
  checklist: TeamTaskChecklistItem[];
  references: TeamTaskReference[];
}

export type TeamTaskHistoryEventType =
  | "status_changed"
  | "due_date_changed"
  | "assignee_changed"
  | "created"
  | "completed"
  | "reopened";

export interface TeamTaskHistoryEvent {
  id: string;
  taskId: string;
  eventType: TeamTaskHistoryEventType;
  oldValue?: string;
  newValue?: string;
  occurredAt: string; // ISO datetime
}

// ---------------------------------------------------------------------------
// Outlook — agenda institucional (metadados apenas, sem participantes/corpo)
// ---------------------------------------------------------------------------

export type MeetingShowAs = "busy" | "tentative" | "free";
export type MeetingType = "planejamento" | "aprovacao" | "evento" | "alinhamento";

/**
 * Corresponde a um `event` do Outlook Calendar (Graph API), reduzido aos
 * metadados institucionais — por política de privacidade, este módulo não
 * lista participantes individuais nem o corpo/assunto detalhado de reuniões
 * pessoais, apenas o calendário compartilhado da área.
 */
export interface TeamMeeting {
  id: string;
  subject: string;
  campaignId?: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  isAllDay: boolean;
  showAs: MeetingShowAs;
  isCancelled: boolean;
  location: string;
  meetingType: MeetingType;
  lastModifiedDateTime: string; // ISO datetime
}

// ---------------------------------------------------------------------------
// SharePoint — documentos (drive items)
// ---------------------------------------------------------------------------

/**
 * Corresponde a um `driveItem` do SharePoint (Graph API). `name` segue a
 * convenção `[ANO]_[CAMPANHA]_[CANAL]_[TIPO]_[VERSAO].ext` definida pela
 * Bruna para os documentos de Comunicação Interna.
 */
export interface TeamDocument {
  id: string;
  name: string;
  campaignId?: string;
  taskId?: string;
  webUrl: string; // fictícia
  path: string;
  mimeType: string;
  sizeBytes: number;
  createdDateTime: string; // ISO datetime
  lastModifiedDateTime: string; // ISO datetime
  lastModifiedByName: string;
  /** true quando não houve alteração há mais de 45 dias e a campanha vinculada ainda está ativa. */
  isStale: boolean;
}

// ---------------------------------------------------------------------------
// Alertas operacionais (derivados, ver computeTeamAlerts em src/mocks/team-management)
// ---------------------------------------------------------------------------

export type TeamAlertLevel = "informativo" | "atencao" | "critico";
export type TeamAlertStatus = "novo" | "em_analise" | "resolvido" | "ignorado";

export interface TeamAlert {
  id: string;
  level: TeamAlertLevel;
  title: string;
  description: string;
  relatedCampaignId?: string;
  relatedTaskId?: string;
  detectedAt: string; // ISO datetime
  status: TeamAlertStatus;
}

// ---------------------------------------------------------------------------
// Score operacional
// ---------------------------------------------------------------------------

export type OperationScoreLabel = "Saudável" | "Atenção" | "Crítico";

export interface OperationScoreDimension {
  key: string;
  label: string;
  score: number; // 0-100
  weight: number; // 0-1, soma das 7 dimensões = 1
  explanation: string;
  signals: string[]; // frases curtas explicando o que puxou o score
}

export interface OperationScoreBreakdown {
  overallScore: number; // 0-100
  label: OperationScoreLabel;
  dimensions: OperationScoreDimension[];
}
