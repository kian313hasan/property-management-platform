import { test, expect } from "@playwright/test";
test("public application shell responds", async ({ page }) => { await page.goto("/"); await expect(page).toHaveTitle(/property management/i); });
