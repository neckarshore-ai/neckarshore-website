/**
 * Unit tests for the pure logic of the contrast watcher (scripts/contrast-grouping.mjs).
 *
 * WHY THIS FILE EXISTS AT ALL. The watcher's value is not that it finds violations —
 * axe does that. It is that it turns 355 violation NODES into 14 COLOUR PAIRS. A report
 * with one line per node is not read by anyone; a report with one line per decision is
 * acted on. That collapse is arithmetic, it is where the bugs live, and it must be
 * testable without a browser. Hence: browser work in the runner, counting in here.
 *
 * THE MEASUREMENT THIS GUARDS (2026-08-21, axe-core against the live site, 28 routes,
 * both colour modes): 355 color-contrast nodes on 28/28 routes, tracing back to 14
 * distinct foreground/background pairs in four groups. Group A alone — one token line,
 * `--color-muted` — accounts for 239 of them.
 *
 * Run: `npm run test:unit`
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeColor,
  parseExpected,
  groupFindings,
  formatReport,
} from "../../scripts/contrast-grouping.mjs";

/** One finding as the runner emits it, with sensible defaults per case. */
function finding(over = {}) {
  return {
    route: "/",
    mode: "light",
    fg: "#64748b",
    bg: "#f1f5f9",
    ratio: 4.34,
    expected: 4.5,
    selector: "p.text-muted",
    ...over,
  };
}

test("normalizeColor: axe rgb() strings and hex both collapse to one lowercase hex", () => {
  assert.equal(normalizeColor("rgb(100, 116, 139)"), "#64748b");
  assert.equal(normalizeColor("#64748B"), "#64748b");
  assert.equal(normalizeColor("#64748b"), "#64748b");
});

test("normalizeColor: an alpha channel is dropped, because axe already composited it", () => {
  // axe reports the COMPOSITED colour — the alpha is decoration on an already-flattened
  // value. Keeping it in the key would split one real colour pair into several rows.
  assert.equal(normalizeColor("rgba(100, 116, 139, 1)"), "#64748b");
  assert.equal(normalizeColor("rgba(100, 116, 139, 0.6)"), "#64748b");
});

test("normalizeColor: an unparseable value survives as itself rather than throwing", () => {
  // A watcher that crashes on one odd value reports nothing at all. Degrade, do not die.
  assert.equal(normalizeColor("currentColor"), "currentcolor");
  assert.equal(normalizeColor(""), "");
  assert.equal(normalizeColor(undefined), "");
});

test("parseExpected: axe states the requirement as a RATIO STRING, not a number", () => {
  // Caught by running the watcher, not by reading the docs: axe fills
  // `expectedContrastRatio` with "4.5:1". Number("4.5:1") is NaN, and NaN printed in a
  // column headed "Soll" is a report that silently stops telling you what you needed.
  assert.equal(parseExpected("4.5:1"), 4.5);
  assert.equal(parseExpected("3:1"), 3);
  assert.equal(parseExpected("7:1"), 7);
});

test("parseExpected: plain numbers pass through, junk falls back to the body-text rule", () => {
  assert.equal(parseExpected(4.5), 4.5);
  assert.equal(parseExpected(3), 3);
  // A wrong-but-plausible 4.5 beats NaN: the row stays readable and the actual ratio,
  // which is the number that decides, is untouched.
  assert.equal(parseExpected(undefined), 4.5);
  assert.equal(parseExpected("weiss nicht"), 4.5);
});

test("NaN never reaches the report, whatever axe hands over", () => {
  const out = formatReport(
    groupFindings([
      { route: "/", mode: "light", fg: "#64748b", bg: "#f1f5f9", ratio: 4.34,
        expected: parseExpected("4.5:1"), selector: "p" },
    ]),
    { routes: 28, modes: ["light"] },
  );
  assert.doesNotMatch(out, /NaN/, "a column that prints NaN has stopped being a report");
});

test("THE CORE COLLAPSE: many nodes on many routes become ONE row per colour pair", () => {
  const findings = [
    finding({ route: "/" }),
    finding({ route: "/products" }),
    finding({ route: "/products/omnopsis" }),
    finding({ route: "/impressum", selector: "span.caption" }),
  ];

  const groups = groupFindings(findings);

  assert.equal(groups.length, 1, "four nodes, one colour pair, one row");
  assert.equal(groups[0].count, 4);
  assert.deepEqual(groups[0].routes, ["/", "/impressum", "/products", "/products/omnopsis"]);
  assert.equal(groups[0].routeCount, 4);
});

test("routes are deduplicated and sorted — the same pair twice on one page is one route", () => {
  const groups = groupFindings([
    finding({ route: "/products" }),
    finding({ route: "/products", selector: "p.other" }),
    finding({ route: "/" }),
  ]);

  assert.equal(groups[0].count, 3, "three nodes");
  assert.deepEqual(groups[0].routes, ["/", "/products"], "two routes, sorted");
  assert.equal(groups[0].routeCount, 2);
});

test("the colour pair is the key — same foreground on a different background is a NEW row", () => {
  // This is the whole point of group A: one token failing against five surface tones is
  // five rows, not one, because each surface may need its own answer.
  const groups = groupFindings([
    finding({ bg: "#f1f5f9", ratio: 4.34 }),
    finding({ bg: "#e2e8f0", ratio: 3.86 }),
  ]);

  assert.equal(groups.length, 2);
  assert.deepEqual(
    groups.map((g) => g.bg),
    ["#e2e8f0", "#f1f5f9"],
    "worst ratio first",
  );
});

test("the REQUIREMENT is part of the key: large text needs 3.0, body text 4.5", () => {
  // Same two colours can be a violation for body text and fine for a heading. Merging
  // them would report one row whose 'soll' is a lie for half its occurrences.
  const groups = groupFindings([
    finding({ expected: 4.5 }),
    finding({ expected: 3, ratio: 4.34, selector: "h2" }),
  ]);

  assert.equal(groups.length, 2, "same colours, two different requirements, two rows");
});

test("the colour mode is part of the key — light and dark are different findings", () => {
  const groups = groupFindings([finding({ mode: "light" }), finding({ mode: "dark" })]);
  assert.equal(groups.length, 2);
});

test("SORTING IS BY SEVERITY, not by count: the worst ratio leads", () => {
  // The 1.03 case — text in effectively its own background colour — must not sit at the
  // bottom of the report because it only occurs twice. Invisible text outranks 239 near
  // misses.
  const groups = groupFindings([
    ...Array.from({ length: 20 }, () => finding({ fg: "#64748b", ratio: 4.34 })),
    finding({ fg: "#12273c", bg: "#1e2937", ratio: 1.03, mode: "dark" }),
  ]);

  assert.equal(groups[0].ratio, 1.03, "the invisible text leads the report");
  assert.equal(groups[1].count, 20);
});

test("each row carries ONE example, so a reader can go look at it", () => {
  const groups = groupFindings([
    finding({ route: "/products", selector: "p.first" }),
    finding({ route: "/", selector: "p.second" }),
  ]);

  assert.ok(groups[0].example, "a row without an example is not actionable");
  assert.equal(groups[0].example.route, "/", "the example comes from the first route, sorted");
  assert.equal(typeof groups[0].example.selector, "string");
});

test("no findings yields no groups — and that is not an error state", () => {
  assert.deepEqual(groupFindings([]), []);
});

test("formatReport on a clean run says so in one line and mentions the scope", () => {
  const out = formatReport([], { routes: 28, modes: ["light", "dark"] });
  assert.match(out, /28/, "the reader must see WHAT was checked, not just that it passed");
  assert.match(out, /light/);
  assert.match(out, /dark/);
});

test("FORMAT: the report is one line per colour pair, not one per node", () => {
  const groups = groupFindings([
    ...Array.from({ length: 239 }, (_, i) => finding({ route: `/r${i % 28}` })),
    finding({ fg: "#12273c", bg: "#1e2937", ratio: 1.03, mode: "dark", route: "/" }),
  ]);
  const out = formatReport(groups, { routes: 28, modes: ["light", "dark"] });

  const bodyLines = out.split("\n").filter((l) => l.includes("#64748b") || l.includes("#12273c"));
  assert.equal(bodyLines.length, 2, "240 nodes, 2 colour pairs, 2 lines");
  assert.match(out, /239/, "the occurrence count must survive the collapse");
});

test("FORMAT: every row shows actual AND required ratio — a number without its target is noise", () => {
  const out = formatReport(groupFindings([finding()]), { routes: 28, modes: ["light"] });
  assert.match(out, /4\.34/, "actual");
  assert.match(out, /4\.5/, "required");
});
