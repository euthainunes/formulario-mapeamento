import { Injectable, NotFoundException } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { GenerateReportDto } from './dto/report.dto';
import { generateExcelBuffer, generatePdfBuffer, ReportFileMetadata } from './generators/report-file-generators';
import { ReportFileStorageService, mimeTypeForFormat } from './report-file-storage.service';

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

/** Versão da definição das métricas derivadas expostas nos relatórios — ver KpiCardDto.version (todo KPI do sistema está hoje na versão 1 de sua fórmula). */
const REPORT_FORMULA_VERSION = 1;

function filtersLabel(filters: { company: string | null; department: string | null; jobTitle: string | null; team: string | null }): string {
  const parts = [
    filters.company ? `Empresa: ${filters.company}` : null,
    filters.department ? `Departamento: ${filters.department}` : null,
    filters.jobTitle ? `Cargo: ${filters.jobTitle}` : null,
    filters.team ? `Time: ${filters.team}` : null,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'Nenhum filtro adicional aplicado';
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly fileStorage: ReportFileStorageService,
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
      const finishedAt = new Date();
      const lastSyncConsidered = await this.lastSyncTimestamp();
      const tenant = await this.prisma.tenant.findUnique({ where: { id: this.tenantId() } });

      const fileMeta: ReportFileMetadata = {
        reportName: report.name,
        tenantName: tenant?.name ?? this.tenantId(),
        typeLabel: REPORT_LABELS[dto.type] ?? dto.type,
        period: { from: dto.from, to: dto.to },
        filtersLabel: filtersLabel(filters),
        generatedAt: finishedAt.toISOString(),
        lastSyncConsidered,
        dataSource: 'Intranet BeeHome (via MetricSnapshot/normalizado)',
        metricDefinitions: METRIC_DEFINITIONS_BY_TYPE[dto.type] ?? [],
        formulaVersion: REPORT_FORMULA_VERSION,
      };

      const fileExport = await this.prisma.reportExport.create({
        data: { tenantId: this.tenantId(), reportId: report.id, format: dto.format },
      });

      let content: Buffer | string;
      if (dto.format === 'excel') {
        content = await generateExcelBuffer(rows, fileMeta);
      } else if (dto.format === 'pdf') {
        content = await generatePdfBuffer(rows, fileMeta);
      } else {
        content = stringify(rows, { header: true });
      }

      const fileNameBase = `${dto.type}-${dto.from}-a-${dto.to}`;
      const { relativePath, sizeBytes } = await this.fileStorage.save(this.tenantId(), fileExport.id, dto.format, content);

      await this.prisma.reportExport.update({
        where: { id: fileExport.id },
        data: {
          fileReference: relativePath,
          fileName: `${fileNameBase}.${relativePath.split('.').pop()}`,
          mimeType: mimeTypeForFormat(dto.format),
          sizeBytes,
        },
      });

      const updated = await this.prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'concluido',
          finishedAt,
          metadataJson: {
            period: { from: dto.from, to: dto.to },
            filtersApplied: JSON.stringify(filters),
            generatedAt: finishedAt.toISOString(),
            lastSyncConsidered,
            dataSource: 'Intranet BeeHome (via MetricSnapshot/normalizado)',
            metricDefinitions: METRIC_DEFINITIONS_BY_TYPE[dto.type] ?? [],
            formulaVersion: REPORT_FORMULA_VERSION,
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

  /** Localiza a exportação mais recente de um relatório concluído e lê o arquivo gravado em disco para servir no endpoint de download. */
  async getDownload(reportId: string): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      include: { exports: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });
    if (!report) throw new NotFoundException('Relatório não encontrado');

    const fileExport = report.exports[0];
    if (!fileExport?.fileReference) {
      throw new NotFoundException('Arquivo do relatório ainda não está disponível (relatório pode estar processando ou ter falhado).');
    }

    const buffer = await this.fileStorage.read(fileExport.fileReference);
    return {
      buffer,
      fileName: fileExport.fileName ?? `${report.name}.${fileExport.format}`,
      mimeType: fileExport.mimeType ?? mimeTypeForFormat(fileExport.format),
    };
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
