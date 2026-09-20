// UAE WPS (Wage Protection System) Salary Information File generator.
//
// FLAG: the field order/delimiter/encoding below follows the general
// documented shape of a WPS SIF (header / employee-detail / trailer
// records, pipe-delimited). It has NOT been validated against a specific
// bank's actual WPS template or the Central Bank of UAE's current published
// spec — do that before ever submitting a real file. A malformed SIF delays
// real employee wages, which is a labour-law compliance problem, not just a
// bug. Treat this as a working draft, not a certified implementation.

export interface WpsEmployer {
  establishmentId: string; // MOHRE Establishment ID / WPS Employer Unique ID
  wpsAgentId: string; // Bank/exchange-house-assigned routing code for the employer
  employerIban: string;
}

export interface WpsEmployeePayment {
  laborCardNumber: string; // MOHRE labour card / WPS Employee Unique ID
  iban: string;
  bankRoutingCode: string;
  fixedAmount: number; // Basic + housing + transport
  variableAmount: number; // Overtime + bonus + other allowances
  daysWorked: number;
  leaveDays: number;
}

export interface WpsFileInput {
  employer: WpsEmployer;
  payPeriod: string; // e.g. "2026-08"
  payments: WpsEmployeePayment[];
}

const pad = (value: string | number, length: number) => String(value).padEnd(length, ' ').slice(0, length);

export function generateWpsSif({ employer, payPeriod, payments }: WpsFileInput): { fileName: string; content: string } {
  const totalAmount = payments.reduce((sum, p) => sum + p.fixedAmount + p.variableAmount, 0);
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');

  const header = [
    'EDR',
    employer.establishmentId,
    employer.wpsAgentId,
    today,
    payPeriod.replace('-', ''),
    String(payments.length),
    totalAmount.toFixed(2),
    'AED',
  ].join('|');

  const detailLines = payments.map((p) => [
    'SCR',
    pad(p.laborCardNumber, 16),
    pad(p.iban, 23),
    pad(p.bankRoutingCode, 11),
    p.fixedAmount.toFixed(2),
    p.variableAmount.toFixed(2),
    String(p.daysWorked),
    String(p.leaveDays),
    'AED',
  ].join('|'));

  const trailer = ['EOR', String(payments.length), totalAmount.toFixed(2)].join('|');

  const content = [header, ...detailLines, trailer].join('\n');
  const fileName = `WPS_${employer.establishmentId}_${payPeriod}.sif`;

  return { fileName, content };
}
