/**
 * Cliente HTTP para a Intranet BeeHome — usado SOMENTE do lado do servidor
 * (Route Handlers), nunca no navegador. Porta fiel do conector que existia
 * no backend NestJS (backend/src/sync/connectors/beehome.connector.ts e
 * beehome-endpoints.ts), sem a camada de banco de dados: aqui não há
 * persistência nem fila — cada chamada busca o dado direto na BeeHome, em
 * tempo real, a cada requisição.
 *
 * Autenticação: header `Authorization: Bearer <token>`, token lido de
 * `BEEHOME_BEARER_TOKEN`. Catálogo de endpoints idêntico ao documento
 * oficial "Documentação de APIs — BeeHome (Rede Américas)" v2.0 — nada
 * inventado aqui além do que já estava validado no backend.
 */

import { getBeeHomeTokenOverride } from "@/lib/server/beehome-token";

export class BeeHomeApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly endpointAlias?: string,
  ) {
    super(message);
    this.name = "BeeHomeApiError";
  }
}

// Catálogo FECHADO — cópia fiel de backend/src/sync/beehome-endpoints.ts.
// Não adicione paths aqui sem confirmação explícita da equipe BeeHome.
export const BEEHOME_ENDPOINTS = {
  peopleToday: "/api/insights/peopleToday",
  peopleChart: "/api/insights/people/chart",
  device: "/api/insights/people/chart/device",
  peopleTable: "/api/insights/people/chart/table",
  // ⚠️ CONFIRMADO COM CHAMADA REAL (25/08/2026): este path retorna
  // {"message":"Endpoint nao encontrado: GET /api/insights/reaction"} — ou
  // seja, está ERRADO ou desatualizado no documento oficial da BeeHome.
  // Path correto ainda não confirmado — não adivinhar, perguntar ao time
  // BeeHome. Enquanto isso, /api/engagement degrada com segurança (fica
  // vazio) em vez de quebrar.
  reaction: "/api/insights/reaction",
  auditLogins: "/audit/logins",
  auditLoginsByDate: "/audit/loginsByDate",
  auditAverageLoginsByHour: "/audit/averageLoginsByHour",
  // ⚠️ CONFIRMADO COM CHAMADA REAL (25/08/2026): o servidor da BeeHome
  // devolve 500 (NullPointerException: "date must not be null", em
  // AuditRecordBusinessImpl.countAverageLoginsDay) com startDate/endDate —
  // os mesmos params documentados que funcionam em auditLoginsByDate. Bug
  // do lado deles nesse endpoint específico, não nosso — reportar ao time
  // BeeHome. /api/access já degrada com segurança (averageByWeekday fica
  // vazio) em vez de quebrar.
  auditAverageLoginsByDay: "/audit/averageLoginsByDay",
  insightsAccessByYear: "/api/insights/access",
  newsListMostViewedNews: "/news/listMostViewedNews",
  newsListMostLikedNews: "/news/listMostLikedNews",
  newsListMostCommentedNews: "/news/listMostCommentedNews",
  newsGetPublishedNewsChart: "/news/getPublishedNewsChart",
  beedataBeezzLikeTop: "/beedata/beezz/like/top",
  beedataBeezzLikeTopCount: "/beedata/beezz/like/top/count",
  beedataBeezzCommentTop: "/beedata/beezz/comment/top",
  beedataUserCreateBeezzTop: "/beedata/user/create/beezz/top",
  auditListTimelineByDate: "/audit/list/listTimelineByDate",
  auditBeezzReactions: "/audit/beezz/reactions",
  directoryListUsersExport: "/directory/listUsersExport",
  directoryListUsersSkillsExportNew: "/directory/listUsersSkillsExport/new",
  podAuditListMostAccessed: "/pod/audit/list/mostAccessed",
  podAuditListLeastAccessed: "/pod/audit/list/leastAccessed",
  awardCheck: "/api/award/check",
  awardUsersCheck: "/api/award/users/check",
  awardListAdmissionAwardByMonth: "/api/award/list/admissionAwardByMonth",
} as const;

export type BeeHomeEndpointAlias = keyof typeof BEEHOME_ENDPOINTS;

const MAX_RETRIES = Number(process.env.BEEHOME_MAX_RETRIES ?? 3);
const RETRY_BASE_MS = Number(process.env.BEEHOME_RETRY_BASE_MS ?? 300);
const TIMEOUT_MS = Number(process.env.BEEHOME_TIMEOUT_MS ?? 10000);

function baseUrl(): string {
  const url = process.env.BEEHOME_BASE_URL;
  if (!url) throw new Error("BEEHOME_BASE_URL não está definido.");
  return url;
}

/** Prioriza o token colado manualmente na tela de Integrações (cookie httpOnly, ver beehome-token.ts) sobre a variável de ambiente — permite trocar o token em uso sem redeploy. */
async function token(): Promise<string> {
  const override = await getBeeHomeTokenOverride();
  if (override) return override;
  const t = process.env.BEEHOME_BEARER_TOKEN;
  if (!t) throw new Error("BEEHOME_BEARER_TOKEN não está definido.");
  return t;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Chamada GET a um endpoint documentado, com retry exponencial em 429/5xx
 * (não retenta em 401/403) e timeout. Nunca inclui o token em mensagens de
 * erro/log.
 */
export async function callBeeHome<T = unknown>(alias: BeeHomeEndpointAlias, params?: Record<string, unknown>): Promise<T> {
  const path = BEEHOME_ENDPOINTS[alias];
  const url = new URL(path, baseUrl());
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
    }
  }

  let attempt = 0;
  for (;;) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${await token()}`, Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeoutHandle);

      if (response.ok) return (await response.json()) as T;

      const status = response.status;
      if (status === 401 || status === 403) {
        throw new BeeHomeApiError(`Falha de autenticação/autorização ao chamar BeeHome (${alias})`, status, alias);
      }

      const retryable = status === 429 || status >= 500;
      if (!retryable || attempt >= MAX_RETRIES) {
        throw new BeeHomeApiError(`Falha ao consultar BeeHome (${alias}): HTTP ${status}`, status, alias);
      }
    } catch (err) {
      clearTimeout(timeoutHandle);
      if (err instanceof BeeHomeApiError) throw err;
      if (attempt >= MAX_RETRIES) {
        throw new BeeHomeApiError(`Falha ao conectar à BeeHome (${alias}): ${(err as Error).message}`, undefined, alias);
      }
    }

    const delay = RETRY_BASE_MS * 2 ** attempt;
    await sleep(delay);
    attempt++;
  }
}
