import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { AuditService } from '../audit/audit.service';
import { CreateAlertRuleDto, UpdateAlertRuleDto, UpdateAlertStatusDto } from './dto/alert.dto';

type AlertStatus = 'novo' | 'em_analise' | 'resolvido' | 'ignorado';

/** Transições de status permitidas: novo -> em análise -> resolvido/ignorado. */
const ALLOWED_TRANSITIONS: Record<AlertStatus, AlertStatus[]> = {
  novo: ['em_analise', 'resolvido', 'ignorado'],
  em_analise: ['resolvido', 'ignorado', 'novo'],
  resolvido: [],
  ignorado: ['novo'],
};

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
    private readonly auditService: AuditService,
  ) {}

  private tenantId(): string {
    const id = this.tenantContext.getTenantId();
    if (!id) throw new Error('tenantId ausente no contexto');
    return id;
  }

  // ---- Regras ----

  createRule(dto: CreateAlertRuleDto) {
    return this.prisma.alertRule.create({ data: { ...dto, tenantId: this.tenantId() } });
  }

  listRules() {
    return this.prisma.alertRule.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findRule(id: string) {
    const rule = await this.prisma.alertRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Regra de alerta não encontrada');
    return rule;
  }

  async updateRule(id: string, dto: UpdateAlertRuleDto) {
    await this.findRule(id);
    return this.prisma.alertRule.update({ where: { id }, data: dto });
  }

  async removeRule(id: string) {
    await this.findRule(id);
    await this.prisma.alertRule.delete({ where: { id } });
  }

  // ---- Alertas ----

  listAlerts(status?: AlertStatus) {
    return this.prisma.alert.findMany({
      where: status ? { status } : undefined,
      include: { rule: true, history: { orderBy: { changedAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAlert(id: string) {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: { rule: true, history: { orderBy: { changedAt: 'asc' } } },
    });
    if (!alert) throw new NotFoundException('Alerta não encontrado');
    return alert;
  }

  async updateStatus(id: string, dto: UpdateAlertStatusDto, actorId?: string, actorName?: string) {
    const alert = await this.findAlert(id);
    const current = alert.status as AlertStatus;

    if (current === dto.status) {
      throw new BadRequestException(`Alerta já está no status "${dto.status}"`);
    }

    const allowed = ALLOWED_TRANSITIONS[current] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Transição de "${current}" para "${dto.status}" não é permitida. Permitidas: ${allowed.join(', ') || 'nenhuma (status terminal)'}`);
    }

    const updated = await this.prisma.alert.update({
      where: { id },
      data: {
        status: dto.status,
        history: { create: { tenantId: this.tenantId(), status: dto.status, changedById: actorId, note: dto.note } },
      },
      include: { rule: true, history: { orderBy: { changedAt: 'asc' } } },
    });

    // Toda transição de status de alerta grava AuditLog (exigência explícita da spec).
    await this.auditService.record({
      actorId,
      actorName,
      action: 'alert.statusChange',
      targetType: 'alert',
      targetId: id,
      beforeJson: { status: current },
      afterJson: { status: dto.status, note: dto.note },
    });

    return updated;
  }
}
