"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeamManagementRepository } from "@/services/repositories/team-management.repository";

export function useTeamBoard() {
  return useQuery({
    queryKey: ["team-management", "board"],
    queryFn: () => getTeamManagementRepository().getBoard(),
  });
}
