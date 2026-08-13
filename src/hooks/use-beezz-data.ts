"use client";

import { useQuery } from "@tanstack/react-query";
import { getBeezzRepository } from "@/services/repositories/beezz.repository";
import { GlobalFilters } from "@/types/filters";

export function useBeezzData(filters: GlobalFilters) {
  return useQuery({
    queryKey: ["beezz", filters],
    queryFn: () => getBeezzRepository().getBeezzData(filters),
  });
}
