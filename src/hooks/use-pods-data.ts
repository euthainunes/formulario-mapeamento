"use client";

import { useQuery } from "@tanstack/react-query";
import { getPodsRepository } from "@/services/repositories/pods.repository";
import { GlobalFilters } from "@/types/filters";

export function usePodsData(filters: GlobalFilters) {
  return useQuery({
    queryKey: ["pods", filters],
    queryFn: () => getPodsRepository().getPodsData(filters),
  });
}
