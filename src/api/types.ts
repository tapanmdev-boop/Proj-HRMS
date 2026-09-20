// Contracts of the HRMS API (see backend/src/**/dto).

export type ApiRole = 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';

export interface ApiUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: ApiRole;
  tenantId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: ApiUser;
}

export interface Tenant {
  id: string;
  name: string;
  displayName: string;
  countryCode: string | null;
  defaultLocale: string;
  defaultTimezone: string;
  baseCurrency: string;
  weekStartsOn: number;
  fiscalYearStartMonth: number;
}

export interface SignupInput {
  organizationName: string;
  organizationSlug: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  countryCode?: string;
  defaultLocale?: string;
  defaultTimezone?: string;
  baseCurrency?: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Allowance {
  code: string;
  label?: string;
  amount: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  employeeCount: number;
}

export interface Employee {
  id: string;
  employeeId: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: ApiRole;
  position: string;
  department: { id: string; name: string } | null;
  departmentId: string | null;
  managerId: string | null;
  joinDate: string | null;
  terminationDate: string | null;
  status: 'ACTIVE' | 'TERMINATED';
  // Present only for Admin/HR and the employee themself:
  dateOfBirth?: string | null;
  gender?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  bankAccount?: string | null;
  salary?: string | null;
  currency?: string | null;
  identifiers?: Record<string, string>;
  allowances?: Allowance[];
}

export interface EmployeeInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'EMPLOYEE' | 'MANAGER' | 'HR';
  employeeId?: string;
  position: string;
  departmentId?: string | null;
  managerId?: string | null;
  joinDate: string;
  salary: string;
  currency?: string;
  bankAccount?: string;
  phoneNumber?: string;
  identifiers?: Record<string, string>;
  allowances?: Allowance[];
}

export type EmployeeUpdate = Partial<Omit<EmployeeInput, 'email' | 'password' | 'role'>>;
