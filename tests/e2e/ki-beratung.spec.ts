import { test, expect } from "@playwright/test";

/**
 * /ki-beratung — the buyer-visible offer page (funnel Wave 1).
 *
 * WHAT THESE TESTS ARE FOR, stated plainly so a later reader does not mistake their scope:
 * they guard the three properties of this page that are DECISIONS rather than design —
 * the CTA duration, the pricing guardrail, and the non-scope block's presence. They do not
 * assert that the copy is good; that is the Founder's call, not a test's.
 *
 * WHAT THEY CANNOT DO: they check named strings, not the class. A new sentence that
 * contradicts something elsewhere on the site still passes. Same honest limitation the
 * llms-claims guard carries, written here for the same reason.
 */
test.describe("KI-Beratung offer page", () => {
  test("TC-CNT-087: /ki-beratung serves 200 with the job-language headline", async ({
    page,
  }) => {
    const res = await page.goto("/ki-beratung");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText(
      "Wo lohnen KI-Agenten in Ihren Prozessen?",
    );
  });

  test("TC-CNT-088: the CTA says 20 minutes and links the 20-min Calendly", async ({
    page,
  }) => {
    // THE POINT OF THIS TEST: the source one-pager promises 30 minutes, the site says 20
    // everywhere, and honesty fix #4 (shipped 2026-08-06, PR #165) is what made it 20.
    // A page that reintroduces "30 Minuten" would re-open a closed correction — and it
    // would do so in the most visible place we have.
    await page.goto("/ki-beratung");
    const body = (await page.locator("main").textContent()) ?? "";
    expect(body).toContain("20 Minuten");
    expect(body).not.toContain("30 Minuten");

    const cta = page.locator('[data-track="kiberatung_cta_erstgespraech"]');
    await expect(cta).toHaveAttribute("href", "https://calendly.com/rauhut/20min");
  });

  test("TC-CNT-089: exactly one conversion route — no second CTA target", async ({
    page,
  }) => {
    // "One CTA" is a decision from the plan (Wave 1, item 5), not a layout preference.
    //
    // SCOPED TO <main> ON PURPOSE: the site-wide Nav carries its own Kennenlerntermin
    // button (desktop + mobile), so a page-wide count would assert something this test
    // does not mean. The claim is "the PAGE offers one route", not "the document contains
    // one link" — the first version of this test conflated the two and went red, which is
    // how the distinction got written down.
    await page.goto("/ki-beratung");
    const calendlyLinks = page.locator('main a[href*="calendly.com"]');
    await expect(calendlyLinks).toHaveCount(1);
  });

  test("TC-CNT-090: the pricing guardrail holds — ranges only, never the internals", async ({
    page,
  }) => {
    // C6 (Founder 2026-08-07): the pricing FORMULA, the 2x check and the 700-EUR floor
    // never appear in a public artifact. This asserts the negative directly, because the
    // cost of getting it wrong is not a broken layout — it is an internal calculation
    // published on the open web.
    await page.goto("/ki-beratung");
    const body = (await page.locator("body").textContent()) ?? "";
    expect(body).toContain("2.000–3.000 EUR");
    expect(body).toContain("3.500–5.000 EUR");
    expect(body).not.toMatch(/700\s*EUR/);
    expect(body).not.toMatch(/\b2x[- ]Check\b/i);
  });

  test("TC-CNT-091: the non-scope block is present with all three items", async ({
    page,
  }) => {
    await page.goto("/ki-beratung");
    const section = page.locator('section[aria-labelledby="nonscope-heading"]');
    await expect(section).toBeVisible();
    await expect(section).toContainText("Keine Implementierung");
    await expect(section).toContainText("Kein Vendor-Vergleichs-Marathon");
    await expect(section).toContainText("Keine Workshop-Serie");
  });

  test("TC-CNT-092: three objections — not five, not two", async ({ page }) => {
    // The competitive reference carries five; matching that COUNT would mean inventing
    // two objections the estate has no evidence for. The number is the assertion.
    await page.goto("/ki-beratung");
    const concerns = page.locator(
      'section[aria-labelledby="concerns-heading"] dl > div',
    );
    await expect(concerns).toHaveCount(3);
  });

  test("TC-CNT-093: the page is reachable from every page's navigation", async ({
    page,
  }) => {
    // A page nobody can navigate to cannot be measured, and measurability is the entire
    // reason this page shipped before Serie 1 fires.
    await page.goto("/");
    const navLink = page.locator('[data-track="nav_ki-beratung"]').first();
    await expect(navLink).toHaveAttribute("href", "/ki-beratung");
  });

  test("TC-CNT-094: the nav label carries no availability-for-hire language", async ({
    page,
  }) => {
    // C4 (Founder 2026-08-05): the mandate offering publishes exclusively via the private
    // Erwerbs lane. The nav is the most visible surface on the domain, so the label is a
    // guardrail rather than a name. Asserted as a negative on the label text itself.
    await page.goto("/");
    const label =
      (await page.locator('[data-track="nav_ki-beratung"]').first().textContent()) ?? "";
    expect(label.trim()).toBe("KI-Beratung");
    expect(label).not.toMatch(/buchen|verfügbar|Verfügbarkeit|Auslastung|frei ab/i);
  });

  test("TC-CNT-095: /ki-beratung is in the sitemap", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain("/ki-beratung");
  });
});
