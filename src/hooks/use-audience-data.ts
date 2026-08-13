"use client";

import { useQuery } from "@tanstack/react-query";
import { getAudienceRepository } from "@/services/repositories/audience.repository";
import { GlobalFilters } from "@/types/filters";

export function useAudienceData(filters: GlobalFilters) {
  return useQuery({
    queryKey: ["audience", filters],
    queryFn: () => getAudienceRepository().getAudienceData(filters),
  });
}
