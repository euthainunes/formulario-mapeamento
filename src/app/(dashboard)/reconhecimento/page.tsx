"use client";

import { useState } from "react";
import { Cake, Award, Info } from "lucide-react";
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
import { appConfig } from "@/lib/app-config";
import { differenceInCalendarMonths } from "date-fns";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// REFERENCE_TODAY é uma data fixa, só para o modo mock (demonstração
// reproduzível). Em modo real, precisa ser a data de hoje de verdade —
// senão a tela sempre mostraria o mesmo mês/ano e o "tempo de empresa"
// calculado ficaria congelado numa data do passado.
const today = appConfig.dataSource === "mock" ? REFERENCE_TODAY : new Date();

export default function ReconhecimentoPage() {
  const [month, setMonth] = useState(today.getMonth() + 1);
  const year = today.getFullYear();
  const { data, isLoading, isError } = useRecognitionData(month, year);

  return (
    <RouteGuard permission="awards.view">
      <PageHeader
        title="Reconhecimento"
        description={
          appConfig.dataSource === "mock"
            ? "Aniversariantes do mês e tempo de empresa — dados demonstrativos."
            : "Aniversários de admissão (tempo de casa) do mês, a partir de dados reais da BeeHome."
        }
        actions={<ExportButtons label="reconhecimento" />}
      />

      {appConfig.dataSource === "api" && (
        <div className="flex items-start gap-2 rounded-lg border border-info/25 bg-info/5 p-3.5 text-xs text-text-secondary mb-5">
          <Info className="h-4 w-4 text-info shrink-0 mt-0.5" />
          <p>
            Cartões de reconhecimento entre colegas ainda não têm um endpoint confirmado na documentação oficial da
            BeeHome — por isso não aparecem aqui. O que esta tela mostra hoje são os aniversários de admissão (tempo
            de casa), que é o único dado desse tipo documentado pela integração.
          </p>
        </div>
      )}

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
              title={appConfig.dataSource === "mock" ? `Aniversariantes de ${MONTHS[month - 1]}` : `Aniversários de admissão em ${MONTHS[month - 1]}`}
              description={
                appConfig.dataSource === "mock"
                  ? "Lista de colaboradores que fazem aniversário no mês selecionado (dados fictícios)."
                  : "Colaboradores que completam tempo de casa no mês selecionado."
              }
            >
              {data.birthdaysThisMonth.length === 0 ? (
                <p className="text-sm text-text-secondary py-4 text-center">
                  {appConfig.dataSource === "mock" ? "Nenhum aniversariante neste mês." : "Nenhum aniversário de admissão neste mês."}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.birthdaysThisMonth.map((person) => {
                    const months = differenceInCalendarMonths(today, new Date(person.admissionDate));
                    const years = Math.floor(months / 12);
                    const Icon = appConfig.dataSource === "mock" ? Cake : Award;
                    return (
                      <Card key={person.id} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-warning/15 text-warning flex items-center justify-center">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text-primary truncate">{person.name}</p>
                            {(person.department || person.company) && (
                              <p className="text-xs text-text-secondary truncate">
                                {[person.department, person.company].filter(Boolean).join(" · ")}
                              </p>
                            )}
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
