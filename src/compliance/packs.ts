/**
 * Jurisdiction packs.
 *
 * The platform core is country-neutral. Anything that depends on where an organization operates
 * (which personal identifiers HR records, statutory calculations, payroll file formats) lives in a
 * pack selected by the organization's country code. Organizations in countries without a pack get
 * the GENERIC pack, so nothing is ever blocked or mislabelled for lack of a country module.
 *
 * IMPORTANT: a pack's identifier formats are input hints for HR staff. Statutory calculations and
 * payroll exports are only offered where a pack implements them, and every such rule must be
 * validated for its jurisdiction and effective date before being relied on for real payroll.
 */

import { calculateGratuityForService } from './ae/gratuity';

export interface IdentifierField {
  /** Stored key in Employee.identifiers (lowercase snake_case). */
  key: string;
  label: string;
  placeholder?: string;
  /** Optional format hint. Violations warn in the UI; they do not change what the server stores. */
  pattern?: RegExp;
  patternHint?: string;
  /** Sensitive identifiers are masked in read-only views. */
  sensitive?: boolean;
}

export type TerminationReason = 'resignation' | 'termination' | 'end_of_contract' | 'for_cause' | 'other';

export interface EndOfServiceInput {
  monthlyBasePay: number;
  serviceYears: number;
  reason: TerminationReason;
}

export interface EndOfServiceResult {
  amount: number;
  /** Plain-language explanation shown next to the number so users can audit it. */
  explanation: string;
}

export interface JurisdictionPack {
  /** ISO 3166-1 alpha-2, or 'GENERIC'. */
  code: string;
  name: string;
  identifiers: IdentifierField[];
  /** Human labels for the pay components this jurisdiction commonly itemizes. */
  commonAllowances: { code: string; label: string }[];
  /** Optional statutory end-of-service calculation. Absent = configure the policy manually. */
  endOfService?: (input: EndOfServiceInput) => EndOfServiceResult;
  /** Optional payroll bank/statutory file export. */
  payrollExport?: { id: string; label: string; description: string };
}

const GENERIC: JurisdictionPack = {
  code: 'GENERIC',
  name: 'General',
  identifiers: [
    { key: 'national_id', label: 'National ID', sensitive: true },
    { key: 'tax_id', label: 'Tax ID', sensitive: true },
    { key: 'passport_number', label: 'Passport number', sensitive: true },
  ],
  commonAllowances: [
    { code: 'housing', label: 'Housing' },
    { code: 'transport', label: 'Transport' },
    { code: 'other', label: 'Other' },
  ],
};

const PACKS: Record<string, JurisdictionPack> = {
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    identifiers: [
      { key: 'emirates_id', label: 'Emirates ID', placeholder: '784-YYYY-NNNNNNN-N', pattern: /^784-\d{4}-\d{7}-\d$/, patternHint: 'Format 784-YYYY-NNNNNNN-N', sensitive: true },
      { key: 'labour_card', label: 'Labour card no.' },
      { key: 'iban', label: 'IBAN', pattern: /^AE\d{21}$/, patternHint: 'AE followed by 21 digits', sensitive: true },
    ],
    commonAllowances: [
      { code: 'housing', label: 'Housing' },
      { code: 'transport', label: 'Transport' },
      { code: 'other', label: 'Other' },
    ],
    payrollExport: { id: 'wps_sif', label: 'WPS SIF file', description: 'Wages Protection System salary information file' },
    endOfService: ({ monthlyBasePay, serviceYears, reason }) => {
      const type = reason === 'end_of_contract' ? 'contract_end' : reason === 'resignation' ? 'resignation' : reason === 'for_cause' ? 'termination_for_cause' : 'termination';
      const r = calculateGratuityForService(monthlyBasePay, serviceYears, type);
      return {
        amount: r.finalGratuity,
        explanation: r.eligible
          ? `UAE Labour Law No. 33/2021 Art. 51: 21 days of basic pay per year for the first 5 years and 30 days per year after, capped at 24 months of basic pay (${r.daysEntitled.toFixed(1)} days entitled). Verify against current MOHRE guidance before paying out.`
          : (r.reason ?? 'Not eligible under the UAE gratuity rules.'),
      };
    },
  },
  IN: {
    code: 'IN',
    name: 'India',
    identifiers: [
      { key: 'pan', label: 'PAN', placeholder: 'ABCDE1234F', pattern: /^[A-Z]{5}\d{4}[A-Z]$/, patternHint: '5 letters, 4 digits, 1 letter', sensitive: true },
      { key: 'aadhaar', label: 'Aadhaar', pattern: /^\d{12}$/, patternHint: '12 digits', sensitive: true },
      { key: 'uan', label: 'UAN (provident fund)', pattern: /^\d{12}$/, patternHint: '12 digits' },
    ],
    commonAllowances: [
      { code: 'hra', label: 'House rent allowance' },
      { code: 'special', label: 'Special allowance' },
      { code: 'other', label: 'Other' },
    ],
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    identifiers: [
      { key: 'ni_number', label: 'National Insurance number', placeholder: 'AB123456C', pattern: /^[A-CEGHJ-PR-TW-Z]{2}\d{6}[A-D]$/, patternHint: 'Two letters, six digits, one letter A–D', sensitive: true },
      { key: 'tax_code', label: 'Tax code' },
    ],
    commonAllowances: [{ code: 'other', label: 'Other' }],
  },
  US: {
    code: 'US',
    name: 'United States',
    identifiers: [
      { key: 'ssn', label: 'Social Security number', placeholder: 'NNN-NN-NNNN', pattern: /^\d{3}-?\d{2}-?\d{4}$/, patternHint: '9 digits', sensitive: true },
      { key: 'ein_state_id', label: 'State tax ID' },
    ],
    commonAllowances: [{ code: 'other', label: 'Other' }],
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    identifiers: [
      { key: 'tax_id', label: 'Steuer-ID', pattern: /^\d{11}$/, patternHint: '11 digits', sensitive: true },
      { key: 'social_security_number', label: 'Sozialversicherungsnummer', sensitive: true },
    ],
    commonAllowances: [{ code: 'other', label: 'Other' }],
  },
  SA: {
    code: 'SA',
    name: 'Saudi Arabia',
    identifiers: [
      { key: 'iqama_or_national_id', label: 'Iqama / National ID', pattern: /^\d{10}$/, patternHint: '10 digits', sensitive: true },
      { key: 'iban', label: 'IBAN', pattern: /^SA\d{22}$/, patternHint: 'SA followed by 22 digits', sensitive: true },
    ],
    commonAllowances: [
      { code: 'housing', label: 'Housing' },
      { code: 'transport', label: 'Transport' },
      { code: 'other', label: 'Other' },
    ],
  },
};

/** The pack for a country, or the neutral GENERIC pack when the country has none. */
export function packFor(countryCode: string | null | undefined): JurisdictionPack {
  return (countryCode && PACKS[countryCode.toUpperCase()]) || GENERIC;
}

export const registeredPacks = (): JurisdictionPack[] => Object.values(PACKS);

/** Checks a value against a field's format hint; returns a message when it looks wrong. */
export function identifierWarning(field: IdentifierField, value: string): string | null {
  if (!value || !field.pattern) return null;
  return field.pattern.test(value) ? null : (field.patternHint ?? 'Unexpected format');
}
