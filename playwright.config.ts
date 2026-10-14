import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  // The suite shares one database and one dev server, so tests run one at a time.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  // "github" turns failures into annotations that are readable from the checks API.
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: { baseURL, trace: "retain-on-failure", navigationTimeout: 60_000, actionTimeout: 20_000 },
  // CI runs the production build (see .github/workflows/ci.yml); locally the dev server is the default.
  webServer: { command: process.env.E2E_SERVER_COMMAND ?? "npm run dev", url: baseURL, reuseExistingServer: true, timeout: 180_000 },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
