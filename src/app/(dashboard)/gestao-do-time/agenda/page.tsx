"use client";

import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { Badge } from "@/components/ui/badge";
import { TeamNav } from "@/components/team-management/team-nav";
import { useTeamAgenda } from "@/hooks/use-team-agenda";
import { formatDate, formatDateTime, formatPercent } from "@/lib/formatters";
import { CalendarDays } from "lucide-react";

const MEETING_TYPE_LABEL: Record<string, string> = {
  planejamento: "Planejamento",
  aprovacao: "Aprovação",
  evento: "Evento",
  alinhamento: "Alinhamento",
};

function meetingHours(startIso: string, endIso: string): number {
  return (new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60 * 60);
}

export default function GestaoDoTimeAgendaPage() {
  const { data, isLoading, isError } = useTeamAgenda();

  const grouped = data
    ? data.meetings.reduce<Record<string, typeof data.meetings>>((acc, m) => {
        const day = m.start.slice(0, 10);
        acc[day] = acc[day] ? [...acc[day], m] : [m];
        return acc;
      }, {})
    : {};

  return (
    <RouteGuard permission="team-management.view">
      <PageHeader
        title="Gestão do Time — Agenda"
        description="Agenda INSTITUCIONAL do time de Comunicação (calendário compartilhado) — não é a agenda pessoal de cada pessoa, sem lista de participantes individuais."
      />
      <TeamNav />

      <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data} partialCoverage={data?.partialCoverage}>
        {data && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-card border border-border bg-surface p-4">
                <p className="text-xs text-text-secondary">Horas em reunião (janela de 6 semanas)</p>
                <p className="text-xl font-semibold text-text-primary mt-1">{data.hoursInPeriod.toFixed(1)}h</p>
              </div>
              <div className="rounded-card border border-border bg-surface p-4">
                <p className="text-xs text-text-secondary">Reuniões por semana</p>
                <p className="text-xl font-semibold text-text-primary mt-1">{data.meetingsPerWeek != null ? data.meetingsPerWeek.toFixed(1) : "—"}</p>
              </div>
              <div className="rounded-card border border-border bg-surface p-4">
                <p className="text-xs text-text-secondary">Densidade de agenda</p>
                <p className="text-xl font-semibold text-text-primary mt-1">{data.density != null ? formatPercent(data.density) : "—"}</p>
              </div>
              <div className="rounded-card border border-border bg-surface p-4">
                <p className="text-xs text-text-secondary">Capacidade semanal do time</p>
                <p className="text-xl font-semibold text-text-primary mt-1">{data.capacityHoursPerWeek}h</p>
              </div>
            </div>

            <SectionCard title="Reuniões por dia" description="Últimas 3 semanas e próximas 3 semanas.">
              {Object.keys(grouped).length === 0 ? (
                <p className="text-sm text-text-secondary py-4 text-center">Nenhuma reunião no período.</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(grouped)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([day, meetings]) => (
                      <div key={day}>
                        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatDate(day)}
                        </p>
                        <ul className="space-y-2">
                          {meetings.map((m) => (
                            <li key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-2.5">
                              <div className="min-w-0">
                                <p className={`text-sm font-medium ${m.isCancelled ? "line-through text-text-secondary" : "text-text-primary"}`}>{m.subject}</p>
                                <p className="text-xs text-text-secondary mt-0.5">
                                  {formatDateTime(m.start)} · {meetingHours(m.start, m.end).toFixed(1)}h · {m.location}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {m.isCancelled && <Badge tone="neutral">Cancelada</Badge>}
                                <Badge tone="info">{MEETING_TYPE_LABEL[m.meetingType]}</Badge>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}
