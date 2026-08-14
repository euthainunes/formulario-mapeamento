"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { getTeamManagementRepository } from "@/services/repositories/team-management.repository";

export function useTeamSuggestedQuestions() {
  return useQuery({
    queryKey: ["team-management", "suggested-questions"],
    queryFn: () => getTeamManagementRepository().getSuggestedQuestions(),
  });
}

export function useAskTeamOperationQuestion() {
  return useMutation({
    mutationFn: (question: string) => getTeamManagementRepository().askOperationQuestion(question),
  });
}
