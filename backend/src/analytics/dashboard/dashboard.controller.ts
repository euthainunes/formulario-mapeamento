import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { GlobalFiltersDto } from '../../common/dto/global-filters.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @RequirePermissions('dashboard.view')
  get(@Query() filters: GlobalFiltersDto) {
    return this.dashboardService.getExecutiveDashboard(filters);
  }
}
