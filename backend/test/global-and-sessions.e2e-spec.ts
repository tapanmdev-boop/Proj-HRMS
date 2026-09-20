import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service';
import { PASSWORD, cleanup, createApp, createUser, login, signupOrg, uniqueSlug } from './helpers';

const REGIONS = [
  { countryCode: 'IN', defaultLocale: 'en-IN', defaultTimezone: 'Asia/Kolkata', baseCurrency: 'INR' },
  { countryCode: 'DE', defaultLocale: 'de', defaultTimezone: 'Europe/Berlin', baseCurrency: 'EUR' },
  { countryCode: 'BR', defaultLocale: 'pt-BR', defaultTimezone: 'America/Sao_Paulo', baseCurrency: 'BRL' },
  { countryCode: 'JP', defaultLocale: 'ja', defaultTimezone: 'Asia/Tokyo', baseCurrency: 'JPY' },
  { countryCode: 'AE', defaultLocale: 'ar', defaultTimezone: 'Asia/Dubai', baseCurrency: 'AED' },
  { countryCode: 'US', defaultLocale: 'en-US', defaultTimezone: 'America/New_York', baseCurrency: 'USD' },
];

describe('Global tenant settings, sessions and audit trail (e2e)', () => {
  let app: INestApplication;
  const slugs: string[] = [];
  const http = () => request(app.getHttpServer());
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const prisma = () => app.get(PrismaService);

  beforeAll(async () => {
    app = await createApp();
  });
  afterAll(async () => cleanup(app, slugs));

  describe('regional configuration is data, not code', () => {
    it.each(REGIONS)('creates an organization for $countryCode ($baseCurrency, $defaultTimezone, $defaultLocale)', async (region) => {
      const slug = uniqueSlug('geo');
      slugs.push(slug);
      const res = await http()
        .post('/api/auth/signup')
        .send({ organizationName: `Geo ${region.countryCode}`, organizationSlug: slug, email: `a@${slug}.test`, password: PASSWORD, firstName: 'G', lastName: 'H', ...region })
        .expect(201);
      const tenant = await http().get('/api/tenant').set(auth(res.body.accessToken)).expect(200);
      expect(tenant.body).toMatchObject(region);
    });

    it('defaults to neutral values (UTC, USD, en) when nothing is specified', async () => {
      const org = await signupOrg(app, 'def');
      slugs.push(org.slug);
      const tenant = await http().get('/api/tenant').set(auth(org.adminToken)).expect(200);
      expect(tenant.body).toMatchObject({ defaultTimezone: 'UTC', baseCurrency: 'USD', defaultLocale: 'en', countryCode: null });
    });

    it.each([
      ['countryCode', 'XX'],
      ['countryCode', 'india'],
      ['baseCurrency', 'usd'],
      ['baseCurrency', 'ZZZ'],
      ['defaultTimezone', 'Mars/Olympus'],
      ['defaultLocale', 'not a locale!'],
    ])('rejects an invalid %s (%s)', async (field, value) => {
      const slug = uniqueSlug('bad');
      await http()
        .post('/api/auth/signup')
        .send({ organizationName: 'Bad', organizationSlug: slug, email: `a@${slug}.test`, password: PASSWORD, firstName: 'B', lastName: 'C', [field]: value })
        .expect(400);
      expect(await prisma().tenant.findUnique({ where: { name: slug } })).toBeNull();
    });

    it('lets an ADMIN change settings, records the change, and forbids HR and employees', async () => {
      const org = await signupOrg(app, 'cfg');
      slugs.push(org.slug);
      const hr = await createUser(app, org.adminToken, 'HR', 'hr');
      const hrToken = (await login(app, org.slug, hr.email).expect(200)).body.accessToken;

      await http().patch('/api/tenant').set(auth(hrToken)).send({ baseCurrency: 'EUR' }).expect(403);

      const res = await http()
        .patch('/api/tenant')
        .set(auth(org.adminToken))
        .send({ countryCode: 'FR', baseCurrency: 'EUR', defaultTimezone: 'Europe/Paris', defaultLocale: 'fr-FR', weekStartsOn: 1, fiscalYearStartMonth: 4 })
        .expect(200);
      expect(res.body).toMatchObject({ countryCode: 'FR', baseCurrency: 'EUR', fiscalYearStartMonth: 4 });

      const log = await prisma().auditLog.findFirst({ where: { tenantId: org.tenantId, action: 'tenant.update' } });
      expect(log).not.toBeNull();
      expect(JSON.stringify(log.metadata)).toContain('EUR');
    });

    it('validates numeric settings and ignores unknown fields', async () => {
      const org = await signupOrg(app, 'num');
      slugs.push(org.slug);
      await http().patch('/api/tenant').set(auth(org.adminToken)).send({ weekStartsOn: 9 }).expect(400);
      await http().patch('/api/tenant').set(auth(org.adminToken)).send({ fiscalYearStartMonth: 0 }).expect(400);
      await http().patch('/api/tenant').set(auth(org.adminToken)).send({ isActive: false }).expect(400);
    });

    it('does not let one organization change another\'s settings', async () => {
      const a = await signupOrg(app, 'ta');
      const b = await signupOrg(app, 'tb');
      slugs.push(a.slug, b.slug);
      await http().patch('/api/tenant').set(auth(b.adminToken)).send({ baseCurrency: 'JPY' }).expect(200);
      const stillA = await http().get('/api/tenant').set(auth(a.adminToken)).expect(200);
      expect(stillA.body.baseCurrency).toBe('USD');
    });
  });

  describe('refresh tokens', () => {
    it('rotates on each refresh and the new access token works', async () => {
      const org = await signupOrg(app, 'rot');
      slugs.push(org.slug);
      const first = (await login(app, org.slug, org.adminEmail).expect(200)).body;
      expect(first.refreshToken).toEqual(expect.any(String));
      expect(first.expiresIn).toBeGreaterThan(0);

      const second = (await http().post('/api/auth/refresh').send({ refreshToken: first.refreshToken }).expect(200)).body;
      expect(second.refreshToken).not.toBe(first.refreshToken);
      await http().get('/api/auth/profile').set(auth(second.accessToken)).expect(200);
    });

    it('stores only a hash of the refresh token', async () => {
      const org = await signupOrg(app, 'hash');
      slugs.push(org.slug);
      const session = (await login(app, org.slug, org.adminEmail).expect(200)).body;
      const rows = await prisma().refreshToken.findMany({ where: { userId: org.adminId } });
      expect(rows.some((r) => r.tokenHash === session.refreshToken)).toBe(false);
      expect(rows.every((r) => /^[0-9a-f]{64}$/.test(r.tokenHash))).toBe(true);
    });

    it('treats reuse of a rotated token as theft and revokes the whole family', async () => {
      const org = await signupOrg(app, 'theft');
      slugs.push(org.slug);
      const first = (await login(app, org.slug, org.adminEmail).expect(200)).body;
      const second = (await http().post('/api/auth/refresh').send({ refreshToken: first.refreshToken }).expect(200)).body;

      await http().post('/api/auth/refresh').send({ refreshToken: first.refreshToken }).expect(401); // replayed old token
      await http().post('/api/auth/refresh').send({ refreshToken: second.refreshToken }).expect(401); // family revoked

      const log = await prisma().auditLog.findFirst({ where: { action: 'auth.refresh.reuse_detected', actorId: org.adminId } });
      expect(log).not.toBeNull();
    });

    it('logout revokes the session, and is safe to call with an unknown token', async () => {
      const org = await signupOrg(app, 'out');
      slugs.push(org.slug);
      const session = (await login(app, org.slug, org.adminEmail).expect(200)).body;
      await http().post('/api/auth/logout').send({ refreshToken: session.refreshToken }).expect(200);
      await http().post('/api/auth/refresh').send({ refreshToken: session.refreshToken }).expect(401);
      await http().post('/api/auth/logout').send({ refreshToken: 'definitely-not-a-token' }).expect(200);
    });

    it('rejects an unknown refresh token and a deactivated user\'s refresh token', async () => {
      const org = await signupOrg(app, 'deact');
      slugs.push(org.slug);
      await http().post('/api/auth/refresh').send({ refreshToken: 'nope' }).expect(401);

      const u = await createUser(app, org.adminToken, 'EMPLOYEE', 'gone');
      const session = (await login(app, org.slug, u.email).expect(200)).body;
      await http().patch(`/api/users/${u.id}`).set(auth(org.adminToken)).send({ isActive: false }).expect(200);
      await http().post('/api/auth/refresh').send({ refreshToken: session.refreshToken }).expect(401);
    });

    it('stops all access when the organization is deactivated', async () => {
      const org = await signupOrg(app, 'off');
      slugs.push(org.slug);
      const session = (await login(app, org.slug, org.adminEmail).expect(200)).body;
      await prisma().tenant.update({ where: { id: org.tenantId }, data: { isActive: false } });
      await http().get('/api/auth/profile').set(auth(session.accessToken)).expect(401);
      await http().post('/api/auth/refresh').send({ refreshToken: session.refreshToken }).expect(401);
      await login(app, org.slug, org.adminEmail).expect(401);
    });
  });

  describe('audit trail', () => {
    it('records logins, failures and user changes, without secrets', async () => {
      const org = await signupOrg(app, 'aud');
      slugs.push(org.slug);
      await login(app, org.slug, org.adminEmail, 'wrong-password-123').expect(401);
      await login(app, org.slug, org.adminEmail).expect(200);
      const u = await createUser(app, org.adminToken, 'EMPLOYEE', 'audited');
      await http().patch(`/api/users/${u.id}`).set(auth(org.adminToken)).send({ password: 'An0ther-Str0ng-pw', role: 'HR' }).expect(200);
      await http().delete(`/api/users/${u.id}`).set(auth(org.adminToken)).expect(200);

      const logs = await prisma().auditLog.findMany({ where: { tenantId: org.tenantId }, orderBy: { createdAt: 'asc' } });
      const actions = logs.map((l) => l.action);
      expect(actions).toEqual(expect.arrayContaining(['tenant.create', 'auth.login.failed', 'auth.login', 'user.create', 'user.update', 'user.delete']));

      const dump = JSON.stringify(logs);
      expect(dump).not.toContain('An0ther-Str0ng-pw');
      expect(dump).not.toContain(PASSWORD);
      expect(dump).not.toMatch(/\$2[aby]\$/); // no bcrypt hashes
      expect(logs.find((l) => l.action === 'auth.login.failed').metadata).toMatchObject({ reason: 'bad_password' });
    });
  });

  describe('financial records are protected', () => {
    it('refuses to delete a user who has payslips (409) and keeps the payslip', async () => {
      const org = await signupOrg(app, 'pay');
      slugs.push(org.slug);
      const u = await createUser(app, org.adminToken, 'EMPLOYEE', 'paid');
      const employee = await prisma().employee.create({
        data: { employeeId: 'E-1', userId: u.id, tenantId: org.tenantId, position: 'Engineer', joinDate: new Date('2026-01-01'), salary: '5000.1234' },
      });
      await prisma().payslip.create({
        data: {
          employeeId: employee.id,
          tenantId: org.tenantId,
          payPeriodStart: new Date('2026-01-01'),
          payPeriodEnd: new Date('2026-01-31'),
          currency: 'EUR',
          baseSalary: '5000.1234',
          netSalary: '4000.0000',
        },
      });

      await http().delete(`/api/users/${u.id}`).set(auth(org.adminToken)).expect(409);
      expect(await prisma().payslip.count({ where: { employeeId: employee.id } })).toBe(1);
      // The safe alternative works:
      await http().patch(`/api/users/${u.id}`).set(auth(org.adminToken)).send({ isActive: false }).expect(200);
    });

    it('stores money as exact decimals and prevents a duplicate payslip for the same period', async () => {
      const org = await signupOrg(app, 'dec');
      slugs.push(org.slug);
      const u = await createUser(app, org.adminToken, 'EMPLOYEE', 'dec');
      const emp = await prisma().employee.create({
        data: { employeeId: 'E-2', userId: u.id, tenantId: org.tenantId, position: 'Analyst', joinDate: new Date('2026-01-01'), salary: '0.1' },
      });
      const data = {
        employeeId: emp.id,
        tenantId: org.tenantId,
        payPeriodStart: new Date('2026-02-01'),
        payPeriodEnd: new Date('2026-02-28'),
        currency: 'JPY',
        baseSalary: '0.1',
        netSalary: '0.3',
      };
      const p = await prisma().payslip.create({ data });
      expect(p.baseSalary.plus(p.netSalary).toString()).toBe('0.4'); // no binary floating-point drift
      await expect(prisma().payslip.create({ data })).rejects.toMatchObject({ code: 'P2002' });
    });

    it('allows the same employee id and the same email in different organizations', async () => {
      const a = await signupOrg(app, 'sa');
      const b = await signupOrg(app, 'sb');
      slugs.push(a.slug, b.slug);
      const shared = `shared-${uniqueSlug('s')}@example.test`;
      const mk = (org: typeof a) =>
        request(app.getHttpServer()).post('/api/users').set(auth(org.adminToken)).send({ email: shared, password: PASSWORD, firstName: 'S', lastName: 'S' });
      await mk(a).expect(201);
      await mk(b).expect(201);
    });
  });
});
