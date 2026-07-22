import { Router, type IRouter } from "express";
import { createHubSpotContact, FORM_SOURCES } from "../lib/hubspot";
import { isRateLimited } from "../lib/rateLimit";

const router: IRouter = Router();

// This form's value for the shared HubSpot form_source property. Referenced
// from the FORM_SOURCES registry (single source of truth) rather than a raw
// string literal so a typo is caught by the guard instead of silently
// breaking segmentation. HubSpot must have a matching dropdown option.
const CONTACT_FORM_SOURCE = FORM_SOURCES.contactUs;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MAX = {
  name: 120,
  company: 160,
  email: 254,
  message: 5000,
} as const;

// Attribution values are free text stored on the contact; cap them so a crafted
// request can't push oversized values into HubSpot.
const ATTR_MAX = 255;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function attrString(value: unknown): string {
  return asString(value).slice(0, ATTR_MAX);
}

router.post("/contact", async (req, res) => {
  // Honeypot: bots fill hidden fields. Silently accept and drop.
  if (asString(req.body?.website) !== "") {
    return res.status(200).json({ ok: true });
  }

  const ip =
    (req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
      req.ip ||
      "unknown");
  if (await isRateLimited(ip)) {
    return res
      .status(429)
      .json({ ok: false, error: "Too many requests. Please try again soon." });
  }

  const name = asString(req.body?.name);
  const company = asString(req.body?.company);
  const email = asString(req.body?.email);
  const message = asString(req.body?.message);
  const lang = asString(req.body?.lang) === "es" ? "es" : "en";

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing required fields." });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ ok: false, error: "Invalid email address." });
  }
  if (
    name.length > MAX.name ||
    company.length > MAX.company ||
    email.length > MAX.email ||
    message.length > MAX.message
  ) {
    return res
      .status(400)
      .json({ ok: false, error: "One or more fields are too long." });
  }

  try {
    await createHubSpotContact({
      name,
      company,
      email,
      message,
      lang,
      formSource: CONTACT_FORM_SOURCE,
      attribution: {
        pagePath: attrString(req.body?.pagePath),
        utmSource: attrString(req.body?.utm_source),
        utmMedium: attrString(req.body?.utm_medium),
        utmCampaign: attrString(req.body?.utm_campaign),
        utmTerm: attrString(req.body?.utm_term),
        utmContent: attrString(req.body?.utm_content),
      },
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "HubSpot contact submission failed");
    return res
      .status(502)
      .json({ ok: false, error: "Unable to submit at this time." });
  }
});

export default router;
