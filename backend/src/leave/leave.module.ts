import { Module } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';
import { HolidaysController } from './holidays.controller';
import { HolidaysService } from './holidays.service';

@Module({
  controllers: [LeaveController, HolidaysController],
  providers: [LeaveService, HolidaysService],
  exports: [LeaveService],
})
export class LeaveModule {}
