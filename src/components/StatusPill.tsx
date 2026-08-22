/**
 * StatusPill — the BOTTOM-LEFT corner of every product/skill/website card.
 *
 * Part of the unified card principle (2026-06-22). Every card on the products
 * surface follows the same four-corner layout:
 *
 *   ┌───────────────────────────────────────────────┐
 *   │ Title (top-left)        GitHub / Website ↗ (TR) │
 *   │   … description / capabilities …                │
 *   │ [StatusPill] (BL)            Mehr erfahren → (BR)│
 *   └───────────────────────────────────────────────┘
 *
 * The pill is a single short status word, muted + uppercase, identical styling on
 * every card so the surface reads as one system. Sources of the label:
 *   - ProductCard (MMP / flagship / website): `statusPillLabel(item)` in portfolio.ts
 *     ("Live" / "In Entwicklung"). Honest per product — e.g. omnopsis shows
 *     "In Entwicklung" (matches its page), not "Live", despite a flagship status flag.
 *   - SkillCard: the skill's maturity badge ("Beta") or, for the private reference
 *     skill, its footer badge ("Referenz-Beispiel"). The OSS license sits as small
 *     text next to the pill.
 *
 * See docs/card-layout.md for the full principle.
 */
export function StatusPill({ label }: { label: string }) {
  return (
    <span className="shrink-0 rounded-full bg-primary/5 px-3 py-1 text-xs font-medium uppercase tracking-wider text-muted dark:bg-text-secondary/10 dark:text-text-secondary">
      {label}
    </span>
  );
}
