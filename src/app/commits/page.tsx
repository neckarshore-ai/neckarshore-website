import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { PageSchema } from "@/components/PageSchema";
import { pageMetadata } from "@/lib/seo";

const showOssLaunch = process.env.OSS_LAUNCH_VISIBLE === "true";

/**
 * /commits — how this estate was actually built, over time (Founder decision 2026-08-12).
 *
 * THE ONE RULE THIS PAGE OBEYS: there is exactly ONE commits number on this site, and it is
 * the Commits tile's — the contributors-endpoint sum in public/stats.json. This page renders
 * the SHAPE of that work, never a competing total.
 *
 * Why that rule is not pedantry. GitHub's weekly statistics (/stats/commit_activity, the only
 * affordable source for a 52-week timeline) are a CACHED snapshot that lags. Measured
 * 2026-08-12: the current week reported 150 commits for one repo while a live commit search
 * returned 188 for the same window, and all 38 repos sat at or below their contributors-sum.
 * Rendering the series sum as "commits" would put two different commit counts on one website —
 * the exact drift the repository-count gate was built the same day to end. So the headline
 * figure comes from stats.json, the bars come from the series, and the difference is stated
 * on the page rather than hidden by rounding.
 *
 * No repo names here, public or private: every figure is estate-wide or per-org. The artifact
 * cannot carry a private slug, which is a stronger privacy position than filtering one out.
 */

interface WeekPoint {
  week: string;
  total: number;
}
interface MonthPoint {
  month: string;
  total: number;
}
interface AreaPoint {
  area: string;
  total: number;
}
interface Activity {
  updatedAt: string;
  startDate: string;
  seriesTotal: number;
  weeks: WeekPoint[];
  months: MonthPoint[];
  areas: AreaPoint[];
  peak: MonthPoint | null;
  reposCounted: number;
  reposMissing: number;
}

function loadActivity(): Activity {
  const file = path.join(process.cwd(), "public", "commit-activity.json");
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function loadCanonicalCommits(): number {
  const file = path.join(process.cwd(), "public", "stats.json");
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  return Number.isFinite(raw.commits) ? raw.commits : 0;
}

const de = (n: number) => n.toLocaleString("de-DE");

const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function monthLabel(iso: string): string {
  const [year, month] = iso.split("-");
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

export const metadata: Metadata = pageMetadata({
  title: "Commit-Aktivität | neckarshore.ai",
  description:
    "Wie dieser Code-Bestand entstanden ist: Commit-Aktivität pro Woche und Monat seit dem ersten Commit, aufgeschlüsselt nach Bereichen — automatisch aus GitHub, nicht von Hand gepflegt.",
  path: "/commits",
});

export default function CommitsPage() {
  const activity = loadActivity();
  const commits = loadCanonicalCommits();
  const { weeks, months, areas, peak } = activity;

  const stand = activity.updatedAt
    ? new Date(activity.updatedAt).toLocaleDateString("de-DE")
    : null;
  const since = new Date(activity.startDate).toLocaleDateString("de-DE");

  // Chart geometry. A viewBox plus width:100% makes it responsive without JS and without a
  // charting dependency; the bars are plain rects.
  const W = 720;
  const H = 200;
  const GAP = 3;
  const maxWeek = weeks.reduce((m, w) => Math.max(m, w.total), 1);
  const barW = weeks.length > 0 ? (W - GAP * (weeks.length - 1)) / weeks.length : 0;
  const areaMax = areas.reduce((m, a) => Math.max(m, a.total), 1);

  return (
    <>
      <Nav showOssLaunch={showOssLaunch} />
      <PageSchema path="/commits" name="Commit-Aktivität" />
      <main className="mx-auto max-w-[820px] px-4 pt-40 pb-20 md:px-6">
        <article>
          <header className="mb-8">
            <h1 className="font-heading text-4xl font-bold text-accent md:text-5xl">
              Commit-Aktivität
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-primary/90 dark:text-text-primary">
              <strong>{de(commits)} Commits</strong> seit dem {since} — über{" "}
              {activity.reposCounted} Repositories hinweg, kontinuierlich statt in Schüben. Die
              Kurve unten zeigt, wann gearbeitet wurde; die Zahlen kommen täglich automatisch aus
              GitHub, nicht aus einer gepflegten Liste.
            </p>
          </header>

          {/* ── Wochenverlauf ── */}
          <section className="mt-10">
            <h2 className="font-heading text-2xl font-bold text-primary dark:text-text-primary">
              Pro Woche
            </h2>
            <figure className="mt-5">
              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="h-auto w-full"
                role="img"
                aria-label={`Balkendiagramm der Commits pro Woche seit ${since}. Höchster Wert: ${de(
                  maxWeek,
                )} Commits in einer Woche. Die vollständigen Zahlen stehen in der Monatstabelle darunter.`}
              >
                {/* Kein <title> im SVG: React hebt jedes <title>-Element in den Dokument-Kopf
                    und erzeugt damit einen Hydration-Mismatch — eine echte Konsolenfehlermeldung,
                    nicht bloss Rauschen. Der barrierefreie Name kommt ohnehin aus role="img" +
                    aria-label oben, das <title> war redundant. Die Tooltips an den Balken nutzen
                    stattdessen <desc>, das React nicht anfasst. */}
                {weeks.map((w, i) => {
                  const h = Math.max(2, (w.total / maxWeek) * (H - 24));
                  return (
                    <rect
                      key={w.week}
                      x={i * (barW + GAP)}
                      y={H - h}
                      width={barW}
                      height={h}
                      rx={2}
                      className="fill-accent/70 dark:fill-accent-bright/70"
                    >
                      <desc>{`Woche ab ${new Date(w.week).toLocaleDateString("de-DE")}: ${de(
                        w.total,
                      )} Commits`}</desc>
                    </rect>
                  );
                })}
              </svg>
              <figcaption className="mt-3 flex justify-between text-xs text-muted dark:text-text-tertiary">
                <span>{since}</span>
                <span>Spitze: {de(maxWeek)} Commits in einer Woche</span>
                <span>heute</span>
              </figcaption>
            </figure>
          </section>

          {/* ── Monatstabelle: dieselben Daten in Textform, auch fuer Screenreader ── */}
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-bold text-primary dark:text-text-primary">
              Pro Monat
            </h2>
            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="border-b border-primary/10 text-left dark:border-text-secondary/10">
                  <th scope="col" className="pb-2 font-heading font-semibold text-primary dark:text-text-primary">
                    Monat
                  </th>
                  <th scope="col" className="pb-2 text-right font-heading font-semibold text-primary dark:text-text-primary">
                    Commits
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/10 dark:divide-text-secondary/10">
                {months.map((m) => (
                  <tr key={m.month}>
                    <td className="py-2 text-neutral-dark/80 dark:text-text-secondary">
                      {monthLabel(m.month)}
                      {peak && m.month === peak.month && (
                        <span className="ml-2 text-xs font-medium text-accent dark:text-accent-bright">
                          stärkster Monat
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right font-mono text-primary dark:text-text-primary">
                      {de(m.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* ── Bereiche ── */}
          <section className="mt-12">
            <h2 className="font-heading text-2xl font-bold text-primary dark:text-text-primary">
              Nach Bereichen
            </h2>
            <dl className="mt-5 space-y-3">
              {areas.map((a) => (
                <div key={a.area}>
                  <div className="flex items-baseline justify-between text-sm">
                    <dt className="text-primary dark:text-text-primary">{a.area}</dt>
                    <dd className="font-mono text-neutral-dark/80 dark:text-text-secondary">
                      {de(a.total)}
                    </dd>
                  </div>
                  <div
                    className="mt-1 h-1.5 rounded-full bg-accent/60 dark:bg-accent-bright/60"
                    style={{ width: `${Math.max(1, (a.total / areaMax) * 100)}%` }}
                  />
                </div>
              ))}
            </dl>
          </section>

          {/* ── Herkunft der Zahlen. Steht auf der Seite, nicht nur im Code. ── */}
          <section className="mt-12 rounded-lg bg-primary/5 p-5 text-sm leading-relaxed text-neutral-dark/80 dark:bg-text-secondary/5 dark:text-text-secondary">
            <h2 className="font-heading text-base font-semibold text-primary dark:text-text-primary">
              Woher die Zahlen kommen
            </h2>
            <p className="mt-2">
              Die <strong>{de(commits)} Commits</strong> oben sind dieselbe Zahl wie auf der
              Startseite: die Summe aller Beiträge über {activity.reposCounted} Repositories,
              täglich neu erhoben.
            </p>
            <p className="mt-2">
              Die Balken stammen aus GitHubs Wochenstatistik, einem zwischengespeicherten
              Schnappschuss, der der Live-Zahl nachhängt — in Summe {de(activity.seriesTotal)}{" "}
              Commits über {weeks.length} Wochen. Deshalb zeigt diese Seite die{" "}
              <em>Verteilung</em> der Arbeit und nicht eine zweite Gesamtzahl: zwei
              unterschiedliche Commit-Zahlen auf einer Website wären genau die Art Widerspruch,
              die wir gerade abschaffen.
            </p>
            {activity.reposMissing > 0 && (
              <p className="mt-2">
                Für {activity.reposMissing} Repositories lagen zum Erhebungszeitpunkt keine
                Wochendaten vor; sie fehlen in den Balken, nicht in der Gesamtzahl.
              </p>
            )}
            {stand && <p className="mt-3 font-mono text-xs">Stand: {stand}</p>}
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
