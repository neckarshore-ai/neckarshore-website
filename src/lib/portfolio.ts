/**
 * Portfolio — single source of truth for the neckarshore.ai product tree.
 *
 * PURE DATA. No `node:fs`, no markdown imports, no server-only code: this module is
 * imported by the client component `Nav.tsx` AS WELL AS server components (the /products
 * portal, the sub-portals, the [slug] detail route, the sitemap). Anything fs-touching
 * here would break the client build. The markdown content-collection (lib/content/*) is a
 * separate, server-only system — a skeleton item graduates to a content-collection page
 * when real copy lands (Schritt 2).
 *
 * The tree mirrors the real GitHub org split (verified live 2026-06-17):
 *   flagships → omnopsis-ai · mmps → neckarshore-mmps · skills → neckarshore-skills
 *   websites  → neckarshore-websites
 *
 * Adding a product = ONE entry here (AP-1, "add a product = 1 edit"). Nav, portal,
 * sub-portals, the dynamic detail route, and the sitemap all derive from PORTFOLIO.
 *
 * PORTAL TEASER vs SUB-PORTAL (2026-06-18): the /products portal shows only the
 * `featured` Top-N per category + a "mehr" tile into the sub-portal; the sub-portal
 * lists the FULL category. Within a category, featured items lead (in their declared
 * order = Founder's Top-N), the remainder follows A→Z.
 */

import type { BreadcrumbCrumb } from "@/lib/schema/breadcrumb";

export type ProductStatus = "live" | "preview" | "external";
export type ProductSchemaType = "SoftwareApplication" | "none";
export type CategoryId = "flagships" | "mmps" | "skills" | "websites";

export interface PortfolioItem {
  /** Human-facing name (card heading + detail H1). */
  name: string;
  /** URL slug under /products/<slug>. Ignored for external items. */
  slug: string;
  /** Placeholder one-liner — refined in the content pass (Schritt 2). */
  tagline: string;
  status: ProductStatus;
  /**
   * Override for the bottom-left status pill label. Use ONLY when the derived label
   * (from `status`) would be dishonest — e.g. omnopsis carries a flagship `status: "live"`
   * but is pre-launch ("In Entwicklung · Launch geplant Q3 2026" on its page), so the pill must say
   * "In Entwicklung", not "Live". Most items omit this and let `statusPillLabel` derive it.
   */
  statusLabel?: string;
  /** Top-N teaser flag: shown on the /products portal; non-featured live on the sub-portal only. */
  featured?: boolean;
  /** Link target: internal "/products/<slug>" OR an external "https://…". */
  href: string;
  /** external → renders target=_blank, no detail page, excluded from sitemap + generateStaticParams. */
  isExternal: boolean;
  /** "SoftwareApplication" emits a preview JSON-LD entity on the detail page; "none" = no schema. */
  schemaType: ProductSchemaType;
  /** schema.org applicationCategory for the SoftwareApplication node. */
  applicationCategory?: string;
  /** preview skeletons → robots noindex + held out of the sitemap until content lands. */
  noindex?: boolean;
  /** true for omnopsis/clearpath: they own bespoke static pages → excluded from [slug] generateStaticParams. */
  hasOwnPage?: boolean;
  /**
   * Websites tier only: when set, an internal case-study page exists at
   * /products/websites/<caseStudySlug>. The card then links its title/CTA to that
   * internal page and shows a separate "Website ↗" button to `liveUrl`. `isExternal`
   * stays true (the live site IS external) → the flat /products/<slug> route still
   * 404s and the [slug] skeleton route still skips it; only the card + the dedicated
   * /products/websites/[slug] route + the sitemap read this field.
   */
  caseStudySlug?: string;
  /** Websites tier: the live external domain (the card's "Website ↗" button + the case-study CTA). */
  liveUrl?: string;
}

export interface PortfolioCategory {
  id: CategoryId;
  /** Section heading + sub-portal H1. */
  title: string;
  /**
   * Optional keyword-rich SEO <title> for the sub-portal page (used by `categoryMetaTitle`).
   * The bare `title` ("Flagships") is a weak SERP signal; this carries the search keywords.
   * Must stay ≤70 chars incl. the brand suffix (TC-SEO-027). When absent, the page falls
   * back to `${title} — neckarshore.ai`. AI-draft → Founder-edit.
   */
  metaTitle?: string;
  /** Dropdown sub-label / portal section subtitle. */
  subtitle: string;
  /** Short framing shown on the /products portal between the heading and the cards. */
  intro: string;
  /** Nav dropdown label. */
  navLabel: string;
  /** Sub-portal route, "/products/<id>". */
  href: string;
  /** Analytics key prefix. */
  track: string;
  /**
   * Optional balance/teaser tile for the /products portal. Rendered (desktop + tablet
   * only — `hidden sm:flex`) when the category's tile count is ODD, i.e. a lone card
   * would sit on the 2-col grid. Auto-hides once the category gains a real card or a
   * "+N weitere" tile (even count). Honest copy lives here, not in the JSX.
   */
  balanceTile?: { eyebrow: string; line: string; cta: string };
  items: PortfolioItem[];
}

export const PORTFOLIO: PortfolioCategory[] = [
  {
    id: "flagships",
    title: "Flagships",
    metaTitle: "Flagships — KI-Software made in Germany | neckarshore.ai",
    subtitle: "Unsere Hauptprodukte",
    intro:
      "Produkte, die einen Markt gewinnen sollen. Omnopsis ist das erste — weitere folgen.",
    navLabel: "Flagships",
    href: "/products/flagships",
    track: "nav_products_flagships",
    // Balance tile: Flagships has a single card today → fills the lone-card gap on
    // the 2-col portal grid (desktop/tablet). Auto-hides when a 2nd flagship lands.
    balanceTile: {
      eyebrow: "Weitere folgen",
      line: "Omnopsis ist das erste Flaggschiff.",
      cta: "Mehr erfahren",
    },
    items: [
      {
        name: "Omnopsis Documentor+X",
        slug: "omnopsis",
        tagline: "KI-first Documentation Engine für Engineering-Teams — fail-closed, BYOLLM, DSGVO-by-Design.",
        status: "live",
        // Pre-launch (Launch geplant Q3 2026) — the card pill must match the page, not the flagship status flag.
        statusLabel: "In Entwicklung",
        featured: true,
        href: "/products/omnopsis",
        isExternal: false,
        schemaType: "SoftwareApplication",
        applicationCategory: "BusinessApplication",
        hasOwnPage: true,
      },
    ],
  },
  {
    id: "mmps",
    title: "MMPs",
    metaTitle: "MMPs — fokussierte KI-Tools & Web-Apps | neckarshore.ai",
    subtitle: "Minimum Marketable Products",
    intro:
      "Marktreife Produkte mit klarem Fokus — jedes löst ein konkretes Problem. Schlägt eines durch, wird es zum Hauptprodukt.",
    navLabel: "MMPs",
    href: "/products/mmps",
    track: "nav_products_mmps",
    // Featured Top-3 (ClearPath · Snakeoil-Check · Phonesis) lead; remainder A→Z.
    items: [
      {
        name: "ClearPath",
        slug: "clearpath",
        tagline: "Eine mentale Firewall gegen kognitive Verzerrungen.",
        status: "live",
        featured: true,
        href: "/products/clearpath",
        isExternal: false,
        schemaType: "SoftwareApplication",
        applicationCategory: "BusinessApplication",
        hasOwnPage: true,
      },
      {
        name: "Snakeoil-Check",
        slug: "snakeoil-check",
        tagline: "Neutraler KI-Reality-Check für Online-Coachings und High-Ticket-Angebote.",
        status: "live",
        featured: true,
        href: "/products/snakeoil-check",
        isExternal: false,
        schemaType: "SoftwareApplication",
        applicationCategory: "BusinessApplication",
        // LIVE since 2026-06-27 at snakeoil.neckarshore.ai. Bespoke detail page
        // (src/app/products/snakeoil-check, via the shared ProductDetailPage live branch) →
        // excluded from the [slug] skeleton route. Indexable; emits liveSoftwareApplicationSchema
        // (live url, NO free Offer — freemium, AD-19 fail-closed).
        hasOwnPage: true,
      },
      {
        name: "Phonesis Voicebank",
        slug: "phonesis",
        tagline: "Ein Archiv echter menschlicher Stimmen für den deutschen Markt.",
        status: "preview",
        featured: true,
        href: "/products/phonesis",
        isExternal: false,
        schemaType: "SoftwareApplication",
        applicationCategory: "MultimediaApplication",
        // Bespoke preview detail page (src/app/products/phonesis) → excluded from the [slug]
        // skeleton route. Indexable since 2026-06-22; emits the honest preview schema
        // (no url/offers) until the public site launches.
        hasOwnPage: true,
      },
      {
        name: "Local-SEO-Hub",
        slug: "local-seo-hub",
        tagline: "AI-first Sichtbarkeits-Plattform für lokale Unternehmen — Rankings, Reviews, Citations in einem Score.",
        status: "preview",
        href: "/products/local-seo-hub",
        isExternal: false,
        schemaType: "SoftwareApplication",
        applicationCategory: "BusinessApplication",
        // Bespoke preview detail page (src/app/products/local-seo-hub) → excluded from the
        // [slug] skeleton route. Indexable since 2026-06-22 (rich content shipped); the page
        // emits the honest preview schema (no url/offers) until the public app launches.
        hasOwnPage: true,
      },
      {
        name: "Prod-or-Pretend",
        slug: "prod-or-pretend",
        tagline: "Ein Qualitäts-Spiegel für Tech-Hype — prüft „an-einem-Wochenende-gebaut\"-Claims gegen echte Produktionsstandards.",
        status: "preview",
        href: "/products/prod-or-pretend",
        isExternal: false,
        schemaType: "SoftwareApplication",
        applicationCategory: "BusinessApplication",
        // Bespoke preview detail page (src/app/products/prod-or-pretend) → excluded from the
        // [slug] skeleton route. Indexable since 2026-06-22; emits the honest preview schema
        // (no url/offers) until the public launch.
        hasOwnPage: true,
      },
      {
        name: "TrustScope",
        slug: "trustscope",
        tagline: "Deterministischer Vier-Säulen-Trust-Report für öffentliche GitHub-Repos — Sicherheit, Governance, Community.",
        status: "live",
        href: "/products/trustscope",
        isExternal: false,
        schemaType: "SoftwareApplication",
        applicationCategory: "DeveloperApplication",
        // LIVE at trustscope.neckarshore.ai — the only PUBLIC-repo (MIT) MMP. Detail page via the
        // shared ProductDetailPage live branch → excluded from the [slug] skeleton route. Indexable;
        // emits liveSoftwareApplicationSchema (live url, NO Offer — the shared live branch stays
        // offer-free; genuinely free but not claimed as a schema Offer, AD-19 fail-closed).
        hasOwnPage: true,
      },
    ],
  },
  {
    id: "skills",
    title: "Skills",
    // No "Open-Source" in the SEO title on purpose: the category is mixed (OVA / IMAP /
    // AI-Phrase-Check are public OSS, but Social-Scrapers + Restaurant-Menüpflege are
    // private), so an "Open-Source" headline would over-claim. (The existing subtitle/intro
    // still say "Open-Source-Werkzeuge" — flagged for Founder copy-redaction, not changed here.)
    metaTitle: "Claude Code & Obsidian Skills | neckarshore.ai",
    subtitle: "Fokussierte Open-Source-Werkzeuge",
    intro:
      "Kleine, scharf geschnittene Open-Source-Werkzeuge — die Tools, die wir selbst täglich benutzen. Jetzt auch für euch.",
    navLabel: "Skills",
    href: "/products/skills",
    track: "nav_products_skills",
    // Featured Top-3 (Obsidian Vault Autopilot · Social Scrapers · IMAP Mailbox Cleanup) lead; remainder A→Z.
    items: [
      {
        name: "Obsidian Vault Autopilot",
        slug: "obsidian-vault-autopilot",
        tagline: "Open-Source-Automatisierung für Wissens-Vaults in Obsidian — sortiert, benennt, taggt und reichert Notizen an.",
        status: "live",
        featured: true,
        href: "/products/obsidian-vault-autopilot",
        isExternal: false,
        schemaType: "SoftwareApplication",
        applicationCategory: "DeveloperApplication",
        // Bespoke own page (src/app/products/obsidian-vault-autopilot) → excluded from the
        // [slug] skeleton + indexable (no noindex): the first skills detail page with real
        // SEO/GEO content sourced from the repo README.
        hasOwnPage: true,
      },
      {
        name: "Social Scrapers",
        slug: "social-scrapers",
        tagline: "Obsidian-Skills für Instagram-, LinkedIn- und X-Profile — neutrale Markdown-Briefings statt Engagement-Bait.",
        status: "preview",
        featured: true,
        href: "/products/social-scrapers",
        isExternal: false,
        schemaType: "SoftwareApplication",
        applicationCategory: "UtilitiesApplication",
        // Bespoke indexable detail page (src/app/products/social-scrapers) → excluded from the
        // [slug] skeleton route, enters the sitemap. The skills are privately developed (repos NOT
        // public), so the page stays indexable as a content/GEO surface — NOT as a free download:
        // the SoftwareApplication schema is honest (no free Offer / MIT / public-repo url).
        hasOwnPage: true,
      },
      {
        name: "IMAP Mailbox Cleanup",
        slug: "imap-mailbox-cleanup",
        tagline: "Hybrid CLI + Claude-Skill für IONOS-IMAP-Postfach-Triage — dry-run by default, audit-logged.",
        status: "preview",
        featured: true,
        href: "/products/imap-mailbox-cleanup",
        isExternal: false,
        schemaType: "SoftwareApplication",
        applicationCategory: "UtilitiesApplication",
        // Bespoke indexable detail page (src/app/products/imap-mailbox-cleanup) → excluded from
        // the [slug] skeleton route, enters the sitemap. Public MIT OSS, so NOT noindex; the
        // page emits SoftwareApplication (real url + free Offer) + FAQPage.
        hasOwnPage: true,
      },
      {
        name: "AI Phrase Check",
        slug: "ai-phrase-check",
        tagline: "Erkennt KI-typische Floskeln in deutschem und englischem Text.",
        status: "preview",
        href: "/products/ai-phrase-check",
        isExternal: false,
        schemaType: "SoftwareApplication",
        applicationCategory: "DeveloperApplication",
        // Bespoke indexable detail page (src/app/products/ai-phrase-check) → excluded from the
        // [slug] skeleton route, enters the sitemap. Real public MIT OSS skill (like OVA), so
        // NOT noindex; the page emits SoftwareApplication (real url + free Offer) + FAQPage.
        hasOwnPage: true,
      },
      {
        name: "Restaurant-Menüpflege",
        slug: "restaurant-menu-update",
        tagline:
          "Wöchentliches Menü-Update als geprüfter, reproduzierbarer Vorgang — inkl. Allergen-Validierung (LMIV/ZZulV).",
        status: "preview",
        href: "/products/restaurant-menu-update",
        isExternal: false,
        schemaType: "SoftwareApplication",
        applicationCategory: "DeveloperApplication",
        // Bespoke detail page (src/app/products/restaurant-menu-update) → excluded from the
        // [slug] route. PRIVATE, genericized client skill: KEEPS noindex (held out of the
        // sitemap, no public repo) even though a real page now exists — `hasOwnPage` drives
        // the link, `noindex` drives robots/sitemap. The two are deliberately decoupled here.
        noindex: true,
        hasOwnPage: true,
      },
    ],
  },
  {
    id: "websites",
    title: "Websites",
    metaTitle: "Web-Projekte & Case Studies aus Stuttgart | neckarshore.ai",
    subtitle: "Web-Präsenz & Kundenprojekte",
    intro:
      "Echte Kundenprojekte, nebenbei entstanden — dieselbe Bauweise wie alles andere: KI-beschleunigt, DSGVO-by-Design.",
    navLabel: "Websites",
    href: "/products/websites",
    track: "nav_products_websites",
    // Featured Top-3 (neckarshore.ai · Ristorante Goldoni · Oakwood Golf Club) lead; remainder A→Z.
    items: [
      {
        name: "neckarshore.ai",
        slug: "neckarshore",
        tagline: "Diese Seite — KI-beschleunigt gebaut, DSGVO-by-Design.",
        status: "external",
        featured: true,
        href: "https://neckarshore.ai",
        isExternal: true,
        schemaType: "none",
        caseStudySlug: "neckarshore",
        liveUrl: "https://neckarshore.ai",
      },
      {
        name: "ristorante-goldoni.de",
        slug: "ristorante-goldoni",
        tagline: "Web-Präsenz für ein italienisches Restaurant.",
        status: "external",
        featured: true,
        href: "https://ristorante-goldoni.de",
        isExternal: true,
        schemaType: "none",
        caseStudySlug: "ristorante-goldoni",
        liveUrl: "https://ristorante-goldoni.de",
      },
      {
        name: "oakwoodgolfclub.de",
        slug: "oakwood-golf-club",
        tagline: "Web-Präsenz für einen Golfclub — Mitglieder-Portal in Arbeit.",
        status: "external",
        featured: true,
        href: "https://oakwoodgolfclub.de",
        isExternal: true,
        schemaType: "none",
        caseStudySlug: "oakwood-golf-club",
        liveUrl: "https://oakwoodgolfclub.de",
      },
      {
        name: "rauhut.com",
        slug: "rauhut",
        tagline: "Persönliche Web-Präsenz.",
        status: "external",
        href: "https://rauhut.com",
        isExternal: true,
        schemaType: "none",
        caseStudySlug: "rauhut",
        liveUrl: "https://rauhut.com",
      },
    ],
  },
];

/** All categories, in nav/portal order. */
export function allCategories(): PortfolioCategory[] {
  return PORTFOLIO;
}

/**
 * SEO <title> for a category sub-portal page: the keyword-rich `metaTitle` override when
 * set, else the bare-name fallback `${title} — neckarshore.ai`. One source so the four
 * sub-portal pages can't drift from each other.
 */
export function categoryMetaTitle(category: PortfolioCategory): string {
  return category.metaTitle ?? `${category.title} — neckarshore.ai`;
}

/** Flat list of all items across every category. */
export function allItems(): PortfolioItem[] {
  return PORTFOLIO.flatMap((c) => c.items);
}

/** Teaser items for the /products portal: the featured Top-N of a category. */
export function featuredItems(category: PortfolioCategory): PortfolioItem[] {
  return category.items.filter((i) => i.featured);
}

/** Count of a category's items not shown on the portal teaser (live on the sub-portal). */
export function hiddenItemCount(category: PortfolioCategory): number {
  return category.items.length - featuredItems(category).length;
}

/** Slugs that the dynamic [slug] route owns: internal, non-bespoke skeletons. */
export function allInternalDetailSlugs(): string[] {
  return allItems()
    .filter((i) => !i.isExternal && !i.hasOwnPage)
    .map((i) => i.slug);
}

/** Look up an item by its slug (across all categories). */
export function getItemBySlug(slug: string): PortfolioItem | undefined {
  return allItems().find((i) => i.slug === slug);
}

/**
 * The bottom-left status-pill label for a product/website card (unified card principle).
 * Honest per item: `statusLabel` override wins (e.g. omnopsis = "In Entwicklung"), else
 * derived from `status` — live/external sites are "Live", previews are "In Entwicklung".
 */
export function statusPillLabel(item: PortfolioItem): string {
  if (item.statusLabel) return item.statusLabel;
  switch (item.status) {
    case "preview":
      return "In Entwicklung";
    case "live":
    case "external":
      return "Live";
    default:
      return "";
  }
}

/**
 * Websites-tier items that have an internal case-study page, by their case-study slug.
 * Feeds generateStaticParams for the /products/websites/[slug] route.
 */
export function websiteCaseStudySlugs(): string[] {
  return allItems()
    .filter((i) => i.caseStudySlug)
    .map((i) => i.caseStudySlug!);
}

/** Look up a website item by its case-study slug. */
export function getWebsiteItemByCaseStudySlug(
  caseStudySlug: string,
): PortfolioItem | undefined {
  return allItems().find((i) => i.caseStudySlug === caseStudySlug);
}

/**
 * Indexable product routes for the sitemap: /products, the 4 sub-portals, the
 * bespoke own-page details (omnopsis, clearpath), and the website case studies
 * (/products/websites/<caseStudySlug>). Excludes external live sites and noindex
 * preview skeletons (held out until content lands).
 */
export function allProductRoutes(): string[] {
  const subPortals = PORTFOLIO.map((c) => c.href);
  const indexableDetails = allItems()
    .filter((i) => !i.isExternal && !i.noindex)
    .map((i) => i.href);
  const caseStudies = websiteCaseStudySlugs().map(
    (slug) => `/products/websites/${slug}`,
  );
  return ["/products", ...subPortals, ...indexableDetails, ...caseStudies];
}

/** The category that owns a slug (the slug lives in exactly one category). */
export function categoryForSlug(slug: string): PortfolioCategory | undefined {
  return PORTFOLIO.find((c) => c.items.some((i) => i.slug === slug));
}

/**
 * Full 4-level breadcrumb trail for a product DETAIL page:
 *   Start › Produkte › <Kategorie> › <Item>
 * The last crumb (the item) carries no href = the current page.
 */
export function breadcrumbTrailForSlug(
  slug: string,
  /** Override the leaf label (e.g. a short product name) instead of the full item name. */
  leafName?: string,
): BreadcrumbCrumb[] {
  const category = categoryForSlug(slug);
  const item = getItemBySlug(slug);
  const trail: BreadcrumbCrumb[] = [
    { name: "Start", href: "/" },
    { name: "Produkte", href: "/products" },
  ];
  if (category) trail.push({ name: category.title, href: category.href });
  if (item) trail.push({ name: leafName ?? item.name });
  return trail;
}

/**
 * 3-level breadcrumb trail for a SUB-PORTAL (category listing) page:
 *   Start › Produkte › <Kategorie>
 * The category is the current page → no href on the last crumb.
 */
export function breadcrumbTrailForCategory(
  category: PortfolioCategory,
): BreadcrumbCrumb[] {
  return [
    { name: "Start", href: "/" },
    { name: "Produkte", href: "/products" },
    { name: category.title },
  ];
}

export interface SiblingNav {
  /** Previous internal item in the same category (undefined at the start). */
  prev?: PortfolioItem;
  /** Next internal item in the same category (undefined at the end). */
  next?: PortfolioItem;
}

/**
 * Within-category prev/next siblings for the "Durchblättern"-Variante (browse one
 * item to the next without going up). External items are skipped (they have no
 * detail page to link to); order follows the declared PORTFOLIO order (featured
 * lead, then A→Z). No wrap-around — clean stop at the category's first/last item.
 */
export function siblingNav(slug: string): SiblingNav {
  const category = categoryForSlug(slug);
  if (!category) return {};
  const browsable = category.items.filter((i) => !i.isExternal);
  const index = browsable.findIndex((i) => i.slug === slug);
  if (index === -1) return {};
  return {
    prev: index > 0 ? browsable[index - 1] : undefined,
    next: index < browsable.length - 1 ? browsable[index + 1] : undefined,
  };
}
