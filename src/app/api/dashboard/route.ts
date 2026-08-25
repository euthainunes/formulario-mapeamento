import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { toNumber, parseDateRange, asList, kpisFromPeopleToday, toRankingItems, deviceBreakdownFrom } from "@/lib/server/beehome-mappers";
import { ExecutiveDashboardData } from "@/types/dashboard";

/**
 * GET /api/dashboard — sem banco de dados: busca direto na BeeHome, em
 * tempo real, a cada requisição. Não há histórico próprio nem regra de
 * alerta/insight persistida — por isso `priorityAlerts`/`autoInsights`
 * ficam vazios e `partialCoverage: true` (ver ExecutiveDashboardData).
 *
 * Alguns campos do retorno da BeeHome ainda não foram validados contra uma
 * chamada real (marcado onde relevante) — a extração é defensiva: se o
 * formato não bater, o item correspondente fica vazio em vez de quebrar a
 * rota inteira.
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
    callBeeHome("auditLoginsByDate", { startDate: range.from, endDate: range.to }),
    callBeeHome("beedataBeezzLikeTop", { pageNumber: 1, pageSize: 5 }),
    callBeeHome("podAuditListMostAccessed", { startDate: range.from, endDate: range.to }),
    callBeeHome("podAuditListLeastAccessed", { startDate: range.from, endDate: range.to }),
    callBeeHome("newsListMostViewedNews", { startDate: range.from, endDate: range.to }),
  ]);

  const [peopleToday, device, peopleChart, loginsByDate, topBeezz, topPods, bottomPods, topNews] = results;

  const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
  const partialCoverage = failures.length > 0;
  if (failures.length > 0) {
    console.error(
      "Dashboard: uma ou mais chamadas à BeeHome falharam —",
      failures.map((f) => (f.reason instanceof BeeHomeApiError ? f.reason.message : String(f.reason))),
    );
  }

  const today = peopleToday.status === "fulfilled" ? (peopleToday.value as Record<string, unknown>) : {};

  const chartRows = peopleChart.status === "fulfilled" ? asList(peopleChart.value) : [];
  const activeUsersEvolution = chartRows
    .map((row) => ({ date: String(row.dayString ?? row.date ?? ""), value: toNumber(row.activeUsers) }))
    .filter((p) => p.date);

  const loginRows = loginsByDate.status === "fulfilled" ? asList(loginsByDate.value) : [];
  const accessEvolution = loginRows
    .map((row) => ({ date: String(row.dayString ?? row.date ?? ""), value: toNumber(row.total ?? row.count ?? row.logins) }))
    .filter((p) => p.date);

  const deviceBreakdown = device.status === "fulfilled" ? deviceBreakdownFrom(asList(device.value)) : [];

  const data: ExecutiveDashboardData = {
    kpis: kpisFromPeopleToday(today),
    accessEvolution,
    activeUsersEvolution,
    engagementByType: [], // sem fonte única da BeeHome para todos os tipos numa só chamada — ver reaction (exige um `type` por chamada)
    deviceBreakdown,
    topContent: topNews.status === "fulfilled" ? toRankingItems(topNews.value, ["title", "name"], ["views", "viewCount", "count"]) : [],
    bottomContent: [], // BeeHome só documenta "mais visto/curtido/comentado" — não existe "menos" para conteúdo
    topBeezz: topBeezz.status === "fulfilled" ? toRankingItems(topBeezz.value, ["title", "name", "text"], ["likes", "likeCount", "count"]) : [],
    bottomBeezz: [], // mesma observação de topContent
    topPods: topPods.status === "fulfilled" ? toRankingItems(topPods.value, ["name", "podName"], ["accessCount", "count", "total"]) : [],
    bottomPods: bottomPods.status === "fulfilled" ? toRankingItems(bottomPods.value, ["name", "podName"], ["accessCount", "count", "total"]) : [],
    priorityAlerts: [], // sem persistência própria, não há motor de alerta configurável nesta versão
    autoInsights: [], // idem — dependia de histórico armazenado
    syncStatus: { lastSyncAt: new Date().toISOString(), status: partialCoverage ? "parcial" : "sucesso", source: "Intranet BeeHome (tempo real)" },
    partialCoverage,
  };

  return NextResponse.json(data);
}
