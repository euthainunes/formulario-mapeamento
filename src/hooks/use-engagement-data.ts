"use client";

import { useQuery } from "@tanstack/react-query";
import { getEngagementRepository } from "@/services/repositories/engagement.repository";
import { GlobalFilters } from "@/types/filters";

export function useEngagementData(filters: GlobalFilters) {
  return useQuery({
    queryKey: ["engagement", filters],
    queryFn: () => getEngagementRepository().getEngagementData(filters),
  });
}
