import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PayrollController } from './payroll.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bull';
import { DocumentsModule } from '../documents/documents.module';
import { PayrollProcessor } from './payroll.processor';

@Module({
  imports: [
    PrismaModule,
    DocumentsModule,
    BullModule.registerQueue({
      name: 'payroll',
    }),
  ],
  controllers: [PayrollController],
  providers: [PayrollService, PayrollProcessor],
  exports: [PayrollService],
})
export class PayrollModule {}
