import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RecognitionService } from './recognition.service';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics/awards')
export class RecognitionController {
  constructor(private readonly recognitionService: RecognitionService) {}

  @Get()
  @RequirePermissions('awards.view')
  get(@Query('month') month?: string, @Query('year') year?: string) {
    const now = new Date();
    const m = month ? Number(month) : now.getMonth() + 1;
    const y = year ? Number(year) : now.getFullYear();
    return this.recognitionService.getRecognitionData(m, y);
  }
}
