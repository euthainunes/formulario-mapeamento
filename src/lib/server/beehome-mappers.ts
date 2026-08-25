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

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

/**
 * Ordena e agrupa uma série temporal diária conforme o tamanho do período,
 * pra corrigir dois problemas reais achados numa auditoria (25/08/2026):
 *
 * 1. Nenhum dos 6 pontos do código que montavam série temporal (Dashboard,
 *    Acessos, Conteúdos, Beezz, Audiência) ordenava por data — com poucos
 *    dias isso não aparecia, mas com um período longo (ex: "Este ano") a
 *    ordem virava a ordem que a BeeHome devolveu, não a cronológica, e o
 *    gráfico desenhava ziguezague ("datas aleatórias").
 * 2. Um período longo com granularidade diária tem pontos demais pra ler —
 *    a BeeHome só documenta granularidade diária (nenhum endpoint devolve
 *    agregado mensal pronto), então agrupar por mês em períodos longos é um
 *    CÁLCULO nosso sobre dado real, não um dado que a BeeHome fornece direto
 *    — daí o parâmetro `mode` explícito, pra deixar claro que é soma ou
 *    média, nunca um valor inventado.
 *
 * Regra: período de até 62 dias (~2 meses) mantém granularidade diária —
 * dá pra ler um ponto por dia sem poluir. Período maior agrupa por mês.
 *
 * `mode`:
 * - "sum": pra métricas de contagem de evento (logins, publicações,
 *   atividade) — total do mês é a soma dos dias.
 * - "average": pra métricas de "estoque"/snapshot (usuários ativos num dia)
 *   — somar dias de uma métrica que já é uma contagem de pessoas ativas
 *   naquele dia infla o número sem sentido; a média diária do mês é o
 *   agregado correto.
 */
export function bucketTimeSeries(points: TimeSeriesPoint[], range: DateRange, mode: "sum" | "average"): TimeSeriesPoint[] {
  const sorted = [...points].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const spanDays = differenceInCalendarDays(new Date(range.to), new Date(range.from)) + 1;
  if (spanDays <= 62) return sorted;

  const byMonth = new Map<string, number[]>();
  for (const p of sorted) {
    const monthKey = p.date.slice(0, 7); // yyyy-MM
    const bucket = byMonth.get(monthKey) ?? [];
    bucket.push(p.value);
    byMonth.set(monthKey, bucket);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([month, values]) => ({
      date: `${month}-01`,
      value: mode === "sum" ? values.reduce((s, v) => s + v, 0) : values.reduce((s, v) => s + v, 0) / values.length,
    }));
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
  // Confirmado com chamada real a `newsGetPublishedNewsChart`: a data vem
  // como epoch em milissegundos (número), não como texto — formato
  // diferente de `day`/`date`/`dayString` acima.
  if (typeof row.regDate === "number" && row.regDate > 0) return new Date(row.regDate).toISOString().slice(0, 10);
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

/**
 * Extrai um item de conteúdo (notícia) de uma linha de
 * `newsListMostViewedNews`/`ListMostLikedNews`/`ListMostCommentedNews`.
 * Confirmado com chamada real (25/08/2026): o título vem em `newsTitle`
 * (não `title`/`name`), as métricas vêm em `viewsCount`/`likesCount`/
 * `commentsCount`, e `id` vem sempre `0` (não é um identificador real) — por
 * isso usa o próprio título como chave estável para unir os 3 rankings em
 * content/route.ts, em vez de um id que não distingue nada.
 */
export function toContentItem(row: Record<string, unknown>): ContentItem | null {
  const title = (row.newsTitle ?? row.title ?? row.name) as string | undefined;
  if (!title) return null;
  const realId = row.id && row.id !== 0 ? String(row.id) : null;
  return {
    id: realId ?? title,
    title,
    type: "noticia" as const,
    publishedAt: String(row.publishedAt ?? row.date ?? row.createdAt ?? ""),
    author: String(row.author ?? row.authorName ?? ""),
    views: toNumber(row.viewsCount ?? row.views ?? row.viewCount ?? row.uniqueViews),
    likes: toNumber(row.likesCount ?? row.likes ?? row.likeCount),
    comments: toNumber(row.commentsCount ?? row.comments ?? row.commentCount),
    performance: "na_media" as const, // classificado depois, com base na média real do conjunto retornado
  };
}

/**
 * Extrai um Beezz de uma linha de `beedataBeezzLikeTop`/`beedataBeezzCommentTop`.
 * Confirmado com chamada real (25/08/2026): o conteúdo vem aninhado em
 * `row.beezz` (id, text/shortText, creator.fullName) — não solto na raiz da
 * linha, que só tem `count`/`userId`/`entityId`. `row.count` é a métrica que
 * ordena aquele ranking específico (curtidas em beedataBeezzLikeTop,
 * comentários em beedataBeezzCommentTop) — a BeeHome não distingue os dois
 * campos na resposta, então o mesmo `count` alimenta likes OU comments
 * dependendo de qual endpoint chamou.
 */
export function toBeezzPost(row: Record<string, unknown>, index: number): BeezzPost | null {
  const beezz = (row.beezz && typeof row.beezz === "object" ? row.beezz : {}) as Record<string, unknown>;
  const creator = (beezz.creator && typeof beezz.creator === "object" ? beezz.creator : {}) as Record<string, unknown>;
  const title = (beezz.shortText ?? beezz.text ?? row.title ?? row.text ?? row.name) as string | undefined;
  if (!title) return null;
  const rawId = beezz.id ?? row.entityId ?? row.id;
  return {
    id: rawId !== undefined && rawId !== null && rawId !== 0 ? String(rawId) : String(index),
    title,
    author: String(creator.fullName ?? row.author ?? row.authorName ?? row.userName ?? ""),
    createdAt: String(beezz.createdAt ?? row.createdAt ?? row.date ?? ""),
    likes: toNumber(row.likes ?? row.likeCount ?? row.count),
    comments: toNumber(row.comments ?? row.commentCount),
  };
}

/**
 * Extrai o ranking de criadores de Beezz a partir de `beedataUserCreateBeezzTop`.
 * Confirmado com chamada real (25/08/2026): o nome vem aninhado em
 * `row.user.fullName` (não solto na raiz) — schema próprio desse endpoint,
 * diferente do `toRankingItems` genérico (que só olha campos soltos).
 */
export function toCreatorRanking(payload: unknown): RankingItem[] {
  return asList(payload)
    .map((row, index) => {
      const user = (row.user && typeof row.user === "object" ? row.user : {}) as Record<string, unknown>;
      const name = user.fullName as string | undefined;
      if (!name || row.count === undefined) return null;
      const id = user.id !== undefined && user.id !== null ? String(user.id) : String(index);
      return { id, name, value: toNumber(row.count) };
    })
    .filter((item): item is RankingItem => item !== null);
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
