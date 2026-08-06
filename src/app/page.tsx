import fs from "fs";
import path from "path";
import {
  Cpu,
  FileText,
  Brain,
  Shield,
  TestTubeDiagonal,
  Users,
  Clock,
  Globe,
  TrendingUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Nav from "@/components/Nav";
import Logo from "@/components/Logo";
import { PageSchema } from "@/components/PageSchema";
import ContactForm from "@/components/ContactForm";
import StatsGrid, { type StatsData } from "@/components/StatsGrid";
import FounderImage from "@/components/FounderImage";
import LiveTicker from "@/components/LiveTicker";
import { BRAND } from "@/lib/brand";

/* ---------- constants ---------- */

const showOssLaunch = process.env.OSS_LAUNCH_VISIBLE === "true";

// FAQ — single visible <details> accordion + FAQPage JSON-LD (GEO / AI-citation + SEO).
// Merged the former standalone "Knowledge Base" GEO snippets in here 2026-06-25 (German
// Rauhut): one "Häufige Fragen" accordion, same pattern as the product detail pages
// (ProductFaq.tsx). Long-form answers stay collapsed for a clean page but live in the SSR
// HTML — crawlers read raw HTML (open/closed is render-only) and the FAQPage schema mirrors
// every Q&A, so GEO citability is preserved. BYOLLM de-duplicated (the long-form answer wins).
const faqItems = [
  {
    q: "Was ist Nearshore-Entwicklung?",
    a: "Nearshore-Entwicklung bezeichnet die Auslagerung von Software-Entwicklung an einen Partner in geografischer und kultureller Nähe — im Gegensatz zu Offshore (günstig, aber weit und riskant) und zu klassischem Onshore (nah, aber teuer). Neckarshore AI operiert von Stuttgart aus im DACH-Raum: gleiche Zeitzone (CET/CEST), gleiche Sprache, gleiche DSGVO-Standards by default. Das eliminiert die klassischen Offshore-Risiken: Kommunikationsverlust über Zeitzonen hinweg, schwierige Qualitätskontrolle auf Distanz und Compliance-Probleme durch Datentransfer in Drittstaaten. Im Unterschied zu klassischen deutschen IT-Dienstleistern bringt Neckarshore AI KI-Beschleunigung: ein kleines, fokussiertes Team mit modernen AI-Tools erreicht die Lieferfähigkeit, für die andere Teams ein Vielfaches an Personen einsetzen. Das Ergebnis: Enterprise-Qualität zu Nearshore-Preisen, mit vollem deutschen Datenschutzstandard, direktem Zugang zu Senior-Engineers statt Junior-lastigen Bench-Modellen, und schnellerer Delivery durch AI-Unterstützung in jedem Schritt des Entwicklungsprozesses.",
  },
  {
    q: "Wie funktioniert KI-beschleunigte Softwareentwicklung?",
    a: "KI-beschleunigte Softwareentwicklung bei Neckarshore AI folgt einem klaren Prinzip: Menschen denken, entscheiden und verantworten — KI exekutiert nach klaren Leitplanken. Der Entwicklungsprozess beginnt mit der Architekturentscheidung durch den Senior-Engineer. Danach übernehmen spezialisierte KI-Agenten das Implementieren, Testen, Dokumentieren und Deployen — parallel und ohne Wartezeit zwischen den Schritten. Jedes Ergebnis wird vom Menschen reviewed und freigegeben, bevor es in Produktion geht. Die Geschwindigkeitsmultiplikation entsteht durch Parallelisierung: während der Engineer die nächste Anforderung klärt, implementiert die KI die letzte Entscheidung und schreibt Tests für die Entscheidung davor. Für Kunden bedeutet das schnellere Delivery, weniger Overhead und direkten Zugang zu Senior-Engineers statt Junior-Bench-Modellen. Qualitätssicherung bleibt vollständig menschlich kontrolliert: automatisierte Tests, OWASP-Compliance und Code-Reviews folgen denselben Standards wie in klassischen Enterprise-Teams — nur schneller.",
  },
  {
    q: `Was ist ${BRAND.PRODUCT_SHORT}?`,
    a: `${BRAND.PRODUCT_NAME} ist unsere KI-first Documentation Engine. Sie zieht automatisch aus Git, Jira und Confluence und generiert Compliance-Doku, technische Doku und rollenbasierte Chatbot-Antworten. Fail-closed: Wenn die Evidenz schwach ist, verweigert das System die Antwort — lieber schweigen als lügen.`,
  },
  {
    q: "Was ist BYOLLM?",
    a: "BYOLLM steht für Bring Your Own LLM — ein Architekturprinzip von Neckarshore AI, das Kunden die volle Kontrolle über ihr KI-Modell gibt. Anstatt an einen Cloud-LLM-Anbieter gebunden zu sein, bringt der Kunde sein bevorzugtes Modell mit: Claude von Anthropic, GPT-4 von OpenAI, Gemini von Google oder ein lokal gehostetes Open-Source-Modell. Neckarshore AI liefert die Pipeline — Datenextraktion aus Git, Jira und Confluence, Aufbereitung, Qualitäts-Gates und strukturierte Ausgabe. Die Vorteile: Keine Kundendaten verlassen die eigene Infrastruktur (DSGVO-konform by default), keine Vendor-Lock-in-Abhängigkeit, volle Kostenkontrolle über Modell und Inferenzkosten. Beim Omnopsis Documentor+X, dem Flaggschiff-Produkt von Neckarshore AI, ist BYOLLM keine Option — es ist der Standard. Fail-closed bedeutet außerdem: wenn das Modell keine sichere Antwort findet, gibt es keine aus. Lieber schweigen als lügen.",
  },
  {
    q: "Was kostet Nearshore-Entwicklung bei neckarshore.ai?",
    a: "Wir sind deutlich kosteneffektiver als Big-4-Consultancies bei vergleichbarer Qualität. Durch KI-Beschleunigung liefert ein kleines Team, wofür andere deutlich mehr Leute brauchen. Konkrete Preise besprechen wir im 20-Minuten Kennenlerntermin.",
  },
  {
    q: "Wo sitzt neckarshore.ai?",
    a: "neckarshore.ai sitzt in Stuttgart, Deutschland. Der Name kommt vom Neckar — dem Fluss, der das industrielle Herz Baden-Württembergs verbindet. Wir arbeiten remote-first, sind aber lokal verankert: gleiche Zeitzone, gleiche Sprache, gleiche Datenschutzstandards.",
  },
  {
    q: "Ist neckarshore.ai DSGVO-konform?",
    a: "Ja, DSGVO-Konformität ist bei uns Architekturentscheidung, keine Checkliste. Verschlüsselung, Tenant-Isolation und BYOLLM — eure Daten bleiben bei euch. Diese Website setzt keine Tracking-Cookies und lädt keine externen Ressourcen.",
  },
];

function getDaysSinceStart(): number {
  const now = new Date();
  const diff = now.getTime() - BRAND.DAY_ONE.getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function loadStats(): StatsData {
  const statsPath = path.join(process.cwd(), "public", "stats.json");
  try {
    return JSON.parse(fs.readFileSync(statsPath, "utf-8"));
  } catch {
    return {
      days: 17,
      commits: 780,
      tests: 464,
      endpoints: 92,
      linesOfCode: 95000,
      repos: 13,
      updatedAt: "",
    };
  }
}

/* ---------- page ---------- */

export default function Home() {
  const devDays = getDaysSinceStart();
  const stats = loadStats();
  return (
    <>
      <Nav showOssLaunch={showOssLaunch} />
      <PageSchema
        path="/"
        name="neckarshore.ai — Software Development. Closer to Home."
      />
      <main>
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden bg-neutral-light px-4 pt-40 pb-20 md:px-6 md:pt-44 md:pb-24 dark:bg-deep-space">
          <div className="mx-auto max-w-[1200px]">
            <h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight text-primary md:text-[56px] dark:text-text-primary">
              Software Development.
              <br />
              Closer to Home.
            </h1>
            <p className="mt-3 text-sm font-medium text-muted dark:text-text-secondary/70">
              <strong>Neckarshore AI</strong> — KI-beschleunigte Nearshore-Softwareentwicklung aus Stuttgart.
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-dark/80 md:text-xl dark:text-text-secondary">
              neckarshore.ai bringt KI-beschleunigte Softwareentwicklung zurück nach Stuttgart.
              Gleiche Zeitzone, gleiche Sprache, gleiche Datenschutzstandards — ohne Offshore-Risiko,
              ohne Big-4-Preise.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="https://calendly.com/rauhut/20min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-8 py-3.5 text-base font-medium text-white transition-all duration-150 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
                data-track="cta_click"
              >
                Kennenlerntermin buchen
              </a>
              <a
                href="#services"
                className="inline-flex items-center justify-center rounded-lg border-2 border-primary px-8 py-3.5 text-base font-medium text-primary transition-all duration-150 hover:bg-primary hover:text-white dark:border-text-primary dark:text-text-primary dark:hover:bg-text-primary dark:hover:text-deep-space"
              >
                Unsere Services
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm font-medium tracking-wide text-muted dark:text-text-secondary/60">
              <span className="flex items-center gap-2">
                <Shield size={16} className="text-accent" />
                DSGVO-by-Design
              </span>
              <span className="flex items-center gap-2">
                <Globe size={16} className="text-accent" />
                Made in Germany
              </span>
              <span className="flex items-center gap-2">
                <Cpu size={16} className="text-accent" />
                AI-Powered
              </span>
            </div>
          </div>
          {/* Decorative gradient blob */}
          <div
            className="pointer-events-none absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full opacity-[0.07] dark:opacity-[0.12]"
            style={{
              background:
                "radial-gradient(circle, #00D4FF 0%, transparent 70%)",
            }}
          />
        </section>

        {/* ===== PORTFOLIO / FLAGSHIP — reframed 2026-06-17 (was Omnopsis-only teaser).
            Moved above "Warum Nearshore?" 2026-06-25 (German Rauhut) — portfolio leads.
            Omnopsis story (engine copy + Conceived/Born photos + timeline) relocating to
            /products/omnopsis. id kept so existing /#omnopsis anchors still land here. ===== */}
        <section id={BRAND.SECTION_ID} className="bg-primary px-4 py-20 md:px-6 md:py-24">
          <div className="mx-auto max-w-[1200px]">
            <div className="grid items-center gap-12 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-secondary">
                  Unser Portfolio
                </p>
                <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-text-primary md:text-4xl">
                  Ein Flagship. Mehrere Produkte. Skills. Eine Bauweise.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-text-secondary">
                  Strukturiert gebaut — KI-beschleunigt, DSGVO-by-Design, Made in Germany:
                  Flagships, MMPs, Skills (&amp; Websites).
                </p>
                <Link
                  href="/products"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-secondary transition-colors hover:text-text-primary"
                >
                  Alle Produkte ansehen →
                </Link>
              </div>

              {/* Stats grid — renders instantly with fallback, fetches live data in background */}
              <StatsGrid stats={stats} devDays={devDays} />
            </div>
          </div>
        </section>

        {/* ===== WHY NEARSHORE ===== */}
        <section id="why-nearshore" className="bg-white px-4 py-20 md:px-6 md:py-24 dark:bg-surface">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary md:text-4xl dark:text-text-primary">
              Warum Nearshore?
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Clock,
                  title: "vs. Offshore",
                  subtitle: "All the speed, none of the risk.",
                  text: "Gleiche Zeitzone, gleiche Sprache. neckarshore.ai liefert DSGVO-konform by default, KI-beschleunigt, mit kulturellem Alignment — wir verstehen wie deutsche Unternehmen ticken.",
                },
                {
                  icon: TrendingUp,
                  title: "vs. Big-4",
                  subtitle: "Enterprise-Qualität ohne Enterprise-Preise.",
                  text: "Deutlich kosteneffektiver bei vergleichbarer Qualität. Schnellere Delivery, weniger Overhead. Direkter Zugang zu Engineers — kein Junior-heavy Bench-Modell.",
                },
                {
                  icon: Users,
                  title: "vs. Freelancers",
                  subtitle: "Die Verlässlichkeit einer Agentur, die Agilität eines Startups.",
                  text: "Ein strukturierter Engineering-Prozess statt Ad-hoc-Arbeit. Volle Projektverantwortung mit konsistenten Qualitätsstandards — Enterprise-Qualität ohne Enterprise-Headcount.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="group rounded-xl border-l-4 border-accent bg-neutral-light p-8 shadow-sm transition-all duration-250 hover:-translate-y-0.5 hover:shadow-md dark:bg-deep-space"
                >
                  <item.icon size={32} className="text-secondary" />
                  <h3 className="mt-4 font-heading text-xl font-semibold text-primary md:text-2xl dark:text-text-primary">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-accent dark:text-accent-bright">{item.subtitle}</p>
                  <p className="mt-3 leading-relaxed text-neutral-dark/80 dark:text-text-secondary">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== SERVICES ===== */}
        <section id="services" className="bg-neutral-light px-4 py-20 md:px-6 md:py-24 dark:bg-deep-space">
          <div className="mx-auto max-w-[1200px]">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary md:text-4xl dark:text-text-primary">
              Unsere Services
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: Cpu,
                  title: "AI-Powered Development",
                  subtitle: "Software, schneller gebaut.",
                  text: "Wir bauen eure Software mit KI-Beschleunigung. Ein Senior-Architekt mit einem KI-gestützten Expertensystem liefert Delivery-Geschwindigkeit und -Breite, die normalerweise ein ganzes Team erfordert. NestJS, TypeScript, PostgreSQL — kein Spielzeug, sondern Production-Stack.",
                },
                {
                  icon: FileText,
                  title: "Documentation Automation",
                  subtitle: "Doku, die sich selbst schreibt.",
                  text: `Unser Flaggschiff-Produkt ${BRAND.PRODUCT_SHORT} generiert automatisch Compliance-Doku, technische Doku und Chatbot-Antworten aus eurem Git, Jira und Confluence. Fail-closed: lieber schweigen als lügen.`,
                },
                {
                  icon: Brain,
                  title: "AI Consulting & Strategy",
                  subtitle: "KI richtig einsetzen.",
                  text: "Welches LLM passt? Wo lohnt sich Automatisierung? Was ist Hype, was ist real? Wir beraten DACH-Unternehmen bei KI-Strategie — aus Erfahrung, nicht aus Folien.",
                },
                {
                  icon: Shield,
                  title: "DSGVO-by-Design",
                  subtitle: "Datenschutz als Architektur.",
                  text: "BYOLLM: Eure Daten verlassen euer Haus nicht. Verschlüsselung. Tenant-Isolation. DSGVO ist bei uns keine Checkliste, sondern Architekturentscheidung.",
                },
                {
                  icon: TestTubeDiagonal,
                  title: "Quality Engineering",
                  subtitle: "Testen, bevor es knallt.",
                  text: "Hunderte automatisierte Tests, OWASP LLM Top 10, EU AI Act Compliance, Golden Datasets. Wir testen KI-Systeme mit derselben Strenge wie klassische Software — plus AI-spezifische Dimensionen.",
                },
                {
                  icon: Users,
                  title: "Nearshore Partnership",
                  subtitle: "Euer Team, erweitert.",
                  text: "Gleiche Zeitzone, gleiche Sprache, gleiche Datenschutzstandards. Kein Offshore-Risiko, keine Big-4-Preise. Stuttgart-basiert, remote-first, skalierbar.",
                },
              ].map((service) => (
                <div
                  key={service.title}
                  className="group rounded-xl bg-white p-8 shadow-[0_10px_30px_rgba(10,37,64,0.08)] transition-all duration-250 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(10,37,64,0.14)] dark:bg-surface dark:shadow-none dark:hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                >
                  <service.icon size={32} className="text-secondary" />
                  <h3 className="mt-4 font-heading text-lg font-semibold text-primary md:text-xl dark:text-text-primary">
                    {service.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-accent dark:text-accent-bright">{service.subtitle}</p>
                  <p className="mt-3 text-[15px] leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
                    {service.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FOUNDER ===== */}
        <section id="founder" className="bg-white px-4 py-20 md:px-6 md:py-24 dark:bg-surface">
          <div className="mx-auto max-w-[1200px]">
            <div className="grid items-start gap-12 md:grid-cols-[280px_1fr]">
              <FounderImage />

              <div>
                <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary md:text-4xl dark:text-text-primary">
                  German Rauhut
                </h2>
                <p className="mt-1 text-lg font-medium text-accent dark:text-accent-bright">
                  Gründer, neckarshore.ai
                </p>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
                  Ehemaliger Mercedes-Benz IT — jetzt Gründer von Neckarshore AI in Stuttgart. Ich
                  baue Software mit KI-Beschleunigung und automatisiere alles, was keiner machen will.
                  Mein Flaggschiff {BRAND.PRODUCT_SHORT} dokumentiert sich selbst — weil niemand Doku schreiben will,
                  aber alle meckern wenn keine da ist.
                </p>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
                  Ein Entwickler, mehrere KI-Assistenten, und die Überzeugung dass Kontext das neue
                  Öl (in alten Schläuchen) ist.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ===== MASCHIN + S-Team — full-width teal band ===== */}
        <section className="bg-[#B2F0FF] px-4 py-20 md:px-6 md:py-24 dark:bg-[#1A4D5C]">
          <div className="mx-auto max-w-[1200px]">
            <div className="grid items-start gap-12 md:grid-cols-[280px_1fr]">
              <div className="mx-auto overflow-hidden rounded-2xl md:mx-0">
                <Image
                  src="/images/neckarshore-ai-expert-system.jpg"
                  alt="KI-Expertensystem von neckarshore.ai — spezialisierte AI-Agenten für Architektur, Quality Engineering, Dokumentation und Deployment"
                  width={288}
                  height={288}
                  sizes="288px"
                  className="rounded-2xl object-cover"
                  loading="lazy"
                />
              </div>

              <div>
                <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary md:text-4xl dark:text-text-primary">
                  Unser Ansatz
                </h2>
                <p className="mt-1 text-lg font-medium text-primary/70 dark:text-accent-bright">
                  Enterprise-Qualität ohne Enterprise-Headcount
                </p>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-primary/80 dark:text-text-secondary">
                  Ein Senior-Architekt mit 20 Jahren Enterprise-Erfahrung, unterstützt durch ein
                  KI-gestütztes Expertensystem — spezialisiert auf Architektur, Quality Engineering,
                  Dokumentation und Deployment. Jede Disziplin wird von einer dedizierten KI abgedeckt,
                  eingebettet in einen strukturierten Engineering-Prozess.
                </p>
                <p className="mt-4 max-w-2xl text-lg leading-relaxed text-primary/80 dark:text-text-secondary">
                  Das Ergebnis: Delivery-Geschwindigkeit und -Breite, die normalerweise ein ganzes Team
                  erfordert. Ein Mensch denkt, entscheidet und verantwortet. Die KI exekutiert nach
                  klaren Leitplanken.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section id="cta" className="bg-neutral-light px-4 py-20 md:px-6 md:py-24 dark:bg-deep-space">
          <div className="mx-auto max-w-[700px] text-center">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary md:text-4xl dark:text-text-primary">
              Bereit, näher zusammenzuarbeiten?
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-neutral-dark/80 dark:text-text-secondary">
              20 Minuten Kennenlerntermin — wir reden über euer Projekt, nicht über unsere Folien.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="https://calendly.com/rauhut/20min"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-8 py-3.5 text-base font-medium text-white transition-all duration-150 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
                data-track="cta_click"
              >
                Kennenlerntermin buchen
              </a>
            </div>

            <div
              id="kontakt"
              className="mx-auto mt-12 max-w-[560px] border-t border-primary/10 pt-10 text-left dark:border-text-secondary/15"
            >
              <p className="mb-5 text-center text-base text-muted dark:text-text-secondary">
                Lieber schreiben? Schick uns direkt eine Nachricht:
              </p>
              <ContactForm />
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section id="faq" className="bg-white px-4 py-20 md:px-6 md:py-24 dark:bg-surface">
          <div className="mx-auto max-w-[800px]">
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-primary md:text-4xl dark:text-text-primary">
              Häufige Fragen
            </h2>
            <div className="mt-12 space-y-6">
              {faqItems.map((item, i) => (
                <details
                  key={i}
                  className="group rounded-xl border border-primary/10 bg-neutral-light p-6 open:bg-white open:shadow-sm dark:border-text-secondary/10 dark:bg-deep-space dark:open:bg-surface"
                >
                  <summary className="cursor-pointer font-heading text-lg font-semibold text-primary list-none flex items-center justify-between dark:text-text-primary">
                    {item.q}
                    <span className="ml-4 text-accent transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-4 leading-relaxed text-neutral-dark/80 dark:text-text-secondary">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
          <script
            type="application/ld+json"
            // Safe: static FAQ + snippet data, no user input — AD-19 compliant
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqItems.map((item) => ({
                  "@type": "Question",
                  name: item.q,
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: item.a,
                  },
                })),
              }),
            }}
          />
        </section>

      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-primary/5 bg-white px-4 py-10 md:px-6 dark:border-text-secondary/10 dark:bg-surface">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 text-sm text-muted md:flex-row md:justify-between dark:text-text-secondary/60">
          <Logo size="text-xl" className="text-primary/70 dark:text-text-secondary" />
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/products" className="transition-colors hover:text-accent">
              Produkte
            </Link>
            <Link href="/impressum" className="transition-colors hover:text-accent">
              Impressum
            </Link>
            <Link href="/datenschutz" className="transition-colors hover:text-accent">
              Datenschutz
            </Link>
          </div>
          <p>
            &copy; 2026 neckarshore.ai — German Rauhut, IT Consulting &amp; Digital Ventures
          </p>
        </div>
        <div className="mt-4 flex flex-col items-center gap-1">
          <p className="text-center text-xs text-muted dark:text-text-tertiary">Stuttgart, Deutschland</p>
          <div className="text-muted dark:text-text-tertiary">
            <LiveTicker fetchedAt={new Date().toISOString()} />
          </div>
          {/* Internal design-system reference — deliberately discreet ("es ist für mich,
              keiner soll suchen"). noindex, not in the sitemap, not in on-site search. */}
          <Link
            href="/style-guide"
            className="text-xs text-muted transition-colors hover:text-accent dark:text-text-tertiary dark:hover:text-accent-bright"
          >
            Style Guide
          </Link>
        </div>
      </footer>
    </>
  );
}
