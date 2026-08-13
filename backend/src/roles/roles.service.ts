import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private include() {
    return { rolePermissions: { include: { permission: true } } } as const;
  }

  private tenantId(): string {
    const id = this.tenantContext.getTenantId();
    if (!id) throw new Error('tenantId ausente no contexto');
    return id;
  }

  async create(dto: CreateRoleDto) {
    const { permissionKeys, ...rest } = dto;
    const role = await this.prisma.role.create({ data: { ...rest, tenantId: this.tenantId() } });
    if (permissionKeys?.length) {
      await this.syncPermissions(role.id, permissionKeys);
    }
    return this.findOne(role.id);
  }

  findAll() {
    return this.prisma.role.findMany({ include: this.include(), orderBy: { createdAt: 'asc' } });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({ where: { id }, include: this.include() });
    if (!role) throw new NotFoundException('Papel não encontrado');
    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    await this.findOne(id);
    const { permissionKeys, ...rest } = dto;
    await this.prisma.role.update({ where: { id }, data: rest });
    if (permissionKeys) {
      await this.syncPermissions(id, permissionKeys);
    }
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.role.delete({ where: { id } });
  }

  private async syncPermissions(roleId: string, permissionKeys: string[]) {
    const permissions = await this.prisma.permission.findMany({ where: { key: { in: permissionKeys } } });
    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissions.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId, permissionId: p.id, tenantId: this.tenantId() })),
      });
    }
  }
}
