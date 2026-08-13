import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async record(params: {
    actorId?: string;
    actorName?: string;
    action: string;
    targetType: string;
    targetId?: string;
    beforeJson?: unknown;
    afterJson?: unknown;
  }) {
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      this.logger.warn(`AuditLog não gravado (sem tenantId no contexto): ${params.action}`);
      return;
    }

    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          actorId: params.actorId,
          actorName: params.actorName,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId,
          beforeJson: (params.beforeJson ?? undefined) as any,
          afterJson: (params.afterJson ?? undefined) as any,
        },
      });
    } catch (err) {
      // Auditoria nunca deve derrubar a requisição principal.
      this.logger.warn(`Falha ao gravar AuditLog: ${(err as Error).message}`);
    }
  }

  list() {
    return this.prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  }
}
