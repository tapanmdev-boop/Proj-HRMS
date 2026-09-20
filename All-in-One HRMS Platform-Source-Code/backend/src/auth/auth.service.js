"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
var common_1 = require("@nestjs/common");
var bcrypt = require("bcrypt");
var AuthService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AuthService = _classThis = /** @class */ (function () {
        function AuthService_1(usersService, jwtService) {
            this.usersService = usersService;
            this.jwtService = jwtService;
        }
        AuthService_1.prototype.validateUser = function (email, password, tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                var user, isPasswordValid, password_1, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.usersService.findByEmail(email, tenantId)];
                        case 1:
                            user = _a.sent();
                            if (!user) {
                                return [2 /*return*/, null];
                            }
                            if (!user.password) {
                                throw new common_1.UnauthorizedException('Login with OAuth provider');
                            }
                            return [4 /*yield*/, bcrypt.compare(password, user.password)];
                        case 2:
                            isPasswordValid = _a.sent();
                            if (isPasswordValid) {
                                password_1 = user.password, result = __rest(user, ["password"]);
                                return [2 /*return*/, result];
                            }
                            return [2 /*return*/, null];
                    }
                });
            });
        };
        AuthService_1.prototype.login = function (loginDto, tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.usersService.findByEmail(loginDto.email, tenantId)];
                        case 1:
                            user = _a.sent();
                            if (!user || !user.isActive) {
                                throw new common_1.UnauthorizedException('Invalid credentials or inactive account');
                            }
                            // Update last login time
                            return [4 /*yield*/, this.usersService.updateLastLogin(user.id)];
                        case 2:
                            // Update last login time
                            _a.sent();
                            return [2 /*return*/, this.generateToken(user)];
                    }
                });
            });
        };
        AuthService_1.prototype.register = function (registerDto, tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.usersService.create(registerDto, tenantId)];
                        case 1:
                            user = _a.sent();
                            return [2 /*return*/, this.generateToken(user)];
                    }
                });
            });
        };
        AuthService_1.prototype.validateOAuthLogin = function (profile, provider, tenantId) {
            return __awaiter(this, void 0, void 0, function () {
                var user, newUser;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(provider === 'google')) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.usersService.findByGoogleId(profile.id, tenantId)];
                        case 1:
                            user = _a.sent();
                            return [3 /*break*/, 4];
                        case 2:
                            if (!(provider === 'microsoft')) return [3 /*break*/, 4];
                            return [4 /*yield*/, this.usersService.findByMicrosoftId(profile.id, tenantId)];
                        case 3:
                            user = _a.sent();
                            _a.label = 4;
                        case 4:
                            if (!!user) return [3 /*break*/, 12];
                            return [4 /*yield*/, this.usersService.findByEmail(profile.emails[0].value, tenantId)];
                        case 5:
                            user = _a.sent();
                            if (!user) return [3 /*break*/, 10];
                            if (!(provider === 'google')) return [3 /*break*/, 7];
                            return [4 /*yield*/, this.usersService.update(user.id, { googleId: profile.id })];
                        case 6:
                            _a.sent();
                            return [3 /*break*/, 9];
                        case 7:
                            if (!(provider === 'microsoft')) return [3 /*break*/, 9];
                            return [4 /*yield*/, this.usersService.update(user.id, { microsoftId: profile.id })];
                        case 8:
                            _a.sent();
                            _a.label = 9;
                        case 9: return [3 /*break*/, 12];
                        case 10:
                            newUser = __assign(__assign(__assign({ email: profile.emails[0].value, firstName: profile.name.givenName, lastName: profile.name.familyName }, (provider === 'google' ? { googleId: profile.id } : {})), (provider === 'microsoft' ? { microsoftId: profile.id } : {})), { role: 'EMPLOYEE' });
                            return [4 /*yield*/, this.usersService.createOAuthUser(newUser, tenantId)];
                        case 11:
                            user = _a.sent();
                            _a.label = 12;
                        case 12: 
                        // Update last login time
                        return [4 /*yield*/, this.usersService.updateLastLogin(user.id)];
                        case 13:
                            // Update last login time
                            _a.sent();
                            return [2 /*return*/, this.generateToken(user)];
                    }
                });
            });
        };
        AuthService_1.prototype.generateToken = function (user) {
            var payload = {
                sub: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
            };
            return {
                accessToken: this.jwtService.sign(payload),
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            };
        };
        return AuthService_1;
    }());
    __setFunctionName(_classThis, "AuthService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthService = _classThis;
}();
exports.AuthService = AuthService;
