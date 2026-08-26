import { test, expect } from "@playwright/test";
import {
  WEB_VITAL_NAMES,
  isWebVitalName,
  ratingFor,
  percentile,
  summarizeWebVitals,
} from "../../src/lib/web-vitals";
import { TEST_ANALYTICS_READ_TOKEN } from "./analytics-test-token";

// ---------------------------------------------------------------------------
// TC-WV — Field Core Web Vitals (self-hosted via /api/track)
// L-NECK-FIELD-WEBVITALS-SELFHOST. Pure-function units run with no browser
// (Playwright is just the runner); HTTP + browser specs live further down.
// ---------------------------------------------------------------------------

test.describe("TC-WV pure lib — rating thresholds (Google CWV)", () => {
  test("TC-WV-001: ratingFor classifies LCP good/needs-improvement/poor at the boundaries", () => {
    // LCP: good <= 2500ms, poor > 4000ms
    expect(ratingFor("LCP", 2000)).toBe("good");
    expect(ratingFor("LCP", 2500)).toBe("good"); // boundary inclusive
    expect(ratingFor("LCP", 3000)).toBe("needs-improvement");
    expect(ratingFor("LCP", 4000)).toBe("needs-improvement"); // boundary inclusive
    expect(ratingFor("LCP", 5000)).toBe("poor");
  });

  test("TC-WV-002: ratingFor uses metric-specific thresholds (CLS is unitless)", () => {
    // CLS: good <= 0.1, poor > 0.25
    expect(ratingFor("CLS", 0.05)).toBe("good");
    expect(ratingFor("CLS", 0.2)).toBe("needs-improvement");
    expect(ratingFor("CLS", 0.5)).toBe("poor");
    // INP: good <= 200ms, poor > 500ms
    expect(ratingFor("INP", 150)).toBe("good");
    expect(ratingFor("INP", 600)).toBe("poor");
  });
});

test.describe("TC-WV pure lib — percentile (nearest-rank)", () => {
  test("TC-WV-003: percentile picks the nearest-rank value, deterministic", () => {
    expect(percentile([1, 2, 3, 4], 75)).toBe(3);
    expect(percentile([10], 75)).toBe(10);
    expect(percentile([], 75)).toBe(0); // empty guard
    // Unsorted input is handled
    expect(percentile([4, 1, 3, 2], 75)).toBe(3);
  });
});

test.describe("TC-WV pure lib — name guard", () => {
  test("TC-WV-004: isWebVitalName accepts the 5 standard metrics, rejects others", () => {
    for (const name of WEB_VITAL_NAMES) {
      expect(isWebVitalName(name)).toBe(true);
    }
    expect(WEB_VITAL_NAMES).toContain("LCP");
    expect(WEB_VITAL_NAMES).toContain("INP");
    expect(WEB_VITAL_NAMES).toContain("CLS");
    expect(isWebVitalName("FID")).toBe(false); // deprecated, intentionally not tracked
    expect(isWebVitalName("page_view")).toBe(false);
    expect(isWebVitalName(undefined)).toBe(false);
  });
});

test.describe("TC-WV pure lib — summarizeWebVitals (p75 per metric)", () => {
  test("TC-WV-005: groups by metric and reports p75 + count + rating", () => {
    const samples = [
      { metric: "LCP", value: 1000 },
      { metric: "LCP", value: 2000 },
      { metric: "LCP", value: 3000 },
      { metric: "LCP", value: 4500 },
      { metric: "CLS", value: 0.05 },
      { metric: "CLS", value: 0.3 },
    ];
    const summary = summarizeWebVitals(samples);

    // LCP: nearest-rank p75 of [1000,2000,3000,4500] = ceil(0.75*4)=3 -> 3000
    expect(summary.LCP?.count).toBe(4);
    expect(summary.LCP?.p75).toBe(3000);
    expect(summary.LCP?.rating).toBe("needs-improvement");

    // CLS: p75 of [0.05,0.3] = ceil(0.75*2)=2 -> 0.3 -> poor
    expect(summary.CLS?.count).toBe(2);
    expect(summary.CLS?.p75).toBe(0.3);
    expect(summary.CLS?.rating).toBe("poor");
  });

  test("TC-WV-006: ignores unknown metrics and non-numeric values", () => {
    const summary = summarizeWebVitals([
      { metric: "LCP", value: 1200 },
      { metric: "FID", value: 50 }, // unknown -> ignored
      { metric: "INP", value: Number.NaN }, // non-finite -> ignored
      // @ts-expect-error — runtime guard must survive a bad value type
      { metric: "TTFB", value: "fast" },
    ]);
    expect(summary.LCP?.count).toBe(1);
    // FID ist KEIN bekannter Schluessel mehr (web-vitals hat es fallen lassen) — genau
    // das prueft dieser Test. Der Zugriff geht deshalb ueber eine geweitete Sicht, sonst
    // meldet die Typpruefung den Kern der Zusicherung als Fehler.
    expect((summary as Record<string, unknown>).FID).toBeUndefined();
    expect(summary.INP).toBeUndefined();
    expect(summary.TTFB).toBeUndefined();
  });

  test("TC-WV-007: rounds ms metrics to integers, CLS to 3 decimals", () => {
    const summary = summarizeWebVitals([
      { metric: "LCP", value: 1234.7 },
      { metric: "CLS", value: 0.12345 },
    ]);
    expect(summary.LCP?.p75).toBe(1235);
    expect(summary.CLS?.p75).toBe(0.123);
  });
});

// ---------------------------------------------------------------------------
// HTTP contract — /api/track accepts web_vital events + GET surfaces a summary
// ---------------------------------------------------------------------------
const ENDPOINT = "/api/track";

test.describe("TC-WV HTTP — /api/track web_vital ingestion", () => {
  test("TC-WV-010: POST a web_vital event returns 200 (event accepted)", async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: {
        event: "web_vital",
        metric: "LCP",
        value: 2200,
        rating: "good",
        id: "v1-test-001",
        page: "/",
        source: "playwright",
      },
    });
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  test("TC-WV-011: POST with an invalid metric name is rejected (400)", async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      data: { event: "web_vital", metric: "FID", value: 50, source: "playwright" },
    });
    expect(res.status()).toBe(400);
  });

  test("TC-WV-012: authenticated GET surfaces a webVitals p75 summary", async ({ request }) => {
    // Token provisioned on the managed dev server via playwright.config.ts
    // webServer.env — this authenticated /api/track GET runs for real in CI
    // (WO-2 #400), no skip on an unset secret. Local-only spec (never @smoke),
    // so the fixture token is always the one the server was started with.

    // Seed two LCP samples so p75 is well-defined.
    for (const value of [1800, 2600]) {
      const res = await request.post(ENDPOINT, {
        data: { event: "web_vital", metric: "LCP", value, rating: "good", source: "playwright" },
      });
      expect(res.status()).toBe(200);
    }

    const res = await request.get(`${ENDPOINT}?include_test=true`, {
      headers: { Authorization: `Bearer ${TEST_ANALYTICS_READ_TOKEN}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();

    expect(body).toHaveProperty("webVitals");
    expect(body.webVitals.LCP).toBeDefined();
    expect(body.webVitals.LCP.count).toBeGreaterThanOrEqual(2);
    expect(typeof body.webVitals.LCP.p75).toBe("number");
    expect(["good", "needs-improvement", "poor"]).toContain(body.webVitals.LCP.rating);
  });
});

// ---------------------------------------------------------------------------
// Browser emission — the homepage actually beacons field web_vital events
// ---------------------------------------------------------------------------
test.describe("TC-WV browser — TrackerScript emits web_vital beacons", () => {
  test("TC-WV-020: loading the homepage sends at least one valid web_vital beacon", async ({ page }) => {
    const vitals: Array<{ metric: string; value: number; rating?: string }> = [];

    page.on("request", (req) => {
      if (req.method() !== "POST") return;
      if (!req.url().includes("/api/track")) return;
      const raw = req.postData();
      if (!raw) return;
      try {
        const body = JSON.parse(raw);
        if (body.event === "web_vital") vitals.push(body);
      } catch {
        /* ignore non-JSON */
      }
    });

    await page.goto("/");
    // FCP/TTFB report shortly after load; LCP/CLS/INP flush on page-hide — a
    // same-origin navigation triggers that flush so the test isn't flaky.
    await page.waitForTimeout(500);
    await page.goto("/impressum");

    await expect
      .poll(() => vitals.length, { timeout: 10_000 })
      .toBeGreaterThanOrEqual(1);

    for (const v of vitals) {
      expect(WEB_VITAL_NAMES).toContain(v.metric);
      expect(typeof v.value).toBe("number");
      expect(Number.isFinite(v.value)).toBe(true);
    }
  });
});
