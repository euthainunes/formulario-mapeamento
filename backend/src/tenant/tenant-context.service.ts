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
    return this.als.run({ tenantId, bypass: false }, () => TenantContextService.forceLink(fn));
  }

  /**
   * Executa fora de qualquer escopo de tenant — reservado para operações
   * legitimamente globais (ex: CRUD da entidade Tenant, seed, jobs de
   * sincronização que operam tenant a tenant explicitamente).
   */
  runBypassed<T>(fn: () => T): T {
    return this.als.run({ tenantId: null, bypass: true }, () => TenantContextService.forceLink(fn));
  }

  /**
   * O Prisma Client retorna "PrismaPromise" — uma promise LAZY que só dispara
   * a query de fato quando `.then()`/`await` é chamado sobre ela. Se `fn()`
   * apenas retorna essa promise sem aguardá-la dentro do callback síncrono
   * passado a `AsyncLocalStorage.run(...)`, o `.then()` real acontece fora do
   * escopo rastreado pelo ALS (ex: no `await` de quem chamou `run`/`runBypassed`),
   * e o middleware de tenant do Prisma enxerga um contexto vazio — mesmo
   * dentro de um `run()`/`runBypassed()` aparentemente correto. Forçar o
   * `await` aqui, ainda dentro do callback síncrono do `als.run`, garante que
   * o disparo real da query fique linkado ao contexto correto.
   */
  private static forceLink<T>(fn: () => T): T {
    const result = fn();
    if (result && typeof (result as { then?: unknown }).then === 'function') {
      return (async () => await result)() as unknown as T;
    }
    return result;
  }

  getTenantId(): string | null {
    return this.als.getStore()?.tenantId ?? null;
  }

  isBypassed(): boolean {
    return this.als.getStore()?.bypass ?? false;
  }
}
