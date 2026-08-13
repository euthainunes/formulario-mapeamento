import * as crypto from 'node:crypto';

/**
 * Extrai um identificador estável de um registro cru vindo da BeeHome, cujo
 * formato exato de payload NÃO é conhecido (ver beehome-endpoints.ts).
 * Tenta campos de id comuns; na ausência de qualquer um, deriva um hash
 * determinístico do próprio conteúdo para permitir upsert idempotente
 * (mesmo registro sincronizado duas vezes não duplica).
 */
export function deriveSourceId(item: unknown): string {
  if (item && typeof item === 'object') {
    const obj = item as Record<string, unknown>;
    const candidate = obj.id ?? obj.sourceId ?? obj._id ?? obj.uuid;
    if (candidate !== undefined && candidate !== null) return String(candidate);
  }
  const hash = crypto.createHash('sha1').update(JSON.stringify(item ?? {})).digest('hex');
  return `hash:${hash}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function firstDefined<T = any>(obj: Record<string, unknown>, keys: string[]): T | undefined {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key] as T;
  }
  return undefined;
}

export function toDateOrNow(value: unknown): Date {
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Normaliza a resposta de um endpoint BeeHome (formato desconhecido) para
 * uma lista de registros iteráveis. Aceita array direto ou objetos comuns
 * de envelope ({ data: [...] }, { items: [...] }, { results: [...] }).
 */
export function asRecordList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    for (const key of ['data', 'items', 'results', 'records']) {
      if (Array.isArray(obj[key])) return obj[key] as Record<string, unknown>[];
    }
  }
  return [];
}
