import { Controller, Get } from '@nestjs/common';

@Controller('payroll')
export class PayrollController {
  @Get('summary')
  getSummary() {
    // Return payroll summary here
    return { totalPayroll: 0 };
  }
}
