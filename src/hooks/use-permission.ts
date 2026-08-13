"use client";

import { useAuthStore } from "@/store/auth.store";
import { PermissionKey } from "@/types/auth";

export function usePermission(permission: PermissionKey): boolean {
  return useAuthStore((s) => s.can(permission));
}
