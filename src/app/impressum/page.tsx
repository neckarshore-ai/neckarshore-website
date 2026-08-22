import { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Logo from "@/components/Logo";
import { PageSchema } from "@/components/PageSchema";

export const metadata: Metadata = {
  title: "Impressum — neckarshore.ai",
  description:
    "Impressum von neckarshore.ai — German Rauhut, IT Consulting & Digital Ventures, Stuttgart. Angaben gemäß § 5 DDG.",
  openGraph: {
    title: "Impressum — neckarshore.ai",
    description:
      "Impressum von neckarshore.ai — German Rauhut, IT Consulting & Digital Ventures, Stuttgart. Angaben gemäß § 5 DDG.",
    url: "https://neckarshore.ai/impressum",
    siteName: "neckarshore.ai",
    locale: "de_DE",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "neckarshore.ai — Software Development. Closer to Home.",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Impressum — neckarshore.ai",
    description:
      "Impressum von neckarshore.ai — German Rauhut, IT Consulting & Digital Ventures, Stuttgart.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: "https://neckarshore.ai/impressum",
  },
};

const showOssLaunch = process.env.OSS_LAUNCH_VISIBLE === "true";

export default function Impressum() {
  return (
    <>
      <Nav showOssLaunch={showOssLaunch} />
      <PageSchema path="/impressum" name="Impressum — neckarshore.ai" />
      <main className="mx-auto max-w-[800px] px-4 pt-40 pb-20 md:px-6">
        <h1 className="font-heading text-4xl font-bold text-accent md:text-5xl">Impressum</h1>

        <div className="prose-neckarshore mt-10 space-y-8 text-neutral-dark/80 leading-relaxed dark:text-text-secondary">
          <section>
            <p className="text-sm text-muted dark:text-text-tertiary">Angaben gemäß § 5 DDG</p>
            <h2 className="mt-4 font-heading text-xl font-semibold text-primary dark:text-text-primary">Diensteanbieter</h2>
            <p>
              German Rauhut
              <br />
              IT Consulting &amp; Digital Ventures (Einzelunternehmen)
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-primary dark:text-text-primary">Kontakt</h2>
            <p>
              Rotebühlstraße 176
              <br />
              70197 Stuttgart
              <br />
              Deutschland
            </p>
            <p className="mt-2">
              Telefon: +49 160 385 9135
              <br />
              E-Mail: info@neckarshore.ai
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-primary dark:text-text-primary">Umsatzsteuer-ID</h2>
            <p>
              Umsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz:
              <br />
              <em>Wird nachgetragen.</em>
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-primary dark:text-text-primary">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p>
              German Rauhut
              <br />
              Rotebühlstraße 176
              <br />
              70197 Stuttgart
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-primary dark:text-text-primary">EU-Streitschlichtung</h2>
            <p>
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:text-accent-hover dark:text-accent-bright"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
            </p>
            <p className="mt-2">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-semibold text-primary dark:text-text-primary">Haftungsausschluss</h2>

            <h3 className="mt-4 font-heading text-lg font-semibold text-primary dark:text-text-primary">Haftung für Inhalte</h3>
            <p>
              Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
              Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Als
              Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den
              allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch
              nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach
              Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
            </p>

            <h3 className="mt-4 font-heading text-lg font-semibold text-primary dark:text-text-primary">Haftung für Links</h3>
            <p>
              Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss
              haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die
              Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten
              verantwortlich.
            </p>

            <h3 className="mt-4 font-heading text-lg font-semibold text-primary dark:text-text-primary">Urheberrecht</h3>
            <p>
              Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
              deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der
              Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des
              jeweiligen Autors bzw. Erstellers.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-primary/5 bg-white px-4 py-10 md:px-6 dark:border-text-secondary/10 dark:bg-surface">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 text-sm text-muted dark:text-text-tertiary md:flex-row md:justify-between">
          <Link href="/">
            <Logo size="text-xl" />
          </Link>
          <div className="flex gap-6">
            <span className="font-medium text-muted dark:text-text-tertiary">Impressum</span>
            <a href="/datenschutz" className="transition-colors hover:text-accent">
              Datenschutz
            </a>
          </div>
          <p>&copy; 2026 neckarshore.ai</p>
        </div>
      </footer>
    </>
  );
}
