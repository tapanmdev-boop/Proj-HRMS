import { countWorkingDays, isWorkingDay, rangesOverlap, WorkCalendar, yearOf } from './working-days';

const cal = (weekendDays: number[], holidays: string[] = []): WorkCalendar => ({ weekendDays, holidays: new Set(holidays) });

describe('countWorkingDays', () => {
  // 2026-03-02 is a Monday.
  it('counts Monday to Friday with a Saturday/Sunday weekend', () => {
    expect(countWorkingDays('2026-03-02', '2026-03-06', cal([6, 0]))).toBe(5);
  });

  it('skips the weekend in a longer range', () => {
    expect(countWorkingDays('2026-03-02', '2026-03-15', cal([6, 0]))).toBe(10);
  });

  it('supports a Friday/Saturday weekend (e.g. Gulf countries)', () => {
    // Sun-Thu working: 2026-03-01 (Sun) .. 2026-03-07 (Sat)
    expect(countWorkingDays('2026-03-01', '2026-03-07', cal([5, 6]))).toBe(5);
    expect(isWorkingDay('2026-03-06', cal([5, 6]))).toBe(false); // Friday
    expect(isWorkingDay('2026-03-08', cal([5, 6]))).toBe(true); // Sunday
  });

  it('supports a Sunday-only weekend (six-day week)', () => {
    expect(countWorkingDays('2026-03-02', '2026-03-08', cal([0]))).toBe(6);
  });

  it('supports no weekend at all', () => {
    expect(countWorkingDays('2026-03-02', '2026-03-08', cal([]))).toBe(7);
  });

  it('excludes holidays, including ones that fall on a weekend only once', () => {
    expect(countWorkingDays('2026-03-02', '2026-03-06', cal([6, 0], ['2026-03-04']))).toBe(4);
    expect(countWorkingDays('2026-03-02', '2026-03-06', cal([6, 0], ['2026-03-07']))).toBe(5); // Saturday holiday changes nothing
  });

  it('returns 1 for a single working day and 0 for a single weekend day', () => {
    expect(countWorkingDays('2026-03-04', '2026-03-04', cal([6, 0]))).toBe(1);
    expect(countWorkingDays('2026-03-07', '2026-03-07', cal([6, 0]))).toBe(0);
  });

  it('returns 0 when the range is reversed', () => {
    expect(countWorkingDays('2026-03-06', '2026-03-02', cal([6, 0]))).toBe(0);
  });

  it('handles month, year and leap-day boundaries', () => {
    expect(countWorkingDays('2026-12-28', '2027-01-04', cal([6, 0]))).toBe(6);
    expect(countWorkingDays('2028-02-28', '2028-03-01', cal([]))).toBe(3); // 2028 is a leap year
    expect(countWorkingDays('2026-02-28', '2026-03-01', cal([]))).toBe(2); // 2026 is not
  });

  it('is unaffected by daylight-saving transitions (calendar arithmetic, not clock arithmetic)', () => {
    // DST changes in Mar/Oct in many countries; a 24h-step loop in local time would skip or repeat a day.
    expect(countWorkingDays('2026-03-25', '2026-03-31', cal([]))).toBe(7);
    expect(countWorkingDays('2026-10-24', '2026-10-31', cal([]))).toBe(8);
  });
});

describe('rangesOverlap', () => {
  it.each([
    ['2026-03-02', '2026-03-06', '2026-03-06', '2026-03-10', true], // share a boundary day
    ['2026-03-02', '2026-03-06', '2026-03-07', '2026-03-10', false],
    ['2026-03-02', '2026-03-10', '2026-03-04', '2026-03-05', true], // containment
    ['2026-03-04', '2026-03-05', '2026-03-02', '2026-03-10', true],
    ['2026-03-02', '2026-03-02', '2026-03-02', '2026-03-02', true],
  ])('%s..%s vs %s..%s = %s', (a, b, c, d, expected) => {
    expect(rangesOverlap(a, b, c, d)).toBe(expected);
  });
});

describe('yearOf', () => {
  it('reads the calendar year', () => {
    expect(yearOf('2026-12-31')).toBe(2026);
  });
});
