"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardRepository } from "@/services/repositories/dashboard.repository";
import { GlobalFilters } from "@/types/filters";

export function useDashboardData(filters: GlobalFilters) {
  return useQuery({
    queryKey: ["dashboard-executive", filters],
    queryFn: () => getDashboardRepository().getExecutiveDashboard(filters),
  });
}
