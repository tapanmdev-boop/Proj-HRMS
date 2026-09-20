import { Controller, Get } from '@nestjs/common';

@Controller('attendance')
export class AttendanceController {
  @Get()
  getAll() {
    // Return all attendance logs here
    return [];
  }
}
