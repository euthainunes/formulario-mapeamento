import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { toNumber, parseDateRange, previousRange, asList } from "@/lib/server/beehome-mappers";
import { calcVariation } from "@/lib/metrics";
import { PodsData } from "@/services/contracts/pods.contract";
import { Pod } from "@/types/content";
import { KpiCard } from "@/types/metrics";

/**
 * GET /api/pods — sem banco de dados, direto na BeeHome. `status`
 * (crescimento/queda/estável) é derivado comparando o acesso real do
 * período atual com o anterior por pod — a BeeHome não devolve essa
 * classificação pronta. `description` fica sempre vazio: não há endpoint
 * documentado com descrição de pod. `evolution` também fica vazio: os
 * endpoints de pod só dão rankings (mais/menos acessado), não uma série
 * temporal.
 */
export async function GET(request: NextRequest) {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const range = parseDateRange(request);
  const prevRange = previousRange(range);

  const results = await Promise.allSettled([
    callBeeHome("podAuditListMostAccessed", { startDate: range.from, endDate: range.to }),
    callBeeHome("podAuditListLeastAccessed", { startDate: range.from, endDate: range.to }),
    callBeeHome("podAuditListMostAccessed", { startDate: prevRange.from, endDate: prevRange.to }),
    callBeeHome("podAuditListLeastAccessed", { startDate: prevRange.from, endDate: prevRange.to }),
  ]);

  const [mostNow, leastNow, mostPrev, leastPrev] = results;

  const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
  const partialCoverage = failures.length > 0;
  if (failures.length > 0) {
    console.error(
      "Pods: uma ou mais chamadas à BeeHome falharam —",
      failures.map((f) => (f.reason instanceof BeeHomeApiError ? f.reason.message : String(f.reason))),
    );
  }

  // Confirmado com chamada real (25/08/2026): o nome do pod vem no campo
  // `title` (não `name`/`podName`) — sem essa correção, todas as linhas
  // eram descartadas e a tela ficava vazia mesmo com dado real chegando.
  function podMap(result: PromiseSettledResult<unknown>): Map<string, number> {
    const map = new Map<string, number>();
    if (result.status !== "fulfilled") return map;
    for (const row of asList(result.value)) {
      const name = String(row.title ?? row.name ?? row.podName ?? "");
      if (!name) continue;
      map.set(name, toNumber(row.count ?? row.accessCount ?? row.total));
    }
    return map;
  }

  const currentMap = new Map([...podMap(mostNow), ...podMap(leastNow)]);
  const previousMap = new Map([...podMap(mostPrev), ...podMap(leastPrev)]);
  const totalAccess = Array.from(currentMap.values()).reduce((sum, v) => sum + v, 0);

  const pods: Pod[] = Array.from(currentMap.entries()).map(([name, accessCount], index) => {
    const prevCount = previousMap.get(name);
    let status: Pod["status"] = "estavel";
    if (prevCount !== undefined && prevCount > 0) {
      if (accessCount > prevCount * 1.05) status = "crescimento";
      else if (accessCount < prevCount * 0.95) status = "queda";
    }
    return {
      id: String(index),
      name,
      description: "",
      accessCount,
      participationPercent: totalAccess > 0 ? (accessCount / totalAccess) * 100 : 0,
      status,
    };
  });

  const sortedByAccess = [...pods].sort((a, b) => b.accessCount - a.accessCount);
  const mostAccessed = sortedByAccess[0];
  const leastAccessed = sortedByAccess[sortedByAccess.length - 1];
  const growing = pods.filter((p) => p.status === "crescimento").length;
  const declining = pods.filter((p) => p.status === "queda").length;

  const kpis: KpiCard[] = [
    {
      id: "most-accessed",
      label: "Pod mais acessado",
      value: mostAccessed?.accessCount ?? 0,
      formattedValue: mostAccessed?.name ?? "—",
      variation: calcVariation(mostAccessed?.accessCount ?? 0, previousMap.get(mostAccessed?.name ?? "") ?? 0),
    },
    {
      id: "least-accessed",
      label: "Pod menos acessado",
      value: leastAccessed?.accessCount ?? 0,
      formattedValue: leastAccessed?.name ?? "—",
      variation: calcVariation(leastAccessed?.accessCount ?? 0, previousMap.get(leastAccessed?.name ?? "") ?? 0),
    },
    {
      id: "growing",
      label: "Pods em crescimento",
      value: growing,
      variation: { current: growing, previous: growing, comparable: false, percentChange: null, direction: "none" },
    },
    {
      id: "declining",
      label: "Pods em queda",
      value: declining,
      variation: { current: declining, previous: declining, comparable: false, percentChange: null, direction: "none" },
    },
  ];

  const data: PodsData = { kpis, pods, evolution: [], partialCoverage };

  return NextResponse.json(data);
}
