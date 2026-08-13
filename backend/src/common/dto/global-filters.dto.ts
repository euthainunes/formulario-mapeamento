import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsOptional, IsString } from 'class-validator';

/** Espelha GlobalFilters (src/types/filters.ts) do front-end mockado. */
export class GlobalFiltersDto {
  @ApiPropertyOptional({ enum: ['7d', '30d', '90d', 'custom'] })
  @IsOptional()
  @IsIn(['7d', '30d', '90d', 'custom'])
  period?: '7d' | '30d' | '90d' | 'custom';

  @ApiPropertyOptional({ description: 'Data inicial ISO (yyyy-MM-dd)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Data final ISO (yyyy-MM-dd)' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  team?: string;
}

export function defaultDateRange(filters: GlobalFiltersDto): { from: string; to: string } {
  if (filters.from && filters.to) return { from: filters.from, to: filters.to };

  const days = filters.period === '90d' ? 90 : filters.period === '30d' ? 30 : 7;
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}
