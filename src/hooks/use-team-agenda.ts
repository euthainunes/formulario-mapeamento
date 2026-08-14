"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeamManagementRepository } from "@/services/repositories/team-management.repository";

export function useTeamAgenda() {
  return useQuery({
    queryKey: ["team-management", "agenda"],
    queryFn: () => getTeamManagementRepository().getAgenda(),
  });
}
