import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { toNumber, parseDateRange, asList, toBeezzPost, toCreatorRanking, extractIsoDate, bucketTimeSeries } from "@/lib/server/beehome-mappers";
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
  // topLiked/topCommented derivam dos mesmos posts já mapeados (toBeezzPost já
  // resolve o texto/id aninhados em `row.beezz`) — evita duplicar a mesma
  // extração aninhada com toRankingItems, que só olha campos soltos.
  const topLiked = posts.map((p) => ({ id: p.id, name: p.title, value: p.likes }));
  const commentedPosts: BeezzPost[] =
    commentTop.status === "fulfilled" ? asList(commentTop.value).map(toBeezzPost).filter((p): p is BeezzPost => p !== null) : [];
  const topCommented = commentedPosts.map((p) => ({ id: p.id, name: p.title, value: p.likes }));
  const topCreators = creatorTop.status === "fulfilled" ? toCreatorRanking(creatorTop.value) : [];

  const timelineRows = timeline.status === "fulfilled" ? asList(timeline.value) : [];
  const activityTimelineRaw = timelineRows
    .map((row) => ({ date: extractIsoDate(row), value: toNumber(row.count ?? row.total) }))
    .filter((p) => p.date);
  // "sum": atividade é uma contagem de evento — agrupa por mês em períodos longos.
  const activityTimeline = bucketTimeSeries(activityTimelineRaw, range, "sum");

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
