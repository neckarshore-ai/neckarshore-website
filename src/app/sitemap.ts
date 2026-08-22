import type { MetadataRoute } from "next";
import { allProductRoutes } from "@/lib/portfolio";
import { SITE_UPDATED, SITE_URL } from "@/lib/site-config";

/**
 * Dynamic sitemap — the route set is derived from the portfolio config
 * (allProductRoutes) so it stays in sync as products are added. Replaces static
 * public/sitemap.xml (deleted 2026-04-10).
 *
 * `lastModified` carries the STABLE, content-derived SITE_UPDATED date — NOT a
 * build-time `new Date()`. A per-build timestamp stamped every url as "changed
 * today" on every deploy, a false freshness signal a crawler learns to distrust
 * (SEO/GEO audit 2026-06-23). See site-config.ts for the bump rule + the deferred
 * per-page-freshness upgrade path.
 *
 * Deprecated tags (changefreq, priority) intentionally omitted — Google has
 * ignored them since 2023. Only <loc> and <lastmod> carry signal.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const lastModified = new Date(SITE_UPDATED);

  const paths = [
    "/impressum",
    "/datenschutz",
    "/commits", // commit activity over time — the "how this was built" proof surface
    "/test-management", // the "Wie wir testen" detail surface (#245) — a citable GEO target
    "/repositories", // the public repository inventory (#7), auto-synced from GitHub
    "/ki-beratung", // the buyer-visible page for the KI-Potenzialanalyse (funnel Wave 1)
    // /products, the 4 sub-portals, and the bespoke own-page details (omnopsis, clearpath).
    // External sites + noindex preview skeletons are excluded by allProductRoutes().
    ...allProductRoutes(),
  ].sort((a, b) => a.localeCompare(b));

  return [
    { url: `${baseUrl}/`, lastModified },
    ...paths.map((path) => ({ url: `${baseUrl}${path}`, lastModified })),
  ];
}
