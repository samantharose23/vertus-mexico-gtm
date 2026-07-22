---
name: HubSpot lead attribution properties
description: How per-lead marketing attribution (landing page + UTM) is captured and stored on HubSpot contacts.
---

# HubSpot lead attribution

Beyond the single `form_source` dropdown stamp, contacts also carry free-text
attribution properties: `landing_page_path`, `utm_source`, `utm_medium`,
`utm_campaign`, `utm_term`, `utm_content`. The client captures first-touch UTMs
(persisted in sessionStorage) and the page path at submit; the api-server
forwards them.

**Why chose free-text (not dropdowns):** dropdowns require pre-created options
in HubSpot and break silently on typos/missing options. Text properties accept
any value, so campaigns don't need setup per value.

**How to apply:**
- Sending a property that does NOT exist in HubSpot 400s the ENTIRE contact
  create. So attribution properties are auto-created on demand via
  POST `/crm/v3/properties/contacts` (type `string`, fieldType `text`,
  groupName `contactinformation`), treating 2xx and 409 as "exists". Results are
  cached per-process in a Set; only confirmed properties get attached to the
  create payload. An unconfirmed property is skipped, not fatal.
- Empty/blank attribution values are omitted so unset UTMs stay `null` in HubSpot.
- Do not remove/rename these without also updating any HubSpot Active Lists that
  segment on them.
