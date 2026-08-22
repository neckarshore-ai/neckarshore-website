/**
 * Contrast watcher — WCAG minimum contrast across EVERY route, in BOTH colour modes.
 *
 *   npm run check:contrast              build a production bundle, serve it, check it
 *   npm run check:contrast -- --quick   skip build, assume a server on :3000
 *   CONTRAST_URL=https://neckarshore.ai npm run check:contrast -- --quick
 *
 * WHY THIS EXISTS AS ITS OWN COMMAND, and not as a spec in tests/e2e/.
 * It was written while the site carried 355 violations. A spec would have turned `main`
 * red on the next push and kept it red until every one of them was repaired — which
 * pressures whoever is in a hurry to delete the spec. As a separate command it was loud
 * and visible without blocking delivery. The order — build the watcher, prove it red,
 * repair, THEN switch it hard, with no tolerated-legacy list — is a Founder decision
 * from 2026-08-21, and the missing legacy list is the point: a tolerated list would have
 * made the watcher green on its first run and destroyed the only red probe it will ever
 * get for free.
 *
 * SINCE 2026-08-22 IT IS A GATE. The repair landed (355 → 0, two identical runs), so
 * `.github/workflows/contrast.yml` runs this command on every pull request and every
 * push to `main`. It stays its own workflow rather than a spec in the Playwright suite:
 * it needs its own production build and its own settle logic, and a red here names a
 * colour pair, not a failing test. Exit codes: 0 clean · 1 findings · 2 the run could
 * not prove what it measured.
 *
 * WHY THE ROUTES ARE DERIVED, NOT LISTED.
 * tests/e2e/accessibility.spec.ts hardcodes three pages, so it was blind on 25 of 28 and
 * reported nothing for months. This reads the same source the sitemap is built from — a
 * new page is checked because it exists, not because someone remembered to add it.
 *
 * THE NODE COUNT IS NOT STABLE BETWEEN RUNS, AND THAT IS A PROPERTY, NOT A BUG.
 * Two runs against the same live site minutes apart returned 543 nodes on 41 colour
 * pairs and 602 on 39. Nothing in the measurement changed between them; composited
 * background colours depend on what has rendered, hovered or settled at the moment axe
 * looks, so the same underlying defect can surface as slightly different pairs.
 *
 * The consequence for how this is used: DO NOT read "the number fell" as proof that a
 * repair worked — a swing of sixty is within noise. The stable signals are the TOP ROWS,
 * which reproduce exactly, and ZERO, which is unambiguous. That is also why this becomes
 * a hard gate only after the repair: "zero violations" is a threshold that does not
 * wobble, and "fewer than last time" is not a threshold at all.
 *
 * WHY BOTH COLOUR MODES, AND WHY THE MODE IS VERIFIED RATHER THAN ASSUMED.
 * The light mode turned out six times more affected than the dark (305 nodes against
 * 50), and the reason nobody knew is that the existing automated check measures dark.
 * The site switches modes through a class on <html> driven by localStorage plus
 * matchMedia, so Playwright's colorScheme only lands while no stored choice exists. If
 * that ever changes, the dark pass would silently become a second light pass and the run
 * would stay green while measuring half of what it claims. So each pass reads the body
 * background back and aborts on a mismatch: a watcher that cannot prove what it looked
 * at is worth less than no watcher.
 */
import { chromium } from "@playwright/test";
import { createRequire } from "node:module";
import { spawn, execFileSync } from "node:child_process";
import process from "node:process";
import sitemapModule from "../src/app/sitemap.ts";
import {
  groupFindings,
  formatReport,
  parseExpected,
  parseRatio,
} from "./contrast-grouping.mjs";

const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve("axe-core");

const QUICK = process.argv.includes("--quick");
const BASE = (process.env.CONTRAST_URL || "http://localhost:3000").replace(/\/$/, "");

/**
 * The colour modes, each with the marker that PROVES it took.
 *
 * The theme is applied by a client effect, not by the server: `document.documentElement`
 * gets its `dark` class after hydration, so at DOMContentLoaded every page is still
 * light. Measured 2026-08-21 against the live site — a dark pass taken too early reads
 * #f1f5f9 and produces a perfectly plausible, entirely light-mode report.
 *
 * The marker is the theme toggle's own label. That button renders `null` until its
 * effect has run (`mounted`), and its label names the mode it would switch TO — so in
 * dark mode it reads "Zu hellem Modus wechseln". Waiting for it therefore proves two
 * things at once, deterministically and without a sleep: hydration has finished, and the
 * resolved mode is the one we asked for.
 */
const MODES = [
  { name: "light", colorScheme: "light", toggleLabel: "Zu dunklem Modus wechseln" },
  { name: "dark", colorScheme: "dark", toggleLabel: "Zu hellem Modus wechseln" },
];

const log = (msg) => process.stdout.write(msg + "\n");

/**
 * Routes come from the sitemap source, so a new page is covered without being listed.
 *
 * The interop dance is not decoration: tsx hands this TypeScript module back as a CJS
 * namespace, so the default export arrives one level deeper than an ESM import promises.
 * Reaching for `sitemap()` directly throws "sitemap is not a function" — and the throw is
 * the good case. Silently resolving to something falsy would have produced an empty route
 * list and a triumphantly green run over nothing at all.
 */
function routes() {
  const sitemap =
    typeof sitemapModule === "function" ? sitemapModule : sitemapModule?.default;
  if (typeof sitemap !== "function") {
    throw new Error("sitemap-Quelle liefert keine Funktion — Adressliste waere leer");
  }

  const paths = sitemap().map((entry) => new URL(entry.url).pathname);
  if (paths.length === 0) throw new Error("sitemap-Quelle liefert null Adressen");

  return [...new Set(paths)].sort();
}

function toHex(rgb) {
  const m = String(rgb).match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (!m) return String(rgb);
  return "#" + m.slice(1, 4).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
}

/**
 * Wait until the server ANSWERS — the same rule the page loads follow, one level up.
 *
 * A fixed sleep here would contradict this file's own principle in its very first
 * paragraph: a delay that is long enough on this machine is a failed run on a slower one,
 * and the failure would surface as a contrast run exiting on a navigation error, which is
 * about the least informative way this command could break.
 */
async function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try {
      const probe = await fetch(url, { method: "HEAD" });
      if (probe.status < 500) return;
    } catch {
      // not listening yet — keep waiting until the deadline, then say so plainly
    }
    if (Date.now() > deadline) {
      throw new Error(`Server auf ${url} antwortet nicht innerhalb von ${timeoutMs / 1000}s`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

/**
 * Stop the server we started — including the process it started.
 *
 * `npm run start` is a wrapper: the Next server is its CHILD. Signalling only the npm
 * process leaves that child holding port 3000, and the next run of this command fails
 * against a stale server still serving the previous build — a wrong measurement that
 * looks exactly like a right one. Spawning detached puts both into their own process
 * group, so negating the pid signals the group.
 */
function stopServer(server) {
  if (!server || server.killed) return;
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    try {
      server.kill("SIGTERM");
    } catch {
      // already gone — nothing to clean up
    }
  }
}

async function main() {
  let server;
  let browser;
  const findings = [];
  const seenBackgrounds = new Map();

  // The try opens BEFORE the browser launch and the route derivation on purpose: both can
  // throw, and a throw between spawning the server and entering a later try would leave
  // the server running with nothing left to stop it.
  try {
    if (!QUICK && BASE.includes("localhost")) {
      log("Produktionsbau...");
      execFileSync("npm", ["run", "build"], { stdio: "inherit" });
      log("Server startet...");
      server = spawn("npm", ["run", "start"], { stdio: "ignore", detached: true });
      await waitForServer(BASE + "/");
    }

    const paths = routes();
    browser = await chromium.launch();
    return await measure(browser, paths, findings, seenBackgrounds);
  } finally {
    if (browser) await browser.close();
    stopServer(server);
  }
}

async function measure(browser, paths, findings, seenBackgrounds) {
  {
    for (const mode of MODES) {
      const context = await browser.newContext({ colorScheme: mode.colorScheme });
      const page = await context.newPage();

      for (const path of paths) {
        const response = await page.goto(BASE + path, { waitUntil: "load" });
        if (!response || response.status() >= 400) {
          throw new Error(`${path} antwortet mit ${response ? response.status() : "keiner Antwort"}`);
        }

        // Wait for the proof, never for a duration. A sleep long enough today is a
        // silent half-measurement on a slower machine.
        try {
          await page.waitForSelector(`button[aria-label="${mode.toggleLabel}"]`, {
            timeout: 15000,
          });
        } catch {
          throw new Error(
            `${path} (${mode.name}): der Modus-Umschalter ist nicht im erwarteten Zustand ` +
              `erschienen. Ohne diesen Beweis ist nicht belegt, in welchem Farbmodus ` +
              `gemessen wurde — und ein Lauf, der das nicht belegen kann, wird nicht gezaehlt.`,
          );
        }

        // SETTLE BEFORE MEASURING — and again as a proof, not as a duration.
        //
        // The colour mode is set by a client effect that adds a class to <html>. Every
        // element carrying `transition-colors` or `transition-all` therefore ANIMATES
        // from its light value to its dark one, and axe injected during that window
        // reads an interpolated colour that no user ever sees in a settled state. That
        // is not theory: three consecutive runs of this command reported DIFFERENT
        // colour pairs on the same unchanged build — backgrounds of #575f69, #989da4,
        // #abb6c1, all of them points on the fade between #ffffff and #1e2937.
        //
        // A watcher whose findings move on an unchanged build cannot become a hard
        // gate, because "zero" would never be reachable and "fewer than last time" is
        // not a threshold. So we wait for each running animation's OWN finished
        // promise. Infinite animations (a ticker, a pulse) are excluded by name rather
        // than by timeout — they never finish, and waiting on one would hang the run.
        await page.evaluate(async () => {
          const finite = document.getAnimations().filter((a) => {
            const timing = a.effect && a.effect.getComputedTiming && a.effect.getComputedTiming();
            return !timing || timing.iterations !== Infinity;
          });
          await Promise.all(finite.map((a) => a.finished.catch(() => {})));
        });

        const background = toHex(
          await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
        );
        const key = `${mode.name}`;
        if (!seenBackgrounds.has(key)) seenBackgrounds.set(key, new Set());
        seenBackgrounds.get(key).add(background);

        await page.addScriptTag({ path: AXE_PATH });
        const result = await page.evaluate(() =>
          window.axe.run(document, {
            runOnly: { type: "rule", values: ["color-contrast"] },
            resultTypes: ["violations"],
          }),
        );

        for (const violation of result.violations) {
          for (const node of violation.nodes) {
            const data = (node.any || []).map((c) => c.data).find((d) => d && d.contrastRatio);
            if (!data) continue;
            findings.push({
              route: path,
              mode: mode.name,
              fg: data.fgColor,
              bg: data.bgColor,
              // parseRatio, not Number(): axe already surprised us once by stating the
              // REQUIREMENT as "4.5:1". If it ever does the same for the measurement,
              // this refuses loudly instead of printing NaN in the column that decides.
              ratio: parseRatio(data.contrastRatio),
              expected: parseExpected(data.expectedContrastRatio),
              selector: Array.isArray(node.target) ? String(node.target[0]) : String(node.target),
            });
          }
        }
      }

      await context.close();
    }
  }

  // THE PROOF THAT BOTH MODES ACTUALLY RENDERED DIFFERENTLY. Without this, a change to
  // how the theme is stored would turn the dark pass into a second light pass, and the
  // run would report half the site while looking exactly as green as a full one.
  const light = [...(seenBackgrounds.get("light") || [])];
  const dark = [...(seenBackgrounds.get("dark") || [])];
  const overlap = light.filter((c) => dark.includes(c));
  if (overlap.length > 0) {
    log("");
    log("ABBRUCH: heller und dunkler Durchlauf zeigen dieselbe Hintergrundfarbe " + overlap.join(", "));
    log("Der Farbmodus hat nicht gegriffen — dieser Lauf haette die halbe Seite gemessen");
    log("und trotzdem ausgesehen wie ein vollstaendiger. Kein Ergebnis ist besser als das.");
    return 2;
  }

  const groups = groupFindings(findings);
  log("");
  log(formatReport(groups, { routes: paths.length, modes: MODES.map((m) => m.name) }));
  log("");
  log(`Hintergruende: hell ${light.join(", ")} / dunkel ${dark.join(", ")}`);

  return groups.length > 0 ? 1 : 0;
}

/**
 * `process.exitCode` and NOT `process.exit`.
 *
 * `process.exit` tears the process down before pending stdout writes have flushed, and
 * stdout is a pipe whenever this runs in CI or through a `| tail`. The report IS the
 * entire output of this command — truncating it to save a few milliseconds would throw
 * away the only thing the run produced. Setting the code lets node exit on its own once
 * the writes are done.
 */
main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error) => {
    log("Fehlgeschlagen: " + error.message);
    process.exitCode = 2;
  });
