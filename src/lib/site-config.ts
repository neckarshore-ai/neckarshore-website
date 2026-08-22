/**
 * Site-wide configuration constants.
 *
 * A single home for values that several routes/builders share, so they don't drift
 * across hardcoded copies (the canonical origin is currently re-typed in seo.ts and
 * the schema/* builders — those keep their local copies for now; new consumers use
 * these).
 */

/** Canonical production origin — no trailing slash. */
export const SITE_URL = "https://neckarshore.ai";

/**
 * Site-wide content-revision marker (ISO date) that drives the sitemap `<lastmod>`.
 *
 * Why a constant and not `new Date()`: the sitemap is generated at build time, so a
 * `new Date()` stamps EVERY url with the build timestamp on EVERY deploy — a false
 * "everything changed today" freshness signal a crawler learns to distrust (neckarshore
 * SEO/GEO audit 2026-06-23). A stable, content-derived date fixes that.
 *
 * BUMP THIS on a meaningful content revision (a new or edited page, a copy change) —
 * NOT on every build, and NOT for a stats-only commit. Mirrors OGC's `SITE_UPDATED`
 * (oakwoodgolfclub-website, audit #69).
 *
 * Value = the date of the last content-bearing commit (the /products content + GEO
 * pass, #68–#71, 2026-06-22).
 *
 * Deferred upgrade (additive, not a rewrite): per-page freshness via an optional
 * `updated` field per content entry, `entry.updated ?? SITE_UPDATED`. The report's
 * git-at-build approach (`git log -1 --format=%cI`) was rejected — Vercel builds from a
 * shallow clone, so `git log` collapses to the single deploy commit and the per-page
 * signal is lost. Frontmatter dates are the robust path when the value justifies it.
 */
export const SITE_UPDATED = "2026-08-15";
