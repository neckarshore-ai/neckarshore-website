import type { Metadata } from "next";
import SubPortal from "@/components/SubPortal";
import { ProductCard } from "@/components/ProductCard";
import { pageMetadata } from "@/lib/seo";
import {
  PORTFOLIO,
  categoryMetaTitle,
  groupItemsByStatus,
} from "@/lib/portfolio";
import { MMP_CARDS } from "@/lib/mmp-cards";

const category = PORTFOLIO.find((c) => c.id === "mmps")!;
const description =
  "Unsere Minimum Marketable Products — schlanke, fokussierte Produkte auf dem Weg zur Marktreife. ClearPath und Snakeoil-Check sind am weitesten.";

export const metadata: Metadata = pageMetadata({
  title: categoryMetaTitle(category),
  description,
  path: category.href,
});

export default function MmpsPage() {
  // Rich MMP cards: the longer description + GitHub link come from MMP_CARDS (server-only),
  // joined by slug. Any item without a rich entry falls back to the compact ProductCard.
  return (
    <SubPortal category={category} description={description}>
      {/* Live first under a sub-header, in-development below — each A→Z (2026-08-06). */}
      {groupItemsByStatus(category.items).map((group, idx, groups) => (
        <div key={group.label}>
          {groups.length > 1 && (
            <p
              className={`${idx === 0 ? "mt-12" : "mt-10"} text-xs font-semibold uppercase tracking-wider text-muted dark:text-text-tertiary`}
            >
              {group.label}
            </p>
          )}
          <div
            className={`${groups.length > 1 ? "mt-3" : "mt-12"} grid gap-4 sm:grid-cols-2`}
          >
            {group.items.map((item) => {
              const rich = MMP_CARDS[item.slug];
              return (
                <ProductCard
                  key={item.slug}
                  item={item}
                  headingLevel="h2"
                  description={rich?.description}
                  repoUrl={rich?.repoUrl}
                  liveUrl={rich?.liveUrl}
                />
              );
            })}
          </div>
        </div>
      ))}
    </SubPortal>
  );
}
