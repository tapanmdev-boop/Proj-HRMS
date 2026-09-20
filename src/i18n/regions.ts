/**
 * Region option lists built from the runtime's ICU data (Intl), so every country, currency and
 * timezone the platform supports is selectable without maintaining a hardcoded list.
 */

const intl = Intl as typeof Intl & {
  supportedValuesOf(key: 'timeZone' | 'currency'): string[];
};

export interface Option {
  value: string;
  label: string;
}

// Codes ICU exposes that are not countries a company registers in (reserved, grouped or unknown regions).
const NOT_COUNTRIES = new Set(['AC', 'CP', 'DG', 'EA', 'EU', 'EZ', 'IC', 'QO', 'TA', 'UN', 'XA', 'XB', 'ZZ']);

export function countryOptions(displayLocale = 'en'): Option[] {
  const names = new Intl.DisplayNames([displayLocale], { type: 'region' });
  const out: Option[] = [];
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      if (NOT_COUNTRIES.has(code)) continue;
      const label = names.of(code);
      if (label && label !== code) out.push({ value: code, label });
    }
  }
  return out.sort((x, y) => x.label.localeCompare(y.label, displayLocale));
}

export function currencyOptions(displayLocale = 'en'): Option[] {
  const names = new Intl.DisplayNames([displayLocale], { type: 'currency' });
  return intl
    .supportedValuesOf('currency')
    .map((code) => ({ value: code, label: `${code} — ${names.of(code) ?? code}` }))
    .sort((x, y) => x.value.localeCompare(y.value));
}

export const timezoneOptions = (): Option[] => ['UTC', ...intl.supportedValuesOf('timeZone').filter((z) => z !== 'UTC')].map((z) => ({ value: z, label: z.replace(/_/g, ' ') }));

// Widely used interface/document languages. Any valid BCP 47 tag is accepted by the API; this is a convenience list.
const LOCALES = [
  'en', 'en-GB', 'en-US', 'en-IN', 'en-AU', 'en-CA', 'es', 'es-MX', 'fr', 'fr-CA', 'de', 'it', 'pt', 'pt-BR', 'nl', 'sv', 'nb', 'da', 'fi', 'pl', 'cs', 'el', 'tr', 'ru', 'uk',
  'ar', 'ar-AE', 'ar-SA', 'he', 'fa', 'hi', 'bn', 'ur', 'ta', 'te', 'th', 'vi', 'id', 'ms', 'zh-CN', 'zh-TW', 'ja', 'ko', 'sw', 'af',
];

export function localeOptions(displayLocale = 'en'): Option[] {
  const names = new Intl.DisplayNames([displayLocale], { type: 'language', languageDisplay: 'standard' });
  return LOCALES.map((tag) => ({ value: tag, label: `${names.of(tag) ?? tag} (${tag})` })).sort((a, b) => a.label.localeCompare(b.label, displayLocale));
}

/** Best-effort defaults from the visitor's browser. Always editable. */
export function browserDefaults() {
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en';
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    /* keep UTC */
  }
  const region = (() => {
    try {
      return new Intl.Locale(locale).maximize().region ?? '';
    } catch {
      return '';
    }
  })();
  return { locale, timezone, countryCode: region };
}

// Currency most commonly used in a country. Only a starting suggestion; the user always chooses.
const CURRENCY_HINT: Record<string, string> = {
  AE: 'AED', AR: 'ARS', AT: 'EUR', AU: 'AUD', BD: 'BDT', BE: 'EUR', BR: 'BRL', CA: 'CAD', CH: 'CHF', CL: 'CLP', CN: 'CNY', CO: 'COP', CZ: 'CZK', DE: 'EUR', DK: 'DKK', EG: 'EGP',
  ES: 'EUR', FI: 'EUR', FR: 'EUR', GB: 'GBP', GR: 'EUR', HK: 'HKD', HU: 'HUF', ID: 'IDR', IE: 'EUR', IL: 'ILS', IN: 'INR', IT: 'EUR', JP: 'JPY', KE: 'KES', KR: 'KRW', KW: 'KWD',
  LK: 'LKR', MX: 'MXN', MY: 'MYR', NG: 'NGN', NL: 'EUR', NO: 'NOK', NZ: 'NZD', PE: 'PEN', PH: 'PHP', PK: 'PKR', PL: 'PLN', PT: 'EUR', QA: 'QAR', RO: 'RON', RU: 'RUB', SA: 'SAR',
  SE: 'SEK', SG: 'SGD', TH: 'THB', TR: 'TRY', TW: 'TWD', UA: 'UAH', US: 'USD', VN: 'VND', ZA: 'ZAR',
};

// Countries whose usual weekend is Friday and Saturday. Everywhere else defaults to Saturday and Sunday.
// This is only a starting suggestion: organizations set their own weekend (some use a single day, and
// public-sector and private-sector weekends can differ within a country).
const FRIDAY_SATURDAY_WEEKEND = new Set(['SA', 'KW', 'QA', 'BH', 'OM', 'EG', 'IL', 'JO', 'IQ', 'BD', 'DZ', 'YE', 'SY', 'LY']);

export const suggestedWeekend = (countryCode: string): number[] => (FRIDAY_SATURDAY_WEEKEND.has(countryCode) ? [5, 6] : [6, 0]);

export const suggestedCurrency = (countryCode: string): string | undefined => CURRENCY_HINT[countryCode];
