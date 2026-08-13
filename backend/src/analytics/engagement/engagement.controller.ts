import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EngagementService } from './engagement.service';
import { GlobalFiltersDto } from '../../common/dto/global-filters.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics/engagement')
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get()
  @RequirePermissions('engagement.view')
  get(@Query() filters: GlobalFiltersDto) {
    return this.engagementService.getEngagementData(filters);
  }
}
