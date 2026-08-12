import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

test.describe("Stats Tiles @smoke", () => {
  async function getStatValue(
    page: import("@playwright/test").Page,
    label: string,
  ): Promise<string> {
    // Exact match (defensive): keeps each label locator from accidentally matching another
    // tile's text — e.g. a sub-line that shares a word with a tile label.
    const tile = page.getByText(label, { exact: true }).locator("..");
    return (await tile.locator("p.font-heading").textContent())?.trim() || "";
  }

  function parseDE(value: string): number {
    // Strip the de-DE thousands dot AND the load-bearing "+" the floor-framed Tests tile appends.
    return Number(value.replace(/[.+]/g, ""));
  }

  test("TC-STAT-001: Days since First Commit is plausible", async ({
    page,
  }) => {
    await page.goto("/");
    const value = await getStatValue(page, "Days since First Commit");
    expect(Number(value)).toBeGreaterThan(15);
  });

  test("TC-STAT-002: Commits count is plausible", async ({ page }) => {
    await page.goto("/");
    // Wait for animation to finish (1200ms duration)
    await page.waitForTimeout(1500);
    const value = await getStatValue(page, "Commits");
    expect(parseDE(value)).toBeGreaterThan(750);
  });

  test("TC-STAT-003: Zeilen Code is plausible", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);
    const value = await getStatValue(page, "Zeilen Code");
    expect(parseDE(value)).toBeGreaterThan(120000);
  });

  test("TC-STAT-004: Repositories count is plausible", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);
    const value = await getStatValue(page, "Repositories");
    // Plausibility guard, not an exact count. Post-restructure the stats-config
    // counts all neckarshore-* orgs + omnopsis-ai (31 repos as of 2026-06-12).
    // Generous upper bound leaves headroom for ecosystem growth while still
    // catching an absurd value (e.g. a config that accidentally pulls forks).
    expect(Number(value)).toBeGreaterThanOrEqual(20);
    expect(Number(value)).toBeLessThanOrEqual(100);
  });

  test("TC-STAT-005: Tests count is plausible", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);
    const value = await getStatValue(page, "Automatisierte Tests");
    expect(parseDE(value)).toBeGreaterThan(370);
  });

  test("TC-STAT-006: Endpoints count is plausible", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);
    const value = await getStatValue(page, "REST Endpoints");
    expect(Number(value)).toBeGreaterThan(75);
  });

  test("TC-STAT-007: No tile shows zero or dash", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);
    const tiles = page.locator("p.font-heading");
    const count = await tiles.count();
    for (let i = 0; i < count; i++) {
      const text = (await tiles.nth(i).textContent())?.trim() || "";
      expect(text).not.toBe("0");
      expect(text).not.toBe("—");
    }
  });

  // TC-STAT-009 (#244, exact-figure rev. 2026-07-10): the Tests tile big number is DATA-DRIVEN
  // off public/stats.json — never a hardcoded literal. The tile renders the EXACT total (Founder
  // directive 2026-07-10 — the old round-down-to-100 framing is retired) + the load-bearing "+"
  // when floor-framed. If anyone hardcodes the figure, a change to stats.json.testScope would
  // make this fail → the regression guard the brief asks for. (#245 follow-up: the sub-line is no
  // longer the repo count — that was dropped to avoid the 20-vs-31 contradiction — but a "mehr"
  // cue into /test-management.)
  test("TC-STAT-009: Tests tile renders the EXACT estate total from stats.json (no literal, no rounding)", async ({
    page,
  }) => {
    const stats = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "public", "stats.json"), "utf-8"),
    );
    const total: number = stats.testScope?.total ?? stats.tests;
    const isFloor: boolean = stats.testScope?.floor ?? false;

    // Exact figure + load-bearing "+" when the total is a floor (e.g. "3.391+").
    const expectedValue = total.toLocaleString("de-DE") + (isFloor ? "+" : "");

    await page.goto("/");
    await page.waitForTimeout(1500); // animation settles on the target

    const value = await getStatValue(page, "Automatisierte Tests");
    expect(value).toBe(expectedValue); // e.g. "3.391+" — exact, derived from JSON not a literal

    // Sub-line is now the "mehr" cue into the detail page (no repo count, no per-type split).
    const subline = page.getByTestId("tests-subline");
    await expect(subline).toBeVisible();
    await expect(subline).toContainText("mehr");
    await expect(subline).not.toContainText("Repositories");
  });

  test("TC-STAT-010: Repositories tile links into the inventory and matches repositories.json", async ({
    page,
  }) => {
    // Two things at once, because they failed together on 2026-08-12: the tile
    // showed a number nobody could check (34, from a hand-maintained list), and
    // there was no way to click through to the list itself. The count assertion
    // is derived from the served artifact — never a literal, or this test becomes
    // the next hand-maintained number.
    const res = await page.request.get("/repositories.json");
    expect(res.status()).toBe(200);
    const inventory = await res.json();
    const expected = inventory.repos.length + inventory.privateCount;

    await page.goto("/");
    await page.waitForTimeout(1500); // animated counter settles

    const value = await getStatValue(page, "Repositories");
    expect(value).toBe(String(expected));

    const subline = page.getByTestId("repos-subline");
    await expect(subline).toBeVisible();
    await expect(subline).toContainText("mehr");

    const link = page.locator('a[data-track="stats_repos_detail"]');
    await expect(link).toHaveAttribute("href", "/repositories");
    await link.click();
    await expect(page).toHaveURL(/\/repositories$/);
  });

  test("TC-STAT-008: No API call to /api/github-stats", async ({ page }) => {
    const apiCalls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/api/github-stats")) {
        apiCalls.push(req.url());
      }
    });
    await page.goto("/");
    await page.waitForTimeout(2000);
    expect(apiCalls).toHaveLength(0);
  });
});
