import { appConfig } from "@/lib/app-config";
import { IInsightsRepository } from "@/services/contracts/insights.contract";
import { MockInsightsRepository } from "@/services/mock/insights.mock";
import { InsightAnswer, InsightSummary } from "@/types/insight";
import { apiFetch } from "@/lib/client/api-fetch";

/** POST /insights/ask devolve { answer: null, message } quando nenhuma regra determinística casa com a pergunta — sem o campo `id`. Nesse caso o contrato do front-end espera `null`. */
type AskResponse = InsightAnswer | { answer: null; message: string };

class ApiInsightsRepository implements IInsightsRepository {
  async getSuggestedQuestions(): Promise<string[]> {
    return apiFetch<string[]>("/api/insights/suggested-questions");
  }
  async getAutoInsights(): Promise<InsightSummary[]> {
    return apiFetch<InsightSummary[]>("/api/insights/auto");
  }
  async ask(question: string): Promise<InsightAnswer | null> {
    const response = await apiFetch<AskResponse>("/api/insights/ask", {
      method: "POST",
      body: JSON.stringify({ question }),
    });
    return "id" in response ? response : null;
  }
}

export function getInsightsRepository(): IInsightsRepository {
  return appConfig.dataSource === "mock" ? new MockInsightsRepository() : new ApiInsightsRepository();
}
