"use client";

import { ReactNode } from "react";
import { PermissionKey } from "@/types/auth";
import { usePermission } from "@/hooks/use-permission";

interface CanProps {
  permission: PermissionKey;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Esconde/mostra conteúdo com base na permissão do usuário logado (RBAC visual). */
export function Can({ permission, children, fallback = null }: CanProps) {
  const allowed = usePermission(permission);
  return allowed ? <>{children}</> : <>{fallback}</>;
}
