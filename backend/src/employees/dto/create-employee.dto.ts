import { IsEmail, IsEnum, IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { IsCurrencyCode } from '../../common/validators/locale.validators';
import { IsAllowanceList, IsIdentifierMap, MONEY_PATTERN } from '../../common/validators/data.validators';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'jane.doe@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ minLength: 8, maxLength: 72, description: 'Initial password for the new user' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiProperty({ example: 'Jane' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ required: false, enum: ['EMPLOYEE', 'MANAGER', 'HR'], default: 'EMPLOYEE', description: 'Administrators are created through the users API' })
  @IsIn(['EMPLOYEE', 'MANAGER', 'HR'])
  @IsOptional()
  role?: 'EMPLOYEE' | 'MANAGER' | 'HR';

  @ApiProperty({ required: false, description: 'Generated per organization (EMP-0001, ...) when omitted' })
  @Matches(/^[A-Za-z0-9._/-]{1,40}$/)
  @IsOptional()
  employeeId?: string;

  @ApiProperty({ example: 'Senior Developer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  position: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({ required: false, description: 'Employee id (not user id) of the direct manager' })
  @IsUUID()
  @IsOptional()
  managerId?: string;

  @ApiProperty({ example: '2026-01-15', description: 'ISO date (YYYY-MM-DD)' })
  @IsISO8601({ strict: true })
  joinDate: string;

  @ApiProperty({ required: false, example: '1990-05-20' })
  @IsISO8601({ strict: true })
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ required: false, enum: Gender })
  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(40)
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsString()
  @MaxLength(300)
  @IsOptional()
  emergencyContact?: string;

  @ApiProperty({ required: false, description: 'Bank account / IBAN. Stored as text; format rules are jurisdiction-specific' })
  @IsString()
  @MaxLength(64)
  @IsOptional()
  bankAccount?: string;

  @ApiProperty({ example: '5000.00', description: 'Base pay per pay period as an exact decimal string' })
  @Matches(MONEY_PATTERN, { message: 'salary must be a non-negative decimal string with at most 4 decimal places' })
  salary: string;

  @ApiProperty({ required: false, example: 'EUR', description: 'ISO 4217. Falls back to the organization currency' })
  @IsCurrencyCode()
  @IsOptional()
  currency?: string;

  @ApiProperty({ required: false, example: { national_id: '784-1990-1234567-1', tax_id: 'ABCDE1234F' } })
  @IsIdentifierMap()
  @IsOptional()
  identifiers?: Record<string, string>;

  @ApiProperty({ required: false, example: [{ code: 'housing', label: 'Housing', amount: '1200.00' }] })
  @IsAllowanceList()
  @IsOptional()
  allowances?: { code: string; label?: string; amount: string }[];
}
