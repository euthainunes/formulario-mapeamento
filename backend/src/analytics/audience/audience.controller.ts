import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AudienceService } from './audience.service';
import { GlobalFiltersDto } from '../../common/dto/global-filters.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics/audience')
export class AudienceController {
  constructor(private readonly audienceService: AudienceService) {}

  @Get()
  @RequirePermissions('audience.view')
  get(@Query() filters: GlobalFiltersDto) {
    return this.audienceService.getAudienceData(filters);
  }
}
