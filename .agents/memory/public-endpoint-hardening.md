---
name: Public write endpoints need server-side anti-abuse
description: Client-only spam protections are bypassable; harden public POST endpoints on the server.
---

# Harden public write endpoints server-side

A client-only honeypot (a hidden field checked in the browser) is trivially
bypassed by direct POSTs. Any unauthenticated write endpoint (e.g. a contact
form hitting a CRM/connector) needs server-side protection.

**Why:** Without it, bots flood the endpoint and can exhaust downstream
connector/CRM quotas. Flagged in review of the vertus-mexico contact form.

**How to apply:**
- Send the honeypot value to the server; reject silently (return 200 ok) when filled.
- Enforce max lengths on every field.
- Add a per-IP rate limiter. Read the client IP from `x-forwarded-for` since the
  app runs behind the Replit proxy.
- Back the per-IP limiter with a shared store (e.g. a Postgres hit-rows table),
  not a bare in-process Map, or the effective limit multiplies as the deployment
  scales out. Make the check atomic: a plain count-then-insert races under
  concurrency and lets bursts slip past the threshold — serialize per IP with
  `pg_advisory_xact_lock` inside a transaction (or use an atomic upsert/INCR).
  Keep a per-process in-memory fallback only for DB outages, and throttle the
  outage log so a sustained failure can't flood logs.
