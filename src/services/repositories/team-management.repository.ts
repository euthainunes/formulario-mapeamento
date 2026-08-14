import { appConfig } from "@/lib/app-config";
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
  TeamInsightAnswer,
} from "@/services/contracts/team-management.contract";
import { MockTeamManagementRepository } from "@/services/mock/team-management.mock";

/**
 * Repository real (Microsoft Graph — Planner/Outlook/SharePoint). Não há
 * credenciais nem aprovação técnica para essa integração ainda: cada método
 * apenas lança um erro explícito, sem tentar nenhuma chamada de rede real a
 * graph.microsoft.com e sem qualquer token fictício que pareça real.
 */
class ApiTeamManagementRepository implements ITeamManagementRepository {
  private notImplemented(): never {
    throw new Error(
      "Gestão do Time: integração real com Microsoft Graph (Planner/Outlook/SharePoint) não implementada — aguardando credenciais e aprovação técnica."
    );
  }

  getOverview(): Promise<TeamOverviewData> {
    this.notImplemented();
  }
  getBoard(): Promise<TeamBoardData> {
    this.notImplemented();
  }
  getTaskList(): Promise<TeamTaskListData> {
    this.notImplemented();
  }
  getTaskDetail(): Promise<TeamTaskDetailData | undefined> {
    this.notImplemented();
  }
  getWorkload(): Promise<TeamWorkloadData> {
    this.notImplemented();
  }
  getCampaigns(): Promise<TeamCampaignsData> {
    this.notImplemented();
  }
  getCampaignDetail(): Promise<TeamCampaignDetailData | undefined> {
    this.notImplemented();
  }
  getAgenda(): Promise<TeamAgendaData> {
    this.notImplemented();
  }
  getDocuments(): Promise<TeamDocumentsData> {
    this.notImplemented();
  }
  getSuggestedQuestions(): Promise<string[]> {
    this.notImplemented();
  }
  askOperationQuestion(): Promise<TeamInsightAnswer | null> {
    this.notImplemented();
  }
}

export function getTeamManagementRepository(): ITeamManagementRepository {
  return appConfig.dataSource === "mock" ? new MockTeamManagementRepository() : new ApiTeamManagementRepository();
}
