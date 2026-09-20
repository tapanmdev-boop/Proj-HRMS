import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  organizationName: string;

  @ApiProperty({ example: 'acme', description: 'Unique organization slug: lowercase letters, digits and hyphens' })
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/, {
    message: 'organizationSlug must be 3-40 characters: lowercase letters, digits and hyphens, not starting or ending with a hyphen',
  })
  organizationSlug: string;

  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ minLength: 8, maxLength: 72 })
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
}
