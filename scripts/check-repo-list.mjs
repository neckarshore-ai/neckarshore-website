#!/usr/bin/env node
/**
 * Membership gate for stats-config.json.
 *
 * The "Repositories" tile on the homepage does not count repositories. It
 * counts the LENGTH OF A HAND-MAINTAINED LIST, and on 2026-08-12 that list
 * had drifted far enough to be wrong in both directions at once: it carried
 * NINE archived repos (marvin-hq, observatory, four obsidian-* scrapers and
 * three more) and was missing THIRTEEN live ones (kaze, musclecat, vault,
 * social-scrapers, paulus-website, ...). Net effect 34 against a true 38 —
 * the two errors partially cancelled, which is precisely why nobody noticed.
 * Nothing caught it; it surfaced because the Founder looked at the tile and
 * asked whether the number was right.
 *
 * This script is the answer to "why did no gate hold". There was none.
 *
 * DESIGN RULES, in order of importance:
 *
 *  1. COMPARE SETS, NEVER LENGTHS. A length check is blind to the exact
 *     failure that started this: `mmp-prod-or-pretend` was RENAMED to
 *     `prod-or-pretend`, and the GitHub API silently follows the redirect. A
 *     naive repair adds the new name and keeps the old one — length 38, but
 *     37 distinct repos with one counted twice. Set equality on the RESOLVED
 *     full_name catches that; `.repos.length === 38` never can.
 *  2. FAIL CLOSED, AND NEVER SKIP ON A MISSING TOKEN. This needs a cross-org
 *     PAT, which is why it runs inside update-stats.yml (where STATS_PAT
 *     already lives) and NOT in the PR test job, where the only honest
 *     options would be "always red" or "skip when the secret is absent". The
 *     second is a false green and is exactly what backlog #448 ("vacuity
 *     guards must be CODE, not prose") forbids. No token, no network, no
 *     parse -> exit 1.
 *  3. THE MEMBERSHIP RULE LIVES HERE, NOT IN PROSE. Founder decision
 *     2026-08-12: every non-archived repo of the six company orgs, minus the
 *     empty .github meta-repos. Personal accounts do not count. stats-config
 *     carries the same sentence in `_rule`, but THIS file is what makes it
 *     true. A rule that only exists as a sentence is the drift class we are
 *     closing (see L-NECK-DOC-STATUS-PROSE-UNGATED, n=5).
 *  4. ARCHIVED IS A SEPARATE VERDICT. A repo that got archived since the last
 *     run is reported as such, not as a mystery mismatch, because that is the
 *     single most likely reason this gate ever goes red.
 *  5. NO NEW DEPENDENCY. Zero-dep Node with fetch, same house style as
 *     scripts/audit-gate.mjs.
 *
 * Usage:  STATS_PAT=... node scripts/check-repo-list.mjs
 * Tests:  node --test tests/unit/check-repo-list.test.mjs   (pure part only)
 */

import { readFileSync } from "node:fs";

/**
 * The six company orgs. A personal account is deliberately NOT a member:
 * Comedy-Execution-Engine lives under a personal login and is an estate
 * product, and the Founder still chose the clean account rule over an
 * exception (2026-08-12). Keep it that way — an exception here is an
 * exception the next reader has to discover.
 */
export const ORGS = [
  "neckarshore-agents",
  "neckarshore-ai",
  "neckarshore-mmps",
  "neckarshore-skills",
  "neckarshore-websites",
  "omnopsis-ai",
];

/** Org-level meta repos. They hold org profile/workflow config and no product. */
export const EXCLUDED_NAMES = [".github"];

/**
 * Pure comparison. Both inputs are arrays of `owner/name` strings; `live` is
 * what GitHub reports today, `configured` is stats-config resolved through
 * any renames. `archived` lists configured entries GitHub reports as archived.
 */
export function evaluate({ configured, live, archived = [] }) {
  const liveSet = new Set(live);
  const configuredSet = new Set(configured);

  const missing = [...liveSet].filter((r) => !configuredSet.has(r)).sort();
  const stale = [...configuredSet].filter((r) => !liveSet.has(r)).sort();
  const duplicates = configured.filter((r, i) => configured.indexOf(r) !== i).sort();
  const archivedInConfig = [...archived].sort();

  return {
    // ONE verdict, archived included. An earlier version kept `ok` free of the
    // archived check and handled it separately at the call site — so report()
    // printed "OK" for a config that still listed a dead repo. Two verdicts
    // for one question is how a gate ends up contradicting itself.
    ok:
      missing.length === 0 &&
      stale.length === 0 &&
      duplicates.length === 0 &&
      archivedInConfig.length === 0,
    missing,
    stale,
    duplicates,
    archivedInConfig,
    counts: { configured: configuredSet.size, live: liveSet.size },
  };
}

/** Render a verdict for a CI log. Returns a string; the caller decides on exit. */
export function report(v) {
  if (v.ok) {
    return `OK: stats-config listet genau die ${v.counts.live} lebenden Repos der sechs Orgs.`;
  }
  const out =
    v.counts.configured === v.counts.live
      ? [
          `FAIL: stats-config und GitHub melden beide ${v.counts.live} Repos, es sind aber`,
          "nicht dieselben. Genau dafuer vergleicht dieses Gate Mengen und nicht Anzahlen.",
        ]
      : [`FAIL: stats-config (${v.counts.configured}) weicht von GitHub (${v.counts.live}) ab.`];
  if (v.missing.length) {
    out.push("", "Lebt, fehlt aber in stats-config (aufnehmen):");
    v.missing.forEach((r) => out.push(`  + ${r}`));
  }
  if (v.stale.length) {
    out.push(
      "",
      "In stats-config, aber nicht in der Live-Menge (archiviert, geloescht",
      "oder umbenannt — bei einer Umbenennung den Eintrag AENDERN, nicht einen",
      "zweiten anlegen):",
    );
    v.stale.forEach((r) => out.push(`  - ${r}`));
  }
  if (v.duplicates.length) {
    out.push("", "Doppelt in stats-config (zaehlt zweimal):");
    v.duplicates.forEach((r) => out.push(`  ! ${r}`));
  }
  if (v.archivedInConfig.length) {
    out.push("", "Archiviert und trotzdem gelistet:");
    v.archivedInConfig.forEach((r) => out.push(`  ~ ${r}`));
  }
  return out.join("\n");
}

// --------------------------------------------------------------------------
// Network half. Only runs when this file is executed directly.
// --------------------------------------------------------------------------

async function gh(path, token) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "neckarshore-repo-list-gate",
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub ${res.status} auf ${path}`);
  }
  return res.json();
}

async function fetchLive(token) {
  const out = [];
  for (const org of ORGS) {
    for (let page = 1; ; page++) {
      const batch = await gh(`/orgs/${org}/repos?per_page=100&page=${page}&type=all`, token);
      if (!Array.isArray(batch)) throw new Error(`Unerwartete Antwort fuer ${org}`);
      for (const repo of batch) {
        if (repo.archived) continue;
        if (EXCLUDED_NAMES.includes(repo.name)) continue;
        out.push(repo.full_name);
      }
      if (batch.length < 100) break;
    }
  }
  return out;
}

async function resolveConfigured(entries, token) {
  const resolved = [];
  const archived = [];
  for (const e of entries) {
    // Resolves renames: GitHub answers the old slug with the current full_name.
    const meta = await gh(`/repos/${e.owner}/${e.name}`, token);
    resolved.push(meta.full_name);
    if (meta.archived) archived.push(meta.full_name);
  }
  return { resolved, archived };
}

async function main() {
  const token = process.env.STATS_PAT;
  if (!token) {
    console.error(
      "FAIL: STATS_PAT fehlt. Dieses Gate braucht org-uebergreifenden Lesezugriff und\n" +
        "darf NICHT stillschweigend uebersprungen werden — ein uebersprungenes Gate\n" +
        "meldet gruen und behauptet damit etwas, das es nicht geprueft hat.",
    );
    process.exit(1);
  }

  const config = JSON.parse(readFileSync(new URL("../stats-config.json", import.meta.url), "utf8"));
  if (!Array.isArray(config.repos) || config.repos.length === 0) {
    console.error("FAIL: stats-config.json enthaelt keine repos-Liste.");
    process.exit(1);
  }

  const live = await fetchLive(token);
  const { resolved, archived } = await resolveConfigured(config.repos, token);
  const verdict = evaluate({ configured: resolved, live, archived });

  console.log(report(verdict));
  if (!verdict.ok || verdict.archivedInConfig.length > 0) process.exit(1);
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith("check-repo-list.mjs");
if (invokedDirectly) {
  main().catch((err) => {
    console.error(`FAIL: ${err.message}`);
    process.exit(1);
  });
}
