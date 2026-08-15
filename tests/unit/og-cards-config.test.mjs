import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { cards } from "../../scripts/og-cards.config.mjs";

// Guard for the branding-card inventory (docs/branding/README.md).
//
// WHY THIS EXISTS: on 2026-08-15 the branding README — the document that calls itself
// "source of truth for all social preview visuals" — listed 5 cards while this config
// produced 23, and reported uploads as pending that had been done weeks earlier. The
// README was rewritten to point at the config instead of copying it, but that alone
// changes nothing: a configured card that was never generated is still invisible, and
// nothing would say so.
//
// WHAT IT ASSERTS: every configured `dest` either exists on disk, or is one of the
// entries this repo has consciously decided NOT to generate. The second list is the
// whole point — "blocked on a decision" and "silently forgotten" look identical on a
// filesystem, and only one of them is acceptable.
//
// WHAT IT DOES NOT ASSERT: that an existing file is CURRENT (a card generated before a
// brand change still passes), and nothing at all about the manual GitHub upload surface,
// which has no API. Both are stated so the green check is not read as more than it is.

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../..");

/**
 * Cards configured but deliberately not generated. Each entry needs a reason, and the
 * reason must name what would have to change for it to be removed — same contract as the
 * audit-gate allowlist. Both of these await the MASCHIN positioning brief
 * (docs/branding/positioning-request-maschin.md); generating them today would ship a card
 * carrying positioning nobody has decided.
 */
const DELIBERATELY_UNGENERATED = new Map([
  ["docs/branding/github-social-preview-omnopsis.jpg", "awaiting MASCHIN positioning brief"],
  ["docs/branding/github-social-preview-cee.jpg", "awaiting MASCHIN positioning brief"],
]);

test("every configured card is either generated or consciously blocked", () => {
  const missing = [];
  for (const card of cards) {
    if (existsSync(resolve(ROOT, card.dest))) continue;
    if (DELIBERATELY_UNGENERATED.has(card.dest)) continue;
    missing.push(`${card.label} -> ${card.dest}`);
  }
  assert.deepEqual(
    missing,
    [],
    `configured cards with no output file and no recorded reason:\n  ${missing.join("\n  ")}\n` +
      `Either run \`node scripts/generate-og-image.mjs\`, or add the card to ` +
      `DELIBERATELY_UNGENERATED with a reason.`,
  );
});

test("the blocked list does not outlive its reason", () => {
  // An entry that HAS been generated must leave this list, or "blocked" quietly becomes a
  // permanent label on work that is finished — the same failure mode the audit-gate's
  // expiring allowlist is built to prevent.
  const stale = [...DELIBERATELY_UNGENERATED.keys()].filter((dest) =>
    existsSync(resolve(ROOT, dest)),
  );
  assert.deepEqual(
    stale,
    [],
    `these are listed as blocked but the file now exists — remove them from ` +
      `DELIBERATELY_UNGENERATED:\n  ${stale.join("\n  ")}`,
  );
});

test("every blocked entry is actually a configured card, and carries a reason", () => {
  // Catches the other direction: a dest that no longer exists in the config would sit here
  // forever, suppressing nothing and explaining a card that is gone.
  const configured = new Set(cards.map((c) => c.dest));
  for (const [dest, reason] of DELIBERATELY_UNGENERATED) {
    assert.ok(configured.has(dest), `blocked entry is not in og-cards.config.mjs: ${dest}`);
    assert.ok(
      typeof reason === "string" && reason.trim().length > 10,
      `blocked entry needs a substantive reason: ${dest}`,
    );
  }
});

test("no two cards write to the same destination", () => {
  const seen = new Map();
  const collisions = [];
  for (const card of cards) {
    if (seen.has(card.dest)) collisions.push(`${card.dest}: ${seen.get(card.dest)} + ${card.label}`);
    seen.set(card.dest, card.label);
  }
  assert.deepEqual(collisions, [], `two cards would overwrite each other:\n  ${collisions.join("\n  ")}`);
});
