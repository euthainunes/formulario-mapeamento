import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { Audit } from '../audit/audit.decorator';
import { PERMISSION_KEYS, PERMISSION_DESCRIPTIONS } from '../auth/permissions.constants';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('permissions/catalog')
  @RequirePermissions('role.manage')
  catalog() {
    return PERMISSION_KEYS.map((key) => ({ key, description: PERMISSION_DESCRIPTIONS[key] }));
  }

  @Post()
  @RequirePermissions('role.manage')
  @Audit('role')
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @RequirePermissions('role.manage')
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('role.manage')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('role.manage')
  @Audit('role')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('role.manage')
  @Audit('role')
  async remove(@Param('id') id: string) {
    await this.rolesService.remove(id);
    return { success: true };
  }
}
