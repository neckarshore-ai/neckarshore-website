import fs from "fs";
import path from "path";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { PageSchema } from "@/components/PageSchema";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbListSchema } from "@/lib/schema/breadcrumb";

/**
 * /ki-beratung — the buyer-visible page for the KI-Potenzialanalyse.
 *
 * WHY THIS PAGE EXISTS: the offer was fully specified and published nowhere a buyer
 * would look. Its source is `04-Marketing/Campaigns/2026-08-ki-potenzialanalyse-linkedin/
 * einseiter-linkedin-public.md` (neckarshore-planning); the sequencing, guardrails and
 * measurement lane are `docs/plans/2026-08-15-website-sales-funnel-versuchsplan.md`
 * (Wave 1) plus report `2026-08-15-engels-website-sprint.md`.
 *
 * THE RULE THAT GOVERNS EVERY LINE HERE: this page RE-CUTS published copy. It makes no
 * claim that is not already published in an artifact the estate can point at. Prices,
 * ladder, Anrechnung, refusal block and the trust sentence are lifted from the one-pager;
 * the founder anchor is the homepage's own #founder wording; the test figure is read from
 * the same `public/stats.json` the Tests tile renders. If you are about to add a sentence,
 * find its source first.
 *
 * FOUR DECISIONS BAKED IN, each with an owner:
 *
 *  1. 20 MINUTES, NOT 30. The one-pager promises a 30-minute Erstgespräch; the site says
 *     20 in three places and links calendly.com/rauhut/20min in seven. Making this page
 *     say 30 would re-open honesty fix #4 (2026-07-28, shipped 2026-08-06 in PR #165)
 *     nine days after it landed. Founder-decided 2026-08-15.
 *  2. NO PRICING FORMULA, NO 2x CHECK, NO 700-EUR FLOOR — guardrail C6, Founder 2026-08-07.
 *     Only the published Festpreise appear here. Do not add the internal one-pager's
 *     calculation to this file, ever.
 *  3. NOTHING THAT READS AS AVAILABILITY-FOR-HIRE — guardrail C4, Founder 2026-08-05. The
 *     mandate offering publishes exclusively via the private Erwerbs lane. This page sells a
 *     productized ANALYSIS, not a person's calendar. That boundary also governs the nav label.
 *  4. THREE OBJECTIONS, NOT FIVE. The competitive reference (carstenruetz.de) carries five;
 *     copying the COUNT would mean inventing two. Each of the three below is derived from an
 *     existing published deliverable, marked at its source. The wording is Linus's draft and
 *     the Founder rewrites in his own voice per the standing authorship rule.
 *
 * DELIBERATELY NOT BUILT HERE: a Service/Offer JSON-LD entity carrying the price ranges.
 * That would publish the prices in a machine-readable second surface, which is a scope
 * decision nobody has taken — the page ships WebPage + BreadcrumbList only. Raise it as its
 * own item if the GEO value is wanted.
 */

const PAGE_TITLE = "KI-Beratung — KI-Potenzialanalyse für den Mittelstand";
/** Kept at or under 155 characters — TC-SEO-037 guards the whole site on this, and the
 *  first draft here was 178 and went red. That is the gate working, not an obstacle. */
const PAGE_DESCRIPTION =
  "Wo lohnen KI-Agenten in Ihren Prozessen? Potenzialanalyse zum Festpreis: " +
  "Use-Case-Map, Durchstich-Empfehlungen, Readiness-Notizen.";

export const metadata = pageMetadata({
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  path: "/ki-beratung",
});

const breadcrumbSchema = breadcrumbListSchema([
  { name: "Start", href: "/" },
  { name: "KI-Beratung" },
]);

/** Was die Analyse bewusst NICHT ist — one-pager, verbatim scope. Promoted to the first
 *  screen because it is the highest-leverage element on the page: it pre-empts the buyer's
 *  first objection and demonstrates scope discipline in the same move. */
const NON_SCOPE = [
  {
    head: "Keine Implementierung",
    body: "Die Umsetzung ist ein separates Projekt mit eigenem Festpreis — die Indikation dafür liefert die Analyse.",
  },
  {
    head: "Kein Vendor-Vergleichs-Marathon",
    body: "Wir bewerten Ihre Prozesse, nicht 40 Tool-Anbieter.",
  },
  {
    head: "Keine Workshop-Serie",
    body: "Ein Durchlauf, ein Ergebnis, eine Entscheidungsgrundlage.",
  },
];

/** Was Sie bekommen — the one-pager's three deliverables. */
const DELIVERABLES = [
  {
    head: "Use-Case-Map",
    body: "Ihre Prozesse, bewertet nach KI-Agenten-Potenzial: wo Automatisierung heute trägt, wo (noch) nicht.",
  },
  {
    head: "1–2 Durchstich-Empfehlungen",
    body: "Die vielversprechendsten Einstiegs-Use-Cases, konkret geschnitten, mit Projektpreis-Indikation für die Umsetzung.",
  },
  {
    head: "Readiness-Notizen",
    body: "Was in Ihren Daten, Systemen und Abläufen vor einem KI-Projekt zu klären ist.",
  },
];

/**
 * The two entry depths. Published Festpreise only — see decision 2 in the file header.
 * The figures were set by the Founder on 2026-08-15 at live acceptance of this page.
 *
 * `hinweis: "Einführungspreis"` is not decoration: the label is part of that ruling, and
 * TC-CNT-090 asserts it inside this exact row so it cannot quietly fall out of the cell.
 */
const LADDER = [
  {
    stufe: "Kompakt-Analyse",
    format: "Remote",
    umfang: "2–3 h strukturiertes Arbeitsgespräch + Auswertung",
    preis: "1.500 EUR",
    hinweis: "Einführungspreis",
  },
  {
    stufe: "Workshop-Tag",
    format: "Vor Ort (Großraum Stuttgart), sonst remote",
    umfang: "Ganztages-Workshop mit Ihrem Team + Auswertung",
    preis: "2.500–3.500 EUR",
    hinweis: null,
  },
];

/**
 * Häufige Bedenken — objection pre-emption (Founder-decided for Wave 1).
 *
 * PROVENANCE PER ITEM, because "where does this sentence come from" is the question this
 * page must always be able to answer:
 *   1. inverts deliverable 3 (Readiness-Notizen) into its own answer — no new promise.
 *   2. rests on the one-pager's "Wir sind keine Folien-Berater / wir betreiben selbst".
 *      Deliberately does NOT disparage the customer's own IT: a buyer whose team you
 *      attack does not buy.
 *   3. combines the published Anrechnung, the Festpreis assurance and the one-pager's
 *      own "wir sagen ehrlich, ob sich das für Sie lohnt".
 * The WORDING is Linus's draft, shown to the Founder 2026-08-15 and awaiting his pass.
 */
const CONCERNS = [
  {
    q: "Unsere Daten und Prozesse sind dafür noch gar nicht sauber genug.",
    a: "Das ist der häufigste Grund zu warten — und der schlechteste. Genau dieser Zustand ist Teil des Ergebnisses: Die Readiness-Notizen halten fest, was in Ihren Daten, Systemen und Abläufen vor einem KI-Projekt zu klären ist. Sie müssen nicht bereit sein, um herauszufinden, wo Sie stehen.",
  },
  {
    q: "Das kann unsere IT doch selbst beurteilen.",
    a: "Wahrscheinlich kann sie das — für die Systeme, die sie täglich betreibt. Was sie nicht hat, ist der Vergleich: Wir betreiben unser eigenes Unternehmen mit einer Flotte spezialisierter KI-Agenten und sehen täglich, was trägt und was nicht. Die Analyse ersetzt Ihre IT nicht, sie gibt ihr eine zweite, strukturierte Sicht zum Festpreis.",
  },
  {
    q: "Und wenn am Ende nichts Verwertbares herauskommt?",
    a: "Dann sagen wir Ihnen das im kostenlosen Erstgespräch, bevor Sie etwas buchen. Kommt es zur Analyse, ist der Preis vorher bekannt und fest — keine Tagessatz-Abrechnung, keine Nachträge. Und buchen Sie nach der Kompakt-Analyse den Workshop-Tag, wird die erste Stufe vollständig angerechnet.",
  },
];

/**
 * The audited estate-wide test figure, read at build time from the same artifact the Tests
 * tile renders. Read rather than hardcoded on purpose: a literal here would be the exact
 * hand-maintained-copy-next-to-a-derived-source class that llms.txt was repaired for on
 * 2026-08-15. The trailing "+" is load-bearing — the figure is a FLOOR, not a ceiling.
 */
function auditedTestFigure(): string {
  const raw = fs.readFileSync(path.join(process.cwd(), "public", "stats.json"), "utf8");
  const stats = JSON.parse(raw) as {
    tests?: number;
    testScope?: { total?: number; floor?: boolean };
  };
  const total = stats.testScope?.total ?? stats.tests;
  if (typeof total !== "number" || !Number.isFinite(total)) {
    throw new Error("/ki-beratung: no usable test total in public/stats.json");
  }
  return `${total.toLocaleString("de-DE")}${stats.testScope?.floor ? "+" : ""}`;
}

const CALENDLY = "https://calendly.com/rauhut/20min";

export default function KiBeratungPage() {
  const tests = auditedTestFigure();

  return (
    <>
      <Nav />
      <PageSchema path="/ki-beratung" name={PAGE_TITLE} />
      <JsonLd data={breadcrumbSchema} id="schema-breadcrumb-ki-beratung" />

      <main className="mx-auto max-w-[960px] px-4 pt-40 pb-20 md:px-6">
        <header className="max-w-[680px]">
          <p className="font-heading text-sm font-semibold uppercase tracking-wider text-accent">
            KI-Beratung
          </p>
          {/* H1 = the one-pager's own title, product name first (Founder 2026-08-15, decided
              against the bare-question variant): the campaign carries "KI-Potenzialanalyse"
              as its name, so a visitor arriving from a post lands on the words they clicked. */}
          <h1 className="mt-3 font-heading text-4xl font-bold text-primary dark:text-text-primary md:text-5xl">
            KI-Potenzialanalyse — Wo lohnen KI-Agenten in Ihren Prozessen?
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
            KI verändert gerade jede Wissensarbeit — aber wo lohnt sie sich in{" "}
            <strong>Ihrem</strong> Unternehmen zuerst? Die KI-Potenzialanalyse
            beantwortet genau das: strukturiert, zum Festpreis, mit einem Ergebnis,
            mit dem Sie sofort entscheiden können.
          </p>
          {/* Hero CTA — SAME route and SAME target as the closing CTA. "One CTA" (plan Wave 1,
              item 5) means one ROUTE, not one button; TC-CNT-089 therefore asserts that every
              Calendly link inside <main> points at the identical target, instead of counting
              links. Counting was the first version of that test and it forbade something the
              decision never meant. */}
          <a
            href={CALENDLY}
            target="_blank"
            rel="noopener noreferrer"
            data-track="kiberatung_cta_hero"
            className="mt-7 inline-flex items-center rounded-lg bg-accent px-6 py-3 font-heading font-semibold text-white transition-colors hover:bg-accent/90 dark:bg-accent-bright dark:text-primary dark:hover:bg-accent-bright/90"
          >
            Kostenloses Erstgespräch (20 Minuten)
          </a>
        </header>

        {/* SECTION ORDER: Liefergegenstände → Grenzen → Preise (Founder 2026-08-15).
            The first build put the refusal block on the first screen, ahead of the
            deliverables; the Founder chose the other cut. Both keep the block BEFORE the
            prices, which is the half that was actually decided on 2026-07-28 — what changed
            is only whether the reader meets the offer or its limits first. Cheap to swap
            back if the live page argues otherwise. */}
        <section aria-labelledby="deliverables-heading" className="mt-16">
          <h2
            id="deliverables-heading"
            className="font-heading text-2xl font-bold text-primary dark:text-text-primary md:text-3xl"
          >
            Was Sie bekommen
          </h2>
          <ol className="mt-6 grid gap-5 sm:grid-cols-3">
            {DELIVERABLES.map((item, i) => (
              <li key={item.head}>
                <span className="font-heading text-sm font-semibold text-accent dark:text-accent-bright">
                  {i + 1}
                </span>
                <span className="mt-1 block font-heading text-base font-semibold text-primary dark:text-text-primary">
                  {item.head}
                </span>
                <span className="mt-2 block text-[15px] leading-relaxed text-neutral-dark/75 dark:text-text-secondary/85">
                  {item.body}
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* Refusal block — first screen by design, see NON_SCOPE above. */}
        <section
          aria-labelledby="nonscope-heading"
          className="mt-12 rounded-2xl border border-primary/10 bg-primary/[0.02] px-6 py-8 md:px-8 dark:border-text-secondary/15 dark:bg-white/[0.02]"
        >
          <h2
            id="nonscope-heading"
            className="font-heading text-xl font-semibold text-primary dark:text-text-primary md:text-2xl"
          >
            Was die Analyse bewusst nicht ist
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {NON_SCOPE.map((item) => (
              <div
                key={item.head}
                className="rounded-xl border border-primary/10 bg-white/60 px-5 py-4 dark:border-text-secondary/15 dark:bg-white/[0.03]"
              >
                <span className="block font-heading text-base font-semibold text-primary dark:text-text-primary">
                  {item.head}
                </span>
                <span className="mt-2 block text-[14px] leading-relaxed text-neutral-dark/70 dark:text-text-secondary/80">
                  {item.body}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="ladder-heading" className="mt-16">
          <h2
            id="ladder-heading"
            className="font-heading text-2xl font-bold text-primary dark:text-text-primary md:text-3xl"
          >
            Zwei Einstiegstiefen — Sie entscheiden
          </h2>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
              <thead>
                <tr className="border-b border-primary/15 dark:border-text-secondary/20">
                  <th className="py-3 pr-4 font-heading text-sm font-semibold uppercase tracking-wider text-neutral-dark/60 dark:text-text-secondary/70">
                    Stufe
                  </th>
                  <th className="py-3 pr-4 font-heading text-sm font-semibold uppercase tracking-wider text-neutral-dark/60 dark:text-text-secondary/70">
                    Format
                  </th>
                  <th className="py-3 pr-4 font-heading text-sm font-semibold uppercase tracking-wider text-neutral-dark/60 dark:text-text-secondary/70">
                    Umfang
                  </th>
                  {/* "Festpreis-Rahmen" was accurate while both rows were ranges. Stufe 1 is
                      now a point price, and a column head promising a "Rahmen" over a single
                      figure is the small kind of untruth this site keeps getting caught by. */}
                  <th className="py-3 font-heading text-sm font-semibold uppercase tracking-wider text-neutral-dark/60 dark:text-text-secondary/70">
                    Festpreis
                  </th>
                </tr>
              </thead>
              <tbody>
                {LADDER.map((row) => (
                  <tr
                    key={row.stufe}
                    className="border-b border-primary/10 dark:border-text-secondary/15"
                  >
                    <td className="py-4 pr-4 font-heading font-semibold text-primary dark:text-text-primary">
                      {row.stufe}
                    </td>
                    <td className="py-4 pr-4 text-neutral-dark/75 dark:text-text-secondary/85">
                      {row.format}
                    </td>
                    <td className="py-4 pr-4 text-neutral-dark/75 dark:text-text-secondary/85">
                      {row.umfang}
                    </td>
                    <td className="py-4 font-heading font-semibold text-primary dark:text-text-primary">
                      {row.preis}
                      {row.hinweis ? (
                        <span className="mt-1 block font-body text-[13px] font-normal text-neutral-dark/60 dark:text-text-secondary/70">
                          {row.hinweis}
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* ANRECHNUNG, TWO STAGES (stage 2 new — Founder 2026-08-15).
              Kept as two plain sequential sentences on purpose: a combined formulation
              invites the question whether stage 1 ALSO carries through onto the
              implementation project. Read plainly it does not — stage 1 has already been
              absorbed into the Workshop-Tag, and the Workshop-Tag is what carries on.
              THE SIX-MONTH WINDOW RUNS FROM THE WORKSHOP-TAG, and that is now decided
              rather than assumed. The original Founder wording named no starting point;
              "nach dem Workshop-Tag" was my reading of that gap, flagged as a reading and
              not as a ruling, because on a page that sells "keine Nachträge" a credit
              deadline without a starting point is exactly the clause a Mittelstands-Einkauf
              argues about later. Ratified by the Founder in acceptance round 2 (2026-08-15).
              Do not soften it back into an open formulation. */}
          <p className="mt-5 max-w-[680px] text-[15px] leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
            <strong>Anrechnung, Stufe 1 auf Stufe 2:</strong> Buchen Sie nach der
            Kompakt-Analyse den Workshop-Tag, wird der Preis der Stufe 1 vollständig
            angerechnet.
          </p>
          <p className="mt-3 max-w-[680px] text-[15px] leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
            <strong>Und es geht weiter:</strong> Beauftragen Sie innerhalb von sechs
            Monaten nach dem Workshop-Tag die Umsetzung, rechnen wir den Workshop-Tag
            vollständig auf das Projekt an — auf die Umsetzung, nicht auf weitere Beratung.
          </p>
          <p className="mt-3 max-w-[680px] text-[15px] leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
            Der Einstieg ist damit risikofrei — Sie zahlen die Tiefe nur einmal.
          </p>
          <p className="mt-2 text-[14px] text-neutral-dark/60 dark:text-text-secondary/70">
            Alle Preise netto, Festpreis — keine Tagessatz-Abrechnung, keine Nachträge.
          </p>
        </section>

        <section aria-labelledby="concerns-heading" className="mt-16">
          <h2
            id="concerns-heading"
            className="font-heading text-2xl font-bold text-primary dark:text-text-primary md:text-3xl"
          >
            Häufige Bedenken
          </h2>
          <dl className="mt-6 space-y-6">
            {CONCERNS.map((item) => (
              <div
                key={item.q}
                className="border-l-2 border-accent/40 pl-5 dark:border-accent-bright/40"
              >
                <dt className="font-heading text-base font-semibold text-primary dark:text-text-primary">
                  „{item.q}“
                </dt>
                <dd className="mt-2 max-w-[720px] text-[15px] leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="anchor-heading" className="mt-16">
          <h2
            id="anchor-heading"
            className="font-heading text-2xl font-bold text-primary dark:text-text-primary md:text-3xl"
          >
            Wer das macht
          </h2>
          {/* The ex-Mercedes-Benz founder anchor deliberately does NOT appear here
              (Founder 2026-08-15): it belongs on the rauhut.com person anchor, where a CV
              line is the subject rather than a garnish. It already stands on this domain in
              the homepage's #founder section, so leaving it out here removes a repetition,
              not a fact. */}
          {/* THE "WIR" IS NOW SAID OUT LOUD (Founder 2026-08-15, wording his). The page used
              to speak of a "Flotte spezialisierter KI-Agenten" while leaving open how many
              humans stood behind it — which invited the reader to imagine a bench of
              consultants that does not exist. Naming it is both the honest move and the
              stronger one: it turns the smallness into the direct-access mechanic.
              BOTH PARAGRAPHS BELOW ARE FOUNDER-WRITTEN VERBATIM as of acceptance round 2
              (2026-08-15). The second one used to be my trimmed draft; it was replaced
              wholesale, and the replacement is the better sentence — it drops the negative
              framing ("keine Folien-Berater", which spends the reader's attention on what we
              are not) for the buyer-facing form: what you get, and what the analysis answers.
              If you are editing here, you are editing the Founder's own words. */}
          <p className="mt-5 max-w-[720px] text-[15px] leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
            Wir — das sind German Rauhut und eine Flotte spezialisierter KI-Agenten, die
            unser eigenes Unternehmen täglich betreiben. Im Gespräch und in der Analyse
            sitzen Sie mir gegenüber: Der, mit dem Sie sprechen, macht auch die Arbeit.
          </p>
          <p className="mt-4 max-w-[720px] text-[15px] leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
            Sie bekommen keine Empfehlung, die wir nicht selbst benutzen. Unsere Agenten
            entwickeln, dokumentieren und testen unseren eigenen Betrieb — was davon in Ihre
            Prozesse passt, zeigt die Analyse.
          </p>
          <p className="mt-4 max-w-[720px] text-[15px] leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
            Nachprüfbar statt behauptet: {tests} geprüfte automatisierte Tests über die
            eigene Produktflotte,{" "}
            <Link
              href="/test-management"
              data-track="kiberatung_testmanagement"
              className="text-accent underline-offset-4 hover:underline dark:text-accent-bright"
            >
              offengelegt samt Messweg
            </Link>
            , und{" "}
            <Link
              href="/products"
              data-track="kiberatung_products"
              className="text-accent underline-offset-4 hover:underline dark:text-accent-bright"
            >
              die Produkte, an denen wir es selbst lernen
            </Link>
            .
          </p>
        </section>

        <section
          aria-labelledby="cta-heading"
          className="mt-16 rounded-2xl border border-accent/20 bg-accent/[0.04] px-6 py-9 md:px-8 dark:border-accent-bright/25 dark:bg-accent-bright/[0.06]"
        >
          <h2
            id="cta-heading"
            className="font-heading text-2xl font-bold text-primary dark:text-text-primary md:text-3xl"
          >
            Nächster Schritt
          </h2>
          <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
            Ein kostenloses Erstgespräch, 20 Minuten, remote: Sie schildern Ihre
            Situation, wir sagen ehrlich, ob eine Potenzialanalyse sich für Sie lohnt.
          </p>
          <a
            href={CALENDLY}
            target="_blank"
            rel="noopener noreferrer"
            data-track="kiberatung_cta_erstgespraech"
            className="mt-6 inline-flex items-center rounded-lg bg-accent px-6 py-3 font-heading font-semibold text-white transition-colors hover:bg-accent/90 dark:bg-accent-bright dark:text-primary dark:hover:bg-accent-bright/90"
          >
            Erstgespräch vereinbaren
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}
