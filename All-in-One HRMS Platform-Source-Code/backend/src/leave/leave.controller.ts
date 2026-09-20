import { Controller, Get } from '@nestjs/common';

@Controller('leave')
export class LeaveController {
  @Get()
  getAll() {
    // Return all leave requests here
    return [];
  }
}
