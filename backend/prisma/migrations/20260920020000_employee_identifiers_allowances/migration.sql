-- Jurisdiction-neutral storage for country-specific identifiers and pay components.
ALTER TABLE "employees" ADD COLUMN     "identifiers" JSONB,
ADD COLUMN     "allowances" JSONB;
