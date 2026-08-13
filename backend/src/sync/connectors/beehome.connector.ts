import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { BEEHOME_ENDPOINTS, BeeHomeEndpointAlias } from '../beehome-endpoints';

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
 * ATENÇÃO — validação técnica pendente (ver beehome-endpoints.ts):
 *  - Assumimos requisições GET com querystring para todos os endpoints
 *    abaixo. Isso é uma suposição de implementação, não um contrato
 *    confirmado. Quando o método HTTP real, paginação e payload forem
 *    validados com o time BeeHome, ajustar cada método correspondente.
 *  - Autenticação: header `Authorization: Bearer <token>`, token lido de
 *    variável de ambiente (BEEHOME_BEARER_TOKEN) — nunca hardcoded.
 *  - DNS específico por tenant: BEEHOME_BASE_URL pode ser sobrescrito por
 *    tenant (ver Tenant.beehomeBaseUrl); quando não informado, cai no valor
 *    global de ambiente.
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
    const path = BEEHOME_ENDPOINTS[alias];
    const client = this.client(baseUrlOverride);

    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const response = await client.get<T>(path, { params });
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
  exportLoginsByDate(params?: Record<string, unknown>) {
    return this.get('auditExportLoginsByDate', params);
  }
  getLoginTimeline(params?: Record<string, unknown>) {
    return this.get('auditListTimelineByDate', params);
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
  getTopBeezzComments(params?: Record<string, unknown>) {
    return this.get('beedataBeezzCommentTop', params);
  }
  getTopUserCreateBeezz(params?: Record<string, unknown>) {
    return this.get('beedataUserCreateBeezzTop', params);
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
