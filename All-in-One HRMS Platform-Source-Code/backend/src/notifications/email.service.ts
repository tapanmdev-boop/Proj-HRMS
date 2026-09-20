import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    SendGrid.setApiKey(this.configService.get('email.sendgridApiKey'));
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<boolean> {
    const msg = {
      to,
      from: this.configService.get('email.from'),
      subject,
      text,
      html: html || text,
    };
    
    try {
      await SendGrid.send(msg);
      this.logger.log(`Email sent to: ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      return false;
    }
  }

  async sendTemplateEmail(
    to: string,
    templateId: string,
    dynamicTemplateData: any,
  ): Promise<boolean> {
    const msg = {
      to,
      from: this.configService.get('email.from'),
      templateId,
      dynamicTemplateData,
    };

    try {
      await SendGrid.send(msg);
      this.logger.log(`Template email sent to: ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send template email to ${to}`, error.stack);
      return false;
    }
  }

  // Templates for common notifications
  async sendLeaveRequestNotification(
    to: string,
    employeeName: string,
    startDate: string,
    endDate: string,
    leaveType: string,
    reason: string,
  ): Promise<boolean> {
    const subject = `Leave Request from ${employeeName}`;
    const text = `
      A new leave request has been submitted:
      
      Employee: ${employeeName}
      Leave Type: ${leaveType}
      Start Date: ${startDate}
      End Date: ${endDate}
      Reason: ${reason}
      
      Please review this request at your earliest convenience.
    `;

    return this.sendEmail(to, subject, text);
  }

  async sendLeaveStatusNotification(
    to: string,
    employeeName: string,
    status: string,
    startDate: string,
    endDate: string,
    leaveType: string,
    reason?: string,
  ): Promise<boolean> {
    const subject = `Leave Request ${status}`;
    const text = `
      Dear ${employeeName},
      
      Your leave request has been ${status.toLowerCase()}:
      
      Leave Type: ${leaveType}
      Start Date: ${startDate}
      End Date: ${endDate}
      ${reason ? `Reason: ${reason}` : ''}
      
      If you have any questions, please contact HR.
    `;

    return this.sendEmail(to, subject, text);
  }

  async sendPayslipNotification(
    to: string,
    employeeName: string,
    month: string,
    year: string,
    downloadLink: string,
  ): Promise<boolean> {
    const subject = `Your Payslip for ${month} ${year} is Ready`;
    const text = `
      Dear ${employeeName},
      
      Your payslip for ${month} ${year} is now available. 
      
      You can download it from your employee portal or using the link below:
      ${downloadLink}
      
      This link will expire in 24 hours.
      
      If you have any questions regarding your payslip, please contact HR.
    `;

    return this.sendEmail(to, subject, text);
  }
}
