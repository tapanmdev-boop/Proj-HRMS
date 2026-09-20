"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
var common_1 = require("@nestjs/common");
var SendGrid = require("@sendgrid/mail");
var EmailService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var EmailService = _classThis = /** @class */ (function () {
        function EmailService_1(configService) {
            this.configService = configService;
            this.logger = new common_1.Logger(EmailService.name);
            SendGrid.setApiKey(this.configService.get('email.sendgridApiKey'));
        }
        EmailService_1.prototype.sendEmail = function (to, subject, text, html) {
            return __awaiter(this, void 0, void 0, function () {
                var msg, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            msg = {
                                to: to,
                                from: this.configService.get('email.from'),
                                subject: subject,
                                text: text,
                                html: html || text,
                            };
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, SendGrid.send(msg)];
                        case 2:
                            _a.sent();
                            this.logger.log("Email sent to: ".concat(to));
                            return [2 /*return*/, true];
                        case 3:
                            error_1 = _a.sent();
                            this.logger.error("Failed to send email to ".concat(to), error_1.stack);
                            return [2 /*return*/, false];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        EmailService_1.prototype.sendTemplateEmail = function (to, templateId, dynamicTemplateData) {
            return __awaiter(this, void 0, void 0, function () {
                var msg, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            msg = {
                                to: to,
                                from: this.configService.get('email.from'),
                                templateId: templateId,
                                dynamicTemplateData: dynamicTemplateData,
                            };
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, SendGrid.send(msg)];
                        case 2:
                            _a.sent();
                            this.logger.log("Template email sent to: ".concat(to));
                            return [2 /*return*/, true];
                        case 3:
                            error_2 = _a.sent();
                            this.logger.error("Failed to send template email to ".concat(to), error_2.stack);
                            return [2 /*return*/, false];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        // Templates for common notifications
        EmailService_1.prototype.sendLeaveRequestNotification = function (to, employeeName, startDate, endDate, leaveType, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var subject, text;
                return __generator(this, function (_a) {
                    subject = "Leave Request from ".concat(employeeName);
                    text = "\n      A new leave request has been submitted:\n      \n      Employee: ".concat(employeeName, "\n      Leave Type: ").concat(leaveType, "\n      Start Date: ").concat(startDate, "\n      End Date: ").concat(endDate, "\n      Reason: ").concat(reason, "\n      \n      Please review this request at your earliest convenience.\n    ");
                    return [2 /*return*/, this.sendEmail(to, subject, text)];
                });
            });
        };
        EmailService_1.prototype.sendLeaveStatusNotification = function (to, employeeName, status, startDate, endDate, leaveType, reason) {
            return __awaiter(this, void 0, void 0, function () {
                var subject, text;
                return __generator(this, function (_a) {
                    subject = "Leave Request ".concat(status);
                    text = "\n      Dear ".concat(employeeName, ",\n      \n      Your leave request has been ").concat(status.toLowerCase(), ":\n      \n      Leave Type: ").concat(leaveType, "\n      Start Date: ").concat(startDate, "\n      End Date: ").concat(endDate, "\n      ").concat(reason ? "Reason: ".concat(reason) : '', "\n      \n      If you have any questions, please contact HR.\n    ");
                    return [2 /*return*/, this.sendEmail(to, subject, text)];
                });
            });
        };
        EmailService_1.prototype.sendPayslipNotification = function (to, employeeName, month, year, downloadLink) {
            return __awaiter(this, void 0, void 0, function () {
                var subject, text;
                return __generator(this, function (_a) {
                    subject = "Your Payslip for ".concat(month, " ").concat(year, " is Ready");
                    text = "\n      Dear ".concat(employeeName, ",\n      \n      Your payslip for ").concat(month, " ").concat(year, " is now available. \n      \n      You can download it from your employee portal or using the link below:\n      ").concat(downloadLink, "\n      \n      This link will expire in 24 hours.\n      \n      If you have any questions regarding your payslip, please contact HR.\n    ");
                    return [2 /*return*/, this.sendEmail(to, subject, text)];
                });
            });
        };
        return EmailService_1;
    }());
    __setFunctionName(_classThis, "EmailService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        EmailService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return EmailService = _classThis;
}();
exports.EmailService = EmailService;
