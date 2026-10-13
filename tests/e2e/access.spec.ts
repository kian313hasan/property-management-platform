import { expect, test } from "@playwright/test";
import { en, login, mainNav } from "./helpers";
import { seedNames, seeded } from "./seed";

test.describe("role-based access and organization isolation", () => {
  const seed = seeded();
  test.skip(!seed, "needs DATABASE_URL (see tests/e2e/global-setup.ts)");
  const names = seedNames(seed?.suffix ?? "");

  test("an accountant sees finance sections only and is redirected away from the rest", async ({ page }) => {
    await login(page, names.accountantEmail);
    const nav = mainNav(page);
    await expect(nav.getByRole("link", { name: en.nav.payments, exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: en.nav.expenses, exact: true })).toBeVisible();
    for (const hidden of [en.nav.properties, en.nav.tenants, en.nav.leases, en.nav.maintenance, en.nav.users]) {
      await expect(nav.getByRole("link", { name: hidden, exact: true })).toHaveCount(0);
    }
    for (const path of ["/properties", "/tenants", "/leases", "/maintenance", "/admin/users", "/properties/new"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/(dashboard|properties)$/);
      await expect(page, path).not.toHaveURL(/\/(tenants|leases|maintenance|admin)/);
    }
    await page.goto("/payments");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(en.payments.title);
  });

  test("staff only reach maintenance", async ({ page }) => {
    await login(page, names.staffEmail);
    await expect(mainNav(page).getByRole("link", { name: en.nav.maintenance, exact: true })).toBeVisible();
    await expect(mainNav(page).getByRole("link", { name: en.nav.payments, exact: true })).toHaveCount(0);
    for (const path of ["/payments", "/expenses", "/properties", "/admin/users"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/dashboard$/);
    }
    await page.goto("/maintenance");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(en.maintenance.title);
  });

  test("an administrator cannot see or open another organization's property", async ({ page }) => {
    await login(page, names.adminEmail);

    await page.goto("/properties");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(en.properties.title);
    await expect(page.getByText(names.foreignPropertyName)).toHaveCount(0);

    const response = await page.goto(`/properties/${seed?.foreignPropertyId ?? ""}`);
    expect(response?.status()).toBe(404);
    await expect(page.getByText(names.foreignPropertyName)).toHaveCount(0);

    const unitForm = await page.goto(`/properties/${seed?.foreignPropertyId ?? ""}/units/new`);
    expect(unitForm?.status()).toBe(404);
  });

  test("the other organization's administrator does see that property", async ({ page }) => {
    await login(page, names.otherAdminEmail);
    await page.goto("/properties");
    await expect(page.getByText(names.foreignPropertyName)).toBeVisible();
  });
});
