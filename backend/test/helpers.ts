import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

export async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  await app.init();
  return app;
}

export const PASSWORD = 'Str0ng-Passw0rd!';

let counter = 0;
export const uniqueSlug = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}`;

export interface TestOrg {
  slug: string;
  tenantId: string;
  adminToken: string;
  adminId: string;
  adminEmail: string;
}

export async function signupOrg(app: INestApplication, prefix = 'org'): Promise<TestOrg> {
  const slug = uniqueSlug(prefix);
  const adminEmail = `admin@${slug}.test`;
  const res = await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send({
      organizationName: `Org ${slug}`,
      organizationSlug: slug,
      email: adminEmail,
      password: PASSWORD,
      firstName: 'Ada',
      lastName: 'Admin',
    })
    .expect(201);
  return { slug, tenantId: res.body.user.tenantId, adminToken: res.body.accessToken, adminId: res.body.user.id, adminEmail };
}

export async function createUser(app: INestApplication, adminToken: string, role: string, label: string) {
  const email = `${label}-${uniqueSlug('u')}@example.test`;
  const res = await request(app.getHttpServer())
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ email, password: PASSWORD, firstName: label, lastName: 'Tester', role })
    .expect(201);
  return { id: res.body.id as string, email };
}

export function login(app: INestApplication, slug: string, email: string, password = PASSWORD) {
  return request(app.getHttpServer()).post('/api/auth/login').send({ tenant: slug, email, password });
}

const suiteStartedAt = new Date();

export async function cleanup(app: INestApplication, slugs: string[]) {
  const prisma = app.get(PrismaService);
  const tenants = await prisma.tenant.findMany({ where: { name: { in: slugs } }, select: { id: true } });
  // Audit rows are kept when a tenant is deleted, so remove this run's rows explicitly.
  await prisma.auditLog.deleteMany({
    where: { OR: [{ tenantId: { in: tenants.map((t) => t.id) } }, { tenantId: null, createdAt: { gte: suiteStartedAt } }] },
  });
  await prisma.tenant.deleteMany({ where: { name: { in: slugs } } });
  await app.close();
}
