import { Fragment } from "react";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbListSchema, type BreadcrumbCrumb } from "@/lib/schema/breadcrumb";

/**
 * Shared top breadcrumb trail for product detail + sub-portal pages.
 *
 * Replaces the seven hand-rolled `<nav aria-label="Brotkrumen">` blocks that drifted
 * across the product pages, and — for the first time — emits a `BreadcrumbList`
 * JSON-LD entity alongside the visual trail (one source: the `trail` array, so the
 * schema and the UI can never diverge). Server Component: the JSON-LD lands in the
 * SSR HTML where crawlers read it (AD-19), via the native-`<script>` `<JsonLd>` helper.
 *
 * The current page is the last crumb (no `href`): rendered as muted text with
 * `aria-current="page"`, and omitted from the schema's `item` URL.
 */
export function Breadcrumbs({ trail }: { trail: BreadcrumbCrumb[] }) {
  return (
    <>
      <JsonLd data={breadcrumbListSchema(trail)} id="schema-breadcrumb" />
      <nav
        aria-label="Brotkrumen"
        className="mb-8 text-sm text-muted dark:text-text-tertiary"
      >
        {trail.map((crumb, index) => (
          <Fragment key={`${crumb.name}-${index}`}>
            {index > 0 && (
              <span className="mx-2" aria-hidden="true">
                ›
              </span>
            )}
            {crumb.href ? (
              <Link href={crumb.href} className="transition-colors hover:text-accent">
                {crumb.name}
              </Link>
            ) : (
              <span
                aria-current="page"
                className="text-primary/70 dark:text-text-secondary"
              >
                {crumb.name}
              </span>
            )}
          </Fragment>
        ))}
      </nav>
    </>
  );
}
