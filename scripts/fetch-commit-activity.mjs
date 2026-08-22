#!/usr/bin/env node
/**
 * Builds public/commit-activity.json — the data behind /commits.
 *
 * WHY THIS SHAPE. The Commits tile publishes one number and says nothing about
 * how it came to be. A per-repo table would have said it in the same words as
 * /repositories, one column apart; a timeline says the thing only a timeline
 * can: when this estate was actually built, and that it was built continuously.
 *
 * WHY commit_activity AND NOT CLONES. GitHub's /stats/commit_activity returns
 * 52 weekly buckets per repo in ONE call. The estate's first commit is
 * 2026-03-22, so the entire history fits inside that window — no full clones,
 * no history walk, no new artifact-collection design. It costs 38 requests.
 *
 * PRIVACY IS STRUCTURAL HERE, NOT A FILTER. The output carries NO repo names at
 * all — not public ones either. Every bucket is an estate-wide or per-ORG total,
 * and org logins are already public in repositories.json. There is therefore no
 * private slug to withhold, which is a stronger position than withholding one
 * correctly: the #267 leak gate still scans this file, but it is guarding a file
 * whose shape cannot carry the thing it looks for.
 *
 * FAIL-SOFT, DELIBERATELY, AND THE OPPOSITE OF check-repo-list.mjs. That gate
 * fails CLOSED because a wrong list makes every downstream number wrong. This
 * one fails SOFT: a repo whose stats endpoint is still warming up (GitHub
 * answers 202 while it computes) contributes zero and is COUNTED as incomplete
 * in `reposMissing`, which the page renders. A timeline that silently drops a
 * repo would understate the estate and look perfectly healthy doing it.
 *
 * Usage:  STATS_PAT=... node scripts/fetch-commit-activity.mjs
 * Tests:  node --test tests/unit/commit-activity.test.mjs   (pure part only)
 */

import { readFileSync, writeFileSync } from "node:fs";

/** Human labels per org. Unknown orgs fall back to the login — never to "other". */
export const AREA_LABELS = {
  "neckarshore-agents": "Agenten",
  "neckarshore-ai": "Infrastruktur",
  "neckarshore-mmps": "MMPs",
  "neckarshore-skills": "Skills",
  "neckarshore-websites": "Websites",
  "omnopsis-ai": "Omnopsis",
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Pure aggregation. `series` is one entry per repo: { owner, weeks: [{week, total}] }
 * with `week` as a unix SECOND timestamp (GitHub's format). `startDate` clips the
 * output to the estate's own history — the API always returns a full 52 weeks, and
 * the buckets before the first commit are real zeros that would draw a long flat
 * lead-in suggesting months of nothing.
 */
export function aggregate({ series, startDate, reposMissing = 0, now }) {
  const startMs = Date.parse(startDate);
  const byWeek = new Map();
  const byMonth = new Map();
  const byArea = new Map();

  for (const repo of series) {
    for (const bucket of repo.weeks) {
      const ms = bucket.week * 1000;
      // Keep the week that CONTAINS the start date, not only weeks after it.
      if (ms + WEEK_MS <= startMs) continue;
      if (ms > now) continue;
      const iso = new Date(ms).toISOString().slice(0, 10);
      const month = iso.slice(0, 7);
      byWeek.set(iso, (byWeek.get(iso) ?? 0) + bucket.total);
      byMonth.set(month, (byMonth.get(month) ?? 0) + bucket.total);
      byArea.set(repo.owner, (byArea.get(repo.owner) ?? 0) + bucket.total);
    }
  }

  const weeks = [...byWeek.entries()].sort().map(([week, total]) => ({ week, total }));
  const months = [...byMonth.entries()].sort().map(([month, total]) => ({ month, total }));
  const areas = [...byArea.entries()]
    .map(([owner, total]) => ({ area: AREA_LABELS[owner] ?? owner, total }))
    .sort((a, b) => b.total - a.total || a.area.localeCompare(b.area));

  // NAMED seriesTotal, NOT total, and the name is load-bearing. It is NOT the
  // site's commits figure and must never be rendered as one. Measured 2026-08-12:
  // GitHub's weekly statistics are a CACHED snapshot that lags — the current week
  // reported 150 for neckarshore-planning while a live commit search returned 188
  // for the same window, and every one of the 38 repos sits at or below its
  // contributors-sum. The Commits tile keeps its own canonical number (contributors
  // endpoint, public/stats.json); this series carries SHAPE. Publishing both as
  // totals would put two different commit counts on one site, which is the exact
  // drift class the repo-count gate was built to end.
  const seriesTotal = weeks.reduce((sum, w) => sum + w.total, 0);
  const peak = months.reduce((best, m) => (best && best.total >= m.total ? best : m), null);

  return { seriesTotal, weeks, months, areas, peak, reposMissing, reposCounted: series.length };
}

// --------------------------------------------------------------------------
// Network half. Only runs when executed directly.
// --------------------------------------------------------------------------

async function ghJson(path, token, { retries = 4 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "neckarshore-commit-activity",
      },
    });
    // 202 = GitHub is computing the statistics; the documented answer is to wait
    // and ask again. Not an error, and not a reason to drop the repo.
    if (res.status === 202) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    if (!res.ok) throw new Error(`GitHub ${res.status} auf ${path}`);
    return res.json();
  }
  return null; // still warming after the last retry — caller counts it as missing
}

async function main() {
  const token = process.env.STATS_PAT;
  if (!token) {
    console.error("FAIL: STATS_PAT fehlt — ohne Token sind die privaten Repos unsichtbar und die");
    console.error("Zeitleiste waere still unvollstaendig statt sichtbar unvollstaendig.");
    process.exit(1);
  }

  const configUrl = new URL("../stats-config.json", import.meta.url);
  const config = JSON.parse(readFileSync(configUrl, "utf8"));

  const series = [];
  let missing = 0;
  for (const repo of config.repos) {
    const slug = `${repo.owner}/${repo.name}`;
    let data = null;
    try {
      data = await ghJson(`/repos/${slug}/stats/commit_activity`, token);
    } catch (err) {
      console.warn(`  WARN ${slug}: ${err.message}`);
    }
    if (!Array.isArray(data)) {
      // Log the SLUG here only — this is CI output, not a served artifact.
      console.warn(`  WARN ${slug}: keine Aktivitaetsdaten (202/leer) — zaehlt als unvollstaendig`);
      missing++;
      continue;
    }
    series.push({
      owner: repo.owner,
      weeks: data.map((w) => ({ week: w.week, total: w.total })),
    });
  }

  const out = aggregate({
    series,
    startDate: config.startDate,
    reposMissing: missing,
    now: Date.now(),
  });

  const payload = {
    updatedAt: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    startDate: config.startDate,
    ...out,
  };

  writeFileSync(new URL("../public/commit-activity.json", import.meta.url), JSON.stringify(payload, null, 2) + "\n");
  console.log(
    `commit-activity: ${payload.seriesTotal} Commits (Serie) ueber ${payload.weeks.length} Wochen, ` +
      `${payload.reposCounted} Repos gezaehlt, ${payload.reposMissing} unvollstaendig.`,
  );
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith("fetch-commit-activity.mjs");
if (invokedDirectly) {
  main().catch((err) => {
    console.error(`FAIL: ${err.message}`);
    process.exit(1);
  });
}
