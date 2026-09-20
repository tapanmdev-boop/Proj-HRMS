import { Controller, Get } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types/role.enum';

@Controller('payroll')
export class PayrollController {
  @Roles(Role.ADMIN, Role.HR)
  @Get('summary')
  getSummary() {
    // Return payroll summary here
    return { totalPayroll: 0 };
  }
}
