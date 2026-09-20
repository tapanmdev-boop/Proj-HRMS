import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';

/** Email, initial password and role are managed through the users API. */
export class UpdateEmployeeDto extends PartialType(OmitType(CreateEmployeeDto, ['email', 'password', 'role'] as const)) {}
