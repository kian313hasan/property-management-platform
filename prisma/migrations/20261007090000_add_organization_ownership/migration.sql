-- Add organization ownership to all business resources.
-- This migration is intentionally data-preserving for the existing single-tenant dataset.

INSERT INTO "Organization" ("id", "name", "slug", "createdAt", "updatedAt")
VALUES ('legacy-organization', 'Default Organization', 'default', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "Property" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Unit" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Tenant" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Lease" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "Expense" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "MaintenanceRequest" ADD COLUMN "organizationId" TEXT;

UPDATE "Property" SET "organizationId" = (SELECT "id" FROM "Organization" WHERE "slug" = 'default') WHERE "organizationId" IS NULL;
UPDATE "Tenant" SET "organizationId" = (SELECT "id" FROM "Organization" WHERE "slug" = 'default') WHERE "organizationId" IS NULL;
UPDATE "Unit" SET "organizationId" = (SELECT "organizationId" FROM "Property" WHERE "Property"."id" = "Unit"."propertyId") WHERE "organizationId" IS NULL;
UPDATE "Lease" SET "organizationId" = (SELECT "organizationId" FROM "Unit" WHERE "Unit"."id" = "Lease"."unitId") WHERE "organizationId" IS NULL;
UPDATE "Payment" SET "organizationId" = (SELECT "organizationId" FROM "Lease" WHERE "Lease"."id" = "Payment"."leaseId") WHERE "organizationId" IS NULL;
UPDATE "Expense" SET "organizationId" = (SELECT "organizationId" FROM "Property" WHERE "Property"."id" = "Expense"."propertyId") WHERE "organizationId" IS NULL;
UPDATE "MaintenanceRequest" SET "organizationId" = (SELECT "organizationId" FROM "Property" WHERE "Property"."id" = "MaintenanceRequest"."propertyId") WHERE "organizationId" IS NULL;

ALTER TABLE "Property" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Unit" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Tenant" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Lease" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "MaintenanceRequest" ALTER COLUMN "organizationId" SET NOT NULL;

CREATE INDEX "Property_organizationId_idx" ON "Property"("organizationId");
CREATE UNIQUE INDEX "Property_id_organizationId_key" ON "Property"("id", "organizationId");
CREATE INDEX "Unit_organizationId_idx" ON "Unit"("organizationId");
CREATE UNIQUE INDEX "Unit_id_organizationId_key" ON "Unit"("id", "organizationId");
CREATE INDEX "Tenant_organizationId_idx" ON "Tenant"("organizationId");
CREATE UNIQUE INDEX "Tenant_id_organizationId_key" ON "Tenant"("id", "organizationId");
CREATE INDEX "Lease_organizationId_idx" ON "Lease"("organizationId");
CREATE UNIQUE INDEX "Lease_id_organizationId_key" ON "Lease"("id", "organizationId");
CREATE INDEX "Payment_organizationId_idx" ON "Payment"("organizationId");
CREATE UNIQUE INDEX "Payment_id_organizationId_key" ON "Payment"("id", "organizationId");
CREATE INDEX "Expense_organizationId_idx" ON "Expense"("organizationId");
CREATE UNIQUE INDEX "Expense_id_organizationId_key" ON "Expense"("id", "organizationId");
CREATE INDEX "MaintenanceRequest_organizationId_idx" ON "MaintenanceRequest"("organizationId");
CREATE UNIQUE INDEX "MaintenanceRequest_id_organizationId_key" ON "MaintenanceRequest"("id", "organizationId");

INSERT INTO "OrganizationMember" ("id", "organizationId", "userId", "role", "createdAt", "updatedAt")
SELECT 'legacy-membership-' || "User"."id",
       (SELECT "id" FROM "Organization" WHERE "slug" = 'default'),
       "User"."id",
       "User"."role",
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM "User"
WHERE NOT EXISTS (
  SELECT 1 FROM "OrganizationMember" m
  WHERE m."organizationId" = (SELECT "id" FROM "Organization" WHERE "slug" = 'default')
    AND m."userId" = "User"."id"
);

ALTER TABLE "Property" ADD CONSTRAINT "Property_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Lease" ADD CONSTRAINT "Lease_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MaintenanceRequest" ADD CONSTRAINT "MaintenanceRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
