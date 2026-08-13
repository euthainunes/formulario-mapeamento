"use client";

import { useRouter } from "next/navigation";
import { Menu, LogOut, RefreshCw } from "lucide-react";
import { useSidebarStore } from "@/store/sidebar.store";
import { useAuth } from "@/hooks/use-auth";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { DEMO_BADGE_TEXT } from "@/lib/constants";
import { formatDateTime } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data: syncStatus } = useSyncStatus();

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 lg:pl-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 -ml-2 text-text-secondary"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Badge tone="warning" className="shrink-0">
          {DEMO_BADGE_TEXT}
        </Badge>

        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-text-secondary">
          <RefreshCw className="h-3.5 w-3.5" />
          Última sincronização: Simulada em{" "}
          {syncStatus ? formatDateTime(syncStatus.lastSyncAt) : "carregando..."}
        </span>

        <div className="ml-auto flex items-center gap-3">
          {user && (
            <span className="hidden sm:block text-xs text-text-secondary">
              Olá, <strong className="text-text-primary font-medium">{user.name.split(" ")[0]}</strong>
            </span>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
