/**
 * Unit tests for the Tests-tile byType breakdown formatter (src/lib/stats-breakdown.ts).
 *
 * The bug-prone bits: A→Z type order (global sorting NFR — NOT the plan's illustrative
 * "unit · e2e" order), zero/absent types hidden, de-DE number formatting, and "nothing to
 * show → null" so the tile renders no sub-line. Tested in isolation so coverage does not
 * depend on whether the live stats.json has a populated byType yet (it does not until the
 * backend producer — Bob's Task 1 — lands; until then byType is {} and no sub-line shows).
 *
 * Run: npm run test:unit
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { breakdownLine } from "../../src/lib/stats-breakdown";

test("null / undefined / empty byType → null (no sub-line)", () => {
  assert.equal(breakdownLine(null), null);
  assert.equal(breakdownLine(undefined), null);
  assert.equal(breakdownLine({}), null);
});

test("all-zero byType → null (nothing worth showing)", () => {
  assert.equal(breakdownLine({ unit: 0, e2e: 0 }), null);
});

test("formats types A→Z, not in insertion order", () => {
  // insertion order is unit-then-e2e; output must be e2e-then-unit (A→Z)
  assert.equal(breakdownLine({ unit: 296, e2e: 255 }), "255 e2e · 296 unit");
});

test("hides zero-valued types but keeps positive ones", () => {
  assert.equal(
    breakdownLine({ unit: 296, integration: 0, e2e: 255 }),
    "255 e2e · 296 unit",
  );
});

test("formats numbers in de-DE (thousands dot)", () => {
  assert.equal(breakdownLine({ unit: 1296 }), "1.296 unit");
});

// flooredTotal (#244 round-down framing) was REMOVED 2026-07-10 (Founder directive: the tile
// shows the EXACT audited figure, never a rounded one). Its tests went with it; the exact-figure
// rendering is guarded by TC-STAT-009 (tile) and TC-CNT-069 (/test-management headline).
