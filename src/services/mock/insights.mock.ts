import { IInsightsRepository } from "@/services/contracts/insights.contract";
import { InsightAnswer, InsightSummary } from "@/types/insight";
import { delay } from "./_shared";
import { SUGGESTED_QUESTIONS, MOCK_AUTO_INSIGHTS, matchInsightAnswer } from "@/mocks/insights.mock";

export class MockInsightsRepository implements IInsightsRepository {
  async getSuggestedQuestions(): Promise<string[]> {
    return delay(SUGGESTED_QUESTIONS);
  }

  async getAutoInsights(): Promise<InsightSummary[]> {
    return delay(MOCK_AUTO_INSIGHTS);
  }

  async ask(question: string): Promise<InsightAnswer | null> {
    return delay(matchInsightAnswer(question), 500, 900);
  }
}
