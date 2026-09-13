"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.PayrollModule = void 0;
var common_1 = require("@nestjs/common");
var payroll_service_1 = require("./payroll.service");
var payroll_controller_1 = require("./payroll.controller");
var prisma_module_1 = require("../prisma/prisma.module");
var bull_1 = require("@nestjs/bull");
var documents_module_1 = require("../documents/documents.module");
var payroll_processor_1 = require("./payroll.processor");
var PayrollModule = /** @class */ (function () {
    function PayrollModule() {
    }
    PayrollModule = __decorate([
        (0, common_1.Module)({
            imports: [
                prisma_module_1.PrismaModule,
                documents_module_1.DocumentsModule,
                bull_1.BullModule.registerQueue({
                    name: 'payroll'
                }),
            ],
            controllers: [payroll_controller_1.PayrollController],
            providers: [payroll_service_1.PayrollService, payroll_processor_1.PayrollProcessor],
            exports: [payroll_service_1.PayrollService]
        })
    ], PayrollModule);
    return PayrollModule;
}());
exports.PayrollModule = PayrollModule;
