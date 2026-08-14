import { addDays } from "date-fns";
import { REFERENCE_TODAY } from "@/lib/date-range";

/**
 * Retorna um ISO datetime relativo a REFERENCE_TODAY (a data "hoje" fixa
 * usada por todo o app para manter os mocks determinísticos entre reloads).
 * `offsetDays` negativo = passado, positivo = futuro.
 */
export function relativeIso(offsetDays: number, hour = 12, minute = 0): string {
  const date = addDays(REFERENCE_TODAY, offsetDays);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function relativeDate(offsetDays: number): string {
  return relativeIso(offsetDays).slice(0, 10);
}
