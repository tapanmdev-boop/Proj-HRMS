"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
exports.__esModule = true;
exports.UsersController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var passport_1 = require("@nestjs/passport");
var roles_guard_1 = require("../common/guards/roles.guard");
var roles_decorator_1 = require("../common/decorators/roles.decorator");
var role_enum_1 = require("../common/types/role.enum");
var tenant_decorator_1 = require("../common/decorators/tenant.decorator");
var UsersController = /** @class */ (function () {
    function UsersController(usersService) {
        this.usersService = usersService;
    }
    UsersController.prototype.create = function (createUserDto, tenantId) {
        return this.usersService.create(createUserDto, tenantId);
    };
    UsersController.prototype.findAll = function (tenantId) {
        return this.usersService.findAll(tenantId);
    };
    UsersController.prototype.findOne = function (id) {
        return this.usersService.findOne(id);
    };
    UsersController.prototype.update = function (id, updateUserDto) {
        return this.usersService.update(id, updateUserDto);
    };
    UsersController.prototype.remove = function (id) {
        return this.usersService.remove(id);
    };
    __decorate([
        (0, common_1.Post)(),
        (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.HR),
        (0, swagger_1.ApiOperation)({ summary: 'Create new user (Admin & HR only)' }),
        (0, swagger_1.ApiResponse)({ status: 201, description: 'The user has been successfully created.' }),
        (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden.' }),
        __param(0, (0, common_1.Body)()),
        __param(1, (0, tenant_decorator_1.TenantDecorator)())
    ], UsersController.prototype, "create");
    __decorate([
        (0, common_1.Get)(),
        (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.HR),
        (0, swagger_1.ApiOperation)({ summary: 'Get all users (Admin & HR only)' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Return all users' }),
        __param(0, (0, tenant_decorator_1.TenantDecorator)())
    ], UsersController.prototype, "findAll");
    __decorate([
        (0, common_1.Get)(':id'),
        (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'Return the user' }),
        (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
        __param(0, (0, common_1.Param)('id'))
    ], UsersController.prototype, "findOne");
    __decorate([
        (0, common_1.Patch)(':id'),
        (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN, role_enum_1.Role.HR),
        (0, swagger_1.ApiOperation)({ summary: 'Update user (Admin & HR only)' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'The user has been successfully updated.' }),
        __param(0, (0, common_1.Param)('id')),
        __param(1, (0, common_1.Body)())
    ], UsersController.prototype, "update");
    __decorate([
        (0, common_1.Delete)(':id'),
        (0, roles_decorator_1.Roles)(role_enum_1.Role.ADMIN),
        (0, swagger_1.ApiOperation)({ summary: 'Delete user (Admin only)' }),
        (0, swagger_1.ApiResponse)({ status: 200, description: 'The user has been successfully deleted.' }),
        __param(0, (0, common_1.Param)('id'))
    ], UsersController.prototype, "remove");
    UsersController = __decorate([
        (0, swagger_1.ApiTags)('users'),
        (0, common_1.Controller)('users'),
        (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
        (0, swagger_1.ApiBearerAuth)()
    ], UsersController);
    return UsersController;
}());
exports.UsersController = UsersController;
