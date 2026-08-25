"use client";

import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { GlobalFiltersBar } from "@/components/filters/global-filters-bar";
import { useGlobalFilters } from "@/hooks/use-global-filters";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { KpiCard, HeroKpiCard } from "@/components/shared/kpi-card";
import { SectionCard } from "@/components/shared/section-card";
import { LineChartCard } from "@/components/charts/line-chart-card";
import { AreaChartCard } from "@/components/charts/area-chart-card";
import { StackedBarChartCard } from "@/components/charts/stacked-bar-chart-card";
import { DonutChartCard } from "@/components/charts/donut-chart-card";
import { RankingList } from "@/components/dashboard/ranking-list";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { SyncStatusCard } from "@/components/dashboard/sync-status-card";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CHART_COLORS } from "@/lib/chart-colors";
import { appConfig } from "@/lib/app-config";
import { isLongRange } from "@/lib/date-range";
import { formatMonthLabel } from "@/lib/formatters";

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <Skeleton className="h-32 w-full lg:col-span-1" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardExecutivoPage() {
  const filters = useGlobalFilters();
  const { data, isLoading, isError } = useDashboardData(filters);
  const dateFormatter = isLongRange(filters.dateRange) ? formatMonthLabel : undefined;

  const heroKpi = data?.kpis.find((k) => k.id === "active-users");
  const supportingKpis = data?.kpis.filter((k) => k.id !== "active-users") ?? [];

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
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {heroKpi && (
                <div className="lg:col-span-1">
                  <HeroKpiCard kpi={heroKpi} />
                </div>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-2">
                {supportingKpis.map((kpi) => (
                  <KpiCard key={kpi.id} kpi={kpi} />
                ))}
              </div>
            </div>

            <SectionCard title="Tendências" description="Evolução no período selecionado.">
              <Tabs
                items={[
                  {
                    value: "acessos",
                    label: "Acessos",
                    content: <LineChartCard data={data.accessEvolution} color={CHART_COLORS.primary} dateFormatter={dateFormatter} />,
                  },
                  {
                    value: "ativos",
                    label: "Usuários ativos",
                    content: <AreaChartCard data={data.activeUsersEvolution} color={CHART_COLORS.info} dateFormatter={dateFormatter} />,
                  },
                ]}
              />
            </SectionCard>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Dispositivos" description="Distribuição de colaboradores por tipo de dispositivo.">
                <DonutChartCard data={data.deviceBreakdown.map((d) => ({ label: d.device, value: d.count }))} />
              </SectionCard>

              <SectionCard title="Destaques do período">
                <Tabs
                  items={[
                    { value: "conteudo", label: "Conteúdo", content: <RankingList items={data.topContent} /> },
                    { value: "beezz", label: "Beezz", content: <RankingList items={data.topBeezz} /> },
                    { value: "pods", label: "Comunidades", content: <RankingList items={data.topPods} /> },
                  ]}
                />
              </SectionCard>
            </div>

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
