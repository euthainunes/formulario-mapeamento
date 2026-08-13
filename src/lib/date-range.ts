import { subDays, format, differenceInCalendarDays } from "date-fns";
import { DateRange, PeriodPreset } from "@/types/filters";

export const REFERENCE_TODAY = new Date("2026-08-13T12:00:00");

export function isoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function rangeForPreset(preset: PeriodPreset, custom?: DateRange): DateRange {
  if (preset === "custom" && custom) return custom;
  const days = preset === "7d" ? 7 : preset === "90d" ? 90 : 30;
  return {
    from: isoDate(subDays(REFERENCE_TODAY, days - 1)),
    to: isoDate(REFERENCE_TODAY),
  };
}

/** Retorna o intervalo imediatamente anterior, com a mesma duração em dias. */
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

export const PERIOD_LABELS: Record<PeriodPreset, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  custom: "Personalizado",
};
