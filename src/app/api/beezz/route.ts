import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { toNumber, parseDateRange, asList, toBeezzPost, toRankingItems, extractIsoDate } from "@/lib/server/beehome-mappers";
import { calcVariation } from "@/lib/metrics";
import { BeezzData } from "@/services/contracts/beezz.contract";
import { BeezzPost } from "@/types/content";
import { KpiCard } from "@/types/metrics";

/**
 * GET /api/beezz — sem banco de dados, direto na BeeHome (ver
 * dashboard/route.ts para o padrão geral). "Criadores ativos" usa o
 * tamanho da lista de top criadores (beedataUserCreateBeezzTop) — a
 * BeeHome não documenta um total separado de criadores únicos no
 * período, só esse ranking, então o número é o topo (subestima o real).
 */
export async function GET(request: NextRequest) {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const range = parseDateRange(request);

  const results = await Promise.allSettled([
    callBeeHome("beedataBeezzLikeTopCount", {}),
    callBeeHome("beedataBeezzLikeTop", { pageNumber: 1, pageSize: 20 }),
    callBeeHome("beedataBeezzCommentTop", { maxResults: 10 }),
    callBeeHome("beedataUserCreateBeezzTop", { maxResults: 10 }),
    callBeeHome("auditListTimelineByDate", { startDate: range.from, endDate: range.to }),
  ]);

  const [totalCount, likeTop, commentTop, creatorTop, timeline] = results;

  const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
  const partialCoverage = failures.length > 0;
  if (failures.length > 0) {
    console.error(
      "Beezz: uma ou mais chamadas à BeeHome falharam —",
      failures.map((f) => (f.reason instanceof BeeHomeApiError ? f.reason.message : String(f.reason))),
    );
  }

  const posts: BeezzPost[] =
    likeTop.status === "fulfilled" ? asList(likeTop.value).map(toBeezzPost).filter((p): p is BeezzPost => p !== null) : [];
  const topLiked = likeTop.status === "fulfilled" ? toRankingItems(likeTop.value, ["title", "text", "name"], ["likes", "likeCount", "count"]) : [];
  const topCommented =
    commentTop.status === "fulfilled" ? toRankingItems(commentTop.value, ["title", "text", "name"], ["comments", "commentCount", "count"]) : [];
  const topCreators =
    creatorTop.status === "fulfilled" ? toRankingItems(creatorTop.value, ["name", "userName", "authorName"], ["count", "beezzCount", "total"]) : [];

  const timelineRows = timeline.status === "fulfilled" ? asList(timeline.value) : [];
  const activityTimeline = timelineRows
    .map((row) => ({ date: extractIsoDate(row), value: toNumber(row.count ?? row.total) }))
    .filter((p) => p.date);

  const totalBeezz = totalCount.status === "fulfilled" ? toNumber((totalCount.value as Record<string, unknown>).count ?? totalCount.value) : 0;
  const totalLikes = topLiked.reduce((sum, item) => sum + item.value, 0);
  const totalComments = topCommented.reduce((sum, item) => sum + item.value, 0);

  const kpis: KpiCard[] = [
    { id: "total-beezz", label: "Total de Beezz", value: totalBeezz, variation: calcVariation(totalBeezz, 0) },
    { id: "beezz-likes", label: "Curtidas", value: totalLikes, variation: calcVariation(totalLikes, 0) },
    { id: "beezz-comments", label: "Comentários", value: totalComments, variation: calcVariation(totalComments, 0) },
    { id: "active-creators", label: "Criadores ativos", value: topCreators.length, variation: calcVariation(topCreators.length, 0) },
  ];

  const data: BeezzData = {
    kpis,
    posts,
    activityTimeline,
    topLiked,
    topCommented,
    topCreators,
    partialCoverage,
  };

  return NextResponse.json(data);
}
