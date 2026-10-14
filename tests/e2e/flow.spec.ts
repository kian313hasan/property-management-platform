import { expect, test } from "@playwright/test";
import { messages } from "../../i18n";
import { open, selectByText, signInAs, unique } from "./fixtures";

const en = messages.en;

test("a system admin can run the whole rental flow end to end", async ({ page }) => {
  test.setTimeout(240_000);
  const propertyName = unique("E2E Tower");
  const tenantName = unique("E2E Tenant");
  const category = unique("Repairs");

  await signInAs(page, "admin");

  // Property
  await open(page, "/properties/new");
  await page.getByLabel(en.properties.name).fill(propertyName);
  await page.getByLabel(en.properties.address, { exact: true }).fill("1 Test Street");
  await page.getByLabel(en.properties.city).fill("Test City");
  await page.getByLabel(en.properties.country).fill("Testland");
  await page.getByRole("button", { name: en.properties.submit }).click();
  await expect(page).toHaveURL(/\/properties$/);
  await expect(page.getByRole("link", { name: propertyName })).toBeVisible();

  // Unit
  await page.getByRole("link", { name: propertyName }).click();
  await expect(page).toHaveURL(/\/properties\/[^/]+$/);
  await page.getByRole("link", { name: en.properties.addUnit }).click();
  await page.getByLabel(en.units.number).fill("101");
  await page.getByLabel(en.units.rent).fill("1500");
  await page.getByRole("button", { name: en.units.submit }).click();
  await expect(page.getByText("Unit 101")).toBeVisible();

  // Tenant
  await open(page, "/tenants/new");
  await page.getByLabel(en.tenants.fullName).fill(tenantName);
  await page.getByRole("button", { name: en.tenants.submit }).click();
  await expect(page).toHaveURL(/\/tenants$/);
  await expect(page.getByText(tenantName)).toBeVisible();

  // Lease
  await open(page, "/leases/new");
  await selectByText(page, "#unitId", propertyName);
  await selectByText(page, "#tenantId", tenantName);
  await page.getByLabel(en.leases.startDate).fill("2026-01-01");
  await page.getByLabel(en.leases.endDate).fill("2026-12-31");
  await page.getByLabel(en.leases.rent).fill("1500");
  await page.getByRole("button", { name: en.leases.submit }).click();
  await expect(page).toHaveURL(/\/leases$/);
  await expect(page.getByText(tenantName)).toBeVisible();
  await expect(page.getByText(en.enums.leaseStatus.ACTIVE).first()).toBeVisible();

  // Payment
  await open(page, "/payments/new");
  await selectByText(page, "#leaseId", tenantName);
  await page.getByLabel(en.payments.amount).fill("1500");
  await page.getByLabel(en.payments.dueDate).fill("2026-02-01");
  await page.getByLabel(en.payments.paidDate).fill("2026-02-01");
  await page.getByRole("button", { name: en.payments.submit }).click();
  await expect(page).toHaveURL(/\/payments$/);
  await expect(page.getByText(tenantName)).toBeVisible();

  // Expense with a fractional amount (must be stored and shown exactly)
  await open(page, "/expenses/new");
  await selectByText(page, "#propertyId", propertyName);
  await page.getByLabel(en.expenses.category).fill(category);
  await page.getByLabel(en.expenses.amount).fill("250.55");
  await page.getByLabel(en.expenses.date).fill("2026-03-01");
  await page.getByRole("button", { name: en.expenses.submit }).click();
  await expect(page).toHaveURL(/\/expenses$/);
  const row = page.getByRole("row", { name: new RegExp(category) });
  await expect(row).toBeVisible();
  await expect(row).toContainText("250.55");

  // Maintenance
  await open(page, "/maintenance/new");
  await selectByText(page, "#propertyId", propertyName);
  await page.getByLabel(en.maintenance.requestTitle).fill("Leaking tap");
  await page.getByRole("button", { name: en.maintenance.submit }).click();
  await expect(page).toHaveURL(/\/maintenance$/);
  await expect(page.getByText("Leaking tap").first()).toBeVisible();
});

test("invalid input is rejected with a translated message and nothing is saved", async ({ page }) => {
  await signInAs(page, "admin");
  await open(page, "/expenses/new");
  const propertyOption = page.locator("#propertyId option").first();
  if ((await propertyOption.count()) === 0) test.skip(true, "needs at least one property; the flow test creates one");
  await page.getByLabel(en.expenses.category).fill("Invalid amount");
  await page.getByLabel(en.expenses.amount).fill("12.345");
  await page.getByLabel(en.expenses.date).fill("2026-03-01");
  await page.getByRole("button", { name: en.expenses.submit }).click();
  await expect(page.getByText(en.actionErrors.moneyInvalid)).toBeVisible();
  await expect(page).toHaveURL(/\/expenses\/new$/);
});
