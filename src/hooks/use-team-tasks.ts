"use client";

import { useQuery } from "@tanstack/react-query";
import { getTeamManagementRepository } from "@/services/repositories/team-management.repository";

export function useTeamTaskList() {
  return useQuery({
    queryKey: ["team-management", "tasks"],
    queryFn: () => getTeamManagementRepository().getTaskList(),
  });
}

export function useTeamTaskDetail(taskId: string | null) {
  return useQuery({
    queryKey: ["team-management", "task-detail", taskId],
    queryFn: () => getTeamManagementRepository().getTaskDetail(taskId as string),
    enabled: taskId != null,
  });
}
