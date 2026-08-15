/**
 * Named-claim drift guard for the two AI-reader surfaces (`/llms.txt`, `/llms-full.txt`).
 *
 * WHAT THIS GUARDS — AND WHAT IT DOES NOT. This asserts a NAMED list of claims: the
 * three that were measured stale on 2026-08-07 (a "5-10x" pricing claim and a "300+
 * automated tests" figure the site had already corrected, plus a frozen export date),
 * and a small required set. It does NOT guard the CLASS: nothing here compares the
 * rendered pages against the export prose semantically. That comparison is not cheaply
 * buildable and was explicitly not ordered (work order 2026-08-07, part 3). So a NEW
 * stale claim in the hand-written prose blocks of `llms-index.ts` passes this file.
 * Adding a claim here is the cheap half of the duty; the expensive half stays open.
 *
 * The test figure is compared against `public/stats.json`, never against a literal:
 * the daily stats commit moves that number, and a pinned expectation would rot into a
 * false red within days.
 *
 * Run: `npm run test:unit`
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildLlmsIndexText } from "../../src/lib/llms-index.ts";
import { buildLlmsFullText } from "../../src/lib/llms-full.ts";
import { SITE_UPDATED } from "../../src/lib/site-config.ts";

/** Claims that were live and false. Each entry is a regression that actually happened. */
const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  {
    pattern: /5-10x/i,
    why: "pricing claim the rendered site softened to 'deutlich kosteneffektiver'",
  },
  {
    pattern: /300\+\s*automated tests/i,
    why: "test figure superseded by the audited estate count in public/stats.json",
  },
  {
    pattern: /exported:\s*"2026-06-22"/,
    why: "frozen export date — SITE_UPDATED was stale for seven weeks",
  },
];

/** Facts the surfaces must carry. Absence here means the derivation silently broke. */
const REQUIRED = [
  "TrustScope",
  "Omnopsis Documentor+X",
  "https://neckarshore.ai/products",
  "info@neckarshore.ai",
];

const surfaces: { name: string; text: string }[] = [
  { name: "llms.txt", text: buildLlmsIndexText() },
  { name: "llms-full.txt", text: buildLlmsFullText() },
];

for (const surface of surfaces) {
  // Non-vacuity: every "does not contain" assertion below would also pass on an empty
  // string, so pin substance first (#448 — a vacuity guard must be code, not a comment).
  test(`${surface.name}: output is substantial`, () => {
    assert.ok(
      surface.text.length > 1000,
      `${surface.name} is ${surface.text.length} chars — the generator produced nothing worth guarding`,
    );
    assert.match(surface.text, /^# Neckarshore AI/);
  });

  test(`${surface.name}: carries no retired claim`, () => {
    for (const { pattern, why } of FORBIDDEN) {
      assert.ok(
        !pattern.test(surface.text),
        `${surface.name} still ships ${pattern} — ${why}`,
      );
    }
  });

  test(`${surface.name}: carries the required facts`, () => {
    for (const needle of REQUIRED) {
      assert.ok(surface.text.includes(needle), `${surface.name} lost "${needle}"`);
    }
  });

  test(`${surface.name}: test figure matches public/stats.json`, () => {
    const stats = JSON.parse(readFileSync("public/stats.json", "utf8")) as {
      tests?: number;
      testScope?: { total?: number; floor?: boolean };
    };
    const total = stats.testScope?.total ?? stats.tests;
    const expected = `${total}${stats.testScope?.floor ? "+" : ""} automated tests`;
    assert.ok(
      surface.text.includes(expected),
      `${surface.name} does not carry the current audited figure "${expected}"`,
    );
  });

  test(`${surface.name}: export date is the current SITE_UPDATED`, () => {
    assert.ok(
      surface.text.includes(SITE_UPDATED),
      `${surface.name} does not carry SITE_UPDATED (${SITE_UPDATED})`,
    );
  });
}
