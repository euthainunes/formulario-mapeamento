import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

const SEVERITIES = ['info', 'warning', 'critical'] as const;
const STATUSES = ['novo', 'em_analise', 'resolvido', 'ignorado'] as const;

export class CreateAlertRuleDto {
  @ApiProperty() @IsString() @MinLength(2) name!: string;
  @ApiProperty() @IsString() metric!: string;
  @ApiProperty() @IsString() condition!: string;
  @ApiProperty() @IsNumber() threshold!: number;
  @ApiProperty({ enum: SEVERITIES }) @IsIn(SEVERITIES) severity!: (typeof SEVERITIES)[number];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateAlertRuleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() metric?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() condition?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumber() threshold?: number;
  @ApiPropertyOptional({ enum: SEVERITIES }) @IsOptional() @IsIn(SEVERITIES) severity?: (typeof SEVERITIES)[number];
  @ApiPropertyOptional() @IsOptional() @IsBoolean() active?: boolean;
}

export class UpdateAlertStatusDto {
  @ApiProperty({ enum: STATUSES }) @IsIn(STATUSES) status!: (typeof STATUSES)[number];
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
