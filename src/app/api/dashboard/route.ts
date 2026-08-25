import { NextRequest, NextResponse } from "next/server";
import { subDays, format } from "date-fns";
import { getSessionClaims } from "@/lib/server/admin-session";
import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { calcVariation } from "@/lib/metrics";
import { ExecutiveDashboardData } from "@/types/dashboard";
import { RankingItem, DeviceBreakdown } from "@/types/metrics";

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

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function isoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function parseDateRange(request: NextRequest): { from: string; to: string } {
  const params = request.nextUrl.searchParams;
  const from = params.get("from");
  const to = params.get("to");
  if (from && to) return { from, to };

  const period = params.get("period") ?? "30d";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const today = new Date();
  return { from: isoDate(subDays(today, days - 1)), to: isoDate(today) };
}

/** Extrai uma lista de registros de um payload cujo envelope exato (array direto x `{data:[...]}` x paginado) não está 100% confirmado. */
function asList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    for (const key of ["data", "items", "results", "list"]) {
      const value = obj[key];
      if (Array.isArray(value)) return value as Record<string, unknown>[];
      if (value && typeof value === "object" && Array.isArray((value as Record<string, unknown>).list)) {
        return (value as Record<string, unknown>).list as Record<string, unknown>[];
      }
    }
  }
  return [];
}

function toRankingItems(payload: unknown, nameKeys: string[], valueKeys: string[]): RankingItem[] {
  return asList(payload)
    .map((item, index) => {
      const name = nameKeys.map((k) => item[k]).find((v) => typeof v === "string") as string | undefined;
      const value = valueKeys.map((k) => item[k]).find((v) => v !== undefined);
      if (!name || value === undefined) return null;
      return { id: String(item.id ?? index), name, value: toNumber(value) };
    })
    .filter((item): item is RankingItem => item !== null);
}

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

  const kpis: ExecutiveDashboardData["kpis"] = [
    {
      id: "active-users",
      label: "Usuários ativos",
      value: toNumber(today.activeUsers),
      variation: calcVariation(toNumber(today.activeUsers), toNumber(today.activeUsersLastWeek)),
      unit: "number",
    },
    {
      id: "active-users-login",
      label: "Usuários ativos com login",
      value: toNumber(today.activeUsersWithLogin),
      variation: calcVariation(toNumber(today.activeUsersWithLogin), toNumber(today.activeUsersWithLoginLastWeek)),
      unit: "number",
    },
    {
      id: "monthly-active-users",
      label: "Usuários ativos mensais",
      value: toNumber(today.monthlyActiveUsers),
      variation: calcVariation(toNumber(today.monthlyActiveUsers), toNumber(today.monthlyActiveUsersLastWeek)),
      unit: "number",
    },
    {
      id: "engaged-users",
      label: "Usuários engajados",
      value: toNumber(today.engagedUsers),
      variation: calcVariation(toNumber(today.engagedUsers), toNumber(today.engagedUsersLastWeek)),
      unit: "number",
    },
  ];

  const chartRows = peopleChart.status === "fulfilled" ? asList(peopleChart.value) : [];
  const activeUsersEvolution = chartRows
    .map((row) => ({ date: String(row.dayString ?? row.date ?? ""), value: toNumber(row.activeUsers) }))
    .filter((p) => p.date);

  const loginRows = loginsByDate.status === "fulfilled" ? asList(loginsByDate.value) : [];
  const accessEvolution = loginRows
    .map((row) => ({ date: String(row.dayString ?? row.date ?? ""), value: toNumber(row.total ?? row.count ?? row.logins) }))
    .filter((p) => p.date);

  const deviceRows = device.status === "fulfilled" ? asList(device.value) : [];
  const totalDeviceCount = deviceRows.reduce((sum, row) => sum + toNumber(row.count ?? row.total), 0);
  const deviceBreakdown: DeviceBreakdown[] = deviceRows
    .map((row) => {
      const count = toNumber(row.count ?? row.total);
      const name = String(row.device ?? row.name ?? "");
      if (!name) return null;
      return { device: name, count, percent: totalDeviceCount > 0 ? (count / totalDeviceCount) * 100 : 0 };
    })
    .filter((d): d is DeviceBreakdown => d !== null);

  const data: ExecutiveDashboardData = {
    kpis,
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
