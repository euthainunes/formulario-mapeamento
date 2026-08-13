import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { TenantContextService } from '../tenant/tenant-context.service';
import { createTenantScopingMiddleware } from '../tenant/tenant-scoping.middleware';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly tenantContext: TenantContextService) {
    super({
      log: [{ level: 'error', emit: 'stdout' }, { level: 'warn', emit: 'stdout' }],
    });

    // Middleware de isolamento de tenant — ver tenant-scoping.middleware.ts.
    // É isso que garante, em tempo de execução, que toda query Prisma em
    // modelo multi-tenant seja filtrada pelo tenantId corrente.
    this.$use(createTenantScopingMiddleware(tenantContext));
  }

  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err) {
      // Em ambientes sem Postgres real (dev/sandbox), não travamos o boot —
      // apenas registramos. Endpoints que dependem de banco falharão em runtime.
      this.logger.warn(`Não foi possível conectar ao banco no boot: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
