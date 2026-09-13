"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.DocumentsModule = void 0;
var common_1 = require("@nestjs/common");
var documents_service_1 = require("./documents.service");
var documents_controller_1 = require("./documents.controller");
var prisma_module_1 = require("../prisma/prisma.module");
var s3_service_1 = require("./s3.service");
var config_1 = require("@nestjs/config");
var DocumentsModule = /** @class */ (function () {
    function DocumentsModule() {
    }
    DocumentsModule = __decorate([
        (0, common_1.Module)({
            imports: [
                prisma_module_1.PrismaModule,
                config_1.ConfigModule,
            ],
            controllers: [documents_controller_1.DocumentsController],
            providers: [documents_service_1.DocumentsService, s3_service_1.S3Service],
            exports: [documents_service_1.DocumentsService, s3_service_1.S3Service]
        })
    ], DocumentsModule);
    return DocumentsModule;
}());
exports.DocumentsModule = DocumentsModule;
