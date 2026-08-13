import { Prisma } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';

/**
 * Modelos multi-tenant. Toda leitura/escrita nestes modelos é automaticamente
 * escopada pelo tenantId corrente (ver TenantContextService), via este
 * middleware do Prisma Client. Extraído em módulo próprio (em vez de ficar
 * inline em PrismaService) para poder ser testado isoladamente sem precisar
 * de um banco real — ver tenant-scoping.middleware.spec.ts.
 */
export const TENANT_SCOPED_MODELS = new Set<string>([
  'User',
  'Role',
  'UserRole',
  'RolePermission',
  'Company',
  'Department',
  'JobTitle',
  'Team',
  'Pod',
  'News',
  'Beezz',
  'Reaction',
  'LoginEvent',
  'Device',
  'Award',
  'AdmissionAward',
  'MetricSnapshot',
  'DashboardFilter',
  'AlertRule',
  'Alert',
  'AlertHistoryEntry',
  'AIInsight',
  'SyncJob',
  'SyncLog',
  'AuditLog',
  'Report',
  'ReportExport',
  'Project',
  'Campaign',
  'Task',
  'TaskAssignee',
  'TaskLabel',
  'TaskPriority',
  'TaskStatus',
  'WorkloadSnapshot',
  'PlannerIntegration',
]);

const READ_ACTIONS = new Set(['findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy']);
const WRITE_MANY_ACTIONS = new Set(['updateMany', 'deleteMany']);
const CREATE_ACTIONS = new Set(['create']);
const CREATE_MANY_ACTIONS = new Set(['createMany']);
const UPSERT_ACTIONS = new Set(['upsert']);

export function createTenantScopingMiddleware(tenantContext: TenantContextService): Prisma.Middleware {
  return async (params, next) => {
    const model = params.model;
    if (!model || !TENANT_SCOPED_MODELS.has(model)) {
      return next(params);
    }

    const tenantId = tenantContext.getTenantId();
    if (!tenantId) {
      if (tenantContext.isBypassed()) {
        return next(params);
      }
      throw new Error(
        `Operação Prisma em modelo multi-tenant "${model}" sem tenantId no contexto. ` +
          'Toda query multi-tenant deve rodar dentro de TenantContextService.run(tenantId, ...).',
      );
    }

    params.args = params.args ?? {};

    if (READ_ACTIONS.has(params.action) || WRITE_MANY_ACTIONS.has(params.action)) {
      params.args.where = { ...(params.args.where ?? {}), tenantId };
    } else if (CREATE_ACTIONS.has(params.action)) {
      params.args.data = { ...(params.args.data ?? {}), tenantId };
    } else if (CREATE_MANY_ACTIONS.has(params.action)) {
      if (Array.isArray(params.args.data)) {
        params.args.data = params.args.data.map((row: any) => ({ ...row, tenantId }));
      }
    } else if (UPSERT_ACTIONS.has(params.action)) {
      params.args.where = { ...(params.args.where ?? {}), tenantId };
      params.args.create = { ...(params.args.create ?? {}), tenantId };
    } else if (params.action === 'update' || params.action === 'delete') {
      params.args.where = { ...(params.args.where ?? {}), tenantId };
    }

    return next(params);
  };
}
