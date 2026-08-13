"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { getInsightsRepository } from "@/services/repositories/insights.repository";

export function useSuggestedQuestions() {
  return useQuery({
    queryKey: ["insights-suggested"],
    queryFn: () => getInsightsRepository().getSuggestedQuestions(),
  });
}

export function useAutoInsights() {
  return useQuery({
    queryKey: ["insights-auto"],
    queryFn: () => getInsightsRepository().getAutoInsights(),
  });
}

export function useAskInsight() {
  return useMutation({
    mutationFn: (question: string) => getInsightsRepository().ask(question),
  });
}
