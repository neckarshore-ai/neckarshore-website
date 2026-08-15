# Branding Assets — Social Preview Cards

Source of truth for all social preview / OpenGraph / GitHub repo card visuals
across the neckarshore.ai ecosystem.

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

| # | Target | Config entry | Output file | Status |
|---|---|---|---|---|
| 1 | neckarshore.ai site OG | `neckarshore.ai OG (website SSR)` | `public/og-image.jpg` | Live, referenced in `src/app/layout.tsx` |
| 2 | GitHub: `neckarshore-website` | `GitHub Repo Card — neckarshore-website` | `docs/branding/github-social-preview-website.jpg` | Generated, awaiting manual upload to GitHub repo Settings |
| 3 | GitHub: `obsidian-vault-autopilot` | `GitHub Repo Card — obsidian-vault-autopilot` | `docs/branding/github-social-preview-vault-autopilot.jpg` | Generated, awaiting manual upload to GitHub repo Settings |
| 4 | GitHub: `OMNOPSIS` | `GitHub Repo Card — OMNOPSIS` | — | Skipped — awaiting MASCHIN positioning brief ([positioning-request-maschin.md](./positioning-request-maschin.md)) |
| 5 | GitHub: `Comedy-Execution-Engine` | `GitHub Repo Card — Comedy-Execution-Engine` | — | Skipped — awaiting MASCHIN positioning brief ([positioning-request-maschin.md](./positioning-request-maschin.md)) |

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
