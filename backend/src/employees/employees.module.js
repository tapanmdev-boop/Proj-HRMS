"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.EmployeesModule = void 0;
var common_1 = require("@nestjs/common");
var employees_service_1 = require("./employees.service");
var employees_controller_1 = require("./employees.controller");
var prisma_module_1 = require("../prisma/prisma.module");
var EmployeesModule = /** @class */ (function () {
    function EmployeesModule() {
    }
    EmployeesModule = __decorate([
        (0, common_1.Module)({
            imports: [prisma_module_1.PrismaModule],
            controllers: [employees_controller_1.EmployeesController],
            providers: [employees_service_1.EmployeesService],
            exports: [employees_service_1.EmployeesService]
        })
    ], EmployeesModule);
    return EmployeesModule;
}());
exports.EmployeesModule = EmployeesModule;
