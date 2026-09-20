import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ListEmployeesDto {
  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ required: false, default: 25, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize?: number = 25;

  @ApiProperty({ required: false, description: 'Matches name, email, position or employee id' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ required: false, enum: ['ACTIVE', 'TERMINATED'] })
  @IsIn(['ACTIVE', 'TERMINATED'])
  @IsOptional()
  status?: 'ACTIVE' | 'TERMINATED';
}
