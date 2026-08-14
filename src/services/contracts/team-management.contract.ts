import { KpiCard, MultiSeriesPoint } from "@/types/metrics";
import {
  TeamPlan,
  TeamBucket,
  TeamCampaign,
  TeamTask,
  TeamTaskDetails,
  TeamTaskHistoryEvent,
  TeamMeeting,
  TeamDocument,
  TeamAlert,
  OperationScoreBreakdown,
  CampaignCriticality,
} from "@/types/team-management";
import { RateResult, WorkloadEntry, CampaignRiskResult, DocumentHealthResult } from "@/lib/team-metrics";

/** Flags de risco de uma tarefa, calculadas (não vêm do Planner). */
export interface TeamTaskRiskFlags {
  isOverdue: boolean;
  isUnassigned: boolean;
  isBlocked: boolean;
  isDueSoon: boolean; // vence em até 48h
  isStale: boolean; // sem alteração há mais de 7 dias, ainda aberta
}

/** Visão de uma tarefa já enriquecida com dados de campanha/bucket para exibição — reaproveitada no Quadro e na lista de Tarefas. */
export interface TeamTaskViewItem {
  task: TeamTask;
  campaignId: string;
  campaignName: string;
  campaignCriticality: CampaignCriticality;
  bucketId: string;
  bucketName: string;
  risk: TeamTaskRiskFlags;
  hasDocument: boolean;
}

export interface TeamCampaignSummary {
  campaign: TeamCampaign;
  progress: number | null;
  risk: CampaignRiskResult;
  lateTasks: RateResult;
  documentHealth: DocumentHealthResult;
  openTaskCount: number;
}

export interface TeamInsightAnswer {
  id: string;
  question: string;
  conclusion: string;
  evidence: { label: string; value: string }[];
  confidenceNote: string;
}

export interface TeamOverviewData {
  plan: TeamPlan;
  score: OperationScoreBreakdown;
  kpis: KpiCard[];
  weeklyTrend: MultiSeriesPoint[];
  riskCampaigns: TeamCampaignSummary[];
  criticalAlerts: TeamAlert[];
  agendaSummary: {
    hoursNext7Days: number;
    meetingsPerWeek: number | null;
    density: number | null;
    capacityHoursPerWeek: number;
  };
  documentSummary: { coverage: RateResult; staleCount: number; totalCount: number };
  autoInsights: string[];
  partialCoverage?: boolean;
}

export interface TeamBoardData {
  buckets: TeamBucket[];
  items: TeamTaskViewItem[];
  partialCoverage?: boolean;
}

export interface TeamTaskListData {
  items: TeamTaskViewItem[];
  campaignOptions: { id: string; name: string }[];
  assigneeOptions: string[];
  partialCoverage?: boolean;
}

export interface TeamTaskDetailData {
  task: TeamTask;
  details?: TeamTaskDetails;
  history: TeamTaskHistoryEvent[];
  campaignName: string;
  documents: TeamDocument[];
}

export interface TeamWorkloadData {
  workload: WorkloadEntry[];
  concentration: number | null;
  balanceIndex: number | null;
  partialCoverage?: boolean;
}

export interface TeamCampaignsData {
  campaigns: TeamCampaignSummary[];
  partialCoverage?: boolean;
}

export interface TeamCampaignDetailData {
  campaign: TeamCampaign;
  tasks: TeamTaskViewItem[];
  history: TeamTaskHistoryEvent[];
  meetings: TeamMeeting[];
  documents: TeamDocument[];
  risk: CampaignRiskResult;
  progress: number | null;
  documentHealth: DocumentHealthResult;
}

export interface TeamAgendaData {
  meetings: TeamMeeting[];
  hoursInPeriod: number;
  meetingsPerWeek: number | null;
  density: number | null;
  capacityHoursPerWeek: number;
  partialCoverage?: boolean;
}

export interface TeamDocumentsData {
  documents: (TeamDocument & { campaignName?: string })[];
  coverage: RateResult;
  partialCoverage?: boolean;
}

export interface ITeamManagementRepository {
  getOverview(): Promise<TeamOverviewData>;
  getBoard(): Promise<TeamBoardData>;
  getTaskList(): Promise<TeamTaskListData>;
  getTaskDetail(taskId: string): Promise<TeamTaskDetailData | undefined>;
  getWorkload(): Promise<TeamWorkloadData>;
  getCampaigns(): Promise<TeamCampaignsData>;
  getCampaignDetail(campaignId: string): Promise<TeamCampaignDetailData | undefined>;
  getAgenda(): Promise<TeamAgendaData>;
  getDocuments(): Promise<TeamDocumentsData>;
  getSuggestedQuestions(): Promise<string[]>;
  askOperationQuestion(question: string): Promise<TeamInsightAnswer | null>;
}
