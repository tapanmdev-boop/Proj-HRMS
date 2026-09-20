import { OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * Email and OAuth provider ids are intentionally not updatable through this endpoint
 * (identity changes need a dedicated verified flow).
 */
export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['email'] as const)) {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
