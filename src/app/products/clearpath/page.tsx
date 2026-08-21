import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Prose } from "@/components/Prose";
import { PageSchema } from "@/components/PageSchema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProductDetailNav } from "@/components/ProductDetailNav";
import { ProductFaq } from "@/components/ProductFaq";
import { ExportButton } from "@/components/export/ExportButton";
import { pageMetadata } from "@/lib/seo";
import { productOgImage } from "@/lib/product-og";
import { getProductEntry } from "@/lib/content/products";
import { breadcrumbTrailForSlug } from "@/lib/portfolio";
import { faqForSlug } from "@/lib/product-faqs";
import { softwareApplicationSchema } from "@/lib/schema/product";
import { CLEARPATH_BIASES } from "@/lib/clearpath-biases";

const showOssLaunch = process.env.OSS_LAUNCH_VISIBLE === "true";
const SLUG = "clearpath";

export function generateMetadata(): Metadata {
  const entry = getProductEntry(SLUG);
  if (!entry) return {};
  return pageMetadata({
    title: "ClearPath — Mentale Firewall gegen Verzerrungen | neckarshore.ai",
    description: entry.metaDescription ?? entry.definition,
    path: `/products/${SLUG}`,
    image: productOgImage(SLUG),
  });
}

export default function ClearPathPage() {
  const entry = getProductEntry(SLUG);
  // ClearPath is live: a missing liveUrl would be a data error, not a preview state.
  if (!entry || !entry.liveUrl) notFound();
  // Hoist to a local const so the narrowing survives the schema function call below.
  const liveUrl = entry.liveUrl;

  return (
    <>
      <Nav showOssLaunch={showOssLaunch} />
      <PageSchema
        path={`/products/${SLUG}`}
        name={entry.name}
        primaryEntity={softwareApplicationSchema({
          ...entry,
          liveUrl,
          path: `/products/${SLUG}`,
        })}
      />
      <main className="mx-auto max-w-[760px] px-4 pt-40 pb-20 md:px-6">
        <Breadcrumbs trail={breadcrumbTrailForSlug(SLUG)} />

        <article>
          <div className="mb-4 flex justify-end">
            <ExportButton path={`/products/${SLUG}`} />
          </div>
          <header className="mb-6">
            <h1 className="font-heading text-4xl font-bold text-accent md:text-5xl">
              {entry.headline}
            </h1>
          </header>

          <p className="text-xl leading-relaxed text-primary/90 dark:text-text-primary">
            {entry.definition}
          </p>

          <div className="mt-8">
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-track="clearpath_live_cta"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition-all duration-150 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
            >
              Live ausprobieren →
            </a>
            <p className="mt-3 text-sm text-muted dark:text-text-tertiary">
              Anonym, ohne Anmeldung.
            </p>
          </div>

          <div className="mt-10">
            <Prose html={entry.bodyHtml} />
          </div>

          <section className="mt-12" aria-labelledby="biases-heading">
            <h2
              id="biases-heading"
              className="font-heading text-2xl font-bold text-primary dark:text-text-primary"
            >
              Die wichtigsten Denkfehler
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted dark:text-text-tertiary">
              Rund 52 kognitive Verzerrungen sind dokumentiert — für eine konkrete
              Entscheidung zählen meist nur wenige. Genau dort setzt ClearPath an. Die
              häufigsten in einem Satz, mit Link zur Vertiefung.
            </p>
            <div className="mt-6 overflow-x-auto">
              <table
                aria-labelledby="biases-heading"
                className="w-full border-collapse text-left text-sm"
              >
                <thead>
                  <tr className="border-b border-primary/15 dark:border-text-secondary/25">
                    <th
                      scope="col"
                      className="py-2 pr-4 font-heading font-semibold text-primary dark:text-text-primary"
                    >
                      Denkfehler
                    </th>
                    <th
                      scope="col"
                      className="py-2 pr-4 font-heading font-semibold text-primary dark:text-text-primary"
                    >
                      In einem Satz
                    </th>
                    <th
                      scope="col"
                      className="py-2 font-heading font-semibold text-primary dark:text-text-primary"
                    >
                      Mehr
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {CLEARPATH_BIASES.map((bias) => (
                    <tr
                      key={bias.term}
                      className="border-b border-primary/10 dark:border-text-secondary/15"
                    >
                      <th
                        scope="row"
                        className="py-3 pr-4 align-top font-medium text-primary dark:text-text-primary"
                      >
                        {bias.term}
                        <span className="mt-0.5 block text-xs font-normal text-muted dark:text-text-tertiary">
                          {bias.alias}
                        </span>
                      </th>
                      <td className="py-3 pr-4 align-top leading-relaxed text-primary/80 dark:text-text-secondary">
                        {bias.definition}
                      </td>
                      <td className="py-3 align-top">
                        <a
                          href={bias.wikipediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whitespace-nowrap text-accent transition-colors hover:underline dark:text-accent-bright"
                        >
                          Wikipedia ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <ProductFaq slug={SLUG} items={faqForSlug(SLUG)} />
        </article>

        <ProductDetailNav slug={SLUG} />
      </main>
      <Footer />
    </>
  );
}
