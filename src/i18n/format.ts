import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectTenant } from '../auth/authSlice';

/**
 * Formatting driven entirely by the organization's settings (locale, timezone, base currency),
 * so every screen renders correctly for any country without per-country code.
 */
export interface Formatters {
  locale: string;
  timezone: string;
  currency: string;
  /** Exact decimal strings from the API are formatted without a lossy round-trip through float for display only. */
  money: (amount: string | number | null | undefined, currency?: string | null) => string;
  number: (value: number) => string;
  /** Calendar date such as "15 Jan 2026"; date-only strings (YYYY-MM-DD) never shift across timezones. */
  date: (value: string | Date | null | undefined) => string;
  dateTime: (value: string | Date | null | undefined) => string;
  /** Time of day in the organization timezone, e.g. "09:30" or "9:30 AM" depending on the locale. */
  time: (value: string | Date | null | undefined) => string;
  /** Minutes as a compact duration, e.g. 450 -> "7h 30m". */
  duration: (minutes: number | null | undefined) => string;
  /** Number of fraction digits the currency uses (JPY 0, USD 2, KWD 3). */
  currencyDigits: (currency?: string | null) => number;
}

const FALLBACK = { locale: 'en', timezone: 'UTC', currency: 'USD' };

export function createFormatters(settings: { locale?: string; timezone?: string; currency?: string } = {}): Formatters {
  const locale = settings.locale || FALLBACK.locale;
  const timezone = settings.timezone || FALLBACK.timezone;
  const baseCurrency = settings.currency || FALLBACK.currency;

  const safeLocale = (() => {
    try {
      return Intl.getCanonicalLocales(locale)[0];
    } catch {
      return FALLBACK.locale;
    }
  })();

  const isDateOnly = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

  return {
    locale: safeLocale,
    timezone,
    currency: baseCurrency,
    currencyDigits: (currency) =>
      new Intl.NumberFormat(safeLocale, { style: 'currency', currency: currency || baseCurrency }).resolvedOptions().maximumFractionDigits ?? 2,
    money: (amount, currency) => {
      if (amount === null || amount === undefined || amount === '') return '—';
      const value = typeof amount === 'number' ? amount : Number(amount);
      if (Number.isNaN(value)) return '—';
      return new Intl.NumberFormat(safeLocale, { style: 'currency', currency: currency || baseCurrency }).format(value);
    },
    number: (value) => new Intl.NumberFormat(safeLocale).format(value),
    date: (value) => {
      if (!value) return '—';
      const d = typeof value === 'string' && isDateOnly(value) ? new Date(`${value}T00:00:00Z`) : new Date(value);
      if (Number.isNaN(d.getTime())) return '—';
      // Date-only values are calendar days: format in UTC so they never shift by the viewer's offset.
      const zone = typeof value === 'string' && isDateOnly(value) ? 'UTC' : timezone;
      return new Intl.DateTimeFormat(safeLocale, { dateStyle: 'medium', timeZone: zone }).format(d);
    },
    time: (value) => {
      if (!value) return '—';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '—';
      return new Intl.DateTimeFormat(safeLocale, { timeStyle: 'short', timeZone: timezone }).format(d);
    },
    duration: (minutes) => {
      if (minutes === null || minutes === undefined || Number.isNaN(minutes)) return '—';
      const h = Math.floor(minutes / 60);
      const m = Math.round(minutes % 60);
      return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
    },
    dateTime: (value) => {
      if (!value) return '—';
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return '—';
      return new Intl.DateTimeFormat(safeLocale, { dateStyle: 'medium', timeStyle: 'short', timeZone: timezone }).format(d);
    },
  };
}

/** Formatters for the signed-in organization. */
export function useFormat(): Formatters {
  const tenant = useAppSelector(selectTenant);
  return useMemo(
    () => createFormatters({ locale: tenant?.defaultLocale, timezone: tenant?.defaultTimezone, currency: tenant?.baseCurrency }),
    [tenant?.defaultLocale, tenant?.defaultTimezone, tenant?.baseCurrency],
  );
}
