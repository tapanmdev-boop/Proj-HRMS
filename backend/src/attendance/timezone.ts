/**
 * Timezone helpers built on the runtime's IANA data (Intl), so every zone is supported and
 * daylight-saving rules are never hand-coded.
 */

const formatterCache = new Map<string, Intl.DateTimeFormat>();

const partsFormatter = (timeZone: string) => {
  let f = formatterCache.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatterCache.set(timeZone, f);
  }
  return f;
};

/** Wall-clock parts of an instant in a zone. */
function wallClock(ms: number, timeZone: string) {
  const parts = Object.fromEntries(partsFormatter(timeZone).formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  return { year: +parts.year, month: +parts.month, day: +parts.day, hour: +parts.hour, minute: +parts.minute, second: +parts.second };
}

/** The organization-local calendar date (YYYY-MM-DD) of an instant. */
export function localDate(instant: Date | number, timeZone: string): string {
  const ms = typeof instant === 'number' ? instant : instant.getTime();
  const w = wallClock(ms, timeZone);
  return `${String(w.year).padStart(4, '0')}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`;
}

/** Offset of a zone from UTC at an instant, in minutes (positive east of UTC). */
export function offsetMinutes(instant: number, timeZone: string): number {
  const w = wallClock(instant, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  return Math.round((asUtc - Math.floor(instant / 1000) * 1000) / 60000);
}

/**
 * Converts a local wall-clock time ("2026-03-08", "09:30") in a zone to the instant it denotes.
 * - Ambiguous times (clocks go back) resolve to the first occurrence.
 * - Non-existent times (clocks go forward) resolve to the instant just after the gap.
 */
export function zonedToInstant(dateIso: string, time: string, timeZone: string): Date {
  const [y, mo, d] = dateIso.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);

  let guess = naive - offsetMinutes(naive, timeZone) * 60000;
  // The offset at the guess can differ from the offset at the naive time across a DST change: settle once.
  const settled = naive - offsetMinutes(guess, timeZone) * 60000;
  if (settled !== guess) {
    const check = wallClock(settled, timeZone);
    if (check.hour === h && check.minute === mi && localDate(settled, timeZone) === dateIso) {
      guess = settled;
    } else {
      // Ambiguous or non-existent: prefer the earlier valid instant that reads correctly, else the later one.
      const candidates = [guess, settled].sort((a, b) => a - b);
      const valid = candidates.find((c) => {
        const w = wallClock(c, timeZone);
        return w.hour === h && w.minute === mi && localDate(c, timeZone) === dateIso;
      });
      guess = valid ?? candidates[1];
    }
  }
  return new Date(guess);
}

/** Adds calendar days to an ISO date. */
export function addDays(dateIso: string, days: number): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
