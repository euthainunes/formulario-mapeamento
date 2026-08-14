"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeamManagementRepository } from "@/services/repositories/team-management.repository";

export function useTeamCampaigns() {
  return useQuery({
    queryKey: ["team-management", "campaigns"],
    queryFn: () => getTeamManagementRepository().getCampaigns(),
  });
}

export function useTeamCampaignDetail(campaignId: string) {
  return useQuery({
    queryKey: ["team-management", "campaign-detail", campaignId],
    queryFn: () => getTeamManagementRepository().getCampaignDetail(campaignId),
    enabled: Boolean(campaignId),
  });
}
