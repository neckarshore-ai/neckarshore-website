# Branding Assets — Social Preview Cards

The **design rules** for every social preview / OpenGraph / GitHub repo card visual across
the neckarshore.ai ecosystem: what is fixed, what varies per card, which format targets
exist and why.

> **What this document is NOT the source of truth for: the card inventory.**
> That lives in `scripts/og-cards.config.mjs`. This file used to copy the list and drifted
> badly (5 named vs 23 configured, finished uploads reported as pending — corrected
> 2026-08-15). Rules belong in prose; inventories belong in the config that generates them.

> **Before changing anything in this document or `scripts/generate-og-image.mjs`:**
> the current system was locked in during 2026-04-11 Session G after two rounds
> of visual review. Random drift is the enemy. If you think you need to tweak a
> color, font size, or padding, first read the "Fixed vs. Variable" section below.

---

## How to add a new card

1. Open `scripts/og-cards.config.mjs`.
2. Copy the nearest existing entry (Website GitHub or Vault Autopilot GitHub).
3. Change only: `label`, `dest`, `headline`, `headlineAccent`, `tagline`, `chips`.
4. Run:
   ```bash
   node scripts/generate-og-image.mjs
   ```
5. Open the generated file, eyeball check it, commit.

Do NOT duplicate the HTML template or copy-paste render logic. The generator is
config-driven on purpose — every card shares the same visual DNA.

---

## Fixed vs. Variable

**Fixed — do not change per card:**

| Element | Value | Source |
|---|---|---|
| Brand block | N-Tile JPEG + `eckarshore.ai` Space Grotesk, lowercase (Founder-Entscheidung 2026-08-15) | `public/images/neckarshore-logo-n.jpg`, matches `src/components/Logo.tsx` |
| Brand block size | 56px mark height, 46px wordmark | `DESIGN.markHeight`, `DESIGN.wordmarkSize` |
| Background | Radial cyan glow (bottom-right) + radial primary glow (top-left) + vertical slate gradient | `DESIGN.color.bg1/bg2/bg3` |
| Grid overlay | 60px × 60px faint slate lines, radial mask | fixed |
| Headline font | Space Grotesk 700, 88px, letter-spacing −2.6 | `DESIGN.headlineSize` |
| Tagline font | Inter 400, 30px | `DESIGN.taglineSize` |
| Accent color (headline accent + chip accent) | `#22D3EE` (accent-bright, dark-mode token) | `src/app/globals.css` |
| Wordmark accent `.AI` | `#0E7490` (brand accent) | `src/app/globals.css` |
| Chip pill | 12/22 padding, 999px radius, 22px Inter 500 | fixed |
| JPEG quality | 88 | fixed — tradeoff tested, >88 bloats past 200 KB |

**Variable — change per card:**

- `headline` (string, main line)
- `headlineAccent` (string, cyan-colored second line, optional)
- `tagline` (string, body copy under headline)
- `chips` (array of `{ text, variant }`, max 3 chips recommended)
- `width`, `height`, `padding` — only when switching between format targets (see below)

---

## Format targets

| Target | Dimensions | Padding | Max KB | Notes |
|---|---|---|---|---|
| OpenGraph / Twitter Card (website) | 1200 × 630 | 72 | 200 | Twitter `summary_large_image`. Served by Next.js from `public/og-image.jpg`, referenced in `src/app/layout.tsx` metadata. |
| GitHub Repo Social Preview | 1280 × 640 | 80 | 1024 | Uploaded manually via GitHub repo Settings → Social Preview. 40pt safe border — 80 CSS px padding satisfies it with margin. |

### Why 1200 × 630 vs 1280 × 640

- OpenGraph / Facebook / LinkedIn / Twitter / Discord / Slack all accept 1200 × 630 as the canonical `summary_large_image` aspect.
- GitHub specifically recommends 1280 × 640 with a 40pt safe border. Cards uploaded there get cropped on narrow surfaces, so the safe border matters. We use 80 CSS px padding (~60pt) to give headroom.
- Both fit the same content well because the aspect ratio difference is tiny (1.905 vs 2.0).

### JPEG, not PNG

PNG at these dimensions with gradients + grid lands around 600 KB — over the OG budget. JPEG at quality 88 lands around 80–90 KB with no perceptible quality loss on dark gradient backgrounds. Both use baseline JPEG so they work in every scraper (LinkedIn, Slack, Discord, GitHub, X, Mastodon).

### No WebP

OG scraper support for WebP is patchy. A single well-compressed JPEG serves every client reliably. If we ever add WebP, it must be alongside the JPEG fallback, not as a replacement.

---

## Current card inventory

> **Important:** this section deliberately does **not** list the cards one by one.
> `scripts/og-cards.config.mjs` is the source of truth, and a hand-kept copy of it in this
> file is exactly what went wrong before: the table below used to name 5 cards while the
> config produced 23, and it reported uploads as pending that had been done weeks earlier.
> What is written here is what the config **cannot** tell you — the two blocked cards and
> the upload state of the live GitHub surfaces.

**To see the actual inventory, ask the config, not this document:**

```bash
grep 'label:\|dest:' scripts/og-cards.config.mjs
```

**Counts at the last audit (2026-08-15), so a future reader can tell drift from growth:**

| # | Group | Count | Output |
|---|---|---|---|
| 1 | Site OG | 1 | `public/og-image.jpg` |
| 2 | GitHub repo cards | 10 configured, 8 generated | `docs/branding/github-social-preview-*.jpg` |
| 3 | Per-product OG cards | 12 | `public/og/<slug>.jpg` |

The per-product cards are the ones with a real guard behind them: `tests/unit/product-og-coverage.test.mjs`
derives the expected set from the portfolio config, and `PRODUCT_OG_SLUGS` in `tests/e2e/seo.spec.ts`
asserts each page actually serves its own image. Adding a product without its card fails CI.
The GitHub repo cards have no such guard — they are uploaded by hand into a surface with no API.

### The two cards that are blocked, and why

| # | Target | Blocker |
|---|---|---|
| 1 | GitHub: `OMNOPSIS` | Awaiting MASCHIN positioning brief ([positioning-request-maschin.md](./positioning-request-maschin.md)) |
| 2 | GitHub: `Comedy-Execution-Engine` | Same brief |

Both are configured in `og-cards.config.mjs` but were never generated — the generator would
produce a card carrying positioning nobody has decided. That is the correct state, not a gap.

### Upload state of the public GitHub surfaces

Probed live 2026-08-15 by reading each repo's `og:image` meta tag: a custom upload serves
from `repository-images.githubusercontent.com`, the fallback serves from `opengraph.githubassets.com`.

| # | Repo | Visibility | Custom card live? |
|---|---|---|---|
| 1 | `neckarshore-websites/neckarshore-website` | public | yes |
| 2 | `neckarshore-ai/neckarshore-easter-eggs` | public | yes |
| 3 | `neckarshore-skills/imap-mailbox-cleanup` | public | yes |
| 4 | `neckarshore-skills/obsidian-vault-autopilot` | public | yes |

The four remaining generated cards target **private** repos (`obsidian-instagram-scraper`,
`obsidian-linkedin-scraper`, `obsidian-x-scraper`, `obsidian-social-scrapers-common`). Their
upload state is **not verifiable from outside** — an anonymous fetch of a private repo returns
a login page, not a preview tag. Recorded as unknown rather than assumed done; if one of them
goes public, re-run the probe rather than trusting this line.

**Why this whole section changed (2026-08-15):** the previous version claimed 5 cards and said
rows 2 and 3 were "awaiting manual upload to GitHub repo Settings". Both halves were false —
23 cards existed, and every checkable public repo already served its uploaded card. The
document drifted in the comfortable direction: it under-reported the work and reported finished
work as pending. Nothing gates a prose inventory, which is why this rewrite replaces the list
with a pointer to the thing that cannot lie.

---

## Manual upload workflow (GitHub)

For each GitHub repo card:

1. Open the target GitHub repo in a browser.
2. Navigate to `Settings` → `General` → scroll to `Social preview`.
3. Click `Edit` → `Upload an image...`.
4. Select the `docs/branding/github-social-preview-*.jpg` file.
5. Save.

Uploads are manual on purpose — GitHub has no API for this surface, and the file itself lives in `neckarshore-website` (not in the target repo) because it's a branding asset, not source code.

---

## Design rationale (why it looks the way it looks)

- **Dark theme only.** Consistent with `neckarshore.ai` dark mode and matches the Claude Code / developer-tool aesthetic our target audience lives in.
- **N-tile brand block, not a new logo.** We use the exact same logo component visible on the live site (`src/components/Logo.tsx`) to preserve brand consistency across site and social channels.
- **Accent-Bright (`#22D3EE`) for headline accent, Brand-Accent (`#0E7490`) for `.AI`.** The brighter cyan is the dark-mode token (WCAG AA compliant on `#0F172A`) used for focal content. The darker brand color stays as the permanent brand signature in the wordmark. This matches the A11y decision from Linus Session F.
- **Three chips max.** Reads in under one glance. "dot / plain / accent" gives three visual weights to rank the chips (highlight-first, secondary, tertiary highlight).
- **No logo-as-visual.** The current neckarshore.ai logo is a JPEG without a vector source (see backlog ticket #11). Using it as the hero visual would mean scaling a raster — unacceptable for a headline slot. Text is the hero instead.

---

## Org Avatars (GitHub organization profile pictures)

A separate, transparent-PNG system for the **GitHub organization avatars** under the
neckarshore profile. Distinct from the social-preview cards above — different generator,
different output.

**Decision (Variante A, Linus 2026-06-05):** keep the **N-monogram identical** across all
orgs (= family DNA), differentiate child orgs with a small **color-coded corner badge**
(color + letter) bottom-right. The parent org `neckarshore-ai` stays **badge-free**
(= mothership). The letter is *not* a replacement for the N — swapping the main letter per
org would destroy brand recognition.

| # | Org | Badge letter | Badge color | In-palette? |
|---|---|---|---|---|
| 1 | `neckarshore-ai` | — (none) | — | parent |
| 2 | `OMNOPSIS.AI` (flagship) | O | `#F43F5E` Rose | extension |
| 3 | `neckarshore-websites` | W | `#00B8D4` Teal | yes (accent) |
| 4 | `neckarshore-agents` | A | `#6366F1` Indigo | extension |
| 5 | `neckarshore-mmps` | M | `#F59E0B` Amber | extension |
| 6 | `neckarshore-skills` | S | `#10B981` Emerald | yes (success) |

**Why transparent + safe-area padding:** GitHub recommends ~500×500, square, <1MB, and
crops org avatars (rounded-square — and circle in some surfaces). A full-bleed tile with a
corner badge gets clipped at the rounding. The monogram sits at ~91% of a 512×512 canvas
(≈4% transparent padding each side), so the squircle corners clear GitHub's tile rounding
while the large corner badge overlaps well into the N by design (v3, 2026-06-05 review).

> **Note:** v3 is tuned for GitHub's rounded-square org display, **not** circle-safe — in a
> hard circular crop the badge corner (~304px from center) would exceed the 256px inscribed
> radius. Fine for GitHub orgs; if a circular surface is ever needed, shrink the badge or
> raise `pad` (the earlier circle-safe v1 used icon 372 / pad 70 / badge 156).

**How to (re)generate:**

1. Edit `scripts/org-avatars.config.mjs` (add/remove orgs, change letter/color).
2. Run:
   ```bash
   node scripts/generate-org-avatars.mjs
   ```
3. Output lands in `public/images/brand/org-avatars/neckarshore-org-<key>.png`.
4. Upload manually: GitHub → Org → `Settings` → `Profile` → `Upload new picture`.

**Base image:** `public/images/brand/neckarshore-icon-base.png` — currently Logo 8 at
183px raster, so 512px output is slightly soft. Badge letters already use the self-hosted
Space Grotesk woff2. Swap the base for a high-res / SVG export once the designer delivers
(backlog #11) — geometry in `DESIGN` stays unchanged, output gets crisp automatically.
