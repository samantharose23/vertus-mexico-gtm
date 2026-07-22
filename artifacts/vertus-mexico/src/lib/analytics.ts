/**
 * Analytics via Google Tag Manager.
 *
 * GTM is loaded by the consent-guarded snippet in index.html (Consent Mode v2
 * defaults are denied until the visitor accepts via the cookie banner). This
 * module no longer injects GA4 or Clarity directly — those tags live in the
 * GTM container and only fire after consent. Events are pushed to the
 * dataLayer so GTM-managed tags can pick them up as custom triggers.
 */
declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Fire an analytics event by pushing it to the GTM dataLayer. No-op in DEV
 * and safe to call even when GTM is not loaded (the push is just inert).
 */
export function trackEvent(
  name: string,
  params: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return;
  if (import.meta.env.DEV) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...params });
}
