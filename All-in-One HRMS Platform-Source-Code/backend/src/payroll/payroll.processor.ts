import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
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

      // Generate a payslip for each employee
      for (const employee of employees) {
        // Calculate payslip values
        const baseSalary = employee.salary;
        const tax = baseSalary * 0.2; // Example tax calculation
        const netSalary = baseSalary - tax;

        // Create payslip record
        const payslip = await this.prisma.payslip.create({
          data: {
            employeeId: employee.id,
            tenantId,
            payPeriodStart: new Date(payPeriodStart),
            payPeriodEnd: new Date(payPeriodEnd),
            baseSalary,
            tax,
            netSalary,
            status: 'DRAFT',
          },
        });

        // Generate PDF payslip
        const pdfBuffer = await this.generatePayslipPDF(employee, payslip);
        
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

  private async generatePayslipPDF(employee, payslip): Promise<Buffer> {
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
        .text(`Period: ${payslip.payPeriodStart.toLocaleDateString()} to ${payslip.payPeriodEnd.toLocaleDateString()}`)
        .moveDown()
        .text('Earnings', { underline: true })
        .moveDown()
        .text(`Base Salary: $${payslip.baseSalary.toFixed(2)}`)
        .moveDown()
        .text('Deductions', { underline: true })
        .moveDown()
        .text(`Tax: $${payslip.tax.toFixed(2)}`)
        .moveDown()
        .text(`Net Salary: $${payslip.netSalary.toFixed(2)}`)
        .moveDown(2)
        .text('This is an automatically generated payslip. No signature required.');

      doc.end();
    });
  }
}
