import { expect, type Page } from "@playwright/test";

export const E2E_ORG_SLUG = "e2e-organization";
export const E2E_PASSWORD = "E2e-password-123!";

export const E2E_USERS = {
  admin: { email: "e2e-admin@example.test", name: "E2E Admin", role: "SUPER_ADMIN" },
  accountant: { email: "e2e-accountant@example.test", name: "E2E Accountant", role: "ACCOUNTANT" },
} as const;

/** The UI is driven in English so selectors can use the real translated labels. */
export async function setEnglishLocale(page: Page) {
  await page.context().addCookies([{ name: "locale", value: "en", url: "http://127.0.0.1:3000" }]);
}

/**
 * Forms submit through client-side actions, so clicking before React has hydrated the page does
 * nothing. Waiting for React's internal marker on <main> makes the tests deterministic.
 */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const root = document.querySelector("main") ?? document.body;
    return Object.keys(root).some((key) => key.startsWith("__reactFiber") || key.startsWith("__reactProps"));
  });
}

/** `goto` that also waits for hydration (use before filling in or submitting a form). */
export async function open(page: Page, path: string) {
  const problems: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => problems.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ""}`));
  await page.goto(path);
  try {
    await waitForHydration(page);
  } catch {
    throw new Error(`${path} did not hydrate. Browser problems: ${[...new Set(problems.map((problem) => problem.replace(/id=[^'" ]+/, "id=…")))].join(" | ").slice(0, 1500) || "none reported"}`);
  }
}

export async function signIn(page: Page, email: string, password = E2E_PASSWORD) {
  await setEnglishLocale(page);
  await open(page, "/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

export async function signInAs(page: Page, user: keyof typeof E2E_USERS) {
  await signIn(page, E2E_USERS[user].email);
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Chooses the `<option>` whose text contains `text` (option labels are built from several fields). */
export async function selectByText(page: Page, selector: string, text: string) {
  const option = page.locator(`${selector} option`, { hasText: text }).first();
  await expect(option).toHaveCount(1);
  const value = await option.getAttribute("value");
  if (value === null) throw new Error(`Option "${text}" has no value`);
  await page.locator(selector).selectOption(value);
}

export const unique = (label: string) => `${label} ${Date.now().toString(36)}`;
