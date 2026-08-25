import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { toNumber, parseDateRange, asList } from "@/lib/server/beehome-mappers";
import { calcVariation } from "@/lib/metrics";
import { EngagementData } from "@/services/contracts/engagement.contract";
import { REACTION_TYPES, REACTION_LABELS, ReactionTotal } from "@/types/content";
import { KpiCard, MultiSeriesPoint } from "@/types/metrics";

/**
 * GET /api/engagement — sem banco de dados, direto na BeeHome. O endpoint
 * `reaction` exige um `type` por chamada (12 valores documentados) — não
 * existe um "todos os tipos numa só resposta", então esta rota faz as 12
 * chamadas em paralelo.
 */

const LIKE_TYPES = new Set([
  "countBeezzLiked",
  "countBeezzCommentLike",
  "countNewsLiked",
  "countNewsCommentLike",
  "countVideoLiked",
  "countPollLiked",
  "countPhotobookLiked",
  "countBlogLiked",
  "countPodcastLiked",
]);
const COMMENT_TYPES = new Set(["countCommentsBeezz", "countCommentsNews", "countCommentsVideos"]);

export async function GET(request: NextRequest) {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const range = parseDateRange(request);

  const results = await Promise.allSettled(
    REACTION_TYPES.map((type) => callBeeHome("reaction", { type, startDate: range.from, endDate: range.to })),
  );

  const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
  const partialCoverage = failures.length > 0;
  if (failures.length > 0) {
    console.error(
      "Engajamento: uma ou mais chamadas à BeeHome falharam —",
      failures.map((f) => (f.reason instanceof BeeHomeApiError ? f.reason.message : String(f.reason))),
    );
  }

  const byDate = new Map<string, MultiSeriesPoint>();
  const reactionTotals: ReactionTotal[] = [];
  let likesTotal = 0;
  let commentsTotal = 0;

  REACTION_TYPES.forEach((type, index) => {
    const result = results[index];
    const rows = result.status === "fulfilled" ? asList(result.value) : [];
    let typeTotal = 0;

    for (const row of rows) {
      const date = String(row.dayString ?? row.date ?? "");
      const value = toNumber(row.count ?? row.value ?? row.total);
      typeTotal += value;
      if (!date) continue;
      const point = byDate.get(date) ?? { date };
      point[type] = value;
      byDate.set(date, point);
    }

    reactionTotals.push({ type, label: REACTION_LABELS[type], count: typeTotal });
    if (LIKE_TYPES.has(type)) likesTotal += typeTotal;
    if (COMMENT_TYPES.has(type)) commentsTotal += typeTotal;
  });

  const byContentType = Array.from(byDate.values()).sort((a, b) => (String(a.date) < String(b.date) ? -1 : 1));
  const evolution = byContentType.map((point) => {
    const total = REACTION_TYPES.reduce((sum, type) => sum + (typeof point[type] === "number" ? (point[type] as number) : 0), 0);
    return { date: String(point.date), value: total };
  });

  const totalInteractions = reactionTotals.reduce((sum, r) => sum + r.count, 0);

  const kpis: KpiCard[] = [
    { id: "total-interactions", label: "Interações totais", value: totalInteractions, variation: calcVariation(totalInteractions, 0) },
    { id: "likes", label: "Curtidas", value: likesTotal, variation: calcVariation(likesTotal, 0) },
    { id: "comments", label: "Comentários", value: commentsTotal, variation: calcVariation(commentsTotal, 0) },
    { id: "variation", label: "Variação de engajamento", value: totalInteractions, variation: calcVariation(totalInteractions, 0), unit: "percent" },
  ];

  const data: EngagementData = { kpis, evolution, byContentType, reactionTotals, partialCoverage };

  return NextResponse.json(data);
}
