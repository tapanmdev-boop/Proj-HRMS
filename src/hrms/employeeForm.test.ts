import { describe, expect, it } from 'vitest';
import { csvCell, emptyForm, employeesToCsv, toCreateInput, toUpdateInput, validateForm } from './employeeForm';
import type { Employee } from '../api/types';

const valid = () => ({
  ...emptyForm('EUR'),
  firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com', password: 'long-enough-1',
  position: 'Engineer', joinDate: '2026-01-15', salary: '5000.50',
});

describe('validateForm', () => {
  it('accepts a complete form', () => {
    expect(validateForm(valid(), 'create')).toBeNull();
  });

  it.each([
    ['missing name', { firstName: '' }],
    ['bad email', { email: 'nope' }],
    ['short password', { password: 'short' }],
    ['missing position', { position: '  ' }],
    ['missing join date', { joinDate: '' }],
    ['negative salary', { salary: '-5' }],
    ['non-numeric salary', { salary: 'abc' }],
    ['too many decimals', { salary: '1.23456' }],
    ['bad allowance', { allowances: { housing: 'lots' } }],
  ])('rejects %s', (_label, over) => {
    expect(validateForm({ ...valid(), ...over }, 'create')).not.toBeNull();
  });

  it('does not require email or password when editing', () => {
    expect(validateForm({ ...valid(), email: '', password: '' }, 'edit')).toBeNull();
  });
});

describe('request mapping', () => {
  it('keeps pay as exact strings and drops blank identifiers and zero allowances', () => {
    const input = toCreateInput(
      { ...valid(), identifiers: { national_id: ' X-1 ', tax_id: '' }, allowances: { housing: '1200.25', transport: '', other: '0' } },
      { housing: 'Housing' },
    );
    expect(input.salary).toBe('5000.50');
    expect(typeof input.salary).toBe('string');
    expect(input.identifiers).toEqual({ national_id: 'X-1' });
    expect(input.allowances).toEqual([{ code: 'housing', label: 'Housing', amount: '1200.25' }]);
    expect(input.departmentId).toBeUndefined();
  });

  it('sends null to clear a department or manager on update', () => {
    const update = toUpdateInput({ ...valid(), departmentId: '', managerId: '' }, {});
    expect(update.departmentId).toBeNull();
    expect(update.managerId).toBeNull();
    expect(update).not.toHaveProperty('email');
    expect(update).not.toHaveProperty('password');
  });
});

describe('CSV export', () => {
  it('neutralizes spreadsheet formula injection', () => {
    for (const evil of ['=HYPERLINK("http://x")', '+1+1', '-2+3', '@SUM(A1)']) {
      expect(csvCell(evil).startsWith(`"'`)).toBe(true);
    }
  });

  it('escapes quotes and keeps normal text intact', () => {
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('Ada')).toBe('"Ada"');
    expect(csvCell(null)).toBe('""');
  });

  it('exports only non-sensitive directory columns', () => {
    const row = {
      id: '1', employeeId: 'EMP-0001', userId: 'u', email: 'a@b.test', firstName: 'Ada', lastName: 'L', role: 'EMPLOYEE', position: 'Eng',
      department: { id: 'd', name: 'R&D' }, departmentId: 'd', managerId: null, joinDate: '2026-01-15', terminationDate: null, status: 'ACTIVE',
      salary: '9999', bankAccount: 'SECRET-IBAN', identifiers: { national_id: 'SECRET-ID' },
    } as Employee;
    const csv = employeesToCsv([row]);
    expect(csv).toContain('EMP-0001');
    expect(csv).not.toContain('9999');
    expect(csv).not.toContain('SECRET');
  });
});
