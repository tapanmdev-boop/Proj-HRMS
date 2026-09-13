"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.RegisterDto = void 0;
var class_validator_1 = require("class-validator");
var swagger_1 = require("@nestjs/swagger");
var role_enum_1 = require("../../common/types/role.enum");
var RegisterDto = /** @class */ (function () {
    function RegisterDto() {
    }
    __decorate([
        (0, swagger_1.ApiProperty)({ example: 'user@example.com' }),
        (0, class_validator_1.IsEmail)(),
        (0, class_validator_1.IsNotEmpty)()
    ], RegisterDto.prototype, "email");
    __decorate([
        (0, swagger_1.ApiProperty)({ example: 'password123' }),
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsNotEmpty)(),
        (0, class_validator_1.MinLength)(6)
    ], RegisterDto.prototype, "password");
    __decorate([
        (0, swagger_1.ApiProperty)({ example: 'John' }),
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsNotEmpty)()
    ], RegisterDto.prototype, "firstName");
    __decorate([
        (0, swagger_1.ApiProperty)({ example: 'Doe' }),
        (0, class_validator_1.IsString)(),
        (0, class_validator_1.IsNotEmpty)()
    ], RegisterDto.prototype, "lastName");
    __decorate([
        (0, swagger_1.ApiProperty)({ "enum": role_enum_1.Role, example: role_enum_1.Role.EMPLOYEE }),
        (0, class_validator_1.IsEnum)(role_enum_1.Role),
        (0, class_validator_1.IsOptional)()
    ], RegisterDto.prototype, "role");
    return RegisterDto;
}());
exports.RegisterDto = RegisterDto;
