import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit-log')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit.view')
  list() {
    return this.auditService.list();
  }
}
