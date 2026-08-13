"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { PermissionKey } from "@/types/auth";
import { useAuth } from "@/hooks/use-auth";
import { usePermission } from "@/hooks/use-permission";

interface RouteGuardProps {
  permission: PermissionKey;
  children: ReactNode;
}

export function RouteGuard({ permission, children }: RouteGuardProps) {
  const { isAuthenticated } = useAuth();
  const allowed = usePermission(permission);
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="h-10 w-10 text-text-secondary" />
        <p className="text-base font-medium text-text-primary">Acesso não disponível para o seu perfil</p>
        <p className="text-sm text-text-secondary max-w-sm">
          Esta área requer uma permissão que o perfil atual não possui neste ambiente demonstrativo.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
