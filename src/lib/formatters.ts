import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(value));
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits).replace(".", ",")}%`;
}

export function formatDate(iso: string, pattern = "dd/MM/yyyy"): string {
  try {
    return format(parseISO(iso), pattern, { locale: ptBR });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  return formatDate(iso, "dd/MM/yyyy 'às' HH:mm");
}

export function formatShortDate(iso: string): string {
  return formatDate(iso, "dd/MM");
}

/** Formata valores vindos de callbacks de gráficos (Recharts), que podem chegar como
 * string, número, array ou undefined dependendo do tipo de série. */
export function formatChartValue(value: unknown): string {
  if (Array.isArray(value)) return value.map((v) => formatChartValue(v)).join(" - ");
  const num = Number(value);
  return Number.isFinite(num) ? formatNumber(num) : String(value ?? "");
}
