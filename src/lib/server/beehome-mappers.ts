import { NextRequest } from "next/server";
import { subDays, format } from "date-fns";
import { calcVariation } from "@/lib/metrics";
import { KpiCard, RankingItem } from "@/types/metrics";

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

/** Constrói o breakdown por dispositivo (count + percent) a partir da resposta de `device`. */
export function deviceBreakdownFrom(rows: Record<string, unknown>[]) {
  const total = rows.reduce((sum, row) => sum + toNumber(row.count ?? row.total), 0);
  return rows
    .map((row) => {
      const count = toNumber(row.count ?? row.total);
      const name = String(row.device ?? row.name ?? "");
      if (!name) return null;
      return { device: name, count, percent: total > 0 ? (count / total) * 100 : 0 };
    })
    .filter((d): d is { device: string; count: number; percent: number } => d !== null);
}
