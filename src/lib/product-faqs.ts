import type { FaqItem } from "@/components/ProductFaq";

/**
 * Product-detail FAQ content — one source of truth, keyed by portfolio slug.
 *
 * Same data-module pattern as card-descriptions.ts / mmp-cards.ts (2026-06-21). The
 * shared ProductFaq component reads these, renders the visible "Häufige Fragen" section,
 * and emits FAQPage JSON-LD ONLY on indexable pages (preview MMPs + the private restaurant
 * skill show the visible FAQ but suppress the schema; see ProductFaq for the gate).
 *
 * Honesty posture (carried over from the 2026-06-21 -c session): every answer is grounded
 * in what the page already states — no invented pricing, dates, capabilities, or metrics.
 * Preview-product answers stay on DURABLE facts (problem, audience, "in Entwicklung") and
 * avoid specifics that churn while the product evolves. AI-drafted → Founder-redigiert.
 *
 * The four already-accepted FAQ skill pages (obsidian-vault-autopilot, ai-phrase-check,
 * social-scrapers, imap-mailbox-cleanup) keep their own in-file faqItems and are NOT moved
 * here — refactoring Founder-signed-off content carries needless regression risk.
 */
export const PRODUCT_FAQS: Record<string, FaqItem[]> = {
  // ── Flagships (indexable) ────────────────────────────────────────────────
  omnopsis: [
    {
      q: "Was ist Omnopsis?",
      a: "Omnopsis ist eine KI-first Documentation Engine für Engineering-Teams im anspruchsvollen Mittelstand. Omnopsis zieht automatisch aus euren bestehenden Quellen — Git, Jira und Confluence — und generiert daraus Compliance-Dokumentation, technische Dokumentation und rollenbasierte Chatbot-Antworten, die sich aus dem Code heraus aktuell halten. Der entscheidende Unterschied ist die Verlässlichkeit: Jede Aussage wird gegen die Evidenz in euren eigenen Systemen geprüft, bevor sie ausgegeben wird, und das System arbeitet fail-closed — ist die Evidenz schwach, verweigert Omnopsis die Antwort, statt zu raten. Dazu kommt BYOLLM (Bring Your Own LLM): Ihr entscheidet, welches Modell läuft — Claude, GPT, Gemini oder ein lokales Open-Source-Modell — und eure Daten verlassen eure Infrastruktur nie, DSGVO-konform by default und ohne Vendor-Lock-in.",
    },
    {
      q: "Was bedeutet „fail-closed“?",
      a: "Wenn die Evidenz für eine Aussage schwach ist, verweigert das System die Antwort, statt zu raten — lieber schweigen als falsch. Gerade im Compliance-Fall ist eine erfundene Antwort teurer als eine fehlende.",
    },
    {
      q: "Was heißt BYOLLM, und was passiert mit unseren Daten?",
      a: "Bring Your Own LLM: Ihr entscheidet, welches Modell läuft — Claude, GPT, Gemini oder ein lokales Open-Source-Modell. Eure Daten verlassen eure Infrastruktur nie, DSGVO-konform by default, ohne Vendor-Lock-in.",
    },
    {
      q: "Wann ist Omnopsis verfügbar?",
      a: "Omnopsis ist in Entwicklung — der Launch ist für Q3 2026 geplant. Für einen frühen Austausch oder eine Pilot-Anfrage lässt sich ein Kennenlerntermin buchen.",
    },
  ],

  clearpath: [
    {
      q: "Was macht ClearPath?",
      a: "ClearPath ist eine mentale Firewall gegen kognitive Verzerrungen — ein Werkzeug für bessere Entscheidungen. Der Ausgangspunkt: Die meisten Fehlentscheidungen entstehen nicht aus fehlendem Wissen, sondern aus vorhersehbaren Denkfehlern, die im Moment der Entscheidung unsichtbar sind. Du beschreibst eine Entscheidung in einem Satz, und ClearPath benennt die drei kognitiven Verzerrungen, die dein Urteil am wahrscheinlichsten trüben. Der eigentliche Hebel ist Friction by Design: Statt schneller zu entscheiden, erzwingt ClearPath eine bewusste 60-Sekunden-Pause, in der du gegen genau diese Denkfehler prüfst, bevor du handelst — die kurze Reibung, in der ein Fehler auffällt, bevor er teuer wird. Die Bias-Bibliothek folgt Rolf Dobellis Katalog der Denkfehler; der anonyme v0.1-Prototyp deckt 18 Verzerrungen ab, ohne Anmeldung und ohne Tracking.",
    },
    {
      q: "Was bedeutet „Friction by Design“?",
      a: "Reibung als Feature. Statt schneller zu entscheiden, baut ClearPath eine bewusste Verzögerung ein — die kurze Pause, in der ein Denkfehler auffällt, bevor er teuer wird.",
    },
    {
      q: "Brauche ich ein Konto, und werde ich getrackt?",
      a: "Nein. ClearPath ist anonym nutzbar, ohne Anmeldung und ohne Tracking. Du kannst es direkt im Browser ausprobieren.",
    },
    {
      q: "Woher kommen die Verzerrungen?",
      a: "Die Bias-Bibliothek folgt Rolf Dobellis Katalog der Denkfehler. Der aktuelle v0.1-Prototyp deckt 18 Verzerrungen ab.",
    },
  ],

  // ── MMP previews (noindex → visible FAQ, no schema until launch) ──────────
  "snakeoil-check": [
    {
      q: "Was prüft Snakeoil-Check?",
      a: "Snakeoil-Check ist ein neutraler Reality-Check für Online-Coachings, High-Ticket-Programme und Masterclasses. Das Problem, das Snakeoil-Check löst: Seriöse und unseriöse Angebote sehen oft identisch aus — Hochglanz-Versprechen, künstliche Verknappung und kuratierte Testimonials, egal ob echte Substanz dahintersteht. Du gibst den Link zu einem Angebot an, Snakeoil-Check liest die öffentliche Verkaufsseite aus und bewertet sie anhand von zwölf festen, neutralen Kriterien — von der Konkretheit des Versprechens über die Preis-Transparenz bis zu nachprüfbaren Belegen. Heraus kommt ein belastbarer Score mit klarer Tendenz: Go, Vorsicht oder Lieber lassen, samt Begründung pro Kriterium. Der Unterschied ist die Haltung — Skepsis als Werkzeug, nicht als Pauschalurteil: dieselben zwölf Kriterien werden neutral auf jedes Angebot angewandt, die Entscheidung bleibt am Ende bei dir.",
    },
    {
      q: "Wie läuft eine Prüfung ab?",
      a: "Du gibst den Link zu einem Angebot an. Snakeoil-Check liest die öffentliche Verkaufsseite aus, bewertet sie gegen die zwölf Kriterien und gibt dir einen Score mit Begründung pro Kriterium — eine strukturierte zweite Meinung, die du selbst nachvollziehen kannst.",
    },
    {
      q: "Ist das ein Pauschalurteil gegen Anbieter?",
      a: "Nein. Kein Pauschalurteil und keine Anschuldigung — Skepsis als Werkzeug, nicht als Haltung. Dieselben zwölf Kriterien werden neutral auf jedes Angebot angewandt; die Entscheidung bleibt bei dir.",
    },
    {
      q: "Was kostet es, und wo finde ich es?",
      a: "Snakeoil-Check ist live unter snakeoil.neckarshore.ai. Zum Start gibt es einen kostenlosen Check pro Person; weitere Prüfungen lassen sich als Shot-Pakete dazubuchen.",
    },
  ],

  phonesis: [
    {
      q: "Was ist die Phonesis Voicebank?",
      a: "Die Phonesis Voicebank ist ein Archiv echter menschlicher Stimmen — professionell aufgenommen, verschlüsselt gespeichert und für kommende Generationen lebendig gehalten. Eine Stimme verschwindet, wenn ein Mensch geht, und Fotos tragen sie nicht; Phonesis schafft dafür den sicheren, dauerhaften Ort, den es heute kaum gibt. Du nimmst direkt im Browser auf — geführt durch vorbereitete Prompts, ohne App — und jede Aufnahme wird verschlüsselt gespeichert, automatisch transkribiert und einer verifizierten Identität zugeordnet. Phonesis ist für Familien gedacht, die Gutenacht-Geschichten in Omas eigener Stimme behalten wollen, für Hospize, in denen Menschen ihre Stimme sichern, und für Institutionen, die bedeutende Stimmen für Biografie und kulturelles Erbe archivieren. Das Fundament ist Ethik, kein Feature: DSGVO-konform, Ende-zu-Ende-verschlüsselt und kein Stimm-Klon ohne ausdrückliche Einwilligung — die Hoheit bleibt jederzeit bei Sprecher und benannten Erben.",
    },
    {
      q: "Für wen ist Phonesis gedacht?",
      a: "Für Familien, die Gutenacht-Geschichten in Omas eigener Stimme behalten wollen, für Hospize, in denen Patientinnen ihre Stimme sichern, bevor die Krankheit sie nimmt, und für Institutionen, die Stimmen bedeutender Menschen für Biografie und kulturelles Erbe archivieren.",
    },
    {
      q: "Wie steht es um Datenschutz und Stimm-Klone?",
      a: "Ethik ist das Fundament, kein Feature: DSGVO-konform, Ende-zu-Ende-verschlüsselt, kein Stimm-Klon ohne ausdrückliche Einwilligung und kein Verkauf von Daten — niemals. Sprecher und ihre benannten Erben behalten jederzeit die volle Kontrolle darüber, wer welche Aufnahme hören darf.",
    },
    {
      q: "Wie nehme ich auf, und wann ist es verfügbar?",
      a: "Du nimmst direkt im Browser auf — geführt durch vorbereitete Prompts, ohne App. Phonesis ist in Entwicklung; die geführte Aufnahme, Transkription und das Erben-Portal stehen, vor dem öffentlichen Start folgen Onboarding und Test-Abdeckung.",
    },
  ],

  "local-seo-hub": [
    {
      q: "Was macht der Local-SEO-Hub?",
      a: "Der Local-SEO-Hub ist eine Plattform, die lokale Online-Sichtbarkeit in einer einzigen, KI-gestützten Zahl bündelt. Lokale Betriebe — Restaurant, Praxis, Handwerk — werden über drei Signale gefunden oder übersehen: Rankings in der lokalen Suche, Bewertungen und Verzeichnis-Einträge, verstreut über Dutzende Plattformen mit je eigenem Dashboard. Der Local-SEO-Hub sammelt diese Signale an einem Ort und verdichtet sie zu einem Sichtbarkeits-Score von 0 bis 100 — eine Zahl statt eines Dutzends unverbundener Kennzahlen. KI wertet Bewertungen nach Stimmung aus, erkennt Auffälligkeiten früh und leitet priorisierte Empfehlungen ab. Der Unterschied ist die Haltung: KI als Co-Pilot, nicht als Autopilot — man sieht, woraus Score und Empfehlungen entstehen, und entscheidet selbst. Für Agenturen läuft derselbe Überblick über mehrere Standorte hinweg, ein Dashboard statt vieler Logins.",
    },
    {
      q: "Für wen ist die Plattform gedacht?",
      a: "Für lokale Unternehmen — Restaurant, Praxis, Handwerksbetrieb — die wissen wollen, wie sichtbar sie gerade sind und woran sie als Nächstes arbeiten sollten. Für Agenturen läuft derselbe Überblick über mehrere Standorte hinweg, ein Dashboard statt vieler Logins.",
    },
    {
      q: "Sind Score und Empfehlungen nachvollziehbar?",
      a: "Ja. KI als Co-Pilot, nicht als Autopilot: Man sieht, woraus Score und Empfehlungen entstehen, und entscheidet selbst, was zu tun ist. Eine ehrliche Zahl, die man morgens auf einen Blick versteht, statt eines Dashboards, das alles zeigt und nichts erklärt.",
    },
    {
      q: "Wann ist der Local-SEO-Hub verfügbar?",
      a: "Er ist in Entwicklung — das Konzept steht samt ausgearbeiteter Architektur- und KI-Dokumentation, die Umsetzung beginnt. Geplant ist zuerst der Sichtbarkeits-Score, dann die KI-gestützte Bewertungs-Analyse, danach priorisierte Empfehlungen und schließlich die Mehr-Standort-Ansicht für Agenturen.",
    },
  ],

  "prod-or-pretend": [
    {
      q: "Was macht Prod-or-Pretend?",
      a: "Prod-or-Pretend ist ein konstruktiver Qualitäts-Spiegel für Tech-Hype. LinkedIn und X sind zur Echokammer für recycelten Hype geworden — „an einem Wochenende gebaut“, „Game Changer“, „KI-gestützt“, gepostet ohne Repository, ohne Tests, ohne Belege; wer Software-Budgets verantwortet, kann Substanz kaum von poliertem Theater unterscheiden. Prod-or-Pretend prüft solche Behauptungen gegen echte Produktionsstandards anhand einer festen Zwölf-Punkte-Checkliste. Gibt es ein öffentliches Repository, wird geprüft, was wirklich zählt — Tests, Sicherheit, Dokumentation, CI/CD und Abhängigkeiten; gibt es keines, spiegelt ein neutrales Beraterraster die Behauptung gegen die Fragen, die in der Produktion entscheiden. Der Unterschied ist die Haltung: ein Spiegel, kein Tribunal — dieselben Maßstäbe für jede Behauptung, ruhig und nachvollziehbar angelegt, konstruktiv formuliert und nie als Angriff auf eine Person.",
    },
    {
      q: "Wie wird geprüft?",
      a: "Über eine feste Zwölf-Punkte-Checkliste. Gibt es ein öffentliches Repository, wird geprüft, was wirklich zählt: Tests, Sicherheit, Dokumentation, CI/CD und Abhängigkeiten. Gibt es keines, spiegelt ein neutrales Beraterraster die Behauptung gegen die Fragen, die in der Produktion entscheiden.",
    },
    {
      q: "Ist das Debunking oder ein Angriff?",
      a: "Nein. Ein Spiegel, kein Tribunal: dieselben Maßstäbe für jede Behauptung, ruhig und nachvollziehbar angelegt, konstruktiv formuliert und nie als Angriff auf eine Person.",
    },
    {
      q: "Wann ist es verfügbar?",
      a: "Prod-or-Pretend ist in Entwicklung — das Konzept steht, die Umsetzung beginnt mit einer Kalibrierungsphase, in der die Hype-Erkennung gegen echte Beiträge geschärft wird. Veröffentlichungen auf LinkedIn bleiben dauerhaft mensch-final, kein automatisches Posten.",
    },
  ],

  trustscope: [
    {
      q: "Was macht TrustScope?",
      a: "TrustScope prüft ein öffentliches GitHub-Repository und erstellt daraus einen deterministischen Trust-Report entlang von vier Säulen. Das Problem, das TrustScope löst: Wer ein Open-Source-Tool in die eigene Lieferkette holt, verlässt sich auf fremden Code — und ein Stern-Zähler oder eine grüne Badge sagt wenig darüber, wie weit man ihm trauen kann. TrustScope beantwortet die eigentlich wichtigen Fragen getrennt: Sicherheit & Lieferkette auf Basis der vollständigen OpenSSF Scorecard, Trust & Governance über Lizenz, Security-Policy und Owner, sowie Community & Nachhaltigkeit als Lebenszyklus-Phase statt als Schulnote. Die funktionale Qualität bleibt bewusst offen — ein Handwerksurteil, das TrustScope nicht vortäuscht. Zu jedem Befund gibt es konkrete, konstruktive Verbesserungsvorschläge, die du auf Wunsch mit einem Klick als freundliches Issue beim Projekt einreichst.",
    },
    {
      q: "Warum gibt es keine einzige Gesamt-Punktzahl?",
      a: "Mit Absicht keine. Jede der vier Säulen beantwortet eine andere Frage — Ist es sicher gebaut? Steht ein verlässliches Projekt dahinter? Wird es weiter gepflegt? Sie zu einer einzigen Zahl zu verrechnen würde genau den Kompromiss verstecken, den man gerade abwägt.",
    },
    {
      q: "Woher kommen die Bewertungen?",
      a: "Aus der OpenSSF Scorecard und den öffentlichen GitHub-Daten des Repositories — deterministisch, also für dasselbe Repo reproduzierbar. Nur die funktionale Qualität wird bewusst nicht bewertet: Ob Software gut gebaut ist, ist ein Handwerksurteil, das sich nicht seriös automatisieren lässt — also täuscht TrustScope es nicht vor.",
    },
    {
      q: "Was kostet TrustScope, und brauche ich ein Konto?",
      a: "TrustScope ist kostenlos und ohne Anmeldung nutzbar — du gibst ein öffentliches Repo an und bekommst den Report. Ein GitHub-Login brauchst du nur, wenn du einen Verbesserungsvorschlag direkt als Issue beim Projekt einreichen willst; das Issue wird dann als du selbst erstellt, mit sichtbarer „via TrustScope\"-Kennzeichnung. Der Code ist quelloffen (MIT).",
    },
  ],

  // ── Private skill (noindex → visible FAQ, no schema) ──────────────────────
  "restaurant-menu-update": [
    {
      q: "Was macht die Restaurant-Menüpflege?",
      a: "Die Restaurant-Menüpflege ist ein Skill, der das wiederkehrende Menü-Update eines Restaurants in einen geprüften, reproduzierbaren Vorgang verwandelt. Der Inhaber liefert die neue Karte, wie sie anfällt — als PDF, Foto oder Freitext — und die Restaurant-Menüpflege macht daraus publikationsreife Website-Inhalte: Sie zerlegt die Karte in einzelne Gerichte und Weine, gleicht jeden Allergen- und Zusatzstoff-Code gegen die zentrale LMIV-/ZZulV-Referenz ab (unbekannte Codes werden gemeldet, nie geraten) und korrigiert ASCII-Schreibweisen aus alten Word-Vorlagen zu echten Umlauten, während italienische Gerichtnamen im Original bleiben. Der entscheidende Unterschied ist die Absicherung: Build, Lint und Konsistenz-Check laufen automatisch, und am Ende steht ein Pull Request mit Test-Plan und Vercel-Vorschau — nichts geht ohne menschliche Abnahme online.",
    },
    {
      q: "Wie funktioniert die Allergen-Prüfung?",
      a: "Jeder Allergen- und Zusatzstoff-Code wird gegen die zentrale LMIV-/ZZulV-Referenz abgeglichen. Unbekannte Codes werden gemeldet, nie geraten — und italienische Gerichtnamen bleiben im Original, während ASCII-Schreibweisen aus alten Word-Vorlagen zu echten Umlauten korrigiert werden.",
    },
    {
      q: "Geht etwas ungesehen live?",
      a: "Nein. Build, Lint und Konsistenz-Check laufen automatisch, und am Ende steht ein Pull Request mit Test-Plan und Vercel-Vorschau zur Freigabe — nichts geht ohne menschliche Abnahme online.",
    },
    {
      q: "Kann ich diesen Skill nutzen?",
      a: "Dieser Skill ist im Rahmen eines konkreten Kundenprojekts entstanden und liegt in einem privaten Repository — es gibt keinen öffentlichen Download. Er steht hier als Referenz dafür, wie ein wiederkehrender, fehleranfälliger Pflegevorgang in einen sicheren Workflow überführt wird. Lässt sich derselbe Vorgang in deinem Betrieb automatisieren? Dann lass uns reden.",
    },
  ],

  // ── Website case studies (indexable) ──────────────────────────────────────
  neckarshore: [
    {
      q: "Wie ist neckarshore.ai gebaut?",
      a: "Als statisch-first ausgelieferte Next.js-16-Anwendung (App Router) mit React 19, TypeScript und Tailwind CSS v4, gehostet auf Vercel. Die Seite ist das erste Proof of Work — sie beweist an sich selbst, was sie verspricht.",
    },
    {
      q: "Warum braucht die Seite kein Cookie-Banner?",
      a: "Weil es nichts zuzustimmen gibt: keine Tracking-Cookies, keine externen Ressourcen. Die Reichweiten-Messung läuft cookielos als First-Party-Analytik über die eigene Route — per navigator.sendBeacon an /api/track, ohne externen Analytics-Anbieter.",
    },
    {
      q: "Was heißt „DSGVO-by-Design“ hier konkret?",
      a: "Datenschutz ist Architekturentscheidung, nicht Checkliste: selbst gehostete Schriften statt eingebundener Google Fonts (kein Datentransfer in Drittstaaten), kein externer Tracker und SEO-Strukturdaten als native, server-gerenderte Script-Tags.",
    },
    {
      q: "Könnt ihr so eine Seite auch für uns bauen?",
      a: "Ja — dieselbe Bauweise (KI-beschleunigt, vom Gründer redigiert, DSGVO-by-Design) liefern wir für Kundenprojekte. Ein kurzer Kennenlerntermin klärt den Rahmen unverbindlich.",
    },
  ],

  "ristorante-goldoni": [
    {
      q: "Was war die Aufgabe?",
      a: "Der Relaunch der Website des Ristorante Goldoni von einer WordPress-Installation (PHP 8.2) auf ein statisches Next.js-Stack — schnell, DSGVO-by-Design und ohne laufenden Wartungsaufwand, mit Speisekarte, wöchentlicher Empfehlungskarte, Kontakt- und Feier-Anfragen und Anfahrt.",
    },
    {
      q: "Wie werden die Inhalte gepflegt?",
      a: "Inhalte (Speisekarte, Weinempfehlungen, FAQ, Empfehlungskarte) liegen als strukturierte Daten im Repository und werden zur Build-Zeit gerendert; ein Push deployt automatisch. Die wöchentliche Empfehlungskarte ist ein Ein-Datei-Edit.",
    },
    {
      q: "Wie ist der Datenschutz gelöst?",
      a: "DSGVO-by-Design: selbst gehostete Fonts, kein Analytics, keine Drittanbieter-Embeds im Standardpfad. Die Kontakt- und Feier-Formulare sind mit Cloudflare Turnstile gegen Spam geschützt — interaction-only, ohne Cross-Site-Tracking — hinter strengen Security-Headern.",
    },
    {
      q: "Wie wurde die WordPress-Migration abgesichert?",
      a: "Über 308-Redirects der Alt-URLs inklusive www→apex-Kanonisierung; ein Post-Launch-SEO-Audit mit Bereinigung in der Google Search Console folgte. Die Seite emittiert Schema.org-JSON-LD (Restaurant, Menu, FAQPage, BreadcrumbList) als natives, server-gerendertes Script.",
    },
  ],

  "oakwood-golf-club": [
    {
      q: "Was wurde ersetzt?",
      a: "Der 16 Jahre alte WordPress-Auftritt des Oakwood Golf Club — eines Fernmitgliedschafts-Golfclubs mit offiziellem Handicap und Mitgliederkarte — durch eine überwiegend statische Next.js-Site mit den Online-Strecken für Anmeldung, Verlängerung, FAQ und Blog.",
    },
    {
      q: "Wie funktionieren die Formulare?",
      a: "Anmeldung, Verlängerung und Kontakt laufen über Server Actions mit Cloudflare Turnstile als cookieless Spam-Schutz; der Versand erfolgt per SMTP, eine Honeypot-Strecke fängt Bots still ab, und Zod validiert die Eingaben.",
    },
    {
      q: "Wie wird der Blog gepflegt?",
      a: "Der Blog ist Markdown-getrieben (gray-matter + marked) und im Repo versioniert — kein separates CMS als Laufzeit-Abhängigkeit. Neue oder geänderte Posts werden bei Push automatisch per IndexNow an Bing und Yandex gemeldet, damit sie binnen Minuten neu gecrawlt werden.",
    },
    {
      q: "Gibt es ein Mitglieder-Portal oder Online-Zahlung?",
      a: "Ein Mitglieder-Portal (Login, Scorecards, Handicap-Verwaltung) ist geplant, aber noch nicht gebaut — es braucht noch Scope-Entscheidungen mit dem Betreiber. Eine Online-Zahlung (Stripe) ist ebenfalls noch nicht angebunden.",
    },
  ],

  rauhut: [
    {
      q: "Was ist rauhut.com?",
      a: "Die persönliche Web-Präsenz des Gründers German Rauhut — die Person, nicht die Firma (neckarshore.ai ist das Unternehmen). Ein schlanker, schneller One-Pager als Proof of Work: Profil, Kernkompetenzen, Projekte und Kontakt, zweisprachig in Deutsch und Englisch.",
    },
    {
      q: "Wie ist die Zweisprachigkeit gelöst?",
      a: "Statisch: Deutsch als Default unter /, Englisch unter /en, mit hreflang-Alternates in Metadata und Sitemap. Kein Client-seitiges Umschalten, kein doppelter Content — zwei vorab gerenderte Sprachvarianten.",
    },
    {
      q: "Wie steht es um Datenschutz?",
      a: "Voll DSGVO-konform und ohne Cookie-Banner: die Schrift (Inter Variable) ist self-hosted statt über ein CDN, und die Analytik läuft ausschließlich über die cookielose Vercel Web Analytics — daher ist kein Banner nötig.",
    },
    {
      q: "Welche Lighthouse-Werte erreicht die Seite?",
      a: "Laut Repo-Baseline erreicht die Seite 100 in Accessibility, Best Practices und SEO (Desktop und Mobile) bei durchgängig sehr hoher Performance — die exakten Werte stehen in den protokollierten CI-Läufen.",
    },
  ],
};

/** FAQ items for a product/website slug, or `[]` if none are authored. */
export function faqForSlug(slug: string): FaqItem[] {
  return PRODUCT_FAQS[slug] ?? [];
}
