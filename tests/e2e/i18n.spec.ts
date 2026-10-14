import { expect, test } from "@playwright/test";
import { messages } from "../../i18n";

test.describe("language and direction", () => {
  for (const [locale, dir] of [
    ["ar", "rtl"],
    ["en", "ltr"],
    ["fa", "rtl"],
  ] as const) {
    test.describe(`browser language ${locale}`, () => {
      test.use({ locale });

      test(`the page uses lang=${locale}, dir=${dir} and a translated title`, async ({ page }) => {
        await page.goto("/login");
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("html")).toHaveAttribute("dir", dir);
        await expect(page).toHaveTitle(messages[locale].common.appName);
        await expect(page.getByRole("heading", { name: messages[locale].auth.loginTitle })).toBeVisible();
      });
    });
  }

  test("the language switcher changes language and direction and is remembered", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "فارسی" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await page.getByRole("button", { name: "English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });
});
