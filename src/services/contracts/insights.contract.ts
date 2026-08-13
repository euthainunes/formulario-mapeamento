import { InsightAnswer, InsightSummary } from "@/types/insight";

export interface IInsightsRepository {
  getSuggestedQuestions(): Promise<string[]>;
  getAutoInsights(): Promise<InsightSummary[]>;
  ask(question: string): Promise<InsightAnswer | null>;
}
