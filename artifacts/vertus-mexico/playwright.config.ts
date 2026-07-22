import { defineConfig } from "@playwright/test";

const CHROMIUM_PATH =
  "/nix/store/qa9cnw4v5xkxyip6mb9kxqfq1z4x2dx1-chromium-138.0.7204.100/bin/chromium";

// Unique port per run so concurrent Playwright runs (e.g. the test workflow
// and a CI/validation run) each get their own vite server. Sharing one port
// caused ERR_CONNECTION_REFUSED mid-run when the first run to finish tore
// down the server the other was reusing.
//
// The config is re-evaluated inside every worker process, so the port must be
// pinned once (in the main runner process) via an env var that workers
// inherit — deriving it from process.pid directly would give every worker a
// different baseURL.
if (!process.env.VERTUS_PW_PORT) {
  process.env.VERTUS_PW_PORT = String(3700 + (process.pid % 200));
}
const PORT = Number(process.env.VERTUS_PW_PORT);

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 30_000,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: {
      executablePath: CHROMIUM_PATH,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: `PORT=${PORT} BASE_PATH=/ npx vite --config vite.config.ts --host 0.0.0.0`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 60_000,
    env: {
      PORT: String(PORT),
      BASE_PATH: "/",
      NODE_ENV: "test",
    },
  },
  projects: [
    {
      name: "desktop",
      use: { viewport: { width: 1280, height: 900 } },
    },
    {
      name: "mobile",
      use: { viewport: { width: 390, height: 844 } },
    },
  ],
});
