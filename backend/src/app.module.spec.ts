import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';

/**
 * Smoke test do grafo de injeção de dependências: garante que todos os
 * módulos (Auth, Users, Roles, Org, Analytics, Alerts, Reports, Insights,
 * Sync, Audit, Health, Tenant) se conectam corretamente, sem depender de um
 * banco Postgres real de pé (PrismaService tolera falha de conexão no boot
 * — ver PrismaService.onModuleInit).
 */
describe('AppModule', () => {
  it('resolve o grafo de dependências (Nest DI) sem erros', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    expect(moduleRef).toBeDefined();
    await moduleRef.close();
  }, 30000);
});
