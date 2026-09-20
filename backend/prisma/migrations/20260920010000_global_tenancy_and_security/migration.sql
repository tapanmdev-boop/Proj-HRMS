-- Global tenancy, per-tenant uniqueness, Decimal money, audit log and refresh tokens.
--
-- Safe on populated databases:
--  * fails early, with a clear message, if existing rows would violate a new unique constraint
--  * new NOT NULL columns are added nullable, backfilled, then constrained
--  * column type changes use ALTER ... TYPE (no data loss)

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "attendances" GROUP BY "employeeId", "date" HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Migration blocked: duplicate attendance rows exist for the same employee and date. Merge or remove them, then re-run.';
  END IF;
  IF EXISTS (SELECT 1 FROM "payslips" GROUP BY "employeeId", "payPeriodStart", "payPeriodEnd" HAVING COUNT(*) > 1) THEN
    RAISE EXCEPTION 'Migration blocked: duplicate payslips exist for the same employee and pay period. Resolve them, then re-run.';
  END IF;
END $$;

-- DropForeignKey
ALTER TABLE "payslips" DROP CONSTRAINT "payslips_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "documents" DROP CONSTRAINT "documents_employeeId_fkey";

-- DropIndex
DROP INDEX "users_email_key";

-- DropIndex
DROP INDEX "users_googleId_key";

-- DropIndex
DROP INDEX "users_microsoftId_key";

-- DropIndex
DROP INDEX "employees_employeeId_key";

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "baseCurrency" CHAR(3) NOT NULL DEFAULT 'USD',
ADD COLUMN     "countryCode" CHAR(2),
ADD COLUMN     "defaultLocale" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "defaultTimezone" TEXT NOT NULL DEFAULT 'UTC',
ADD COLUMN     "fiscalYearStartMonth" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "settings" JSONB,
ADD COLUMN     "weekStartsOn" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "locale" TEXT,
ADD COLUMN     "timezone" TEXT;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "currency" CHAR(3),
ALTER COLUMN "salary" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "payslips" ADD COLUMN     "currency" CHAR(3),
ALTER COLUMN "baseSalary" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "bonus" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "deductions" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "tax" SET DATA TYPE DECIMAL(19,4),
ALTER COLUMN "netSalary" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "performance_reviews" ADD COLUMN     "tenantId" TEXT;

-- AlterTable
ALTER TABLE "goals" ADD COLUMN     "tenantId" TEXT;


-- Backfill the new columns, then enforce NOT NULL
UPDATE "performance_reviews" pr SET "tenantId" = e."tenantId" FROM "employees" e WHERE pr."employeeId" = e."id";
UPDATE "goals" g SET "tenantId" = e."tenantId" FROM "employees" e WHERE g."employeeId" = e."id";
UPDATE "payslips" p SET "currency" = t."baseCurrency" FROM "tenants" t WHERE p."tenantId" = t."id";
ALTER TABLE "performance_reviews" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "goals" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "payslips" ALTER COLUMN "currency" SET NOT NULL;

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_familyId_idx" ON "refresh_tokens"("familyId");

-- CreateIndex
CREATE INDEX "audit_logs_tenantId_createdAt_idx" ON "audit_logs"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "users_tenantId_role_idx" ON "users"("tenantId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_googleId_key" ON "users"("tenantId", "googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenantId_microsoftId_key" ON "users"("tenantId", "microsoftId");

-- CreateIndex
CREATE INDEX "employees_tenantId_idx" ON "employees"("tenantId");

-- CreateIndex
CREATE INDEX "employees_managerId_idx" ON "employees"("managerId");

-- CreateIndex
CREATE INDEX "employees_departmentId_idx" ON "employees"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_tenantId_employeeId_key" ON "employees"("tenantId", "employeeId");

-- CreateIndex
CREATE INDEX "departments_tenantId_idx" ON "departments"("tenantId");

-- CreateIndex
CREATE INDEX "attendances_tenantId_date_idx" ON "attendances"("tenantId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_employeeId_date_key" ON "attendances"("employeeId", "date");

-- CreateIndex
CREATE INDEX "leaves_tenantId_status_idx" ON "leaves"("tenantId", "status");

-- CreateIndex
CREATE INDEX "leaves_employeeId_idx" ON "leaves"("employeeId");

-- CreateIndex
CREATE INDEX "payslips_tenantId_status_idx" ON "payslips"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "payslips_employeeId_payPeriodStart_payPeriodEnd_key" ON "payslips"("employeeId", "payPeriodStart", "payPeriodEnd");

-- CreateIndex
CREATE INDEX "documents_tenantId_idx" ON "documents"("tenantId");

-- CreateIndex
CREATE INDEX "documents_employeeId_idx" ON "documents"("employeeId");

-- CreateIndex
CREATE INDEX "notifications_recipientId_isRead_idx" ON "notifications"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_tenantId_idx" ON "notifications"("tenantId");

-- CreateIndex
CREATE INDEX "performance_reviews_tenantId_idx" ON "performance_reviews"("tenantId");

-- CreateIndex
CREATE INDEX "performance_reviews_employeeId_idx" ON "performance_reviews"("employeeId");

-- CreateIndex
CREATE INDEX "goals_tenantId_idx" ON "goals"("tenantId");

-- CreateIndex
CREATE INDEX "goals_employeeId_idx" ON "goals"("employeeId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payslips" ADD CONSTRAINT "payslips_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

