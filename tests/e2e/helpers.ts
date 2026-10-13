import { expect, type Page } from "@playwright/test";
import { en } from "../../i18n/messages/en";
import { E2E_PASSWORD } from "./seed";

export { en };

export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel(en.auth.email, { exact: true }).fill(email);
  await page.getByLabel(en.auth.password, { exact: true }).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: en.auth.signIn, exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

export function mainNav(page: Page) {
  return page.getByRole("navigation", { name: en.nav.label });
}
