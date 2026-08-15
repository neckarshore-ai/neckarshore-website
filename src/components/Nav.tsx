"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import { SearchButton } from "./search/SearchButton";
import { PORTFOLIO } from "@/lib/portfolio";

const navLinksLead = [
  { href: "/#services", label: "Services", track: "nav_services" },
  { href: "/#why-nearshore", label: "Warum Nearshore", track: "nav_why-nearshore" },
  // KI-Beratung — the first nav entry that is a ROUTE rather than a homepage anchor.
  //
  // THE LABEL IS A GUARDRAIL, NOT JUST A NAME. "KI-Beratung" is offer language. It must
  // never drift into availability-for-hire language ("Beratung buchen", "Verfügbarkeit",
  // a person's calendar): the mandate offering publishes exclusively via the private
  // Erwerbs lane (C4, Founder-decided 2026-08-05), and the nav is the most visible surface
  // on the domain. Engels made the label an explicit condition of this entry, 2026-08-15.
  //
  // WHY IT SHIPS NOW rather than after a measured baseline: `inbound-log.md` has
  // `series_start: null` — the 8-week LinkedIn window has NOT begun, so anything live
  // before Serie 1 fires is baseline. Adding this entry later would be a domain-level
  // change during a running measurement. Deferring does not avoid that risk, it moves it
  // to the most expensive moment.
  { href: "/ki-beratung", label: "KI-Beratung", track: "nav_ki-beratung" },
];

const navLinksTail = [{ href: "/#founder", label: "Über uns", track: "nav_founder" }];

// Produkte dropdown — one entry per portfolio category, linking to its sub-portal page.
// Derived from the central PORTFOLIO config (single source of truth — add a category there).
const productLinks = PORTFOLIO.map((category) => ({
  href: category.href,
  label: category.navLabel,
  sub: category.subtitle,
  track: category.track,
}));

interface NavProps {
  showOssLaunch?: boolean;
}

/** Desktop "Produkte" dropdown — hover + click, Escape to close, keyboard-reachable. */
function ProductsDropdown() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <div
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
      onFocus={openNow}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      {/* "Produkte" navigates to the portal; the dropdown is a hover/focus shortcut.
          (A click-toggle conflicts with hover-open — a click after the synthetic
          mouseenter would immediately re-close it.) */}
      <Link
        href="/products"
        aria-expanded={open}
        aria-haspopup="menu"
        data-track="nav_products"
        className="flex items-center gap-1 text-sm font-medium text-primary/70 transition-colors duration-150 hover:text-accent dark:text-text-secondary/70 dark:hover:text-accent"
      >
        Produkte
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </Link>

      {open && (
        <div
          role="menu"
          className="absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 overflow-hidden rounded-xl border border-primary/10 bg-neutral-light shadow-xl dark:border-text-secondary/15 dark:bg-surface"
        >
          {productLinks.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              role="menuitem"
              data-track={p.track}
              onClick={() => setOpen(false)}
              className="flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-primary/5 dark:hover:bg-text-secondary/10"
            >
              <span className="text-sm font-semibold text-primary dark:text-text-primary">
                {p.label}
              </span>
              <span className="text-xs text-muted dark:text-text-tertiary">{p.sub}</span>
            </Link>
          ))}
          <Link
            href="/products"
            role="menuitem"
            data-track="nav_products_all"
            onClick={() => setOpen(false)}
            className="block border-t border-primary/10 px-4 py-3 text-sm font-medium text-accent transition-colors hover:bg-primary/5 dark:border-text-secondary/15 dark:text-accent-bright dark:hover:bg-text-secondary/10"
          >
            Alle Produkte →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Nav({ showOssLaunch = false }: NavProps) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-primary/5 bg-neutral-light/80 backdrop-blur-md dark:border-text-secondary/10 dark:bg-deep-space/80">
      {/* ===== ANNOUNCEMENT STRIP — bordeaux, conditional.
          REVIEW 2026-07-25 (German Rauhut, 2026-06-25): 30-day Wiedervorlage — at review,
          switch off OSS_LAUNCH_VISIBLE / retire this strip OR replace its content with
          something new. Links to the Vault Autopilot product page (homepage OSS section
          was removed 2026-06-25). ===== */}
      {showOssLaunch && (
        <div className="bg-[#5C1A2A] px-4 py-2.5 md:px-6">
          <div className="mx-auto flex max-w-[1200px] items-center justify-center gap-2 text-[13px] text-[#F5C6D0] md:gap-3 md:text-sm">
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white md:text-xs">
              Neu
            </span>
            <span className="truncate">
              <span className="font-medium text-white">Obsidian Vault Autopilot</span>
              <span className="hidden md:inline"> — unser erstes Open-Source-Projekt ist live.</span>
            </span>
            <Link
              href="/products/obsidian-vault-autopilot"
              className="shrink-0 font-medium text-white underline-offset-4 transition-colors hover:underline hover:text-[#F5C6D0]"
              data-track="hero_teaser_oss"
            >
              Zum Projekt&nbsp;&rarr;
            </Link>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="neckarshore.ai Home">
          <Logo size="text-xl" className="text-primary/70 dark:text-text-secondary" />
        </Link>

        {/* Desktop nav — shown from lg (1024px). Below that the hamburger handles it:
            at tablet-portrait width (768px) the full desktop row crowds the logo + clips
            the CTA, so the breakpoint is lg, not md (matches the SkillCard grid). */}
        <div className="hidden items-center gap-8 lg:flex">
          {navLinksLead.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-track={link.track}
              className="text-sm font-medium text-primary/70 transition-colors duration-150 hover:text-accent dark:text-text-secondary/70 dark:hover:text-accent"
            >
              {link.label}
            </a>
          ))}
          <ProductsDropdown />
          {navLinksTail.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-track={link.track}
              className="text-sm font-medium text-primary/70 transition-colors duration-150 hover:text-accent dark:text-text-secondary/70 dark:hover:text-accent"
            >
              {link.label}
            </a>
          ))}
          <SearchButton />
          <ThemeToggle />
          <a
            href="https://calendly.com/rauhut/20min"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:bg-accent-hover hover:scale-[1.02] active:scale-[0.98]"
            data-track="cta_click"
          >
            Kennenlerntermin
          </a>
        </div>

        {/* Mobile + tablet-portrait (< lg): search + theme toggle + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <SearchButton />
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="p-2 text-primary dark:text-text-primary"
            aria-label={open ? "Menü schließen" : "Menü öffnen"}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-primary/5 bg-neutral-light px-4 pb-6 pt-4 dark:border-text-secondary/10 dark:bg-deep-space lg:hidden">
          {navLinksLead.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-track={link.track}
              onClick={() => setOpen(false)}
              className="block py-3 text-base font-medium text-primary/70 transition-colors hover:text-accent dark:text-text-secondary/70 dark:hover:text-accent"
            >
              {link.label}
            </a>
          ))}

          {/* Produkte group */}
          <p className="pt-3 text-xs font-semibold uppercase tracking-wider text-muted dark:text-text-tertiary">
            Produkte
          </p>
          {productLinks.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              data-track={p.track}
              onClick={() => setOpen(false)}
              className="block py-2 pl-3 text-base font-medium text-primary/70 transition-colors hover:text-accent dark:text-text-secondary/70 dark:hover:text-accent"
            >
              {p.label}
              <span className="ml-2 text-xs font-normal text-muted dark:text-text-tertiary">
                {p.sub}
              </span>
            </Link>
          ))}
          <Link
            href="/products"
            data-track="nav_products_all"
            onClick={() => setOpen(false)}
            className="block py-2 pl-3 text-base font-medium text-accent transition-colors hover:text-accent-hover dark:text-accent-bright"
          >
            Alle Produkte →
          </Link>

          {navLinksTail.map((link) => (
            <a
              key={link.href}
              href={link.href}
              data-track={link.track}
              onClick={() => setOpen(false)}
              className="block py-3 text-base font-medium text-primary/70 transition-colors hover:text-accent dark:text-text-secondary/70 dark:hover:text-accent"
            >
              {link.label}
            </a>
          ))}

          <a
            href="https://calendly.com/rauhut/20min"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-4 block rounded-lg bg-accent py-3 text-center text-base font-medium text-white transition-all hover:bg-accent-hover"
            data-track="cta_click"
          >
            Kennenlerntermin
          </a>
        </div>
      )}
    </nav>
  );
}
