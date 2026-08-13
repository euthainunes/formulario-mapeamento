"use client";

import Link from "next/link";
import { Users, ShieldCheck, Plug, RefreshCw, Bell, ScrollText } from "lucide-react";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminUsers, useIntegrations } from "@/hooks/use-admin";
import { useAlerts } from "@/hooks/use-alerts";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { formatDateTime } from "@/lib/formatters";

const CARDS = [
  { href: "/administracao/usuarios", icon: Users, label: "Usuários" },
  { href: "/administracao/perfis-permissoes", icon: ShieldCheck, label: "Perfis e permissões" },
  { href: "/administracao/integracoes", icon: Plug, label: "Integrações" },
  { href: "/administracao/sincronizacoes", icon: RefreshCw, label: "Sincronizações" },
  { href: "/administracao/alertas", icon: Bell, label: "Alertas" },
  { href: "/administracao/auditoria", icon: ScrollText, label: "Auditoria" },
];

export default function AdministracaoVisaoGeralPage() {
  const { data: users } = useAdminUsers();
  const { data: integrations } = useIntegrations();
  const { data: alerts } = useAlerts();
  const { data: syncStatus } = useSyncStatus();

  const activeUsers = users?.filter((u) => u.active).length ?? 0;
  const connectedIntegrations = integrations?.filter((i) => i.connected).length ?? 0;
  const openAlerts = alerts?.filter((a) => a.status === "novo" || a.status === "em_analise").length ?? 0;

  return (
    <RouteGuard permission="admin.view">
      <PageHeader title="Administração" description="Visão geral das áreas administrativas da plataforma." />
      <AdminNav />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-text-secondary">Usuários ativos</p>
            <p className="text-2xl font-semibold text-text-primary mt-1">{activeUsers}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-text-secondary">Integrações conectadas</p>
            <p className="text-2xl font-semibold text-text-primary mt-1">{connectedIntegrations} de {integrations?.length ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-text-secondary">Alertas em aberto</p>
            <p className="text-2xl font-semibold text-text-primary mt-1">{openAlerts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-text-secondary">Última sincronização</p>
            <p className="text-sm font-semibold text-text-primary mt-1">
              {syncStatus ? formatDateTime(syncStatus.lastSyncAt) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex flex-col items-center gap-2 rounded-card border border-border bg-surface p-4 text-center transition-colors hover:border-brand-primary hover:bg-brand-primary/5"
          >
            <c.icon className="h-5 w-5 text-brand-primary" />
            <span className="text-xs font-medium text-text-primary">{c.label}</span>
          </Link>
        ))}
      </div>
    </RouteGuard>
  );
}
