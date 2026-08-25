import { NextRequest, NextResponse } from "next/server";
import { getSessionClaims } from "@/lib/server/admin-session";
import { callBeeHome, BeeHomeApiError } from "@/lib/server/beehome-client";
import { toNumber, parseDateRange, asList, toContentItem } from "@/lib/server/beehome-mappers";
import { calcVariation } from "@/lib/metrics";
import { ContentData, PerformanceDistribution } from "@/services/contracts/content.contract";
import { ContentItem } from "@/types/content";
import { KpiCard } from "@/types/metrics";

/**
 * GET /api/content — sem banco de dados, direto na BeeHome (ver
 * dashboard/route.ts para o padrão geral). `items` é a união (por id) dos
 * 3 rankings que a BeeHome documenta (mais vistas/curtidas/comentadas) —
 * ela não expõe uma lista única "todas as notícias com todas as métricas",
 * só esses 3 rankings separados. `performance` é classificado comparando
 * as visualizações reais de cada item com a média do próprio conjunto
 * retornado (não é um valor que a BeeHome devolve pronto).
 */
export async function GET(request: NextRequest) {
  const session = await getSessionClaims();
  if (!session) {
    return NextResponse.json({ statusCode: 401, message: "Sessão expirada ou inexistente. Faça login novamente." }, { status: 401 });
  }

  const range = parseDateRange(request);

  const results = await Promise.allSettled([
    callBeeHome("newsGetPublishedNewsChart", { startDate: range.from, endDate: range.to }),
    callBeeHome("newsListMostViewedNews", { startDate: range.from, endDate: range.to }),
    callBeeHome("newsListMostLikedNews", { startDate: range.from, endDate: range.to }),
    callBeeHome("newsListMostCommentedNews", { startDate: range.from, endDate: range.to }),
  ]);

  const [publishedChart, mostViewedRaw, mostLikedRaw, mostCommentedRaw] = results;

  const failures = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
  const partialCoverage = failures.length > 0;
  if (failures.length > 0) {
    console.error(
      "Conteúdos: uma ou mais chamadas à BeeHome falharam —",
      failures.map((f) => (f.reason instanceof BeeHomeApiError ? f.reason.message : String(f.reason))),
    );
  }

  const chartRows = publishedChart.status === "fulfilled" ? asList(publishedChart.value) : [];
  const publicationsByDate = chartRows
    .map((row) => ({ date: String(row.dayString ?? row.date ?? ""), value: toNumber(row.count ?? row.total ?? row.publications) }))
    .filter((p) => p.date);
  const publicationsTotal = publicationsByDate.reduce((sum, p) => sum + p.value, 0);

  const mostViewed = mostViewedRaw.status === "fulfilled" ? asList(mostViewedRaw.value).map(toContentItem).filter((i): i is ContentItem => i !== null) : [];
  const mostLiked = mostLikedRaw.status === "fulfilled" ? asList(mostLikedRaw.value).map(toContentItem).filter((i): i is ContentItem => i !== null) : [];
  const mostCommented =
    mostCommentedRaw.status === "fulfilled" ? asList(mostCommentedRaw.value).map(toContentItem).filter((i): i is ContentItem => i !== null) : [];

  // União por id — cada lista só traz uma métrica "cheia" (a que ordena o ranking); as outras vêm 0 dessa lista específica, mas o merge preserva o maior valor não-zero visto entre as 3.
  const merged = new Map<string, ContentItem>();
  for (const list of [mostViewed, mostLiked, mostCommented]) {
    for (const item of list) {
      const existing = merged.get(item.id);
      if (!existing) {
        merged.set(item.id, { ...item });
      } else {
        existing.views = Math.max(existing.views, item.views);
        existing.likes = Math.max(existing.likes, item.likes);
        existing.comments = Math.max(existing.comments, item.comments);
      }
    }
  }
  const items = Array.from(merged.values());
  const avgViews = items.length > 0 ? items.reduce((s, i) => s + i.views, 0) / items.length : 0;
  for (const item of items) {
    item.performance = avgViews === 0 ? "na_media" : item.views > avgViews * 1.1 ? "acima_media" : item.views < avgViews * 0.9 ? "abaixo_media" : "na_media";
  }

  const totalViews = mostViewed.reduce((s, i) => s + i.views, 0);
  const totalLikes = mostLiked.reduce((s, i) => s + i.likes, 0);
  const totalComments = mostCommented.reduce((s, i) => s + i.comments, 0);
  const aboveAverage = items.filter((i) => i.performance === "acima_media").length;
  const belowAverage = items.filter((i) => i.performance === "abaixo_media").length;

  const kpis: KpiCard[] = [
    { id: "publications", label: "Publicações", value: publicationsTotal, variation: calcVariation(publicationsTotal, 0) },
    { id: "views", label: "Visualizações", value: totalViews, variation: calcVariation(totalViews, 0) },
    { id: "likes", label: "Curtidas", value: totalLikes, variation: calcVariation(totalLikes, 0) },
    { id: "comments", label: "Comentários", value: totalComments, variation: calcVariation(totalComments, 0) },
    { id: "above-average", label: "Acima da média", value: aboveAverage, variation: calcVariation(aboveAverage, 0) },
    { id: "below-average", label: "Abaixo da média", value: belowAverage, variation: calcVariation(belowAverage, 0) },
  ];

  const performanceDistribution: PerformanceDistribution[] = [
    { bucket: "Acima da média", count: aboveAverage },
    { bucket: "Na média", count: items.filter((i) => i.performance === "na_media").length },
    { bucket: "Abaixo da média", count: belowAverage },
  ];

  const data: ContentData = {
    kpis,
    items,
    publicationsByDate,
    performanceDistribution,
    mostViewed,
    mostLiked,
    mostCommented,
    partialCoverage,
  };

  return NextResponse.json(data);
}
