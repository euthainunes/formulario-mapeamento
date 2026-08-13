"use client";

import { useQuery } from "@tanstack/react-query";
import { getRecognitionRepository } from "@/services/repositories/recognition.repository";

export function useRecognitionData(month: number, year: number) {
  return useQuery({
    queryKey: ["recognition", month, year],
    queryFn: () => getRecognitionRepository().getRecognitionData(month, year),
  });
}
