import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessService } from './access.service';
import { GlobalFiltersDto } from '../../common/dto/global-filters.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics/access')
export class AccessController {
  constructor(private readonly accessService: AccessService) {}

  @Get()
  @RequirePermissions('access.view')
  get(@Query() filters: GlobalFiltersDto) {
    return this.accessService.getAccessData(filters);
  }
}
