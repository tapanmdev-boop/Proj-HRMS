import { Controller, Get } from '@nestjs/common';

@Controller('employees')
export class EmployeesController {
  @Get()
  getAll() {
    // Return all employees here
    return [];
  }
}
