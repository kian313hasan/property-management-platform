import { defineConfig, devices } from "@playwright/test";

const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  // The flows share one seeded database and one dev server, so they run one at a time for stability.
  fullyParallel: false,
  workers: 1,
  retries: isCi ? 1 : 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  // `github` turns failures into annotations on the CI run; `list` is the readable local output.
  reporter: isCi ? [["github"], ["list"]] : [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: "http://127.0.0.1:3000",
    locale: "en-US",
    trace: "retain-on-failure",
    navigationTimeout: 60_000,
  },
  webServer: { command: "npm run dev", url: "http://127.0.0.1:3000", reuseExistingServer: true, timeout: 180_000 },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
