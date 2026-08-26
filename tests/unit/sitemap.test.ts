/**
 * Unit tests for the dynamic sitemap (src/app/sitemap.ts).
 *
 * The bug this guards (SEO/GEO audit 2026-06-23): the sitemap stamped
 * `lastModified = new Date()` on every entry, so every url carried the BUILD
 * timestamp and "changed" on every deploy — a false freshness signal Google
 * learns to distrust. The fix stamps the stable, content-derived SITE_UPDATED.
 *
 * Why assert against the CONSTANT, not a fetch-twice comparison: the sitemap is
 * generated once at build time, so `new Date()` freezes per build — two reads in
 * the same process return the SAME value and a fetch-twice test stays green WITH
 * the bug. Asserting `lastmod === SITE_UPDATED` (≠ today) is what actually catches it.
 *
 * Run: `npm run test:unit`
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import sitemap from "../../src/app/sitemap";
import { SITE_UPDATED, SITE_URL } from "../../src/lib/site-config";

test("TC-SEO-023: every sitemap entry stamps the stable SITE_UPDATED lastmod, not the build clock", () => {
  const entries = sitemap();
  assert.ok(entries.length > 0, "sitemap should not be empty");

  const expected = new Date(SITE_UPDATED).getTime();
  for (const entry of entries) {
    assert.ok(entry.lastModified, `${entry.url} is missing lastModified`);
    assert.equal(
      new Date(entry.lastModified as string | Date).getTime(),
      expected,
      `${entry.url} lastmod must equal SITE_UPDATED (${SITE_UPDATED}), not today's build date`,
    );
  }
});

test("TC-SEO-024: homepage entry keeps its load-bearing trailing slash", () => {
  // The slash on the homepage <loc> is load-bearing: it keeps the homepage off the
  // bare-external-domain form that website-case-study.spec.ts TC-CNT-054 forbids.
  const urls = sitemap().map((e) => e.url);
  assert.ok(
    urls.includes(`${SITE_URL}/`),
    `homepage must be listed as ${SITE_URL}/ (trailing slash load-bearing for TC-CNT-054)`,
  );
  assert.ok(
    !urls.includes(SITE_URL),
    `bare ${SITE_URL} (no slash) must not be a sitemap <loc>`,
  );
});
