import type { Content, Lang } from "./content";

function upsertMeta(
  attr: "name" | "property",
  key: string,
  value: string,
): void {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`,
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function upsertLink(
  rel: string,
  href: string,
  hreflang?: string,
): void {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    if (hreflang) el.setAttribute("hreflang", hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Runtime SEO head management. Keeps title, description, Open Graph / Twitter
 * tags, canonical + hreflang alternates, and JSON-LD Organization schema in
 * sync with the active language. Uses window.location.origin so canonical/OG
 * URLs are always correct regardless of the deployed domain.
 */
export function applySeo(lang: Lang, c: Content): void {
  if (typeof window === "undefined") return;

  const base = import.meta.env.BASE_URL || "/";
  const origin = window.location.origin;
  const rootUrl = `${origin}${base}`.replace(/\/+$/, "/") || `${origin}/`;
  const canonical = rootUrl;
  const ogImage = `${rootUrl}opengraph.jpg`;

  document.title = c.metaTitle;
  document.documentElement.lang = c.htmlLang;

  upsertMeta("name", "description", c.metaDescription);

  upsertMeta("property", "og:title", c.ogTitle);
  upsertMeta("property", "og:description", c.ogDescription);
  upsertMeta("property", "og:url", canonical);
  upsertMeta("property", "og:image", ogImage);
  upsertMeta("property", "og:locale", c.ogLocale);
  upsertMeta(
    "property",
    "og:locale:alternate",
    lang === "es" ? "en_US" : "es_MX",
  );

  upsertMeta("name", "twitter:title", c.ogTitle);
  upsertMeta("name", "twitter:description", c.ogDescription);
  upsertMeta("name", "twitter:image", ogImage);

  upsertLink("canonical", canonical);
  upsertLink("alternate", `${canonical}?lang=es`, "es-MX");
  upsertLink("alternate", `${canonical}?lang=en`, "en");
  upsertLink("alternate", canonical, "x-default");

  const ld = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Vertus Group Mexico",
    legalName: "Vertus Group Mexico",
    url: canonical,
    logo: `${rootUrl}assets/vertus-logo.png`,
    description: c.metaDescription,
    areaServed: "MX",
    parentOrganization: {
      "@type": "Organization",
      name: "The Vertus Group",
      url: "https://www.thevertusgroup.com/",
    },
    sameAs: [
      "https://www.thevertusgroup.com/",
      "https://www.thevertusgroup.com/our-team.htm",
    ],
  };
  let script = document.getElementById(
    "ld-org",
  ) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "ld-org";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(ld);
}
