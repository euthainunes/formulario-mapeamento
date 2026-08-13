"use client";

import { History } from "lucide-react";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { useAuditLog } from "@/hooks/use-admin";
import { formatDateTime } from "@/lib/formatters";

export default function AuditoriaPage() {
  const { data, isLoading, isError } = useAuditLog();

  return (
    <RouteGuard permission="admin.audit.view">
      <PageHeader title="Administração — Auditoria" description="Trilha de ações realizadas na plataforma (dados simulados)." />
      <AdminNav />

      <SectionCard title="Linha do tempo">
        <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data || data.length === 0}>
          {data && (
            <ol className="relative border-l border-border pl-5 space-y-5">
              {data.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[26px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-primary/10">
                    <History className="h-2.5 w-2.5 text-brand-primary" />
                  </span>
                  <p className="text-sm text-text-primary">
                    <strong>{entry.actor}</strong> {entry.action.toLowerCase()} — <span className="text-text-secondary">{entry.target}</span>
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">{formatDateTime(entry.timestamp)}</p>
                </li>
              ))}
            </ol>
          )}
        </StateWrapper>
      </SectionCard>
    </RouteGuard>
  );
}
