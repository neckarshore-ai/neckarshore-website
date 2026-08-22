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
import { breadcrumbTrailForSlug, getItemBySlug } from "@/lib/portfolio";
import { getProductEntry } from "@/lib/content/products";
import { faqForSlug } from "@/lib/product-faqs";
import {
  liveSoftwareApplicationSchema,
  previewSoftwareApplicationSchema,
} from "@/lib/schema/product";

const showOssLaunch = process.env.OSS_LAUNCH_VISIBLE === "true";

/**
 * Shared MMP detail page — renders a PREVIEW page (in development, no public app) OR a LIVE
 * page, switched on the presence of `liveUrl` in the product frontmatter (AP-1: one flag, all
 * effects). Used by snakeoil-check (live), phonesis / local-seo-hub / prod-or-pretend (preview).
 *
 * Extracted at the 3rd wrapper per rule-of-three; behaviour-preserving. Each MMP page is a
 * ~12-line wrapper: a SLUG, the bespoke SEO title, and (optionally) a CTA noun + live-CTA note.
 *
 * PREVIEW posture (no `liveUrl`, by design):
 *  - `previewSoftwareApplicationSchema` (no `url`, no `offers`) — emitting a live URL or a free
 *    Offer for a product that is neither would be a false structured-data claim (AD-19, fail-closed).
 *  - `robots: noindex` when the portfolio item carries `noindex` — held out of index + sitemap.
 *  - No "Live ausprobieren" link (there is no public app); the CTA is a discovery call.
 *
 * LIVE posture (`liveUrl` set in frontmatter):
 *  - `liveSoftwareApplicationSchema` — emits the live `url` but OMITS `offers`/free claims, since
 *    these MMPs are freemium/paid, not free (the free Offer stays exclusive to genuinely-free apps
 *    like ClearPath's bespoke page). AD-19 fail-closed preserved.
 *  - "Live ausprobieren →" CTA to the live app + an honest, product-specific `liveCtaNote`.
 *  - Indexable once `noindex` is also dropped on the portfolio item.
 */

/** Shared `generateMetadata` for an MMP detail page (preview or live). `title` is the bespoke SEO `<title>`. */
export function productDetailMetadata({
  slug,
  title,
}: {
  slug: string;
  title: string;
}): Metadata {
  const entry = getProductEntry(slug);
  if (!entry) return {};
  // Single source of truth: robots derives from the portfolio `noindex` flag, so dropping
  // `noindex` on a preview item flips robots-meta, sitemap inclusion AND the FAQPage-schema
  // gate together (AP-1: one flag, all effects). No dual-gate footgun.
  const noindex = getItemBySlug(slug)?.noindex ?? false;
  return {
    ...pageMetadata({
      title,
      description: entry.metaDescription ?? entry.definition,
      path: `/products/${slug}`,
      image: productOgImage(slug),
    }),
    robots: { index: !noindex, follow: true },
  };
}

interface ProductDetailPageProps {
  slug: string;
  /** Discovery-CTA noun (preview state). Defaults to the product name; Phonesis uses a short form. */
  ctaName?: string;
  /** Live state: an honest, product-specific subline under the "Live ausprobieren →" CTA. */
  liveCtaNote?: string;
  /**
   * Optional product visual (screenshot, diagram), rendered between the CTA block and the
   * Markdown body. A slot rather than a frontmatter field: the media is page-specific JSX
   * (its own caption, its own zoom behaviour), and the content `.md` stays exportable plain
   * Markdown — the export pipeline must not have to reason about React.
   */
  media?: React.ReactNode;
}

export default function ProductDetailPage({
  slug,
  ctaName,
  liveCtaNote,
  media,
}: ProductDetailPageProps) {
  const entry = getProductEntry(slug);
  if (!entry) notFound();
  const cta = ctaName ?? entry.name;
  const liveUrl = entry.liveUrl;
  const path = `/products/${slug}`;
  const softwareSchema = liveUrl
    ? liveSoftwareApplicationSchema({
        name: entry.name,
        definition: entry.definition,
        liveUrl,
        applicationCategory: entry.applicationCategory,
        path,
      })
    : previewSoftwareApplicationSchema({
        name: entry.name,
        definition: entry.definition,
        applicationCategory: entry.applicationCategory,
        path,
      });

  return (
    <>
      <Nav showOssLaunch={showOssLaunch} />
      <PageSchema path={path} name={entry.name} primaryEntity={softwareSchema} />
      <main className="mx-auto max-w-[760px] px-4 pt-40 pb-20 md:px-6">
        <Breadcrumbs trail={breadcrumbTrailForSlug(slug)} />

        <article>
          <div className="mb-4 flex justify-end">
            <ExportButton path={`/products/${slug}`} />
          </div>
          <header className="mb-6">
            <h1 className="font-heading text-4xl font-bold text-accent md:text-5xl">
              {entry.headline}
            </h1>
          </header>

          <p className="text-xl leading-relaxed text-primary/90 dark:text-text-primary">
            {entry.definition}
          </p>

          {liveUrl ? (
            <div className="mt-8">
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-track={`product_live_cta_${slug}`}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition-all duration-150 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
              >
                Live ausprobieren →
              </a>
              {liveCtaNote && (
                <p className="mt-3 text-sm text-muted dark:text-text-tertiary">
                  {liveCtaNote}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1.5 text-sm font-medium text-muted dark:bg-text-secondary/10 dark:text-text-tertiary">
                <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
                In Entwicklung
              </div>

              <div className="mt-8">
                <a
                  href="https://calendly.com/rauhut/20min"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track={`product_detail_cta_${slug}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition-all duration-150 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
                >
                  Über {cta} sprechen →
                </a>
                <p className="mt-3 text-sm text-muted dark:text-text-tertiary">
                  Kurzes Gespräch, 20 Minuten — unverbindlich.
                </p>
              </div>
            </>
          )}

          {media && <div className="mt-10">{media}</div>}

          <div className="mt-10">
            <Prose html={entry.bodyHtml} />
          </div>

          <ProductFaq slug={slug} items={faqForSlug(slug)} />
        </article>

        <ProductDetailNav slug={slug} />
      </main>
      <Footer />
    </>
  );
}
