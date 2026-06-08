import { defineConfig } from "@playwright/test";

// Chromium 149 installed (binary only) on Ubuntu 26.04.
// WebKit / iPhone 12 preset not available; using Chromium + mobile viewport.
// App served at http://localhost:5173/deckgame/

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
    url: "http://localhost:5173/deckgame/",
    reuseExistingServer: true,
    timeout: 30_000,
  },

  projects: [
    {
      name: "mobile-portrait",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
