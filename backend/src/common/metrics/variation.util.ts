export interface VariationResult {
  current: number;
  previous: number;
  comparable: boolean;
  percentChange: number | null;
  direction: 'up' | 'down' | 'flat' | 'none';
}

/**
 * Calcula a variação percentual entre dois períodos.
 *
 * Regra de negócio obrigatória: nunca calcular variação percentual quando o
 * período anterior for zero — nesse caso retorna `comparable: false` e
 * `percentChange: null`, para que a UI exiba "sem dado comparável" em vez de
 * uma divisão por zero disfarçada (Infinity/NaN).
 */
export function calculateVariation(current: number, previous: number): VariationResult {
  if (previous === 0) {
    return {
      current,
      previous,
      comparable: false,
      percentChange: null,
      direction: current === 0 ? 'none' : 'none',
    };
  }

  const percentChange = ((current - previous) / previous) * 100;
  let direction: VariationResult['direction'] = 'flat';
  if (percentChange > 0) direction = 'up';
  else if (percentChange < 0) direction = 'down';

  return {
    current,
    previous,
    comparable: true,
    percentChange,
    direction,
  };
}
