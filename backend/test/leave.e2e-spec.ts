import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { PASSWORD, TestOrg, cleanup, createApp, login, signupOrg, uniqueSlug } from './helpers';

/** First Monday on or after March 1 of the given year (ISO date). */
const mondayOf = (year: number, addDays = 0) => {
  const d = new Date(Date.UTC(year, 2, 1));
  while (d.getUTCDay() !== 1) d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCDate(d.getUTCDate() + addDays);
  return d.toISOString().slice(0, 10);
};

interface Person {
  id: string;
  userId: string;
  email: string;
  token: string;
}

describe('Leave, holidays and balances (e2e)', () => {
  let app: INestApplication;
  let org: TestOrg;
  let other: TestOrg;
  let hr: Person;
  let mgr: Person;
  let mgr2: Person;
  let emp: Person;
  let peer: Person;
  const slugs: string[] = [];
  const http = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
  const prisma = () => app.get(PrismaService);
  let seq = 0;

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

  const request_ = (who: Person, start: string, end: string, extra: Record<string, unknown> = {}) =>
    http().post('/api/leave').set(auth(who.token)).send({ startDate: start, endDate: end, leaveType: 'ANNUAL', reason: 'Trip', ...extra });

  beforeAll(async () => {
    app = await createApp();
    org = await signupOrg(app, 'lv');
    other = await signupOrg(app, 'lvo');
    slugs.push(org.slug, other.slug);
    hr = await person(org, 'HR');
    mgr = await person(org, 'MANAGER');
    mgr2 = await person(org, 'MANAGER');
    emp = await person(org, 'EMPLOYEE', mgr.id);
    peer = await person(org, 'EMPLOYEE', mgr.id);
  });
  afterAll(async () => cleanup(app, slugs));

  describe('working-day computation', () => {
    it('counts weekdays and ignores the weekend (default Saturday/Sunday)', async () => {
      const y = 2040;
      const week = await request_(emp, mondayOf(y), mondayOf(y, 4)).expect(201);
      expect(week.body).toMatchObject({ days: '5', status: 'PENDING', leaveType: 'ANNUAL' });
      const withWeekend = await request_(emp, mondayOf(y, 7), mondayOf(y, 13)).expect(201); // Mon..Sun
      expect(withWeekend.body.days).toBe('5');
    });

    it('rejects a request that has no working days', async () => {
      await request_(emp, mondayOf(2041, 5), mondayOf(2041, 6)).expect(400); // Sat..Sun
    });

    it('excludes organization holidays', async () => {
      const y = 2042;
      await http().post('/api/holidays').set(auth(hr.token)).send({ date: mondayOf(y, 2), name: 'Founders Day' }).expect(201);
      const res = await request_(emp, mondayOf(y), mondayOf(y, 4)).expect(201);
      expect(res.body.days).toBe('4');
    });

    it('follows a Friday/Saturday weekend when the organization configures one', async () => {
      const gulf = await signupOrg(app, 'gulf');
      slugs.push(gulf.slug);
      await http().patch('/api/tenant').set(auth(gulf.adminToken)).send({ weekendDays: [5, 6] }).expect(200);
      const worker = await person(gulf, 'EMPLOYEE');
      const y = 2043;
      const sunday = mondayOf(y, -1);
      // Sunday..Saturday: Sun-Thu are working days.
      const res = await request_(worker, sunday, mondayOf(y, 5)).expect(201);
      expect(res.body.days).toBe('5');
    });

    it('a six-day working week (Sunday only off) is supported', async () => {
      const six = await signupOrg(app, 'six');
      slugs.push(six.slug);
      await http().patch('/api/tenant').set(auth(six.adminToken)).send({ weekendDays: [0] }).expect(200);
      const worker = await person(six, 'EMPLOYEE');
      const res = await request_(worker, mondayOf(2044), mondayOf(2044, 6)).expect(201);
      expect(res.body.days).toBe('6');
    });

    it('validates weekend settings', async () => {
      await http().patch('/api/tenant').set(auth(org.adminToken)).send({ weekendDays: [0, 1, 2, 3, 4, 5, 6] }).expect(400); // no working day
      await http().patch('/api/tenant').set(auth(org.adminToken)).send({ weekendDays: [7] }).expect(400);
      await http().patch('/api/tenant').set(auth(org.adminToken)).send({ weekendDays: [1, 1] }).expect(400);
    });
  });

  describe('request validation', () => {
    it.each([
      ['end before start', { startDate: '2045-03-10', endDate: '2045-03-09' }],
      ['spans two years', { startDate: '2045-12-28', endDate: '2046-01-03' }],
      ['bad date format', { startDate: '03/10/2045', endDate: '2045-03-12' }],
      ['impossible date', { startDate: '2045-02-31', endDate: '2045-03-02' }],
      ['unknown leave type', { leaveType: 'HOLIDAYING' }],
      ['missing reason', { reason: '' }],
      ['extra fields', { status: 'APPROVED' }],
    ])('rejects %s', async (_label, over) => {
      await request_(emp, '2045-03-05', '2045-03-06', over).expect(400);
    });

    it('lets an admin without an employee record know they cannot request leave', async () => {
      await http().post('/api/leave').set(auth(org.adminToken)).send({ startDate: '2045-03-05', endDate: '2045-03-06', leaveType: 'ANNUAL', reason: 'x' }).expect(403);
    });
  });

  describe('overlap protection', () => {
    it('blocks overlapping requests, allows adjacent ones, and frees dates once cancelled', async () => {
      const y = 2046;
      const first = await request_(peer, mondayOf(y), mondayOf(y, 2)).expect(201);
      await request_(peer, mondayOf(y, 2), mondayOf(y, 4)).expect(409); // shares Wednesday
      await request_(peer, mondayOf(y, 3), mondayOf(y, 4)).expect(201); // adjacent
      await http().post(`/api/leave/${first.body.id}/cancel`).set(auth(peer.token)).expect(200);
      await request_(peer, mondayOf(y), mondayOf(y, 2)).expect(201); // dates are free again
    });

    it('does not consider other people\'s leave as overlapping', async () => {
      const y = 2047;
      await request_(emp, mondayOf(y), mondayOf(y, 4)).expect(201);
      await request_(peer, mondayOf(y), mondayOf(y, 4)).expect(201);
    });
  });

  describe('policies and balances', () => {
    let worker: Person;
    beforeAll(async () => {
      worker = await person(org, 'EMPLOYEE', mgr.id);
    });

    it('limits balance-limited types and reports entitlement, used, pending and remaining', async () => {
      const y = 2048;
      await http().put('/api/leave/policies/ANNUAL').set(auth(hr.token)).send({ daysPerYear: '8' }).expect(200);
      await request_(worker, mondayOf(y), mondayOf(y, 4)).expect(201); // 5 pending
      const bal = await http().get(`/api/leave/balances?year=${y}`).set(auth(worker.token)).expect(200);
      const annual = bal.body.items.find((i: { leaveType: string }) => i.leaveType === 'ANNUAL');
      expect(annual).toMatchObject({ entitlement: '8', used: '0', pending: '5', remaining: '3' });

      const tooMuch = await request_(worker, mondayOf(y, 7), mondayOf(y, 11)).expect(400); // needs 5, has 3
      expect(tooMuch.body.message).toMatch(/3 day\(s\) remaining/);
      await request_(worker, mondayOf(y, 7), mondayOf(y, 9)).expect(201); // 3 fits exactly
    });

    it('moves days from pending to used on approval and back on rejection or cancellation', async () => {
      const y = 2049;
      const w = await person(org, 'EMPLOYEE', mgr.id);
      const a = await request_(w, mondayOf(y), mondayOf(y, 1)).expect(201); // 2 days
      const b = await request_(w, mondayOf(y, 7), mondayOf(y, 8)).expect(201); // 2 days
      const c = await request_(w, mondayOf(y, 14), mondayOf(y, 15)).expect(201); // 2 days
      await http().post(`/api/leave/${a.body.id}/approve`).set(auth(mgr.token)).expect(200);
      await http().post(`/api/leave/${b.body.id}/reject`).set(auth(mgr.token)).send({ reason: 'Busy period' }).expect(200);
      await http().post(`/api/leave/${c.body.id}/cancel`).set(auth(w.token)).expect(200);
      const bal = await http().get(`/api/leave/balances?year=${y}`).set(auth(w.token)).expect(200);
      expect(bal.body.items.find((i: { leaveType: string }) => i.leaveType === 'ANNUAL')).toMatchObject({ used: '2', pending: '0', remaining: '6' });
    });

    it('does not limit a type that has no policy, and keeps years separate', async () => {
      const w = await person(org, 'EMPLOYEE');
      await request_(w, mondayOf(2050), mondayOf(2050, 4), { leaveType: 'SICK' }).expect(201);
      await request_(w, mondayOf(2050, 7), mondayOf(2050, 25), { leaveType: 'SICK' }).expect(201);
      const balance = await http().get('/api/leave/balances?year=2051').set(auth(w.token)).expect(200);
      expect(balance.body.items.find((i: { leaveType: string }) => i.leaveType === 'SICK')).toMatchObject({ entitlement: null, remaining: null, pending: '0' });
    });

    it('enforces the balance under concurrent requests (no over-booking)', async () => {
      const y = 2052;
      await http().put('/api/leave/policies/UNPAID').set(auth(hr.token)).send({ daysPerYear: '12' }).expect(200);
      const w = await person(org, 'EMPLOYEE');
      // Five non-overlapping 5-day requests fired together against 12 days: exactly two can fit.
      const results = await Promise.all(
        [0, 14, 28, 42, 56].map((offset) => request_(w, mondayOf(y, offset), mondayOf(y, offset + 4), { leaveType: 'UNPAID' })),
      );
      expect(results.filter((r) => r.status === 201)).toHaveLength(2);
      expect(results.filter((r) => r.status === 400)).toHaveLength(3);
      const bal = await http().get(`/api/leave/balances?year=${y}`).set(auth(w.token)).expect(200);
      expect(bal.body.items.find((i: { leaveType: string }) => i.leaveType === 'UNPAID')).toMatchObject({ pending: '10', remaining: '2' });
    });

    it('rejects concurrent overlapping requests except one', async () => {
      const y = 2053;
      const w = await person(org, 'EMPLOYEE');
      const results = await Promise.all([0, 1, 2, 3].map(() => request_(w, mondayOf(y), mondayOf(y, 4))));
      expect(results.filter((r) => r.status === 201)).toHaveLength(1);
      expect(results.filter((r) => r.status === 409)).toHaveLength(3);
    });

    it('validates and restricts policy management', async () => {
      await http().put('/api/leave/policies/ANNUAL').set(auth(hr.token)).send({ daysPerYear: '-1' }).expect(400);
      await http().put('/api/leave/policies/ANNUAL').set(auth(hr.token)).send({ daysPerYear: '367' }).expect(400);
      await http().put('/api/leave/policies/ANNUAL').set(auth(hr.token)).send({ daysPerYear: 'many' }).expect(400);
      await http().put('/api/leave/policies/NOPE').set(auth(hr.token)).send({ daysPerYear: '5' }).expect(400);
      await http().put('/api/leave/policies/ANNUAL').set(auth(emp.token)).send({ daysPerYear: '99' }).expect(403);
      await http().get('/api/leave/policies').set(auth(emp.token)).expect(200);
    });

    it('keeps policies per organization', async () => {
      await http().put('/api/leave/policies/MATERNITY').set(auth(other.adminToken)).send({ daysPerYear: '90' }).expect(200);
      const mine = await http().get('/api/leave/policies').set(auth(hr.token)).expect(200);
      expect(mine.body.some((p: { leaveType: string }) => p.leaveType === 'MATERNITY')).toBe(false);
      await http().delete('/api/leave/policies/PATERNITY').set(auth(hr.token)).expect(404);
    });
  });

  describe('approval workflow', () => {
    const fresh = async (year: number, who = emp) => (await request_(who, mondayOf(year), mondayOf(year, 1)).expect(201)).body.id as string;

    it('lets the employee\'s manager and HR decide, but nobody else', async () => {
      const id = await fresh(2054);
      await http().post(`/api/leave/${id}/approve`).set(auth(emp.token)).expect(403); // employee role
      await http().post(`/api/leave/${id}/approve`).set(auth(mgr2.token)).expect(403); // a manager, but not theirs
      const ok = await http().post(`/api/leave/${id}/approve`).set(auth(mgr.token)).expect(200);
      expect(ok.body).toMatchObject({ status: 'APPROVED' });
      expect(ok.body.decidedAt).toBeTruthy();
    });

    it('lets HR and admins decide any request', async () => {
      const a = await fresh(2055);
      const b = await fresh(2056);
      await http().post(`/api/leave/${a}/approve`).set(auth(hr.token)).expect(200);
      await http().post(`/api/leave/${b}/approve`).set(auth(org.adminToken)).expect(200);
    });

    it('never lets anyone decide their own leave, even HR', async () => {
      const own = await fresh(2057, hr);
      await http().post(`/api/leave/${own}/approve`).set(auth(hr.token)).expect(403);
      await http().post(`/api/leave/${own}/reject`).set(auth(hr.token)).send({ reason: 'x' }).expect(403);
      const mgrOwn = await fresh(2058, mgr);
      await http().post(`/api/leave/${mgrOwn}/approve`).set(auth(mgr.token)).expect(403);
      await http().post(`/api/leave/${mgrOwn}/approve`).set(auth(hr.token)).expect(200); // HR can approve the manager's
    });

    it('requires a reason to reject, and stores it', async () => {
      const id = await fresh(2059);
      await http().post(`/api/leave/${id}/reject`).set(auth(mgr.token)).send({}).expect(400);
      await http().post(`/api/leave/${id}/reject`).set(auth(mgr.token)).send({ reason: '   ' }).expect(400);
      const res = await http().post(`/api/leave/${id}/reject`).set(auth(mgr.token)).send({ reason: 'Team deadline' }).expect(200);
      expect(res.body).toMatchObject({ status: 'REJECTED', rejectionReason: 'Team deadline' });
    });

    it('enforces valid transitions: a request is decided once', async () => {
      const id = await fresh(2060);
      await http().post(`/api/leave/${id}/approve`).set(auth(mgr.token)).expect(200);
      await http().post(`/api/leave/${id}/approve`).set(auth(mgr.token)).expect(409);
      await http().post(`/api/leave/${id}/reject`).set(auth(hr.token)).send({ reason: 'changed my mind' }).expect(409);
    });

    it('lets only one of several simultaneous approvers win', async () => {
      const id = await fresh(2061);
      const results = await Promise.all([mgr, hr, mgr, hr].map((who) => http().post(`/api/leave/${id}/approve`).set(auth(who.token))));
      expect(results.filter((r) => r.status === 200)).toHaveLength(1);
      expect(results.filter((r) => r.status === 409)).toHaveLength(3);
    });

    it('lets the employee withdraw pending requests and future approved leave', async () => {
      const pending = await fresh(2062);
      await http().post(`/api/leave/${pending}/cancel`).set(auth(emp.token)).expect(200);
      const approved = await fresh(2063);
      await http().post(`/api/leave/${approved}/approve`).set(auth(mgr.token)).expect(200);
      const res = await http().post(`/api/leave/${approved}/cancel`).set(auth(emp.token)).expect(200);
      expect(res.body.status).toBe('CANCELLED');
      await http().post(`/api/leave/${approved}/cancel`).set(auth(emp.token)).expect(409); // already cancelled
    });

    it('does not let colleagues cancel each other\'s leave', async () => {
      const id = await fresh(2064);
      await http().post(`/api/leave/${id}/cancel`).set(auth(peer.token)).expect(403);
      await http().post(`/api/leave/${id}/cancel`).set(auth(mgr.token)).expect(403); // managers decide; only HR cancels others'
      await http().post(`/api/leave/${id}/cancel`).set(auth(hr.token)).expect(200);
    });

    it('lets only HR cancel approved leave that has already started', async () => {
      const worker = await person(org, 'EMPLOYEE', mgr.id);
      const started = (await request_(worker, '2026-01-05', '2026-01-06').expect(201)).body.id;
      await http().post(`/api/leave/${started}/approve`).set(auth(mgr.token)).expect(200);
      await http().post(`/api/leave/${started}/cancel`).set(auth(worker.token)).expect(409);
      await http().post(`/api/leave/${started}/cancel`).set(auth(hr.token)).expect(200);
    });

    it('rejects a rejected request being cancelled, and bad ids', async () => {
      const id = await fresh(2065);
      await http().post(`/api/leave/${id}/reject`).set(auth(mgr.token)).send({ reason: 'No' }).expect(200);
      await http().post(`/api/leave/${id}/cancel`).set(auth(emp.token)).expect(409);
      await http().post('/api/leave/not-a-uuid/approve').set(auth(mgr.token)).expect(400);
      await http().post('/api/leave/00000000-0000-4000-8000-000000000000/approve').set(auth(mgr.token)).expect(404);
    });

    it('records the decision in the audit trail', async () => {
      const id = await fresh(2066);
      await http().post(`/api/leave/${id}/approve`).set(auth(mgr.token)).expect(200);
      const actions = (await prisma().auditLog.findMany({ where: { tenantId: org.tenantId, entityId: id } })).map((l) => l.action);
      expect(actions).toEqual(expect.arrayContaining(['leave.request', 'leave.approve']));
    });
  });

  describe('visibility', () => {
    it('shows an employee only their own leave by default', async () => {
      const res = await http().get('/api/leave?pageSize=100').set(auth(emp.token)).expect(200);
      expect(res.body.items.length).toBeGreaterThan(0);
      expect(res.body.items.every((l: { employee: { id: string } }) => l.employee.id === emp.id)).toBe(true);
    });

    it('shows a manager their direct reports, and not other managers\' reports', async () => {
      const team = await http().get('/api/leave?scope=team&pageSize=100').set(auth(mgr.token)).expect(200);
      const ids = new Set(team.body.items.map((l: { employee: { id: string } }) => l.employee.id));
      expect(ids.has(emp.id)).toBe(true);
      expect(ids.has(hr.id)).toBe(false);
      const empty = await http().get('/api/leave?scope=team').set(auth(mgr2.token)).expect(200);
      expect(empty.body.total).toBe(0);
    });

    it('restricts the team and organization views', async () => {
      await http().get('/api/leave?scope=team').set(auth(emp.token)).expect(403);
      await http().get('/api/leave?scope=all').set(auth(emp.token)).expect(403);
      await http().get('/api/leave?scope=all').set(auth(mgr.token)).expect(403);
      const all = await http().get('/api/leave?scope=all&pageSize=100').set(auth(hr.token)).expect(200);
      expect(all.body.total).toBeGreaterThan(5);
      await http().get('/api/leave?scope=galaxy').set(auth(hr.token)).expect(400);
    });

    it('filters by status and year, and paginates', async () => {
      const rejected = await http().get('/api/leave?scope=all&status=REJECTED&pageSize=100').set(auth(hr.token)).expect(200);
      expect(rejected.body.items.every((l: { status: string }) => l.status === 'REJECTED')).toBe(true);
      const y = await http().get('/api/leave?scope=all&year=2054&pageSize=100').set(auth(hr.token)).expect(200);
      expect(y.body.items.every((l: { startDate: string }) => l.startDate.startsWith('2054'))).toBe(true);
      const p1 = await http().get('/api/leave?scope=all&page=1&pageSize=2').set(auth(hr.token)).expect(200);
      const p2 = await http().get('/api/leave?scope=all&page=2&pageSize=2').set(auth(hr.token)).expect(200);
      expect(p1.body.items).toHaveLength(2);
      expect(p1.body.items[0].id).not.toBe(p2.body.items[0].id);
      await http().get('/api/leave?pageSize=101').set(auth(hr.token)).expect(400);
    });

    it('limits who can read whose balances', async () => {
      await http().get(`/api/leave/balances?employeeId=${emp.id}`).set(auth(mgr.token)).expect(200); // their report
      await http().get(`/api/leave/balances?employeeId=${emp.id}`).set(auth(hr.token)).expect(200);
      await http().get(`/api/leave/balances?employeeId=${emp.id}`).set(auth(emp.token)).expect(200); // themself
      await http().get(`/api/leave/balances?employeeId=${emp.id}`).set(auth(peer.token)).expect(403);
      await http().get(`/api/leave/balances?employeeId=${emp.id}`).set(auth(mgr2.token)).expect(403);
    });
  });

  describe('tenant isolation', () => {
    it('hides other organizations\' leave and refuses cross-tenant decisions', async () => {
      const foreignWorker = await person(other, 'EMPLOYEE');
      const foreign = (await request_(foreignWorker, mondayOf(2067), mondayOf(2067, 1)).expect(201)).body.id;
      await http().post(`/api/leave/${foreign}/approve`).set(auth(hr.token)).expect(404);
      await http().post(`/api/leave/${foreign}/cancel`).set(auth(hr.token)).expect(404);
      const all = await http().get('/api/leave?scope=all&pageSize=100').set(auth(hr.token)).expect(200);
      expect(all.body.items.some((l: { id: string }) => l.id === foreign)).toBe(false);
      await http().get(`/api/leave/balances?employeeId=${foreignWorker.id}`).set(auth(hr.token)).expect(404);
    });

    it('applies each organization\'s own weekend and holidays', async () => {
      const y = 2068;
      await http().post('/api/holidays').set(auth(other.adminToken)).send({ date: mondayOf(y), name: 'Only theirs' }).expect(201);
      const mine = await http().get(`/api/holidays?year=${y}`).set(auth(hr.token)).expect(200);
      expect(mine.body.some((h: { name: string }) => h.name === 'Only theirs')).toBe(false);
      const res = await request_(emp, mondayOf(y), mondayOf(y, 4)).expect(201);
      expect(res.body.days).toBe('5'); // their holiday does not reduce our days
    });
  });

  describe('holidays', () => {
    it('lets HR add, list and remove holidays; prevents duplicates; restricts employees', async () => {
      const date = mondayOf(2070, 21);
      const created = await http().post('/api/holidays').set(auth(hr.token)).send({ date, name: 'Harvest Festival' }).expect(201);
      await http().post('/api/holidays').set(auth(hr.token)).send({ date, name: 'Duplicate' }).expect(409);
      await http().post('/api/holidays').set(auth(emp.token)).send({ date: mondayOf(2070, 22), name: 'Nope' }).expect(403);
      await http().post('/api/holidays').set(auth(hr.token)).send({ date: 'soon', name: 'Bad' }).expect(400);
      const list = await http().get('/api/holidays?year=2070').set(auth(emp.token)).expect(200);
      expect(list.body).toEqual([{ id: created.body.id, date, name: 'Harvest Festival' }]);
      await http().delete(`/api/holidays/${created.body.id}`).set(auth(hr.token)).expect(200);
      await http().delete(`/api/holidays/${created.body.id}`).set(auth(hr.token)).expect(404);
    });

    it('cannot delete another organization\'s holiday', async () => {
      const theirs = await http().post('/api/holidays').set(auth(other.adminToken)).send({ date: mondayOf(2071), name: 'Private' }).expect(201);
      await http().delete(`/api/holidays/${theirs.body.id}`).set(auth(hr.token)).expect(404);
    });
  });
});
