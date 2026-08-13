import { Controller, Get, NotFoundException, Param, Post, Body } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/report.dto';
import { RequirePermissions } from '../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @RequirePermissions('report.view', 'report.export')
  listHistory() {
    return this.reportsService.listHistory();
  }

  @Get(':id/status')
  @RequirePermissions('report.view', 'report.export')
  async getStatus(@Param('id') id: string) {
    const report = await this.reportsService.getStatus(id);
    if (!report) throw new NotFoundException('Relatório não encontrado');
    return report;
  }

  @Post()
  @RequirePermissions('report.export')
  generate(@Body() dto: GenerateReportDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.generate(dto, user.userId);
  }
}
