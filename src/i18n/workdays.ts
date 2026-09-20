/**
 * Client-side working-day estimate, mirroring backend/src/leave/working-days.ts. It only powers the
 * "about N working days" hint while filling the form: the server computes the authoritative count.
 * Dates are calendar dates ('YYYY-MM-DD'), so the result never depends on the viewer's timezone.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

const parse = (iso: string): number => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

export interface WorkCalendar {
  /** 0 = Sunday ... 6 = Saturday */
  weekendDays: number[];
  holidays: ReadonlySet<string>;
}

export function countWorkingDays(startIso: string, endIso: string, calendar: WorkCalendar): number {
  const start = parse(startIso);
  const end = parse(endIso);
  let count = 0;
  for (let t = start; t <= end; t += DAY_MS) {
    const day = new Date(t);
    const iso = day.toISOString().slice(0, 10);
    if (!calendar.weekendDays.includes(day.getUTCDay()) && !calendar.holidays.has(iso)) count++;
  }
  return count;
}

export const WEEKDAY_INDEXES = [0, 1, 2, 3, 4, 5, 6] as const;
