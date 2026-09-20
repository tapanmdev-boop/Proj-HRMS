import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { addDays, localDate } from '../src/attendance/timezone';
import { PASSWORD, TestOrg, cleanup, createApp, login, uniqueSlug } from './helpers';

interface Person {
  id: string;
  userId: string;
  email: string;
  token: string;
}

describe('Attendance (e2e)', () => {
  let app: INestApplication;
  const slugs: string[] = [];
  const http = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
  const prisma = () => app.get(PrismaService);
  let seq = 0;

  const newOrg = async (prefix: string, extra: Record<string, unknown> = {}): Promise<TestOrg> => {
    const slug = uniqueSlug(prefix);
    const email = `admin@${slug}.test`;
    const res = await http()
      .post('/api/auth/signup')
      .send({ organizationName: `Org ${slug}`, organizationSlug: slug, email, password: PASSWORD, firstName: 'Ada', lastName: 'Admin', ...extra })
      .expect(201);
    slugs.push(slug);
    return { slug, tenantId: res.body.user.tenantId, adminToken: res.body.accessToken, adminId: res.body.user.id, adminEmail: email };
  };

  const person = async (o: TestOrg, role: 'EMPLOYEE' | 'MANAGER' | 'HR', managerId?: string): Promise<Person> => {
    const email = `${role.toLowerCase()}-${seq++}-${uniqueSlug('p')}@example.test`;
    const res = await http()
      .post('/api/employees')
      .set(auth(o.adminToken))
      .send({ email, password: PASSWORD, firstName: role, lastName: `N${seq}`, position: 'Staff', joinDate: '2020-01-01', salary: '1000', role, managerId })
      .expect(201);
    const token = (await login(app, o.slug, email).expect(200)).body.accessToken;
    return { id: res.body.id, userId: res.body.userId, email, token };
  };

  const zoneToday = (tz: string) => localDate(new Date(), tz);
  const correction = (who: Person, body: Record<string, unknown>) => http().post('/api/attendance/corrections').set(auth(who.token)).send(body);

  beforeAll(async () => {
    app = await createApp();
  });
  afterAll(async () => cleanup(app, slugs));

  describe('clocking in and out', () => {
    it('records the organization-local date, whatever the timezone', async () => {
      for (const tz of ['Pacific/Kiritimati', 'Pacific/Pago_Pago', 'Asia/Kolkata', 'America/New_York', 'UTC']) {
        const org = await newOrg('tz', { defaultTimezone: tz });
        const worker = await person(org, 'EMPLOYEE');
        const res = await http().post('/api/attendance/clock-in').set(auth(worker.token)).send({}).expect(201);
        expect(res.body.date).toBe(zoneToday(tz));
        expect(res.body).toMatchObject({ open: true, clockOut: null, workedMinutes: null, source: 'WEB' });
      }
    });

    it('supports the full day: in, status, out, worked time', async () => {
      const org = await newOrg('day');
      const w = await person(org, 'EMPLOYEE');
      const idle = await http().get('/api/attendance/today').set(auth(w.token)).expect(200);
      expect(idle.body).toMatchObject({ clockedIn: false, record: null, stale: false, timezone: 'UTC' });

      await http().post('/api/attendance/clock-in').set(auth(w.token)).send({ note: 'Office' }).expect(201);
      const working = await http().get('/api/attendance/today').set(auth(w.token)).expect(200);
      expect(working.body).toMatchObject({ clockedIn: true, record: { open: true, note: 'Office' } });

      const out = await http().post('/api/attendance/clock-out').set(auth(w.token)).send({}).expect(200);
      expect(out.body.open).toBe(false);
      expect(out.body.workedMinutes).toBeGreaterThanOrEqual(0);
      expect(new Date(out.body.clockOut).getTime()).toBeGreaterThanOrEqual(new Date(out.body.clockIn).getTime());
      const done = await http().get('/api/attendance/today').set(auth(w.token)).expect(200);
      expect(done.body).toMatchObject({ clockedIn: false, record: { open: false } });
    });

    it('rejects clocking in twice, clocking out when not in, and a second session on the same day', async () => {
      const org = await newOrg('twice');
      const w = await person(org, 'EMPLOYEE');
      await http().post('/api/attendance/clock-out').set(auth(w.token)).send({}).expect(409); // not clocked in
      await http().post('/api/attendance/clock-in').set(auth(w.token)).send({}).expect(201);
      await http().post('/api/attendance/clock-in').set(auth(w.token)).send({}).expect(409); // already in
      await http().post('/api/attendance/clock-out').set(auth(w.token)).send({}).expect(200);
      await http().post('/api/attendance/clock-out').set(auth(w.token)).send({}).expect(409); // already out
      const again = await http().post('/api/attendance/clock-in').set(auth(w.token)).send({}).expect(409);
      expect(again.body.message).toMatch(/already recorded for today/i);
    });

    it('creates exactly one record under simultaneous clock-ins (double-click, two devices)', async () => {
      const org = await newOrg('race');
      const w = await person(org, 'EMPLOYEE');
      const results = await Promise.all([1, 2, 3, 4, 5].map(() => http().post('/api/attendance/clock-in').set(auth(w.token)).send({})));
      expect(results.filter((r) => r.status === 201)).toHaveLength(1);
      expect(results.filter((r) => r.status === 409)).toHaveLength(4);
      expect(await prisma().attendance.count({ where: { employeeId: w.id } })).toBe(1);
    });

    it('treats a forgotten session as stale: it must be corrected, and the next day is not blocked', async () => {
      const org = await newOrg('stale');
      const w = await person(org, 'EMPLOYEE');
      const started = new Date(Date.now() - 26 * 3600_000);
      await prisma().attendance.create({ data: { employeeId: w.id, tenantId: org.tenantId, date: new Date(localDate(started, 'UTC')), clockIn: started } });

      const status = await http().get('/api/attendance/today').set(auth(w.token)).expect(200);
      expect(status.body).toMatchObject({ stale: true, clockedIn: false });
      const out = await http().post('/api/attendance/clock-out').set(auth(w.token)).send({}).expect(409);
      expect(out.body.message).toMatch(/correction/i);
      await http().post('/api/attendance/clock-in').set(auth(w.token)).send({}).expect(201); // a new session is allowed
    });

    it('needs an employee record, and refuses employees whose employment has ended', async () => {
      const org = await newOrg('rec');
      await http().post('/api/attendance/clock-in').set(auth(org.adminToken)).send({}).expect(403); // admin without employee record
      await http().get('/api/attendance/today').set(auth(org.adminToken)).expect(403);

      const w = await person(org, 'EMPLOYEE');
      await prisma().employee.update({ where: { id: w.id }, data: { terminationDate: new Date('2026-01-01') } });
      await prisma().user.update({ where: { id: w.userId }, data: { isActive: true } });
      await http().post('/api/attendance/clock-in').set(auth(w.token)).send({}).expect(403);
    });

    it('requires authentication and rejects unknown fields', async () => {
      await http().post('/api/attendance/clock-in').send({}).expect(401);
      const org = await newOrg('val');
      const w = await person(org, 'EMPLOYEE');
      await http().post('/api/attendance/clock-in').set(auth(w.token)).send({ clockIn: '2020-01-01T00:00:00Z' }).expect(400); // the client cannot set times
      await http().post('/api/attendance/clock-in').set(auth(w.token)).send({ note: 'x'.repeat(301) }).expect(400);
    });

    it('records audit events', async () => {
      const org = await newOrg('aud');
      const w = await person(org, 'EMPLOYEE');
      await http().post('/api/attendance/clock-in').set(auth(w.token)).send({}).expect(201);
      await http().post('/api/attendance/clock-out').set(auth(w.token)).send({}).expect(200);
      const actions = (await prisma().auditLog.findMany({ where: { tenantId: org.tenantId, actorId: w.userId } })).map((l) => l.action);
      expect(actions).toEqual(expect.arrayContaining(['attendance.clock_in', 'attendance.clock_out']));
    });
  });

  describe('viewing records', () => {
    let org: TestOrg;
    let other: TestOrg;
    let hr: Person;
    let mgr: Person;
    let mgr2: Person;
    let emp: Person;
    let peer: Person;

    beforeAll(async () => {
      org = await newOrg('view');
      other = await newOrg('viewo');
      hr = await person(org, 'HR');
      mgr = await person(org, 'MANAGER');
      mgr2 = await person(org, 'MANAGER');
      emp = await person(org, 'EMPLOYEE', mgr.id);
      peer = await person(org, 'EMPLOYEE', mgr.id);
      for (const p of [emp, peer, hr]) {
        await http().post('/api/attendance/clock-in').set(auth(p.token)).send({}).expect(201);
        await http().post('/api/attendance/clock-out').set(auth(p.token)).send({}).expect(200);
      }
    });

    it('shows employees only their own records by default', async () => {
      const res = await http().get('/api/attendance').set(auth(emp.token)).expect(200);
      expect(res.body.total).toBe(1);
      expect(res.body.items.every((r: { employee: { id: string } }) => r.employee.id === emp.id)).toBe(true);
    });

    it('shows managers their reports, and no one else\'s', async () => {
      const team = await http().get('/api/attendance?scope=team').set(auth(mgr.token)).expect(200);
      expect(team.body.items.map((r: { employee: { id: string } }) => r.employee.id).sort()).toEqual([emp.id, peer.id].sort());
      const none = await http().get('/api/attendance?scope=team').set(auth(mgr2.token)).expect(200);
      expect(none.body.total).toBe(0);
    });

    it('restricts team and organization views, and lets HR see everyone in their organization only', async () => {
      await http().get('/api/attendance?scope=team').set(auth(emp.token)).expect(403);
      await http().get('/api/attendance?scope=all').set(auth(mgr.token)).expect(403);
      const all = await http().get('/api/attendance?scope=all').set(auth(hr.token)).expect(200);
      expect(all.body.total).toBe(3);
      const foreign = await person(other, 'EMPLOYEE');
      await http().post('/api/attendance/clock-in').set(auth(foreign.token)).send({}).expect(201);
      const again = await http().get('/api/attendance?scope=all').set(auth(hr.token)).expect(200);
      expect(again.body.items.some((r: { employee: { id: string } }) => r.employee.id === foreign.id)).toBe(false);
    });

    it('validates ranges and paging', async () => {
      await http().get('/api/attendance?from=2026-03-10&to=2026-03-01').set(auth(hr.token)).expect(400);
      await http().get('/api/attendance?from=2020-01-01&to=2026-03-01&scope=all').set(auth(hr.token)).expect(400); // > 366 days
      await http().get('/api/attendance?from=tomorrow').set(auth(hr.token)).expect(400);
      await http().get('/api/attendance?pageSize=101').set(auth(hr.token)).expect(400);
      await http().get('/api/attendance?scope=galaxy').set(auth(hr.token)).expect(400);
      const paged = await http().get('/api/attendance?scope=all&pageSize=2&page=2').set(auth(hr.token)).expect(200);
      expect(paged.body.items).toHaveLength(1);
    });

    it('filters by date range', async () => {
      const today = zoneToday('UTC');
      const future = await http().get(`/api/attendance?scope=all&from=${addDays(today, 1)}&to=${addDays(today, 5)}`).set(auth(hr.token)).expect(200);
      expect(future.body.total).toBe(0);
      const withToday = await http().get(`/api/attendance?scope=all&from=${today}&to=${today}`).set(auth(hr.token)).expect(200);
      expect(withToday.body.total).toBe(3);
    });
  });

  describe('corrections', () => {
    let org: TestOrg;
    let other: TestOrg;
    let hr: Person;
    let mgr: Person;
    let mgr2: Person;
    let emp: Person;
    let peer: Person;
    const tz = 'Asia/Kolkata';
    const yesterday = () => addDays(zoneToday(tz), -1);

    beforeAll(async () => {
      org = await newOrg('corr', { defaultTimezone: tz });
      other = await newOrg('corro');
      hr = await person(org, 'HR');
      mgr = await person(org, 'MANAGER');
      mgr2 = await person(org, 'MANAGER');
      emp = await person(org, 'EMPLOYEE', mgr.id);
      peer = await person(org, 'EMPLOYEE', mgr.id);
    });

    it('converts local times in the organization timezone to exact instants and applies them on approval', async () => {
      const day = addDays(zoneToday(tz), -3);
      const req = await correction(emp, { date: day, clockInTime: '09:00', clockOutTime: '17:30', reason: 'Forgot to clock in' }).expect(201);
      expect(req.body).toMatchObject({ date: day, status: 'PENDING' });
      expect(req.body.clockIn).toBe(`${day}T03:30:00.000Z`); // 09:00 IST = 03:30 UTC
      expect(req.body.clockOut).toBe(`${day}T12:00:00.000Z`);
      expect(await prisma().attendance.count({ where: { employeeId: emp.id, date: new Date(day) } })).toBe(0); // nothing changes until approved

      const ok = await http().post(`/api/attendance/corrections/${req.body.id}/approve`).set(auth(mgr.token)).expect(200);
      expect(ok.body.status).toBe('APPROVED');
      const rec = await prisma().attendance.findUnique({ where: { employeeId_date: { employeeId: emp.id, date: new Date(day) } } });
      expect(rec).toMatchObject({ source: 'CORRECTION' });
      expect(rec.clockIn.toISOString()).toBe(`${day}T03:30:00.000Z`);
      const list = await http().get(`/api/attendance?from=${day}&to=${day}`).set(auth(emp.token)).expect(200);
      expect(list.body.items[0]).toMatchObject({ workedMinutes: 510, source: 'CORRECTION' });
    });

    it('replaces an existing record for that day', async () => {
      const day = addDays(zoneToday(tz), -4);
      await prisma().attendance.create({ data: { employeeId: peer.id, tenantId: org.tenantId, date: new Date(day), clockIn: new Date(`${day}T05:00:00Z`), clockOut: new Date(`${day}T06:00:00Z`) } });
      const req = await correction(peer, { date: day, clockInTime: '10:00', clockOutTime: '18:00', reason: 'Wrong times' }).expect(201);
      await http().post(`/api/attendance/corrections/${req.body.id}/approve`).set(auth(hr.token)).expect(200);
      const rows = await prisma().attendance.findMany({ where: { employeeId: peer.id, date: new Date(day) } });
      expect(rows).toHaveLength(1);
      expect(rows[0].clockOut.toISOString()).toBe(`${day}T12:30:00.000Z`);
    });

    it('supports overnight shifts (end time not later than start time is the next day)', async () => {
      const day = addDays(zoneToday(tz), -6);
      const req = await correction(emp, { date: day, clockInTime: '22:00', clockOutTime: '06:00', reason: 'Night shift' }).expect(201);
      expect(new Date(req.body.clockOut).getTime() - new Date(req.body.clockIn).getTime()).toBe(8 * 3600_000);
      expect(req.body.clockOut).toBe(`${addDays(day, 1)}T00:30:00.000Z`);
    });

    it.each([
      ['a future day', () => ({ date: addDays(zoneToday(tz), 1), clockInTime: '09:00', clockOutTime: '17:00' })],
      ['a day beyond the correction window', () => ({ date: addDays(zoneToday(tz), -40), clockInTime: '09:00', clockOutTime: '17:00' })],
      ['a malformed time', () => ({ date: yesterday(), clockInTime: '9am', clockOutTime: '17:00' })],
      ['an impossible time', () => ({ date: yesterday(), clockInTime: '25:00', clockOutTime: '17:00' })],
      ['a malformed date', () => ({ date: '02/03/2026', clockInTime: '09:00', clockOutTime: '17:00' })],
      ['a shift longer than 20 hours', () => ({ date: yesterday(), clockInTime: '01:00', clockOutTime: '00:00' })],
    ])('rejects %s', async (_l, body) => {
      const w = await person(org, 'EMPLOYEE');
      await correction(w, { ...body(), reason: 'x' }).expect(400);
    });

    it('rejects a missing reason and an overnight shift that ends in the future', async () => {
      const w = await person(org, 'EMPLOYEE');
      await correction(w, { date: yesterday(), clockInTime: '09:00', clockOutTime: '17:00', reason: '' }).expect(400);
      await correction(w, { date: zoneToday(tz), clockInTime: '23:00', clockOutTime: '05:00', reason: 'Future end' }).expect(400);
    });

    it('allows one pending correction per day, and a new one after it is decided', async () => {
      const w = await person(org, 'EMPLOYEE', mgr.id);
      const day = addDays(zoneToday(tz), -8);
      const first = await correction(w, { date: day, clockInTime: '09:00', clockOutTime: '17:00', reason: 'a' }).expect(201);
      await correction(w, { date: day, clockInTime: '10:00', clockOutTime: '18:00', reason: 'b' }).expect(409);
      await http().post(`/api/attendance/corrections/${first.body.id}/reject`).set(auth(mgr.token)).send({ reason: 'Not credible' }).expect(200);
      await correction(w, { date: day, clockInTime: '10:00', clockOutTime: '18:00', reason: 'b' }).expect(201);
    });

    it('lets only the manager, HR or an admin decide, and never your own', async () => {
      const w = await person(org, 'EMPLOYEE', mgr.id);
      const day = addDays(zoneToday(tz), -9);
      const req = (await correction(w, { date: day, clockInTime: '09:00', clockOutTime: '17:00', reason: 'r' }).expect(201)).body.id;
      await http().post(`/api/attendance/corrections/${req}/approve`).set(auth(w.token)).expect(403); // employee role
      await http().post(`/api/attendance/corrections/${req}/approve`).set(auth(peer.token)).expect(403);
      await http().post(`/api/attendance/corrections/${req}/approve`).set(auth(mgr2.token)).expect(403); // not their manager
      await http().post(`/api/attendance/corrections/${req}/approve`).set(auth(mgr.token)).expect(200);

      const own = (await correction(hr, { date: day, clockInTime: '09:00', clockOutTime: '17:00', reason: 'mine' }).expect(201)).body.id;
      await http().post(`/api/attendance/corrections/${own}/approve`).set(auth(hr.token)).expect(403); // HR cannot approve their own
      await http().post(`/api/attendance/corrections/${own}/approve`).set(auth(org.adminToken)).expect(200); // an admin can
    });

    it('requires a reason to reject, decides once, and lets one of several simultaneous approvers win', async () => {
      const w = await person(org, 'EMPLOYEE', mgr.id);
      const day = addDays(zoneToday(tz), -10);
      const id = (await correction(w, { date: day, clockInTime: '09:00', clockOutTime: '17:00', reason: 'r' }).expect(201)).body.id;
      await http().post(`/api/attendance/corrections/${id}/reject`).set(auth(mgr.token)).send({}).expect(400);
      const results = await Promise.all([mgr, hr, mgr, hr].map((p) => http().post(`/api/attendance/corrections/${id}/approve`).set(auth(p.token))));
      expect(results.filter((r) => r.status === 200)).toHaveLength(1);
      expect(results.filter((r) => r.status === 409)).toHaveLength(3);
      await http().post(`/api/attendance/corrections/${id}/reject`).set(auth(hr.token)).send({ reason: 'late' }).expect(409);
      expect(await prisma().attendance.count({ where: { employeeId: w.id, date: new Date(day) } })).toBe(1);
    });

    it('a rejected correction changes nothing', async () => {
      const w = await person(org, 'EMPLOYEE', mgr.id);
      const day = addDays(zoneToday(tz), -11);
      const id = (await correction(w, { date: day, clockInTime: '09:00', clockOutTime: '17:00', reason: 'r' }).expect(201)).body.id;
      const res = await http().post(`/api/attendance/corrections/${id}/reject`).set(auth(mgr.token)).send({ reason: 'No evidence' }).expect(200);
      expect(res.body).toMatchObject({ status: 'REJECTED', rejectionReason: 'No evidence' });
      expect(await prisma().attendance.count({ where: { employeeId: w.id } })).toBe(0);
    });

    it('lets the employee (or HR) cancel a pending correction, but not a decided one or someone else\'s', async () => {
      const w = await person(org, 'EMPLOYEE', mgr.id);
      const a = (await correction(w, { date: addDays(zoneToday(tz), -12), clockInTime: '09:00', clockOutTime: '17:00', reason: 'r' }).expect(201)).body.id;
      await http().post(`/api/attendance/corrections/${a}/cancel`).set(auth(peer.token)).expect(403);
      await http().post(`/api/attendance/corrections/${a}/cancel`).set(auth(w.token)).expect(200);
      await http().post(`/api/attendance/corrections/${a}/cancel`).set(auth(w.token)).expect(409);
      await http().post(`/api/attendance/corrections/${a}/approve`).set(auth(mgr.token)).expect(409); // cancelled requests cannot be approved

      const b = (await correction(w, { date: addDays(zoneToday(tz), -13), clockInTime: '09:00', clockOutTime: '17:00', reason: 'r' }).expect(201)).body.id;
      await http().post(`/api/attendance/corrections/${b}/approve`).set(auth(mgr.token)).expect(200);
      await http().post(`/api/attendance/corrections/${b}/cancel`).set(auth(w.token)).expect(409);
    });

    it('lists corrections by scope and status, isolated per organization', async () => {
      const mine = await http().get('/api/attendance/corrections').set(auth(emp.token)).expect(200);
      expect(mine.body.items.every((c: { employee: { id: string } }) => c.employee.id === emp.id)).toBe(true);
      const team = await http().get('/api/attendance/corrections?scope=team&status=PENDING').set(auth(mgr.token)).expect(200);
      expect(team.body.items.every((c: { status: string }) => c.status === 'PENDING')).toBe(true);
      await http().get('/api/attendance/corrections?scope=team').set(auth(emp.token)).expect(403);
      await http().get('/api/attendance/corrections?scope=all').set(auth(mgr.token)).expect(403);
      const all = await http().get('/api/attendance/corrections?scope=all&pageSize=100').set(auth(hr.token)).expect(200);
      expect(all.body.total).toBeGreaterThan(5);

      const foreign = await person(other, 'EMPLOYEE');
      const fid = (await correction(foreign, { date: addDays(zoneToday('UTC'), -2), clockInTime: '09:00', clockOutTime: '17:00', reason: 'r' }).expect(201)).body.id;
      await http().post(`/api/attendance/corrections/${fid}/approve`).set(auth(hr.token)).expect(404);
      await http().post(`/api/attendance/corrections/${fid}/cancel`).set(auth(hr.token)).expect(404);
      const again = await http().get('/api/attendance/corrections?scope=all&pageSize=100').set(auth(hr.token)).expect(200);
      expect(again.body.items.some((c: { id: string }) => c.id === fid)).toBe(false);
      await http().post('/api/attendance/corrections/not-a-uuid/approve').set(auth(hr.token)).expect(400);
    });

    it('records the decision in the audit trail', async () => {
      const w = await person(org, 'EMPLOYEE', mgr.id);
      const id = (await correction(w, { date: addDays(zoneToday(tz), -14), clockInTime: '09:00', clockOutTime: '17:00', reason: 'r' }).expect(201)).body.id;
      await http().post(`/api/attendance/corrections/${id}/approve`).set(auth(mgr.token)).expect(200);
      const actions = (await prisma().auditLog.findMany({ where: { tenantId: org.tenantId, entityId: id } })).map((l) => l.action);
      expect(actions).toEqual(expect.arrayContaining(['attendance.correction.request', 'attendance.correction.approve']));
    });
  });

  describe('summary', () => {
    let org: TestOrg;
    let mgr: Person;
    let emp: Person;
    let peer: Person;
    const at = (id: string, tenantId: string, date: string, inH: string, outH: string) =>
      prisma().attendance.create({ data: { employeeId: id, tenantId, date: new Date(date), clockIn: new Date(`${date}T${inH}:00Z`), clockOut: new Date(`${date}T${outH}:00Z`) } });

    beforeAll(async () => {
      org = await newOrg('sum');
      mgr = await person(org, 'MANAGER');
      emp = await person(org, 'EMPLOYEE', mgr.id);
      peer = await person(org, 'EMPLOYEE', mgr.id);
      // Week 1 (Mon 2026-03-02..Fri 03-06) and week 2 (03-09..03-13). Saturday/Sunday weekend.
      await prisma().holiday.create({ data: { tenantId: org.tenantId, date: new Date('2026-03-05'), name: 'Local holiday' } });
      for (const d of ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-11']) await at(emp.id, org.tenantId, d, '08:00', '16:00'); // 8h each
      await at(emp.id, org.tenantId, '2026-03-07', '10:00', '12:00'); // Saturday: worked on a rest day
      await prisma().leave.create({ data: { employeeId: emp.id, tenantId: org.tenantId, startDate: new Date('2026-03-06'), endDate: new Date('2026-03-06'), leaveType: 'ANNUAL', reason: 'x', status: 'APPROVED', days: 1 } });
      await prisma().leave.create({ data: { employeeId: emp.id, tenantId: org.tenantId, startDate: new Date('2026-03-09'), endDate: new Date('2026-03-09'), leaveType: 'SICK', reason: 'x', status: 'PENDING', days: 1 } }); // pending: does not count
    });

    it('counts present, leave, absent and rest-day days from the organization calendar', async () => {
      const res = await http().get(`/api/attendance/summary?from=2026-03-02&to=2026-03-13`).set(auth(emp.token)).expect(200);
      expect(res.body).toMatchObject({
        workingDays: 9, // 10 weekdays minus the holiday
        presentDays: 4, // Mar 2, 3, 4, 11
        leaveDays: 1, // Mar 6 (the pending leave on Mar 9 is not approved)
        absentDays: 4, // Mar 9, 10, 12, 13
        restDayWork: 1, // Saturday Mar 7
        totalMinutes: 4 * 480 + 120,
        openSessions: 0,
      });
      expect(res.body.presentDays + res.body.leaveDays + res.body.absentDays).toBe(res.body.workingDays);
    });

    it('does not mark future days as absent', async () => {
      const res = await http().get('/api/attendance/summary?from=2099-03-02&to=2099-03-06').set(auth(emp.token)).expect(200);
      expect(res.body).toMatchObject({ workingDays: 5, presentDays: 0, absentDays: 0 });
    });

    it('follows a different weekend configuration', async () => {
      const gulf = await newOrg('sumg', { weekendDays: [5, 6] });
      const w = await person(gulf, 'EMPLOYEE');
      // 2026-03-01 is a Sunday: Sun..Thu are working days.
      const res = await http().get('/api/attendance/summary?from=2026-03-01&to=2026-03-07').set(auth(w.token)).expect(200);
      expect(res.body).toMatchObject({ workingDays: 5, absentDays: 5 });
    });

    it('limits who can read whose summary', async () => {
      await http().get(`/api/attendance/summary?from=2026-03-02&to=2026-03-13&employeeId=${emp.id}`).set(auth(mgr.token)).expect(200);
      await http().get(`/api/attendance/summary?from=2026-03-02&to=2026-03-13&employeeId=${emp.id}`).set(auth(peer.token)).expect(403);
      await http().get(`/api/attendance/summary?from=2026-03-02&to=2026-03-13&employeeId=${emp.id}`).set(auth(emp.token)).expect(200);
      await http().get(`/api/attendance/summary?from=2026-03-02&to=2026-03-13&employeeId=${emp.id}`).set(auth(org.adminToken)).expect(200);
      const foreign = await newOrg('sumf');
      await http().get(`/api/attendance/summary?from=2026-03-02&to=2026-03-13&employeeId=${emp.id}`).set(auth(foreign.adminToken)).expect(404);
    });

    it('validates the range', async () => {
      await http().get('/api/attendance/summary?from=2026-03-13&to=2026-03-02').set(auth(emp.token)).expect(400);
      await http().get('/api/attendance/summary?from=2026-01-01&to=2026-12-31').set(auth(emp.token)).expect(400); // > 93 days
      await http().get('/api/attendance/summary?from=2026-03-02').set(auth(emp.token)).expect(400);
    });
  });
});
