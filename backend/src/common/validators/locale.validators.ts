import { ValidationOptions, registerDecorator } from 'class-validator';

/**
 * Region-neutral validators backed by the runtime's ICU data, so any country, language,
 * timezone or currency the platform runtime knows about is accepted without a hardcoded list.
 */

// TypeScript 4.9 does not ship typings for these Node >= 18 APIs.
const intl = Intl as typeof Intl & {
  supportedValuesOf(key: 'currency'): string[];
  getCanonicalLocales(locales: string | string[]): string[];
};

const currencies = new Set<string>(intl.supportedValuesOf('currency'));
const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

// supportedValuesOf('timeZone') lists only canonical ICU names (e.g. "Asia/Calcutta"), which would
// reject valid IANA aliases such as "Asia/Kolkata". Constructing a formatter accepts every alias.
const IANA_SHAPE = /^(UTC|[A-Z][A-Za-z_]+(\/[A-Za-z0-9_+-]+){1,2})$/;

export const isIanaTimezone = (value: unknown): boolean => {
  if (typeof value !== 'string' || !IANA_SHAPE.test(value)) {
    return false;
  }
  try {
    new Intl.DateTimeFormat('en', { timeZone: value });
    return true;
  } catch {
    return false;
  }
};

export const isCurrencyCode = (value: unknown): boolean => typeof value === 'string' && /^[A-Z]{3}$/.test(value) && currencies.has(value);

export const isCountryCode = (value: unknown): boolean => {
  if (typeof value !== 'string' || !/^[A-Z]{2}$/.test(value)) {
    return false;
  }
  try {
    // For an unassigned code ICU echoes the input back.
    return regionNames.of(value) !== value;
  } catch {
    return false;
  }
};

export const isLocaleTag = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.length > 35) {
    return false;
  }
  try {
    return intl.getCanonicalLocales(value).length === 1;
  } catch {
    return false;
  }
};

function makeDecorator(name: string, message: string, check: (value: unknown) => boolean) {
  return (options?: ValidationOptions) => (object: object, propertyName: string) =>
    registerDecorator({
      name,
      target: object.constructor,
      propertyName,
      options: { message, ...options },
      validator: { validate: check },
    });
}

export const IsIanaTimezone = makeDecorator('isIanaTimezone', '$property must be a valid IANA timezone, e.g. "Asia/Kolkata" or "America/New_York"', isIanaTimezone);
export const IsCurrencyCode = makeDecorator('isCurrencyCode', '$property must be an upper-case ISO 4217 currency code, e.g. "USD" or "EUR"', isCurrencyCode);
export const IsCountryCode = makeDecorator('isCountryCode', '$property must be an upper-case ISO 3166-1 alpha-2 country code, e.g. "IN" or "DE"', isCountryCode);
export const IsLocaleTag = makeDecorator('isLocaleTag', '$property must be a valid BCP 47 language tag, e.g. "en", "fr-CA" or "ar"', isLocaleTag);
