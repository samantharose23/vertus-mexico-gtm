import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

// Production origin. Override with VITE_SITE_URL for a custom domain.
const rawUrl = process.env.VITE_SITE_URL || "https://vertus-mexico.replit.app";
const origin = rawUrl.replace(/\/+$/, "");
const today = new Date().toISOString().slice(0, 10);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <url>
    <loc>${origin}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="es-MX" href="${origin}/?lang=es"/>
    <xhtml:link rel="alternate" hreflang="en" href="${origin}/?lang=en"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}/"/>
  </url>
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;

writeFileSync(join(publicDir, "sitemap.xml"), sitemap);
writeFileSync(join(publicDir, "robots.txt"), robots);
console.log(`[gen-sitemap] wrote sitemap.xml + robots.txt for ${origin}`);
