import { appConfig } from "@/lib/app-config";
import { IInsightsRepository } from "@/services/contracts/insights.contract";
import { MockInsightsRepository } from "@/services/mock/insights.mock";
import { InsightAnswer, InsightSummary } from "@/types/insight";

class ApiInsightsRepository implements IInsightsRepository {
  async getSuggestedQuestions(): Promise<string[]> {
    throw new Error("ApiInsightsRepository não implementado — integração real ainda não disponível.");
  }
  async getAutoInsights(): Promise<InsightSummary[]> {
    throw new Error("ApiInsightsRepository não implementado — integração real ainda não disponível.");
  }
  async ask(_question: string): Promise<InsightAnswer | null> {
    throw new Error("ApiInsightsRepository não implementado — integração real ainda não disponível.");
  }
}

export function getInsightsRepository(): IInsightsRepository {
  return appConfig.dataSource === "mock" ? new MockInsightsRepository() : new ApiInsightsRepository();
}
