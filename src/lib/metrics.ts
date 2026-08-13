import { VariationResult } from "@/types/metrics";

/**
 * Calcula a variação percentual entre o valor atual e o anterior.
 * Regra de negócio obrigatória: se o período anterior for zero, a variação
 * não é calculada — não existe "dado comparável".
 */
export function calcVariation(current: number, previous: number): VariationResult {
  if (previous === 0) {
    return {
      current,
      previous,
      comparable: false,
      percentChange: null,
      direction: current === 0 ? "flat" : "none",
    };
  }
  const percentChange = ((current - previous) / previous) * 100;
  return {
    current,
    previous,
    comparable: true,
    percentChange,
    direction: percentChange > 0.01 ? "up" : percentChange < -0.01 ? "down" : "flat",
  };
}

export const METRIC_FORMULAS: Record<string, string> = {
  activeUsersRate: "usuários ativos ÷ base total de colaboradores × 100",
  engagementRate: "(curtidas + comentários) ÷ visualizações × 100",
  variation: "(valor atual − valor do período anterior) ÷ valor do período anterior × 100",
  dailyAverage: "total de acessos no período ÷ número de dias do período",
  peakHour: "hora do dia com maior volume de logins somado no período",
  participation: "acessos ao pod ÷ total de acessos a todos os pods × 100",
  tenureAverage: "soma do tempo de empresa (em meses) de todos os colaboradores ÷ número de colaboradores",
};
