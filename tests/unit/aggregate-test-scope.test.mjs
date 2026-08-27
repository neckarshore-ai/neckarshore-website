/**
 * Unit tests for scripts/aggregate-test-scope.sh — the estate test-scope aggregator.
 *
 * Why this exists: the script is the load-bearing "honest estate test number" logic
 * (Charter Artifact 6). The no-double-count rule (byType additive, lenses excluded) and
 * fail-closed-visible behaviour (a declared producer whose stats.json is missing/unparseable
 * → 0 + WARN + missing[]) are exactly the bug-prone parts. They are tested here against the
 * EXACT production code path: the script is pure dir-in → JSON-out, so the unit test exercises
 * the same jq aggregation that runs in CI. Only the curl fetch (a thin shim) lives in the
 * workflow YAML and is out of scope here (covered by the Task-2 workflow_dispatch dry-run).
 *
 * Contract: docs/reference/stats-json-contract.md (neckarshore-planning).
 * Run: npm run test:unit
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, "../../scripts/aggregate-test-scope.sh");
const SEED_PATH = path.resolve(__dirname, "../../estate-test-scope-seed.json");

/** owner/name → the per-repo file name the aggregator looks up in the stats dir. */
function statsFileName(owner, name) {
  return `${owner}__${name}.json`;
}

/**
 * Build an isolated fixture tree and run the aggregator against it.
 * @param repos  [{ owner, name, statsPath, stats }] — `stats` written to the dir
 *               (object → JSON, string → verbatim, undefined → file omitted = missing).
 * @param seed   optional floor-seed object ({ floor, repos:[{repo,total}] }) → written to
 *               seed.json and passed as the aggregator's 3rd arg (backlog #244).
 * @returns { json, stdout, stderr, status }
 */
function runAggregator(repos, seed) {
  const root = mkdtempSync(path.join(tmpdir(), "agg-test-scope-"));
  try {
    const statsDir = path.join(root, "stats");
    mkdirSync(statsDir);

    const config = {
      repos: repos.map(({ owner, name, statsPath }) => ({
        owner,
        name,
        ...(statsPath !== undefined ? { statsPath } : {}),
      })),
    };
    const configPath = path.join(root, "stats-config.json");
    writeFileSync(configPath, JSON.stringify(config, null, 2));

    for (const { owner, name, stats } of repos) {
      if (stats === undefined) continue; // missing file
      const file = path.join(statsDir, statsFileName(owner, name));
      writeFileSync(file, typeof stats === "string" ? stats : JSON.stringify(stats));
    }

    const args = [SCRIPT, configPath, statsDir];
    if (seed !== undefined) {
      const seedPath = path.join(root, "seed.json");
      writeFileSync(seedPath, JSON.stringify(seed));
      args.push(seedPath);
    }

    const result = spawnSync("bash", args, {
      encoding: "utf8",
    });
    let json;
    try {
      json = JSON.parse(result.stdout);
    } catch {
      json = null;
    }
    return { json, stdout: result.stdout, stderr: result.stderr, status: result.status };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("aggregates total + byType additively, excludes lenses, reports missing producer", () => {
  const { json, status } = runAggregator([
    {
      owner: "fix",
      name: "a",
      statsPath: "any/stats.json",
      stats: {
        repo: "fix/a",
        audited_sha: "aaa111",
        tests: { total: 215, byType: { unit: 19, e2e: 196 }, lenses: { seo_geo: 44 } },
        endpoints: 10,
        updatedAt: "2026-06-21T00:00:00Z",
      },
    },
    {
      owner: "fix",
      name: "b",
      statsPath: "any/stats.json",
      stats: {
        repo: "fix/b",
        audited_sha: "bbb222",
        tests: { total: 81, byType: { unit: 81 } },
        updatedAt: "2026-06-21T00:00:00Z",
      },
    },
    { owner: "fix", name: "c", statsPath: "any/stats.json", stats: undefined },
  ]);

  assert.equal(status, 0, "aggregator must exit 0 even with a missing producer (fail-soft)");
  assert.ok(json, "stdout must be valid JSON");

  // total = 215 + 81 (lenses NOT summed)
  assert.equal(json.total, 296);
  // byType merge-add; lenses (seo_geo) excluded entirely
  assert.deepEqual(json.byType, { unit: 100, e2e: 196 });
  assert.ok(!("seo_geo" in json.byType), "lenses must never leak into estate byType");

  assert.equal(json.reporting, 2);
  assert.equal(json.expected, 3);
  assert.deepEqual(json.missing, ["fix/c"]);
});

test("fail-soft: a producer with total but no byType still contributes its total", () => {
  // Mirrors the live omnopsis-backend old shape (tests.total present, byType absent)
  // before Bob's Task-1 producer lands. It must NOT be dropped to missing/0.
  const { json, status } = runAggregator([
    {
      owner: "omnopsis-ai",
      name: "omnopsis-backend",
      statsPath: "backend/stats.json",
      stats: { repo: "omnopsis-ai/omnopsis-backend", tests: { total: 551 }, endpoints: 96 },
    },
  ]);

  assert.equal(status, 0);
  assert.ok(json);
  assert.equal(json.total, 551);
  assert.deepEqual(json.byType, {}, "absent byType degrades to empty, not a crash");
  assert.equal(json.reporting, 1);
  assert.equal(json.expected, 1);
  assert.deepEqual(json.missing, []);
});

test("fail-closed-visible: an unparseable stats.json → 0 + WARN + missing[]", () => {
  const { json, stderr, status } = runAggregator([
    {
      owner: "fix",
      name: "broken",
      statsPath: "any/stats.json",
      stats: "this is not json {{{",
    },
  ]);

  assert.equal(status, 0, "a broken producer must not fail the whole run");
  assert.ok(json);
  assert.equal(json.total, 0);
  assert.deepEqual(json.byType, {});
  assert.equal(json.reporting, 0);
  assert.equal(json.expected, 1);
  assert.deepEqual(json.missing, ["fix/broken"]);
  assert.match(stderr, /WARN/, "a missing/unparseable producer must emit a visible WARN");
});

test("repos without a statsPath are not producers (not counted in expected)", () => {
  const { json, status } = runAggregator([
    {
      owner: "fix",
      name: "producer",
      statsPath: "s.json",
      stats: { repo: "fix/producer", tests: { total: 7, byType: { unit: 7 } } },
    },
    { owner: "fix", name: "not-a-producer", statsPath: undefined, stats: undefined },
  ]);

  assert.equal(status, 0);
  assert.ok(json);
  assert.equal(json.total, 7);
  assert.equal(json.expected, 1, "only repos with a statsPath are expected producers");
  assert.equal(json.reporting, 1);
  assert.deepEqual(json.missing, []);
});

test("missing[] is sorted A→Z", () => {
  const { json } = runAggregator([
    { owner: "z", name: "z", statsPath: "s.json", stats: undefined },
    { owner: "a", name: "a", statsPath: "s.json", stats: undefined },
    { owner: "m", name: "m", statsPath: "s.json", stats: undefined },
  ]);
  assert.deepEqual(json.missing, ["a/a", "m/m", "z/z"]);
});

// ── Floor-seed merge (backlog #244) ───────────────────────────────────────────

test("no seed → floor:false, repos = live count, per_repo = the live array (back-compat)", () => {
  const { json, status } = runAggregator([
    { owner: "fix", name: "a", statsPath: "s.json", stats: { repo: "fix/a", tests: { total: 7, byType: { unit: 7 } } } },
  ]);
  assert.equal(status, 0);
  assert.equal(json.total, 7);
  assert.equal(json.floor, false, "no seed → not a floor");
  assert.equal(json.repos, 1, "repos is the merged COUNT");
  assert.equal(json.per_repo.length, 1, "per_repo carries the array");
  assert.equal(json.per_repo[0].repo, "fix/a");
});

test("seed adds non-reporting repos to total + repos count; floor propagates; reporting stays live-only", () => {
  const { json, status } = runAggregator(
    [
      { owner: "omnopsis-ai", name: "omnopsis-backend", statsPath: "backend/stats.json", stats: { repo: "omnopsis-ai/omnopsis-backend", tests: { total: 588, byType: { e2e: 259, integration: 27, unit: 302 } }, endpoints: 96 } },
    ],
    {
      floor: true,
      repos: [
        { repo: "neckarshore-websites/neckarshore-website", total: 308 },
        { repo: "neckarshore-mmps/clearpath-52", total: 0 },
      ],
    },
  );
  assert.equal(status, 0);
  assert.equal(json.total, 896, "588 live + 308 + 0 seed");
  assert.equal(json.floor, true, "seed floor flag propagates");
  assert.equal(json.repos, 3, "1 live + 2 seed = 3 repos (count, incl. the 0-test repo)");
  assert.equal(json.reporting, 1, "reporting counts LIVE producers only — a seed entry is not a producer");
  assert.equal(json.expected, 1);
  // byType is the LIVE breakdown only (seed is totals-only) — never a partial/dishonest estate split.
  assert.deepEqual(json.byType, { e2e: 259, integration: 27, unit: 302 });
  assert.ok(json.per_repo.some((r) => r.repo === "neckarshore-mmps/clearpath-52" && r.total === 0), "0-test seed repo is kept (so the count is complete)");
});

// ── Audited floor (Founder directive 2026-07-10) ─────────────────────────────

test("audited_floor ABOVE the merged sum → total = floor, applied:true, provenance emitted", () => {
  const { json, status } = runAggregator(
    [{ owner: "live", name: "a", statsPath: "s.json", stats: { repo: "live/a", tests: { total: 5, byType: { unit: 5 } } } }],
    {
      floor: true,
      repos: [{ repo: "seed/b", total: 10 }],
      audited_floor: { total: 100, audited: "2026-07-10", source: "lenin estate recount" },
    },
  );
  assert.equal(status, 0);
  assert.equal(json.total, 100, "headline = max(5 live + 10 seed, 100 audited floor)");
  assert.equal(json.audited_floor.applied, true, "the floor is the reason the headline exceeds Σ per_repo");
  assert.equal(json.audited_floor.audited, "2026-07-10", "date provenance propagates");
  assert.equal(json.audited_floor.source, "lenin estate recount", "source provenance propagates");
  const sum = json.per_repo.reduce((s, r) => s + r.total, 0);
  assert.equal(sum, 15, "per_repo rows stay the real measured/seeded values — never inflated to match");
});

test("audited_floor BELOW the merged sum → organic total leads, applied:false (self-retiring)", () => {
  const { json } = runAggregator(
    [{ owner: "live", name: "a", statsPath: "s.json", stats: { repo: "live/a", tests: { total: 50, byType: { unit: 50 } } } }],
    {
      floor: true,
      repos: [{ repo: "seed/b", total: 10 }],
      audited_floor: { total: 12, audited: "2026-07-10", source: "lenin estate recount" },
    },
  );
  assert.equal(json.total, 60, "organic 50+10 exceeds the stale floor 12 → organic number leads");
  assert.equal(json.audited_floor.applied, false, "floor self-retires; field stays for provenance");
});

test("no audited_floor in the seed → output carries NO audited_floor key (back-compat)", () => {
  const { json } = runAggregator(
    [{ owner: "live", name: "a", statsPath: "s.json", stats: { repo: "live/a", tests: { total: 7, byType: { unit: 7 } } } }],
    { floor: true, repos: [{ repo: "seed/b", total: 3 }] },
  );
  assert.equal(json.total, 10);
  assert.equal(Object.hasOwn(json, "audited_floor"), false, "absent seed field → absent output field");
});

test("live producer WINS over a same-slug seed entry (no double-count)", () => {
  const { json } = runAggregator(
    [
      { owner: "neckarshore-websites", name: "neckarshore-website", statsPath: "s.json", stats: { repo: "neckarshore-websites/neckarshore-website", tests: { total: 308, byType: { e2e: 100, unit: 208 } } } },
    ],
    {
      floor: true,
      // Same slug as the live producer above — must be DROPPED (live wins), with a stale count.
      repos: [{ repo: "neckarshore-websites/neckarshore-website", total: 999 }],
    },
  );
  assert.equal(json.total, 308, "live 308 wins; the stale 999 seed entry is dropped");
  assert.equal(json.repos, 1, "the repo is counted once, not twice");
  assert.equal(json.per_repo.filter((r) => r.repo === "neckarshore-websites/neckarshore-website").length, 1, "no duplicate entry");
});

// ── SHA-stamp coverage: propagation + unstamped[] warn (Test Charter — auditable, SHA-stamped) ──

test("seed audited_sha is PROPAGATED into the rollup (not hardcoded null)", () => {
  const { json, status } = runAggregator(
    [{ owner: "live", name: "prod", statsPath: "s.json", stats: { repo: "live/prod", audited_sha: "live999", tests: { total: 7, byType: { unit: 7 } } } }],
    {
      floor: true,
      repos: [
        { repo: "seed/stamped", total: 10, audited_sha: "abc1234", sha_note: "some Durchstich" },
        { repo: "seed/unstamped", total: 5, sha_note: "no Durchstich" }, // no audited_sha key at all
      ],
    },
  );
  assert.equal(status, 0);
  const stamped = json.per_repo.find((r) => r.repo === "seed/stamped");
  const unstamped = json.per_repo.find((r) => r.repo === "seed/unstamped");
  assert.equal(stamped.audited_sha, "abc1234", "a seed row's audited_sha must propagate into per_repo");
  assert.equal(unstamped.audited_sha, null, "a seed row without a SHA stays null (never invented)");
  // sha_note is INTERNAL provenance — it must NOT leak into the rollup's per_repo objects.
  assert.ok(!("sha_note" in stamped), "sha_note must not be copied into the rollup");
});

test("unstamped[] lists null-sha rows + the aggregator emits a fail-open WARN (smoke: null-sha fixture)", () => {
  const { json, stderr, status } = runAggregator(
    [{ owner: "live", name: "prod", statsPath: "s.json", stats: { repo: "live/prod", audited_sha: "live999", tests: { total: 7, byType: { unit: 7 } } } }],
    {
      floor: true,
      repos: [
        { repo: "seed/has-sha", total: 3, audited_sha: "seed123" },
        { repo: "seed/no-sha", total: 4 },
      ],
    },
  );
  assert.equal(status, 0, "the un-stamped WARN must be FAIL-OPEN — it never changes the exit code");
  // Only the genuinely un-stamped row appears; the stamped live producer + stamped seed row do not.
  assert.deepEqual(json.unstamped, ["seed/no-sha"]);
  assert.match(stderr, /WARN.*audited_sha:null/, "the aggregator emits a visible un-stamped WARN");
  assert.match(stderr, /seed\/no-sha/, "the WARN names the offending repo");
});

test("a live producer with NO audited_sha also lands in unstamped[] (the omnopsis-backend shape)", () => {
  const { json } = runAggregator([
    { owner: "omnopsis-ai", name: "omnopsis-backend", statsPath: "s.json", stats: { repo: "omnopsis-ai/omnopsis-backend", tests: { total: 588 }, endpoints: 96 } },
  ]);
  assert.deepEqual(json.unstamped, ["omnopsis-ai/omnopsis-backend"], "a producer omitting audited_sha is un-stamped");
});

test("unstamped[] is sorted A→Z", () => {
  const { json } = runAggregator([], {
    floor: true,
    repos: [
      { repo: "zzz/z", total: 1 },
      { repo: "aaa/a", total: 1 },
      { repo: "mmm/m", total: 1 },
    ],
  });
  assert.deepEqual(json.unstamped, ["aaa/a", "mmm/m", "zzz/z"]);
});

test("fully-stamped rollup → unstamped[] is empty and NO WARN fires", () => {
  const { json, stderr } = runAggregator(
    [{ owner: "live", name: "prod", statsPath: "s.json", stats: { repo: "live/prod", audited_sha: "live999", tests: { total: 7, byType: { unit: 7 } } } }],
    { floor: true, repos: [{ repo: "seed/stamped", total: 3, audited_sha: "seed123" }] },
  );
  assert.deepEqual(json.unstamped, []);
  assert.ok(!/audited_sha:null/.test(stderr), "no un-stamped WARN when every row carries a SHA");
});

// ── Seed data invariant (estate-test-scope-seed.json — the committed floor) ──

test("seed: repos with a known Lenin Durchstich carry a non-null audited_sha", () => {
  const seed = JSON.parse(readFileSync(SEED_PATH, "utf8"));
  const bySlug = Object.fromEntries(seed.repos.map((r) => [r.repo, r]));
  // Die Repos mit einem Lenin-Durchstich (5 Berichte 2026-06-19..2026-06-30), die HEUTE noch in der
  // Saat stehen. Geprueft wird non-null + Hex-Form, NICHT die exakte SHA — eine berechtigte
  // Nachpruefung darf neu stempeln.
  //
  // WARUM DIE LISTE GEPFLEGT WERDEN MUSS UND NICHT NUR WAECHST: die Zeile darunter behauptet
  // ANWESENHEIT in der Saat. Das ist Absicht (ein Durchstich-Repo darf nicht still herausfallen),
  // hat aber die Kehrseite, dass ein inhaltlich RICHTIGES Entfernen den Test rot faerbt. Genau das
  // ist am 2026-08-27 passiert: neckarshore-ai/observatory ist bei GitHub `archived=true` und wurde
  // mitsamt seinen 30 Tests aus der Saat genommen — der Test meldete daraufhin "seed must contain
  // neckarshore-ai/observatory", obwohl das Entfernen der Zweck der Aenderung war.
  // Wer hier eine Zeile streicht, muss den Grund danebenschreiben. Wer sie ohne Grund streicht,
  // hebt die Absicherung auf.
  const KNOWN_DURCHSTICH = [
    "neckarshore-websites/neckarshore-website",
    "omnopsis-ai/omnopsis-frontend",
    "neckarshore-ai/dev-environment",
    "omnopsis-ai/omnopsis-contracts",
    // neckarshore-ai/observatory — 2026-08-27 aus der Saat entfernt, weil das Repo bei GitHub
    // archiviert ist (gh api repos/neckarshore-ai/observatory -> archived=true, letzter Push
    // 2026-06-30). Der Durchstich hat stattgefunden, das Repo ist tot. Nicht wieder aufnehmen,
    // ohne vorher die Archivierung zu pruefen.
    "neckarshore-skills/ai-phrase-check",
  ];
  for (const slug of KNOWN_DURCHSTICH) {
    assert.ok(bySlug[slug], `seed must contain ${slug}`);
    assert.match(
      bySlug[slug].audited_sha ?? "",
      /^[0-9a-f]{7,40}$/,
      `${slug} has a covering Durchstich → audited_sha must be a non-null SHA (got ${bySlug[slug].audited_sha})`,
    );
  }
});

test("seed: every row has an audited_sha (string|null) + a non-empty sha_note", () => {
  const seed = JSON.parse(readFileSync(SEED_PATH, "utf8"));
  for (const r of seed.repos) {
    assert.ok("audited_sha" in r, `${r.repo} is missing the audited_sha key`);
    assert.ok(
      r.audited_sha === null || (typeof r.audited_sha === "string" && /^[0-9a-f]{7,40}$/.test(r.audited_sha)),
      `${r.repo} audited_sha must be null or a hex SHA (got ${JSON.stringify(r.audited_sha)})`,
    );
    assert.ok(typeof r.sha_note === "string" && r.sha_note.length > 0, `${r.repo} needs a non-empty sha_note (provenance / reason-if-null)`);
  }
});

// ── untyped_total: die Differenz zwischen sum(byType) und total muss BENANNT sein (Q5) ──
//
// WARUM ES DIESE TESTS GIBT: der Skriptkopf erklaerte `sum(byType)==total` zur Eigenschaft, und die
// Ausgabe verletzte sie um genau die Saat-Summe — byType wird nur aus LIVE gebaut, total aus
// live+seed. Kein Feld benannte die Luecke. Ein Leser, der nachrechnete, hielt die Gesamtzahl fuer
// falsch; genau daran ist der Founder am 2026-08-27 haengengeblieben.

test("untyped_total: sum(byType) + untyped_total == total (die ehrliche Zusicherung)", () => {
  const { json } = runAggregator(
    [
      { owner: "o", name: "a", statsPath: "s.json", stats: { tests: { total: 30, byType: { unit: 20, e2e: 10 } } } },
      { owner: "o", name: "b", statsPath: "s.json", stats: { tests: { total: 12, byType: { unit: 12 } } } },
    ],
    { floor: true, repos: [{ repo: "o/c", total: 7 }, { repo: "o/d", total: 5 }] },
  );
  const byTypeSum = Object.values(json.byType).reduce((a, b) => a + b, 0);
  assert.equal(byTypeSum, 42, "byType kommt NUR aus den live Produzenten");
  assert.equal(json.untyped_total, 12, "die beiden Saat-Zeilen tragen keine Typangabe");
  assert.equal(json.total, 54);
  assert.equal(byTypeSum + json.untyped_total, json.total, "die Zahlen muessen sich addieren");
});

test("untyped_total zaehlt ueber byType-LEERE, nicht ueber `seeded` — der Fail-soft-Fall haengt daran", () => {
  // Der Skriptkopf sieht ausdruecklich einen LIVE-Produzenten mit numerischem total und OHNE
  // byType vor (alte omnopsis-backend-Form). Ueber `seeded` gezaehlt waere er in untyped_total
  // NICHT enthalten und die Zusicherung waere genau an diesem Fall falsch.
  const { json } = runAggregator(
    [
      { owner: "o", name: "neu", statsPath: "s.json", stats: { tests: { total: 30, byType: { unit: 30 } } } },
      { owner: "o", name: "alt", statsPath: "s.json", stats: { tests: { total: 9 } } }, // live, kein byType
    ],
    { floor: true, repos: [{ repo: "o/saat", total: 4 }] },
  );
  const byTypeSum = Object.values(json.byType).reduce((a, b) => a + b, 0);
  assert.equal(json.untyped_total, 13, "9 (live ohne byType) + 4 (Saat) — NICHT nur die 4");
  assert.equal(byTypeSum + json.untyped_total, json.total, "Zusicherung haelt auch im Fail-soft-Fall");
});

test("untyped_total ist 0, wenn jede Zeile eine Typangabe traegt", () => {
  const { json } = runAggregator([
    { owner: "o", name: "a", statsPath: "s.json", stats: { tests: { total: 5, byType: { unit: 5 } } } },
  ]);
  assert.equal(json.untyped_total, 0);
  assert.equal(Object.values(json.byType).reduce((a, b) => a + b, 0), json.total);
});

test("EIN GREIFENDER audited_floor HEBT total AN — dann gilt die Zusicherung bewusst NICHT", () => {
  // Die dokumentierte Ausnahme, und sie ist hier festgenagelt, damit niemand sie spaeter fuer einen
  // Fehler haelt: max() hebt total ueber die Summe. `audited_floor.applied` ist die Begruendung.
  const { json } = runAggregator(
    [{ owner: "o", name: "a", statsPath: "s.json", stats: { tests: { total: 10, byType: { unit: 10 } } } }],
    { floor: true, repos: [{ repo: "o/saat", total: 5 }], audited_floor: { total: 100, audited: "2026-07-10", source: "x" } },
  );
  const byTypeSum = Object.values(json.byType).reduce((a, b) => a + b, 0);
  assert.equal(json.audited_floor.applied, true);
  assert.equal(json.total, 100, "der Boden fuehrt");
  assert.equal(json.untyped_total, 5, "untyped_total bleibt die ehrliche Saat-Summe, es wird NICHT mitgehoben");
  assert.ok(byTypeSum + json.untyped_total < json.total, "die Differenz ist der Boden, und applied sagt das");
});
