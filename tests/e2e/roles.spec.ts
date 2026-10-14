import { expect, test } from "@playwright/test";
import { messages } from "../../i18n";
import { signInAs } from "./fixtures";

const nav = (page: import("@playwright/test").Page) => page.getByRole("navigation", { name: messages.en.nav.label });

test.describe("role-based navigation and access", () => {
  test("an accountant sees only finance sections and is kept out of the others", async ({ page }) => {
    await signInAs(page, "accountant");
    await expect(nav(page).getByRole("link", { name: messages.en.nav.payments })).toBeVisible();
    await expect(nav(page).getByRole("link", { name: messages.en.nav.expenses })).toBeVisible();
    for (const hidden of [messages.en.nav.properties, messages.en.nav.tenants, messages.en.nav.leases, messages.en.nav.maintenance, messages.en.nav.users]) {
      await expect(nav(page).getByRole("link", { name: hidden, exact: true })).toHaveCount(0);
    }
    for (const path of ["/properties", "/properties/new", "/tenants", "/leases", "/maintenance", "/admin/users", "/admin/users/new"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/(dashboard|properties|tenants|leases|maintenance)$/);
      await expect(page, path).not.toHaveURL(/\/admin\//);
    }
    await page.goto("/payments");
    await expect(page.getByRole("heading", { name: messages.en.payments.title })).toBeVisible();
  });

  test("a system admin sees every section", async ({ page }) => {
    await signInAs(page, "admin");
    for (const label of Object.values({ ...messages.en.nav }).filter((value) => value !== messages.en.nav.signOut && value !== messages.en.nav.label)) {
      await expect(nav(page).getByRole("link", { name: label, exact: true })).toBeVisible();
    }
  });

  test("signing out ends the session", async ({ page }) => {
    await signInAs(page, "admin");
    await page.getByRole("button", { name: messages.en.nav.signOut }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });
});
