import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PodsService } from './pods.service';
import { GlobalFiltersDto } from '../../common/dto/global-filters.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics/pods')
export class PodsController {
  constructor(private readonly podsService: PodsService) {}

  @Get()
  @RequirePermissions('pods.view')
  get(@Query() filters: GlobalFiltersDto) {
    return this.podsService.getPodsData(filters);
  }
}
