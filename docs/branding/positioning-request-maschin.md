# MASCHIN Positioning Brief — Social Preview Cards

**From:** Linus FE, Session G (2026-04-11)
**To:** MASCHIN
**Why:** I built the social preview card system ([README](./README.md)) and generated cards for `neckarshore-website` and `obsidian-vault-autopilot`. Two more repos need cards but I don't want to guess their positioning — you own brand/messaging. This is a short, copy-paste-into-a-fresh-MASCHIN-session brief.

---

## What I need from you

For each of the two repos below, a tiny content payload that fits the fixed card template (see design system: [`docs/branding/README.md`](./README.md) in `neckarshore-website`):

| Field | Constraint | Example (from Vault Autopilot card) |
|---|---|---|
| `headline` | Main line. Short — ≤3 words ideal. | "Obsidian Vault" |
| `headlineAccent` | Second line, rendered in cyan. Short — ≤2 words ideal. Period optional. | "Autopilot." |
| `tagline` | One sentence, ≤180 chars. Plain English or German — pick per repo. | "AI-powered vault management for Claude Code. Sorts your inbox, renames your files, enriches your metadata — so you can focus on thinking instead of filing." |
| `chips` | Exactly 3 short chips. Each ≤15 chars. Labels for tech/licensing/scope. | `Skills` · `Open Source` · `MIT Licensed` |

## Reference cards (visual anchors)

Both are in `~/Developer/projects/neckarshore-website/`:

1. **`docs/branding/github-social-preview-website.jpg`** — neckarshore.ai positioning, German tagline, "Made in Germany / DSGVO-by-Design / AI-Powered"
2. **`docs/branding/github-social-preview-vault-autopilot.jpg`** — Product-under-Neckarshore positioning, English tagline, "Skills / Open Source / MIT Licensed"

Open them in Finder Quicklook or your image viewer of choice. Both share an identical brand block (N-tile + `neckarshore.ai`) and differ only in headline/tagline/chips.

---

## Repo 1: OMNOPSIS

**Context I have:**
- `~/Developer/projects/OMNOPSIS/README.md` line 1-3:
  > OMNOPSIS — AI-first documentation engine. Connects Git, Jira, and Confluence to generate compliance docs, technical documentation, and a persona-aware chatbot.
- Session-state calls OMNOPSIS the "flagship product" and refers to "OMNOPSIS Documentor" as the product positioning
- Target audience: DACH Mittelstand CTOs, enterprise-ready, "Made in Germany" / DSGVO
- Name is parked — "Documenter vs Documentor" decision deferred until product-market-fit (see pending decisions in session-state)
- Not yet public — card is aspirational, not urgent

**What I need:**
- Headline + Accent (e.g., "Documentation that" / "writes itself." or similar — your call)
- Tagline (one sentence, can be German or English — your call based on target audience)
- 3 chips — suggestions: "Made in Germany" / "DSGVO" / "NestJS" or "Enterprise" / "Self-Hosted" / "AI-Powered" — your call
- Should the wordmark stay `neckarshore.ai` (product-under-brand) or switch to `OMNOPSIS` as its own wordmark? The current system assumes brand block is fixed — if you want OMNOPSIS standalone, that's a template fork, not a config change. **Recommendation:** keep `neckarshore.ai` for now, switch later if OMNOPSIS gets its own brand system.

## Repo 2: Comedy-Execution-Engine

**Context I have:**
- `~/Developer/projects/Comedy-Execution-Engine/README.md` line 1-5:
  > Comedy-Execution-Engine (CEE) v1.0
  > Weaponized literalism meets German engineering.
  > Software-defined satire for the Human-In-The-Loop. [...] Documenting civilizational entropy with a terminal-green pulse.
- Personas: Hans (primary writer, Monty Python), Lorne (producer, second-chair)
- Aesthetic from README: terminal-green pulse, structural irony, "zero empathy, 100% execution"
- Public/private status: unclear. If private, no card needed — ask user first.

**What I need:**
- Headline + Accent — tone is satirical/absurdist, card should match. E.g., "Weaponized" / "Literalism." or "Comedy." / "Executed."
- Tagline — one sentence, English (the README is English).
- 3 chips — suggestions: "Stage Logic" / "Human-In-The-Loop" / "Open Source" or similar
- **Open question:** should this card visually depart from the neckarshore.ai template (e.g., terminal-green instead of cyan accent) to match the CEE aesthetic, or stay template-consistent? **Recommendation:** stay template-consistent — the brand block + cyan accent is the signature of "built by neckarshore.ai", and departing dilutes it. But your call.

---

## Delivery format

Drop your answers back as a markdown block like this (I'll copy-paste into `scripts/og-cards.config.mjs`):

```js
// OMNOPSIS
headline: "...",
headlineAccent: "...",
tagline: "...",
chips: [
  { text: "...", variant: "dot" },
  { text: "...", variant: "plain" },
  { text: "...", variant: "accent" },
],

// Comedy-Execution-Engine
headline: "...",
headlineAccent: "...",
tagline: "...",
chips: [
  { text: "...", variant: "dot" },
  { text: "...", variant: "plain" },
  { text: "...", variant: "accent" },
],
```

Then either a fresh Linus session or I myself (in my next invocation) generate the cards with `node scripts/generate-og-image.mjs` and manual-upload to the respective GitHub repo settings.

---

## Timeline

Not urgent. Launch pipeline is blocked on Obi/Vault Autopilot steps, not on these cards. Anytime in the next 2-3 weeks.
