import { Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LeaveStatus, LeaveType } from '@prisma/client';

export const DATE_ONLY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const dateMessage = '$property must be a calendar date in YYYY-MM-DD format';
const LEAVE_TYPES = Object.values(LeaveType);
const LEAVE_STATUSES = Object.values(LeaveStatus);

export class CreateLeaveDto {
  @ApiProperty({ example: '2026-03-02' })
  @Matches(DATE_ONLY, { message: dateMessage })
  startDate: string;

  @ApiProperty({ example: '2026-03-06', description: 'Inclusive. Must be in the same calendar year as startDate' })
  @Matches(DATE_ONLY, { message: dateMessage })
  endDate: string;

  @ApiProperty({ enum: LEAVE_TYPES })
  @IsIn(LEAVE_TYPES)
  leaveType: LeaveType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}

export class DecideLeaveDto {
  @ApiProperty({ required: false, description: 'Required when rejecting' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;
}

export class ListLeaveDto {
  @ApiProperty({ required: false, enum: ['mine', 'team', 'all'], default: 'mine' })
  @IsIn(['mine', 'team', 'all'])
  @IsOptional()
  scope?: 'mine' | 'team' | 'all';

  @ApiProperty({ required: false, enum: LEAVE_STATUSES })
  @IsIn(LEAVE_STATUSES)
  @IsOptional()
  status?: LeaveStatus;

  @ApiProperty({ required: false, description: 'Calendar year of the start date' })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year?: number;

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

export class BalanceQueryDto {
  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year?: number;

  @ApiProperty({ required: false, description: 'Employee id; Admin/HR (any) or a manager (their reports)' })
  @IsString()
  @MaxLength(40)
  @IsOptional()
  employeeId?: string;
}

export class SetPolicyDto {
  @ApiProperty({ example: '20', description: 'Days per calendar year (decimal string, 0-366)' })
  @Matches(/^(\d{1,3})(\.\d{1,2})?$/, { message: 'daysPerYear must be a non-negative decimal with at most 2 decimal places' })
  daysPerYear: string;
}

export class CreateHolidayDto {
  @ApiProperty({ example: '2026-12-25' })
  @Matches(DATE_ONLY, { message: dateMessage })
  date: string;

  @ApiProperty({ example: 'Christmas Day' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}

export class ListHolidaysDto {
  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year?: number;
}
