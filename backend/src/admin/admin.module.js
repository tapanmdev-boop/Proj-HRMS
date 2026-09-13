"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AdminModule = void 0;
var common_1 = require("@nestjs/common");
var admin_service_1 = require("./admin.service");
var admin_controller_1 = require("./admin.controller");
var prisma_module_1 = require("../prisma/prisma.module");
var employees_module_1 = require("../employees/employees.module");
var attendance_module_1 = require("../attendance/attendance.module");
var leave_module_1 = require("../leave/leave.module");
var payroll_module_1 = require("../payroll/payroll.module");
var AdminModule = /** @class */ (function () {
    function AdminModule() {
    }
    AdminModule = __decorate([
        (0, common_1.Module)({
            imports: [
                prisma_module_1.PrismaModule,
                employees_module_1.EmployeesModule,
                attendance_module_1.AttendanceModule,
                leave_module_1.LeaveModule,
                payroll_module_1.PayrollModule,
            ],
            controllers: [admin_controller_1.AdminController],
            providers: [admin_service_1.AdminService],
            exports: [admin_service_1.AdminService]
        })
    ], AdminModule);
    return AdminModule;
}());
exports.AdminModule = AdminModule;
