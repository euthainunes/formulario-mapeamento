"use client";

import { useQuery } from "@tanstack/react-query";
import { getSyncRepository } from "@/services/repositories/sync.repository";

export function useSyncStatus() {
  return useQuery({
    queryKey: ["sync-status"],
    queryFn: () => getSyncRepository().getLatestStatus(),
  });
}

export function useSyncJobs() {
  return useQuery({
    queryKey: ["sync-jobs"],
    queryFn: () => getSyncRepository().listJobs(),
  });
}
