import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BeezzService } from './beezz.service';
import { GlobalFiltersDto } from '../../common/dto/global-filters.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics/beezz')
export class BeezzController {
  constructor(private readonly beezzService: BeezzService) {}

  @Get()
  @RequirePermissions('beezz.view')
  get(@Query() filters: GlobalFiltersDto) {
    return this.beezzService.getBeezzData(filters);
  }
}
