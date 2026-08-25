import { appConfig } from "@/lib/app-config";
import { IInsightsRepository, InsightAskResult } from "@/services/contracts/insights.contract";
import { MockInsightsRepository } from "@/services/mock/insights.mock";
import { InsightSummary } from "@/types/insight";
import { apiFetch } from "@/lib/client/api-fetch";

/** POST /insights/ask devolve { answer: null, message } quando a IA não consegue responder com segurança — sem o campo `id`. O `message` (motivo real) é preservado, nunca descartado. */
type AskResponse = InsightAskResult | { answer: null; message: string };

class ApiInsightsRepository implements IInsightsRepository {
  async getSuggestedQuestions(): Promise<string[]> {
    return apiFetch<string[]>("/api/insights/suggested-questions");
  }
  async getAutoInsights(): Promise<InsightSummary[]> {
    return apiFetch<InsightSummary[]>("/api/insights/auto");
  }
  async ask(question: string): Promise<InsightAskResult> {
    const response = await apiFetch<AskResponse>("/api/insights/ask", {
      method: "POST",
      body: JSON.stringify({ question }),
    });
    return "id" in response ? response : { message: response.message };
  }
}

export function getInsightsRepository(): IInsightsRepository {
  return appConfig.dataSource === "mock" ? new MockInsightsRepository() : new ApiInsightsRepository();
}
