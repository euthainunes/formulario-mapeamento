"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { Badge } from "@/components/ui/badge";
import { useSyncJobs } from "@/hooks/use-sync-status";
import { SyncJob, SyncStatus } from "@/types/sync";
import { formatDateTime, formatNumber } from "@/lib/formatters";

const STATUS_TONE: Record<SyncStatus, "success" | "warning" | "error"> = {
  sucesso: "success",
  parcial: "warning",
  falha: "error",
};

function SyncJobRow({ job }: { job: SyncJob }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-border">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{job.source}</p>
          <p className="text-xs text-text-secondary">
            {formatDateTime(job.startedAt)} → {formatDateTime(job.finishedAt)} · {formatNumber(job.recordsProcessed)} registros
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge tone={STATUS_TONE[job.status]}>{job.status}</Badge>
          {open ? <ChevronUp className="h-4 w-4 text-text-secondary" /> : <ChevronDown className="h-4 w-4 text-text-secondary" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-border px-4 py-3 space-y-1.5">
          {job.logs.map((log) => (
            <p key={log.id} className="text-xs text-text-secondary">
              <span className="text-text-primary font-medium">{formatDateTime(log.timestamp)}</span> — {log.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SincronizacoesPage() {
  const { data, isLoading, isError } = useSyncJobs();

  return (
    <RouteGuard permission="sync.view">
      <PageHeader title="Administração — Sincronizações" description="Histórico de execuções simuladas de sincronização com a Intranet BeeHome." />
      <AdminNav />

      <SectionCard title="Histórico de sincronizações">
        <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data || data.length === 0}>
          {data && (
            <div className="space-y-2">
              {data.map((job) => (
                <SyncJobRow key={job.id} job={job} />
              ))}
            </div>
          )}
        </StateWrapper>
      </SectionCard>
    </RouteGuard>
  );
}
