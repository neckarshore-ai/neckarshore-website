import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { JsonLd } from "@/components/JsonLd";
import { PageSchema } from "@/components/PageSchema";
import { pageMetadata } from "@/lib/seo";
import {
  PORTFOLIO,
  featuredItems,
  groupItemsByStatus,
  hiddenItemCount,
} from "@/lib/portfolio";
import { cardDescription } from "@/lib/card-descriptions";
import { collectionPageSchema } from "@/lib/schema/product";
import { breadcrumbListSchema } from "@/lib/schema/breadcrumb";

const showOssLaunch = process.env.OSS_LAUNCH_VISIBLE === "true";

const PORTAL_DESCRIPTION =
  "Das Produkt-Portfolio von neckarshore.ai — vom Flagship Omnopsis über Minimum Marketable Products und fokussierte Open-Source-Skills bis zu Web-Präsenzen. Made in Germany, DSGVO-by-Design.";

// Short SERP pitch (≤155, audit P2-2). PORTAL_DESCRIPTION stays long for the CollectionPage
// schema description (GEO citation surface). AI-draft → Rauhut-edit.
const META_DESCRIPTION =
  "Das Produkt-Portfolio von neckarshore.ai: Flagship Omnopsis, Minimum Marketable Products, Open-Source-Skills und Web-Präsenzen. Made in Germany, DSGVO.";

export const metadata: Metadata = pageMetadata({
  title: "Produkte — neckarshore.ai",
  description: META_DESCRIPTION,
  path: "/products",
});

const portalSchema = collectionPageSchema({
  name: "Produkte — neckarshore.ai",
  description: PORTAL_DESCRIPTION,
  url: "https://neckarshore.ai/products",
  path: "/products",
});

// Every sub-portal (flagships/mmps/skills/websites) emits a BreadcrumbList; the portal
// itself was the one listing page without one. Trail: Start › Produkte (current = no item).
const breadcrumbSchema = breadcrumbListSchema([
  { name: "Start", href: "/" },
  { name: "Produkte" },
]);

export default function ProductsIndex() {
  return (
    <>
      <Nav showOssLaunch={showOssLaunch} />
      <PageSchema
        path="/products"
        name="Produkte — neckarshore.ai"
        primaryEntity={portalSchema}
      />
      <JsonLd data={breadcrumbSchema} id="schema-breadcrumb-products" />
      <main className="mx-auto max-w-[960px] px-4 pt-40 pb-20 md:px-6">
        <header className="max-w-[640px]">
          <p className="font-heading text-sm font-semibold uppercase tracking-wider text-accent">
            Produkte
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold text-primary dark:text-text-primary md:text-5xl">
            Was wir bauen
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
            Heute ein Flagship, dazu eine Handvoll Minimum Marketable Products,
            fokussierte Open-Source-Skills — und ein paar Web-Präsenzen
            nebenbei. Alle nach derselben Arbeitsweise gebaut: KI-beschleunigt,
            DSGVO-by-Design, Made in Germany.
          </p>
        </header>

        <div className="mt-16 space-y-16">
          {PORTFOLIO.map((category) => {
            const featured = featuredItems(category);
            const hidden = hiddenItemCount(category);
            const tileCount = featured.length + (hidden > 0 ? 1 : 0);
            const balanceTile =
              tileCount % 2 === 1 ? category.balanceTile : undefined;
            return (
              <section
                key={category.id}
                aria-labelledby={`tier-${category.id}`}
              >
                <div className="flex items-baseline gap-3 border-b border-primary/5 pb-3 dark:border-text-secondary/10">
                  <h2
                    id={`tier-${category.id}`}
                    className="scroll-mt-28 font-heading text-2xl font-bold text-primary dark:text-text-primary"
                  >
                    <Link
                      href={category.href}
                      data-track={category.track}
                      className="transition-colors hover:text-accent dark:hover:text-accent-bright"
                    >
                      {category.title}
                    </Link>
                  </h2>
                  <span className="text-sm font-medium text-muted dark:text-text-tertiary">
                    {category.subtitle}
                  </span>
                </div>

                <p className="mt-4 max-w-[640px] text-[15px] leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
                  {category.intro}
                </p>

                {/* Live products lead under their own sub-header, in-development follow —
                    each A→Z (Founder decision 2026-08-06). Sub-header only when a tier has
                    both groups; the +N/balance tiles stay in the LAST group's grid. */}
                {groupItemsByStatus(featured).map((group, idx, groups) => (
                  <div key={group.label}>
                    {groups.length > 1 && (
                      <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted dark:text-text-tertiary">
                        {group.label}
                      </p>
                    )}
                    <div
                      className={`${groups.length > 1 ? "mt-3" : "mt-6"} grid gap-4 sm:grid-cols-2`}
                    >
                      {group.items.map((item) => (
                        <ProductCard
                          key={item.slug}
                          item={item}
                          headingLevel="h3"
                          description={cardDescription(item.slug)}
                        />
                      ))}
                      {idx === groups.length - 1 && hidden > 0 && (
                        <Link
                          href={category.href}
                          data-track={`${category.track}_more`}
                          aria-label={`Alle ${category.title} ansehen (${hidden} ${hidden === 1 ? "weiteres" : "weitere"})`}
                          className="group flex flex-col items-start justify-center rounded-xl border border-dashed border-primary/20 px-6 py-5 transition-colors hover:border-accent hover:bg-accent/5 dark:border-text-secondary/20 dark:hover:border-accent-bright dark:hover:bg-accent-bright/5"
                        >
                          <span className="text-sm font-medium text-muted dark:text-text-tertiary">
                            +{hidden} {hidden === 1 ? "weiteres" : "weitere"}
                          </span>
                          <span className="mt-1 font-heading text-base font-semibold text-accent transition-colors group-hover:text-accent-hover dark:text-accent-bright">
                            Alle {category.title} ansehen →
                          </span>
                        </Link>
                      )}
                      {idx === groups.length - 1 && balanceTile && (
                        <Link
                          href={category.href}
                          data-track={`${category.track}_balance`}
                          aria-label={`Mehr über unsere ${category.title} erfahren`}
                          className="group hidden flex-col items-start justify-center rounded-xl border border-dashed border-primary/20 px-6 py-5 transition-colors hover:border-accent hover:bg-accent/5 sm:flex dark:border-text-secondary/20 dark:hover:border-accent-bright dark:hover:bg-accent-bright/5"
                        >
                          <span className="text-sm font-medium text-muted dark:text-text-tertiary">
                            {balanceTile.eyebrow}
                          </span>
                          <span className="mt-1 text-[15px] leading-relaxed text-neutral-dark/70 dark:text-text-secondary/80">
                            {balanceTile.line}
                          </span>
                          <span className="mt-2 font-heading text-base font-semibold text-accent transition-colors group-hover:text-accent-hover dark:text-accent-bright">
                            {balanceTile.cta} →
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
