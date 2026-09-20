import { request } from './http';
import type { Page } from './types';

export interface AttendanceRecord {
  id: string;
  employee: { id: string; employeeId: string; name: string };
  /** Organization-local calendar day */
  date: string;
  clockIn: string;
  clockOut: string | null;
  workedMinutes: number | null;
  open: boolean;
  source: 'WEB' | 'CORRECTION';
  note: string | null;
}

export interface TodayStatus {
  date: string;
  timezone: string;
  record: AttendanceRecord | null;
  clockedIn: boolean;
  /** An unfinished session from a previous day that needs a correction */
  stale: boolean;
}

export interface AttendanceSummary {
  employeeId: string;
  from: string;
  to: string;
  timezone: string;
  workingDays: number;
  presentDays: number;
  leaveDays: number;
  absentDays: number;
  restDayWork: number;
  openSessions: number;
  totalMinutes: number;
}

export type CorrectionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface AttendanceCorrection {
  id: string;
  employee: { id: string; employeeId: string; name: string };
  date: string;
  clockIn: string;
  clockOut: string;
  reason: string;
  status: CorrectionStatus;
  rejectionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
}

export interface AttendanceQuery {
  scope?: 'mine' | 'team' | 'all';
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const attendanceApi = {
  today: () => request<TodayStatus>('/attendance/today'),
  clockIn: (note?: string) => request<AttendanceRecord>('/attendance/clock-in', { method: 'POST', body: note ? { note } : {} }),
  clockOut: (note?: string) => request<AttendanceRecord>('/attendance/clock-out', { method: 'POST', body: note ? { note } : {} }),
  list: (query: AttendanceQuery, signal?: AbortSignal) => request<Page<AttendanceRecord> & { from: string; to: string }>('/attendance', { query: { ...query }, signal }),
  summary: (from: string, to: string, employeeId?: string) => request<AttendanceSummary>('/attendance/summary', { query: { from, to, employeeId } }),
  createCorrection: (input: { date: string; clockInTime: string; clockOutTime: string; reason: string }) =>
    request<AttendanceCorrection>('/attendance/corrections', { method: 'POST', body: input }),
  corrections: (query: { scope?: 'mine' | 'team' | 'all'; status?: CorrectionStatus; page?: number; pageSize?: number }, signal?: AbortSignal) =>
    request<Page<AttendanceCorrection>>('/attendance/corrections', { query: { ...query }, signal }),
  approve: (id: string) => request<AttendanceCorrection>(`/attendance/corrections/${id}/approve`, { method: 'POST' }),
  reject: (id: string, reason: string) => request<AttendanceCorrection>(`/attendance/corrections/${id}/reject`, { method: 'POST', body: { reason } }),
  cancel: (id: string) => request<AttendanceCorrection>(`/attendance/corrections/${id}/cancel`, { method: 'POST' }),
};
