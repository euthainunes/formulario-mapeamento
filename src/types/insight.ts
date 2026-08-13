export interface InsightSummary {
  id: string;
  text: string;
  relatedDashboard?: string;
}

export interface InsightAnswer {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  periodAnalyzed: string;
  metricsUsed: string[];
  relatedDashboardHref: string;
  relatedDashboardLabel: string;
  limitation: string;
}

export interface InsightQuery {
  question: string;
  matchedAnswerId: string | null;
}
