import { request } from './http';
import type { Page } from './types';

export type LeaveType = 'ANNUAL' | 'SICK' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export const LEAVE_TYPES: LeaveType[] = ['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'UNPAID', 'OTHER'];

export interface LeaveRequest {
  id: string;
  employee: { id: string; employeeId: string; name: string };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  /** Working days, exact decimal string, computed by the server. */
  days: string;
  reason: string;
  status: LeaveStatus;
  rejectionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface LeaveBalance {
  leaveType: LeaveType;
  /** null when the type has no policy (not balance-limited) */
  entitlement: string | null;
  used: string;
  pending: string;
  remaining: string | null;
}

export interface LeavePolicy {
  leaveType: LeaveType;
  daysPerYear: string;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface LeaveQuery {
  scope?: 'mine' | 'team' | 'all';
  status?: LeaveStatus;
  year?: number;
  page?: number;
  pageSize?: number;
}

export const leaveApi = {
  list: (query: LeaveQuery, signal?: AbortSignal) => request<Page<LeaveRequest>>('/leave', { query: { ...query }, signal }),
  create: (input: { startDate: string; endDate: string; leaveType: LeaveType; reason: string }) => request<LeaveRequest>('/leave', { method: 'POST', body: input }),
  approve: (id: string) => request<LeaveRequest>(`/leave/${id}/approve`, { method: 'POST' }),
  reject: (id: string, reason: string) => request<LeaveRequest>(`/leave/${id}/reject`, { method: 'POST', body: { reason } }),
  cancel: (id: string) => request<LeaveRequest>(`/leave/${id}/cancel`, { method: 'POST' }),
  balances: (year?: number) => request<{ year: number; employeeId: string; items: LeaveBalance[] }>('/leave/balances', { query: { year } }),
  policies: () => request<LeavePolicy[]>('/leave/policies'),
  setPolicy: (type: LeaveType, daysPerYear: string) => request<LeavePolicy>(`/leave/policies/${type}`, { method: 'PUT', body: { daysPerYear } }),
  removePolicy: (type: LeaveType) => request<{ removed: boolean }>(`/leave/policies/${type}`, { method: 'DELETE' }),
};

export const holidaysApi = {
  list: (year?: number) => request<Holiday[]>('/holidays', { query: { year } }),
  create: (input: { date: string; name: string }) => request<Holiday>('/holidays', { method: 'POST', body: input }),
  remove: (id: string) => request<{ deleted: boolean }>(`/holidays/${id}`, { method: 'DELETE' }),
};
