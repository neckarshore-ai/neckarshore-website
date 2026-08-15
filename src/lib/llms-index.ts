/**
 * `llms.txt` builder — the curated INDEX for AI readers (llmstxt.org).
 *
 * WHY THIS FILE EXISTS: until 2026-08-15 the index was a hand-written static file
 * (`public/llms.txt`). It carried a product list, a test-count claim and a pricing
 * claim that the rendered site had already moved past — two hand-written
 * representations of the same facts with no mechanism between them (backlog #514,
 * class: "a hand-refreshed representation of a fact that moved"). Everything that
 * CAN be derived is now derived:
 *
 *   - the product tree comes from `PORTFOLIO` (same source as /products, the nav
 *     dropdown and the sitemap) → a new product appears here with no edit;
 *   - the audited test figure comes from `public/stats.json` → the same artifact the
 *     Tests tile renders, including its `floor` "+" semantics;
 *   - the date comes from `SITE_UPDATED`.
 *
 * WHAT STAYS HAND-WRITTEN: the prose blocks below (About, Founder, Services,
 * Differentiators, Contact). They mirror page copy and have no machine source, so
 * `tests/unit/llms-claims.test.ts` guards the NAMED claims that went stale before.
 * That guard is honest about its scope: named claims only, not the class.
 *
 * LANGUAGE: the framing prose is English (AI readers of a DACH company site arrive in
 * both languages); the per-product taglines are the German originals from `PORTFOLIO`
 * rather than a second, hand-maintained English copy that would drift. Mixed on
 * purpose — a translated duplicate is exactly the defect this file removes.
 *
 * Build-time only: the route is `force-static`, so the `readFileSync` below runs at
 * build and the result is served as a static CDN asset.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  PORTFOLIO,
  statusPillLabel,
  type PortfolioCategory,
  type PortfolioItem,
} from "@/lib/portfolio";
import { SITE_UPDATED, SITE_URL } from "@/lib/site-config";

/**
 * The audited estate-wide test figure, read from the same artifact the Tests tile
 * renders (`public/stats.json` → `testScope.total`, falling back to the flat scalar).
 * The trailing "+" is load-bearing and carries `floor`: the exact figure still
 * UNDER-states the true count, so it is a floor, not a ceiling (StatsGrid.tsx).
 *
 * Digits are written plain (`3391+`), not de-DE grouped (`3.391+`): a machine reader
 * can parse a German thousands dot as a decimal point, and this file's entire audience
 * is machine readers.
 */
function readAuditedTestFigure(): string {
  const raw = readFileSync(join(process.cwd(), "public", "stats.json"), "utf8");
  const stats = JSON.parse(raw) as {
    tests?: number;
    testScope?: { total?: number; floor?: boolean };
  };
  const total = stats.testScope?.total ?? stats.tests;
  if (typeof total !== "number" || !Number.isFinite(total)) {
    throw new Error("llms.txt: no usable test total in public/stats.json");
  }
  return `${total}${stats.testScope?.floor ? "+" : ""}`;
}

/** Absolute URL for a portfolio item: case study > internal detail > external live site. */
function itemUrl(item: PortfolioItem): string {
  if (item.caseStudySlug) {
    return `${SITE_URL}/products/websites/${item.caseStudySlug}`;
  }
  return item.isExternal ? item.href : `${SITE_URL}${item.href}`;
}

/**
 * One tier block. Items held out of the sitemap (`noindex` preview skeletons) are held
 * out here too — the index must not promise a page the site declines to index.
 * Non-live items carry their honest status label, so a pre-launch flagship is not
 * silently listed as if it shipped.
 */
function renderCategory(category: PortfolioCategory): string {
  const lines = category.items
    .filter((item) => !item.noindex)
    .map((item) => {
      const status = statusPillLabel(item);
      const statusSuffix = status && status !== "Live" ? ` [${status}]` : "";
      return `- ${item.name}${statusSuffix} — ${item.tagline} ${itemUrl(item)}`;
    });

  return [`### ${category.title} — ${category.subtitle}`, category.intro, "", ...lines].join(
    "\n",
  );
}

export function buildLlmsIndexText(): string {
  const tests = readAuditedTestFigure();

  return `# Neckarshore AI

> Stuttgart-basiertes KI-Dokumentations- und Nearshore-Softwareentwicklungsunternehmen. Gründer: German Rauhut (Ex-Mercedes-Benz IT). Website: neckarshore.ai.

Last updated: ${SITE_UPDATED}
Full content for AI ingestion (all product pages inlined in one file): ${SITE_URL}/llms-full.txt

## About

Neckarshore AI (neckarshore.ai) is a nearshore AI and software development partner based in Stuttgart, Germany. We help mid-sized companies in the DACH region build software faster and more reliably — combining German engineering precision with modern AI acceleration. Same timezone, same language, same data protection standards (DSGVO by default).

## Founder

German Rauhut — former Mercedes-Benz IT, now founder of Neckarshore AI in Stuttgart.

## Flagship Product

Omnopsis Documentor+X — an AI-first documentation engine that generates compliance docs, technical documentation and persona-aware chatbot answers from Git, Jira and Confluence. BYOLLM (Bring Your Own LLM), fail-closed architecture, European hosting. In development, launch planned for Q3 2026.

## Products

neckarshore.ai builds across four tiers: flagships, MMPs (Minimum Marketable Products), focused open-source skills, and client/own websites. Product names, one-liners and status below are generated from the same source as the site's own product pages. Full tree: ${SITE_URL}/products

${PORTFOLIO.map(renderCategory).join("\n\n")}

## Services

1. AI-Powered Development — NestJS, TypeScript, PostgreSQL production stack
2. Documentation Automation — Omnopsis Documentor+X
3. AI Consulting & Strategy — LLM selection, automation assessment
4. DSGVO-by-Design — BYOLLM, tenant isolation, German hosting
5. Quality Engineering — ${tests} automated tests across the estate (audited, floor figure), OWASP LLM Top 10, EU AI Act
6. Nearshore Partnership — team extension, remote-first, scalable

## Key Differentiators

- vs. Offshore: same timezone, same language, DSGVO-compliant by default
- vs. Big-4: significantly more cost-effective at comparable quality; direct access to engineers instead of a junior-heavy bench model. Concrete pricing is discussed in the 20-minute intro call.
- vs. Freelancers: structured processes, full project ownership, delivery that does not depend on a single person

## Contact

- Website: ${SITE_URL}
- Email: info@neckarshore.ai
- Location: Stuttgart, Germany
- Booking: https://calendly.com/rauhut/20min
`;
}
