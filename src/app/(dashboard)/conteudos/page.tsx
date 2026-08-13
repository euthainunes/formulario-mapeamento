"use client";

import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { GlobalFiltersBar } from "@/components/filters/global-filters-bar";
import { useGlobalFilters } from "@/hooks/use-global-filters";
import { useContentData } from "@/hooks/use-content-data";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { KpiCard } from "@/components/shared/kpi-card";
import { SectionCard } from "@/components/shared/section-card";
import { LineChartCard } from "@/components/charts/line-chart-card";
import { BarChartCard } from "@/components/charts/bar-chart-card";
import { DataTable } from "@/components/tables/data-table";
import { contentColumns } from "@/components/tables/columns/content-columns";
import { ExportButtons } from "@/components/shared/export-buttons";
import { Tabs } from "@/components/ui/tabs";
import { CHART_COLORS } from "@/lib/chart-colors";
import { Info } from "lucide-react";

export default function ConteudosPage() {
  const filters = useGlobalFilters();
  const { data, isLoading, isError } = useContentData(filters);

  return (
    <RouteGuard permission="content.view">
      <PageHeader
        title="Conteúdos e Notícias"
        description="Desempenho de publicações da intranet: notícias, vídeos, enquetes, photobooks, blog e podcast."
        actions={<ExportButtons label="conteúdos" />}
      />
      <GlobalFiltersBar />

      <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data} partialCoverage={data?.partialCoverage}>
        {data && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
              {data.kpis.map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/5 p-3 text-xs text-text-secondary">
              <Info className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p>
                A <strong>taxa de engajamento por conteúdo</strong> está indisponível nesta versão: aguardando
                aprovação de fórmula pela área de Comunicação.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Publicações por data">
                <LineChartCard data={data.publicationsByDate} color={CHART_COLORS.primary} />
              </SectionCard>
              <SectionCard title="Distribuição de desempenho">
                <BarChartCard
                  data={data.performanceDistribution.map((p) => ({ label: p.bucket, value: p.count }))}
                  color={CHART_COLORS.info}
                />
              </SectionCard>
            </div>

            <SectionCard title="Conteúdos" description="Explore por visão geral ou rankings específicos.">
              <Tabs
                items={[
                  {
                    value: "geral",
                    label: "Visão geral",
                    content: <DataTable columns={contentColumns} data={data.items} searchPlaceholder="Buscar conteúdo..." />,
                  },
                  {
                    value: "vistos",
                    label: "Mais vistos",
                    content: <DataTable columns={contentColumns} data={data.mostViewed} searchPlaceholder="Buscar conteúdo..." />,
                  },
                  {
                    value: "curtidos",
                    label: "Mais curtidos",
                    content: <DataTable columns={contentColumns} data={data.mostLiked} searchPlaceholder="Buscar conteúdo..." />,
                  },
                  {
                    value: "comentados",
                    label: "Mais comentados",
                    content: <DataTable columns={contentColumns} data={data.mostCommented} searchPlaceholder="Buscar conteúdo..." />,
                  },
                  {
                    value: "comparativo",
                    label: "Comparativo",
                    content: (
                      <BarChartCard
                        data={data.items.slice(0, 12).map((i) => ({ label: i.title.slice(0, 18), value: i.views }))}
                        color={CHART_COLORS.secondary}
                        height={340}
                      />
                    ),
                  },
                ]}
              />
            </SectionCard>
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}
