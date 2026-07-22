// First-touch marketing attribution captured in the browser and forwarded to
// the API on contact submission. UTM params are recorded on the first visit of
// a session so a lead stays attributed to the campaign that first brought them,
// even if they navigate before submitting. The page path is read at submit time.

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

type UtmKey = (typeof UTM_KEYS)[number];

const STORAGE_KEY = "vx-attribution";
const MAX_LEN = 255;

export type Attribution = { pagePath: string } & Partial<
  Record<UtmKey, string>
>;

// Record UTM params from the current URL on first load and persist them for the
// session. Safe to call multiple times: first-touch wins, later calls no-op.
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const params = new URLSearchParams(window.location.search);
    const utm: Partial<Record<UtmKey, string>> = {};
    for (const key of UTM_KEYS) {
      const value = params.get(key)?.trim();
      if (value) utm[key] = value.slice(0, MAX_LEN);
    }
    if (Object.keys(utm).length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
    }
  } catch {
    /* noop */
  }
}

// Build the attribution payload for a contact submission: the current page path
// plus any first-touch UTM params captured earlier this session.
export function getAttribution(): Attribution {
  const attribution: Attribution = {
    pagePath: typeof window === "undefined" ? "" : window.location.pathname,
  };
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const utm = JSON.parse(stored) as Partial<Record<UtmKey, string>>;
      for (const key of UTM_KEYS) {
        const value = utm[key];
        if (typeof value === "string" && value) attribution[key] = value;
      }
    }
  } catch {
    /* noop */
  }
  return attribution;
}
