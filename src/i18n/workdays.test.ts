import { describe, expect, it } from 'vitest';
import { countWorkingDays } from './workdays';

const cal = (weekendDays: number[], holidays: string[] = []) => ({ weekendDays, holidays: new Set(holidays) });

// 2026-03-02 is a Monday.
describe('countWorkingDays (client estimate)', () => {
  it('matches the server for the same inputs', () => {
    expect(countWorkingDays('2026-03-02', '2026-03-06', cal([6, 0]))).toBe(5);
    expect(countWorkingDays('2026-03-02', '2026-03-15', cal([6, 0]))).toBe(10);
    expect(countWorkingDays('2026-03-01', '2026-03-07', cal([5, 6]))).toBe(5);
    expect(countWorkingDays('2026-03-02', '2026-03-08', cal([0]))).toBe(6);
    expect(countWorkingDays('2026-03-02', '2026-03-06', cal([6, 0], ['2026-03-04']))).toBe(4);
  });

  it('returns 0 for a reversed range and handles leap days and DST periods', () => {
    expect(countWorkingDays('2026-03-06', '2026-03-02', cal([]))).toBe(0);
    expect(countWorkingDays('2028-02-28', '2028-03-01', cal([]))).toBe(3);
    expect(countWorkingDays('2026-10-24', '2026-10-31', cal([]))).toBe(8);
  });
});
