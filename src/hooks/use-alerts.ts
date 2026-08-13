"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAlertsRepository } from "@/services/repositories/alerts.repository";
import { AlertRule, AlertStatus } from "@/types/alert";

export function useAlertRules() {
  return useQuery({
    queryKey: ["alert-rules"],
    queryFn: () => getAlertsRepository().listRules(),
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => getAlertsRepository().listAlerts(),
  });
}

export function useCreateAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rule: Omit<AlertRule, "id" | "createdAt">) => getAlertsRepository().createRule(rule),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alert-rules"] }),
  });
}

export function useUpdateAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<AlertRule> }) => getAlertsRepository().updateRule(id, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alert-rules"] }),
  });
}

export function useDeleteAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getAlertsRepository().deleteRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alert-rules"] }),
  });
}

export function useUpdateAlertStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, changedBy, note }: { id: string; status: AlertStatus; changedBy: string; note?: string }) =>
      getAlertsRepository().updateAlertStatus(id, status, changedBy, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });
}
