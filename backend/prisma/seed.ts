/**
 * Development seed. Idempotent: safe to run repeatedly.
 *
 *   SEED_ADMIN_EMAIL     required  e.g. admin@example.com
 *   SEED_ADMIN_PASSWORD  required  at least 12 characters (never committed; set it in .env)
 *   SEED_TENANT          optional  organization slug (default "demo")
 *   SEED_COUNTRY / SEED_LOCALE / SEED_TIMEZONE / SEED_CURRENCY   optional regional settings
 *   SEED_SAMPLE_USERS    optional  "true" also creates one HR, MANAGER and EMPLOYEE user
 *
 * Refuses to run when NODE_ENV=production.
 */
import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required (set it in backend/.env)`);
  }
  return value;
}

async function upsertUser(tenantId: string, email: string, firstName: string, lastName: string, role: Role, passwordHash: string) {
  return prisma.user.upsert({
    where: { email_tenantId: { email, tenantId } },
    // Do not overwrite the password or role of an account that already exists.
    update: {},
    create: { email, firstName, lastName, role, password: passwordHash, tenantId },
  });
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed a production database');
  }

  const adminEmail = required('SEED_ADMIN_EMAIL').toLowerCase();
  const adminPassword = required('SEED_ADMIN_PASSWORD');
  if (adminPassword.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters');
  }

  const slug = process.env.SEED_TENANT || 'demo';
  const tenant = await prisma.tenant.upsert({
    where: { name: slug },
    update: {},
    create: {
      name: slug,
      displayName: slug.charAt(0).toUpperCase() + slug.slice(1),
      countryCode: process.env.SEED_COUNTRY || undefined,
      defaultLocale: process.env.SEED_LOCALE || undefined,
      defaultTimezone: process.env.SEED_TIMEZONE || undefined,
      baseCurrency: process.env.SEED_CURRENCY || undefined,
    },
  });

  const hash = await bcrypt.hash(adminPassword, 12);
  await upsertUser(tenant.id, adminEmail, 'System', 'Administrator', Role.ADMIN, hash);

  if (process.env.SEED_SAMPLE_USERS === 'true') {
    const domain = adminEmail.split('@')[1];
    await upsertUser(tenant.id, `hr@${domain}`, 'Hana', 'Resources', Role.HR, hash);
    await upsertUser(tenant.id, `manager@${domain}`, 'Marco', 'Manager', Role.MANAGER, hash);
    await upsertUser(tenant.id, `employee@${domain}`, 'Eve', 'Employee', Role.EMPLOYEE, hash);
  }

  console.log(`Seeded organization "${tenant.name}" (${tenant.baseCurrency}, ${tenant.defaultTimezone}, ${tenant.defaultLocale}). Sign in as ${adminEmail}.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
