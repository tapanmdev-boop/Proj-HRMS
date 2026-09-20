import { describe, expect, it } from 'vitest';
import { identifierWarning, packFor, registeredPacks } from './packs';

describe('jurisdiction packs', () => {
  it('returns a specific pack for a supported country, case-insensitively', () => {
    expect(packFor('AE').name).toBe('United Arab Emirates');
    expect(packFor('in').code).toBe('IN');
  });

  it.each([null, undefined, '', 'ZZ', 'NP', 'BR'])('falls back to the neutral pack for %s', (code) => {
    const pack = packFor(code as string | null | undefined);
    expect(pack.code).toBe('GENERIC');
    expect(pack.identifiers.length).toBeGreaterThan(0);
    expect(pack.endOfService).toBeUndefined();
    expect(pack.payrollExport).toBeUndefined();
  });

  it('only offers a payroll export or statutory calculation where a pack implements one', () => {
    const withExport = registeredPacks().filter((p) => p.payrollExport).map((p) => p.code);
    const withEos = registeredPacks().filter((p) => p.endOfService).map((p) => p.code);
    expect(withExport).toEqual(['AE']);
    expect(withEos).toEqual(['AE']);
  });

  it('uses unique, storage-safe identifier keys within each pack', () => {
    for (const pack of [...registeredPacks(), packFor(null)]) {
      const keys = pack.identifiers.map((i) => i.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const key of keys) expect(key).toMatch(/^[a-z][a-z0-9_]{0,39}$/); // matches the API contract
    }
  });

  it.each([
    ['AE', 'emirates_id', '784-1990-1234567-1', true],
    ['AE', 'emirates_id', '123', false],
    ['IN', 'pan', 'ABCDE1234F', true],
    ['IN', 'pan', 'abcde1234f', false],
    ['GB', 'ni_number', 'AB123456C', true],
    ['GB', 'ni_number', 'QQ123456Z', false],
    ['US', 'ssn', '123-45-6789', true],
    ['US', 'ssn', '12-345-6789', false],
  ])('%s %s "%s" is valid: %s', (country, key, value, valid) => {
    const field = packFor(country).identifiers.find((i) => i.key === key)!;
    expect(identifierWarning(field, value) === null).toBe(valid);
  });

  it('does not warn about empty optional fields', () => {
    const field = packFor('AE').identifiers[0];
    expect(identifierWarning(field, '')).toBeNull();
  });

  describe('UAE end-of-service', () => {
    const eos = packFor('AE').endOfService!;

    it('gives no entitlement below one year of service', () => {
      expect(eos({ monthlyBasePay: 10000, serviceYears: 0.5, reason: 'resignation' }).amount).toBe(0);
    });

    it('pays 21 days per year for the first five years', () => {
      // 3 years * 21 days * (12000 / 30) = 25,200
      expect(eos({ monthlyBasePay: 12000, serviceYears: 3, reason: 'termination' }).amount).toBeCloseTo(25200, 0);
    });

    it('pays 30 days per year after five years', () => {
      // 5*21 + 2*30 = 165 days * 400 = 66,000
      expect(eos({ monthlyBasePay: 12000, serviceYears: 7, reason: 'termination' }).amount).toBeCloseTo(66000, 0);
    });

    it('caps at 24 months of basic pay', () => {
      expect(eos({ monthlyBasePay: 1000, serviceYears: 40, reason: 'end_of_contract' }).amount).toBe(24000);
    });

    it('pays nothing for termination for cause and explains why', () => {
      const r = eos({ monthlyBasePay: 10000, serviceYears: 10, reason: 'for_cause' });
      expect(r.amount).toBe(0);
      expect(r.explanation.length).toBeGreaterThan(10);
    });
  });
});
