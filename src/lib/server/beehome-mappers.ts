import { NextRequest } from "next/server";
import { subDays, differenceInCalendarDays, format } from "date-fns";
import { calcVariation } from "@/lib/metrics";
import { KpiCard, RankingItem } from "@/types/metrics";
import { ContentItem, BeezzPost } from "@/types/content";

/** Converte o valor numérico da BeeHome (vem como string, ex: "36332") para number, com fallback seguro. */
export function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function isoDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

export interface DateRange {
  from: string;
  to: string;
}

/** Lê `from`/`to` (ou `period`) da query string. Sem `from`/`to` explícitos, usa a data real de hoje — nunca a data fixa de referência do modo mock. */
export function parseDateRange(request: NextRequest): DateRange {
  const params = request.nextUrl.searchParams;
  const from = params.get("from");
  const to = params.get("to");
  if (from && to) return { from, to };

  const period = params.get("period") ?? "30d";
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const today = new Date();
  return { from: isoDate(subDays(today, days - 1)), to: isoDate(today) };
}

/** Intervalo imediatamente anterior, com a mesma duração em dias. */
export function previousRange(range: DateRange): DateRange {
  const from = new Date(range.from);
  const to = new Date(range.to);
  const spanDays = differenceInCalendarDays(to, from) + 1;
  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, spanDays - 1);
  return { from: isoDate(prevFrom), to: isoDate(prevTo) };
}

/**
 * Extrai a data (ISO, yyyy-MM-dd) de uma linha de série temporal da
 * BeeHome. Confirmado com uma chamada real a `peopleChart`: o campo `day`
 * vem ISO completo ("2026-07-26T00:00:00.000Z"); `dayString` vem em
 * DD/MM/AAAA ("26/07/2026") — formato errado para o `TimeSeriesPoint.date`
 * do front (que espera yyyy-MM-dd). Prioriza `day`; só recorre a
 * `dayString` (convertendo o formato) se `day` não vier.
 */
export function extractIsoDate(row: Record<string, unknown>): string {
  if (typeof row.day === "string" && row.day.length >= 10) return row.day.slice(0, 10);
  if (typeof row.date === "string" && /^\d{4}-\d{2}-\d{2}/.test(row.date)) return row.date.slice(0, 10);
  if (typeof row.dayString === "string") {
    const m = row.dayString.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  }
  return "";
}

/** Extrai uma lista de registros de um payload cujo envelope exato (array direto x `{data:[...]}` x paginado) não está 100% confirmado para todo endpoint. */
export function asList(payload: unknown): Record<string, unknown>[] {
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

/** Monta os 4 KPIs padrão de audiência a partir da resposta de `peopleToday` — usado tanto no Dashboard Executivo quanto em Pessoas e Audiência. */
export function kpisFromPeopleToday(today: Record<string, unknown>): KpiCard[] {
  return [
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
}

/** Extrai um ranking (top N) de um payload de listagem da BeeHome, tentando algumas variações plausíveis de nome de campo — se nenhuma bater, o item é descartado em vez de inventado. */
export function toRankingItems(payload: unknown, nameKeys: string[], valueKeys: string[]): RankingItem[] {
  return asList(payload)
    .map((item, index) => {
      const name = nameKeys.map((k) => item[k]).find((v) => typeof v === "string") as string | undefined;
      const value = valueKeys.map((k) => item[k]).find((v) => v !== undefined);
      if (!name || value === undefined) return null;
      return { id: String(item.id ?? index), name, value: toNumber(value) };
    })
    .filter((item): item is RankingItem => item !== null);
}

/** Extrai um item de conteúdo (notícia) de uma linha de `newsListMostViewedNews`/`ListMostLikedNews`/`ListMostCommentedNews` — schema exato não confirmado, então cada métrica ausente vira 0 em vez de quebrar. */
export function toContentItem(row: Record<string, unknown>, index: number): ContentItem | null {
  const title = (row.title ?? row.name) as string | undefined;
  if (!title) return null;
  return {
    id: String(row.id ?? index),
    title,
    type: "noticia" as const,
    publishedAt: String(row.publishedAt ?? row.date ?? row.createdAt ?? ""),
    author: String(row.author ?? row.authorName ?? ""),
    views: toNumber(row.views ?? row.viewCount ?? row.uniqueViews),
    likes: toNumber(row.likes ?? row.likeCount),
    comments: toNumber(row.comments ?? row.commentCount),
    performance: "na_media" as const, // classificado depois, com base na média real do conjunto retornado
  };
}

/** Extrai um Beezz de uma linha de `beedataBeezzLikeTop`/`beedataBeezzCommentTop` — schema exato não confirmado (mesma ressalva de toContentItem). */
export function toBeezzPost(row: Record<string, unknown>, index: number): BeezzPost | null {
  const title = (row.title ?? row.text ?? row.name) as string | undefined;
  if (!title) return null;
  return {
    id: String(row.id ?? index),
    title,
    author: String(row.author ?? row.authorName ?? row.userName ?? ""),
    createdAt: String(row.createdAt ?? row.date ?? ""),
    likes: toNumber(row.likes ?? row.likeCount ?? row.count),
    comments: toNumber(row.comments ?? row.commentCount),
  };
}

/** Constrói o breakdown por dispositivo (count + percent) a partir da resposta de `device`. */
/**
 * Constrói o breakdown por dispositivo a partir da resposta real do
 * endpoint `device` — confirmado com uma chamada real: NÃO é uma linha por
 * dispositivo (`{device, count}`), é uma série temporal (uma linha por
 * dia) com três colunas fixas por linha: `countDesktop`, `countMobile`,
 * `countTablet`. Soma essas três colunas ao longo de todas as linhas do
 * período para chegar no total por dispositivo.
 */
export function deviceBreakdownFrom(rows: Record<string, unknown>[]) {
  const totals = {
    desktop: rows.reduce((sum, row) => sum + toNumber(row.countDesktop), 0),
    mobile: rows.reduce((sum, row) => sum + toNumber(row.countMobile), 0),
    tablet: rows.reduce((sum, row) => sum + toNumber(row.countTablet), 0),
  };
  const grandTotal = totals.desktop + totals.mobile + totals.tablet;
  return (Object.entries(totals) as [string, number][])
    .filter(([, count]) => count > 0)
    .map(([device, count]) => ({ device, count, percent: grandTotal > 0 ? (count / grandTotal) * 100 : 0 }));
}
