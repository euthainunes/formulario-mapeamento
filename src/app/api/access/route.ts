import { NextRequest, NextResponse } from "next/server";
import { differenceInCalendarDays } from "date-fns";
import { getSessionClaims } from "@/lib/server/admin-session";
import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { toNumber, parseDateRange, previousRange, asList, extractIsoDate, bucketTimeSeries } from "@/lib/server/beehome-mappers";
import { calcVariation } from "@/lib/metrics";
import { AccessData, HourAverage, WeekdayAverage } from "@/services/contracts/access.contract";
import { KpiCard } from "@/types/metrics";

/**
 * GET /api/access — sem banco de dados, direto na BeeHome (ver dashboard/route.ts
 * para a explicação geral do padrão). `heatmap` fica sempre vazio: a BeeHome
 * não documenta um endpoint que cruze dia-da-semana × hora numa só resposta
 * (só marginais separados — `auditAverageLoginsByHour`/`ByDay`), e cruzar os
 * dois manualmente seria inventar um dado que ela não fornece.
 */

export async function GET(request: NextRequest) {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const range = parseDateRange(request);
  const prevRange = previousRange(range);
  const days = Math.max(1, differenceInCalendarDays(new Date(range.to), new Date(range.from)) + 1);

  const results = await Promise.allSettled([
    callBeeHome("auditLogins", { startDate: range.from, endDate: range.to }),
    callBeeHome("auditLogins", { startDate: prevRange.from, endDate: prevRange.to }),
    callBeeHome("auditLoginsByDate", { startDate: range.from, endDate: range.to }),
    callBeeHome("auditAverageLoginsByHour", { startDate: range.from, endDate: range.to }),
    callBeeHome("auditAverageLoginsByDay", { startDate: range.from, endDate: range.to }),
  ]);

  const [totalLogins, totalLoginsPrev, loginsByDate, avgByHour, avgByDay] = results;

  const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
  const partialCoverage = failures.length > 0;
  if (failures.length > 0) {
    console.error(
      "Acessos: uma ou mais chamadas à BeeHome falharam —",
      failures.map((f) => (f.reason instanceof BeeHomeApiError ? f.reason.message : String(f.reason))),
    );
  }

  // auditLogins e auditAverageLoginsByHour estão confirmadamente quebrados
  // no servidor da BeeHome hoje (HTTP 500, ver beehome-client.ts) — os KPIs
  // que dependem deles precisam deixar isso visível como "indisponível",
  // não como "0" (que pareceria um dado real de zero acessos).
  const totalLoginsUnavailable = totalLogins.status === "rejected";
  const peakHourUnavailable = avgByHour.status === "rejected";

  const totalCurrent = totalLogins.status === "fulfilled" ? toNumber((totalLogins.value as Record<string, unknown>).total ?? totalLogins.value) : 0;
  const totalPrevious =
    totalLoginsPrev.status === "fulfilled" ? toNumber((totalLoginsPrev.value as Record<string, unknown>).total ?? totalLoginsPrev.value) : 0;

  const hourRows = avgByHour.status === "fulfilled" ? asList(avgByHour.value) : [];
  const averageByHour: HourAverage[] = hourRows
    .map((row) => ({ hour: toNumber(row.hour), average: toNumber(row.average ?? row.value ?? row.count) }))
    .filter((h) => Number.isFinite(h.hour));
  let peakHour = 0;
  let peakValue = -1;
  for (const h of averageByHour) {
    if (h.average > peakValue) {
      peakValue = h.average;
      peakHour = h.hour;
    }
  }

  const dayRows = avgByDay.status === "fulfilled" ? asList(avgByDay.value) : [];
  const averageByWeekday: WeekdayAverage[] = dayRows
    .map((row) => {
      const weekday = String(row.weekday ?? row.dayOfWeek ?? row.day ?? "");
      const average = row.average ?? row.value ?? row.count;
      if (!weekday || average === undefined) return null;
      return { weekday, average: toNumber(average) };
    })
    .filter((w): w is WeekdayAverage => w !== null);

  const dateRows = loginsByDate.status === "fulfilled" ? asList(loginsByDate.value) : [];
  // Tabela mantém granularidade diária (tem busca/paginação própria) mas
  // precisa vir ordenada — sem isso a ordem é a que a BeeHome devolveu, não
  // a cronológica.
  const loginTable = dateRows
    .map((row) => ({ date: extractIsoDate(row), total: toNumber(row.total ?? row.count ?? row.logins) }))
    .filter((r) => r.date)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const noComparison = { current: 0, previous: 0, comparable: false, percentChange: null, direction: "none" as const };

  const kpis: KpiCard[] = [
    {
      id: "total-logins",
      label: "Total de logins",
      value: totalCurrent,
      formattedValue: totalLoginsUnavailable ? "—" : undefined,
      variation: totalLoginsUnavailable ? noComparison : calcVariation(totalCurrent, totalPrevious),
      partialCoverage: totalLoginsUnavailable,
    },
    {
      id: "daily-average",
      label: "Média diária",
      value: Math.round(totalCurrent / days),
      formattedValue: totalLoginsUnavailable ? "—" : undefined,
      variation: totalLoginsUnavailable ? noComparison : calcVariation(totalCurrent / days, totalPrevious / days),
      partialCoverage: totalLoginsUnavailable,
    },
    {
      id: "peak-hour",
      label: "Horário de pico",
      value: peakHour,
      formattedValue: peakHourUnavailable ? "—" : `${peakHour}h`,
      variation: noComparison,
      partialCoverage: peakHourUnavailable,
    },
    {
      id: "access-variation",
      label: "Variação de acessos",
      value: totalCurrent,
      formattedValue: totalLoginsUnavailable ? "—" : undefined,
      variation: totalLoginsUnavailable ? noComparison : calcVariation(totalCurrent, totalPrevious),
      unit: "percent",
      partialCoverage: totalLoginsUnavailable,
    },
  ];

  const data: AccessData = {
    kpis,
    // "sum": login é um evento — agrupa por mês em períodos longos.
    loginsByDate: bucketTimeSeries(
      loginTable.map((t) => ({ date: t.date, value: t.total })),
      range,
      "sum",
    ),
    averageByHour,
    averageByWeekday,
    heatmap: [], // ver comentário no topo do arquivo
    loginTable,
    partialCoverage,
  };

  return NextResponse.json(data);
}
