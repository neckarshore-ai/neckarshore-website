import { test } from "node:test";
import assert from "node:assert/strict";

import { evaluate, report, ORGS, EXCLUDED_NAMES } from "../../scripts/check-repo-list.mjs";

/**
 * The network half of check-repo-list.mjs needs a cross-org PAT and therefore
 * runs in update-stats.yml, not here. What IS testable without a token is the
 * part that actually decides the verdict — and it is the part that would have
 * caught the 2026-08-12 drift. These tests pin the two failure modes that a
 * length comparison cannot see.
 */

test("green when the configured set equals the live set", () => {
  const v = evaluate({
    configured: ["neckarshore-ai/vault", "neckarshore-mmps/kaze"],
    live: ["neckarshore-mmps/kaze", "neckarshore-ai/vault"],
  });
  assert.equal(v.ok, true);
  assert.deepEqual(v.missing, []);
  assert.deepEqual(v.stale, []);
  assert.match(report(v), /^OK:/);
});

test("a live repo missing from the config is reported as missing", () => {
  const v = evaluate({
    configured: ["neckarshore-ai/vault"],
    live: ["neckarshore-ai/vault", "neckarshore-mmps/musclecat"],
  });
  assert.equal(v.ok, false);
  assert.deepEqual(v.missing, ["neckarshore-mmps/musclecat"]);
  assert.match(report(v), /\+ neckarshore-mmps\/musclecat/);
});

test("a configured repo that is no longer live is reported as stale", () => {
  const v = evaluate({
    configured: ["neckarshore-ai/vault", "neckarshore-ai/observatory"],
    live: ["neckarshore-ai/vault"],
  });
  assert.equal(v.ok, false);
  assert.deepEqual(v.stale, ["neckarshore-ai/observatory"]);
});

test("EQUAL LENGTHS ARE NOT EQUAL SETS — the case a count check cannot see", () => {
  // Exactly the 2026-08-12 shape: one repo dropped, one added, count unchanged.
  const v = evaluate({
    configured: ["neckarshore-ai/vault", "neckarshore-ai/observatory"],
    live: ["neckarshore-ai/vault", "neckarshore-mmps/musclecat"],
  });
  assert.equal(v.counts.configured, v.counts.live, "Vorbedingung: gleiche Anzahl");
  assert.equal(v.ok, false, "gleiche Anzahl darf NICHT gruen sein");
  assert.deepEqual(v.missing, ["neckarshore-mmps/musclecat"]);
  assert.deepEqual(v.stale, ["neckarshore-ai/observatory"]);
});

test("a rename kept alongside its old slug is caught as a duplicate", () => {
  // `mmp-prod-or-pretend` resolves to `prod-or-pretend`; keeping both entries
  // makes the resolved list carry the same repo twice. Length says 2, truth says 1.
  const v = evaluate({
    configured: ["neckarshore-mmps/prod-or-pretend", "neckarshore-mmps/prod-or-pretend"],
    live: ["neckarshore-mmps/prod-or-pretend"],
  });
  assert.equal(v.ok, false);
  assert.deepEqual(v.duplicates, ["neckarshore-mmps/prod-or-pretend"]);
  assert.match(report(v), /zaehlt zweimal/);
});

test("an archived repo still listed fails even when the sets match", () => {
  const v = evaluate({
    configured: ["neckarshore-ai/observatory"],
    live: ["neckarshore-ai/observatory"],
    archived: ["neckarshore-ai/observatory"],
  });
  assert.deepEqual(v.archivedInConfig, ["neckarshore-ai/observatory"]);
  assert.match(report(v), /Archiviert und trotzdem gelistet/);
});

test("the membership rule is pinned in code, not only in prose", () => {
  assert.deepEqual(
    ORGS,
    [
      "neckarshore-agents",
      "neckarshore-ai",
      "neckarshore-mmps",
      "neckarshore-skills",
      "neckarshore-websites",
      "omnopsis-ai",
    ],
    "Founder-Entscheidung 2026-08-12: genau diese sechs Orgs, keine persoenlichen Accounts",
  );
  assert.deepEqual(EXCLUDED_NAMES, [".github"]);
});
