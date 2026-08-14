"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, BrainCircuit, CalendarClock, FileStack } from "lucide-react";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { KpiCard } from "@/components/shared/kpi-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StackedBarChartCard } from "@/components/charts/stacked-bar-chart-card";
import { CHART_COLORS } from "@/lib/chart-colors";
import { TeamNav } from "@/components/team-management/team-nav";
import { IntegrationNotice } from "@/components/team-management/integration-notice";
import { OperationScoreCard } from "@/components/team-management/operation-score-card";
import { TeamAlertsPanel } from "@/components/team-management/team-alerts-panel";
import { CriticalityBadge } from "@/components/team-management/campaign-badge";
import { TeamInsightAnswerCard } from "@/components/team-management/team-insight-answer-card";
import { QuestionList } from "@/components/insights/question-list";
import { useTeamOverview } from "@/hooks/use-team-overview";
import { useTeamSuggestedQuestions, useAskTeamOperationQuestion } from "@/hooks/use-team-insights";
import { TeamInsightAnswer } from "@/services/contracts/team-management.contract";
import { formatPercent } from "@/lib/formatters";

export default function GestaoDoTimePage() {
  const { data, isLoading, isError } = useTeamOverview();
  const { data: questions } = useTeamSuggestedQuestions();
  const askQuestion = useAskTeamOperationQuestion();
  const [input, setInput] = useState("");
  const [conversation, setConversation] = useState<{ question: string; answer: TeamInsightAnswer | null }[]>([]);

  function handleAsk(question: string) {
    if (!question.trim()) return;
    askQuestion.mutate(question, {
      onSuccess: (answer) => {
        setConversation((prev) => [{ question, answer }, ...prev]);
        setInput("");
      },
    });
  }

  return (
    <RouteGuard permission="team-management.view">
      <PageHeader
        title="Gestão do Time"
        description="Painel inteligente de gestão de atividades do time de Comunicação Interna e Endomarketing."
      />
      <TeamNav />
      <IntegrationNotice />

      <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data} partialCoverage={data?.partialCoverage}>
        {data && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <OperationScoreCard score={data.score} />
              </div>
              <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {data.kpis.map((kpi) => (
                  <KpiCard key={kpi.id} kpi={kpi} />
                ))}
              </div>
            </div>

            <SectionCard title="Entradas x entregas" description="Tarefas criadas e concluídas por semana, nas últimas 8 semanas.">
              <StackedBarChartCard
                data={data.weeklyTrend}
                series={[
                  { key: "entradas", label: "Entradas", color: CHART_COLORS.info },
                  { key: "entregas", label: "Entregas", color: CHART_COLORS.success },
                ]}
              />
            </SectionCard>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Campanhas em risco" description="Maiores scores de risco entre as campanhas ativas.">
                {data.riskCampaigns.length === 0 ? (
                  <p className="text-sm text-text-secondary py-4 text-center">Nenhuma campanha em risco relevante no momento.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.riskCampaigns.map((c) => (
                      <li key={c.campaign.id}>
                        <Link
                          href={`/gestao-do-time/campanhas/${c.campaign.id}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 hover:border-brand-primary transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{c.campaign.name}</p>
                            <p className="text-xs text-text-secondary mt-0.5">{c.risk.signals[0]}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <CriticalityBadge criticality={c.campaign.criticality} />
                            <Badge tone={c.risk.score >= 80 ? "critical" : "warning"}>Risco {c.risk.score}</Badge>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>

              <SectionCard title="Alertas críticos" description="Gerados por regra a partir dos dados do Planner simulado.">
                <TeamAlertsPanel alerts={data.criticalAlerts} />
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Agenda institucional da semana" description="Calendário compartilhado do time — sem participantes individuais.">
                <div className="flex items-start gap-3">
                  <CalendarClock className="h-8 w-8 text-brand-primary shrink-0" />
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div>
                      <p className="text-xs text-text-secondary">Horas em reunião (próx. 7 dias)</p>
                      <p className="text-lg font-semibold text-text-primary">{data.agendaSummary.hoursNext7Days.toFixed(1)}h</p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Reuniões por semana</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {data.agendaSummary.meetingsPerWeek != null ? data.agendaSummary.meetingsPerWeek.toFixed(1) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Densidade de agenda</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {data.agendaSummary.density != null ? formatPercent(data.agendaSummary.density) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Capacidade semanal</p>
                      <p className="text-lg font-semibold text-text-primary">{data.agendaSummary.capacityHoursPerWeek}h</p>
                    </div>
                  </div>
                </div>
                <Link href="/gestao-do-time/agenda" className="text-xs font-medium text-brand-primary hover:underline mt-3 inline-block">
                  Ver agenda completa
                </Link>
              </SectionCard>

              <SectionCard title="Saúde documental" description="Cobertura de documentos vinculados às campanhas (SharePoint simulado).">
                <div className="flex items-start gap-3">
                  <FileStack className="h-8 w-8 text-brand-primary shrink-0" />
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div>
                      <p className="text-xs text-text-secondary">Cobertura documental</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {data.documentSummary.coverage.rate != null ? formatPercent(data.documentSummary.coverage.rate) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-secondary">Documentos desatualizados</p>
                      <p className="text-lg font-semibold text-text-primary">
                        {data.documentSummary.staleCount} de {data.documentSummary.totalCount}
                      </p>
                    </div>
                  </div>
                </div>
                <Link href="/gestao-do-time/documentos" className="text-xs font-medium text-brand-primary hover:underline mt-3 inline-block">
                  Ver documentos
                </Link>
              </SectionCard>
            </div>

            <SectionCard title="Insights automáticos" description="Observações calculadas por regra a partir dos dados desta visão geral.">
              {data.autoInsights.length === 0 ? (
                <p className="text-sm text-text-secondary py-2 text-center">Nenhum insight automático relevante no momento.</p>
              ) : (
                <ul className="space-y-2.5">
                  {data.autoInsights.map((text, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-text-primary">
                      <BrainCircuit className="h-4 w-4 mt-0.5 shrink-0 text-brand-primary" />
                      {text}
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard
              title="Perguntas sobre a operação"
              description="Respostas por regras determinísticas sobre os dados mockados — não é uma IA conversacional livre, nenhuma chamada externa é feita."
            >
              <div className="space-y-4">
                <QuestionList questions={questions ?? []} onSelect={handleAsk} />
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAsk(input);
                  }}
                  className="flex items-center gap-2"
                >
                  <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ex.: Quais atividades estão atrasadas?" />
                  <Button type="submit" disabled={askQuestion.isPending}>
                    <Send className="h-4 w-4" />
                    {askQuestion.isPending ? "Enviando..." : "Perguntar"}
                  </Button>
                </form>
                <div className="space-y-3">
                  {conversation.map((item, idx) =>
                    item.answer ? (
                      <TeamInsightAnswerCard key={idx} answer={item.answer} />
                    ) : (
                      <div key={idx} className="flex items-start gap-2 rounded-lg border border-border bg-surface p-4 text-sm">
                        <BrainCircuit className="h-4 w-4 text-text-secondary shrink-0 mt-0.5" />
                        <div>
                          <p className="text-text-primary font-medium mb-1">{item.question}</p>
                          <p className="text-text-secondary">
                            Não há regra cadastrada para essa pergunta nesta versão. Tente uma das perguntas sugeridas acima.
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}
