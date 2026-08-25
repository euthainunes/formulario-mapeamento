import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { toNumber, parseDateRange, asList, kpisFromPeopleToday, deviceBreakdownFrom, extractIsoDate, bucketTimeSeries } from "@/lib/server/beehome-mappers";
import { AudienceData, AudienceComparisonPoint } from "@/services/contracts/audience.contract";

/**
 * GET /api/audience — sem banco de dados, direto na BeeHome (ver
 * dashboard/route.ts para o padrão geral). Reaproveita os mesmos 4 KPIs do
 * Dashboard Executivo (kpisFromPeopleToday) em vez de inventar uma
 * distinção "hoje/semana" que a BeeHome não expõe separadamente.
 *
 * `collaborators` fica vazio nesta versão: o endpoint de diretório
 * (directoryListUsersExport) tem o path exato NÃO confirmado no documento
 * oficial da BeeHome (quebra de página no PDF) — mapear os campos antes de
 * validar contra uma chamada real arriscaria inventar dado.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const range = parseDateRange(request);

  const results = await Promise.allSettled([
    callBeeHome("peopleToday", {}),
    callBeeHome("device", { startDate: range.from, endDate: range.to }),
    callBeeHome("peopleChart", { startDate: range.from, endDate: range.to }),
  ]);

  const [peopleToday, device, peopleChart] = results;

  const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
  const partialCoverage = failures.length > 0;
  if (failures.length > 0) {
    console.error(
      "Audiência: uma ou mais chamadas à BeeHome falharam —",
      failures.map((f) => (f.reason instanceof BeeHomeApiError ? f.reason.message : String(f.reason))),
    );
  }

  const today = peopleToday.status === "fulfilled" ? (peopleToday.value as Record<string, unknown>) : {};

  const chartRows = peopleChart.status === "fulfilled" ? asList(peopleChart.value) : [];
  const activeEvolutionRaw = chartRows
    .map((row) => ({ date: extractIsoDate(row), value: toNumber(row.activeUsers) }))
    .filter((p) => p.date);
  // "average": usuários ativos é uma contagem por dia (estoque), não um
  // evento — somar os dias de um mês infla o número sem sentido. Também
  // corrige o bug relatado: sem ordenar por data, um período longo (ex:
  // "Este ano") desenhava o gráfico com a ordem que a BeeHome devolveu, não
  // a cronológica — parecia "datas aleatórias".
  const activeEvolution = bucketTimeSeries(activeEvolutionRaw, range, "average");

  const deviceBreakdown = device.status === "fulfilled" ? deviceBreakdownFrom(asList(device.value)) : [];

  const periodComparison: AudienceComparisonPoint[] = [
    { label: "Ativos", currentPeriod: toNumber(today.activeUsers), previousPeriod: toNumber(today.activeUsersLastWeek) },
    { label: "Engajados", currentPeriod: toNumber(today.engagedUsers), previousPeriod: toNumber(today.engagedUsersLastWeek) },
    { label: "Ativos mensais", currentPeriod: toNumber(today.monthlyActiveUsers), previousPeriod: toNumber(today.monthlyActiveUsersLastWeek) },
  ];

  const data: AudienceData = {
    kpis: kpisFromPeopleToday(today),
    activeEvolution,
    deviceBreakdown,
    periodComparison,
    collaborators: [],
    partialCoverage,
  };

  return NextResponse.json(data);
}
