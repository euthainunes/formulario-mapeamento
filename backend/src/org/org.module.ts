import { Module } from '@nestjs/common';
import { CompanyController, DepartmentController, JobTitleController, TeamController } from './org.controller';
import { CompanyService, DepartmentService, JobTitleService, TeamService } from './org.service';

@Module({
  controllers: [CompanyController, DepartmentController, JobTitleController, TeamController],
  providers: [CompanyService, DepartmentService, JobTitleService, TeamService],
  exports: [CompanyService, DepartmentService, JobTitleService, TeamService],
})
export class OrgModule {}
