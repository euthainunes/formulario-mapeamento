"use client";

/**
 * Helper de fetch usado pelas implementações `Api*Repository` (modo
 * `appConfig.dataSource === "api"`). Chama sempre um Route Handler relativo
 * do próprio Next.js (`/api/...`) — nunca o backend diretamente — então não
 * há CORS envolvido e o cookie httpOnly de sessão é enviado automaticamente
 * pelo navegador (same-origin).
 *
 * Em caso de 401 (sessão expirada/ausente), dispara um evento
 * "beehome:unauthorized" no `window` em vez de importar o auth store
 * diretamente (evitaria import circular, já que o store também usa este
 * helper para o fluxo de login). Um listener montado no layout autenticado
 * (ver src/app/(dashboard)/layout.tsx) faz logout + redirect para /login.
 */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("beehome:unauthorized"));
    }
    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }

  const text = await response.text();
  const data = text.length > 0 ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = (data && (data.message || data.error)) || `Erro ao chamar ${path} (status ${response.status}).`;
    throw new ApiError(response.status, Array.isArray(message) ? message.join(", ") : message);
  }

  return data as T;
}

/** Monta uma querystring a partir de um objeto, ignorando valores nulos/undefined/vazios. */
export function toQueryString(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
