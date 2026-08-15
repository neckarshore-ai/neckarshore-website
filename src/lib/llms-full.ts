/**
 * `llms-full.txt` builder — the expanded companion to the derived `/llms.txt` index.
 *
 * `llms.txt` is the derived INDEX (overview + links, see `llms-index.ts`). `llms-full.txt` is the
 * llmstxt.org "full" variant: the same overview followed by the COMPLETE Markdown of
 * every indexable product page that has a source `.md`, so an AI crawler ingests the
 * substance in a single fetch instead of crawling each page.
 *
 * The page set is derived, never hand-listed: `allProductRoutes()` (the exact route set
 * the sitemap exposes — indexable, no externals, no noindex skeletons) is run through
 * `resolveExport()` (the markdown-export resolver). Sub-portals, case studies and
 * `/products` itself carry no `.md` and resolve to `null`, leaving precisely the
 * md-backed product detail pages. Single source of truth → the file cannot drift from
 * the sitemap, from `llms.txt`, or from the per-page Markdown download (AP-1: a new
 * exportable product appears here automatically, with no edit to this file).
 *
 * Build-time only: the route is `force-static`, so the `fs` reads below run at build
 * (where `public/` and `src/content/` exist) and the result is served as a static CDN
 * asset — no runtime compute, no file-tracing, no cookies.
 */
import { resolveExport } from "@/lib/export/resolve";
import { buildLlmsIndexText } from "@/lib/llms-index";
import { allProductRoutes } from "@/lib/portfolio";
import { SITE_UPDATED, SITE_URL } from "@/lib/site-config";

const PAGE_SEPARATOR = "\n\n---\n\n";

/**
 * The curated overview, taken from the SAME builder the `/llms.txt` route serves, so the
 * index and the full file cannot diverge. Until 2026-08-15 this was a `readFileSync` of
 * the static `public/llms.txt`; that file is gone, and with it the last hand-written copy.
 */
function readIndexOverview(): string {
  return buildLlmsIndexText().trim();
}

export function buildLlmsFullText(): string {
  // `exportedAt` carries the STABLE content date (not a build `new Date()`), so the
  // file is byte-deterministic across deploys — same rationale as sitemap lastModified.
  const opts = { baseUrl: SITE_URL, exportedAt: SITE_UPDATED };

  const pages = allProductRoutes()
    .map((path) => resolveExport(path, opts))
    .filter((result): result is NonNullable<typeof result> => result !== null)
    .map((result) => result.markdown.trim());

  const fullContent =
    pages.length > 0
      ? `# Full Page Content${PAGE_SEPARATOR}${pages.join(PAGE_SEPARATOR)}`
      : "# Full Page Content\n\n_(no exportable product pages yet)_";

  return `${readIndexOverview()}${PAGE_SEPARATOR}${fullContent}\n`;
}
