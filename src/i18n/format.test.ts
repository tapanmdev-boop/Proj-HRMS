import { describe, expect, it } from 'vitest';
import { createFormatters } from './format';

// Non-breaking spaces and narrow no-break spaces vary between ICU versions; compare on normalized text.
const norm = (s: string) => s.normalize('NFKC').replace(/[\u00a0\u202f]/g, ' ');

describe('createFormatters', () => {
  it.each([
    ['en-US', 'USD', 1234.5, '$1,234.50'],
    ['de-DE', 'EUR', 1234.5, '1.234,50 €'],
    ['en-IN', 'INR', 1234567.5, '₹12,34,567.50'],
    ['ja-JP', 'JPY', 1234, '¥1,234'],
    ['fr-FR', 'EUR', 1234.5, '1 234,50 €'],
  ])('formats money for %s / %s', (locale, currency, amount, expected) => {
    const f = createFormatters({ locale, currency });
    expect(norm(f.money(amount))).toBe(norm(expected).replace(' ', ' '));
  });

  it('uses the currency argument over the organization default', () => {
    const f = createFormatters({ locale: 'en-US', currency: 'USD' });
    expect(f.money('10', 'EUR')).toContain('€');
  });

  it('accepts exact decimal strings from the API', () => {
    expect(createFormatters({ locale: 'en-US', currency: 'USD' }).money('5000.5')).toBe('$5,000.50');
  });

  it('shows a dash for missing or non-numeric amounts', () => {
    const f = createFormatters();
    expect(f.money(null)).toBe('—');
    expect(f.money(undefined)).toBe('—');
    expect(f.money('')).toBe('—');
    expect(f.money('abc')).toBe('—');
  });

  it('knows how many decimals a currency uses', () => {
    const f = createFormatters({ locale: 'en-US', currency: 'USD' });
    expect(f.currencyDigits('JPY')).toBe(0);
    expect(f.currencyDigits('USD')).toBe(2);
    expect(f.currencyDigits('KWD')).toBe(3);
  });

  it('never shifts a date-only value across timezones', () => {
    // 2026-01-15 must stay the 15th for organizations far east and far west of UTC.
    for (const timezone of ['Pacific/Kiritimati', 'Pacific/Pago_Pago', 'Asia/Kolkata', 'America/Los_Angeles']) {
      expect(createFormatters({ locale: 'en-US', timezone }).date('2026-01-15')).toBe('Jan 15, 2026');
    }
  });

  it('formats a timestamp in the organization timezone', () => {
    const instant = '2026-06-01T23:30:00Z';
    expect(createFormatters({ locale: 'en-US', timezone: 'UTC' }).dateTime(instant)).toContain('Jun 1, 2026');
    expect(createFormatters({ locale: 'en-US', timezone: 'Asia/Tokyo' }).dateTime(instant)).toContain('Jun 2, 2026');
  });

  it('formats dates in the organization language', () => {
    expect(createFormatters({ locale: 'de-DE' }).date('2026-03-05')).toBe('05.03.2026');
    expect(createFormatters({ locale: 'ja-JP' }).date('2026-03-05')).toBe('2026/03/05');
  });

  it('formats time of day in the organization timezone', () => {
    const instant = '2026-06-01T23:30:00Z';
    expect(createFormatters({ locale: 'en-GB', timezone: 'UTC' }).time(instant)).toBe('23:30');
    expect(createFormatters({ locale: 'en-GB', timezone: 'Asia/Kolkata' }).time(instant)).toBe('05:00');
    expect(createFormatters({ locale: 'en-GB', timezone: 'Asia/Kathmandu' }).time(instant)).toBe('05:15');
    expect(createFormatters().time(null)).toBe('—');
  });

  it('formats durations', () => {
    const f = createFormatters();
    expect(f.duration(450)).toBe('7h 30m');
    expect(f.duration(45)).toBe('45m');
    expect(f.duration(60)).toBe('1h 00m');
    expect(f.duration(0)).toBe('0m');
    expect(f.duration(null)).toBe('—');
  });

  it('falls back safely for an invalid locale, and for invalid dates', () => {
    const f = createFormatters({ locale: 'not a locale' });
    expect(f.locale).toBe('en');
    expect(f.date('nope')).toBe('—');
    expect(f.date(null)).toBe('—');
  });
});
