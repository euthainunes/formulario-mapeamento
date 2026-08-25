"use client";

import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { GlobalFiltersBar } from "@/components/filters/global-filters-bar";
import { useGlobalFilters } from "@/hooks/use-global-filters";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { KpiCard } from "@/components/shared/kpi-card";
import { SectionCard } from "@/components/shared/section-card";
import { LineChartCard } from "@/components/charts/line-chart-card";
import { AreaChartCard } from "@/components/charts/area-chart-card";
import { StackedBarChartCard } from "@/components/charts/stacked-bar-chart-card";
import { DonutChartCard } from "@/components/charts/donut-chart-card";
import { RankingList } from "@/components/dashboard/ranking-list";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { SyncStatusCard } from "@/components/dashboard/sync-status-card";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_COLORS } from "@/lib/chart-colors";
import { appConfig } from "@/lib/app-config";
import { isLongRange } from "@/lib/date-range";
import { formatMonthLabel } from "@/lib/formatters";

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-28 w-full" />
      ))}
    </div>
  );
}

export default function DashboardExecutivoPage() {
  const filters = useGlobalFilters();
  const { data, isLoading, isError } = useDashboardData(filters);
  const dateFormatter = isLongRange(filters.dateRange) ? formatMonthLabel : undefined;

  return (
    <RouteGuard permission="dashboard.view">
      <PageHeader
        title="Dashboard Executivo"
        description={
          appConfig.dataSource === "mock"
            ? "Visão consolidada da Comunicação Interna a partir de dados simulados da Intranet BeeHome."
            : "Visão consolidada da Comunicação Interna a partir de dados reais da Intranet BeeHome."
        }
      />
      <GlobalFiltersBar />

      <StateWrapper
        isLoading={isLoading}
        isError={isError}
        isEmpty={!data}
        partialCoverage={data?.partialCoverage}
        loadingSkeleton={<KpiSkeleton />}
      >
        {data && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {data.kpis.map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Evolução de acessos" description="Total de acessos por data no período selecionado.">
                <LineChartCard data={data.accessEvolution} color={CHART_COLORS.primary} dateFormatter={dateFormatter} />
              </SectionCard>
              <SectionCard title="Evolução de usuários ativos" description="Colaboradores distintos com acesso registrado por dia.">
                <AreaChartCard data={data.activeUsersEvolution} color={CHART_COLORS.info} dateFormatter={dateFormatter} />
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {data.engagementByType.length > 0 && (
                <SectionCard title="Engajamento por tipo" description="Interações agrupadas por categoria de conteúdo, por data.">
                  <StackedBarChartCard
                    data={data.engagementByType}
                    series={[
                      { key: "beezz", label: "Beezz", color: CHART_COLORS.primary },
                      { key: "news", label: "Notícias", color: CHART_COLORS.info },
                      { key: "video", label: "Vídeo", color: CHART_COLORS.success },
                      { key: "outros", label: "Outros", color: CHART_COLORS.warning },
                    ]}
                  />
                </SectionCard>
              )}
              <SectionCard title="Dispositivos" description="Distribuição de colaboradores por tipo de dispositivo.">
                <DonutChartCard data={data.deviceBreakdown.map((d) => ({ label: d.device, value: d.count }))} />
              </SectionCard>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <SectionCard title="Conteúdos mais acessados">
                <RankingList items={data.topContent} />
              </SectionCard>
              <SectionCard title="Beezz em destaque">
                <RankingList items={data.topBeezz} />
              </SectionCard>
              <SectionCard title="Pods mais acessados">
                <RankingList items={data.topPods} />
              </SectionCard>
            </div>

            {(data.bottomContent.length > 0 || data.bottomBeezz.length > 0 || data.bottomPods.length > 0) && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {data.bottomContent.length > 0 && (
                  <SectionCard title="Conteúdos menos acessados">
                    <RankingList items={data.bottomContent} />
                  </SectionCard>
                )}
                {data.bottomBeezz.length > 0 && (
                  <SectionCard title="Beezz menos acessados">
                    <RankingList items={data.bottomBeezz} />
                  </SectionCard>
                )}
                {data.bottomPods.length > 0 && (
                  <SectionCard title="Pods menos acessados">
                    <RankingList items={data.bottomPods} />
                  </SectionCard>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {data.priorityAlerts.length > 0 && (
                <SectionCard title="Alertas prioritários" className="lg:col-span-1">
                  <AlertsPanel alerts={data.priorityAlerts} />
                </SectionCard>
              )}
              <SectionCard title="Insights automáticos" className="lg:col-span-1">
                <InsightsPanel insights={data.autoInsights} />
              </SectionCard>
              <SectionCard title="Última sincronização" className="lg:col-span-1">
                <SyncStatusCard status={data.syncStatus} />
              </SectionCard>
            </div>
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}
