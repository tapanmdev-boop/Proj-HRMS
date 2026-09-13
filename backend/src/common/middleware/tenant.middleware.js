"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.TenantMiddleware = void 0;
var common_1 = require("@nestjs/common");
var TenantMiddleware = /** @class */ (function () {
    function TenantMiddleware(configService) {
        this.configService = configService;
    }
    TenantMiddleware.prototype.use = function (req, res, next) {
        // Get tenant from header or use default
        var tenantId = req.headers['x-tenant-id'] ||
            this.configService.get('tenant.default');
        // Attach tenant to request for later use
        req['tenantId'] = tenantId;
        next();
    };
    TenantMiddleware = __decorate([
        (0, common_1.Injectable)()
    ], TenantMiddleware);
    return TenantMiddleware;
}());
exports.TenantMiddleware = TenantMiddleware;
