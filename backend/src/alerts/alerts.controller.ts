import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { CreateAlertRuleDto, UpdateAlertRuleDto, UpdateAlertStatusDto } from './dto/alert.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { Audit } from '../audit/audit.decorator';

@ApiTags('alerts')
@ApiBearerAuth()
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post('rules')
  @RequirePermissions('alert.manage')
  @Audit('alertRule')
  createRule(@Body() dto: CreateAlertRuleDto) {
    return this.alertsService.createRule(dto);
  }

  @Get('rules')
  @RequirePermissions('alert.view', 'alert.manage')
  listRules() {
    return this.alertsService.listRules();
  }

  @Patch('rules/:id')
  @RequirePermissions('alert.manage')
  @Audit('alertRule')
  updateRule(@Param('id') id: string, @Body() dto: UpdateAlertRuleDto) {
    return this.alertsService.updateRule(id, dto);
  }

  @Delete('rules/:id')
  @RequirePermissions('alert.manage')
  @Audit('alertRule')
  async removeRule(@Param('id') id: string) {
    await this.alertsService.removeRule(id);
    return { success: true };
  }

  @Get()
  @RequirePermissions('alert.view', 'alert.manage')
  list(@Query('status') status?: 'novo' | 'em_analise' | 'resolvido' | 'ignorado') {
    return this.alertsService.listAlerts(status);
  }

  @Get(':id')
  @RequirePermissions('alert.view', 'alert.manage')
  findOne(@Param('id') id: string) {
    return this.alertsService.findAlert(id);
  }

  @Patch(':id/status')
  @RequirePermissions('alert.manage')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAlertStatusDto, @CurrentUser() user: AuthenticatedUser) {
    return this.alertsService.updateStatus(id, dto, user.userId, user.email);
  }
}
