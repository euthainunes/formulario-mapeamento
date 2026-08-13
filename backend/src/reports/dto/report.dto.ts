import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

const REPORT_TYPES = ['audiencia', 'acessos', 'conteudos', 'engajamento', 'pods', 'executivo'] as const;
const REPORT_FORMATS = ['pdf', 'excel', 'csv'] as const;

export class GenerateReportDto {
  @ApiProperty({ enum: REPORT_TYPES }) @IsIn(REPORT_TYPES) type!: (typeof REPORT_TYPES)[number];
  @ApiProperty({ enum: REPORT_FORMATS }) @IsIn(REPORT_FORMATS) format!: (typeof REPORT_FORMATS)[number];
  @ApiProperty() @IsISO8601() from!: string;
  @ApiProperty() @IsISO8601() to!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() company?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() department?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() jobTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() team?: string;
}
