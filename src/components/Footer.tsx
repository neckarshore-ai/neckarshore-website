import Link from "next/link";
import Logo from "./Logo";

/**
 * Shared site footer for content-surface pages (products).
 * Carries the internal links that wire the hub-and-spoke graph: Produkte
 * alongside the legal pages.
 */
export default function Footer() {
  return (
    <footer className="border-t border-primary/5 bg-white px-4 py-10 md:px-6 dark:border-text-secondary/10 dark:bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 text-sm text-muted dark:text-text-tertiary md:flex-row md:justify-between">
        <Link href="/">
          <Logo size="text-xl" />
        </Link>
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
        <p>&copy; 2026 neckarshore.ai</p>
      </div>
    </footer>
  );
}
