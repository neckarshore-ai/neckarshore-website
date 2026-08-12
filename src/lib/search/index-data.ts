/**
 * Builds the full searchable document set for the Cmd+K palette.
 *
 * Build-time only: keep this out of client components — the client must import
 * only `./types`. The force-static `/api/search-index` route is the single
 * consumer; it runs this at build time and serves the JSON from the CDN, so there
 * is no runtime compute.
 *
 * Coverage contract ("alle Seiten indiziert, nach Inhalt suchbar, Tiefe egal"):
 *   - Products  → one doc per portfolio item (live + preview skeletons + external
 *                 link-outs), derived from PORTFOLIO so a new product is indexed
 *                 automatically (AP-1). On-site search ≠ robots index: the noindex
 *                 preview skeletons ARE searchable on purpose.
 *   - Pages     → every route + the stable home sections (#services / #why-nearshore
 *                 / #founder / #faq) as deep-link docs, with curated leads mirroring
 *                 the on-page copy (no fragile JSX scraping). #open-source is NOT
 *                 indexed — it is conditionally rendered (OSS_LAUNCH_VISIBLE).
 *
 * The standalone /glossar surface was retired 2026-06-23 (its cognitive-bias topic
 * is ClearPath's domain, not neckarshore's) — the biases now live as a table on
 * /products/clearpath, covered by that product's doc.
 */
import { allCategories } from "@/lib/portfolio";
import type { SearchDoc } from "./types";

// Curated page index — every route + the stable home sections. Mirrors each page's
// real copy / metadata description so "search by content" hits without scraping JSX.
const PAGES: { id: string; title: string; text: string; category: string; url: string }[] = [
  {
    id: "page:/",
    title: "neckarshore.ai — Software Development. Closer to Home.",
    text: "KI-beschleunigte Nearshore-Softwareentwicklung aus Stuttgart. Gleiche Zeitzone, gleiche Sprache, gleiche Datenschutzstandards — ohne Offshore-Risiko, ohne Big-4-Preise. DSGVO-by-Design, Made in Germany, AI-Powered. Neckarshore AI.",
    category: "Startseite",
    url: "/",
  },
  {
    id: "page:/#services",
    title: "Unsere Services",
    text: "AI-Powered Development, Documentation Automation, AI Consulting & Strategy, DSGVO-by-Design, Quality Engineering und Nearshore Partnership. Production-Stack: NestJS, TypeScript, PostgreSQL. BYOLLM, OWASP LLM Top 10, EU AI Act Compliance. KI-Strategie-Beratung für DACH-Unternehmen.",
    category: "Startseite",
    url: "/#services",
  },
  {
    id: "page:/#why-nearshore",
    title: "Warum Nearshore?",
    text: "Was ist Nearshore-Entwicklung? Nearshore vs. Offshore, vs. Big-4-Consultancies, vs. Freelancer. Gleiche Zeitzone, gleiche Sprache, gleiche DSGVO-Standards. Enterprise-Qualität ohne Enterprise-Preise. KI-beschleunigt, kulturelles Alignment, Stuttgart-basiert.",
    category: "Startseite",
    url: "/#why-nearshore",
  },
  {
    id: "page:/#founder",
    title: "Über uns — German Rauhut",
    text: "German Rauhut, Gründer von neckarshore.ai. Ehemaliger Mercedes-Benz IT, jetzt Gründer von Neckarshore AI in Stuttgart. Software mit KI-Beschleunigung. Ein Senior-Architekt mit einem KI-gestützten Expertensystem. Kontext ist das neue Öl.",
    category: "Startseite",
    url: "/#founder",
  },
  {
    id: "page:/#faq",
    title: "Häufige Fragen",
    text: "Was ist Omnopsis Documentor+X? Was bedeutet BYOLLM — Bring Your Own LLM? Was kostet Nearshore-Entwicklung bei neckarshore.ai? Wo sitzt neckarshore.ai — Stuttgart, Deutschland. Ist neckarshore.ai DSGVO-konform? Fail-closed: lieber schweigen als lügen.",
    category: "Startseite",
    url: "/#faq",
  },
  {
    id: "page:/products",
    title: "Produkte",
    text: "Das neckarshore.ai-Portfolio: ein Flagship (Omnopsis), mehrere Produkte mit Marktreife (MMPs), fokussierte Open-Source-Skills und Web-Präsenzen. Strukturiert gebaut — KI-beschleunigt, DSGVO-by-Design, Made in Germany.",
    category: "Seite",
    url: "/products",
  },
  {
    id: "page:/commits",
    title: "Commit-Aktivität",
    text: "Wie dieser Code-Bestand entstanden ist: Commit-Aktivität pro Woche und Monat seit dem ersten Commit im März 2026, aufgeschlüsselt nach Bereichen — Infrastruktur, Omnopsis, Websites, MMPs, Skills. Die Story hinter der Commits-Kachel, täglich automatisch aus GitHub statt aus einer gepflegten Liste.",
    category: "Seite",
    url: "/commits",
  },
  {
    id: "page:/repositories",
    title: "Unsere Repositories",
    text: "Der gesamte Code-Bestand hinter unseren Produkten, Skills und Websites. Öffentliche Repositories listen wir einzeln mit Beschreibung, nach Typ gruppiert; private zählen wir nur — ohne Namen. Täglich automatisch mit GitHub abgeglichen, nicht von Hand gepflegt.",
    category: "Seite",
    url: "/repositories",
  },
  {
    id: "page:/test-management",
    title: "Wie wir testen",
    text: "Wie wir unser Test-Estate zählen und prüfen: jede Zahl kommt vom Test-Runner selbst, nie geschätzt oder gegrep't, unabhängig gegengeprüft und nach unten gerundet. Die Story hinter der Automatisierte-Tests-Kachel — nachprüfbar statt nach Bauchgefühl.",
    category: "Seite",
    url: "/test-management",
  },
  {
    id: "page:/impressum",
    title: "Impressum",
    text: "Impressum von neckarshore.ai — German Rauhut, IT Consulting & Digital Ventures, Stuttgart. Angaben gemäß § 5 DDG.",
    category: "Seite",
    url: "/impressum",
  },
  {
    id: "page:/datenschutz",
    title: "Datenschutz",
    text: "Datenschutzerklärung von neckarshore.ai — Informationen zur Datenverarbeitung, Cookies und Ihren Rechten gemäß DSGVO.",
    category: "Seite",
    url: "/datenschutz",
  },
];

/** Build the full searchable document set across pages and products. */
export function buildSearchDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  // 1) Curated pages + home sections.
  for (const p of PAGES) {
    docs.push({ id: p.id, type: "page", title: p.title, text: p.text, category: p.category, url: p.url });
  }

  // 2) Products — sub-portal pages + every portfolio item (derived from PORTFOLIO).
  for (const cat of allCategories()) {
    docs.push({
      id: `page:${cat.href}`,
      type: "page",
      title: cat.title,
      text: `${cat.subtitle}. ${cat.items.map((i) => i.name).join(", ")}.`,
      category: "Produkte",
      url: cat.href,
    });
    for (const item of cat.items) {
      // Website items with a case study resolve to their INTERNAL /products/websites/<slug>
      // page (the card's primary destination) — not the external domain — so on-site search
      // opens the case study, with the live site one click further. Items without a case
      // study keep their href (internal detail page, or an external link-out).
      const url = item.caseStudySlug
        ? `/products/websites/${item.caseStudySlug}`
        : item.href;
      const isExternalLink = item.isExternal && !item.caseStudySlug;
      docs.push({
        id: `product:${cat.id}:${item.slug}`,
        type: "product",
        title: item.name,
        text: item.tagline,
        category: cat.title,
        url,
        ...(isExternalLink ? { external: true } : {}),
      });
    }
  }

  return docs;
}
