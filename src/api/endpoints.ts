import { request } from './http';
import type {
  ApiUser, AuthResponse, Department, Employee, EmployeeInput, EmployeeUpdate, Page, SignupInput, Tenant,
} from './types';

export const authApi = {
  login: (input: { tenant?: string; email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: input, anonymous: true }),
  signup: (input: SignupInput) => request<AuthResponse>('/auth/signup', { method: 'POST', body: input, anonymous: true }),
  logout: (refreshToken: string) => request<{ success: boolean }>('/auth/logout', { method: 'POST', body: { refreshToken }, anonymous: true }),
  profile: () => request<ApiUser & { role: ApiUser['role'] }>('/auth/profile'),
};

export const tenantApi = {
  current: () => request<Tenant>('/tenant'),
  update: (input: Partial<Omit<Tenant, 'id' | 'name'>>) => request<Tenant>('/tenant', { method: 'PATCH', body: input }),
};

export interface EmployeeQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  departmentId?: string;
  status?: 'ACTIVE' | 'TERMINATED';
}

export const employeesApi = {
  list: (query: EmployeeQuery, signal?: AbortSignal) => request<Page<Employee>>('/employees', { query: { ...query }, signal }),
  get: (id: string) => request<Employee>(`/employees/${id}`),
  me: () => request<Employee>('/employees/me'),
  create: (input: EmployeeInput) => request<Employee>('/employees', { method: 'POST', body: input }),
  update: (id: string, input: EmployeeUpdate) => request<Employee>(`/employees/${id}`, { method: 'PATCH', body: input }),
  terminate: (id: string, terminationDate: string) => request<Employee>(`/employees/${id}/terminate`, { method: 'POST', body: { terminationDate } }),
};

export const departmentsApi = {
  list: () => request<Department[]>('/departments'),
  create: (input: { name: string; description?: string }) => request<Department>('/departments', { method: 'POST', body: input }),
};
