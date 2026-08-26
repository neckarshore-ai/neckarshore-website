/**
 * Unit tests for src/lib/repo-types.ts — the repo → Typ classifier.
 *
 * It is load-bearing: it groups the /repositories inventory + labels the /test-management
 * per-repo table. The bug-prone parts are the org defaults and the override table (infra /
 * tooling / planning repos that live in a product org and would otherwise be mislabelled).
 *
 * Run: npm run test:unit
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { repoType, REPO_TYPE_ORDER } from "../../src/lib/repo-types";

test("classifies by GitHub org default", () => {
  assert.equal(repoType("omnopsis-ai/omnopsis-backend"), "Produkt");
  assert.equal(repoType("neckarshore-mmps/snakeoil-check"), "MMP");
  assert.equal(repoType("neckarshore-skills/obsidian-vault-autopilot"), "Plugin/Skill");
  assert.equal(repoType("neckarshore-websites/neckarshore-website"), "Webseite");
  assert.equal(repoType("neckarshore-ai/dev-environment"), "Sonstige");
  assert.equal(repoType("neckarshore-agents/marvin-hq"), "Sonstige");
});

test("overrides win over the org default (infra/tooling/planning in a product org)", () => {
  assert.equal(repoType("omnopsis-ai/omnopsis-planning"), "Sonstige");
  assert.equal(repoType("omnopsis-ai/omnopsis-test-management"), "Sonstige");
  assert.equal(repoType("neckarshore-websites/site-quality"), "Sonstige");
  assert.equal(repoType("neckarshore-skills/test-stats-action"), "Sonstige");
});

test("unknown org or malformed slug → Sonstige (fail-safe)", () => {
  assert.equal(repoType("some-other-org/whatever"), "Sonstige");
  assert.equal(repoType("nocolon"), "Sonstige");
  assert.equal(repoType(""), "Sonstige");
});

test("REPO_TYPE_ORDER is the 5 canonical types, Produkt first / Sonstige last", () => {
  assert.deepEqual(REPO_TYPE_ORDER, [
    "Produkt",
    "MMP",
    "Plugin/Skill",
    "Webseite",
    "Sonstige",
  ]);
});
