import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  password: string;

  @ApiProperty({
    required: false,
    example: 'acme',
    description: 'Organization slug. Only selects which organization to sign in to; it grants nothing by itself.',
  })
  @IsString()
  @Matches(/^[a-z0-9-]+$/)
  @MaxLength(40)
  @IsOptional()
  tenant?: string;
}
