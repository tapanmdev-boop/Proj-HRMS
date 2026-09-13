"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AppModule = void 0;
var common_1 = require("@nestjs/common");
var config_1 = require("@nestjs/config");
var throttler_1 = require("@nestjs/throttler");
var prisma_module_1 = require("./prisma/prisma.module");
var auth_module_1 = require("./auth/auth.module");
var users_module_1 = require("./users/users.module");
var employees_module_1 = require("./employees/employees.module");
var attendance_module_1 = require("./attendance/attendance.module");
var leave_module_1 = require("./leave/leave.module");
var payroll_module_1 = require("./payroll/payroll.module");
var notifications_module_1 = require("./notifications/notifications.module");
var documents_module_1 = require("./documents/documents.module");
var admin_module_1 = require("./admin/admin.module");
var bull_1 = require("@nestjs/bull");
var schedule_1 = require("@nestjs/schedule");
var configuration_1 = require("./config/configuration");
var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        (0, common_1.Module)({
            imports: [
                // Configuration
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    load: [configuration_1["default"]]
                }),
                // Rate limiting
                throttler_1.ThrottlerModule.forRoot([{
                        ttl: 60,
                        limit: 100
                    }]),
                // Queue system with BullMQ
                bull_1.BullModule.forRootAsync({
                    imports: [config_1.ConfigModule],
                    inject: [config_1.ConfigService],
                    useFactory: function (configService) { return ({
                        redis: {
                            host: configService.get('REDIS_HOST'),
                            port: configService.get('REDIS_PORT')
                        }
                    }); }
                }),
                // Scheduling for recurring tasks
                schedule_1.ScheduleModule.forRoot(),
                // Database with Prisma
                prisma_module_1.PrismaModule,
                // Feature modules
                auth_module_1.AuthModule,
                users_module_1.UsersModule,
                employees_module_1.EmployeesModule,
                attendance_module_1.AttendanceModule,
                leave_module_1.LeaveModule,
                payroll_module_1.PayrollModule,
                notifications_module_1.NotificationsModule,
                documents_module_1.DocumentsModule,
                admin_module_1.AdminModule,
            ]
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
