import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { PageSchema } from "@/components/PageSchema";
import { pageMetadata } from "@/lib/seo";
import { repoType } from "@/lib/repo-types";

const showOssLaunch = process.env.OSS_LAUNCH_VISIBLE === "true";

/**
 * /test-management — "Wie wir testen, und warum die Zahl der Realität entspricht"
 * (backlog #245, UD5 Front-10).
 *
 * The detail surface behind the homepage "Automatisierte Tests" tile: the STORY behind the
 * number (counted by the test runner itself, never grep'd; independently re-checked before
 * published). Copy descends from the #245-brief Appendix-A draft, Rauhut-edited; the numbers
 * are DATA-BOUND to the same single source as the tile (public/estate-test-scope.json) so the
 * page can never contradict its own tile and the count moves with the next Durchstich.
 *
 * Honesty guardrails (brief §4, updated 2026-07-10): the re-check catches are framed as METHOD
 * only (no internal specifics); the headline is the EXACT audited figure + load-bearing "+"
 * (Founder directive 2026-07-10 — supersedes the #244 round-down framing; the exact figure is
 * still a floor, see `audited_floor` in the source JSON). Per §5(b): Top-N + rest-rollup, so the
 * 0-test scaffold repo and the one known-red repo (#257) fold into "und N weitere".
 */

interface EstateScope {
  total: number;
  repos: number;
  floor: boolean;
  // `repo` is already disclosure-processed at the source (scripts/withhold-private-repos.sh):
  // "privates Repo" (anonymized), a product display-name (approved-private OR public product), or
  // a raw owner/name slug (public non-product). `private: true` flags a private repo (withheld OR
  // shown by product name) — it is NOT the anonymized signal (the literal "privates Repo" is).
  // The count is always real, whichever shape the name takes.
  per_repo: { repo: string; total: number; private?: boolean }[];
}

function loadEstateScope(): EstateScope {
  const file = path.join(process.cwd(), "public", "estate-test-scope.json");
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  return {
    total: raw.total ?? 0,
    repos: raw.repos ?? (Array.isArray(raw.per_repo) ? raw.per_repo.length : 0),
    floor: raw.floor ?? false,
    per_repo: Array.isArray(raw.per_repo) ? raw.per_repo : [],
  };
}

/** Exact headline number + load-bearing "+" when the total is a floor (e.g. "3.391+"). */
function headlineTotal(scope: EstateScope): string {
  return scope.total.toLocaleString("de-DE") + (scope.floor ? "+" : "");
}

const TOP_N = 6;

// The full test-type scope (13), from the Test-Charter / Coverage-Matrix vocabulary. Listed
// qualitatively (no per-type numbers — an estate-wide type-split is only partly available).
const TEST_TYPES = [
  "Unit",
  "Integration",
  "End-to-End",
  "Contract",
  "Smoke",
  "Regression",
  "Performance",
  "Security",
  "Accessibility",
  "SEO/GEO",
  "Visual/UAT",
  "Docs-Lint",
  "AI-Eval",
] as const;

export const metadata: Metadata = pageMetadata({
  title: "Wie wir testen — nachprüfbar gezählt | neckarshore.ai",
  description:
    "Wie wir unser Test-Estate zählen und prüfen: jede Zahl vom Test-Runner, nie geschätzt, unabhängig gegengeprüft — nachprüfbar statt nach Bauchgefühl.",
  path: "/test-management",
});

export default function TestManagementPage() {
  const scope = loadEstateScope();
  const total = headlineTotal(scope);
  const repos = scope.repos;

  // Per-repo: the individual runner-reported counts, Top-N + rest-rollup (brief §5b). The rest
  // bucket folds the 0-test scaffold repo and the known-red repo (#257) out of individual view.
  //
  // Disclosure (Pass-2a, scripts/withhold-private-repos.sh at the source): three shapes reach here
  //   · withheld  — `.repo === "privates Repo"` (+ private:true): anonymized, no name/Typ.
  //   · product   — a display name with NO "/" (e.g. "Omnopsis"): an approved-private product shown
  //                 by name (private:true kept) OR a public product renamed for board consistency.
  //                 The raw slug is gone, so the Typ can't be derived → "—" (honest, not guessed).
  //   · slug      — a raw "owner/name" (public non-product, Founder named all public): last segment
  //                 as the name, repoType() for the Typ.
  // The anonymized signal is the LITERAL name, not `private:true` — a named_private product keeps
  // private:true yet must still render its product name.
  const ranked = [...scope.per_repo].sort((a, b) => b.total - a.total);
  const top = ranked.slice(0, TOP_N).map((r, i) => {
    const withheld = r.repo === "privates Repo";
    const isSlug = !withheld && r.repo.includes("/");
    return {
      key: withheld ? `private-${i}` : `${r.repo}-${i}`,
      name: withheld ? "privates Repo" : isSlug ? r.repo.split("/").pop()! : r.repo,
      type: isSlug ? repoType(r.repo) : null,
      total: r.total,
      withheld,
    };
  });
  const restCount = Math.max(0, repos - top.length);

  return (
    <>
      <Nav showOssLaunch={showOssLaunch} />
      <PageSchema
        path="/test-management"
        name="Wie wir testen — der Realität entspricht"
      />
      <main className="mx-auto max-w-[760px] px-4 pt-40 pb-20 md:px-6">
        <article>
          <header className="mb-8">
            <h1 className="font-heading text-4xl font-bold text-accent md:text-5xl">
              Wie wir testen, und warum die Zahl der Realität entspricht
            </h1>
          </header>

          <p className="text-xl leading-relaxed text-primary/90 dark:text-text-primary">
            Über unser Ökosystem laufen{" "}
            <strong className="text-accent dark:text-accent-bright">
              {total} automatisierte Tests
            </strong>{" "}
            über <strong>{repos} unserer Repositories</strong>. Wir runden diese Zahl
            bewusst nach unten, statt sie zu schönen. Das „+{"“"} steht dort, weil einige
            Skripte Tests ausführen, die sich nicht automatisch zählen lassen — die
            tatsächliche Zahl liegt also höher. Wir nennen lieber eine kleinere Zahl, die
            stimmt, als eine größere, die nur gut klingt.
          </p>

          <section className="mt-12">
            <h2 className="font-heading text-2xl font-bold text-primary dark:text-text-primary">
              Wie wir zählen
            </h2>
            <p className="mt-3 leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
              Jede Zahl stammt vom <strong>Test-Runner selbst</strong> — jest, vitest,
              Playwright, pytest, bats, node:test. Nichts wird von Hand gezählt, nichts per
              Textsuche (<code>grep</code>) geschätzt. Wo ein Skript keine Zählung ausgibt,
              runden wir nach unten und zählen es lieber gar nicht mit. Dafür steht das
              „+{"“"}: der tatsächliche Wert liegt höher, aber wir behaupten nur, was ein
              Runner bestätigt.
            </p>
          </section>

          <section className="mt-12">
            <h2 className="font-heading text-2xl font-bold text-primary dark:text-text-primary">
              Wie wir prüfen
            </h2>
            <p className="mt-3 leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
              Wir haben das gesamte Test-Estate neu gezählt — und{" "}
              <strong>
                jede einzelne Zahl unabhängig gegengeprüft, bevor wir sie akzeptiert haben.
              </strong>{" "}
              Zwei Zählungen stellten sich dabei als falsch heraus und wurden korrigiert,{" "}
              <em>bevor</em> irgendetwas veröffentlicht wurde. Der Grundsatz dahinter: die
              Zahl, die stimmt, schlägt die schnelle Zahl an jedem Tor.
            </p>
            <blockquote className="mt-6 border-l-2 border-accent/40 pl-5 text-lg italic leading-relaxed text-primary/80 dark:text-text-primary/90">
              „Das erste Prinzip ist, dass man sich nicht selbst täuschen darf — und man
              selbst ist die Person, die am leichtesten zu täuschen ist.{"“"}
              <footer className="mt-2 text-sm not-italic text-muted dark:text-text-tertiary">
                — Richard Feynman
              </footer>
            </blockquote>
          </section>

          <section className="mt-12">
            <h2 className="font-heading text-2xl font-bold text-primary dark:text-text-primary">
              Was abgedeckt ist
            </h2>
            <p className="mt-3 leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
              Unser Test-Scope umfasst <strong>13 Testarten</strong> über das gesamte
              Estate hinweg:
            </p>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Abgedeckte Testarten">
              {TEST_TYPES.map((t) => (
                <li
                  key={t}
                  className="rounded-full bg-primary/5 px-3 py-1 text-sm font-medium text-accent-hover dark:bg-text-secondary/10 dark:text-accent-bright"
                >
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-muted dark:text-text-tertiary">
              Bewusst ohne Zahl pro Testart: eine estate-weite Aufschlüsselung nach Testart
              ist nur teilweise verfügbar — eine genaue Aufteilung wäre also unvollständig.
            </p>
          </section>

          {top.length > 0 && (
            <section className="mt-12">
              <h2 className="font-heading text-2xl font-bold text-primary dark:text-text-primary">
                Pro Repository
              </h2>
              <p className="mt-3 leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
                Die testreichsten Repositories mit ihrer vom Runner gemeldeten Zahl. Die
                Gesamtzahl oben ist nach unten gerundet; die Einzelwerte sind die echten,
                gemessenen Zahlen pro Repository.
              </p>
              <div className="mt-4 overflow-hidden rounded-xl border border-primary/10 dark:border-text-secondary/10">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-primary/5 dark:bg-text-secondary/5">
                      <th
                        scope="col"
                        className="px-4 py-2.5 font-heading text-xs font-semibold uppercase tracking-wider text-muted dark:text-text-tertiary"
                      >
                        Repository
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-2.5 font-heading text-xs font-semibold uppercase tracking-wider text-muted dark:text-text-tertiary"
                      >
                        Typ
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-2.5 text-right font-heading text-xs font-semibold uppercase tracking-wider text-muted dark:text-text-tertiary"
                      >
                        Tests
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((r) => (
                      <tr
                        key={r.key}
                        className="border-t border-primary/10 dark:border-text-secondary/10"
                      >
                        <td
                          className={
                            r.withheld
                              ? "px-4 py-3 italic text-muted dark:text-text-tertiary"
                              : "px-4 py-3 font-mono text-neutral-dark/80 dark:text-text-secondary"
                          }
                        >
                          {r.name}
                        </td>
                        <td className="px-4 py-3 text-muted dark:text-text-tertiary">
                          {r.type ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-primary dark:text-text-primary">
                          {r.total.toLocaleString("de-DE")}
                        </td>
                      </tr>
                    ))}
                    {restCount > 0 && (
                      <tr className="border-t border-primary/10 dark:border-text-secondary/10">
                        <td
                          colSpan={3}
                          className="px-4 py-3 text-muted dark:text-text-tertiary"
                        >
                          … und {restCount} weitere Repositories
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* No count in the link text on purpose: this page's repo span is "repos with
                  tests", /repositories lists ALL repos — a number here would mismatch.
                  The two figures this comment used to name (20 and 31) were BOTH stale by
                  2026-08-12, which is the joke: a comment written to prevent a wrong number
                  on screen carried two wrong numbers itself. Deliberately unquantified now —
                  a hand-typed count next to a derived one is the drift class, not a fix. */}
              <p className="mt-4 text-sm">
                <Link
                  href="/repositories"
                  data-track="testmgmt_all_repositories"
                  className="font-medium text-accent transition-colors hover:text-accent-hover dark:text-accent-bright"
                >
                  Alle Repositories ansehen →
                </Link>
              </p>
            </section>
          )}

          <p className="mt-12 text-sm italic text-muted dark:text-text-tertiary">
            <span className="font-medium not-italic">Wie dieser Text entstand:</span> Diese
            Seite über nachprüfbares Testen wurde selbst KI-entworfen und menschlich
            editiert — dieselbe Disziplin, die unsere Tests zählt, hat auch diesen Text
            geschrieben.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
