"use client";

import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { GlobalFiltersBar } from "@/components/filters/global-filters-bar";
import { useGlobalFilters } from "@/hooks/use-global-filters";
import { useBeezzData } from "@/hooks/use-beezz-data";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { KpiCard } from "@/components/shared/kpi-card";
import { SectionCard } from "@/components/shared/section-card";
import { AreaChartCard } from "@/components/charts/area-chart-card";
import { DataTable } from "@/components/tables/data-table";
import { beezzColumns } from "@/components/tables/columns/beezz-columns";
import { RankingList } from "@/components/dashboard/ranking-list";
import { ExportButtons } from "@/components/shared/export-buttons";
import { CHART_COLORS } from "@/lib/chart-colors";

export default function BeezzPage() {
  const filters = useGlobalFilters();
  const { data, isLoading, isError } = useBeezzData(filters);

  return (
    <RouteGuard permission="beezz.view">
      <PageHeader
        title="Beezz"
        description="Publicações espontâneas dos colaboradores na intranet: atividade, curtidas e comentários."
        actions={<ExportButtons label="Beezz" />}
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

            <SectionCard title="Linha do tempo de atividade">
              <AreaChartCard data={data.activityTimeline} color={CHART_COLORS.primary} />
            </SectionCard>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <SectionCard title="Mais curtidos">
                <RankingList items={data.topLiked} />
              </SectionCard>
              <SectionCard title="Mais comentados">
                <RankingList items={data.topCommented} />
              </SectionCard>
              <SectionCard title="Ranking de criadores" description="Não representa avaliação de desempenho individual.">
                <RankingList items={data.topCreators} />
              </SectionCard>
            </div>

            <SectionCard title="Publicações">
              <DataTable columns={beezzColumns} data={data.posts} searchPlaceholder="Buscar Beezz..." />
            </SectionCard>
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}
