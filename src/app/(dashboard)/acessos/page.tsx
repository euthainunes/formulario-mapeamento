"use client";

import { ColumnDef } from "@tanstack/react-table";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { GlobalFiltersBar } from "@/components/filters/global-filters-bar";
import { useGlobalFilters } from "@/hooks/use-global-filters";
import { useAccessData } from "@/hooks/use-access-data";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { KpiCard } from "@/components/shared/kpi-card";
import { SectionCard } from "@/components/shared/section-card";
import { LineChartCard } from "@/components/charts/line-chart-card";
import { BarChartCard } from "@/components/charts/bar-chart-card";
import { HeatmapGrid } from "@/components/charts/heatmap-grid";
import { DataTable } from "@/components/tables/data-table";
import { ExportButtons } from "@/components/shared/export-buttons";
import { CHART_COLORS } from "@/lib/chart-colors";
import { formatDate, formatNumber } from "@/lib/formatters";

interface LoginRow {
  date: string;
  total: number;
}

const columns: ColumnDef<LoginRow, unknown>[] = [
  { accessorKey: "date", header: "Data", cell: ({ row }) => formatDate(row.original.date) },
  { accessorKey: "total", header: "Total de acessos", cell: ({ row }) => formatNumber(row.original.total) },
];

export default function AcessosPage() {
  const filters = useGlobalFilters();
  const { data, isLoading, isError } = useAccessData(filters);

  return (
    <RouteGuard permission="access.view">
      <PageHeader
        title="Acessos"
        description="Padrões de acesso à intranet: volume, horários de pico e distribuição semanal."
        actions={<ExportButtons label="acessos" />}
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

            <SectionCard title="Logins por data">
              <LineChartCard data={data.loginsByDate} color={CHART_COLORS.primary} />
            </SectionCard>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <SectionCard title="Média por hora do dia">
                <BarChartCard
                  data={data.averageByHour.map((h) => ({ label: `${h.hour}h`, value: h.average }))}
                  color={CHART_COLORS.info}
                />
              </SectionCard>
              <SectionCard title="Média por dia da semana">
                <BarChartCard
                  data={data.averageByWeekday.map((w) => ({ label: w.weekday, value: w.average }))}
                  color={CHART_COLORS.secondary}
                />
              </SectionCard>
            </div>

            <SectionCard title="Mapa de calor: dia da semana × horário" description="Intensidade de acessos por combinação de dia e hora.">
              <HeatmapGrid data={data.heatmap} />
            </SectionCard>

            <SectionCard title="Logins por data (tabela)">
              <DataTable columns={columns} data={data.loginTable} searchPlaceholder="Buscar data..." />
            </SectionCard>
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}
