"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var passport_1 = require("@nestjs/passport");
var AuthController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('auth'), (0, common_1.Controller)('auth')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _login_decorators;
    var _register_decorators;
    var _googleLogin_decorators;
    var _googleLoginCallback_decorators;
    var _microsoftLogin_decorators;
    var _microsoftLoginCallback_decorators;
    var _getProfile_decorators;
    var AuthController = _classThis = /** @class */ (function () {
        function AuthController_1(authService) {
            this.authService = (__runInitializers(this, _instanceExtraInitializers), authService);
        }
        AuthController_1.prototype.login = function (loginDto, req) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.authService.login(loginDto, req['tenantId'])];
                });
            });
        };
        AuthController_1.prototype.register = function (registerDto, req) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.authService.register(registerDto, req['tenantId'])];
                });
            });
        };
        AuthController_1.prototype.googleLogin = function () {
            // This method initiates the Google OAuth flow
            // The actual implementation is handled by Passport
        };
        AuthController_1.prototype.googleLoginCallback = function (req) {
            return req.user;
        };
        AuthController_1.prototype.microsoftLogin = function () {
            // This method initiates the Microsoft OAuth flow
        };
        AuthController_1.prototype.microsoftLoginCallback = function (req) {
            return req.user;
        };
        AuthController_1.prototype.getProfile = function (req) {
            return req.user;
        };
        return AuthController_1;
    }());
    __setFunctionName(_classThis, "AuthController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _login_decorators = [(0, common_1.Post)('login'), (0, common_1.HttpCode)(common_1.HttpStatus.OK), (0, swagger_1.ApiOperation)({ summary: 'User login' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful' }), (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' })];
        _register_decorators = [(0, common_1.Post)('register'), (0, swagger_1.ApiOperation)({ summary: 'Register a new user' }), (0, swagger_1.ApiResponse)({ status: 201, description: 'User successfully registered' }), (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad request' })];
        _googleLogin_decorators = [(0, common_1.Get)('google'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')), (0, swagger_1.ApiOperation)({ summary: 'Google OAuth login' })];
        _googleLoginCallback_decorators = [(0, common_1.Get)('google/callback'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('google')), (0, swagger_1.ApiOperation)({ summary: 'Google OAuth callback' })];
        _microsoftLogin_decorators = [(0, common_1.Get)('microsoft'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('microsoft')), (0, swagger_1.ApiOperation)({ summary: 'Microsoft OAuth login' })];
        _microsoftLoginCallback_decorators = [(0, common_1.Get)('microsoft/callback'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('microsoft')), (0, swagger_1.ApiOperation)({ summary: 'Microsoft OAuth callback' })];
        _getProfile_decorators = [(0, common_1.Get)('profile'), (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')), (0, swagger_1.ApiBearerAuth)(), (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }), (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile data returned' }), (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' })];
        __esDecorate(_classThis, null, _login_decorators, { kind: "method", name: "login", static: false, private: false, access: { has: function (obj) { return "login" in obj; }, get: function (obj) { return obj.login; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _register_decorators, { kind: "method", name: "register", static: false, private: false, access: { has: function (obj) { return "register" in obj; }, get: function (obj) { return obj.register; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _googleLogin_decorators, { kind: "method", name: "googleLogin", static: false, private: false, access: { has: function (obj) { return "googleLogin" in obj; }, get: function (obj) { return obj.googleLogin; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _googleLoginCallback_decorators, { kind: "method", name: "googleLoginCallback", static: false, private: false, access: { has: function (obj) { return "googleLoginCallback" in obj; }, get: function (obj) { return obj.googleLoginCallback; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _microsoftLogin_decorators, { kind: "method", name: "microsoftLogin", static: false, private: false, access: { has: function (obj) { return "microsoftLogin" in obj; }, get: function (obj) { return obj.microsoftLogin; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _microsoftLoginCallback_decorators, { kind: "method", name: "microsoftLoginCallback", static: false, private: false, access: { has: function (obj) { return "microsoftLoginCallback" in obj; }, get: function (obj) { return obj.microsoftLoginCallback; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getProfile_decorators, { kind: "method", name: "getProfile", static: false, private: false, access: { has: function (obj) { return "getProfile" in obj; }, get: function (obj) { return obj.getProfile; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthController = _classThis;
}();
exports.AuthController = AuthController;
