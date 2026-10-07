ALTER TABLE "Unit"
  ALTER COLUMN "rentAmount" TYPE DECIMAL(18,2)
  USING ROUND("rentAmount"::numeric, 2);

ALTER TABLE "Lease"
  ALTER COLUMN "rentAmount" TYPE DECIMAL(18,2)
  USING ROUND("rentAmount"::numeric, 2);

ALTER TABLE "Lease"
  ALTER COLUMN "depositAmount" TYPE DECIMAL(18,2)
  USING ROUND("depositAmount"::numeric, 2);

ALTER TABLE "Payment"
  ALTER COLUMN "amount" TYPE DECIMAL(18,2)
  USING ROUND("amount"::numeric, 2);

ALTER TABLE "Expense"
  ALTER COLUMN "amount" TYPE DECIMAL(18,2)
  USING ROUND("amount"::numeric, 2);

ALTER TABLE "MaintenanceRequest"
  ALTER COLUMN "cost" TYPE DECIMAL(18,2)
  USING ROUND("cost"::numeric, 2);
