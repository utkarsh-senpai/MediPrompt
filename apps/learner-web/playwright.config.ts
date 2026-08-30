import { defineConfig, devices } from "@playwright/test";

// E2E + service-worker tests. Runs against the production preview build.
// CI installs the pinned Playwright package's Chromium build; not part of `pnpm test`.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4173/MediPrompt/",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm preview --port 4173 --strictPort",
    url: "http://localhost:4173/MediPrompt/",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
