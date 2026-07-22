/**
 * Per-site configuration for the cookie consent banner.
 *
 * Change these values for each site you install the kit on.
 *
 * NOTE: the GTM container ID is NOT set here — it lives in ONE place:
 * the `GTM_ID` variable at the top of `head-snippet.html` (or your
 * VITE_GTM_ID env var if you use the Vite pattern). See README.md.
 */

/**
 * localStorage key where the visitor's consent choice is persisted.
 * MUST be unique per site so choices don't collide across your sites
 * (e.g. "acme_consent", "mysite_consent").
 */
export const CONSENT_STORAGE_KEY = "SITE_consent"; // <-- RENAME PER SITE

/** Link shown in the banner text. Point at this site's privacy policy. */
export const PRIVACY_POLICY_URL = "https://example.com/privacy-policy"; // <-- SET PER SITE
