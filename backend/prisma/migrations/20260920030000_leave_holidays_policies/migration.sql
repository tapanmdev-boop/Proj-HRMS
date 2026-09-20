-- Leave: configurable weekends, holidays, per-type entitlements, and computed day counts.

ALTER TABLE "tenants" ADD COLUMN     "weekendDays" INTEGER[] DEFAULT ARRAY[6, 0]::INTEGER[];

ALTER TABLE "leaves" ADD COLUMN     "days" DECIMAL(6,2) NOT NULL DEFAULT 0,
ADD COLUMN     "decidedAt" TIMESTAMP(3);

-- Existing requests had no computed day count: backfill with calendar days (inclusive) so balances are not zero.
UPDATE "leaves" SET "days" = ("endDate" - "startDate") + 1;

CREATE TABLE "holidays" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "leave_policies" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "daysPerYear" DECIMAL(6,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_policies_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "holidays_tenantId_date_key" ON "holidays"("tenantId", "date");
CREATE UNIQUE INDEX "leave_policies_tenantId_leaveType_key" ON "leave_policies"("tenantId", "leaveType");

ALTER TABLE "holidays" ADD CONSTRAINT "holidays_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "leave_policies" ADD CONSTRAINT "leave_policies_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
