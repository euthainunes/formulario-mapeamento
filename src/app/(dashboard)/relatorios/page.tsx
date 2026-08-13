"use client";

import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { ReportForm } from "@/components/reports/report-form";
import { ReportHistoryTable } from "@/components/reports/report-history-table";
import { useReportHistory } from "@/hooks/use-report-export";

export default function RelatoriosPage() {
  const { data, isLoading, isError } = useReportHistory();

  return (
    <RouteGuard permission="report.view">
      <PageHeader
        title="Relatórios e Exportações"
        description="Gere relatórios com período, filtros e formato personalizados. O processamento é simulado."
      />

      <div className="space-y-5">
        <SectionCard title="Gerar novo relatório">
          <ReportForm />
        </SectionCard>

        <SectionCard title="Histórico de relatórios">
          <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data || data.length === 0}>
            {data && <ReportHistoryTable items={data} />}
          </StateWrapper>
        </SectionCard>
      </div>
    </RouteGuard>
  );
}
