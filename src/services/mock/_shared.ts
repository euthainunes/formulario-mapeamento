/**
 * Utilitários compartilhados pelas implementações mockadas dos repositories.
 * Simulam latência de rede e, ocasionalmente, estados de erro/cobertura parcial,
 * para que os componentes de UI exerçam os estados de loading/erro/parcial de verdade.
 */

export function delay<T>(value: T, minMs = 400, maxMs = 800): Promise<T> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Retorna true com a probabilidade informada (0-1). Usado para simular erro/parcial ocasionalmente. */
export function chance(probability: number): boolean {
  return Math.random() < probability;
}

export class MockRepositoryError extends Error {
  constructor(message = "Falha simulada ao carregar dados do ambiente demonstrativo.") {
    super(message);
    this.name = "MockRepositoryError";
  }
}
