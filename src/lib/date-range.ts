import { subDays, subMonths, subYears, startOfMonth, endOfMonth, startOfQuarter, startOfYear, endOfYear, format, differenceInCalendarDays } from "date-fns";
import { DateRange, PeriodPreset } from "@/types/filters";
import { appConfig } from "@/lib/app-config";

/** Data fixa, só para o modo mock (demonstração reproduzível) — nunca usada em modo real. */
export const REFERENCE_TODAY = new Date("2026-08-13T12:00:00");

/** Data de referência "hoje" — real em modo api, fixa em modo mock. Usar sempre esta função (nunca REFERENCE_TODAY direto) fora do próprio mock. */
export function referenceToday(): Date {
  return appConfig.dataSource === "mock" ? REFERENCE_TODAY : new Date();
}

export function isoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  today: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  "this-month": "Este mês",
  "last-month": "Mês anterior",
  "this-quarter": "Este trimestre",
  "this-year": "Este ano",
  "last-year": "Ano anterior",
  custom: "Personalizado",
};

export function rangeForPreset(preset: PeriodPreset, custom?: DateRange): DateRange {
  const today = referenceToday();

  if (preset === "custom") return custom ?? { from: isoDate(today), to: isoDate(today) };
  if (preset === "today") return { from: isoDate(today), to: isoDate(today) };
  if (preset === "7d") return { from: isoDate(subDays(today, 6)), to: isoDate(today) };
  if (preset === "30d") return { from: isoDate(subDays(today, 29)), to: isoDate(today) };
  if (preset === "90d") return { from: isoDate(subDays(today, 89)), to: isoDate(today) };
  if (preset === "this-month") return { from: isoDate(startOfMonth(today)), to: isoDate(today) };
  if (preset === "last-month") {
    const lastMonth = subMonths(today, 1);
    return { from: isoDate(startOfMonth(lastMonth)), to: isoDate(endOfMonth(lastMonth)) };
  }
  if (preset === "this-quarter") return { from: isoDate(startOfQuarter(today)), to: isoDate(today) };
  if (preset === "this-year") return { from: isoDate(startOfYear(today)), to: isoDate(today) };
  // last-year
  const lastYear = subYears(today, 1);
  return { from: isoDate(startOfYear(lastYear)), to: isoDate(endOfYear(lastYear)) };
}

/** Retorna o intervalo imediatamente anterior, com a mesma duração em dias — usado pra comparação "vs. período anterior". */
export function previousRange(range: DateRange): DateRange {
  const from = new Date(range.from);
  const to = new Date(range.to);
  const spanDays = differenceInCalendarDays(to, from) + 1;
  const prevTo = subDays(from, 1);
  const prevFrom = subDays(prevTo, spanDays - 1);
  return { from: isoDate(prevFrom), to: isoDate(prevTo) };
}

export function isWithinRange(dateIso: string, range: DateRange): boolean {
  return dateIso >= range.from && dateIso <= range.to;
}
