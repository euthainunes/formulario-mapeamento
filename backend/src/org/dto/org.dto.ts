import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty() @IsString() @MinLength(1) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceId?: string;
}
export class UpdateCompanyDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
}

export class CreateDepartmentDto {
  @ApiProperty() @IsString() @MinLength(1) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() companyId?: string;
}
export class UpdateDepartmentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() companyId?: string;
}

export class CreateJobTitleDto {
  @ApiProperty() @IsString() @MinLength(1) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
}
export class UpdateJobTitleDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() departmentId?: string;
}

export class CreateTeamDto {
  @ApiProperty() @IsString() @MinLength(1) name!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sourceId?: string;
}
export class UpdateTeamDto {
  @ApiPropertyOptional() @IsOptional() @IsString() name?: string;
}
