import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { toNumber, parseDateRange, asList, kpisFromPeopleToday, toRankingItems, toBeezzPost, deviceBreakdownFrom, extractIsoDate, bucketTimeSeries } from "@/lib/server/beehome-mappers";
import { gatherInsightsFactsheet } from "@/lib/server/insights-data";
import { generateAutoInsights } from "@/lib/server/ai-insights";
import { ExecutiveDashboardData } from "@/types/dashboard";
import { InsightSummary } from "@/types/insight";

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
  const activeUsersEvolutionRaw = chartRows
    .map((row) => ({ date: extractIsoDate(row), value: toNumber(row.activeUsers) }))
    .filter((p) => p.date);
  // "average": usuários ativos é uma contagem por dia (estoque), não um
  // evento — somar os dias de um mês infla o número sem sentido.
  const activeUsersEvolution = bucketTimeSeries(activeUsersEvolutionRaw, range, "average");

  const loginRows = loginsByDate.status === "fulfilled" ? asList(loginsByDate.value) : [];
  const accessEvolutionRaw = loginRows
    .map((row) => ({ date: extractIsoDate(row), value: toNumber(row.total ?? row.count ?? row.logins) }))
    .filter((p) => p.date);
  // "sum": login é um evento — total do mês é a soma dos dias.
  const accessEvolution = bucketTimeSeries(accessEvolutionRaw, range, "sum");

  const deviceBreakdown = device.status === "fulfilled" ? deviceBreakdownFrom(asList(device.value)) : [];

  // Insights automáticos: agora reais quando OPENAI_API_KEY está configurada
  // (ver ai-insights.ts) — a IA só narra números já calculados aqui, nunca
  // inventa. Sem a chave, ou se a IA falhar, fica vazio (mesmo comportamento
  // honesto de antes), nunca quebra o dashboard inteiro por causa disso.
  let autoInsights: InsightSummary[] = [];
  if (process.env.OPENAI_API_KEY) {
    try {
      const factsheet = await gatherInsightsFactsheet(range);
      const result = await generateAutoInsights(factsheet);
      autoInsights = result.insights.map((insight, index) => ({ id: `ai-${index}`, text: insight.text }));
    } catch (err) {
      console.error("Dashboard: falha ao gerar insights automáticos via IA —", err instanceof Error ? err.message : err);
    }
  }

  const data: ExecutiveDashboardData = {
    kpis: kpisFromPeopleToday(today),
    accessEvolution,
    activeUsersEvolution,
    engagementByType: [], // sem fonte única da BeeHome para todos os tipos numa só chamada — ver reaction (exige um `type` por chamada)
    deviceBreakdown,
    // Confirmado com chamada real (25/08/2026): título vem em `newsTitle`,
    // visualizações em `viewsCount` — nomes antigos (`title`/`views`) nunca
    // batiam, então essa lista sempre vinha vazia.
    topContent: topNews.status === "fulfilled" ? toRankingItems(topNews.value, ["newsTitle", "title", "name"], ["viewsCount", "views", "viewCount", "count"]) : [],
    bottomContent: [], // BeeHome só documenta "mais visto/curtido/comentado" — não existe "menos" para conteúdo
    // O texto do Beezz vem aninhado em `row.beezz` (ver toBeezzPost) — não dá pra extrair com toRankingItems, que só olha campos soltos.
    topBeezz:
      topBeezz.status === "fulfilled"
        ? asList(topBeezz.value)
            .map(toBeezzPost)
            .filter((p): p is NonNullable<typeof p> => p !== null)
            .map((p) => ({ id: p.id, name: p.title, value: p.likes }))
        : [],
    bottomBeezz: [], // mesma observação de topContent
    // Confirmado com chamada real (25/08/2026): nome do pod vem em `title`
    // (não `name`/`podName`) — mesmo bug de pods/route.ts.
    topPods: topPods.status === "fulfilled" ? toRankingItems(topPods.value, ["title", "name", "podName"], ["count", "accessCount", "total"]) : [],
    bottomPods: bottomPods.status === "fulfilled" ? toRankingItems(bottomPods.value, ["title", "name", "podName"], ["count", "accessCount", "total"]) : [],
    priorityAlerts: [], // sem persistência própria, não há motor de alerta configurável nesta versão
    autoInsights,
    syncStatus: { lastSyncAt: new Date().toISOString(), status: partialCoverage ? "parcial" : "sucesso", source: "Intranet BeeHome (tempo real)" },
    partialCoverage,
  };

  return NextResponse.json(data);
}
