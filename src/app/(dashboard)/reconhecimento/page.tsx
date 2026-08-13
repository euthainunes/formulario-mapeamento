"use client";

import { useState } from "react";
import { Cake } from "lucide-react";
import { RouteGuard } from "@/components/layout/route-guard";
import { PageHeader } from "@/components/shared/page-header";
import { useRecognitionData } from "@/hooks/use-recognition-data";
import { StateWrapper } from "@/components/shared/state-wrapper";
import { KpiCard } from "@/components/shared/kpi-card";
import { SectionCard } from "@/components/shared/section-card";
import { ExportButtons } from "@/components/shared/export-buttons";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/formatters";
import { REFERENCE_TODAY } from "@/lib/date-range";
import { differenceInCalendarMonths } from "date-fns";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function ReconhecimentoPage() {
  const [month, setMonth] = useState(REFERENCE_TODAY.getMonth() + 1);
  const year = REFERENCE_TODAY.getFullYear();
  const { data, isLoading, isError } = useRecognitionData(month, year);

  return (
    <RouteGuard permission="recognition.view">
      <PageHeader
        title="Reconhecimento"
        description="Aniversariantes do mês e tempo de empresa — dados demonstrativos."
        actions={<ExportButtons label="reconhecimento" />}
      />

      <div className="mb-5 max-w-[180px]">
        <label className="block text-[11px] font-medium text-text-secondary mb-1">Mês</label>
        <Select value={month} onChange={(e) => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, idx) => (
            <option key={m} value={idx + 1}>
              {m}
            </option>
          ))}
        </Select>
      </div>

      <StateWrapper isLoading={isLoading} isError={isError} isEmpty={!data} partialCoverage={data?.partialCoverage}>
        {data && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-xl">
              {data.kpis.map((kpi) => (
                <KpiCard key={kpi.id} kpi={kpi} />
              ))}
            </div>

            <SectionCard
              title={`Aniversariantes de ${MONTHS[month - 1]}`}
              description="Lista de colaboradores que fazem aniversário no mês selecionado (dados fictícios)."
            >
              {data.birthdaysThisMonth.length === 0 ? (
                <p className="text-sm text-text-secondary py-4 text-center">Nenhum aniversariante neste mês.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.birthdaysThisMonth.map((person) => {
                    const months = differenceInCalendarMonths(REFERENCE_TODAY, new Date(person.admissionDate));
                    const years = Math.floor(months / 12);
                    return (
                      <Card key={person.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-warning/15 text-warning flex items-center justify-center">
                            <Cake className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{person.name}</p>
                            <p className="text-xs text-text-secondary truncate">
                              {person.department} · {person.company}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-text-secondary space-y-0.5">
                          <p>Admissão: {formatDate(person.admissionDate)}</p>
                          <p>Tempo de empresa: {years > 0 ? `${years} ano(s)` : `${months} mês(es)`}</p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </StateWrapper>
    </RouteGuard>
  );
}
