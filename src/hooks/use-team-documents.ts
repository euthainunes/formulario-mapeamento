"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeamManagementRepository } from "@/services/repositories/team-management.repository";

export function useTeamDocuments() {
  return useQuery({
    queryKey: ["team-management", "documents"],
    queryFn: () => getTeamManagementRepository().getDocuments(),
  });
}
