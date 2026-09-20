import { Controller, Get } from '@nestjs/common';

@Controller('admin')
export class AdminController {
  @Get('stats')
  getStats() {
    // Return analytics data here
    return { employees: 0, leaves: 0, payroll: 0 };
  }
}
