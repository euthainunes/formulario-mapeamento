import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';

interface TenantStore {
  tenantId: string | null;
  bypass: boolean;
}

/**
 * Contexto de tenant corrente, propagado via AsyncLocalStorage por toda a
 * cadeia assíncrona de uma requisição (guards -> interceptors -> handler ->
 * services -> PrismaService). É isso que permite ao middleware do Prisma
 * (ver PrismaService) filtrar automaticamente por tenantId sem que cada
 * service precise passá-lo explicitamente em toda chamada.
 */
@Injectable()
export class TenantContextService {
  private readonly als = new AsyncLocalStorage<TenantStore>();

  run<T>(tenantId: string, fn: () => T): T {
    return this.als.run({ tenantId, bypass: false }, fn);
  }

  /**
   * Executa fora de qualquer escopo de tenant — reservado para operações
   * legitimamente globais (ex: CRUD da entidade Tenant, seed, jobs de
   * sincronização que operam tenant a tenant explicitamente).
   */
  runBypassed<T>(fn: () => T): T {
    return this.als.run({ tenantId: null, bypass: true }, fn);
  }

  getTenantId(): string | null {
    return this.als.getStore()?.tenantId ?? null;
  }

  isBypassed(): boolean {
    return this.als.getStore()?.bypass ?? false;
  }
}
