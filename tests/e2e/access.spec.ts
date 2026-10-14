import { expect, test } from "@playwright/test";
import { messages } from "../../i18n";
import { E2E_USERS, signIn, useEnglish } from "./fixtures";

const PROTECTED = ["/dashboard", "/properties", "/properties/new", "/tenants", "/leases", "/payments", "/expenses", "/maintenance", "/admin/users"];

test.describe("authentication boundary", () => {
  for (const path of PROTECTED) {
    test(`${path} redirects an anonymous visitor to the login page`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test("a wrong password shows a generic error and stays on the login page", async ({ page }) => {
    await signIn(page, E2E_USERS.admin.email, "definitely-not-the-password");
    await expect(page.getByText(messages.en.auth.errors.invalid_credentials)).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("an unknown account gets the same error as a wrong password (no account enumeration)", async ({ page }) => {
    await signIn(page, "nobody-here@example.test", "definitely-not-the-password");
    await expect(page.getByText(messages.en.auth.errors.invalid_credentials)).toBeVisible();
  });

  test("public registration is closed", async ({ page }) => {
    await useEnglish(page);
    await page.goto("/register");
    await expect(page.getByText(messages.en.auth.registrationClosed)).toBeVisible();
  });
});

test.describe("security headers", () => {
  test("responses carry the baseline security headers", async ({ request }) => {
    const response = await request.get("/login");
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-powered-by"]).toBeUndefined();
  });
});
