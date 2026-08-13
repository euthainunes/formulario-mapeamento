import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@ApiTags('tenants')
@ApiBearerAuth()
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @RequirePermissions('settings.manage')
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Get()
  @RequirePermissions('settings.manage')
  findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @RequirePermissions('settings.manage')
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('settings.manage')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('settings.manage')
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }
}
