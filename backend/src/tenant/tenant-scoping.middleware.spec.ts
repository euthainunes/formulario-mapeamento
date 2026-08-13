import { Prisma } from '@prisma/client';
import { TenantContextService } from './tenant-context.service';
import { createTenantScopingMiddleware } from './tenant-scoping.middleware';

/**
 * Prova de isolamento de tenant: simula uma "base de dados" em memória com
 * registros de dois tenants (A e B) e demonstra que, rodando dentro do
 * contexto do tenant A, uma consulta — mesmo uma tentada sem filtro de
 * tenant algum, como um bug em um service faria — NUNCA retorna registros
 * do tenant B. O middleware testado aqui é o mesmo usado por PrismaService
 * em produção (ver prisma.service.ts), então este teste não depende de um
 * banco Postgres real.
 */
describe('createTenantScopingMiddleware (isolamento de tenant)', () => {
  const fakeRows = [
    { id: '1', tenantId: 'tenant-A', name: 'Usuário A1' },
    { id: '2', tenantId: 'tenant-A', name: 'Usuário A2' },
    { id: '3', tenantId: 'tenant-B', name: 'Usuário B1' },
    { id: '4', tenantId: 'tenant-B', name: 'Usuário B2' },
  ];

  /** Simula o que o engine do Prisma faria: aplica params.args.where sobre a "tabela". */
  function fakeNext(params: Prisma.MiddlewareParams) {
    const where = (params.args?.where ?? {}) as Record<string, unknown>;
    const matches = fakeRows.filter((row) => Object.entries(where).every(([key, value]) => (row as any)[key] === value));
    return Promise.resolve(params.action === 'findMany' ? matches : matches[0] ?? null);
  }

  function makeMiddleware(tenantContext: TenantContextService) {
    return createTenantScopingMiddleware(tenantContext);
  }

  it('nunca retorna registros de outro tenant, mesmo em query sem filtro explícito', async () => {
    const tenantContext = new TenantContextService();
    const middleware = makeMiddleware(tenantContext);

    const paramsWithoutTenantFilter: Prisma.MiddlewareParams = {
      model: 'User',
      action: 'findMany',
      args: {},
      dataPath: [],
      runInTransaction: false,
    };

    const resultAsTenantA = await tenantContext.run('tenant-A', () => middleware(paramsWithoutTenantFilter, fakeNext));
    expect(resultAsTenantA).toHaveLength(2);
    expect((resultAsTenantA as typeof fakeRows).every((r) => r.tenantId === 'tenant-A')).toBe(true);
    expect((resultAsTenantA as typeof fakeRows).some((r) => r.tenantId === 'tenant-B')).toBe(false);

    const resultAsTenantB = await tenantContext.run('tenant-B', () => middleware(paramsWithoutTenantFilter, fakeNext));
    expect(resultAsTenantB).toHaveLength(2);
    expect((resultAsTenantB as typeof fakeRows).every((r) => r.tenantId === 'tenant-B')).toBe(true);
  });

  it('sobrescreve uma tentativa maliciosa/bugada de filtrar por outro tenantId', async () => {
    const tenantContext = new TenantContextService();
    const middleware = makeMiddleware(tenantContext);

    // Um bug (ou tentativa maliciosa) tentando ler o tenant B enquanto o
    // contexto autenticado é do tenant A.
    const paramsTryingToLeak: Prisma.MiddlewareParams = {
      model: 'User',
      action: 'findMany',
      args: { where: { tenantId: 'tenant-B' } },
      dataPath: [],
      runInTransaction: false,
    };

    const result = await tenantContext.run('tenant-A', () => middleware(paramsTryingToLeak, fakeNext));
    // O middleware reescreve where.tenantId por cima, então o resultado
    // continua restrito ao tenant do contexto (A), nunca ao B solicitado.
    expect(result).toHaveLength(2);
    expect((result as typeof fakeRows).every((r) => r.tenantId === 'tenant-A')).toBe(true);
  });

  it('lança erro claro se rodar fora de qualquer contexto de tenant (sem bypass)', async () => {
    const tenantContext = new TenantContextService();
    const middleware = makeMiddleware(tenantContext);

    const params: Prisma.MiddlewareParams = { model: 'User', action: 'findMany', args: {}, dataPath: [], runInTransaction: false };

    await expect(middleware(params, fakeNext)).rejects.toThrow(/sem tenantId no contexto/);
  });

  it('permite bypass explícito para operações legitimamente globais', async () => {
    const tenantContext = new TenantContextService();
    const middleware = makeMiddleware(tenantContext);

    const params: Prisma.MiddlewareParams = { model: 'User', action: 'findMany', args: {}, dataPath: [], runInTransaction: false };

    const result = await tenantContext.runBypassed(() => middleware(params, fakeNext));
    // Sem filtro de tenant injetado, retorna tudo (comportamento esperado do bypass).
    expect(result).toHaveLength(4);
  });

  it('não escopa modelos que não são multi-tenant (ex: Tenant)', async () => {
    const tenantContext = new TenantContextService();
    const middleware = makeMiddleware(tenantContext);

    const params: Prisma.MiddlewareParams = { model: 'Tenant', action: 'findMany', args: {}, dataPath: [], runInTransaction: false };

    const result = await tenantContext.run('tenant-A', () => middleware(params, fakeNext));
    expect(result).toHaveLength(4); // não filtrado, pois Tenant não está em TENANT_SCOPED_MODELS
  });
});
