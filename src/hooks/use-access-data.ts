"use client";

import { useQuery } from "@tanstack/react-query";
import { getAccessRepository } from "@/services/repositories/access.repository";
import { GlobalFilters } from "@/types/filters";

export function useAccessData(filters: GlobalFilters) {
  return useQuery({
    queryKey: ["access", filters],
    queryFn: () => getAccessRepository().getAccessData(filters),
  });
}
