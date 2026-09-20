import type { Allowance, Employee, EmployeeInput, EmployeeUpdate } from '../api/types';

/** Exact decimal, matching the API contract (non-negative, up to 4 decimal places). */
export const MONEY_RE = /^\d{1,15}(\.\d{1,4})?$/;

export interface EmployeeFormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'HR';
  position: string;
  departmentId: string;
  managerId: string;
  joinDate: string;
  salary: string;
  currency: string;
  phoneNumber: string;
  bankAccount: string;
  identifiers: Record<string, string>;
  /** Amount per allowance code, as text while editing. */
  allowances: Record<string, string>;
}

export const emptyForm = (currency: string): EmployeeFormState => ({
  firstName: '', lastName: '', email: '', password: '', role: 'EMPLOYEE', position: '', departmentId: '', managerId: '',
  joinDate: '', salary: '', currency, phoneNumber: '', bankAccount: '', identifiers: {}, allowances: {},
});

export const formFromEmployee = (e: Employee, fallbackCurrency: string): EmployeeFormState => ({
  firstName: e.firstName,
  lastName: e.lastName,
  email: e.email,
  password: '',
  role: e.role === 'ADMIN' ? 'EMPLOYEE' : e.role,
  position: e.position,
  departmentId: e.departmentId ?? '',
  managerId: e.managerId ?? '',
  joinDate: e.joinDate ?? '',
  salary: e.salary ?? '',
  currency: e.currency ?? fallbackCurrency,
  phoneNumber: e.phoneNumber ?? '',
  bankAccount: e.bankAccount ?? '',
  identifiers: { ...(e.identifiers ?? {}) },
  allowances: Object.fromEntries((e.allowances ?? []).map((a) => [a.code, a.amount])),
});

/** Returns a message for the first problem, or null when the form can be submitted. */
export function validateForm(f: EmployeeFormState, mode: 'create' | 'edit'): string | null {
  if (!f.firstName.trim() || !f.lastName.trim()) return 'Enter the first and last name.';
  if (mode === 'create') {
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return 'Enter a valid email address.';
    if (f.password.length < 8) return 'The initial password must be at least 8 characters.';
  }
  if (!f.position.trim()) return 'Enter a position.';
  if (!f.joinDate) return 'Choose a join date.';
  if (!MONEY_RE.test(f.salary)) return 'Enter the salary as a positive number, up to 4 decimal places.';
  for (const [code, amount] of Object.entries(f.allowances)) {
    if (amount !== '' && !MONEY_RE.test(amount)) return `Allowance "${code}" must be a positive number.`;
  }
  return null;
}

const cleanIdentifiers = (ids: Record<string, string>) => Object.fromEntries(Object.entries(ids).map(([k, v]) => [k, v.trim()]).filter(([, v]) => v !== ''));

const toAllowances = (allowances: Record<string, string>, labels: Record<string, string>): Allowance[] =>
  Object.entries(allowances)
    .filter(([, amount]) => amount !== '' && Number(amount) > 0)
    .map(([code, amount]) => ({ code, label: labels[code], amount }));

export function toCreateInput(f: EmployeeFormState, labels: Record<string, string>): EmployeeInput {
  return {
    email: f.email.trim(),
    password: f.password,
    firstName: f.firstName.trim(),
    lastName: f.lastName.trim(),
    role: f.role,
    position: f.position.trim(),
    departmentId: f.departmentId || undefined,
    managerId: f.managerId || undefined,
    joinDate: f.joinDate,
    salary: f.salary,
    currency: f.currency || undefined,
    phoneNumber: f.phoneNumber.trim() || undefined,
    bankAccount: f.bankAccount.trim() || undefined,
    identifiers: cleanIdentifiers(f.identifiers),
    allowances: toAllowances(f.allowances, labels),
  };
}

export function toUpdateInput(f: EmployeeFormState, labels: Record<string, string>): EmployeeUpdate {
  return {
    firstName: f.firstName.trim(),
    lastName: f.lastName.trim(),
    position: f.position.trim(),
    // null clears the relation on the API.
    departmentId: (f.departmentId || null) as string | undefined,
    managerId: (f.managerId || null) as string | undefined,
    joinDate: f.joinDate,
    salary: f.salary,
    currency: f.currency || undefined,
    phoneNumber: f.phoneNumber.trim() || undefined,
    bankAccount: f.bankAccount.trim() || undefined,
    identifiers: cleanIdentifiers(f.identifiers),
    allowances: toAllowances(f.allowances, labels),
  };
}

/** Guards against spreadsheet formula injection when values start with = + - @ */
export const csvCell = (value: unknown): string => {
  const text = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
};

export function employeesToCsv(rows: Employee[]): string {
  const header = ['Employee ID', 'Name', 'Email', 'Position', 'Department', 'Status', 'Join date'];
  const lines = rows.map((e) => [e.employeeId, `${e.firstName} ${e.lastName}`, e.email, e.position, e.department?.name ?? '', e.status, e.joinDate ?? ''].map(csvCell).join(','));
  return [header.map(csvCell).join(','), ...lines].join('\n');
}
