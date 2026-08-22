"use client";

import { useEffect, useRef } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from "web-vitals";
import { BRAND } from "@/lib/brand";

/**
 * Extract campaign parameters from the current URL (once per page load).
 *
 * `ref` rides along with the five UTM keys because the rauhut.com person anchor links to
 * /ki-beratung as `?ref=rauhut` (decided 2026-08-15). It is CAPTURED on the raw event but
 * NOT aggregated: `/api/track` only rolls up utm_source/medium/campaign. If that link's
 * traffic needs to show up in the aggregate view, the honest fix is to use
 * `utm_source=rauhut` on the link itself — that path is instrumented end to end today.
 * Noted rather than silently assumed, because "the param is captured" and "the param is
 * visible in the numbers" are two different claims.
 */
function getUtmParams(): Record<string, string> {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"]) {
      const val = params.get(key);
      if (val) utm[key] = val;
    }
    return utm;
  } catch {
    return {};
  }
}

/** Cached UTM params — evaluated once when the module loads in the browser. */
let cachedUtm: Record<string, string> | null = null;

function track(event: string, data?: Record<string, unknown>) {
  try {
    if (!cachedUtm) cachedUtm = getUtmParams();

    const source = (navigator as Navigator & { webdriver?: boolean }).webdriver
      ? "playwright"
      : "browser";
    navigator.sendBeacon(
      "/api/track",
      JSON.stringify({
        event,
        page: window.location.pathname,
        referrer: document.referrer || null,
        device: window.innerWidth < 768 ? "mobile" : "desktop",
        timestamp: new Date().toISOString(),
        source,
        // UTM params — only included when present
        ...(Object.keys(cachedUtm).length > 0 ? { utm: cachedUtm } : {}),
        ...data,
      })
    );
  } catch {
    // silently fail — tracking is non-critical
  }
}

export default function TrackerScript() {
  const tracked = useRef(false);

  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    // Page view
    track("page_view");

    // Field Core Web Vitals — real-user LCP/INP/CLS/FCP/TTFB into /api/track.
    // Each library callback fires at most once per page load (LCP/CLS/INP flush
    // on page-hide); we forward the canonical metric name, value + rating.
    // L-NECK-FIELD-WEBVITALS-SELFHOST — €0, first-party, cookie-free.
    const reportVital = (m: Metric) =>
      track("web_vital", { metric: m.name, value: m.value, rating: m.rating, id: m.id });
    onLCP(reportVital);
    onINP(reportVital);
    onCLS(reportVital);
    onFCP(reportVital);
    onTTFB(reportVital);

    // Scroll depth
    const thresholds = [25, 50, 75, 100];
    const fired = new Set<number>();

    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.round((scrollTop / docHeight) * 100);

      for (const t of thresholds) {
        if (pct >= t && !fired.has(t)) {
          fired.add(t);
          track("scroll_depth", { depth: t });
        }
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // Click tracking — differentiate nav clicks from CTA clicks
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("[data-track]");
      if (target) {
        const action = target.getAttribute("data-track") || "";
        if (action.startsWith("nav_")) {
          track("nav_click", { action });
        } else {
          track("cta_click", { action });
        }
      }
    };

    document.addEventListener("click", onClick);

    // Section visibility — fire once per section when 40% visible
    const sectionIds = [
      "services",
      "why-nearshore",
      BRAND.SECTION_ID,
      "founder",
      "cta",
      "faq",
    ];
    const seenSections = new Set<string>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seenSections.has(entry.target.id)) {
            seenSections.add(entry.target.id);
            track("section_view", { section: entry.target.id });
          }
        }
      },
      { threshold: 0.4 }
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
      observer.disconnect();
    };
  }, []);

  return null;
}
