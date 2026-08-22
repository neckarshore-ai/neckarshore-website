// Shared constants and utilities for E2E tests

import sitemapModule from "@/app/sitemap";

/**
 * THREE pages, not "all public pages" — the old comment claimed the latter and was
 * wrong by 25 addresses. Seven specs iterate this list; it stays a hand-picked trio
 * (homepage plus the two legal pages) because those specs make assertions that only
 * hold for them. Whatever needs EVERY address uses `ALL_ROUTES` below.
 */
export const PAGES = ["/", "/impressum", "/datenschutz"] as const;

/**
 * Every address of the site, derived from the sitemap source — the same source the
 * contrast watcher reads (`scripts/check-contrast.mjs`).
 *
 * WHY DERIVED AND NOT LISTED. `accessibility.spec.ts` hardcoded the three PAGES above
 * and was therefore blind on 25 of 28 addresses. That blindness is exactly why a
 * contrast violation sat on the live site for months. A derived list checks a new page
 * because it EXISTS, not because someone remembered to add it to a constant.
 *
 * The interop dance is not decoration: under some loaders this TypeScript module comes
 * back as a namespace, so the default export sits one level deeper than an ESM import
 * promises. Reaching for `sitemap()` directly then throws — and the throw is the good
 * case. Silently resolving to something falsy would produce an empty address list and a
 * triumphantly green run over nothing at all.
 *
 * Pathnames, never the absolute URLs the sitemap emits: those carry SITE_URL, so a spec
 * navigating to them would leave the local server and test PRODUCTION from a local run.
 */
export const ALL_ROUTES: readonly string[] = (() => {
  const sitemap =
    typeof sitemapModule === "function"
      ? sitemapModule
      : (sitemapModule as { default?: () => { url: string }[] })?.default;
  if (typeof sitemap !== "function") {
    throw new Error("sitemap-Quelle liefert keine Funktion — Adressliste waere leer");
  }
  const paths = sitemap().map((entry: { url: string }) => new URL(entry.url).pathname);
  if (paths.length === 0) throw new Error("sitemap-Quelle liefert null Adressen");
  return [...new Set(paths)].sort();
})();

/** Data-driven viewports from StatCounter Germany Feb 2026 */
export const VIEWPORTS = [
  { name: "iPhone 15 Pro", width: 393, height: 852 },
  { name: "iPhone 14 Plus", width: 414, height: 896 },
  { name: "iPad Mini", width: 768, height: 1024 },
] as const;

/** Homepage anchor sections */
export const SECTIONS = ["services", "why-nearshore", "omnopsis", "founder"] as const;

/** Calendly booking URL */
export const CALENDLY_URL = "https://calendly.com/rauhut/20min";

/** Scroll/navigation timeout */
export const SCROLL_TIMEOUT = 5000;

/** WCAG AA minimum contrast ratio for normal text */
export const WCAG_AA_RATIO = 4.5;

// --- WCAG contrast utilities ---

function parseRgb(rgb: string): [number, number, number] {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

function luminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Calculate WCAG 2.1 contrast ratio between two rgb() color strings */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(parseRgb(fg));
  const l2 = luminance(parseRgb(bg));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

