/**
 * Working-day arithmetic on calendar dates ('YYYY-MM-DD'), independent of any timezone.
 * Weekends are configured per organization (they differ by country: Sat/Sun, Fri/Sat, Sunday only, ...),
 * and holidays are explicit dates.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const parse = (iso: string): number => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export const toIsoDate = (ms: number): string => new Date(ms).toISOString().slice(0, 10);

export interface WorkCalendar {
  /** 0 = Sunday ... 6 = Saturday */
  weekendDays: number[];
  /** ISO dates that are not working days */
  holidays: ReadonlySet<string>;
}

export function isWorkingDay(iso: string, calendar: WorkCalendar): boolean {
  const weekday = new Date(parse(iso)).getUTCDay();
  return !calendar.weekendDays.includes(weekday) && !calendar.holidays.has(iso);
}

/** Inclusive count of working days between two dates. Returns 0 when end is before start. */
export function countWorkingDays(startIso: string, endIso: string, calendar: WorkCalendar): number {
  const start = parse(startIso);
  const end = parse(endIso);
  let count = 0;
  for (let t = start; t <= end; t += DAY_MS) {
    if (isWorkingDay(toIsoDate(t), calendar)) count++;
  }
  return count;
}

/** True when two inclusive date ranges share at least one day. */
export const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean => aStart <= bEnd && bStart <= aEnd;

export const yearOf = (iso: string): number => Number(iso.slice(0, 4));
