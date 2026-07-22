// HubSpot integration (Replit connector proxy).
// Uses @replit/connectors-sdk which handles identity, token refresh, and auth
// headers automatically. Do not cache the client — tokens expire.
import { ReplitConnectors } from "@replit/connectors-sdk";

// Shared HubSpot property that every form stamps with its own value so leads
// can be segmented by their originating form. Add new dropdown option values
// in HubSpot for each new form; the internal property name stays the same.
export const FORM_SOURCE_PROPERTY = "form_source";

// Single source of truth for every form_source value the code stamps on leads.
//
// HubSpot silently ignores unknown property names and rejects dropdown values
// that don't match an existing option, so a typo here (or a value that was
// never added as a HubSpot dropdown option) would silently break lead
// segmentation with no visible error. To guard against that:
//   1. Forms MUST reference a value from this list instead of a raw string
//      literal, and createHubSpotContact() rejects any value not listed here
//      (catches code-side typos — see assertKnownFormSource).
//   2. verifyFormSourceOptions() compares this list against the actual HubSpot
//      dropdown options and fails loudly on any mismatch (catches a value that
//      exists in code but is missing from HubSpot). Run it as a startup/CI
//      check when HubSpot is reachable.
//
// When adding a new form: add its value here AND create the matching dropdown
// option in HubSpot. Keep the two in sync.
export const FORM_SOURCES = {
  contactUs: "Vertus Mexico Contact Us",
} as const;

export type FormSource = (typeof FORM_SOURCES)[keyof typeof FORM_SOURCES];

// Flat list of the allowed values, derived from the registry above.
export const FORM_SOURCE_VALUES: readonly string[] =
  Object.values(FORM_SOURCES);

export function isKnownFormSource(value: string): value is FormSource {
  return (FORM_SOURCE_VALUES as readonly string[]).includes(value);
}

// Throws loudly if a form is configured with a value that isn't in the
// registry, so a code-side typo fails at submission time instead of silently
// dropping segmentation.
export function assertKnownFormSource(value: string): asserts value is FormSource {
  if (!isKnownFormSource(value)) {
    throw new Error(
      `Unknown ${FORM_SOURCE_PROPERTY} value "${value}". Allowed values: ` +
        `${FORM_SOURCE_VALUES.map((v) => `"${v}"`).join(", ")}. ` +
        `Add it to FORM_SOURCES and create a matching HubSpot dropdown option.`,
    );
  }
}

// Free-text HubSpot contact properties that capture per-lead marketing
// attribution beyond the form name, so founders can build Active Lists
// segmented by landing page or campaign. Unlike FORM_SOURCE_PROPERTY these are
// plain text (not dropdowns), so no matching option needs to exist in HubSpot.
export const LANDING_PAGE_PROPERTY = "landing_page_path";
export const UTM_PROPERTIES = {
  utmSource: "utm_source",
  utmMedium: "utm_medium",
  utmCampaign: "utm_campaign",
  utmTerm: "utm_term",
  utmContent: "utm_content",
} as const;

// Labels used when auto-creating the attribution properties in HubSpot.
const ATTRIBUTION_PROPERTY_DEFS: Array<{ name: string; label: string }> = [
  { name: LANDING_PAGE_PROPERTY, label: "Landing Page Path" },
  { name: UTM_PROPERTIES.utmSource, label: "UTM Source" },
  { name: UTM_PROPERTIES.utmMedium, label: "UTM Medium" },
  { name: UTM_PROPERTIES.utmCampaign, label: "UTM Campaign" },
  { name: UTM_PROPERTIES.utmTerm, label: "UTM Term" },
  { name: UTM_PROPERTIES.utmContent, label: "UTM Content" },
];

export interface LeadAttribution {
  pagePath?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
}

export interface ContactSubmission {
  name: string;
  company: string;
  email: string;
  message: string;
  lang: string;
  // Value of the FORM_SOURCE_PROPERTY dropdown for the form this came from.
  formSource: string;
  // Optional per-lead marketing attribution (landing page + UTM params).
  attribution?: LeadAttribution;
}

function splitName(fullName: string): { firstname: string; lastname: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return { firstname: parts[0] ?? "", lastname: "" };
  }
  return {
    firstname: parts[0] ?? "",
    lastname: parts.slice(1).join(" "),
  };
}

// Property names confirmed to exist in HubSpot this process. Populated lazily
// so we only attempt creation until each attribution property is known-good.
const confirmedProperties = new Set<string>();

// Ensure the given attribution properties exist in HubSpot, creating any that
// are missing. Returns the subset now confirmed to exist. Sending a property
// that doesn't exist would 400 the whole contact create, so callers must only
// send confirmed ones. Failures here are non-fatal: an unconfirmed property is
// simply skipped and retried on a later submission.
async function ensureAttributionProperties(
  connectors: ReplitConnectors,
  names: string[],
): Promise<Set<string>> {
  for (const name of names) {
    if (confirmedProperties.has(name)) continue;
    const def = ATTRIBUTION_PROPERTY_DEFS.find((d) => d.name === name);
    if (!def) continue;
    try {
      const res = await connectors.proxy(
        "hubspot",
        "/crm/v3/properties/contacts",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: def.name,
            label: def.label,
            type: "string",
            fieldType: "text",
            groupName: "contactinformation",
          }),
        },
      );
      // 2xx = created; 409 = already exists. Both mean it's usable.
      if (res.ok || res.status === 409) {
        confirmedProperties.add(name);
      }
    } catch {
      // Leave unconfirmed; skip this property for now and retry next time.
    }
  }
  return confirmedProperties;
}

function attributionValues(
  attribution: LeadAttribution | undefined,
): Record<string, string> {
  if (!attribution) return {};
  const values: Record<string, string> = {};
  if (attribution.pagePath) values[LANDING_PAGE_PROPERTY] = attribution.pagePath;
  if (attribution.utmSource) values[UTM_PROPERTIES.utmSource] = attribution.utmSource;
  if (attribution.utmMedium) values[UTM_PROPERTIES.utmMedium] = attribution.utmMedium;
  if (attribution.utmCampaign)
    values[UTM_PROPERTIES.utmCampaign] = attribution.utmCampaign;
  if (attribution.utmTerm) values[UTM_PROPERTIES.utmTerm] = attribution.utmTerm;
  if (attribution.utmContent)
    values[UTM_PROPERTIES.utmContent] = attribution.utmContent;
  return values;
}

export async function createHubSpotContact(
  submission: ContactSubmission,
): Promise<void> {
  // Fail loudly on a code-side typo before we send an unknown value that
  // HubSpot would silently drop, breaking lead segmentation.
  assertKnownFormSource(submission.formSource);

  const connectors = new ReplitConnectors();
  const { firstname, lastname } = splitName(submission.name);

  const properties: Record<string, string> = {
    email: submission.email,
    firstname,
    lastname,
    company: submission.company,
    message: submission.message,
    hs_language: submission.lang === "es" ? "es" : "en",
    [FORM_SOURCE_PROPERTY]: submission.formSource,
  };

  // Attach marketing attribution, but only for properties HubSpot confirms
  // exist — sending an unknown property would fail the whole create.
  const attribution = attributionValues(submission.attribution);
  const attributionNames = Object.keys(attribution);
  if (attributionNames.length > 0) {
    const confirmed = await ensureAttributionProperties(
      connectors,
      attributionNames,
    );
    for (const [name, value] of Object.entries(attribution)) {
      if (confirmed.has(name)) properties[name] = value;
    }
  }

  const response = await connectors.proxy(
    "hubspot",
    "/crm/v3/objects/contacts",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ properties }),
    },
  );

  if (response.ok) return;

  // If the contact already exists (409), update it instead of failing.
  if (response.status === 409) {
    const search = await connectors.proxy(
      "hubspot",
      "/crm/v3/objects/contacts/search",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: "email",
                  operator: "EQ",
                  value: submission.email,
                },
              ],
            },
          ],
          properties: ["email"],
          limit: 1,
        }),
      },
    );

    if (search.ok) {
      const found = (await search.json()) as {
        results?: Array<{ id: string }>;
      };
      const id = found.results?.[0]?.id;
      if (id) {
        const update = await connectors.proxy(
          "hubspot",
          `/crm/v3/objects/contacts/${id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ properties }),
          },
        );
        if (update.ok) return;
        const updateBody = await update.text();
        throw new Error(
          `HubSpot contact update failed (${update.status}): ${updateBody}`,
        );
      }
    }
  }

  const body = await response.text();
  throw new Error(`HubSpot contact create failed (${response.status}): ${body}`);
}

// Fetches the dropdown option values currently defined for the form_source
// property in HubSpot.
export async function fetchFormSourceOptions(): Promise<string[]> {
  const connectors = new ReplitConnectors();
  const response = await connectors.proxy(
    "hubspot",
    `/crm/v3/properties/contacts/${FORM_SOURCE_PROPERTY}`,
    { method: "GET" },
  );

  if (response.status === 404) {
    throw new Error(
      `HubSpot property "${FORM_SOURCE_PROPERTY}" does not exist. ` +
        `Create it as a dropdown property before segmenting leads by form.`,
    );
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to read HubSpot property "${FORM_SOURCE_PROPERTY}" ` +
        `(${response.status}): ${body}`,
    );
  }

  const property = (await response.json()) as {
    options?: Array<{ value?: string }>;
  };
  return (property.options ?? [])
    .map((o) => o.value)
    .filter((v): v is string => typeof v === "string");
}

// Compares the code's registry of form_source values against the dropdown
// options actually configured in HubSpot and throws loudly if any registered
// value is missing. Intended to run as a startup/CI check when HubSpot is
// reachable, so a typo or forgotten dropdown option is caught explicitly
// instead of silently dropping segmentation for that form.
export async function verifyFormSourceOptions(): Promise<void> {
  const hubspotOptions = new Set(await fetchFormSourceOptions());
  const missing = FORM_SOURCE_VALUES.filter((v) => !hubspotOptions.has(v));

  if (missing.length > 0) {
    throw new Error(
      `HubSpot ${FORM_SOURCE_PROPERTY} dropdown is missing option(s): ` +
        `${missing.map((v) => `"${v}"`).join(", ")}. ` +
        `Add them in HubSpot (exact match) or fix FORM_SOURCES. ` +
        `HubSpot currently has: ${[...hubspotOptions]
          .map((v) => `"${v}"`)
          .join(", ")}.`,
    );
  }
}
