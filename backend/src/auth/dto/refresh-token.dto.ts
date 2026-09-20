import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'The opaque refresh token returned by login, sign-up or a previous refresh' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  refreshToken: string;
}
