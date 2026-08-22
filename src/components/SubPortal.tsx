import type { ReactNode } from "react";
import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { PageSchema } from "@/components/PageSchema";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { collectionPageSchema } from "@/lib/schema/product";
import { breadcrumbTrailForCategory, type PortfolioCategory } from "@/lib/portfolio";
import { cardDescription } from "@/lib/card-descriptions";

const showOssLaunch = process.env.OSS_LAUNCH_VISIBLE === "true";

/**
 * Shared per-category sub-portal (Server Component). Lists one PORTFOLIO category's
 * items via the shared ProductCard at heading level h2 (page H1 → card h2, no skip —
 * TC-CNT-031). Emits a CollectionPage JSON-LD entity for the listing.
 */
export default function SubPortal({
  category,
  description,
  children,
  wide = false,
}: {
  category: PortfolioCategory;
  description: string;
  /** When provided, replaces the default ProductCard grid (incl. its own grid wrapper). */
  children?: ReactNode;
  /** Widen the main column from 960px to 1200px (for the richer SkillCard grid). */
  wide?: boolean;
}) {
  const collectionName = `${category.title} — neckarshore.ai`;
  const schema = collectionPageSchema({
    name: collectionName,
    description,
    url: `https://neckarshore.ai${category.href}`,
    path: category.href,
  });

  return (
    <>
      <Nav showOssLaunch={showOssLaunch} />
      <PageSchema path={category.href} name={collectionName} primaryEntity={schema} />
      <main
        className={`mx-auto px-4 pt-40 pb-20 md:px-6 ${wide ? "max-w-[1200px]" : "max-w-[960px]"}`}
      >
        <Breadcrumbs trail={breadcrumbTrailForCategory(category)} />

        <header className="max-w-[640px]">
          <p className="font-heading text-sm font-semibold uppercase tracking-wider text-accent dark:text-accent-bright">
            {category.subtitle}
          </p>
          <h1 className="mt-3 font-heading text-4xl font-bold text-primary dark:text-text-primary md:text-5xl">
            {category.title}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
            {description}
          </p>
        </header>

        {children ?? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {category.items.map((item) => (
              <ProductCard
                key={item.slug}
                item={item}
                headingLevel="h2"
                description={cardDescription(item.slug)}
              />
            ))}
          </div>
        )}

        <div className="mt-12 border-t border-primary/5 pt-8 dark:border-text-secondary/10">
          <Link
            href="/products"
            className="text-sm font-medium text-accent transition-colors hover:text-accent-hover dark:text-accent-bright"
          >
            ← Alle Produkte
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
