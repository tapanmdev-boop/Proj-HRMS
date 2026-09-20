/**
 * Live contract check: drives a running backend through the frontend's own API modules, so a
 * mismatch between what the UI expects and what the API returns fails here.
 *
 * Skipped unless LIVE_API=true. Run against a disposable database:
 *   LIVE_API=true VITE_API_URL=http://localhost:3010/api npx vitest run src/api/live.contract.test.ts
 */
import { afterAll, describe, expect, it } from 'vitest';
import { session } from './http';
import { authApi, departmentsApi, employeesApi, tenantApi } from './endpoints';
import { holidaysApi, leaveApi } from './leave';
import { attendanceApi } from './attendance';
import { countWorkingDays } from '../i18n/workdays';
import { toUser } from '../auth/authSlice';
import { createFormatters } from '../i18n/format';

const live = process.env.LIVE_API === 'true';
const slug = `live-${Date.now().toString(36)}`;

describe.skipIf(!live)('frontend ↔ backend contract', () => {
  afterAll(() => session.clear());

  it('signs up an organization in Germany and returns a session plus regional settings', async () => {
    const res = await authApi.signup({
      organizationName: 'Live Contract GmbH', organizationSlug: slug, email: `admin@${slug}.test`, password: 'Str0ng-Passw0rd!',
      firstName: 'Ada', lastName: 'Admin', countryCode: 'DE', baseCurrency: 'EUR', defaultTimezone: 'Europe/Berlin', defaultLocale: 'de-DE',
    });
    session.set(res);
    expect(toUser(res.user)).toMatchObject({ name: 'Ada Admin', role: 'admin' });

    const tenant = await tenantApi.current();
    expect(tenant).toMatchObject({ countryCode: 'DE', baseCurrency: 'EUR', defaultTimezone: 'Europe/Berlin', defaultLocale: 'de-DE' });
    expect(createFormatters({ locale: tenant.defaultLocale, currency: tenant.baseCurrency }).money('1234.5').replace(/\s/g, ' ')).toBe('1.234,50 €');
  });

  it('restores identity from the profile endpoint using the shape the UI maps', async () => {
    const profile = await authApi.profile();
    expect(toUser(profile)).toMatchObject({ email: `admin@${slug}.test`, role: 'admin' });
  });

  it('runs the employee lifecycle end to end', async () => {
    const dept = await departmentsApi.create({ name: 'Engineering' });
    const created = await employeesApi.create({
      email: `grace@${slug}.test`, password: 'Str0ng-Passw0rd!', firstName: 'Grace', lastName: 'Hopper', position: 'Engineer',
      joinDate: '2026-01-15', salary: '6100.50', currency: 'EUR', departmentId: dept.id,
      identifiers: { tax_id: '12345678901' }, allowances: [{ code: 'transport', label: 'Transport', amount: '100' }],
    });
    expect(created).toMatchObject({ employeeId: 'EMP-0001', status: 'ACTIVE', salary: '6100.5', department: { name: 'Engineering' } });

    const list = await employeesApi.list({ search: 'hopper', departmentId: dept.id, status: 'ACTIVE' });
    expect(list.items.map((e) => e.id)).toEqual([created.id]);
    expect(list.total).toBe(1);

    const updated = await employeesApi.update(created.id, { position: 'Principal Engineer', managerId: null as unknown as undefined });
    expect(updated.position).toBe('Principal Engineer');

    const ended = await employeesApi.terminate(created.id, '2026-02-01');
    expect(ended).toMatchObject({ status: 'TERMINATED', terminationDate: '2026-02-01' });
  });

  it('gives an employee the directory but not pay data, exactly as the UI assumes', async () => {
    const emp = await employeesApi.create({
      email: `plain@${slug}.test`, password: 'Str0ng-Passw0rd!', firstName: 'Plain', lastName: 'Person', position: 'Analyst', joinDate: '2026-01-15', salary: '4000',
    });
    const login = await authApi.login({ tenant: slug, email: emp.email, password: 'Str0ng-Passw0rd!' });
    session.set(login);
    const peer = await employeesApi.get(emp.id); // own record: sensitive fields present
    expect(peer.salary).toBe('4000');

    const directory = await employeesApi.list({ pageSize: 100 });
    const others = directory.items.filter((e) => e.id !== emp.id);
    expect(others.length).toBeGreaterThan(0);
    for (const e of others) {
      expect(e).not.toHaveProperty('salary');
      expect(e).not.toHaveProperty('bankAccount');
      expect(e).not.toHaveProperty('identifiers');
    }
    await expect(employeesApi.create({ email: 'x@x.test', password: 'Str0ng-Passw0rd!', firstName: 'X', lastName: 'Y', position: 'Z', joinDate: '2026-01-01', salary: '1' })).rejects.toMatchObject({ status: 403 });
  });

  it('runs leave end to end and agrees with the client-side working-day estimate', async () => {
    // Fresh admin session (test setup clears storage between tests), then a manager-report pair.
    session.set(await authApi.login({ tenant: slug, email: `admin@${slug}.test`, password: 'Str0ng-Passw0rd!' }));
    const manager = await employeesApi.create({ email: `mgr@${slug}.test`, password: 'Str0ng-Passw0rd!', firstName: 'Mia', lastName: 'Manager', role: 'MANAGER', position: 'Lead', joinDate: '2020-01-01', salary: '1' });
    const worker = await employeesApi.create({ email: `wrk@${slug}.test`, password: 'Str0ng-Passw0rd!', firstName: 'Will', lastName: 'Worker', position: 'Dev', joinDate: '2020-01-01', salary: '1', managerId: manager.id });

    // A Friday/Saturday weekend and a holiday: the UI's estimate must equal the server's count.
    await tenantApi.update({ weekendDays: [5, 6] });
    await holidaysApi.create({ date: '2099-03-03', name: 'Contract test day' });
    await leaveApi.setPolicy('ANNUAL', '10');

    session.set(await authApi.login({ tenant: slug, email: worker.email, password: 'Str0ng-Passw0rd!' }));
    const holidays = await holidaysApi.list(2099);
    const estimate = countWorkingDays('2099-03-01', '2099-03-07', { weekendDays: [5, 6], holidays: new Set(holidays.map((h) => h.date)) });
    const created = await leaveApi.create({ startDate: '2099-03-01', endDate: '2099-03-07', leaveType: 'ANNUAL', reason: 'Contract test' });
    expect(created.days).toBe(String(estimate));
    expect(created).toMatchObject({ status: 'PENDING', startDate: '2099-03-01', endDate: '2099-03-07' });

    const balance = await leaveApi.balances(2099);
    expect(balance.items.find((i) => i.leaveType === 'ANNUAL')).toMatchObject({ entitlement: '10', pending: String(estimate) });

    // The manager sees it in the team scope and approves it; the employee cannot.
    await expect(leaveApi.approve(created.id)).rejects.toMatchObject({ status: 403 });
    session.set(await authApi.login({ tenant: slug, email: manager.email, password: 'Str0ng-Passw0rd!' }));
    const team = await leaveApi.list({ scope: 'team', status: 'PENDING' });
    expect(team.items.map((l) => l.id)).toContain(created.id);
    const approved = await leaveApi.approve(created.id);
    expect(approved.status).toBe('APPROVED');
    await expect(leaveApi.approve(created.id)).rejects.toMatchObject({ status: 409 });
  });

  it('runs attendance end to end: clock, correct, approve, summarize', async () => {
    session.set(await authApi.login({ tenant: slug, email: `admin@${slug}.test`, password: 'Str0ng-Passw0rd!' }));
    await tenantApi.update({ defaultTimezone: 'Asia/Kolkata' });
    const manager = await employeesApi.create({ email: `amgr@${slug}.test`, password: 'Str0ng-Passw0rd!', firstName: 'Mo', lastName: 'Manager', role: 'MANAGER', position: 'Lead', joinDate: '2020-01-01', salary: '1' });
    const worker = await employeesApi.create({ email: `awrk@${slug}.test`, password: 'Str0ng-Passw0rd!', firstName: 'Wes', lastName: 'Worker', position: 'Dev', joinDate: '2020-01-01', salary: '1', managerId: manager.id });

    session.set(await authApi.login({ tenant: slug, email: worker.email, password: 'Str0ng-Passw0rd!' }));
    const idle = await attendanceApi.today();
    expect(idle).toMatchObject({ clockedIn: false, timezone: 'Asia/Kolkata', record: null });
    const clockedIn = await attendanceApi.clockIn('contract test');
    expect(clockedIn).toMatchObject({ open: true, date: idle.date });
    await expect(attendanceApi.clockIn()).rejects.toMatchObject({ status: 409 });
    const out = await attendanceApi.clockOut();
    expect(out.open).toBe(false);
    expect((await attendanceApi.today()).clockedIn).toBe(false);

    // Correction for a past day: the server converts local (Asia/Kolkata) times to exact instants.
    const day = new Date(Date.now() - 3 * 86400_000).toISOString().slice(0, 10);
    const correction = await attendanceApi.createCorrection({ date: day, clockInTime: '09:00', clockOutTime: '17:30', reason: 'Contract test' });
    expect(correction.status).toBe('PENDING');
    expect(new Date(correction.clockOut).getTime() - new Date(correction.clockIn).getTime()).toBe(8.5 * 3600_000);

    await expect(attendanceApi.approve(correction.id)).rejects.toMatchObject({ status: 403 });
    session.set(await authApi.login({ tenant: slug, email: manager.email, password: 'Str0ng-Passw0rd!' }));
    const pending = await attendanceApi.corrections({ scope: 'team', status: 'PENDING' });
    expect(pending.items.map((c) => c.id)).toContain(correction.id);
    expect((await attendanceApi.approve(correction.id)).status).toBe('APPROVED');

    const team = await attendanceApi.list({ scope: 'team', from: day, to: day });
    expect(team.items[0]).toMatchObject({ date: day, workedMinutes: 510, source: 'CORRECTION' });
    const summary = await attendanceApi.summary(day, day, worker.id);
    expect(summary.totalMinutes).toBe(510);
  });

  it('rotates the session with the stored refresh token and rejects a bad one', async () => {
    // Test setup clears storage between tests, so start from a fresh sign-in.
    session.set(await authApi.login({ tenant: slug, email: `admin@${slug}.test`, password: 'Str0ng-Passw0rd!' }));
    const before = localStorage.getItem('hrms.refreshToken');
    expect(before).toBeTruthy();
    const res = await fetch(`${process.env.VITE_API_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: before }) });
    expect(res.status).toBe(200);
    const next = await res.json();
    expect(next.refreshToken).not.toBe(before);
    const reuse = await fetch(`${process.env.VITE_API_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: before }) });
    expect(reuse.status).toBe(401);
  });
});
