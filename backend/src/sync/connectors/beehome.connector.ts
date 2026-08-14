import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { BEEHOME_ENDPOINTS, BEEHOME_BINARY_EXPORT_ENDPOINTS, BeeHomeEndpointAlias } from '../beehome-endpoints';

export class BeeHomeApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly endpointAlias?: string,
  ) {
    super(message);
    this.name = 'BeeHomeApiError';
  }
}

/**
 * Adapter HTTP para a Intranet BeeHome.
 *
 * Método HTTP, paths e parâmetros por endpoint são os do documento oficial
 * "Documentação de APIs — BeeHome (Rede Américas)" v2.0 (ver comentários em
 * beehome-endpoints.ts) — GET para consulta/listagem, POST para exportação
 * (retornando um arquivo binário .xls, não JSON). Três endpoints ainda têm
 * o path exato não confirmado (marcados em beehome-endpoints.ts). O formato
 * exato do payload JSON de cada resposta segue sem validação empírica —
 * nenhuma chamada real foi possível a partir do ambiente de desenvolvimento
 * (política de rede/egress do sandbox bloqueia o domínio da BeeHome; validar
 * a partir de um ambiente com acesso real à internet antes de produção).
 *
 * Autenticação: header `Authorization: Bearer <token>`, token lido de
 * variável de ambiente (BEEHOME_BEARER_TOKEN) — nunca hardcoded. DNS
 * específico por tenant: BEEHOME_BASE_URL pode ser sobrescrito por tenant
 * (ver Tenant.beehomeBaseUrl); quando não informado, cai no valor global de
 * ambiente. Sem sessão server-side nem cookie — o tenant é resolvido pela
 * própria BeeHome a partir do conteúdo do token.
 */
@Injectable()
export class BeeHomeConnector {
  private readonly logger = new Logger(BeeHomeConnector.name);
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    this.maxRetries = Number(this.config.get('BEEHOME_MAX_RETRIES') ?? 3);
    this.retryBaseDelayMs = Number(this.config.get('BEEHOME_RETRY_BASE_MS') ?? 300);
    this.timeoutMs = Number(this.config.get('BEEHOME_TIMEOUT_MS') ?? 10000);
  }

  private client(baseUrlOverride?: string): AxiosInstance {
    const baseURL = baseUrlOverride || this.config.get<string>('BEEHOME_BASE_URL') || '';
    const token = this.config.get<string>('BEEHOME_BEARER_TOKEN') || '';

    return axios.create({
      baseURL,
      timeout: this.timeoutMs,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
  }

  /**
   * Executa uma chamada GET a um endpoint documentado, com retry
   * exponencial em 429/5xx (não retenta em 401/403/4xx em geral) e timeout.
   * Nunca inclui o token em mensagens de erro/log.
   */
  private async get<T = unknown>(alias: BeeHomeEndpointAlias, params?: Record<string, unknown>, baseUrlOverride?: string): Promise<T> {
    return this.request<T>(alias, { method: 'GET', params }, baseUrlOverride);
  }

  /**
   * Executa uma chamada POST (usada pelos endpoints de exportação, que
   * recebem os filtros no corpo e devolvem um arquivo binário .xls). Mesma
   * política de retry/erro do `get`.
   */
  private async post<T = unknown>(alias: BeeHomeEndpointAlias, body?: Record<string, unknown>, baseUrlOverride?: string): Promise<T> {
    const binary = BEEHOME_BINARY_EXPORT_ENDPOINTS.includes(alias);
    return this.request<T>(alias, { method: 'POST', data: body, responseType: binary ? 'arraybuffer' : 'json' }, baseUrlOverride);
  }

  private async request<T = unknown>(alias: BeeHomeEndpointAlias, requestConfig: AxiosRequestConfig, baseUrlOverride?: string): Promise<T> {
    const path = BEEHOME_ENDPOINTS[alias];
    const client = this.client(baseUrlOverride);

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const response = await client.request<T>({ url: path, ...requestConfig });
        return response.data;
      } catch (err) {
        const axiosErr = err as AxiosError;
        const status = axiosErr.response?.status;

        if (status === 401 || status === 403) {
          this.logger.warn(`BeeHome retornou ${status} em ${alias} (não é retentável — verificar token/permissões)`);
          throw new BeeHomeApiError(`Falha de autenticação/autorização ao chamar BeeHome (${alias})`, status, alias);
        }

        const retryable = status === 429 || (status !== undefined && status >= 500);
        if (!retryable || attempt >= this.maxRetries) {
          this.logger.error(`Erro ao chamar BeeHome (${alias}), status=${status ?? 'sem resposta'}, tentativas=${attempt + 1}`);
          throw new BeeHomeApiError(`Falha ao consultar BeeHome (${alias})${status ? `: HTTP ${status}` : ''}`, status, alias);
        }

        const delay = this.retryBaseDelayMs * 2 ** attempt;
        this.logger.warn(`BeeHome ${alias} retornou ${status}, retry ${attempt + 1}/${this.maxRetries} em ${delay}ms`);
        await this.sleep(delay);
        attempt++;
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ---- Insights de pessoas ----
  getPeopleToday(params?: Record<string, unknown>) {
    return this.get('peopleToday', params);
  }
  getPeopleChart(params?: Record<string, unknown>) {
    return this.get('peopleChart', params);
  }
  getPeopleTable(params?: Record<string, unknown>) {
    return this.get('peopleTable', params);
  }

  // ---- Dispositivos ----
  getDevices(params?: Record<string, unknown>) {
    return this.get('device', params);
  }

  // ---- Reações (alimenta Engajamento e Reações) ----
  /** `params.type` deve ser um dos 12 valores documentados (ver beehome-endpoints.ts). */
  getReaction(params: Record<string, unknown>) {
    return this.get('reaction', params);
  }

  // ---- Auditoria de login ----
  getLogins(params?: Record<string, unknown>) {
    return this.get('auditLogins', params);
  }
  getLoginsByDate(params?: Record<string, unknown>) {
    return this.get('auditLoginsByDate', params);
  }
  getAverageLoginsByHour(params?: Record<string, unknown>) {
    return this.get('auditAverageLoginsByHour', params);
  }
  getAverageLoginsByDay(params?: Record<string, unknown>) {
    return this.get('auditAverageLoginsByDay', params);
  }
  /** POST — retorna um arraybuffer .xls, não JSON. */
  exportLoginsByDate(body?: Record<string, unknown>) {
    return this.post<ArrayBuffer>('auditExportLoginsByDate', body);
  }
  getLoginTimeline(params?: Record<string, unknown>) {
    return this.get('auditListTimelineByDate', params);
  }
  /** Reações em Beezz no período (distinto de getReaction, que é o consolidado de todos os tipos). */
  getBeezzReactions(params?: Record<string, unknown>) {
    return this.get('auditBeezzReactions', params);
  }
  getInsightsAccessByYear(params: { year: number | string }) {
    return this.get('insightsAccessByYear', params);
  }

  // ---- Notícias ----
  getPublishedNewsChart(params?: Record<string, unknown>) {
    return this.get('newsGetPublishedNewsChart', params);
  }
  listMostViewedNews(params?: Record<string, unknown>) {
    return this.get('newsListMostViewedNews', params);
  }
  listMostLikedNews(params?: Record<string, unknown>) {
    return this.get('newsListMostLikedNews', params);
  }
  listMostCommentedNews(params?: Record<string, unknown>) {
    return this.get('newsListMostCommentedNews', params);
  }

  // ---- Beezz ----
  getTopBeezzLikes(params?: Record<string, unknown>) {
    return this.get('beedataBeezzLikeTop', params);
  }
  getTopBeezzLikesCount() {
    return this.get('beedataBeezzLikeTopCount');
  }
  getTopBeezzComments(params?: Record<string, unknown>) {
    return this.get('beedataBeezzCommentTop', params);
  }
  getTopUserCreateBeezz(params?: Record<string, unknown>) {
    return this.get('beedataUserCreateBeezzTop', params);
  }

  // ---- Diretório / relatórios ----
  /** Path exato não confirmado — ver aviso em beehome-endpoints.ts (directoryListUsersExport). */
  getDirectoryListUsers(params?: Record<string, unknown>) {
    return this.get('directoryListUsersExport', params);
  }
  /** POST — retorna um arquivo .xls, não JSON. Path exato não confirmado (mesma ressalva acima). */
  exportDirectoryUsersReport(body?: Record<string, unknown>) {
    return this.post<ArrayBuffer>('directoryExportUsersReport', body);
  }
  getDirectoryListUsersSkills(params?: Record<string, unknown>) {
    return this.get('directoryListUsersSkillsExportNew', params);
  }
  /** POST — retorna um arquivo .xls, não JSON. */
  exportReportLoginAudit(body?: Record<string, unknown>) {
    return this.post<ArrayBuffer>('auditExportReportLoginAudit', body);
  }

  // ---- Pods ----
  getPodMostAccessed(params?: Record<string, unknown>) {
    return this.get('podAuditListMostAccessed', params);
  }
  getPodLeastAccessed(params?: Record<string, unknown>) {
    return this.get('podAuditListLeastAccessed', params);
  }

  // ---- Premiações ----
  checkAward(params?: Record<string, unknown>) {
    return this.get('awardCheck', params);
  }
  checkUsersAward(params?: Record<string, unknown>) {
    return this.get('awardUsersCheck', params);
  }
  getAdmissionAwardByMonth(params?: Record<string, unknown>) {
    return this.get('awardListAdmissionAwardByMonth', params);
  }
}
