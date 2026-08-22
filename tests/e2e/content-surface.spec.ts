import { test, expect, type Page } from "@playwright/test";

// JSON-LD helper: collect all parsed ld+json blocks on the current page (one entry per
// <script> block — used where the per-block wrapper matters, e.g. the @context check).
async function ldJson(page: Page): Promise<Record<string, unknown>[]> {
  const blocks = page.locator('script[type="application/ld+json"]');
  const count = await blocks.count();
  const parsed: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    const txt = await blocks.nth(i).textContent();
    if (txt) parsed.push(JSON.parse(txt));
  }
  return parsed;
}

// JSON-LD node helper: flatten every node across all blocks (expands @graph). A product
// page's primary entity (SoftwareApplication/CreativeWork) is co-located with its WebPage
// inside ONE per-route @graph, so @type filters must look inside the graph, not only at
// top-level blocks. Backward-compatible: a standalone block (no @graph) yields itself.
async function ldNodes(page: Page): Promise<Record<string, unknown>[]> {
  return (await ldJson(page)).flatMap(
    (b) => (b["@graph"] ?? [b]) as Record<string, unknown>[],
  );
}

test.describe("Content surface — retired /glossar → ClearPath", () => {
  // The standalone cognitive-bias glossar was retired 2026-06-23 — its topic is
  // ClearPath's domain, not neckarshore.ai's. The biases now live as a table on
  // /products/clearpath; the old indexed URLs permanently redirect there.
  test("TC-CNT-064: /glossar permanently redirects to /products/clearpath", async ({
    request,
  }) => {
    const res = await request.get("/glossar", { maxRedirects: 0 });
    expect([301, 308]).toContain(res.status());
    expect(res.headers()["location"]).toBe("/products/clearpath");
  });

  for (const slug of [
    "bestaetigungsfehler",
    "ueberlebenden-verzerrung",
    "versunkene-kosten-falle",
  ]) {
    test(`TC-CNT-065 [${slug}]: retired glossar entry redirects to ClearPath`, async ({
      request,
    }) => {
      const res = await request.get(`/glossar/${slug}`, { maxRedirects: 0 });
      expect([301, 308]).toContain(res.status());
      expect(res.headers()["location"]).toBe("/products/clearpath");
    });
  }
});

test.describe("Content surface — Products index", () => {
  test("TC-CNT-010: /products renders 200 with the four category headings", async ({ page }) => {
    const res = await page.goto("/products");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    for (const tier of ["Flagships", "MMPs", "Skills", "Websites"]) {
      await expect(
        page.getByRole("heading", { name: tier, exact: true, level: 2 }),
      ).toBeVisible();
    }
  });

  // ClearPath was UNFEATURED on 2026-08-15 (Founder, #515): off the hub, page + card stay
  // live on the MMP sub-portal. The test moved with the decision rather than being deleted —
  // "the card links to its detail page" is still the thing worth guarding, just one level down.
  test("TC-CNT-011: ClearPath card links to /products/clearpath (MMP sub-portal)", async ({
    page,
  }) => {
    await page.goto("/products/mmps");
    await expect(page.locator('a[href="/products/clearpath"]').first()).toBeVisible();
  });

  test("TC-CNT-013: Omnopsis card links to /products/omnopsis", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator('a[href="/products/omnopsis"]').first()).toBeVisible();
  });

  // Portal = teaser: only the featured Top-N per category + a "mehr" tile; the
  // remainder lives on the sub-portal (2026-06-18 top-3 reframe).
  test("TC-CNT-014: portal shows only featured MMPs + a 'mehr' tile, dropped MMPs absent", async ({
    page,
  }) => {
    await page.goto("/products");
    // featured MMPs present on the portal teaser (kaze added 2026-08-06; TrustScope +
    // md-viewer promoted 2026-08-15 as the two Rang-1 leads, #515)
    for (const slug of ["phonesis", "kaze", "trustscope", "md-viewer"]) {
      await expect(page.locator(`a[href="/products/${slug}"]`).first()).toBeVisible();
    }
    // non-featured MMPs are NOT on the teaser (they live on the sub-portal). ClearPath and
    // Snakeoil-Check joined this list on 2026-08-15 — unfeatured, NOT retired.
    for (const slug of ["local-seo-hub", "prod-or-pretend", "clearpath", "snakeoil-check"]) {
      await expect(page.locator(`a[href="/products/${slug}"]`)).toHaveCount(0);
    }
    // the "mehr" tile links to the MMP sub-portal and signals the remainder
    const more = page.locator('a[data-track="nav_products_mmps_more"]');
    await expect(more).toBeVisible();
    await expect(more).toHaveAttribute("href", "/products/mmps");
    await expect(more).toContainText("weitere");
  });

  test("TC-CNT-015: the MMP sub-portal lists the FULL category (featured + dropped)", async ({
    page,
  }) => {
    await page.goto("/products/mmps");
    for (const slug of [
      "clearpath",
      "snakeoil-check",
      "phonesis",
      "kaze",
      "local-seo-hub",
      "prod-or-pretend",
    ]) {
      await expect(page.locator(`a[href="/products/${slug}"]`).first()).toBeVisible();
    }
  });

  test("TC-CNT-012: no empty or placeholder internal links", async ({ page }) => {
    await page.goto("/products");
    const hrefs = await page
      .locator("main a")
      .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).toBeTruthy();
      expect(href).not.toBe("#");
    }
  });

  // Unified card layout (2026-06-22): website cards carry a "Live" status pill (bottom-left)
  // and a "Website ↗" link (top-right). The old "Extern" badge is gone for good.
  test("TC-CNT-016: website cards show a 'Live' status pill + a 'Website' link, never 'Extern'", async ({ page }) => {
    await page.goto("/products/websites");
    await expect(page.getByText("Extern", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Website", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Live", { exact: true }).first()).toBeVisible();
  });
});

test.describe("Content surface — ClearPath product", () => {
  test("TC-CNT-020: 200, single H1, definition lead is the first paragraph", async ({
    page,
  }) => {
    const res = await page.goto("/products/clearpath");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("ClearPath");
    await expect(page.locator("article p").first()).toContainText(
      "Beschreibe eine Entscheidung",
    );
  });

  test("TC-CNT-021: live-app link present and rel-correct", async ({ page }) => {
    await page.goto("/products/clearpath");
    const live = page.locator('a[href="https://clearpath.neckarshore.ai"]').first();
    await expect(live).toBeVisible();
    await expect(live).toHaveAttribute("target", "_blank");
    await expect(live).toHaveAttribute("rel", /noopener/);
  });

  test("TC-CNT-022: renders the Denkfehler bias table, each term links out to Wikipedia", async ({
    page,
  }) => {
    await page.goto("/products/clearpath");
    const table = page.getByRole("table", { name: /Denkfehler/i });
    await expect(table).toBeVisible();
    // The three secured biases are present as rows.
    for (const term of [
      "Bestätigungsfehler",
      "Überlebenden-Verzerrung",
      "Versunkene-Kosten-Falle",
    ]) {
      await expect(table.getByText(term).first()).toBeVisible();
    }
    // Each row links out to its German Wikipedia article in a new tab.
    const wikiLinks = table.locator('a[href*="de.wikipedia.org/wiki/"]');
    await expect(wikiLinks).toHaveCount(3);
    await expect(wikiLinks.first()).toHaveAttribute("target", "_blank");
    await expect(wikiLinks.first()).toHaveAttribute("rel", /noopener/);
    // No leftover internal /glossar links anywhere on the page.
    await expect(page.locator('a[href^="/glossar"]')).toHaveCount(0);
  });

  test("TC-CNT-023: emits exactly one SoftwareApplication JSON-LD block", async ({ page }) => {
    await page.goto("/products/clearpath");
    const apps = (await ldNodes(page)).filter((b) => b["@type"] === "SoftwareApplication");
    expect(apps).toHaveLength(1);
    expect(apps[0].name).toBe("ClearPath");
    expect(apps[0].operatingSystem).toBe("Web");
    expect(apps[0].offers).toBeTruthy();
    expect(String(apps[0].url)).toContain("clearpath.neckarshore.ai");
  });

  test('TC-CNT-024: carries the "Wie dieser Text entstand" note', async ({ page }) => {
    await page.goto("/products/clearpath");
    await expect(page.getByText("Wie dieser Text entstand")).toBeVisible();
  });
});

// SEO/GEO dual-axis acceptance sweep over every new route (Task 6).
const NEW_PAGES = [
  { path: "/products", title: "Produkte", canonical: "https://neckarshore.ai/products" },
  {
    path: "/products/clearpath",
    title: "ClearPath",
    canonical: "https://neckarshore.ai/products/clearpath",
  },
  {
    path: "/products/omnopsis",
    title: "Omnopsis Documentor+X",
    canonical: "https://neckarshore.ai/products/omnopsis",
  },
  // Sub-portals (one per portfolio category) — 2026-06-17 tree rebuild.
  { path: "/products/flagships", title: "Flagships", canonical: "https://neckarshore.ai/products/flagships" },
  { path: "/products/mmps", title: "MMPs", canonical: "https://neckarshore.ai/products/mmps" },
  { path: "/products/skills", title: "Skills", canonical: "https://neckarshore.ai/products/skills" },
  { path: "/products/websites", title: "Web-Projekte", canonical: "https://neckarshore.ai/products/websites" },
  // Product detail pages (all bespoke now). Reachable + structured; the preview MMPs + the
  // private restaurant skill are noindex, the OSS skills are indexable — TC-CNT-030 checks the
  // shared surface (title/H1/canonical/JSON-LD), not the robots flag.
  {
    path: "/products/snakeoil-check",
    title: "Snakeoil-Check",
    canonical: "https://neckarshore.ai/products/snakeoil-check",
  },
  {
    path: "/products/local-seo-hub",
    title: "Local-SEO-Hub",
    canonical: "https://neckarshore.ai/products/local-seo-hub",
  },
  {
    path: "/products/phonesis",
    title: "Phonesis Voicebank",
    canonical: "https://neckarshore.ai/products/phonesis",
  },
  {
    path: "/products/prod-or-pretend",
    title: "Prod-or-Pretend",
    canonical: "https://neckarshore.ai/products/prod-or-pretend",
  },
  {
    path: "/products/obsidian-vault-autopilot",
    title: "Obsidian Vault Autopilot",
    canonical: "https://neckarshore.ai/products/obsidian-vault-autopilot",
  },
  {
    path: "/products/ai-phrase-check",
    title: "AI Phrase Check",
    canonical: "https://neckarshore.ai/products/ai-phrase-check",
  },
  {
    path: "/products/imap-mailbox-cleanup",
    title: "IMAP Mailbox Cleanup",
    canonical: "https://neckarshore.ai/products/imap-mailbox-cleanup",
  },
  {
    path: "/products/social-scrapers",
    title: "Social Scrapers",
    canonical: "https://neckarshore.ai/products/social-scrapers",
  },
  {
    path: "/products/restaurant-menu-update",
    title: "Restaurant-Menüpflege",
    canonical: "https://neckarshore.ai/products/restaurant-menu-update",
  },
] as const;

test.describe("Content surface — SEO/GEO dual-axis sweep", () => {
  for (const p of NEW_PAGES) {
    test(`TC-CNT-030 [${p.path}]: unique title, single H1, canonical, JSON-LD`, async ({
      page,
    }) => {
      const res = await page.goto(p.path);
      expect(res?.status()).toBe(200);

      const title = await page.title();
      expect(title).toContain(p.title);
      expect(title).toContain("neckarshore.ai");

      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        p.canonical,
      );

      const blocks = await ldJson(page);
      expect(blocks.length).toBeGreaterThanOrEqual(1);
      expect(blocks.every((b) => b["@context"] === "https://schema.org")).toBe(true);
    });

    test(`TC-CNT-031 [${p.path}]: lang=de, no heading skips, no overflow @393px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 393, height: 852 });
      await page.goto(p.path);

      expect(await page.locator("html").getAttribute("lang")).toBe("de");

      const headings = await page.locator("h1, h2, h3, h4, h5, h6").all();
      let last = 0;
      for (const h of headings) {
        const level = parseInt((await h.evaluate((el) => el.tagName)).replace("H", ""), 10);
        if (last > 0) expect(level).toBeLessThanOrEqual(last + 1);
        last = level;
      }

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow).toBe(false);
    });
  }
});

test.describe("Skills on-page overview table @content", () => {
  test("TC-CNT-032: /products/skills renders an overview table with one row per skill", async ({
    page,
  }) => {
    await page.goto("/products/skills");
    const table = page.getByRole("table");
    await expect(table).toBeVisible();
    // 5 portfolio skills → 5 body rows + 1 header row
    await expect(table.getByRole("row")).toHaveCount(6);
  });

  test("TC-CNT-033: every overview-table link is a detail-page route (all skills have graduated)", async ({
    page,
  }) => {
    await page.goto("/products/skills");
    // One Tool link per skill row. Every skill now has a bespoke detail page, so each link
    // points off-page to /products/<slug> — no in-page (#slug) bookmark fallbacks remain. (The
    // #slug fallback stays in the code for any FUTURE skeleton skill; today there are none.)
    const links = page.locator("table tbody a");
    const n = await links.count();
    expect(n).toBe(5);
    let anchors = 0;
    for (let i = 0; i < n; i++) {
      const href = await links.nth(i).getAttribute("href");
      expect(href).toBeTruthy();
      if (href!.startsWith("#")) {
        anchors++;
        await expect(page.locator(`#${href!.slice(1)}`)).toBeAttached();
      } else {
        expect(href).toMatch(/^\/products\/[a-z0-9-]+$/);
      }
    }
    // All skills have graduated to detail pages → zero in-page bookmarks.
    expect(anchors).toBe(0);
  });

  test("TC-CNT-034: a Tool link navigates to its product detail page", async ({ page }) => {
    await page.goto("/products/skills");
    const link = page.locator('table tbody a[href^="/products/"]').first();
    const href = (await link.getAttribute("href"))!;
    expect(href).toMatch(/^\/products\/[a-z0-9-]+$/);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    // A real detail page loaded: exactly one H1.
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test("TC-CNT-063: overview table drops the Code/Status pill columns on phones, keeps them on desktop", async ({
    page,
  }) => {
    const loest = page.getByRole("columnheader", { name: "Löst" });
    const code = page.getByRole("columnheader", { name: "Code" });
    const status = page.getByRole("columnheader", { name: "Status" });

    // Phone (< sm/640px): only Tool + Löst show, so rows stay short instead of the
    // description wrapping to ~8 lines in a starved column. (Founder request 2026-06-22.)
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/products/skills");
    await expect(loest).toBeVisible();
    await expect(code).toBeHidden();
    await expect(status).toBeHidden();

    // Desktop: the full four-column table is back.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/products/skills");
    await expect(code).toBeVisible();
    await expect(status).toBeVisible();
  });
});

test.describe("Content surface — Snakeoil-Check live MMP", () => {
  test("TC-CNT-035: 200, single H1 contains the name, citable definition is the lead paragraph", async ({
    page,
  }) => {
    const res = await page.goto("/products/snakeoil-check");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Snakeoil-Check");
    await expect(page.locator("article p").first()).toContainText(
      "zwölf neutralen Kriterien",
    );
  });

  test("TC-CNT-036: renders the five MMP content axes as headings", async ({ page }) => {
    // "Status & Roadmap" removed 2026-08-06 (L-NECKARSHORE-HONESTY-FIXES: Park status = no
    // published feature roadmap; product-portfolio.md line 14).
    await page.goto("/products/snakeoil-check");
    for (const heading of [
      "Das Problem",
      "Wie funktioniert Snakeoil-Check?",
      "Was Snakeoil-Check anders macht",
      "Live ausprobieren",
      "Wie dieser Text entstand",
    ]) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("TC-CNT-035a: live-app link present and rel-correct", async ({ page }) => {
    await page.goto("/products/snakeoil-check");
    const live = page.locator('a[href="https://snakeoil.neckarshore.ai"]').first();
    await expect(live).toBeVisible();
    await expect(live).toHaveAttribute("target", "_blank");
    await expect(live).toHaveAttribute("rel", /noopener/);
  });

  test("TC-CNT-037: one live SoftwareApplication block — live url, NO offers (freemium, AD-19 fail-closed)", async ({
    page,
  }) => {
    await page.goto("/products/snakeoil-check");
    const apps = (await ldNodes(page)).filter((b) => b["@type"] === "SoftwareApplication");
    expect(apps).toHaveLength(1);
    expect(apps[0].name).toBe("Snakeoil-Check");
    expect(apps[0].operatingSystem).toBe("Web");
    expect(String(apps[0].url)).toContain("snakeoil.neckarshore.ai");
    // Freemium (one free check, then paid Shot packages) → NO free Offer claim.
    expect(apps[0].offers).toBeUndefined();
    expect(String(apps[0].description)).toContain("zwölf neutralen Kriterien");
  });
});

test.describe("Content surface — Phonesis Voicebank preview MMP", () => {
  test("TC-CNT-038: 200, single H1 contains the name, citable definition is the lead paragraph", async ({
    page,
  }) => {
    const res = await page.goto("/products/phonesis");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Phonesis");
    await expect(page.locator("article p").first()).toContainText(
      "kommende Generationen",
    );
  });

  test("TC-CNT-039: renders the six MMP content axes as headings", async ({ page }) => {
    await page.goto("/products/phonesis");
    for (const heading of [
      "Das Problem",
      "Wie funktioniert Phonesis?",
      "Was Phonesis anders macht",
      "Datenschutz & Ethik",
      "Wann kommt Phonesis?",
      "Wie dieser Text entstand",
    ]) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("TC-CNT-040: one preview SoftwareApplication block — no url, no offers (AD-19 fail-closed)", async ({
    page,
  }) => {
    await page.goto("/products/phonesis");
    const apps = (await ldNodes(page)).filter((b) => b["@type"] === "SoftwareApplication");
    expect(apps).toHaveLength(1);
    expect(apps[0].name).toBe("Phonesis Voicebank");
    expect(apps[0].operatingSystem).toBe("Web");
    expect(apps[0].url).toBeUndefined();
    expect(apps[0].offers).toBeUndefined();
    expect(String(apps[0].description)).toContain("kommende Generationen");
  });
});

test.describe("Content surface — Prod-or-Pretend preview MMP", () => {
  test("TC-CNT-041: 200, single H1 contains the name, citable definition is the lead paragraph", async ({
    page,
  }) => {
    const res = await page.goto("/products/prod-or-pretend");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Prod-or-Pretend");
    await expect(page.locator("article p").first()).toContainText(
      "Substanz von heißer Luft",
    );
  });

  test("TC-CNT-042: renders the five MMP content axes as headings", async ({ page }) => {
    await page.goto("/products/prod-or-pretend");
    for (const heading of [
      "Das Problem",
      "Wie funktioniert Prod-or-Pretend?",
      "Was Prod-or-Pretend anders macht",
      "Wann kommt Prod-or-Pretend?",
      "Wie dieser Text entstand",
    ]) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("TC-CNT-043: one preview SoftwareApplication block — no url, no offers (AD-19 fail-closed)", async ({
    page,
  }) => {
    await page.goto("/products/prod-or-pretend");
    const apps = (await ldNodes(page)).filter((b) => b["@type"] === "SoftwareApplication");
    expect(apps).toHaveLength(1);
    expect(apps[0].name).toBe("Prod-or-Pretend");
    expect(apps[0].operatingSystem).toBe("Web");
    expect(apps[0].url).toBeUndefined();
    expect(apps[0].offers).toBeUndefined();
    expect(String(apps[0].description)).toContain("Substanz von heißer Luft");
  });
});

test.describe("Content surface — Local-SEO-Hub preview MMP", () => {
  test("TC-CNT-044: 200, single H1 contains the name, citable definition is the lead paragraph", async ({
    page,
  }) => {
    const res = await page.goto("/products/local-seo-hub");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("Local-SEO-Hub");
    await expect(page.locator("article p").first()).toContainText(
      "Sichtbarkeits-Score von 0 bis 100",
    );
  });

  test("TC-CNT-045: renders the five MMP content axes as headings", async ({ page }) => {
    await page.goto("/products/local-seo-hub");
    for (const heading of [
      "Das Problem",
      "Wie funktioniert Local-SEO-Hub?",
      "Was Local-SEO-Hub anders macht",
      "Wann kommt Local-SEO-Hub?",
      "Wie dieser Text entstand",
    ]) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("TC-CNT-046: one preview SoftwareApplication block — no url, no offers (AD-19 fail-closed)", async ({
    page,
  }) => {
    await page.goto("/products/local-seo-hub");
    const apps = (await ldNodes(page)).filter((b) => b["@type"] === "SoftwareApplication");
    expect(apps).toHaveLength(1);
    expect(apps[0].name).toBe("Local-SEO-Hub");
    expect(apps[0].operatingSystem).toBe("Web");
    expect(apps[0].url).toBeUndefined();
    expect(apps[0].offers).toBeUndefined();
    expect(String(apps[0].description)).toContain("Sichtbarkeits-Score von 0 bis 100");
  });
});

test.describe("Content surface — AI Phrase Check skill detail", () => {
  test("TC-CNT-047: 200, single H1 contains the name, citable lead paragraph", async ({
    page,
  }) => {
    const res = await page.goto("/products/ai-phrase-check");
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toContainText("AI Phrase Check");
    await expect(page.locator("article p").first()).toContainText(
      "verräterischen Spuren von KI-generierter Sprache",
    );
  });

  test("TC-CNT-048: renders the skill detail sections as headings", async ({ page }) => {
    await page.goto("/products/ai-phrase-check");
    for (const heading of [
      "Was ist AI Phrase Check?",
      "Wie es funktioniert",
      "Zweisprachig: Englisch und Deutsch",
      "Datenschutz",
      "Verfügbarkeit",
      "Häufige Fragen",
    ]) {
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("TC-CNT-049: SoftwareApplication (real url + free Offer) + FAQPage JSON-LD — indexable skill posture", async ({
    page,
  }) => {
    await page.goto("/products/ai-phrase-check");
    const blocks = await ldNodes(page);
    const apps = blocks.filter((b) => b["@type"] === "SoftwareApplication");
    expect(apps).toHaveLength(1);
    expect(apps[0].name).toBe("AI Phrase Check");
    expect(String(apps[0].url)).toContain("github.com/neckarshore-skills/ai-phrase-check");
    expect(apps[0].isAccessibleForFree).toBe(true);
    expect(apps[0].offers).toBeDefined();
    const faqs = blocks.filter((b) => b["@type"] === "FAQPage");
    expect(faqs).toHaveLength(1);
    expect(Array.isArray(faqs[0].mainEntity)).toBe(true);
    expect(faqs[0].mainEntity.length).toBeGreaterThanOrEqual(1);
  });
});

// Bottom-of-page FAQ on the product detail surface (2026-06-21). The shared ProductFaq
// primitive renders a visible "Häufige Fragen" section everywhere, but emits FAQPage JSON-LD
// ONLY on indexable pages — a noindex preview shows the FAQ for human visitors while the
// schema stays dormant (Google never crawls a noindex page; the markup would be dead weight,
// and it activates automatically when `noindex` drops at launch).
test.describe("Content surface — Product FAQ (GEO)", () => {
  // Indexable pages with a FAQ → visible section + exactly one FAQPage block. Includes the
  // two SkillDetailPage consumers (social-scrapers, imap-mailbox-cleanup) whose FAQPage render
  // path moved when SkillDetailPage was refactored onto ProductFaq — this locks their schema.
  const FAQ_INDEXABLE = [
    "/products/omnopsis",
    "/products/clearpath",
    "/products/snakeoil-check",
    "/products/phonesis",
    "/products/local-seo-hub",
    "/products/prod-or-pretend",
    "/products/social-scrapers",
    "/products/imap-mailbox-cleanup",
    "/products/websites/neckarshore",
    "/products/websites/ristorante-goldoni",
    "/products/websites/oakwood-golf-club",
    "/products/websites/rauhut",
  ] as const;

  // noindex page (the private restaurant skill only): visible FAQ, NO FAQPage schema.
  // The 4 preview MMPs moved to FAQ_INDEXABLE on 2026-06-22 (noindex dropped → FAQPage active).
  const FAQ_NOINDEX = ["/products/restaurant-menu-update"] as const;

  for (const path of FAQ_INDEXABLE) {
    test(`TC-CNT-055 [${path}]: visible FAQ + one FAQPage JSON-LD with >= 1 question`, async ({
      page,
    }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(
        page.getByRole("heading", { name: "Häufige Fragen", level: 2 }),
      ).toBeVisible();
      const faqs = (await ldJson(page)).filter((b) => b["@type"] === "FAQPage");
      expect(faqs).toHaveLength(1);
      expect(Array.isArray(faqs[0].mainEntity)).toBe(true);
      expect(faqs[0].mainEntity.length).toBeGreaterThanOrEqual(1);
    });
  }

  for (const path of FAQ_NOINDEX) {
    test(`TC-CNT-056 [${path}]: visible FAQ but NO FAQPage schema (noindex → no dead markup)`, async ({
      page,
    }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(
        page.getByRole("heading", { name: "Häufige Fragen", level: 2 }),
      ).toBeVisible();
      const faqs = (await ldJson(page)).filter((b) => b["@type"] === "FAQPage");
      expect(faqs).toHaveLength(0);
    });
  }
});

// Rich/Beides/Skill cards are <div> (they carry a secondary GitHub/Website <a>), but a
// stretched ::after on their "Mehr erfahren" link makes the WHOLE card clickable to the
// detail page. Clicking the card body (not a link) must navigate; the secondary button
// must still reach its own target. (2026-06-22 Founder request.)
test.describe("Content surface — cards are fully clickable", () => {
  const CARD_CASES = [
    { portal: "/products/mmps", detailHref: "/products/snakeoil-check" },
    { portal: "/products/websites", detailHref: "/products/websites/oakwood-golf-club" },
    { portal: "/products/skills", detailHref: "/products/obsidian-vault-autopilot" },
  ] as const;

  for (const c of CARD_CASES) {
    test(`TC-CNT-057 [${c.portal}]: clicking the card body navigates to the detail page`, async ({
      page,
    }) => {
      await page.goto(c.portal);
      // The card = the nearest `group` ancestor of its "Mehr erfahren" link. Scope to the
      // card's "Mehr erfahren" link specifically — /products/skills also has an overview
      // TABLE whose tool link shares the same href but sits outside any card (no `.group`).
      const card = page
        .locator(`a[href="${c.detailHref}"]:has-text("Mehr erfahren")`)
        .first()
        .locator(
          'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " group ")][1]',
        );
      await card.scrollIntoViewIfNeeded();
      const box = await card.boundingBox();
      expect(box).not.toBeNull();
      // Click the left-middle of the card — description/body area, covered by the stretched
      // overlay, clear of the title (top), badge (top-right) and footer buttons (bottom).
      await page.mouse.click(box!.x + 24, box!.y + box!.height / 2);
      await expect(page).toHaveURL(new RegExp(`${c.detailHref.replace(/\//g, "\\/")}$`));
    });
  }

  test("TC-CNT-058: a card's secondary GitHub button still reaches GitHub, not the detail page", async ({
    page,
  }) => {
    await page.goto("/products/mmps");
    // The GitHub button on a rich MMP card carries z-10 above the stretched overlay → it
    // opens its own external href (new tab), never the detail page.
    const gh = page.locator('a[data-track="product_card_github_snakeoil-check"]');
    await expect(gh).toBeVisible();
    await expect(gh).toHaveAttribute("target", "_blank");
    await expect(gh).toHaveAttribute("href", /github\.com/);
  });

  test("TC-CNT-058a: live MMP cards carry a 'Live ↗' button to their subdomain (alongside GitHub)", async ({
    page,
  }) => {
    await page.goto("/products/mmps");
    for (const [slug, host] of [
      ["clearpath", "clearpath.neckarshore.ai"],
      ["snakeoil-check", "snakeoil.neckarshore.ai"],
    ]) {
      const live = page.locator(`a[data-track="product_card_live_${slug}"]`);
      await expect(live).toBeVisible();
      await expect(live).toHaveAttribute("target", "_blank");
      await expect(live).toHaveAttribute("href", new RegExp(host.replace(/\./g, "\\.")));
      // GitHub stays present on the same card (Founder parity decision, additive live link).
      await expect(
        page.locator(`a[data-track="product_card_github_${slug}"]`),
      ).toBeVisible();
    }
  });
});

// Unified card principle (2026-06-22): every card across MMP / Skill / Website carries a
// bottom-left status pill. The exact label is honest per card (Live / In Entwicklung / Beta
// / Referenz-Beispiel); this locks that the pill is present on every surface.
test.describe("Content surface — unified status pill", () => {
  test("TC-CNT-059: every sub-portal card type shows its status pill", async ({ page }) => {
    // MMPs: live ones (clearpath + snakeoil-check → "Live") + previews ("In Entwicklung").
    await page.goto("/products/mmps");
    await expect(page.getByText("Live", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("In Entwicklung", { exact: true }).first()).toBeVisible();
    // Skills: OSS maturity ("Beta") + the private reference skill ("Referenz-Beispiel").
    await page.goto("/products/skills");
    await expect(page.getByText("Beta", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Referenz-Beispiel", { exact: true }).first()).toBeVisible();
    // Websites: live external sites ("Live").
    await page.goto("/products/websites");
    await expect(page.getByText("Live", { exact: true }).first()).toBeVisible();
    // Flagship on the portal teaser: omnopsis shows "In Entwicklung" (honest, not "Live").
    await page.goto("/products");
    await expect(page.getByText("In Entwicklung", { exact: true }).first()).toBeVisible();
  });
});

// C1 (SEO/GEO audit 2026-06-24): the Omnopsis flagship hardcoded "MVP Q2 2026" in three
// places (pill, Conceived/Born block, and the "Wann verfügbar?" FAQ answer — the last one
// also in the FAQPage JSON-LD). Q2 expires 2026-06-30 → the date went stale, and this test
// was written to lock the repair.
//
// THE REPAIR CARRIED THE SAME DEFECT, AND THIS TEST HELD IT IN PLACE. "MVP Q2 2026" was
// replaced by "Launch geplant Q3 2026" and the test pinned that exact string — so it
// required a quarter to be present, and would have gone green all the way to 2026-09-30,
// then red for a reason no one would have connected to it. Same expiry, one quarter later.
//
// Founder decision 2026-08-20: no public launch quarter at all. "In Entwicklung" cannot
// expire. The assertion below is therefore on the CLASS, not on a string: any quarter-shaped
// claim fails, whichever quarter it names. page.content() covers the collapsed FAQ <details>
// and the FAQPage JSON-LD, so all three original places stay guarded.
//
// Sibling guard, source-side: tests/unit/llms-claims.test.ts scans the four files that can
// make this claim — including the English AI-reader prose, which no rendered page carries.
test.describe("Content surface — Omnopsis milestone honesty", () => {
  test("TC-CNT-066: /products/omnopsis claims no launch quarter at all", async ({ page }) => {
    await page.goto("/products/omnopsis");
    const html = await page.content();

    const quarter = html.match(/\bQ[1-4]\s*[\/-]?\s*20\d{2}\b/);
    expect(
      quarter?.[0],
      "a public launch quarter expires on a fixed date and nothing in CI notices the day it turns false",
    ).toBeUndefined();

    // Non-vacuity: the negative above would also pass on an empty or broken page.
    expect(html).toContain("In Entwicklung");
  });
});

// Skill detail pages dropped the end-of-page "Auf GitHub ansehen" link (Founder request
// 2026-06-22). The repo URL still lives in the SoftwareApplication JSON-LD (machine-readable
// for crawlers), it is just no longer a human CTA. Lock its absence on every skill detail page.
test.describe("Content surface — skill detail pages carry no GitHub CTA", () => {
  const SKILL_DETAIL_PAGES = [
    "/products/ai-phrase-check",
    "/products/imap-mailbox-cleanup",
    "/products/obsidian-vault-autopilot",
    "/products/social-scrapers",
  ] as const;

  for (const path of SKILL_DETAIL_PAGES) {
    test(`TC-CNT-060 [${path}]: no end-of-page "Auf GitHub ansehen" link`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('a[data-track$="_detail_github"]')).toHaveCount(0);
      await expect(page.getByRole("link", { name: /Auf GitHub ansehen/ })).toHaveCount(0);
    });
  }
});

// The end-of-page "Kennenlerntermin buchen" CTA duplicates the header CTA that the desktop
// nav pins at lg (1024px), so it is hidden from lg upward. The mobile nav tucks its CTA inside
// the hamburger, so the end-of-page CTA is the only in-flow booking link there and stays
// visible. (Founder request 2026-06-22; ProductDetailNav `hideCtaOnDesktop`.) The /products/[slug]
// skeleton route also sets the flag, but no slug currently renders it (all have bespoke pages),
// so the two live surfaces are the flagship + the website case studies.
test.describe("Content surface — end-of-page booking CTA is mobile-only", () => {
  const CTA_PAGES = [
    { path: "/products/omnopsis", track: "omnopsis_cta" },
    { path: "/products/websites/neckarshore", track: "website_detail_cta_neckarshore" },
  ] as const;

  for (const { path, track } of CTA_PAGES) {
    test(`TC-CNT-061 [${path}]: end-of-page CTA hidden @desktop, visible @mobile`, async ({
      page,
    }) => {
      const cta = page.locator(`a[data-track="${track}"]`);

      // Desktop (>= lg/1024px): the pinned header CTA covers the need → end-of-page CTA hidden.
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      await expect(cta).toHaveCount(1); // in the DOM…
      await expect(cta).toBeHidden(); // …but display:none via lg:hidden

      // Mobile (< lg): header CTA is buried in the hamburger → end-of-page CTA must be visible.
      await page.setViewportSize({ width: 393, height: 852 });
      await page.goto(path);
      await expect(cta).toBeVisible();
    });
  }
});

// The website case-study pages add a desktop-only conversion close — the inverse of the
// mobile-only nav CTA above. On desktop the header CTA is pinned but the end-of-read close
// was missing, so this block fills that gap at ≥lg and stays hidden on mobile, where the
// ProductDetailNav CTA already closes the page. The two never both show (no duplicate).
test.describe("Content surface — website case-study desktop close CTA", () => {
  test("TC-CNT-067 [/products/websites/neckarshore]: close CTA visible @desktop, hidden @mobile", async ({
    page,
  }) => {
    const cta = page.locator('a[data-track="website_close_cta_neckarshore"]');

    // Desktop (>= lg/1024px): the end-of-read conversion close is visible.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/products/websites/neckarshore");
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "https://calendly.com/rauhut/20min");
    await expect(cta).toHaveAttribute("target", "_blank");
    await expect(cta).toHaveAttribute("rel", /noopener/);

    // Mobile (< lg): the ProductDetailNav CTA closes the page → desktop block hidden.
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto("/products/websites/neckarshore");
    await expect(cta).toHaveCount(1); // in the DOM…
    await expect(cta).toBeHidden(); // …but display:none via the `hidden` base class
  });
});
