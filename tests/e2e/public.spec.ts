import { expect, test } from "@playwright/test";
import { ar } from "../../i18n/messages/ar";
import { en } from "../../i18n/messages/en";
import { fa } from "../../i18n/messages/fa";
import { seeded } from "./seed";

const PROTECTED = ["/dashboard", "/properties", "/properties/new", "/tenants", "/leases", "/payments", "/expenses", "/maintenance", "/admin/users"];

test.describe("public pages and basic web security", () => {
  for (const path of PROTECTED) {
    test(`${path} redirects an anonymous visitor to the login page`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test("public registration is closed", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(en.auth.registrationClosed);
  });

  test("responses carry the security headers and hide the framework", async ({ request }) => {
    const response = await request.get("/login");
    const headers = response.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBeTruthy();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("an unknown route returns 404", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);
  });

  test("the language switcher changes language, direction and page title", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page).toHaveTitle(en.common.appName);

    await page.getByRole("button", { name: "العربية" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page).toHaveTitle(ar.common.appName);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ar.auth.loginTitle);

    await page.getByRole("button", { name: "فارسی" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page).toHaveTitle(fa.common.appName);

    await page.getByRole("button", { name: "English" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test.describe("with the database", () => {
    test.skip(!seeded(), "needs DATABASE_URL (see tests/e2e/global-setup.ts)");

    test("a wrong password shows a generic error", async ({ page }) => {
      await page.goto("/login");
      await page.getByLabel(en.auth.email, { exact: true }).fill(`nobody-${Date.now()}@example.test`);
      await page.getByLabel(en.auth.password, { exact: true }).fill("not-the-password");
      await page.getByRole("button", { name: en.auth.signIn, exact: true }).click();
      await expect(page.getByRole("alert")).toHaveText(en.auth.errors.invalid_credentials);
      await expect(page).toHaveURL(/\/login$/);
    });

    test("password reset gives the same answer for an unknown account", async ({ page }) => {
      await page.goto("/forgot-password");
      await page.getByLabel(en.auth.email, { exact: true }).fill(`ghost-${Date.now()}@example.test`);
      await page.getByRole("button", { name: en.auth.forgotSubmit }).click();
      await expect(page).toHaveURL(/\/forgot-password\?requested=1$/);
      await expect(page.getByRole("status")).toContainText(en.auth.forgotRequested);
    });
  });
});
