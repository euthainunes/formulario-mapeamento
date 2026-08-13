export interface ResolvedPeriod {
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
}

/**
 * Resolve o período corrente e o período anterior de mesma duração
 * imediatamente antecedente, usado para calcular variação percentual.
 */
export function resolvePeriod(fromIso: string, toIso: string): ResolvedPeriod {
  const from = new Date(fromIso);
  const to = new Date(toIso);
  const durationMs = Math.max(to.getTime() - from.getTime(), 24 * 60 * 60 * 1000);

  const previousTo = new Date(from.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - durationMs);

  return { from, to, previousFrom, previousTo };
}
