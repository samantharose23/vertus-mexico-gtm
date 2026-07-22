---
name: Workflow env rebuild stall workaround
description: What to do when restart_workflow keeps timing out on "run environment to rebuild"
---
When every `restart_workflow` call fails with TIMED_OUT "waiting for run environment to rebuild" for a long stretch, it is a platform-side stall — retrying, killing processes, and freeing ports do not help.

**Why:** Hit multi-hour stalls where web/api/test workflows all failed to restart; ports were free and load was idle the whole time.

**How to apply:** Verify work without workflows: run the dev server manually in the SAME bash session as the check (background `&` processes are killed when the bash command exits), passing required env vars (`PORT`, `BASE_PATH` for vertus vite). If even same-session servers get reaped, fall back to `pnpm build` (with `PORT` + `BASE_PATH`) and inspect the dist output — Vite builds are deterministic, so an identical bundle hash proves the source matches. Screenshot directly with `@playwright/test` (script must live inside the artifact dir for module resolution) using the nix chromium via `executablePath` + `--no-sandbox`.

**Update (Jul 2026):** the stall persists even with a 300s restart timeout and with all ports free; a successful `pnpm build` in the same session confirms the container itself is healthy. Only remedies are waiting for the platform to clear or the user stopping/reopening the workspace from the Replit UI — nothing inside the container fixes it.

**Gotcha:** never run `pkill -f vite` (or any substring of your own command line) inside the bash tool — it matches the parent shell command and kills your own session with exit 143.
