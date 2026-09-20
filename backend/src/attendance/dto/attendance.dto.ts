import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CorrectionStatus } from '@prisma/client';
import { DATE_ONLY } from '../../leave/dto/leave.dto';

const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;
const STATUSES = Object.values(CorrectionStatus);

class Paging {
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
}

export class ClockDto {
  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  note?: string;
}

export class ListAttendanceDto extends Paging {
  @ApiProperty({ required: false, enum: ['mine', 'team', 'all'], default: 'mine' })
  @IsIn(['mine', 'team', 'all'])
  @IsOptional()
  scope?: 'mine' | 'team' | 'all';

  @ApiProperty({ required: false, example: '2026-03-01', description: 'Organization-local date; defaults to 30 days ago' })
  @Matches(DATE_ONLY, { message: '$property must be a calendar date in YYYY-MM-DD format' })
  @IsOptional()
  from?: string;

  @ApiProperty({ required: false, example: '2026-03-31', description: 'Organization-local date; defaults to today' })
  @Matches(DATE_ONLY, { message: '$property must be a calendar date in YYYY-MM-DD format' })
  @IsOptional()
  to?: string;
}

export class SummaryQueryDto {
  @ApiProperty({ example: '2026-03-01' })
  @Matches(DATE_ONLY, { message: '$property must be a calendar date in YYYY-MM-DD format' })
  from: string;

  @ApiProperty({ example: '2026-03-31' })
  @Matches(DATE_ONLY, { message: '$property must be a calendar date in YYYY-MM-DD format' })
  to: string;

  @ApiProperty({ required: false, description: 'Employee id; Admin/HR (any) or a manager (their reports)' })
  @IsString()
  @MaxLength(40)
  @IsOptional()
  employeeId?: string;
}

export class CreateCorrectionDto {
  @ApiProperty({ example: '2026-03-02', description: 'The organization-local day being corrected' })
  @Matches(DATE_ONLY, { message: '$property must be a calendar date in YYYY-MM-DD format' })
  date: string;

  @ApiProperty({ example: '09:00', description: 'Local time (24h) in the organization timezone' })
  @Matches(TIME_OF_DAY, { message: '$property must be a time in HH:MM (24-hour) format' })
  clockInTime: string;

  @ApiProperty({ example: '17:30', description: 'Local time; if not later than the clock-in time it is taken to be on the next day (overnight shift)' })
  @Matches(TIME_OF_DAY, { message: '$property must be a time in HH:MM (24-hour) format' })
  clockOutTime: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class ListCorrectionsDto extends Paging {
  @ApiProperty({ required: false, enum: ['mine', 'team', 'all'], default: 'mine' })
  @IsIn(['mine', 'team', 'all'])
  @IsOptional()
  scope?: 'mine' | 'team' | 'all';

  @ApiProperty({ required: false, enum: STATUSES })
  @IsIn(STATUSES)
  @IsOptional()
  status?: CorrectionStatus;
}

export class DecideCorrectionDto {
  @ApiProperty({ required: false, description: 'Required when rejecting' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;
}
