"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { Badge } from "@/components/ui/badge";
import { TeamNav } from "@/components/team-management/team-nav";
import { CriticalityBadge } from "@/components/team-management/campaign-badge";
import { AvatarGroup } from "@/components/team-management/avatar-group";
import { TaskRiskBadges } from "@/components/team-management/risk-badges";
import { TaskDetailModal } from "@/components/team-management/task-detail-modal";
import { useTeamCampaignDetail } from "@/hooks/use-team-campaigns";
import { formatDate, formatDateTime, formatPercent } from "@/lib/formatters";
import { TASK_PRIORITY_LABELS } from "@/types/team-management";

const STATUS_LABEL: Record<string, string> = {
  planejamento: "Planejamento",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const EVENT_LABEL: Record<string, string> = {
  created: "Criada",
  status_changed: "Status alterado",
  due_date_changed: "Prazo alterado",
  assignee_changed: "Responsável alterado",
  completed: "Concluída",
  reopened: "Reaberta",
};

export default function GestaoDoTimeCampanhaDetalhePage() {
  const params = useParams<{ id: string }>();
  const campaignId = params.id;
  const { data, isLoading, isError } = useTeamCampaignDetail(campaignId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  return (
    <RouteGuard permission="team-management.view">
      <PageHeader title={data ? data.campaign.name : "Gestão do Time — Campanha"} description="Detalhe de campanha: tarefas, histórico, reuniões e documentos vinculados." />
      <TeamNav />

      <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data} emptyMessage="Campanha não encontrada.">
        {data && (
          <div className="space-y-5">
            <SectionCard title="Resumo">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge tone="neutral">{STATUS_LABEL[data.campaign.status]}</Badge>
                <Badge tone="neutral">{data.campaign.type}</Badge>
                <CriticalityBadge criticality={data.campaign.criticality} />
                <Badge tone={data.risk.score >= 60 ? (data.risk.score >= 80 ? "critical" : "warning") : "success"}>Risco {data.risk.score}/100</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs mb-4">
                <div>
                  <p className="text-text-secondary">Owner</p>
                  <p className="text-text-primary font-medium">{data.campaign.ownerName}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Início</p>
                  <p className="text-text-primary font-medium">{formatDate(data.campaign.startDate)}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Prazo final</p>
                  <p className="text-text-primary font-medium">{formatDate(data.campaign.targetDate)}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Progresso ponderado</p>
                  <p className="text-text-primary font-medium">{data.progress != null ? formatPercent(data.progress) : "—"}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {data.campaign.channel.map((c) => (
                  <Badge key={c} tone="info">
                    {c}
                  </Badge>
                ))}
              </div>

              <p className="text-xs font-medium text-text-secondary mb-1.5">Por que este score de risco?</p>
              <ul className="space-y-1">
                {data.risk.signals.map((s, idx) => (
                  <li key={idx} className="text-xs text-text-primary flex items-start gap-1.5">
                    <span className="text-text-secondary">•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard title={`Tarefas da campanha (${data.tasks.length})`}>
              {data.tasks.length === 0 ? (
                <p className="text-sm text-text-secondary py-4 text-center">Nenhuma tarefa vinculada a esta campanha.</p>
              ) : (
                <ul className="space-y-2">
                  {data.tasks.map((item) => (
                    <li key={item.task.id}>
                      <button
                        onClick={() => setSelectedTaskId(item.task.id)}
                        className="w-full text-left flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:border-brand-primary transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text-primary truncate">{item.task.title}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge tone="neutral">{item.bucketName}</Badge>
                            <Badge tone="neutral">{TASK_PRIORITY_LABELS[item.task.priority]}</Badge>
                            <TaskRiskBadges risk={item.risk} />
                          </div>
                        </div>
                        <AvatarGroup names={item.task.assigneeNames} max={2} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Linha do tempo" description="Alterações relevantes registradas nas tarefas desta campanha.">
                {data.history.length === 0 ? (
                  <p className="text-sm text-text-secondary py-4 text-center">Nenhum evento de histórico registrado.</p>
                ) : (
                  <ul className="space-y-2.5 border-l border-border pl-3">
                    {data.history.map((ev) => (
                      <li key={ev.id} className="text-xs">
                        <span className="text-text-primary font-medium">{EVENT_LABEL[ev.eventType] ?? ev.eventType}</span>
                        {ev.oldValue && ev.newValue && (
                          <span className="text-text-secondary">
                            {" "}
                            — de &quot;{ev.oldValue}&quot; para &quot;{ev.newValue}&quot;
                          </span>
                        )}
                        <span className="block text-text-secondary">{formatDateTime(ev.occurredAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard title="Reuniões ligadas" description="Calendário institucional — sem lista de participantes individuais.">
                {data.meetings.length === 0 ? (
                  <p className="text-sm text-text-secondary py-4 text-center">Nenhuma reunião vinculada a esta campanha.</p>
                ) : (
                  <ul className="space-y-2">
                    {data.meetings.map((m) => (
                      <li key={m.id} className="rounded-lg border border-border p-2.5">
                        <p className="text-sm text-text-primary font-medium">{m.subject}</p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {formatDateTime(m.start)} · {m.location}
                          {m.isCancelled && " · cancelada"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>

            <SectionCard title="Documentos vinculados" description="SharePoint simulado — cobre a saúde documental desta campanha.">
              {data.documents.length === 0 ? (
                <p className="text-sm text-text-secondary py-4 text-center">Nenhum documento vinculado a esta campanha.</p>
              ) : (
                <ul className="space-y-2">
                  {data.documents.map((d) => (
                    <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5">
                      <span className="text-sm text-text-primary truncate">{d.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {d.isStale && <Badge tone="warning">Desatualizado</Badge>}
                        <span className="text-xs text-text-secondary">{formatDate(d.lastModifiedDateTime)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        )}
      </StateWrapper>

      <TaskDetailModal taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
    </RouteGuard>
  );
}
