-- Enforce tenant boundaries at the database relation level.
-- Each cross-entity foreign key now includes organizationId so an entity
-- cannot reference a parent record belonging to another organization.

ALTER TABLE "Unit" DROP CONSTRAINT IF EXISTS "Unit_propertyId_fkey";
ALTER TABLE "Lease" DROP CONSTRAINT IF EXISTS "Lease_unitId_fkey";
ALTER TABLE "Lease" DROP CONSTRAINT IF EXISTS "Lease_tenantId_fkey";
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_leaseId_fkey";
ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_propertyId_fkey";
ALTER TABLE "Expense" DROP CONSTRAINT IF EXISTS "Expense_unitId_fkey";
ALTER TABLE "MaintenanceRequest" DROP CONSTRAINT IF EXISTS "MaintenanceRequest_propertyId_fkey";
ALTER TABLE "MaintenanceRequest" DROP CONSTRAINT IF EXISTS "MaintenanceRequest_unitId_fkey";
ALTER TABLE "MaintenanceRequest" DROP CONSTRAINT IF EXISTS "MaintenanceRequest_tenantId_fkey";

ALTER TABLE "Unit"
  ADD CONSTRAINT "Unit_propertyId_organizationId_fkey"
  FOREIGN KEY ("propertyId", "organizationId")
  REFERENCES "Property" ("id", "organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lease"
  ADD CONSTRAINT "Lease_unitId_organizationId_fkey"
  FOREIGN KEY ("unitId", "organizationId")
  REFERENCES "Unit" ("id", "organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lease"
  ADD CONSTRAINT "Lease_tenantId_organizationId_fkey"
  FOREIGN KEY ("tenantId", "organizationId")
  REFERENCES "Tenant" ("id", "organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_leaseId_organizationId_fkey"
  FOREIGN KEY ("leaseId", "organizationId")
  REFERENCES "Lease" ("id", "organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_propertyId_organizationId_fkey"
  FOREIGN KEY ("propertyId", "organizationId")
  REFERENCES "Property" ("id", "organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Expense"
  ADD CONSTRAINT "Expense_unitId_organizationId_fkey"
  FOREIGN KEY ("unitId", "organizationId")
  REFERENCES "Unit" ("id", "organizationId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MaintenanceRequest"
  ADD CONSTRAINT "MaintenanceRequest_propertyId_organizationId_fkey"
  FOREIGN KEY ("propertyId", "organizationId")
  REFERENCES "Property" ("id", "organizationId")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MaintenanceRequest"
  ADD CONSTRAINT "MaintenanceRequest_unitId_organizationId_fkey"
  FOREIGN KEY ("unitId", "organizationId")
  REFERENCES "Unit" ("id", "organizationId")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MaintenanceRequest"
  ADD CONSTRAINT "MaintenanceRequest_tenantId_organizationId_fkey"
  FOREIGN KEY ("tenantId", "organizationId")
  REFERENCES "Tenant" ("id", "organizationId")
  ON DELETE SET NULL ON UPDATE CASCADE;
