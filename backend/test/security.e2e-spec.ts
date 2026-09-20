import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { PASSWORD, TestOrg, cleanup, createApp, createUser, login, signupOrg, uniqueSlug } from './helpers';

describe('Authentication, authorization and tenant isolation (e2e)', () => {
  let app: INestApplication;
  let orgA: TestOrg;
  let orgB: TestOrg;
  const slugs: string[] = [];
  const http = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    app = await createApp();
    orgA = await signupOrg(app, 'a');
    orgB = await signupOrg(app, 'b');
    slugs.push(orgA.slug, orgB.slug);
  });

  afterAll(async () => cleanup(app, slugs));

  describe('sign-up and login (regression for S01, S02)', () => {
    it('creates an organization whose first user is ADMIN and never returns a password hash', async () => {
      const res = await http()
        .post('/api/auth/signup')
        .send({
          organizationName: 'Signup Test',
          organizationSlug: uniqueSlug('sg'),
          email: 'owner@signup.test',
          password: PASSWORD,
          firstName: 'Sam',
          lastName: 'Owner',
        })
        .expect(201);
      slugs.push(await slugOf(res.body.user.tenantId));
      expect(res.body.user.role).toBe('ADMIN');
      expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    });

    it('rejects a client-supplied role or tenant on sign-up (no self-assigned privileges)', async () => {
      await http()
        .post('/api/auth/signup')
        .send({
          organizationName: 'X',
          organizationSlug: uniqueSlug('bad'),
          email: 'x@x.test',
          password: PASSWORD,
          firstName: 'X',
          lastName: 'Y',
          role: 'ADMIN',
        })
        .expect(400);
    });

    it('rejects the removed public /auth/register endpoint', async () => {
      await http().post('/api/auth/register').send({ email: 'a@b.test', password: PASSWORD, firstName: 'A', lastName: 'B', role: 'ADMIN' }).expect(404);
    });

    it('rejects a weak password and a duplicate organization slug', async () => {
      await http()
        .post('/api/auth/signup')
        .send({ organizationName: 'W', organizationSlug: uniqueSlug('w'), email: 'w@w.test', password: 'short', firstName: 'W', lastName: 'W' })
        .expect(400);
      await http()
        .post('/api/auth/signup')
        .send({ organizationName: 'Dup', organizationSlug: orgA.slug, email: 'dup@dup.test', password: PASSWORD, firstName: 'D', lastName: 'D' })
        .expect(409);
    });

    it('logs in with the correct password', async () => {
      const res = await login(app, orgA.slug, orgA.adminEmail).expect(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user.tenantId).toBe(orgA.tenantId);
    });

    it('rejects a wrong password, an unknown email and an unknown organization with the same 401 message', async () => {
      const wrong = await login(app, orgA.slug, orgA.adminEmail, 'not-the-password').expect(401);
      const unknownUser = await login(app, orgA.slug, 'nobody@nowhere.test').expect(401);
      const unknownOrg = await login(app, 'no-such-org', orgA.adminEmail).expect(401);
      expect(unknownUser.body.message).toBe(wrong.body.message);
      expect(unknownOrg.body.message).toBe(wrong.body.message);
    });

    it('does not let an email from one organization log in to another', async () => {
      await login(app, orgB.slug, orgA.adminEmail).expect(401);
    });
  });

  describe('authentication is required everywhere except login and sign-up (S06)', () => {
    it.each(['/api/employees', '/api/attendance', '/api/leave', '/api/documents', '/api/payroll/summary', '/api/admin/stats', '/api/users', '/api/auth/profile'])(
      'GET %s without a token returns 401',
      async (path) => {
        await http().get(path).expect(401);
      },
    );

    it('rejects a forged token', async () => {
      await http().get('/api/users').set(auth('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ4In0.forged')).expect(401);
    });
  });

  describe('role enforcement', () => {
    it('forbids an EMPLOYEE from listing users and from admin/payroll endpoints', async () => {
      const emp = await createUser(app, orgA.adminToken, 'EMPLOYEE', 'emp');
      const token = (await login(app, orgA.slug, emp.email).expect(200)).body.accessToken;
      await http().get('/api/users').set(auth(token)).expect(403);
      await http().get('/api/admin/stats').set(auth(token)).expect(403);
      await http().get('/api/payroll/summary').set(auth(token)).expect(403);
      await http().get('/api/auth/profile').set(auth(token)).expect(200);
    });

    it('allows ADMIN and HR to reach admin stats', async () => {
      await http().get('/api/admin/stats').set(auth(orgA.adminToken)).expect(200);
    });
  });

  describe('privilege escalation (S05)', () => {
    let hrToken: string;
    beforeAll(async () => {
      const hr = await createUser(app, orgA.adminToken, 'HR', 'hr');
      hrToken = (await login(app, orgA.slug, hr.email).expect(200)).body.accessToken;
    });

    it('HR cannot create an ADMIN', async () => {
      await http()
        .post('/api/users')
        .set(auth(hrToken))
        .send({ email: `esc-${uniqueSlug('e')}@example.test`, password: PASSWORD, firstName: 'E', lastName: 'E', role: 'ADMIN' })
        .expect(403);
    });

    it('HR cannot promote a user to ADMIN or modify an existing ADMIN', async () => {
      const emp = await createUser(app, orgA.adminToken, 'EMPLOYEE', 'promo');
      await http().patch(`/api/users/${emp.id}`).set(auth(hrToken)).send({ role: 'ADMIN' }).expect(403);
      await http().patch(`/api/users/${orgA.adminId}`).set(auth(hrToken)).send({ isActive: false }).expect(403);
    });

    it('HR can create and update a normal employee, and responses never include a password hash', async () => {
      const res = await http()
        .post('/api/users')
        .set(auth(hrToken))
        .send({ email: `ok-${uniqueSlug('o')}@example.test`, password: PASSWORD, firstName: 'Ok', lastName: 'User' })
        .expect(201);
      expect(res.body.role).toBe('EMPLOYEE');
      expect(res.body).not.toHaveProperty('password');
      const upd = await http().patch(`/api/users/${res.body.id}`).set(auth(hrToken)).send({ firstName: 'Renamed' }).expect(200);
      expect(upd.body.firstName).toBe('Renamed');
      expect(upd.body).not.toHaveProperty('password');
    });

    it('does not allow changing email or OAuth ids through the update endpoint', async () => {
      const emp = await createUser(app, orgA.adminToken, 'EMPLOYEE', 'imm');
      await http().patch(`/api/users/${emp.id}`).set(auth(orgA.adminToken)).send({ email: 'hijack@example.test' }).expect(400);
      await http().patch(`/api/users/${emp.id}`).set(auth(orgA.adminToken)).send({ googleId: 'x' }).expect(400);
    });

    it('an admin cannot change their own role, deactivate or delete themselves', async () => {
      await http().patch(`/api/users/${orgA.adminId}`).set(auth(orgA.adminToken)).send({ role: 'EMPLOYEE' }).expect(403);
      await http().patch(`/api/users/${orgA.adminId}`).set(auth(orgA.adminToken)).send({ isActive: false }).expect(403);
      await http().delete(`/api/users/${orgA.adminId}`).set(auth(orgA.adminToken)).expect(403);
    });
  });

  describe('tenant isolation (S03, S04)', () => {
    it('lists only users of the caller\'s organization', async () => {
      const res = await http().get('/api/users').set(auth(orgB.adminToken)).expect(200);
      expect(res.body.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.items.every((u: { tenantId: string }) => u.tenantId === orgB.tenantId)).toBe(true);
    });

    it('returns 404 for read, update and delete of another organization\'s user', async () => {
      const victim = await createUser(app, orgA.adminToken, 'EMPLOYEE', 'victim');
      await http().get(`/api/users/${victim.id}`).set(auth(orgB.adminToken)).expect(404);
      await http().patch(`/api/users/${victim.id}`).set(auth(orgB.adminToken)).send({ firstName: 'Pwned' }).expect(404);
      await http().delete(`/api/users/${victim.id}`).set(auth(orgB.adminToken)).expect(404);
      // Untouched:
      const still = await http().get(`/api/users/${victim.id}`).set(auth(orgA.adminToken)).expect(200);
      expect(still.body.firstName).toBe('victim');
    });

    it('ignores a client-supplied tenant header on authenticated requests', async () => {
      const res = await http().get('/api/users').set(auth(orgB.adminToken)).set('X-Tenant-Id', orgA.tenantId).expect(200);
      expect(res.body.items.every((u: { tenantId: string }) => u.tenantId === orgB.tenantId)).toBe(true);
    });

    it('rejects a token whose tenant claim does not match the user', async () => {
      // Craft a token for org A's admin but claiming org B's tenant, signed with the real secret.
      const { JwtService } = await import('@nestjs/jwt');
      const forged = new JwtService({ secret: process.env.JWT_SECRET }).sign({ sub: orgA.adminId, tenantId: orgB.tenantId });
      await http().get('/api/users').set(auth(forged)).expect(401);
    });

    it('validates the id format', async () => {
      await http().get('/api/users/not-a-uuid').set(auth(orgA.adminToken)).expect(400);
    });
  });

  describe('token lifetime is bound to the database, not the token (S08)', () => {
    it('a deactivated user\'s existing token stops working immediately', async () => {
      const u = await createUser(app, orgA.adminToken, 'EMPLOYEE', 'deact');
      const token = (await login(app, orgA.slug, u.email).expect(200)).body.accessToken;
      await http().get('/api/auth/profile').set(auth(token)).expect(200);
      await http().patch(`/api/users/${u.id}`).set(auth(orgA.adminToken)).send({ isActive: false }).expect(200);
      await http().get('/api/auth/profile').set(auth(token)).expect(401);
      await login(app, orgA.slug, u.email).expect(401);
    });

    it('a demoted user loses privileges immediately', async () => {
      const u = await createUser(app, orgA.adminToken, 'HR', 'demote');
      const token = (await login(app, orgA.slug, u.email).expect(200)).body.accessToken;
      await http().get('/api/users').set(auth(token)).expect(200);
      await http().patch(`/api/users/${u.id}`).set(auth(orgA.adminToken)).send({ role: 'EMPLOYEE' }).expect(200);
      await http().get('/api/users').set(auth(token)).expect(403);
    });

    it('a deleted user\'s token stops working', async () => {
      const u = await createUser(app, orgA.adminToken, 'EMPLOYEE', 'del');
      const token = (await login(app, orgA.slug, u.email).expect(200)).body.accessToken;
      await http().delete(`/api/users/${u.id}`).set(auth(orgA.adminToken)).expect(200);
      await http().get('/api/auth/profile').set(auth(token)).expect(401);
    });
  });

  describe('data integrity', () => {
    it('stores emails lower-cased and prevents duplicates within an organization', async () => {
      const email = `Mixed-${uniqueSlug('m')}@Example.Test`;
      await http().post('/api/users').set(auth(orgA.adminToken)).send({ email, password: PASSWORD, firstName: 'M', lastName: 'C' }).expect(201);
      await http().post('/api/users').set(auth(orgA.adminToken)).send({ email: email.toLowerCase(), password: PASSWORD, firstName: 'M', lastName: 'C' }).expect(409);
    });

    it('stores passwords as bcrypt hashes', async () => {
      const row = await app.get(PrismaService).user.findUnique({ where: { id: orgA.adminId } });
      expect(row.password).toMatch(/^\$2[aby]\$12\$/);
    });

    it('paginates the user list', async () => {
      const res = await http().get('/api/users?page=1&pageSize=1').set(auth(orgA.adminToken)).expect(200);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.total).toBeGreaterThan(1);
      await http().get('/api/users?pageSize=1000').set(auth(orgA.adminToken)).expect(400);
    });
  });

  async function slugOf(tenantId: string) {
    const t = await app.get(PrismaService).tenant.findUnique({ where: { id: tenantId } });
    return t.name;
  }
});

describe('Rate limiting on credential endpoints (e2e)', () => {
  it('returns 429 after too many login attempts', async () => {
    process.env.AUTH_THROTTLE_LIMIT = '10';
    const app = await createApp();
    try {
      const statuses: number[] = [];
      for (let i = 0; i < 14; i++) {
        const res = await login(app, 'no-such-org', 'x@x.test', 'wrong-password');
        statuses.push(res.status);
      }
      expect(statuses).toContain(429);
      expect(statuses[0]).toBe(401);
    } finally {
      process.env.AUTH_THROTTLE_LIMIT = '1000';
      await cleanup(app, []);
    }
  });
});
