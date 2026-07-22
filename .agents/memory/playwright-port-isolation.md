---
name: Playwright web-server port isolation
description: Why concurrent Playwright runs (workflow + validation) failed with ERR_CONNECTION_REFUSED mid-run, and the env-var port pinning pattern that fixes it.
---

Concurrent Playwright runs sharing one fixed webServer port with `reuseExistingServer: true` fail intermittently: the first run to finish tears down the vite server the other run was reusing, so the surviving run gets `net::ERR_CONNECTION_REFUSED` partway through. This happens whenever the test workflow and the platform's validation run (`pnpm test` on `mark_task_complete`) overlap.

**Why:** Both runs point at the same port; ownership of the server belongs to whichever run started it, and teardown is not coordinated.

**How to apply:** Give each run a unique port — but note the Playwright config file is re-evaluated inside every worker process, so a naive `process.pid`-based port gives each worker a different baseURL (all requests refused). Pin it once in the main runner process via an env var workers inherit:

```ts
if (!process.env.MYAPP_PW_PORT) {
  process.env.MYAPP_PW_PORT = String(3700 + (process.pid % 200));
}
const PORT = Number(process.env.MYAPP_PW_PORT);
```

Then use `PORT` in both `use.baseURL` and `webServer.command`/`port`/`env`. Also: don't restart the test workflow while a validation run is in flight (or vice versa) if ports are still shared.
