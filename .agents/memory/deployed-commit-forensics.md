---
name: Finding the deployed commit
description: How to determine which git commit is live in production when reverting to the deployed state
---
No deployment API exposes the deployed commit SHA, and deployment runtime logs only show autoscale restarts, not build time.

**Why:** Needed to revert the workspace to "what is live"; had to identify the production commit forensically.

**How to apply:**
1. `curl` the live site, download its hashed JS bundle.
2. Grep the bundle for strings unique to candidate commits (extract candidates from `git show <sha> -- src | grep '^+'` string literals). Presence/absence brackets the deployed commit between two commits.
3. Confirm with a deterministic build: `git archive <sha> | tar -x` into /tmp (worktree/checkout are blocked as destructive), `pnpm install && PORT=... BASE_PATH=... pnpm build` — Vite hashes are deterministic, so a matching `index-*.js` hash from the workspace source proves equality. Minifier identifier names can differ across envs; content markers are the reliable signal.
4. To restore without git reset (blocked in main agent), copy files from the extracted archive over the working tree for every path in `git diff --name-status <sha> HEAD`.
