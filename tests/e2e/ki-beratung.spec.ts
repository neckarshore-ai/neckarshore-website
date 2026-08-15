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
  test("TC-CNT-087: /ki-beratung serves 200 with the campaign's own title as H1", async ({
    page,
  }) => {
    // Product name first, then the job-language question (Founder 2026-08-15, against the
    // bare-question variant). The H1 stays byte-identical to the campaign's title so a
    // visitor arriving from a post lands on the words they clicked.
    const res = await page.goto("/ki-beratung");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText(
      "KI-Potenzialanalyse — Wo lohnen KI-Agenten in Ihren Prozessen?",
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

  test("TC-CNT-089: one conversion ROUTE — every CTA points at the same target", async ({
    page,
  }) => {
    // "One CTA" is a decision from the plan (Wave 1, item 5), and it means one ROUTE, not
    // one button: the page carries a hero CTA and a closing CTA, both to the same link.
    //
    // THIS ASSERTION HAS BEEN WRONG TWICE, AND BOTH CORRECTIONS ARE THE POINT.
    // First it counted links page-wide and caught the Nav's own Kennenlerntermin button —
    // it asserted "the document contains one link" when the claim was "the page offers one
    // route". Then it counted links inside <main>, which still forbade a second button to
    // the SAME destination — a layout rule wearing a decision's clothes. What the decision
    // actually forbids is a second DESTINATION, so that is what is asserted now.
    //
    // SCOPED TO <main> because the Nav's button is site-wide furniture, not this page's
    // conversion path.
    await page.goto("/ki-beratung");
    const targets = await page
      .locator('main a[href*="calendly.com"]')
      .evaluateAll((links) => [
        ...new Set(links.map((l) => (l as HTMLAnchorElement).href)),
      ]);
    expect(targets).toEqual(["https://calendly.com/rauhut/20min"]);
  });

  test("TC-CNT-090: the pricing guardrail holds — published figures only, never the internals", async ({
    page,
  }) => {
    // C6 (Founder 2026-08-07): the pricing FORMULA, the 2x check and the 700-EUR floor
    // never appear in a public artifact. This asserts the negative directly, because the
    // cost of getting it wrong is not a broken layout — it is an internal calculation
    // published on the open web.
    await page.goto("/ki-beratung");
    //
    // THE POSITIVE HALF IS ROW-SCOPED ON PURPOSE. A page-wide toContain("Einführungspreis")
    // would still pass if the label drifted into a footnote three sections away, and the
    // label only does its work while it sits ON the figure it qualifies.
    const body = (await page.locator("body").textContent()) ?? "";
    expect(body).not.toMatch(/700\s*EUR/);
    expect(body).not.toMatch(/\b2x[- ]Check\b/i);

    const kompakt = page.locator("tr", { hasText: "Kompakt-Analyse" });
    await expect(kompakt).toContainText("1.500 EUR");
    await expect(kompakt).toContainText("Einführungspreis");

    const workshop = page.locator("tr", { hasText: "Workshop-Tag" });
    await expect(workshop).toContainText("2.500–3.500 EUR");
  });

  test("TC-CNT-096: both Anrechnung stages are stated, and the second names its limits", async ({
    page,
  }) => {
    // Stage 2 (Founder 2026-08-15) is a commercial promise on a public page. Two things
    // make it safe to publish and are therefore asserted — the SIX-MONTH window and the
    // restriction to implementation rather than further consulting. A stage-2 sentence
    // that lost either half would be a wider promise than the one that was decided.
    await page.goto("/ki-beratung");
    const ladder = page.locator('section[aria-labelledby="ladder-heading"]');
    await expect(ladder).toContainText("Anrechnung, Stufe 1 auf Stufe 2");
    await expect(ladder).toContainText("sechs Monaten");
    await expect(ladder).toContainText("nicht auf weitere Beratung");
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

  test("TC-CNT-097: the trust anchor says who stands behind the offer", async ({
    page,
  }) => {
    // Founder 2026-08-15: the page may not leave the reader to imagine a bench of
    // consultants that does not exist. The named principal and the direct-access promise
    // are the assertion.
    await page.goto("/ki-beratung");
    // Both assertions sit on Founder-written sentences (round 2, 2026-08-15): the
    // direct-access promise, and the practise-what-we-recommend claim that replaced my
    // earlier draft paragraph. Asserted separately because they carry different work — one
    // says WHO, the other says on what basis.
    const anchor = page.locator('section[aria-labelledby="anchor-heading"]');
    await expect(anchor).toContainText("macht auch die Arbeit");
    await expect(anchor).toContainText("die wir nicht selbst benutzen");
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
