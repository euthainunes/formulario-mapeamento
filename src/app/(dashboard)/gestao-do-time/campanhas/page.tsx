"use client";

import Link from "next/link";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { Badge } from "@/components/ui/badge";
import { TeamNav } from "@/components/team-management/team-nav";
import { CriticalityBadge } from "@/components/team-management/campaign-badge";
import { useTeamCampaigns } from "@/hooks/use-team-campaigns";
import { formatDate, formatPercent } from "@/lib/formatters";

const STATUS_LABEL: Record<string, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const DOC_HEALTH_TONE = { alta: "success", media: "warning", baixa: "critical" } as const;
const DOC_HEALTH_LABEL = { alta: "Saúde documental alta", media: "Saúde documental média", baixa: "Saúde documental baixa" } as const;

export default function GestaoDoTimeCampanhasPage() {
  const { data, isLoading, isError } = useTeamCampaigns();

  return (
    <RouteGuard permission="team-management.view">
      <PageHeader title="Gestão do Time — Campanhas" description="Campanhas, projetos e iniciativas de Comunicação Interna com progresso, risco e saúde documental." />
      <TeamNav />

      <SectionCard title="Todas as campanhas">
        <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data || data.campaigns.length === 0} partialCoverage={data?.partialCoverage}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data?.campaigns.map((c) => (
              <Link
                key={c.campaign.id}
                href={`/gestao-do-time/campanhas/${c.campaign.id}`}
                className="rounded-card border border-border bg-surface p-4 hover:border-brand-primary transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold text-text-primary">{c.campaign.name}</p>
                  <CriticalityBadge criticality={c.campaign.criticality} />
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  <Badge tone="neutral">{STATUS_LABEL[c.campaign.status]}</Badge>
                  <Badge tone="neutral">{c.campaign.type}</Badge>
                  <span className="text-xs text-text-secondary">Owner: {c.campaign.ownerName}</span>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
                    <span>Progresso ponderado</span>
                    <span>{c.progress != null ? formatPercent(c.progress) : "—"}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/5 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-primary" style={{ width: `${c.progress ?? 0}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge tone={c.risk.score >= 60 ? (c.risk.score >= 80 ? "critical" : "warning") : "success"}>Risco {c.risk.score}/100</Badge>
                  <Badge tone={DOC_HEALTH_TONE[c.documentHealth.level]}>{DOC_HEALTH_LABEL[c.documentHealth.level]}</Badge>
                  {c.lateTasks.rate != null && c.lateTasks.numerator > 0 && (
                    <Badge tone="warning">{c.lateTasks.numerator} tarefa(s) atrasada(s)</Badge>
                  )}
                </div>

                <p className="text-[11px] text-text-secondary mt-2">Prazo final: {formatDate(c.campaign.targetDate)}</p>
              </Link>
            ))}
          </div>
        </StateWrapper>
      </SectionCard>
    </RouteGuard>
  );
}
