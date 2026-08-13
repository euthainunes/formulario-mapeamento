import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VariationResult } from './variation.util';

class VariationResultDto implements VariationResult {
  @ApiProperty() current!: number;
  @ApiProperty() previous!: number;
  @ApiProperty() comparable!: boolean;
  @ApiProperty({ nullable: true, type: Number }) percentChange!: number | null;
  @ApiProperty({ enum: ['up', 'down', 'flat', 'none'] }) direction!: 'up' | 'down' | 'flat' | 'none';
}

/**
 * DTO de cartão de KPI. Superset compatível com `KpiCard` do front-end
 * (src/types/metrics.ts): mantém os mesmos campos (id, label, value,
 * formattedValue, variation, formula, unit, partialCoverage) e acrescenta
 * `version` e `source`, exigidos pela spec para toda métrica derivada
 * exposta por API ("formula, version e source no payload de resposta").
 */
export class KpiCardDto {
  @ApiProperty() id!: string;
  @ApiProperty() label!: string;
  @ApiProperty() value!: number;
  @ApiPropertyOptional() formattedValue?: string;
  @ApiProperty({ type: VariationResultDto }) variation!: VariationResult;
  @ApiProperty({ description: 'Fórmula/definição da métrica em texto legível' }) formula!: string;
  @ApiProperty({ description: 'Versão da definição da métrica (incrementa se a fórmula mudar)' }) version!: number;
  @ApiProperty({ description: 'Origem dos dados (ex: BeeHome /audit/loginsByDate, MetricSnapshot)' }) source!: string;
  @ApiPropertyOptional({ enum: ['number', 'percent'] }) unit?: 'number' | 'percent';
  @ApiPropertyOptional() partialCoverage?: boolean;
}

export function buildKpi(params: {
  id: string;
  label: string;
  value: number;
  formattedValue?: string;
  variation: VariationResult;
  formula: string;
  version: number;
  source: string;
  unit?: 'number' | 'percent';
  partialCoverage?: boolean;
}): KpiCardDto {
  return { ...params };
}
