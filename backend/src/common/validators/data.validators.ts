import { ValidationOptions, registerDecorator } from 'class-validator';

const make =
  (name: string, message: string, check: (value: unknown) => boolean) =>
  (options?: ValidationOptions) =>
  (object: object, propertyName: string) =>
    registerDecorator({ name, target: object.constructor, propertyName, options: { message, ...options }, validator: { validate: check } });

const isPlainObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Non-negative decimal string with up to 15 integer and 4 fractional digits (exact; never a JS float). */
export const MONEY_PATTERN = /^\d{1,15}(\.\d{1,4})?$/;

/**
 * Country-specific identifiers as a { type: value } map (e.g. { national_id: "..." }).
 * The platform stores them without assuming any country's format; format rules live in jurisdiction packs.
 */
export const IsIdentifierMap = make(
  'isIdentifierMap',
  '$property must be an object of up to 20 identifiers: keys like "national_id" (lowercase letters, digits, underscore) and text values of at most 64 characters',
  (value) => {
    if (!isPlainObject(value)) return false;
    const entries = Object.entries(value);
    return entries.length <= 20 && entries.every(([k, v]) => /^[a-z][a-z0-9_]{0,39}$/.test(k) && typeof v === 'string' && v.length <= 64);
  },
);

/** Pay components beyond base salary: [{ code, label?, amount }]. */
export const IsAllowanceList = make(
  'isAllowanceList',
  '$property must be a list of up to 30 items shaped { code, label?, amount } where amount is a non-negative decimal string',
  (value) => {
    if (!Array.isArray(value) || value.length > 30) return false;
    return value.every(
      (item) =>
        isPlainObject(item) &&
        typeof item.code === 'string' &&
        /^[a-z][a-z0-9_]{0,39}$/.test(item.code) &&
        (item.label === undefined || (typeof item.label === 'string' && item.label.length <= 80)) &&
        typeof item.amount === 'string' &&
        MONEY_PATTERN.test(item.amount) &&
        Object.keys(item).every((k) => ['code', 'label', 'amount'].includes(k)),
    );
  },
);
