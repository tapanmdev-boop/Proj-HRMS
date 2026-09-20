import { IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsCountryCode, IsCurrencyCode, IsIanaTimezone, IsLocaleTag } from '../../common/validators/locale.validators';

export class UpdateTenantDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @IsOptional()
  displayName?: string;

  @ApiProperty({ required: false, example: 'IN', description: 'ISO 3166-1 alpha-2 country of registration' })
  @IsCountryCode()
  @IsOptional()
  countryCode?: string;

  @ApiProperty({ required: false, example: 'en-GB', description: 'BCP 47 default language for the organization' })
  @IsLocaleTag()
  @IsOptional()
  defaultLocale?: string;

  @ApiProperty({ required: false, example: 'Europe/London' })
  @IsIanaTimezone()
  @IsOptional()
  defaultTimezone?: string;

  @ApiProperty({ required: false, example: 'EUR', description: 'ISO 4217 currency used when a record has none of its own' })
  @IsCurrencyCode()
  @IsOptional()
  baseCurrency?: string;

  @ApiProperty({ required: false, minimum: 0, maximum: 6, description: '0 = Sunday ... 6 = Saturday' })
  @IsInt()
  @Min(0)
  @Max(6)
  @IsOptional()
  weekStartsOn?: number;

  @ApiProperty({ required: false, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  fiscalYearStartMonth?: number;
}
