import { IsISO8601 } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TerminateEmployeeDto {
  @ApiProperty({ example: '2026-12-31', description: 'Last day of employment (ISO date)' })
  @IsISO8601({ strict: true })
  terminationDate: string;
}
