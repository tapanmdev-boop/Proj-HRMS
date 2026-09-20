"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var create_user_dto_1 = require("./create-user.dto");
var class_validator_1 = require("class-validator");
var swagger_2 = require("@nestjs/swagger");
var UpdateUserDto = function () {
    var _a;
    var _classSuper = (0, swagger_1.PartialType)(create_user_dto_1.CreateUserDto);
    var _isActive_decorators;
    var _isActive_initializers = [];
    var _isActive_extraInitializers = [];
    var _googleId_decorators;
    var _googleId_initializers = [];
    var _googleId_extraInitializers = [];
    var _microsoftId_decorators;
    var _microsoftId_initializers = [];
    var _microsoftId_extraInitializers = [];
    return _a = /** @class */ (function (_super) {
            __extends(UpdateUserDto, _super);
            function UpdateUserDto() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.isActive = __runInitializers(_this, _isActive_initializers, void 0);
                _this.googleId = (__runInitializers(_this, _isActive_extraInitializers), __runInitializers(_this, _googleId_initializers, void 0));
                _this.microsoftId = (__runInitializers(_this, _googleId_extraInitializers), __runInitializers(_this, _microsoftId_initializers, void 0));
                __runInitializers(_this, _microsoftId_extraInitializers);
                return _this;
            }
            return UpdateUserDto;
        }(_classSuper)),
        (function () {
            var _b;
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create((_b = _classSuper[Symbol.metadata]) !== null && _b !== void 0 ? _b : null) : void 0;
            _isActive_decorators = [(0, swagger_2.ApiProperty)({ required: false }), (0, class_validator_1.IsBoolean)(), (0, class_validator_1.IsOptional)()];
            _googleId_decorators = [(0, swagger_2.ApiProperty)({ required: false }), (0, class_validator_1.IsOptional)()];
            _microsoftId_decorators = [(0, swagger_2.ApiProperty)({ required: false }), (0, class_validator_1.IsOptional)()];
            __esDecorate(null, null, _isActive_decorators, { kind: "field", name: "isActive", static: false, private: false, access: { has: function (obj) { return "isActive" in obj; }, get: function (obj) { return obj.isActive; }, set: function (obj, value) { obj.isActive = value; } }, metadata: _metadata }, _isActive_initializers, _isActive_extraInitializers);
            __esDecorate(null, null, _googleId_decorators, { kind: "field", name: "googleId", static: false, private: false, access: { has: function (obj) { return "googleId" in obj; }, get: function (obj) { return obj.googleId; }, set: function (obj, value) { obj.googleId = value; } }, metadata: _metadata }, _googleId_initializers, _googleId_extraInitializers);
            __esDecorate(null, null, _microsoftId_decorators, { kind: "field", name: "microsoftId", static: false, private: false, access: { has: function (obj) { return "microsoftId" in obj; }, get: function (obj) { return obj.microsoftId; }, set: function (obj, value) { obj.microsoftId = value; } }, metadata: _metadata }, _microsoftId_initializers, _microsoftId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateUserDto = UpdateUserDto;
