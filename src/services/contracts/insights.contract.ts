import { InsightAnswer, InsightSummary } from "@/types/insight";

/** Quando não há dado suficiente pra responder, o motivo (`message`) é preservado — nunca descartado como um `null` genérico. */
export type InsightAskResult = InsightAnswer | { message: string };

export interface IInsightsRepository {
  getSuggestedQuestions(): Promise<string[]>;
  getAutoInsights(): Promise<InsightSummary[]>;
  ask(question: string): Promise<InsightAskResult>;
}
