import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CompanyService, DepartmentService, JobTitleService, TeamService } from './org.service';
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
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { Audit } from '../audit/audit.decorator';

@ApiTags('org')
@ApiBearerAuth()
@Controller('org/companies')
export class CompanyController {
  constructor(private readonly service: CompanyService) {}
  @Post() @RequirePermissions('settings.manage') @Audit('company') create(@Body() dto: CreateCompanyDto) {
    return this.service.create(dto);
  }
  @Get() @RequirePermissions('directory.view', 'settings.manage') findAll() {
    return this.service.findAll();
  }
  @Get(':id') @RequirePermissions('directory.view', 'settings.manage') findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Patch(':id') @RequirePermissions('settings.manage') @Audit('company') update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.service.update(id, dto);
  }
  @Delete(':id') @RequirePermissions('settings.manage') @Audit('company') async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}

@ApiTags('org')
@ApiBearerAuth()
@Controller('org/departments')
export class DepartmentController {
  constructor(private readonly service: DepartmentService) {}
  @Post() @RequirePermissions('settings.manage') @Audit('department') create(@Body() dto: CreateDepartmentDto) {
    return this.service.create(dto);
  }
  @Get() @RequirePermissions('directory.view', 'settings.manage') findAll() {
    return this.service.findAll();
  }
  @Get(':id') @RequirePermissions('directory.view', 'settings.manage') findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Patch(':id') @RequirePermissions('settings.manage') @Audit('department') update(@Param('id') id: string, @Body() dto: UpdateDepartmentDto) {
    return this.service.update(id, dto);
  }
  @Delete(':id') @RequirePermissions('settings.manage') @Audit('department') async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}

@ApiTags('org')
@ApiBearerAuth()
@Controller('org/job-titles')
export class JobTitleController {
  constructor(private readonly service: JobTitleService) {}
  @Post() @RequirePermissions('settings.manage') @Audit('jobTitle') create(@Body() dto: CreateJobTitleDto) {
    return this.service.create(dto);
  }
  @Get() @RequirePermissions('directory.view', 'settings.manage') findAll() {
    return this.service.findAll();
  }
  @Get(':id') @RequirePermissions('directory.view', 'settings.manage') findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Patch(':id') @RequirePermissions('settings.manage') @Audit('jobTitle') update(@Param('id') id: string, @Body() dto: UpdateJobTitleDto) {
    return this.service.update(id, dto);
  }
  @Delete(':id') @RequirePermissions('settings.manage') @Audit('jobTitle') async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}

@ApiTags('org')
@ApiBearerAuth()
@Controller('org/teams')
export class TeamController {
  constructor(private readonly service: TeamService) {}
  @Post() @RequirePermissions('settings.manage') @Audit('team') create(@Body() dto: CreateTeamDto) {
    return this.service.create(dto);
  }
  @Get() @RequirePermissions('directory.view', 'settings.manage') findAll() {
    return this.service.findAll();
  }
  @Get(':id') @RequirePermissions('directory.view', 'settings.manage') findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  @Patch(':id') @RequirePermissions('settings.manage') @Audit('team') update(@Param('id') id: string, @Body() dto: UpdateTeamDto) {
    return this.service.update(id, dto);
  }
  @Delete(':id') @RequirePermissions('settings.manage') @Audit('team') async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }
}
