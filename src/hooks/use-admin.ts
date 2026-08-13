"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminRepository } from "@/services/repositories/admin.repository";

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin-users"],
    queryFn: () => getAdminRepository().listUsers(),
  });
}

export function useToggleAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => getAdminRepository().toggleUserActive(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useAuditLog() {
  return useQuery({
    queryKey: ["audit-log"],
    queryFn: () => getAdminRepository().listAuditLog(),
  });
}

export function useIntegrations() {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: () => getAdminRepository().listIntegrations(),
  });
}
