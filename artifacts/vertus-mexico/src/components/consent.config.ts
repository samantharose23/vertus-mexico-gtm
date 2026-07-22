/**
 * Per-site configuration for the cookie consent banner.
 *
 * NOTE: the GTM container ID is NOT set here — it lives in the VITE_GTM_ID
 * env var (read by index.html's head snippet and noscript fallback).
 */

/**
 * localStorage key where the visitor's consent choice is persisted.
 * Unique to this site so choices don't collide across sites.
 */
export const CONSENT_STORAGE_KEY = "vertus_consent";

/**
 * Link shown in the banner text. Point at this site's privacy policy.
 * Leave empty ("") to hide the link until a policy URL is available.
 */
export const PRIVACY_POLICY_URL = "";
