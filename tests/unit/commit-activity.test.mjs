import { test } from "node:test";
import assert from "node:assert/strict";

import { aggregate, AREA_LABELS } from "../../scripts/fetch-commit-activity.mjs";

/**
 * Pure half of the /commits data build. The network half needs a cross-org PAT and runs in
 * update-stats.yml; what is testable here is the aggregation, which is where the two
 * non-obvious decisions live: the start-date clipping and the deliberate naming of the
 * series sum.
 */

const WEEK = 7 * 24 * 60 * 60;
/** Unix seconds for a Monday-ish bucket start. */
const w = (iso) => Math.floor(Date.parse(iso) / 1000);
const NOW = Date.parse("2026-08-12T00:00:00Z");

test("sums the same week across repos", () => {
  const out = aggregate({
    series: [
      { owner: "neckarshore-ai", weeks: [{ week: w("2026-04-05"), total: 10 }] },
      { owner: "neckarshore-mmps", weeks: [{ week: w("2026-04-05"), total: 5 }] },
    ],
    startDate: "2026-03-22",
    now: NOW,
  });
  assert.deepEqual(out.weeks, [{ week: "2026-04-05", total: 15 }]);
  assert.equal(out.seriesTotal, 15);
});

test("drops buckets that end before the estate began — the API always returns 52 weeks", () => {
  const out = aggregate({
    series: [
      {
        owner: "neckarshore-ai",
        weeks: [
          { week: w("2025-12-07"), total: 99 }, // long before startDate
          { week: w("2026-04-05"), total: 7 },
        ],
      },
    ],
    startDate: "2026-03-22",
    now: NOW,
  });
  assert.deepEqual(
    out.weeks.map((x) => x.week),
    ["2026-04-05"],
  );
  assert.equal(out.seriesTotal, 7, "die 99 vor dem Projektstart zaehlen nicht mit");
});

test("keeps the week that CONTAINS the start date, not only weeks after it", () => {
  // startDate 2026-03-22 falls inside the bucket beginning 2026-03-16. Dropping that bucket
  // would silently discard the estate's first days of work.
  const start = w("2026-03-16");
  assert.ok(start * 1000 < Date.parse("2026-03-22"), "Vorbedingung: Bucket beginnt vor dem Start");
  const out = aggregate({
    series: [{ owner: "neckarshore-ai", weeks: [{ week: start, total: 4 }] }],
    startDate: "2026-03-22",
    now: NOW,
  });
  assert.equal(out.seriesTotal, 4);
  assert.equal(out.weeks.length, 1);
});

test("ignores buckets in the future", () => {
  const out = aggregate({
    series: [
      {
        owner: "neckarshore-ai",
        weeks: [
          { week: w("2026-08-09"), total: 3 },
          { week: w("2026-08-09") + WEEK * 4, total: 500 },
        ],
      },
    ],
    startDate: "2026-03-22",
    now: NOW,
  });
  assert.equal(out.seriesTotal, 3);
});

test("months roll up chronologically and the peak is the largest month", () => {
  const out = aggregate({
    series: [
      {
        owner: "neckarshore-ai",
        weeks: [
          { week: w("2026-04-05"), total: 10 },
          { week: w("2026-04-12"), total: 20 },
          { week: w("2026-05-03"), total: 5 },
        ],
      },
    ],
    startDate: "2026-03-22",
    now: NOW,
  });
  assert.deepEqual(out.months, [
    { month: "2026-04", total: 30 },
    { month: "2026-05", total: 5 },
  ]);
  assert.deepEqual(out.peak, { month: "2026-04", total: 30 });
});

test("areas are labelled, sorted by size, and an unknown org keeps its login", () => {
  const out = aggregate({
    series: [
      { owner: "neckarshore-skills", weeks: [{ week: w("2026-04-05"), total: 3 }] },
      { owner: "neckarshore-websites", weeks: [{ week: w("2026-04-05"), total: 9 }] },
      { owner: "brand-new-org", weeks: [{ week: w("2026-04-05"), total: 1 }] },
    ],
    startDate: "2026-03-22",
    now: NOW,
  });
  assert.deepEqual(out.areas, [
    { area: AREA_LABELS["neckarshore-websites"], total: 9 },
    { area: AREA_LABELS["neckarshore-skills"], total: 3 },
    { area: "brand-new-org", total: 1 },
  ]);
});

test("THE SUM IS NAMED seriesTotal AND NEVER total — the site has one commits number", () => {
  // GitHub's weekly statistics are a cached snapshot that lags the contributors sum the
  // Commits tile publishes. If this key were called `total`, the next reader would render it
  // as the commits count and the site would carry two different figures for one fact.
  const out = aggregate({
    series: [{ owner: "neckarshore-ai", weeks: [{ week: w("2026-04-05"), total: 12 }] }],
    startDate: "2026-03-22",
    now: NOW,
  });
  assert.ok("seriesTotal" in out, "seriesTotal muss existieren");
  assert.ok(!("total" in out), "ein Feld namens `total` waere eine Einladung zum Fehlgebrauch");
});

test("an incomplete fetch is reported, not silently absorbed", () => {
  const out = aggregate({
    series: [{ owner: "neckarshore-ai", weeks: [{ week: w("2026-04-05"), total: 1 }] }],
    startDate: "2026-03-22",
    reposMissing: 2,
    now: NOW,
  });
  assert.equal(out.reposMissing, 2);
  assert.equal(out.reposCounted, 1);
});

test("no input at all yields an empty series rather than a crash", () => {
  const out = aggregate({ series: [], startDate: "2026-03-22", now: NOW });
  assert.deepEqual(out.weeks, []);
  assert.equal(out.seriesTotal, 0);
  assert.equal(out.peak, null);
});
