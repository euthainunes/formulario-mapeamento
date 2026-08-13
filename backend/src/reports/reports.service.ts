import { Injectable, NotFoundException } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { GenerateReportDto } from './dto/report.dto';

const REPORT_LABELS: Record<string, string> = {
  audiencia: 'Audiência',
  acessos: 'Acessos',
  conteudos: 'Conteúdos',
  engajamento: 'Engajamento',
  pods: 'Pods',
  executivo: 'Executivo',
};

const METRIC_DEFINITIONS_BY_TYPE: Record<string, { metric: string; definition: string }[]> = {
  audiencia: [{ metric: 'audience.activeUsers', definition: 'Usuários com ao menos 1 login no período' }],
  acessos: [{ metric: 'access.totalLogins', definition: 'Total de eventos de login no período (audit/loginsByDate)' }],
  conteudos: [{ metric: 'content.publications', definition: 'Notícias publicadas no período' }],
  engajamento: [{ metric: 'engagement.totalReactions', definition: 'Soma dos campos count* documentados de reação' }],
  pods: [{ metric: 'pods.accessCount', definition: 'Acessos por pod (pod/audit/list/mostAccessed)' }],
  executivo: [{ metric: 'dashboard.kpis', definition: 'Conjunto consolidado de KPIs de todos os domínios' }],
};

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private tenantId(): string {
    const id = this.tenantContext.getTenantId();
    if (!id) throw new Error('tenantId ausente no contexto');
    return id;
  }

  listHistory() {
    return this.prisma.report.findMany({ orderBy: { createdAt: 'desc' }, include: { exports: true } });
  }

  async getStatus(id: string) {
    return this.prisma.report.findUnique({ where: { id }, include: { exports: true } });
  }

  async generate(dto: GenerateReportDto, createdById?: string) {
    const filters = { company: dto.company ?? null, department: dto.department ?? null, jobTitle: dto.jobTitle ?? null, team: dto.team ?? null };

    const report = await this.prisma.report.create({
      data: {
        tenantId: this.tenantId(),
        name: `${REPORT_LABELS[dto.type] ?? dto.type} — ${dto.from} a ${dto.to}`,
        type: dto.type,
        format: dto.format,
        status: 'processando',
        filtersJson: { dateRange: { from: dto.from, to: dto.to }, filters },
        createdById,
      },
    });

    try {
      const rows = await this.collectRows(dto);
      const csvContent = stringify(rows, { header: true });

      let fileContent = csvContent;
      let metadataNote: string | undefined;
      if (dto.format !== 'csv') {
        // TODO documentado: geração real de PDF/Excel ainda não implementada.
        // Por ora, entregamos o mesmo conteúdo tabular como CSV, sinalizando
        // isso explicitamente em metadata para não fingir um arquivo binário real.
        metadataNote = `Geração real de arquivo .${dto.format} pendente (TODO). Conteúdo fornecido em formato CSV como placeholder funcional.`;
      }

      const fileName = `${dto.type}-${dto.from}-a-${dto.to}.${dto.format === 'csv' ? 'csv' : 'csv'}`;

      await this.prisma.reportExport.create({
        data: {
          tenantId: this.tenantId(),
          reportId: report.id,
          format: dto.format,
          fileContent,
          fileName,
          sizeBytes: Buffer.byteLength(fileContent, 'utf-8'),
        },
      });

      const finishedAt = new Date();
      const updated = await this.prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'concluido',
          finishedAt,
          metadataJson: {
            period: { from: dto.from, to: dto.to },
            filtersApplied: JSON.stringify(filters),
            generatedAt: finishedAt.toISOString(),
            lastSyncConsidered: await this.lastSyncTimestamp(),
            dataSource: 'Intranet BeeHome (via MetricSnapshot/normalizado)',
            metricDefinitions: METRIC_DEFINITIONS_BY_TYPE[dto.type] ?? [],
            note: metadataNote,
          },
        },
        include: { exports: true },
      });

      return updated;
    } catch (err) {
      await this.prisma.report.update({
        where: { id: report.id },
        data: { status: 'falha', finishedAt: new Date(), metadataJson: { error: (err as Error).message } },
      });
      throw err;
    }
  }

  private async lastSyncTimestamp(): Promise<string> {
    const lastJob = await this.prisma.syncJob.findFirst({ orderBy: { startedAt: 'desc' } });
    return lastJob?.finishedAt?.toISOString() ?? 'nunca sincronizado';
  }

  private async collectRows(dto: GenerateReportDto): Promise<Record<string, unknown>[]> {
    const from = new Date(dto.from);
    const to = new Date(dto.to);

    switch (dto.type) {
      case 'acessos': {
        const rows = await this.prisma.loginEvent.groupBy({
          by: ['occurredAt'],
          where: { occurredAt: { gte: from, lte: to } },
          _count: true,
        });
        return rows.map((r) => ({ date: r.occurredAt.toISOString().slice(0, 10), total: r._count }));
      }
      case 'conteudos': {
        const news = await this.prisma.news.findMany({ where: { publishedAt: { gte: from, lte: to } } });
        return news.map((n) => ({ title: n.title, publishedAt: n.publishedAt?.toISOString(), views: n.views, likes: n.likes, comments: n.comments }));
      }
      case 'engajamento': {
        const reactions = await this.prisma.reaction.findMany({ where: { capturedAt: { gte: from, lte: to } } });
        return reactions.map((r) => ({
          capturedAt: r.capturedAt.toISOString(),
          countBeezzLiked: r.countBeezzLiked,
          countNewsLiked: r.countNewsLiked,
          countPollLiked: r.countPollLiked,
        }));
      }
      case 'pods': {
        const pods = await this.prisma.pod.findMany();
        return pods.map((p) => ({ name: p.name, accessCount: p.accessCount }));
      }
      case 'audiencia':
      case 'executivo':
      default: {
        const users = await this.prisma.user.findMany({ where: { active: true } });
        return users.map((u) => ({ name: u.name, email: u.email, lastLoginAt: u.lastLoginAt?.toISOString() ?? '' }));
      }
    }
  }
}
