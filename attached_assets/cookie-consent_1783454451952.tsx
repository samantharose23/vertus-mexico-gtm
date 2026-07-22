/**
 * Cookie consent banner — GDPR-aligned, wired to Google Consent Mode v2.
 *
 * Portable React component. Pairs with:
 *   - head-snippet.html   (Consent Mode defaults + guarded GTM loader — MUST be in <head>)
 *   - cookie-consent.css  (banner styles — import it or paste into your stylesheet)
 *   - consent.config.ts   (per-site storage key + privacy policy URL)
 *
 * How it works:
 *   - First visit: shows the banner (defaults in the head snippet already denied everything).
 *   - Accept / Reject / Save preferences: pushes a Consent Mode "update" plus a
 *     {event:'consent_update'} dataLayer event, and persists the choice in localStorage.
 *   - Returning visit: replays the stored choice silently (no banner).
 *   - A window "open-cookie-settings" CustomEvent reopens the banner with the
 *     preferences panel expanded (wire this to a "Cookie Settings" footer link).
 */
import { useEffect, useState } from "react";
import { CONSENT_STORAGE_KEY, PRIVACY_POLICY_URL } from "./consent.config";

type ConsentValue = "granted" | "denied";

interface StoredConsent {
  analytics: ConsentValue;
  ads: ConsentValue;
  ts: number;
}

function gtag(...args: unknown[]) {
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push(args);
}

function pushConsentUpdate(analytics: ConsentValue, ads: ConsentValue) {
  gtag("consent", "update", {
    analytics_storage: analytics,
    ad_storage: ads,
    ad_user_data: ads,
    ad_personalization: ads,
  });
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: "consent_update",
    analytics_consent: analytics,
    ad_consent: ads,
  });
}

function readConsent(): StoredConsent | null {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredConsent) : null;
  } catch {
    return null;
  }
}

function saveConsent(analytics: ConsentValue, ads: ConsentValue) {
  try {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ analytics, ads, ts: Date.now() }),
    );
  } catch {
    /* ignore storage errors */
  }
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [ads, setAds] = useState(false);

  const openBanner = (showPrefs: boolean) => {
    const prior = readConsent();
    setAnalytics(prior?.analytics === "granted");
    setAds(prior?.ads === "granted");
    setPrefsOpen(showPrefs);
    setShow(true);
  };

  useEffect(() => {
    const prior = readConsent();
    if (prior && prior.analytics && prior.ads) {
      pushConsentUpdate(prior.analytics, prior.ads);
    } else {
      openBanner(false);
    }

    const reopen = () => openBanner(true);
    window.addEventListener("open-cookie-settings", reopen);
    return () => window.removeEventListener("open-cookie-settings", reopen);
  }, []);

  const close = () => {
    setShow(false);
    setPrefsOpen(false);
  };

  const acceptAll = () => {
    pushConsentUpdate("granted", "granted");
    saveConsent("granted", "granted");
    close();
  };

  const rejectAll = () => {
    pushConsentUpdate("denied", "denied");
    saveConsent("denied", "denied");
    close();
  };

  const savePrefs = () => {
    const a: ConsentValue = analytics ? "granted" : "denied";
    const d: ConsentValue = ads ? "granted" : "denied";
    pushConsentUpdate(a, d);
    saveConsent(a, d);
    close();
  };

  if (!show) return null;

  return (
    <div
      id="cookie-consent-banner"
      className={`show${prefsOpen ? " prefs-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Cookie consent"
      aria-live="polite"
      data-testid="banner-cookie-consent"
    >
      <div className="cc-inner">
        <div className="cc-row">
          <div className="cc-text">
            We use cookies for analytics and advertising. We only set them with
            your consent. You can accept all, reject all, or choose by category.
            See our{" "}
            <a
              href={PRIVACY_POLICY_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="link-consent-privacy"
            >
              Privacy&nbsp;Policy
            </a>
            .
          </div>
          <div className="cc-actions">
            <button
              type="button"
              className="cc-manage"
              onClick={() => setPrefsOpen((v) => !v)}
              data-testid="button-consent-manage"
            >
              Manage preferences
            </button>
            <button
              type="button"
              className="cc-reject"
              onClick={rejectAll}
              data-testid="button-consent-reject"
            >
              Reject all
            </button>
            <button
              type="button"
              className="cc-accept"
              onClick={acceptAll}
              data-testid="button-consent-accept"
            >
              Accept all
            </button>
          </div>
        </div>

        <div className="cc-prefs">
          <div className="cc-cat">
            <input type="checkbox" checked disabled readOnly />
            <label>
              <strong>Strictly necessary</strong>
              <span>Required for the site to function. Always on.</span>
            </label>
          </div>
          <div className="cc-cat">
            <input
              type="checkbox"
              id="cc-analytics"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              data-testid="checkbox-consent-analytics"
            />
            <label htmlFor="cc-analytics">
              <strong>Analytics</strong>
              <span>
                Helps us understand how the site is used (Google Analytics).
              </span>
            </label>
          </div>
          <div className="cc-cat">
            <input
              type="checkbox"
              id="cc-ads"
              checked={ads}
              onChange={(e) => setAds(e.target.checked)}
              data-testid="checkbox-consent-ads"
            />
            <label htmlFor="cc-ads">
              <strong>Advertising</strong>
              <span>Used to measure and personalize marketing.</span>
            </label>
          </div>
          <button
            type="button"
            className="cc-accept cc-save"
            onClick={savePrefs}
            data-testid="button-consent-save"
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}
