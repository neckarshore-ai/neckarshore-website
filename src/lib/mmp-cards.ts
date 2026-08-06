/**
 * Rich MMP sub-portal card content — the longer card description + the repository link
 * for each Minimum Marketable Product. Keyed by the SAME slug as the matching `PORTFOLIO`
 * mmps item, so the /products/mmps sub-portal can join its card with zero mapping.
 *
 * WHY this lives here and NOT in `portfolio.ts`: `portfolio.ts` is imported by the client
 * `Nav` component, so anything added there ships in the client bundle. This module is
 * imported ONLY by the server-rendered MMP sub-portal, so the long-form copy never reaches
 * the browser as JS. Mirrors the routing-data (portfolio) vs. rich-content (server-only)
 * split that `skill-cards.tsx` already follows.
 *
 * `repoUrl` note: the MMP repos are PRIVATE (commercial products in development), unlike the
 * MIT-licensed Skills. A logged-out visitor following the GitHub link lands on GitHub's
 * sign-in / 404 wall. The link is present by Founder decision (2026-06-21) for visual
 * parity with the skill cards; it resolves cleanly once a repo is made public.
 *
 * Descriptions are grounded in each repo's own description (no invention) + refined for the
 * card surface (≈3 lines). Adding/refining an MMP card = one entry here.
 */

export interface MmpCardData {
  /** ≈3-line card description shown on the /products/mmps sub-portal. */
  description: string;
  /** Repository URL — renders the GitHub button. PRIVATE today (see module note). */
  repoUrl: string;
  /**
   * Live-app subdomain — renders a "Live ↗" button alongside GitHub on the card. Kept here
   * (server-only) rather than on the client-imported `portfolio.ts`, so the URL never ships in
   * the client bundle (same routing-data vs. rich-content split this module already follows).
   * Only set for MMPs with a functional public app (ClearPath, Snakeoil-Check).
   */
  liveUrl?: string;
}

export const MMP_CARDS: Record<string, MmpCardData> = {
  clearpath: {
    description:
      "Eine mentale Firewall gegen kognitive Verzerrungen. Du beschreibst eine anstehende Entscheidung — ClearPath spiegelt sie strukturiert zurück, benennt die Denkfallen darin und liefert eine zweite, nüchterne Perspektive, bevor du dich festlegst.",
    repoUrl: "https://github.com/neckarshore-mmps/clearpath",
    liveUrl: "https://clearpath.neckarshore.ai",
  },
  "snakeoil-check": {
    description:
      "Neutraler KI-Reality-Check für Online-Coachings und High-Ticket-Angebote. Zwölf Kriterien, ein ehrliches Urteil: Go, Vorsicht oder Lieber lassen. Prüft das Versprechen gegen nachvollziehbare Substanz statt gegen Marketing — bevor du investierst.",
    repoUrl: "https://github.com/neckarshore-mmps/snakeoil-check",
    liveUrl: "https://snakeoil.neckarshore.ai",
  },
  phonesis: {
    description:
      "Ein Archiv echter menschlicher Stimmen für Familien und Institutionen. Geführte Aufnahme, Consent-first, sicher verwahrt — eine Stimme, die bleibt, für die Menschen, die nach uns kommen.",
    repoUrl: "https://github.com/neckarshore-mmps/phonesis-voicebank",
  },
  // Grundversion 2026-08-06: scope is being defined (Engels pass) — the description stays
  // deliberately claim-free until it lands. repoUrl per Founder decision 2026-08-06.
  kaze: {
    description:
      "Das erste iOS-Produkt von Neckarshore AI. Der Produkt-Scope wird gerade geschärft — diese Seite füllt sich, sobald er steht. Gebaut nach derselben Arbeitsweise wie alles hier: KI-beschleunigt, DSGVO-by-Design, Made in Germany.",
    repoUrl: "https://github.com/neckarshore-mmps/kaze",
  },
  "local-seo-hub": {
    description:
      "AI-first Sichtbarkeits-Plattform für lokale Unternehmen. Rankings, Reviews und Citations fließen in einen einzigen Visibility Score (0–100) — gebaut für kleine Betriebe und die Agenturen, die sie betreuen.",
    repoUrl:
      "https://github.com/neckarshore-mmps/mmp-local-seo-performance-hub",
  },
  "prod-or-pretend": {
    description:
      'Ein konstruktiver Qualitäts-Spiegel für Tech-Hype. Prüft „an-einem-Wochenende-gebaut"-Claims gegen echte Produktionsstandards — Tests, Security, Skalierbarkeit, Doku. Kein Debunker, sondern eine Substanz-von-Luft-Unterscheidung für Entscheider.',
    repoUrl: "https://github.com/neckarshore-mmps/mmp-prod-or-pretend",
  },
  // NOTE: unlike the other MMP repos above, trustscope is PUBLIC (MIT) — the GitHub link
  // resolves for logged-out visitors, no sign-in/404 wall.
  trustscope: {
    description:
      "Ein deterministischer Vier-Säulen-Trust-Report für öffentliche Open-Source-Projekte. Du gibst ein GitHub-Repo an — TrustScope prüft Sicherheit & Lieferkette, Governance und Community auf Basis der OpenSSF Scorecard und legt die Kompromisse offen, statt sie hinter einer einzigen Punktzahl zu verstecken.",
    repoUrl: "https://github.com/neckarshore-mmps/trustscope",
    liveUrl: "https://trustscope.neckarshore.ai",
  },
};
