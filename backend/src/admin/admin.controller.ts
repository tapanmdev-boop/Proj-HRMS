import { Controller, Get } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types/role.enum';

@Controller('admin')
export class AdminController {
  @Roles(Role.ADMIN, Role.HR)
  @Get('stats')
  getStats() {
    // Return analytics data here
    return { employees: 0, leaves: 0, payroll: 0 };
  }
}
