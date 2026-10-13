import { expect, test } from "@playwright/test";
import { en, login } from "./helpers";
import { seedNames, seeded } from "./seed";

test.describe("core property-management flow (administrator)", () => {
  test.skip(!seeded(), "needs DATABASE_URL (see tests/e2e/global-setup.ts)");

  test("create property, unit, tenant, lease, payment and expense, then see the totals", async ({ page }) => {
    const suffix = seeded()?.suffix ?? "";
    const names = seedNames(suffix);
    const propertyName = `Jasmine Tower ${suffix}`;
    const tenantName = `Sara Ali ${suffix}`;

    await test.step("sign in", async () => {
      await login(page, names.adminEmail);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(en.dashboard.title);
    });

    await test.step("create a property", async () => {
      await page.goto("/properties/new");
      await page.getByLabel(en.properties.name, { exact: true }).fill(propertyName);
      await page.getByLabel(en.properties.address, { exact: true }).fill("Main street 1");
      await page.getByLabel(en.properties.city, { exact: true }).fill("Damascus");
      await page.getByLabel(en.properties.country, { exact: true }).fill("Syria");
      await page.getByRole("button", { name: en.properties.submit }).click();
      await expect(page).toHaveURL(/\/properties$/);
      await expect(page.getByRole("link", { name: propertyName })).toBeVisible();
    });

    await test.step("add a unit", async () => {
      await page.getByRole("link", { name: propertyName }).click();
      await page.getByRole("link", { name: en.properties.addUnit }).click();
      await page.getByLabel(en.units.number, { exact: true }).fill("101");
      await page.getByLabel(en.units.rent, { exact: true }).fill("1500");
      await page.getByRole("button", { name: en.units.submit }).click();
      await expect(page.getByText(en.properties.unitTitle.replace("{number}", "101"))).toBeVisible();
    });

    await test.step("a malformed rent is rejected with a translated error", async () => {
      await page.getByRole("link", { name: en.properties.addUnit }).click();
      await page.getByLabel(en.units.number, { exact: true }).fill("102");
      await page.getByLabel(en.units.rent, { exact: true }).fill("12.345");
      await page.getByRole("button", { name: en.units.submit }).click();
      await expect(page.getByRole("alert")).toHaveText(en.actionErrors.moneyInvalid);
    });

    await test.step("add a tenant", async () => {
      await page.goto("/tenants/new");
      await page.getByLabel(en.tenants.fullName, { exact: true }).fill(tenantName);
      await page.getByRole("button", { name: en.tenants.submit }).click();
      await expect(page).toHaveURL(/\/tenants$/);
      await expect(page.getByText(tenantName)).toBeVisible();
    });

    await test.step("create a lease", async () => {
      await page.goto("/leases/new");
      await page.getByLabel(en.leases.unit, { exact: true }).selectOption({ label: en.leases.unitOption.replace("{property}", propertyName).replace("{unit}", "101") });
      await page.getByLabel(en.leases.tenant, { exact: true }).selectOption({ label: tenantName });
      await page.getByLabel(en.leases.startDate, { exact: true }).fill("2026-01-01");
      await page.getByLabel(en.leases.endDate, { exact: true }).fill("2026-12-31");
      await page.getByLabel(en.leases.rent, { exact: true }).fill("1500");
      await page.getByRole("button", { name: en.leases.submit }).click();
      await expect(page).toHaveURL(/\/leases$/);
      await expect(page.getByText(tenantName)).toBeVisible();
      await expect(page.getByText(en.enums.leaseStatus.ACTIVE, { exact: true })).toBeVisible();
    });

    await test.step("record a payment", async () => {
      await page.goto("/payments/new");
      await page.getByLabel(en.payments.amount, { exact: true }).fill("1500.50");
      await page.getByLabel(en.payments.dueDate, { exact: true }).fill("2026-02-01");
      await page.getByLabel(en.payments.paidDate, { exact: true }).fill("2026-02-01");
      await page.getByRole("button", { name: en.payments.submit }).click();
      await expect(page).toHaveURL(/\/payments$/);
      await expect(page.getByText(en.payments.amountLabel.replace("{value}", "1,500.5"))).toBeVisible();
    });

    await test.step("a paid payment without a paid date is rejected", async () => {
      await page.goto("/payments/new");
      await page.getByLabel(en.payments.amount, { exact: true }).fill("10");
      await page.getByLabel(en.payments.dueDate, { exact: true }).fill("2026-03-01");
      await page.getByRole("button", { name: en.payments.submit }).click();
      await expect(page.getByRole("alert")).toHaveText(en.actionErrors.paidDateRequired);
    });

    await test.step("record an expense", async () => {
      await page.goto("/expenses/new");
      await page.getByLabel(en.expenses.category, { exact: true }).fill("Maintenance");
      await page.getByLabel(en.expenses.amount, { exact: true }).fill("200.25");
      await page.getByLabel(en.expenses.date, { exact: true }).fill("2026-02-10");
      await page.getByRole("button", { name: en.expenses.submit }).click();
      await expect(page).toHaveURL(/\/expenses$/);
      await expect(page.getByText("200.25").first()).toBeVisible();
    });

    await test.step("the dashboard totals are exact decimals", async () => {
      await page.goto("/dashboard");
      await expect(page.getByText("1,500.5", { exact: true })).toBeVisible();
      await expect(page.getByText("200.25", { exact: true })).toBeVisible();
      await expect(page.getByText("1,300.25", { exact: true })).toBeVisible();
    });

    await test.step("sign out", async () => {
      await page.getByRole("button", { name: en.nav.signOut }).click();
      await expect(page).toHaveURL(/\/login$/);
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/\/login$/);
    });
  });
});
