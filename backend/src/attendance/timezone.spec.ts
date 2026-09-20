import { addDays, localDate, offsetMinutes, zonedToInstant } from './timezone';

const iso = (d: Date) => d.toISOString();

describe('localDate', () => {
  it.each([
    ['2026-06-01T23:30:00Z', 'UTC', '2026-06-01'],
    ['2026-06-01T23:30:00Z', 'Asia/Tokyo', '2026-06-02'],
    ['2026-06-01T23:30:00Z', 'Pacific/Kiritimati', '2026-06-02'], // UTC+14
    ['2026-06-01T05:30:00Z', 'Pacific/Pago_Pago', '2026-05-31'], // UTC-11
    ['2026-06-01T20:00:00Z', 'Asia/Kolkata', '2026-06-02'], // UTC+5:30
    ['2026-01-01T00:00:00Z', 'America/Los_Angeles', '2025-12-31'],
  ])('%s in %s is %s', (instant, zone, expected) => {
    expect(localDate(new Date(instant), zone)).toBe(expected);
  });
});

describe('offsetMinutes', () => {
  it.each([
    ['2026-01-15T12:00:00Z', 'UTC', 0],
    ['2026-01-15T12:00:00Z', 'Asia/Kolkata', 330],
    ['2026-01-15T12:00:00Z', 'Asia/Kathmandu', 345], // +5:45
    ['2026-01-15T12:00:00Z', 'Pacific/Kiritimati', 840],
    ['2026-01-15T12:00:00Z', 'America/New_York', -300],
    ['2026-07-15T12:00:00Z', 'America/New_York', -240], // daylight time
    ['2026-01-15T12:00:00Z', 'Australia/Lord_Howe', 660], // half-hour DST: +11 in January
    ['2026-07-15T12:00:00Z', 'Australia/Lord_Howe', 630], // +10:30 in July
  ])('%s in %s = %i', (instant, zone, expected) => {
    expect(offsetMinutes(new Date(instant).getTime(), zone)).toBe(expected);
  });
});

describe('zonedToInstant', () => {
  it.each([
    ['2026-01-15', '09:00', 'UTC', '2026-01-15T09:00:00.000Z'],
    ['2026-01-15', '09:00', 'Asia/Kolkata', '2026-01-15T03:30:00.000Z'],
    ['2026-01-15', '09:00', 'Asia/Kathmandu', '2026-01-15T03:15:00.000Z'],
    ['2026-01-15', '00:30', 'Pacific/Kiritimati', '2026-01-14T10:30:00.000Z'],
    ['2026-01-15', '23:30', 'Pacific/Pago_Pago', '2026-01-16T10:30:00.000Z'],
    ['2026-01-15', '09:00', 'America/New_York', '2026-01-15T14:00:00.000Z'],
    ['2026-07-15', '09:00', 'America/New_York', '2026-07-15T13:00:00.000Z'],
    ['2026-07-15', '09:00', 'Australia/Lord_Howe', '2026-07-14T22:30:00.000Z'],
  ])('%s %s in %s', (date, time, zone, expected) => {
    expect(iso(zonedToInstant(date, time, zone))).toBe(expected);
  });

  it('round-trips through localDate for many zones and dates', () => {
    const zones = ['UTC', 'Asia/Kolkata', 'Pacific/Kiritimati', 'Pacific/Pago_Pago', 'America/New_York', 'Europe/London', 'Australia/Sydney', 'America/Sao_Paulo', 'Asia/Kathmandu'];
    for (const zone of zones) {
      for (const date of ['2026-01-01', '2026-03-08', '2026-03-29', '2026-06-15', '2026-10-25', '2026-11-01', '2026-12-31']) {
        // Daytime hours never fall inside a DST gap in these zones, so the round-trip must be exact.
        for (const time of ['09:30', '12:00', '17:45']) {
          const instant = zonedToInstant(date, time, zone);
          expect(localDate(instant, zone)).toBe(date);
          const w = new Intl.DateTimeFormat('en-GB', { timeZone: zone, hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }).format(instant);
          expect(w).toBe(time);
        }
      }
    }
  });

  describe('daylight-saving transitions', () => {
    it('handles the spring-forward gap in New York (2026-03-08, 02:30 does not exist)', () => {
      // 01:30 EST = 06:30Z; 03:30 EDT = 07:30Z
      expect(iso(zonedToInstant('2026-03-08', '01:30', 'America/New_York'))).toBe('2026-03-08T06:30:00.000Z');
      expect(iso(zonedToInstant('2026-03-08', '03:30', 'America/New_York'))).toBe('2026-03-08T07:30:00.000Z');
      const gap = zonedToInstant('2026-03-08', '02:30', 'America/New_York');
      expect(gap.getTime()).toBeGreaterThanOrEqual(Date.parse('2026-03-08T06:30:00Z'));
      expect(gap.getTime()).toBeLessThanOrEqual(Date.parse('2026-03-08T07:30:00Z'));
    });

    it('resolves the fall-back ambiguity in New York to the first occurrence (2026-11-01, 01:30 happens twice)', () => {
      // First 01:30 is EDT (05:30Z); second is EST (06:30Z).
      expect(iso(zonedToInstant('2026-11-01', '01:30', 'America/New_York'))).toBe('2026-11-01T05:30:00.000Z');
    });

    it('handles Europe/London around the last Sunday of March and October', () => {
      expect(iso(zonedToInstant('2026-03-29', '00:30', 'Europe/London'))).toBe('2026-03-29T00:30:00.000Z'); // GMT
      expect(iso(zonedToInstant('2026-03-29', '02:00', 'Europe/London'))).toBe('2026-03-29T01:00:00.000Z'); // BST
      expect(iso(zonedToInstant('2026-10-25', '12:00', 'Europe/London'))).toBe('2026-10-25T12:00:00.000Z'); // GMT again
    });

    it('keeps a working day intact across DST in the southern hemisphere', () => {
      const start = zonedToInstant('2026-10-04', '09:00', 'Australia/Sydney'); // DST starts this day at 02:00
      expect(localDate(start, 'Australia/Sydney')).toBe('2026-10-04');
      expect(iso(start)).toBe('2026-10-03T22:00:00.000Z'); // UTC+11
    });
  });
});

describe('addDays', () => {
  it('moves across months, years and leap days', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});
