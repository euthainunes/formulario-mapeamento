import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../tenant/tenant-context.service';
import {
  CreateCompanyDto,
  CreateDepartmentDto,
  CreateJobTitleDto,
  CreateTeamDto,
  UpdateCompanyDto,
  UpdateDepartmentDto,
  UpdateJobTitleDto,
  UpdateTeamDto,
} from './dto/org.dto';

function requireTenantId(tenantContext: TenantContextService): string {
  const id = tenantContext.getTenantId();
  if (!id) throw new Error('tenantId ausente no contexto');
  return id;
}

@Injectable()
export class CompanyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}
  create(dto: CreateCompanyDto) {
    return this.prisma.company.create({ data: { ...dto, tenantId: requireTenantId(this.tenantContext) } });
  }
  findAll() {
    return this.prisma.company.findMany({ orderBy: { name: 'asc' } });
  }
  async findOne(id: string) {
    const c = await this.prisma.company.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Empresa não encontrada');
    return c;
  }
  async update(id: string, dto: UpdateCompanyDto) {
    await this.findOne(id);
    return this.prisma.company.update({ where: { id }, data: dto });
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.company.delete({ where: { id } });
  }
}

@Injectable()
export class DepartmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}
  create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({ data: { ...dto, tenantId: requireTenantId(this.tenantContext) } });
  }
  findAll() {
    return this.prisma.department.findMany({ orderBy: { name: 'asc' } });
  }
  async findOne(id: string) {
    const d = await this.prisma.department.findUnique({ where: { id } });
    if (!d) throw new NotFoundException('Departamento não encontrado');
    return d;
  }
  async update(id: string, dto: UpdateDepartmentDto) {
    await this.findOne(id);
    return this.prisma.department.update({ where: { id }, data: dto });
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.department.delete({ where: { id } });
  }
}

@Injectable()
export class JobTitleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}
  create(dto: CreateJobTitleDto) {
    return this.prisma.jobTitle.create({ data: { ...dto, tenantId: requireTenantId(this.tenantContext) } });
  }
  findAll() {
    return this.prisma.jobTitle.findMany({ orderBy: { name: 'asc' } });
  }
  async findOne(id: string) {
    const j = await this.prisma.jobTitle.findUnique({ where: { id } });
    if (!j) throw new NotFoundException('Cargo não encontrado');
    return j;
  }
  async update(id: string, dto: UpdateJobTitleDto) {
    await this.findOne(id);
    return this.prisma.jobTitle.update({ where: { id }, data: dto });
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.jobTitle.delete({ where: { id } });
  }
}

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}
  create(dto: CreateTeamDto) {
    return this.prisma.team.create({ data: { ...dto, tenantId: requireTenantId(this.tenantContext) } });
  }
  findAll() {
    return this.prisma.team.findMany({ orderBy: { name: 'asc' } });
  }
  async findOne(id: string) {
    const t = await this.prisma.team.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Time não encontrado');
    return t;
  }
  async update(id: string, dto: UpdateTeamDto) {
    await this.findOne(id);
    return this.prisma.team.update({ where: { id }, data: dto });
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.team.delete({ where: { id } });
  }
}
