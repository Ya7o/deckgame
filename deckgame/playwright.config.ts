import { defineConfig, devices } from "@playwright/test";

// NOTE: Playwright browser installation requires Ubuntu >= 27 or Debian.
// On Ubuntu 26.04 (this dev environment), npx playwright install chromium
// fails with "not supported on ubuntu26.04-x64".
// Tests are written and ready; run once the environment supports it.
// For live verification on Ubuntu 26.04, see reports/patch-0017.

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 0,
  workers: 1,

  use: {
    baseURL: "http://localhost:5173",
    locale: "fr-FR",
  },

  webServer: {
    command: "npm run dev -- --host 0.0.0.0 --port 5173",
    url: "http://localhost:5173",
    reuseExistingServer: true,
    timeout: 30_000,
  },

  projects: [
    {
      name: "mobile-portrait",
      use: { ...devices["iPhone 12"] },
    },
  ],
});
