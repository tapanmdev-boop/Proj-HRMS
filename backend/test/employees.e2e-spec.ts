import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { PASSWORD, TestOrg, cleanup, createApp, createUser, login, signupOrg, uniqueSlug } from './helpers';

describe('Employees and departments (e2e)', () => {
  let app: INestApplication;
  let org: TestOrg;
  let other: TestOrg;
  let hrToken: string;
  let empToken: string;
  let mgrToken: string;
  const slugs: string[] = [];
  const http = () => request(app.getHttpServer());
  const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
  const prisma = () => app.get(PrismaService);

  const newEmployee = (over: Record<string, unknown> = {}) => ({
    email: `${uniqueSlug('e')}@example.test`,
    password: PASSWORD,
    firstName: 'Ada',
    lastName: 'Lovelace',
    position: 'Engineer',
    joinDate: '2026-01-15',
    salary: '5000.50',
    ...over,
  });

  beforeAll(async () => {
    app = await createApp();
    org = await signupOrg(app, 'emp');
    other = await signupOrg(app, 'oth');
    slugs.push(org.slug, other.slug);
    const hr = await createUser(app, org.adminToken, 'HR', 'hr');
    hrToken = (await login(app, org.slug, hr.email).expect(200)).body.accessToken;
  });
  afterAll(async () => cleanup(app, slugs));

  describe('creating employees', () => {
    it('creates an employee with a login, generated id, and exact decimal pay', async () => {
      const res = await http()
        .post('/api/employees')
        .set(auth(hrToken))
        .send(newEmployee({ currency: 'EUR', identifiers: { national_id: 'X-123' }, allowances: [{ code: 'housing', label: 'Housing', amount: '1200.25' }] }))
        .expect(201);
      expect(res.body).toMatchObject({ employeeId: 'EMP-0001', status: 'ACTIVE', salary: '5000.5', currency: 'EUR', identifiers: { national_id: 'X-123' } });
      expect(res.body.allowances).toEqual([{ code: 'housing', label: 'Housing', amount: '1200.25' }]);
      // The new person can sign in:
      await login(app, org.slug, res.body.email).expect(200);
    });

    it('generates sequential employee ids', async () => {
      const res = await http().post('/api/employees').set(auth(hrToken)).send(newEmployee()).expect(201);
      expect(res.body.employeeId).toMatch(/^EMP-\d{4}$/);
      expect(res.body.employeeId).not.toBe('EMP-0001');
    });

    it('rejects a duplicate email regardless of letter case', async () => {
      const first = newEmployee();
      await http().post('/api/employees').set(auth(hrToken)).send(first).expect(201);
      await http().post('/api/employees').set(auth(hrToken)).send({ ...newEmployee(), email: first.email.toUpperCase() }).expect(409);
    });

    it('rejects a duplicate employee id within an organization but allows it in another', async () => {
      await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ employeeId: 'DUP-1' })).expect(201);
      await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ employeeId: 'DUP-1' })).expect(409);
      await http().post('/api/employees').set(auth(other.adminToken)).send(newEmployee({ employeeId: 'DUP-1' })).expect(201);
    });

    it.each([
      ['a negative salary', { salary: '-1' }],
      ['a float-style salary with too many decimals', { salary: '1.23456' }],
      ['a numeric (non-string) salary', { salary: 5000 }],
      ['an invalid currency', { currency: 'euro' }],
      ['an invalid join date', { joinDate: 'yesterday' }],
      ['an ADMIN role', { role: 'ADMIN' }],
      ['unknown fields', { isAdmin: true }],
      ['a malformed identifiers map', { identifiers: { 'Bad Key': 'x' } }],
      ['too-long identifier values', { identifiers: { national_id: 'x'.repeat(65) } }],
      ['a bad allowance amount', { allowances: [{ code: 'housing', amount: 'lots' }] }],
      ['a short password', { password: 'short' }],
    ])('rejects %s', async (_label, over) => {
      await http().post('/api/employees').set(auth(hrToken)).send(newEmployee(over)).expect(400);
    });

    it('rejects a department or manager from another organization', async () => {
      const dept = await http().post('/api/departments').set(auth(other.adminToken)).send({ name: 'Foreign' }).expect(201);
      const foreignEmp = await http().post('/api/employees').set(auth(other.adminToken)).send(newEmployee()).expect(201);
      await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ departmentId: dept.body.id })).expect(400);
      await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ managerId: foreignEmp.body.id })).expect(400);
    });

    it('forbids non-HR roles from creating employees', async () => {
      const emp = await createUser(app, org.adminToken, 'EMPLOYEE', 'plain');
      empToken = (await login(app, org.slug, emp.email).expect(200)).body.accessToken;
      await http().post('/api/employees').set(auth(empToken)).send(newEmployee()).expect(403);
    });

    it('records an audit event without pay or identity values', async () => {
      const secret = 'TOP-SECRET-ID-777';
      const res = await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ identifiers: { national_id: secret }, bankAccount: 'ACCT-99887766' })).expect(201);
      const logs = await prisma().auditLog.findMany({ where: { tenantId: org.tenantId, entityId: res.body.id } });
      expect(logs.map((l) => l.action)).toContain('employee.create');
      expect(JSON.stringify(logs)).not.toContain(secret);
      expect(JSON.stringify(logs)).not.toContain('ACCT-99887766');
    });
  });

  describe('privacy of personal and pay data', () => {
    let target: { id: string; email: string };

    beforeAll(async () => {
      const res = await http()
        .post('/api/employees')
        .set(auth(hrToken))
        .send(newEmployee({ bankAccount: 'IBAN-SECRET', phoneNumber: '+49 30 1234', identifiers: { tax_id: 'TAX-1' } }))
        .expect(201);
      target = { id: res.body.id, email: res.body.email };
      const mgr = await createUser(app, org.adminToken, 'MANAGER', 'mgr');
      mgrToken = (await login(app, org.slug, mgr.email).expect(200)).body.accessToken;
    });

    const SENSITIVE = ['salary', 'bankAccount', 'identifiers', 'allowances', 'phoneNumber', 'address', 'dateOfBirth', 'emergencyContact', 'currency'];

    it('gives Admin/HR the full record', async () => {
      const res = await http().get(`/api/employees/${target.id}`).set(auth(hrToken)).expect(200);
      expect(res.body).toMatchObject({ bankAccount: 'IBAN-SECRET', salary: '5000.5' });
    });

    it.each([['employee'], ['manager']])('hides every sensitive field from a %s (single record and list)', async (who) => {
      const token = who === 'employee' ? empToken : mgrToken;
      const one = await http().get(`/api/employees/${target.id}`).set(auth(token)).expect(200);
      for (const field of SENSITIVE) expect(one.body).not.toHaveProperty(field);
      expect(one.body.firstName).toBe('Ada');

      const list = await http().get('/api/employees?pageSize=100').set(auth(token)).expect(200);
      expect(list.body.items.length).toBeGreaterThan(0);
      for (const item of list.body.items) for (const field of SENSITIVE) expect(item).not.toHaveProperty(field);
      expect(JSON.stringify(list.body)).not.toContain('IBAN-SECRET');
    });

    it('lets an employee read their own full record via /employees/me and by id', async () => {
      const created = await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ salary: '7000', bankAccount: 'MINE-1' })).expect(201);
      const token = (await login(app, org.slug, created.body.email).expect(200)).body.accessToken;
      const me = await http().get('/api/employees/me').set(auth(token)).expect(200);
      expect(me.body).toMatchObject({ salary: '7000', bankAccount: 'MINE-1' });
      const byId = await http().get(`/api/employees/${created.body.id}`).set(auth(token)).expect(200);
      expect(byId.body.salary).toBe('7000');
    });

    it('returns 404 from /employees/me when the user has no employee record', async () => {
      await http().get('/api/employees/me').set(auth(org.adminToken)).expect(404);
    });
  });

  describe('listing', () => {
    beforeAll(async () => {
      const dept = await http().post('/api/departments').set(auth(hrToken)).send({ name: 'Research' }).expect(201);
      for (const [first, last] of [['Grace', 'Hopper'], ['Alan', 'Turing'], ['Katherine', 'Johnson']]) {
        await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ firstName: first, lastName: last, departmentId: dept.body.id, position: 'Scientist' })).expect(201);
      }
    });

    it('paginates with a stable total', async () => {
      const p1 = await http().get('/api/employees?page=1&pageSize=2').set(auth(hrToken)).expect(200);
      const p2 = await http().get('/api/employees?page=2&pageSize=2').set(auth(hrToken)).expect(200);
      expect(p1.body.items).toHaveLength(2);
      expect(p1.body.total).toBe(p2.body.total);
      expect(p1.body.items[0].id).not.toBe(p2.body.items[0].id);
      await http().get('/api/employees?pageSize=101').set(auth(hrToken)).expect(400);
      await http().get('/api/employees?page=0').set(auth(hrToken)).expect(400);
    });

    it('searches by name, position and email, case-insensitively', async () => {
      const byName = await http().get('/api/employees?search=hOpPeR').set(auth(hrToken)).expect(200);
      expect(byName.body.items.map((e: { lastName: string }) => e.lastName)).toEqual(['Hopper']);
      const byPos = await http().get('/api/employees?search=scientist').set(auth(hrToken)).expect(200);
      expect(byPos.body.total).toBe(3);
    });

    it('filters by department and status', async () => {
      const dept = (await http().get('/api/departments').set(auth(hrToken)).expect(200)).body.find((d: { name: string }) => d.name === 'Research');
      expect(dept.employeeCount).toBe(3);
      const inDept = await http().get(`/api/employees?departmentId=${dept.id}`).set(auth(hrToken)).expect(200);
      expect(inDept.body.total).toBe(3);
      expect(inDept.body.items.every((e: { department: { name: string } }) => e.department.name === 'Research')).toBe(true);
      await http().get('/api/employees?status=BOGUS').set(auth(hrToken)).expect(400);
    });

    it('never lists another organization\'s employees', async () => {
      const mine = await http().get('/api/employees?pageSize=100').set(auth(hrToken)).expect(200);
      const theirs = await http().get('/api/employees?pageSize=100').set(auth(other.adminToken)).expect(200);
      const mineIds = new Set(mine.body.items.map((e: { id: string }) => e.id));
      expect(theirs.body.items.some((e: { id: string }) => mineIds.has(e.id))).toBe(false);
    });
  });

  describe('updating and reporting lines', () => {
    it('updates profile and name fields, and 404s across organizations', async () => {
      const e = (await http().post('/api/employees').set(auth(hrToken)).send(newEmployee()).expect(201)).body;
      const up = await http().patch(`/api/employees/${e.id}`).set(auth(hrToken)).send({ position: 'Principal Engineer', lastName: 'Byron', salary: '6100', identifiers: { tax_id: 'NEW' } }).expect(200);
      expect(up.body).toMatchObject({ position: 'Principal Engineer', lastName: 'Byron', salary: '6100', identifiers: { tax_id: 'NEW' } });
      await http().patch(`/api/employees/${e.id}`).set(auth(other.adminToken)).send({ position: 'Hacked' }).expect(404);
      await http().patch(`/api/employees/${e.id}`).set(auth(empToken)).send({ position: 'Hacked' }).expect(403);
    });

    it('does not allow email, password or role changes through this endpoint', async () => {
      const e = (await http().post('/api/employees').set(auth(hrToken)).send(newEmployee()).expect(201)).body;
      await http().patch(`/api/employees/${e.id}`).set(auth(hrToken)).send({ email: 'x@y.test' }).expect(400);
      await http().patch(`/api/employees/${e.id}`).set(auth(hrToken)).send({ role: 'ADMIN' }).expect(400);
    });

    it('rejects self-management and reporting loops, and can clear a manager', async () => {
      const a = (await http().post('/api/employees').set(auth(hrToken)).send(newEmployee()).expect(201)).body;
      const b = (await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ managerId: a.id })).expect(201)).body;
      const c = (await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ managerId: b.id })).expect(201)).body;

      await http().patch(`/api/employees/${a.id}`).set(auth(hrToken)).send({ managerId: a.id }).expect(400); // self
      await http().patch(`/api/employees/${a.id}`).set(auth(hrToken)).send({ managerId: c.id }).expect(400); // a -> c -> b -> a
      const cleared = await http().patch(`/api/employees/${b.id}`).set(auth(hrToken)).send({ managerId: null }).expect(200);
      expect(cleared.body.managerId).toBeNull();
      await http().patch(`/api/employees/${a.id}`).set(auth(hrToken)).send({ managerId: c.id }).expect(200); // legal now
    });

    it('rejects an employee id already used by a colleague', async () => {
      const a = (await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ employeeId: 'TAKEN-1' })).expect(201)).body;
      const b = (await http().post('/api/employees').set(auth(hrToken)).send(newEmployee()).expect(201)).body;
      await http().patch(`/api/employees/${b.id}`).set(auth(hrToken)).send({ employeeId: a.employeeId }).expect(409);
    });

    it('validates the id format', async () => {
      await http().get('/api/employees/not-a-uuid').set(auth(hrToken)).expect(400);
    });
  });

  describe('termination', () => {
    it('ends employment, disables the login immediately and revokes sessions, but keeps the record', async () => {
      const e = (await http().post('/api/employees').set(auth(hrToken)).send(newEmployee()).expect(201)).body;
      const session = (await login(app, org.slug, e.email).expect(200)).body;

      const res = await http().post(`/api/employees/${e.id}/terminate`).set(auth(hrToken)).send({ terminationDate: '2026-02-01' }).expect(201);
      expect(res.body).toMatchObject({ status: 'TERMINATED', terminationDate: '2026-02-01' });

      await http().get('/api/auth/profile').set(auth(session.accessToken)).expect(401);
      await http().post('/api/auth/refresh').send({ refreshToken: session.refreshToken }).expect(401);
      await login(app, org.slug, e.email).expect(401);

      const still = await http().get(`/api/employees/${e.id}`).set(auth(hrToken)).expect(200);
      expect(still.body.status).toBe('TERMINATED');
      const terminated = await http().get('/api/employees?status=TERMINATED&pageSize=100').set(auth(hrToken)).expect(200);
      expect(terminated.body.items.some((x: { id: string }) => x.id === e.id)).toBe(true);
      const active = await http().get('/api/employees?status=ACTIVE&pageSize=100').set(auth(hrToken)).expect(200);
      expect(active.body.items.some((x: { id: string }) => x.id === e.id)).toBe(false);
    });

    it('keeps access until a future termination date', async () => {
      const e = (await http().post('/api/employees').set(auth(hrToken)).send(newEmployee()).expect(201)).body;
      await http().post(`/api/employees/${e.id}/terminate`).set(auth(hrToken)).send({ terminationDate: '2099-01-01' }).expect(201);
      await login(app, org.slug, e.email).expect(200);
      const now = await http().get(`/api/employees/${e.id}`).set(auth(hrToken)).expect(200);
      expect(now.body.status).toBe('ACTIVE');
    });

    it('rejects a termination before the join date, self-termination, and a terminated manager', async () => {
      const e = (await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ joinDate: '2026-03-01' })).expect(201)).body;
      await http().post(`/api/employees/${e.id}/terminate`).set(auth(hrToken)).send({ terminationDate: '2026-02-01' }).expect(400);

      const selfEmp = (await http().post('/api/employees').set(auth(org.adminToken)).send(newEmployee()).expect(201)).body;
      const selfToken = (await login(app, org.slug, selfEmp.email).expect(200)).body.accessToken;
      await http().post(`/api/employees/${selfEmp.id}/terminate`).set(auth(selfToken)).send({ terminationDate: '2026-02-01' }).expect(403); // employee role: forbidden

      const gone = (await http().post('/api/employees').set(auth(hrToken)).send(newEmployee()).expect(201)).body;
      await http().post(`/api/employees/${gone.id}/terminate`).set(auth(hrToken)).send({ terminationDate: '2026-02-01' }).expect(201);
      await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ managerId: gone.id })).expect(400);
    });

    it('cannot terminate another organization\'s employee', async () => {
      const e = (await http().post('/api/employees').set(auth(other.adminToken)).send(newEmployee()).expect(201)).body;
      await http().post(`/api/employees/${e.id}/terminate`).set(auth(hrToken)).send({ terminationDate: '2026-02-01' }).expect(404);
    });
  });

  describe('departments', () => {
    it('creates, renames, and rejects duplicates (per organization only)', async () => {
      const d = (await http().post('/api/departments').set(auth(hrToken)).send({ name: 'Finance' }).expect(201)).body;
      await http().post('/api/departments').set(auth(hrToken)).send({ name: 'Finance' }).expect(409);
      await http().post('/api/departments').set(auth(other.adminToken)).send({ name: 'Finance' }).expect(201);
      const renamed = await http().patch(`/api/departments/${d.id}`).set(auth(hrToken)).send({ name: 'Treasury' }).expect(200);
      expect(renamed.body.name).toBe('Treasury');
    });

    it('lets any signed-in user list departments but only HR/Admin change them', async () => {
      await http().get('/api/departments').set(auth(empToken)).expect(200);
      await http().post('/api/departments').set(auth(empToken)).send({ name: 'Nope' }).expect(403);
    });

    it('refuses to delete a department with employees, and deletes an empty one', async () => {
      const d = (await http().post('/api/departments').set(auth(hrToken)).send({ name: 'Legal' }).expect(201)).body;
      const e = (await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ departmentId: d.id })).expect(201)).body;
      await http().delete(`/api/departments/${d.id}`).set(auth(hrToken)).expect(409);
      await http().patch(`/api/employees/${e.id}`).set(auth(hrToken)).send({ departmentId: null }).expect(200);
      await http().delete(`/api/departments/${d.id}`).set(auth(hrToken)).expect(200);
    });

    it('cannot touch another organization\'s department', async () => {
      const d = (await http().post('/api/departments').set(auth(other.adminToken)).send({ name: 'Secret' }).expect(201)).body;
      await http().patch(`/api/departments/${d.id}`).set(auth(hrToken)).send({ name: 'Mine now' }).expect(404);
      await http().delete(`/api/departments/${d.id}`).set(auth(hrToken)).expect(404);
    });
  });

  describe('multi-country data', () => {
    it.each([
      ['AE', 'AED', { emirates_id: '784-1990-1234567-1', labour_card: 'LC-1' }],
      ['IN', 'INR', { pan: 'ABCDE1234F', aadhaar: '123456789012' }],
      ['GB', 'GBP', { ni_number: 'QQ123456C' }],
      ['DE', 'EUR', { tax_id: '12345678901' }],
      ['BR', 'BRL', { cpf: '123.456.789-09' }],
      ['JP', 'JPY', { my_number: '123456789012' }],
    ])('stores %s identifiers and %s pay without any country-specific code', async (_country, currency, identifiers) => {
      const res = await http().post('/api/employees').set(auth(hrToken)).send(newEmployee({ currency, identifiers })).expect(201);
      expect(res.body.currency).toBe(currency);
      expect(res.body.identifiers).toEqual(identifiers);
    });
  });
});
