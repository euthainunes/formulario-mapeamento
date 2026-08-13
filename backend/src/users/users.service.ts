import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { PermissionKey } from '../auth/permissions.constants';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  private include() {
    return {
      userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } },
      company: true,
      department: true,
      jobTitle: true,
      team: true,
    } as const;
  }

  private tenantId(): string {
    const id = this.tenantContext.getTenantId();
    if (!id) throw new Error('tenantId ausente no contexto (operação de usuário fora de requisição autenticada)');
    return id;
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const { roleIds, password: _password, ...rest } = dto;

    const created = await this.prisma.user.create({ data: { ...rest, passwordHash, tenantId: this.tenantId() } });

    if (roleIds && roleIds.length > 0) {
      await this.prisma.userRole.createMany({
        data: roleIds.map((roleId) => ({ userId: created.id, roleId, tenantId: this.tenantId() })),
      });
    }

    return this.findOne(created.id);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({ include: this.include(), orderBy: { createdAt: 'asc' } });
    return users.map((u) => this.sanitize(u));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, include: this.include() });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.sanitize(user);
  }

  /**
   * Uso interno do AuthModule durante o login: nesse momento ainda não há
   * JWT (e portanto nenhum tenantId no contexto ALS), então esta busca roda
   * em modo bypass e filtra tenantId manualmente por parâmetro explícito.
   */
  findByEmailWithAuth(tenantId: string, email: string) {
    return this.tenantContext.runBypassed(() =>
      this.prisma.user.findFirst({
        where: { tenantId, email },
        include: this.include(),
      }),
    );
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    const { roleIds, ...rest } = dto;

    if (roleIds) {
      await this.prisma.userRole.deleteMany({ where: { userId: id } });
      if (roleIds.length > 0) {
        await this.prisma.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: id, roleId, tenantId: this.tenantId() })),
        });
      }
    }

    await this.prisma.user.update({ where: { id }, data: rest });
    return this.findOne(id);
  }

  async toggleActive(id: string) {
    const user = await this.findOne(id);
    return this.update(id, { active: !user.active });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
  }

  /** Deriva o conjunto de permissões de um usuário a partir de seus papéis. */
  static permissionsFor(user: { userRoles: { role: { rolePermissions: { permission: { key: string } }[] } }[] }): PermissionKey[] {
    const set = new Set<string>();
    for (const ur of user.userRoles) {
      for (const rp of ur.role.rolePermissions) {
        set.add(rp.permission.key);
      }
    }
    return Array.from(set) as PermissionKey[];
  }

  private sanitize<T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'> {
    const { passwordHash: _hash, ...rest } = user;
    return rest;
  }
}
