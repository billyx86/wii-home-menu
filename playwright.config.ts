import { defineConfig, devices } from "playwright/test";

/**
 * Playwright config (#8 — e2e coverage).
 *
 * Spins up the real dev server and runs the menu suite against it. CI keeps
 * the repo's live-preview port contract (8080); locally the port can be
 * shifted via `E2E_PORT` if 8080 is taken by another service. The app is
 * self-contained (PGLite fallback when DATABASE_URL is unset), so no
 * additional services or env are needed in CI.
 */
const port = Number(process.env.E2E_PORT ?? 8080);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    // Each worker needs its own isolated origin state for the
    // localStorage-persistence tests.
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npx vite dev --host 0.0.0.0 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // Vite dev on this repo is fast; give the TanStack Start SSR boot some room.
    stdout: "pipe",
  },
});
