import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentTenantId } from './decorators/current-tenant.decorator';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  // Provisionar/listar/excluir tenants é uma operação de PLATAFORMA, não de
  // um tenant específico — `settings.manage` é concedida ao papel
  // administradora de TODO tenant (ver seed), então nunca deve gatear estas
  // rotas. `platform.superadmin` não é atribuída a nenhum papel do seed; só
  // pode ser concedida manualmente a uma conta operada pela equipe da
  // plataforma. Ver backend/src/auth/permissions.constants.ts.
  @Post()
  @RequirePermissions('platform.superadmin')
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Get()
  @RequirePermissions('platform.superadmin')
  findAll() {
    return this.tenantService.findAll();
  }

  // findOne/update continuam acessíveis via `settings.manage` (a
  // administradora do próprio tenant pode ver/editar as configurações do
  // seu tenant), mas SOMENTE do próprio tenant do usuário autenticado — sem
  // isso, qualquer administradora poderia ler/alterar qualquer outro tenant
  // pelo :id (IDOR cross-tenant).
  @Get(':id')
  @RequirePermissions('settings.manage')
  findOne(@Param('id') id: string, @CurrentTenantId() callerTenantId?: string) {
    this.assertOwnTenant(id, callerTenantId);
    return this.tenantService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('settings.manage')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto, @CurrentTenantId() callerTenantId?: string) {
    this.assertOwnTenant(id, callerTenantId);
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('platform.superadmin')
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }

  private assertOwnTenant(targetTenantId: string, callerTenantId?: string): void {
    if (!callerTenantId || targetTenantId !== callerTenantId) {
      throw new ForbiddenException('Não é possível acessar configurações de outro tenant');
    }
  }
}
