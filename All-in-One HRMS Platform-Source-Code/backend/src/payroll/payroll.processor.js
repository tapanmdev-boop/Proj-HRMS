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
exports.PayrollProcessor = void 0;
var bull_1 = require("@nestjs/bull");
var common_1 = require("@nestjs/common");
// @ts-ignore
var pdfkit_1 = require("pdfkit");
var PayrollProcessor = function () {
    var _classDecorators = [(0, bull_1.Processor)('payroll')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _handleGeneratePayslips_decorators;
    var PayrollProcessor = _classThis = /** @class */ (function () {
        function PayrollProcessor_1(prisma, documentsService) {
            this.prisma = (__runInitializers(this, _instanceExtraInitializers), prisma);
            this.documentsService = documentsService;
            this.logger = new common_1.Logger(PayrollProcessor.name);
        }
        PayrollProcessor_1.prototype.handleGeneratePayslips = function (job) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, tenantId, payPeriodStart, payPeriodEnd, employees, _i, employees_1, employee, baseSalary, tax, netSalary, payslip, pdfBuffer, fileName, key, uploadResult, error_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = job.data, tenantId = _a.tenantId, payPeriodStart = _a.payPeriodStart, payPeriodEnd = _a.payPeriodEnd;
                            this.logger.debug("Generating payslips for period: ".concat(payPeriodStart, " to ").concat(payPeriodEnd));
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 10, , 11]);
                            return [4 /*yield*/, this.prisma.employee.findMany({
                                    where: {
                                        tenantId: tenantId,
                                        terminationDate: null,
                                    },
                                    include: {
                                        user: true,
                                    },
                                })];
                        case 2:
                            employees = _b.sent();
                            _i = 0, employees_1 = employees;
                            _b.label = 3;
                        case 3:
                            if (!(_i < employees_1.length)) return [3 /*break*/, 9];
                            employee = employees_1[_i];
                            baseSalary = employee.salary;
                            tax = baseSalary * 0.2;
                            netSalary = baseSalary - tax;
                            return [4 /*yield*/, this.prisma.payslip.create({
                                    data: {
                                        employeeId: employee.id,
                                        tenantId: tenantId,
                                        payPeriodStart: new Date(payPeriodStart),
                                        payPeriodEnd: new Date(payPeriodEnd),
                                        baseSalary: baseSalary,
                                        tax: tax,
                                        netSalary: netSalary,
                                        status: 'DRAFT',
                                    },
                                })];
                        case 4:
                            payslip = _b.sent();
                            return [4 /*yield*/, this.generatePayslipPDF(employee, payslip)];
                        case 5:
                            pdfBuffer = _b.sent();
                            fileName = "payslip_".concat(employee.employeeId, "_").concat(payPeriodStart.replace(/-/g, ''), "_").concat(payPeriodEnd.replace(/-/g, ''), ".pdf");
                            key = "payslips/".concat(tenantId, "/").concat(employee.id, "/").concat(fileName);
                            return [4 /*yield*/, this.documentsService.uploadDocument(pdfBuffer, fileName, 'application/pdf', pdfBuffer.length, employee.id, 'PAYSLIP', tenantId, key)];
                        case 6:
                            uploadResult = _b.sent();
                            // Update payslip with document URL
                            return [4 /*yield*/, this.prisma.payslip.update({
                                    where: { id: payslip.id },
                                    data: {
                                        documentUrl: uploadResult.fileUrl,
                                        status: 'PUBLISHED',
                                    },
                                })];
                        case 7:
                            // Update payslip with document URL
                            _b.sent();
                            this.logger.debug("Generated payslip for employee ".concat(employee.employeeId));
                            _b.label = 8;
                        case 8:
                            _i++;
                            return [3 /*break*/, 3];
                        case 9: return [2 /*return*/, { success: true, count: employees.length }];
                        case 10:
                            error_1 = _b.sent();
                            this.logger.error("Failed to generate payslips: ".concat(error_1.message), error_1.stack);
                            throw error_1;
                        case 11: return [2 /*return*/];
                    }
                });
            });
        };
        PayrollProcessor_1.prototype.generatePayslipPDF = function (employee, payslip) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, new Promise(function (resolve) {
                            var chunks = [];
                            var doc = new pdfkit_1.default();
                            doc.on('data', function (chunk) {
                                chunks.push(chunk);
                            });
                            doc.on('end', function () {
                                var result = Buffer.concat(chunks);
                                resolve(result);
                            });
                            // Payslip formatting
                            doc
                                .fontSize(20)
                                .text('PAYSLIP', { align: 'center' })
                                .moveDown();
                            doc
                                .fontSize(12)
                                .text("Employee: ".concat(employee.user.firstName, " ").concat(employee.user.lastName))
                                .text("Employee ID: ".concat(employee.employeeId))
                                .text("Period: ".concat(payslip.payPeriodStart.toLocaleDateString(), " to ").concat(payslip.payPeriodEnd.toLocaleDateString()))
                                .moveDown()
                                .text('Earnings', { underline: true })
                                .moveDown()
                                .text("Base Salary: $".concat(payslip.baseSalary.toFixed(2)))
                                .moveDown()
                                .text('Deductions', { underline: true })
                                .moveDown()
                                .text("Tax: $".concat(payslip.tax.toFixed(2)))
                                .moveDown()
                                .text("Net Salary: $".concat(payslip.netSalary.toFixed(2)))
                                .moveDown(2)
                                .text('This is an automatically generated payslip. No signature required.');
                            doc.end();
                        })];
                });
            });
        };
        return PayrollProcessor_1;
    }());
    __setFunctionName(_classThis, "PayrollProcessor");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _handleGeneratePayslips_decorators = [(0, bull_1.Process)('generate-payslips')];
        __esDecorate(_classThis, null, _handleGeneratePayslips_decorators, { kind: "method", name: "handleGeneratePayslips", static: false, private: false, access: { has: function (obj) { return "handleGeneratePayslips" in obj; }, get: function (obj) { return obj.handleGeneratePayslips; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        PayrollProcessor = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return PayrollProcessor = _classThis;
}();
exports.PayrollProcessor = PayrollProcessor;
