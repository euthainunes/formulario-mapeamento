import { Global, Module } from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import { TenantInterceptor } from './tenant.interceptor';

// TenantModule expõe apenas o contexto (ALS) e o interceptor, sem depender
// do PrismaModule, para evitar dependência circular (PrismaModule importa
// TenantModule). O CRUD de Tenant (TenantService/TenantController) vive em
// TenantAdminModule, importado no AppModule já com o Prisma disponível.
@Global()
@Module({
  providers: [TenantContextService, TenantInterceptor],
  exports: [TenantContextService, TenantInterceptor],
})
export class TenantModule {}
