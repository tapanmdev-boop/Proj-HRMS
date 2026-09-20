import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerOptions } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeaveModule } from './leave/leave.module';
import { PayrollModule } from './payroll/payroll.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DocumentsModule } from './documents/documents.module';
import { AdminModule } from './admin/admin.module';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60, // 1 minute
      limit: 100, // 100 requests per minute
    }] as ThrottlerOptions[]),
    
    // Queue system with BullMQ
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
    }),
    
    // Scheduling for recurring tasks
    ScheduleModule.forRoot(),
    
    // Database with Prisma
    PrismaModule,
    
    // Feature modules
    AuthModule,
    UsersModule,
    EmployeesModule,
    AttendanceModule,
    LeaveModule,
    PayrollModule,
    NotificationsModule,
    DocumentsModule,
    AdminModule,
  ],
})
export class AppModule {}
