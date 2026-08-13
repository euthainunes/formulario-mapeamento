import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ContentService } from './content.service';
import { GlobalFiltersDto } from '../../common/dto/global-filters.dto';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics/content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @RequirePermissions('content.view')
  get(@Query() filters: GlobalFiltersDto) {
    return this.contentService.getContentData(filters);
  }
}
