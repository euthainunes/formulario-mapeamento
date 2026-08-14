"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeamManagementRepository } from "@/services/repositories/team-management.repository";

export function useTeamWorkload() {
  return useQuery({
    queryKey: ["team-management", "workload"],
    queryFn: () => getTeamManagementRepository().getWorkload(),
  });
}
