import { IInsightsRepository, InsightAskResult } from "@/services/contracts/insights.contract";
import { InsightSummary } from "@/types/insight";
import { delay } from "./_shared";
import { SUGGESTED_QUESTIONS, MOCK_AUTO_INSIGHTS, matchInsightAnswer } from "@/mocks/insights.mock";

export class MockInsightsRepository implements IInsightsRepository {
  async getSuggestedQuestions(): Promise<string[]> {
    return delay(SUGGESTED_QUESTIONS);
  }

  async getAutoInsights(): Promise<InsightSummary[]> {
    return delay(MOCK_AUTO_INSIGHTS);
  }

  async ask(question: string): Promise<InsightAskResult> {
    const match = matchInsightAnswer(question);
    return delay(match ?? { message: "Pergunta não reconhecida no conjunto de perguntas de demonstração — tente uma das sugeridas." }, 500, 900);
  }
}
