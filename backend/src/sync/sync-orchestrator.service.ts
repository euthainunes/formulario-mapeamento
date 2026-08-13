import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { BeeHomeConnector, BeeHomeApiError } from './connectors/beehome.connector';
import { InsightsService } from '../insights/insights.service';
import { asRecordList, deriveSourceId, firstDefined, toDateOrNow } from './normalize.util';
import { BeeHomeEndpointAlias } from './beehome-endpoints';

type TargetTable = 'loginEvent' | 'device' | 'news' | 'beezz' | 'pod' | 'award' | 'admissionAward' | 'raw';

interface SyncStep {
  alias: BeeHomeEndpointAlias;
  targetTable: TargetTable;
  fetch: (connector: BeeHomeConnector) => Promise<unknown>;
}

/**
 * Orquestra o fluxo de sincronização com a BeeHome, seguindo os 15 passos
 * da especificação:
 *  1. autenticar (token via env, injetado no BeeHomeConnector)
 *  2. consultar (chamar o endpoint documentado)
 *  3. validar (checagem defensiva do payload recebido)
 *  4. registrar log (SyncLog por endpoint)
 *  5. normalizar (mapear campos conhecidos; o resto vai para metadataJson —
 *     ver aviso em beehome-endpoints.ts sobre payload não confirmado)
 *  6. upsert sem duplicidade (chave tenant+source_id)
 *  7. snapshot histórico (MetricSnapshot)
 *  8. recalcular métricas (agregações simples pós-sync)
 *  9. avaliar alertas (comparar métricas recalculadas com AlertRule.threshold)
 *  10. gerar insights (camada de regras determinísticas — InsightsModule)
 *  11. timestamp de última sync (SyncJob.finishedAt)
 *  (passos adicionais de retry/timeout/tratamento de erro já vivem no
 *  BeeHomeConnector, chamado no passo 2)
 */
@Injectable()
export class SyncOrchestratorService {
  private readonly logger = new Logger(SyncOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly connector: BeeHomeConnector,
    private readonly insightsService: InsightsService,
  ) {}

  private steps(): SyncStep[] {
    return [
      { alias: 'device', targetTable: 'device', fetch: (c) => c.getDevices() },
      { alias: 'auditLoginsByDate', targetTable: 'loginEvent', fetch: (c) => c.getLoginsByDate() },
      { alias: 'auditLogins', targetTable: 'loginEvent', fetch: (c) => c.getLogins() },
      { alias: 'newsListMostViewedNews', targetTable: 'news', fetch: (c) => c.listMostViewedNews() },
      { alias: 'newsListMostLikedNews', targetTable: 'news', fetch: (c) => c.listMostLikedNews() },
      { alias: 'newsListMostCommentedNews', targetTable: 'news', fetch: (c) => c.listMostCommentedNews() },
      { alias: 'beedataBeezzLikeTop', targetTable: 'beezz', fetch: (c) => c.getTopBeezzLikes() },
      { alias: 'beedataBeezzCommentTop', targetTable: 'beezz', fetch: (c) => c.getTopBeezzComments() },
      { alias: 'podAuditListMostAccessed', targetTable: 'pod', fetch: (c) => c.getPodMostAccessed() },
      { alias: 'podAuditListLeastAccessed', targetTable: 'pod', fetch: (c) => c.getPodLeastAccessed() },
      { alias: 'awardCheck', targetTable: 'award', fetch: (c) => c.checkAward() },
      { alias: 'awardListAdmissionAwardByMonth', targetTable: 'admissionAward', fetch: (c) => c.getAdmissionAwardByMonth() },
      // Endpoints informativos/agregados sem entidade normalizada dedicada
      // ainda (payload de agregação, não de lista de registros) — TODO:
      // desenhar tabela específica quando o formato for validado.
      { alias: 'peopleToday', targetTable: 'raw', fetch: (c) => c.getPeopleToday() },
      { alias: 'peopleChart', targetTable: 'raw', fetch: (c) => c.getPeopleChart() },
      { alias: 'auditAverageLoginsByHour', targetTable: 'raw', fetch: (c) => c.getAverageLoginsByHour() },
      { alias: 'auditAverageLoginsByDay', targetTable: 'raw', fetch: (c) => c.getAverageLoginsByDay() },
      { alias: 'newsGetPublishedNewsChart', targetTable: 'raw', fetch: (c) => c.getPublishedNewsChart() },
      { alias: 'beedataUserCreateBeezzTop', targetTable: 'raw', fetch: (c) => c.getTopUserCreateBeezz() },
      { alias: 'auditListTimelineByDate', targetTable: 'raw', fetch: (c) => c.getLoginTimeline() },
      { alias: 'awardUsersCheck', targetTable: 'raw', fetch: (c) => c.checkUsersAward() },
    ];
  }

  async runFullSync(tenantId: string, triggeredBy: 'manual' | 'scheduler' = 'manual') {
    return this.tenantContext.run(tenantId, async () => {
      const job = await this.prisma.syncJob.create({
        data: { tenantId, source: 'Intranet BeeHome', status: 'em_execucao', triggeredBy },
      });

      let totalRecords = 0;
      let anySuccess = false;
      let anyFailure = false;

      for (const step of this.steps()) {
        const startedAt = new Date();
        try {
          const payload = await step.fetch(this.connector); // passos 1-2: autenticar + consultar
          const records = asRecordList(payload); // passo 3: validação defensiva mínima
          const upserted = await this.normalizeAndUpsert(step.targetTable, records); // passos 5-6

          await this.prisma.syncLog.create({
            data: {
              tenantId,
              syncJobId: job.id,
              endpointAlias: step.alias,
              startedAt,
              finishedAt: new Date(),
              status: 'sucesso',
              recordsRead: records.length,
              recordsUpserted: upserted,
            },
          }); // passo 4: registrar log

          totalRecords += upserted;
          anySuccess = true;
        } catch (err) {
          anyFailure = true;
          const isBeeHomeError = err instanceof BeeHomeApiError;
          await this.prisma.syncLog.create({
            data: {
              tenantId,
              syncJobId: job.id,
              endpointAlias: step.alias,
              startedAt,
              finishedAt: new Date(),
              status: 'falha',
              recordsRead: 0,
              recordsUpserted: 0,
              errorCode: isBeeHomeError ? String(err.status ?? 'unknown') : 'unexpected_error',
              // Nunca logar o erro bruto (pode conter headers) — apenas mensagem já sanitizada pelo connector.
              errorDetail: (err as Error).message,
            },
          });
          this.logger.warn(`Passo de sync falhou: ${step.alias} — ${(err as Error).message}`);
        }
      }

      await this.recalculateMetrics(); // passo 8
      await this.evaluateAlertRules(); // passo 9
      await this.insightsService.getAutoInsights().catch((e) => this.logger.warn(`Falha ao gerar insights pós-sync: ${e.message}`)); // passo 10

      const status = !anyFailure ? 'sucesso' : anySuccess ? 'parcial' : 'falha';

      return this.prisma.syncJob.update({
        where: { id: job.id },
        data: { status, finishedAt: new Date(), recordsProcessed: totalRecords }, // passo 11
        include: { logs: true },
      });
    });
  }

  private async normalizeAndUpsert(targetTable: TargetTable, records: Record<string, unknown>[]): Promise<number> {
    if (targetTable === 'raw' || records.length === 0) return 0;

    const tenantId = this.tenantContext.getTenantId()!;
    let count = 0;

    for (const raw of records) {
      const sourceId = deriveSourceId(raw);
      try {
        switch (targetTable) {
          case 'device':
            await this.prisma.device.upsert({
              where: { tenantId_sourceId: { tenantId, sourceId } },
              create: { tenantId, sourceId, type: firstDefined(raw, ['type', 'deviceType']), label: firstDefined(raw, ['label', 'name']), metadataJson: raw as Prisma.InputJsonValue },
              update: { type: firstDefined(raw, ['type', 'deviceType']), label: firstDefined(raw, ['label', 'name']), metadataJson: raw as Prisma.InputJsonValue },
            });
            break;
          case 'loginEvent':
            await this.prisma.loginEvent.upsert({
              where: { tenantId_sourceId: { tenantId, sourceId } },
              create: {
                tenantId,
                sourceId,
                userSourceId: firstDefined(raw, ['userId', 'userSourceId']),
                occurredAt: toDateOrNow(firstDefined(raw, ['occurredAt', 'date', 'timestamp', 'createdAt'])),
                metadataJson: raw as Prisma.InputJsonValue,
              },
              update: { metadataJson: raw as Prisma.InputJsonValue },
            });
            break;
          case 'news':
            await this.prisma.news.upsert({
              where: { tenantId_sourceId: { tenantId, sourceId } },
              create: {
                tenantId,
                sourceId,
                title: String(firstDefined(raw, ['title', 'name']) ?? 'Sem título'),
                authorName: firstDefined(raw, ['authorName', 'author']),
                publishedAt: firstDefined(raw, ['publishedAt', 'date']) ? toDateOrNow(firstDefined(raw, ['publishedAt', 'date'])) : null,
                views: Number(firstDefined(raw, ['views', 'viewsCount']) ?? 0),
                likes: Number(firstDefined(raw, ['likes', 'likesCount']) ?? 0),
                comments: Number(firstDefined(raw, ['comments', 'commentsCount']) ?? 0),
                metadataJson: raw as Prisma.InputJsonValue,
              },
              update: {
                views: Number(firstDefined(raw, ['views', 'viewsCount']) ?? 0),
                likes: Number(firstDefined(raw, ['likes', 'likesCount']) ?? 0),
                comments: Number(firstDefined(raw, ['comments', 'commentsCount']) ?? 0),
                metadataJson: raw as Prisma.InputJsonValue,
              },
            });
            break;
          case 'beezz':
            await this.prisma.beezz.upsert({
              where: { tenantId_sourceId: { tenantId, sourceId } },
              create: {
                tenantId,
                sourceId,
                title: firstDefined(raw, ['title', 'name']),
                authorName: firstDefined(raw, ['authorName', 'author']),
                likes: Number(firstDefined(raw, ['likes', 'likesCount']) ?? 0),
                comments: Number(firstDefined(raw, ['comments', 'commentsCount']) ?? 0),
                metadataJson: raw as Prisma.InputJsonValue,
              },
              update: {
                likes: Number(firstDefined(raw, ['likes', 'likesCount']) ?? 0),
                comments: Number(firstDefined(raw, ['comments', 'commentsCount']) ?? 0),
                metadataJson: raw as Prisma.InputJsonValue,
              },
            });
            break;
          case 'pod':
            await this.prisma.pod.upsert({
              where: { tenantId_sourceId: { tenantId, sourceId } },
              create: {
                tenantId,
                sourceId,
                name: String(firstDefined(raw, ['name', 'title']) ?? 'Pod sem nome'),
                accessCount: Number(firstDefined(raw, ['accessCount', 'count', 'total']) ?? 0),
                metadataJson: raw as Prisma.InputJsonValue,
              },
              update: { accessCount: Number(firstDefined(raw, ['accessCount', 'count', 'total']) ?? 0), metadataJson: raw as Prisma.InputJsonValue },
            });
            break;
          case 'award':
            await this.prisma.award.upsert({
              where: { tenantId_sourceId: { tenantId, sourceId } },
              create: {
                tenantId,
                sourceId,
                userSourceId: firstDefined(raw, ['userId', 'userSourceId']),
                title: firstDefined(raw, ['title', 'name']),
                awardedAt: firstDefined(raw, ['awardedAt', 'date']) ? toDateOrNow(firstDefined(raw, ['awardedAt', 'date'])) : null,
                metadataJson: raw as Prisma.InputJsonValue,
              },
              update: { metadataJson: raw as Prisma.InputJsonValue },
            });
            break;
          case 'admissionAward':
            await this.prisma.admissionAward.upsert({
              where: { tenantId_sourceId: { tenantId, sourceId } },
              create: {
                tenantId,
                sourceId,
                userSourceId: firstDefined(raw, ['userId', 'userSourceId']),
                month: Number(firstDefined(raw, ['month']) ?? 0) || null,
                year: Number(firstDefined(raw, ['year']) ?? 0) || null,
                metadataJson: raw as Prisma.InputJsonValue,
              },
              update: { metadataJson: raw as Prisma.InputJsonValue },
            });
            break;
        }
        count++;
      } catch (err) {
        this.logger.warn(`Falha ao normalizar/upsertar registro (${targetTable}, sourceId=${sourceId}): ${(err as Error).message}`);
      }
    }

    return count;
  }

  private async recalculateMetrics() {
    const tenantId = this.tenantContext.getTenantId()!;
    const now = new Date();
    const periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [loginCount, newsCount, beezzCount, podCount] = await Promise.all([
      this.prisma.loginEvent.count({ where: { occurredAt: { gte: periodStart, lte: now } } }),
      this.prisma.news.count(),
      this.prisma.beezz.count(),
      this.prisma.pod.count(),
    ]);

    const snapshots: { metricCode: string; value: number }[] = [
      { metricCode: 'access.loginsLast24h', value: loginCount },
      { metricCode: 'content.newsTotal', value: newsCount },
      { metricCode: 'beezz.total', value: beezzCount },
      { metricCode: 'pods.total', value: podCount },
    ];

    await this.prisma.metricSnapshot.createMany({
      data: snapshots.map((s) => ({
        tenantId,
        metricCode: s.metricCode,
        metricVersion: 1,
        periodStart,
        periodEnd: now,
        dimensionJson: {},
        value: s.value,
        sourceStatus: 'sucesso',
      })),
    });
  }

  private async evaluateAlertRules() {
    const tenantId = this.tenantContext.getTenantId()!;
    const rules = await this.prisma.alertRule.findMany({ where: { active: true } });
    if (rules.length === 0) return;

    for (const rule of rules) {
      const latest = await this.prisma.metricSnapshot.findFirst({
        where: { metricCode: rule.metric },
        orderBy: { createdAt: 'desc' },
      });
      if (!latest) continue;

      const value = Number(latest.value);
      const threshold = Number(rule.threshold);
      const triggered = value >= threshold; // regra simplificada: valor >= limiar configurado

      if (triggered) {
        const existingOpen = await this.prisma.alert.findFirst({
          where: { ruleId: rule.id, status: { in: ['novo', 'em_analise'] } },
        });
        if (!existingOpen) {
          await this.prisma.alert.create({
            data: {
              tenantId,
              ruleId: rule.id,
              title: `Alerta: ${rule.name}`,
              description: `Métrica "${rule.metric}" atingiu ${value} (limiar: ${threshold}). Condição: ${rule.condition}`,
              severity: rule.severity,
              metric: rule.metric,
              status: 'novo',
              history: { create: { tenantId, status: 'novo', note: 'Gerado automaticamente pelo SyncOrchestratorService' } },
            },
          });
        }
      }
    }
  }
}
