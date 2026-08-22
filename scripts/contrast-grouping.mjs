/**
 * Pure logic of the contrast watcher: turn axe violation NODES into COLOUR PAIRS.
 *
 * No browser, no filesystem, no network — everything in here is a function of its
 * arguments, which is why it can be unit-tested (tests/unit/contrast-grouping.test.mjs)
 * while the runner that drives Playwright cannot.
 *
 * THE PROBLEM THIS SOLVES. A full-site axe run over neckarshore.ai returned 543
 * color-contrast nodes (2026-08-21, 28 routes, both colour modes, via this very
 * command). Printed one per line that is 543 lines, which nobody reads and which
 * therefore gets switched off. The same 543 nodes trace back to 41 distinct
 * foreground/background pairs — and a colour pair is a DECISION, not an occurrence. 41
 * lines with foreground, background, actual, required, occurrences and one example
 * address is a finding you can act on before lunch.
 *
 * (An earlier ad-hoc script the same day reported 355 nodes on 14 pairs. That run is not
 * reproducible and its colour mode was never proven; these numbers come from the command
 * in this repository and are the ones to quote. The discrepancy is recorded rather than
 * resolved in the author's favour.)
 *
 * WHAT THE KEY IS, AND WHY EACH PART OF IT EARNS ITS PLACE:
 *   mode      — light and dark are different renderings; merging them hides that light
 *               mode is six times more affected (305 nodes against 50).
 *   fg + bg   — the pair IS the decision. One token failing on five surface tones is
 *               five rows, because each surface may want a different answer.
 *   expected  — large text needs 3.0, body text 4.5. Merging the two would print one row
 *               whose stated requirement is wrong for half of its occurrences.
 */

/**
 * Collapse whatever axe hands us into one comparable lowercase hex.
 *
 * axe reports composited colours: an element at 60% opacity over white arrives already
 * flattened. So an alpha channel here is decoration on a value that has already had its
 * alpha applied — keeping it in the key would split one real colour pair into several
 * rows that a reader cannot tell apart.
 *
 * An unparseable value is returned lowercased rather than thrown on. A watcher that dies
 * on one odd value reports nothing at all; one that degrades still reports the other 353.
 */
export function normalizeColor(value) {
  if (typeof value !== "string" || value === "") return "";
  const raw = value.trim().toLowerCase();

  const rgb = raw.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  if (rgb) {
    return (
      "#" +
      rgb
        .slice(1, 4)
        .map((n) => Math.round(Number(n)).toString(16).padStart(2, "0"))
        .join("")
    );
  }

  const short = raw.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/);
  if (short) return "#" + short.slice(1, 4).map((c) => c + c).join("");

  return raw;
}

/**
 * Read the REQUIRED ratio out of whatever axe put in `expectedContrastRatio`.
 *
 * axe states it as a ratio string — "4.5:1", "3:1" — not as a number, which `Number()`
 * turns into NaN. That was found by running the watcher and reading its own output, not
 * by reading documentation: the "Soll" column printed NaN on every row while the report
 * otherwise looked entirely healthy. A report with a dead column is the failure mode
 * this whole watcher was built against, one layer down.
 *
 * Anything unreadable falls back to 4.5, the body-text requirement: a plausible number
 * keeps the row legible, and the ACTUAL ratio — the number that decides whether
 * something is broken — is never touched by this function.
 */
export function parseExpected(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : 4.5;
}

/**
 * Read the MEASURED ratio — and refuse rather than guess.
 *
 * The asymmetry with `normalizeColor`, which degrades quietly on junk, is deliberate.
 * A colour is a LABEL: getting it wrong costs a reader some clarity. The ratio is the
 * MEASUREMENT: it decides severity, it decides sort order, and it decides whether
 * anything is broken at all. `Math.min(x, NaN)` is NaN for good, a comparator that
 * returns NaN leaves the sort order undefined, and the "Ist" column then prints NaN —
 * the identical dead-column failure this module already documents one column to the
 * right. A watcher that invents a measurement is worse than one that stops.
 */
export function parseRatio(value) {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) {
    throw new Error(`Kontrastwert nicht lesbar: ${JSON.stringify(value)}`);
  }
  return parsed;
}

/**
 * Group findings by colour pair.
 *
 * Sorted by ACTUAL RATIO ASCENDING — worst first — deliberately, and not by occurrence
 * count. The single most serious finding on this site is text at 1.03, which is text in
 * effectively its own background colour and occurs twice; sorting by count would bury it
 * under 184 near misses that are all merely a little too light. Severity is what the
 * reader needs at the top.
 *
 * @param {Array<{route: string, mode: string, fg: string, bg: string, ratio: number,
 *                expected: number, selector: string}>} findings
 */
export function groupFindings(findings) {
  const byKey = new Map();

  for (const f of findings) {
    const fg = normalizeColor(f.fg);
    const bg = normalizeColor(f.bg);
    // Checked HERE and not only at the call site, so no future caller can smuggle an
    // unreadable measurement into a group and quietly undefine the severity order.
    const ratio = parseRatio(f.ratio);
    const key = `${f.mode}|${fg}|${bg}|${f.expected}`;

    let group = byKey.get(key);
    if (!group) {
      group = {
        mode: f.mode,
        fg,
        bg,
        expected: f.expected,
        ratio,
        count: 0,
        routes: new Set(),
        // Kept so the example can be drawn from the FIRST route alphabetically rather
        // than from whichever node axe happened to visit first — a stable example makes
        // two runs of the watcher diffable.
        selectorByRoute: new Map(),
      };
      byKey.set(key, group);
    }

    group.count += 1;
    group.ratio = Math.min(group.ratio, ratio);
    group.routes.add(f.route);
    if (!group.selectorByRoute.has(f.route)) group.selectorByRoute.set(f.route, f.selector);
  }

  return [...byKey.values()]
    .map((g) => {
      const routes = [...g.routes].sort();
      return {
        mode: g.mode,
        fg: g.fg,
        bg: g.bg,
        expected: g.expected,
        ratio: g.ratio,
        count: g.count,
        routes,
        routeCount: routes.length,
        example: { route: routes[0], selector: g.selectorByRoute.get(routes[0]), mode: g.mode },
      };
    })
    .sort(
      (a, b) =>
        a.ratio - b.ratio ||
        b.count - a.count ||
        a.fg.localeCompare(b.fg) ||
        a.bg.localeCompare(b.bg),
    );
}

/** Two decimals, so 4.5 and 4.50 never read as different requirements. */
const n2 = (v) => Number(v).toFixed(2);

/**
 * Render the report a human reads in the terminal.
 *
 * The scope line is not decoration. A green run that checked one route looks exactly
 * like a green run that checked 28 — and this whole watcher exists because the previous
 * check was blind on 25 of them. Whoever reads "no findings" must also read WHAT was
 * looked at before believing it.
 */
export function formatReport(groups, { routes, modes }) {
  const scope = `Geprueft: ${routes} Adressen, Farbmodi: ${modes.join(", ")}, Regel: color-contrast.`;

  if (groups.length === 0) {
    return [scope, "Keine Verstoesse."].join("\n");
  }

  const nodes = groups.reduce((sum, g) => sum + g.count, 0);
  const lines = [
    scope,
    `${nodes} Textstellen unter dem Mindestkontrast, auf ${groups.length} Farbpaare zurueckgehend.`,
    "",
    "  Ist   Soll   Vordergrund  Hintergrund  Modus  Stellen  Adressen  Beispiel",
    "  ----  -----  -----------  -----------  -----  -------  --------  --------",
  ];

  for (const g of groups) {
    lines.push(
      "  " +
        [
          n2(g.ratio).padStart(4),
          n2(g.expected).padStart(5),
          g.fg.padEnd(11),
          g.bg.padEnd(11),
          g.mode.padEnd(5),
          String(g.count).padStart(7),
          String(g.routeCount).padStart(8),
          `${g.example.route}  ${g.example.selector}`,
        ].join("  "),
    );
  }

  return lines.join("\n");
}
