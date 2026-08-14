import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { ReportFileStorageService } from './report-file-storage.service';

@Module({
  controllers: [ReportsController],
  providers: [ReportsService, ReportFileStorageService],
  exports: [ReportsService],
})
export class ReportsModule {}
