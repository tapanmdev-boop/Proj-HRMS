import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsService } from '../documents/documents.service';
// @ts-ignore
import PDFDocument from 'pdfkit';

@Processor('payroll')
export class PayrollProcessor {
  private readonly logger = new Logger(PayrollProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Process('generate-payslips')
  async handleGeneratePayslips(job: Job) {
    const { tenantId, payPeriodStart, payPeriodEnd } = job.data;
    this.logger.debug(`Generating payslips for period: ${payPeriodStart} to ${payPeriodEnd}`);

    try {
      // Get all active employees for this tenant
      const employees = await this.prisma.employee.findMany({
        where: {
          tenantId,
          terminationDate: null,
        },
        include: {
          user: true,
        },
      });

      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { baseCurrency: true, defaultLocale: true },
      });
      if (!tenant) {
        throw new Error(`Tenant ${tenantId} not found`);
      }

      // Statutory tax is jurisdiction-specific and is not hardcoded here. Until the payroll
      // calculation engine exists, the caller must supply an explicit flat rate (default 0).
      const taxRate = new Prisma.Decimal(job.data.taxRate ?? 0);
      const periodStart = new Date(payPeriodStart);
      const periodEnd = new Date(payPeriodEnd);

      // Generate a payslip for each employee
      for (const employee of employees) {
        // Idempotent: a payslip for this employee and period is generated at most once.
        const existing = await this.prisma.payslip.findFirst({
          where: { employeeId: employee.id, payPeriodStart: periodStart, payPeriodEnd: periodEnd },
          select: { id: true },
        });
        if (existing) {
          continue;
        }

        const baseSalary = employee.salary;
        const tax = baseSalary.mul(taxRate).toDecimalPlaces(4);
        const netSalary = baseSalary.sub(tax);

        // Create payslip record
        const payslip = await this.prisma.payslip.create({
          data: {
            employeeId: employee.id,
            tenantId,
            payPeriodStart: periodStart,
            payPeriodEnd: periodEnd,
            currency: employee.currency ?? tenant.baseCurrency,
            baseSalary,
            tax,
            netSalary,
            status: 'DRAFT',
          },
        });

        // Generate PDF payslip
        const pdfBuffer = await this.generatePayslipPDF(employee, payslip, tenant.defaultLocale);
        
        // Upload to storage
        const fileName = `payslip_${employee.employeeId}_${payPeriodStart.replace(/-/g, '')}_${payPeriodEnd.replace(/-/g, '')}.pdf`;
        const key = `payslips/${tenantId}/${employee.id}/${fileName}`;
        
        const uploadResult = await this.documentsService.uploadDocument(
          pdfBuffer, 
          fileName, 
          'application/pdf', 
          pdfBuffer.length,
          employee.id,
          'PAYSLIP',
          tenantId,
          key
        );

        // Update payslip with document URL
        await this.prisma.payslip.update({
          where: { id: payslip.id },
          data: {
            documentUrl: uploadResult.fileUrl,
            status: 'PUBLISHED',
          },
        });
        
        this.logger.debug(`Generated payslip for employee ${employee.employeeId}`);
      }

      return { success: true, count: employees.length };
    } catch (error) {
      this.logger.error(`Failed to generate payslips: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async generatePayslipPDF(employee, payslip, locale: string): Promise<Buffer> {
    const money = (value: Prisma.Decimal) =>
      new Intl.NumberFormat(locale, { style: 'currency', currency: payslip.currency }).format(value.toNumber());
    const date = (value: Date) => value.toLocaleDateString(locale, { timeZone: 'UTC' });

    return new Promise((resolve) => {
      const chunks = [];
      const doc = new PDFDocument();

      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const result = Buffer.concat(chunks);
        resolve(result);
      });

      // Payslip formatting
      doc
        .fontSize(20)
        .text('PAYSLIP', { align: 'center' })
        .moveDown();

      doc
        .fontSize(12)
        .text(`Employee: ${employee.user.firstName} ${employee.user.lastName}`)
        .text(`Employee ID: ${employee.employeeId}`)
        .text(`Period: ${date(payslip.payPeriodStart)} to ${date(payslip.payPeriodEnd)}`)
        .moveDown()
        .text('Earnings', { underline: true })
        .moveDown()
        .text(`Base Salary: ${money(payslip.baseSalary)}`)
        .moveDown()
        .text('Deductions', { underline: true })
        .moveDown()
        .text(`Tax: ${money(payslip.tax)}`)
        .moveDown()
        .text(`Net Salary: ${money(payslip.netSalary)}`)
        .moveDown(2)
        .text('This is an automatically generated payslip. No signature required.');

      doc.end();
    });
  }
}
