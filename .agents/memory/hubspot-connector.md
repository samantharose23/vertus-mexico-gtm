---
name: HubSpot via connectors proxy
description: How the HubSpot integration works in this repl (Replit connectors proxy, not the HubSpot SDK).
---

# HubSpot integration

The HubSpot connector in this repl is used through `@replit/connectors-sdk`'s
`ReplitConnectors().proxy("hubspot", path, {method, headers, body})`, NOT through
`@hubspot/api-client`. The `addIntegration` rendered snippet points at the proxy
pattern. `.proxy()` returns a standard `fetch` `Response` (`.ok`, `.status`,
`.json()`, `.text()`).

**Why:** The proxy injects OAuth + refresh automatically; no token handling in app code.

**How to apply:**
- Server-side only. Live client SDK usage belongs in the api-server, never the browser.
- Contact creation: POST `/crm/v3/objects/contacts` with `{ properties: {...} }`.
  On 409 (already exists), search by email then PATCH `/crm/v3/objects/contacts/{id}`.
- The connection was already bound at the account level, so submissions returned
  200 without needing `proposeIntegration`. If runtime later fails with "not
  connected", call `proposeIntegration` on the connection id to re-bind.
