"use client";

import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { GlobalFiltersBar } from "@/components/filters/global-filters-bar";
import { useGlobalFilters } from "@/hooks/use-global-filters";
import { useEngagementData } from "@/hooks/use-engagement-data";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { KpiCard } from "@/components/shared/kpi-card";
import { SectionCard } from "@/components/shared/section-card";
import { LineChartCard } from "@/components/charts/line-chart-card";
import { StackedBarChartCard } from "@/components/charts/stacked-bar-chart-card";
import { DataTable } from "@/components/tables/data-table";
import { reactionColumns } from "@/components/tables/columns/reactions-columns";
import { ExportButtons } from "@/components/shared/export-buttons";
import { CHART_COLORS } from "@/lib/chart-colors";

export default function EngajamentoPage() {
  const filters = useGlobalFilters();
  const { data, isLoading, isError } = useEngagementData(filters);

  return (
    <RouteGuard permission="engagement.view">
      <PageHeader
        title="Engajamento e Reações"
        description="Consolidado das 12 métricas de reação registradas na intranet BeeHome."
        actions={<ExportButtons label="engajamento" />}
      />
      <GlobalFiltersBar />

      <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data} partialCoverage={data?.partialCoverage}>
        {data && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {data.kpis.map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>

            <SectionCard title="Evolução de interações">
              <LineChartCard data={data.evolution} color={CHART_COLORS.primary} />
            </SectionCard>

            <SectionCard title="Interações por tipo de conteúdo">
              <StackedBarChartCard
                data={data.byContentType}
                series={[
                  { key: "beezz", label: "Beezz", color: CHART_COLORS.primary },
                  { key: "news", label: "Notícias", color: CHART_COLORS.info },
                  { key: "video", label: "Vídeo", color: CHART_COLORS.success },
                  { key: "outros", label: "Outros", color: CHART_COLORS.warning },
                ]}
              />
            </SectionCard>

            <SectionCard title="Tipos de reação" description="Os 12 identificadores de reação definidos na especificação de dados.">
              <DataTable columns={reactionColumns} data={data.reactionTotals} searchPlaceholder="Buscar tipo de reação..." pageSize={12} />
            </SectionCard>
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}
