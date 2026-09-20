import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { NotificationsProcessor } from './notifications.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, NotificationsProcessor],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}
