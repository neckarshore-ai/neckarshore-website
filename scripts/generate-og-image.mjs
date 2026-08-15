/**
 * Social Preview Image Generator — config-driven
 *
 * Reads card definitions from `scripts/og-cards.config.mjs` and renders each to JPEG.
 * All cards share the same template: brand block (top), headline + tagline (middle),
 * chips (bottom), over a dark gradient + grid background.
 *
 * Design system: see docs/branding/README.md — the source of truth for sizes, colors,
 * padding rules, and safe-border requirements. Changes here should stay in sync with
 * that document.
 *
 * Run: node scripts/generate-og-image.mjs
 */

import { chromium } from "@playwright/test";
import { readFile, stat, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { cards } from "./og-cards.config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

async function fileToDataUrl(relPath, mime) {
  const buf = await readFile(resolve(ROOT, relPath));
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const assets = {
  spaceGrotesk: await fileToDataUrl("src/fonts/SpaceGrotesk-Variable.woff2", "font/woff2"),
  inter: await fileToDataUrl("src/fonts/Inter-Variable.woff2", "font/woff2"),
  nLogo: await fileToDataUrl("public/images/neckarshore-logo-n.jpg", "image/jpeg"),
};

/** Fixed design tokens (DO NOT vary per card — change here propagates everywhere). */
const DESIGN = {
  // Brand block — identical on every card
  markHeight: 56, // px
  wordmarkSize: 46, // px
  // Headline
  headlineSize: 88, // px — large default; width-responsive variants below
  headlineLetterSpacing: -2.6, // px
  // Tagline
  taglineSize: 30, // px
  taglineMarginTop: 24, // px
  // Chips
  chipSize: 22, // px
  chipGap: 14, // px
  // Colors — from src/app/globals.css
  color: {
    bg1: "#0B1220",
    bg2: "#0F172A",
    bg3: "#0A1020",
    glowAccent: "rgba(34, 211, 238, 0.14)",
    glowPrimary: "rgba(14, 116, 144, 0.22)",
    accent: "#0E7490", // --color-accent
    accentBright: "#22D3EE", // --color-accent-bright
    textPrimary: "#F8FAFC",
    textSecondary: "#CBD5E1", // --color-text-secondary (dark)
    textTertiary: "#94A3B8",
    gridLine: "rgba(148, 163, 184, 0.05)",
    chipBorder: "rgba(148, 163, 184, 0.25)",
    chipBg: "rgba(30, 41, 55, 0.55)",
    chipAccentBorder: "rgba(34, 211, 238, 0.45)",
  },
};

/**
 * Card content contract. All cards must provide:
 *   - width, height (px)
 *   - padding (px from frame edge; must satisfy safe-border rules — see README)
 *   - headline (string, can use \n for line break)
 *   - headlineAccent (string, optional — rendered in accent color on its own line)
 *   - tagline (string)
 *   - chips: Array<{ text: string, variant?: "dot" | "plain" | "accent" }>
 *
 * Brand block is always "neckarshore.ai" — identical on every card, no variation.
 * Lowercase by brand decision (Founder, 2026-08-15); do NOT re-add text-transform: uppercase.
 */
function renderCard(card) {
  const { width, height, padding, headline, headlineAccent, tagline, chips, accentInline } = card;
  const D = DESIGN;
  const taglineSize = card.taglineSize ?? D.taglineSize;

  // accentInline: headline + accent on ONE line (accent keeps the cyan color).
  // Default (no flag): accent renders as a second line, as the GitHub/site cards expect.
  const headlineHtml = headlineAccent
    ? accentInline
      ? `${escapeHtml(headline)}${card.accentJoin ?? " "}<span class="accent">${escapeHtml(headlineAccent)}</span>`
      : `${escapeHtml(headline)}<br/><span class="accent">${escapeHtml(headlineAccent)}</span>`
    : escapeHtml(headline).replace(/\n/g, "<br/>");

  const chipsHtml = chips
    .map((c) => {
      const cls = c.variant === "accent" ? "chip accent" : "chip";
      const dot = c.variant === "dot" ? '<span class="dot"></span>' : "";
      return `<div class="${cls}">${dot}${escapeHtml(c.text)}</div>`;
    })
    .join("\n        ");

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    @font-face {
      font-family: "Space Grotesk";
      src: url(${assets.spaceGrotesk}) format("woff2");
      font-weight: 300 700;
      font-display: block;
    }
    @font-face {
      font-family: "Inter";
      src: url(${assets.inter}) format("woff2");
      font-weight: 100 900;
      font-display: block;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      width: ${width}px;
      height: ${height}px;
      background:
        radial-gradient(1200px 600px at 85% 110%, ${D.color.glowAccent}, transparent 60%),
        radial-gradient(900px 500px at 10% -20%, ${D.color.glowPrimary}, transparent 60%),
        linear-gradient(180deg, ${D.color.bg1} 0%, ${D.color.bg2} 55%, ${D.color.bg3} 100%);
      color: ${D.color.textPrimary};
      font-family: "Inter", -apple-system, system-ui, sans-serif;
      position: relative;
      overflow: hidden;
    }
    .grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(${D.color.gridLine} 1px, transparent 1px),
        linear-gradient(90deg, ${D.color.gridLine} 1px, transparent 1px);
      background-size: 60px 60px;
      mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 95%);
      pointer-events: none;
    }
    .frame {
      position: absolute;
      inset: ${padding}px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      line-height: 1;
    }
    .mark {
      display: block;
      height: ${D.markHeight}px;
      width: auto;
      border-radius: 0;
    }
    .brand-text {
      font-family: "Space Grotesk", sans-serif;
      font-weight: 600;
      font-size: ${D.wordmarkSize}px;
      text-transform: lowercase;
      letter-spacing: -1px;
      color: ${D.color.textSecondary};
      line-height: 1;
    }
    .brand-text .dotai { color: ${D.color.accent}; }
    .headline {
      font-family: "Space Grotesk", sans-serif;
      font-weight: 700;
      font-size: ${D.headlineSize}px;
      line-height: 1.02;
      letter-spacing: ${D.headlineLetterSpacing}px;
      color: ${D.color.textPrimary};
      max-width: ${Math.round(width * 0.86)}px;
    }
    .headline .accent { color: ${D.color.accentBright}; font-weight: 700; }
    .tagline {
      margin-top: ${D.taglineMarginTop}px;
      font-family: "Inter", sans-serif;
      font-size: ${taglineSize}px;
      line-height: 1.35;
      color: ${D.color.textTertiary};
      font-weight: 400;
      letter-spacing: -0.2px;
      max-width: ${Math.round(width * 0.8)}px;
    }
    .chips {
      display: flex;
      gap: ${D.chipGap}px;
      align-items: center;
    }
    .chip {
      padding: 12px 22px;
      border-radius: 999px;
      border: 1px solid ${D.color.chipBorder};
      background: ${D.color.chipBg};
      color: #E2E8F0;
      font-family: "Inter", sans-serif;
      font-size: ${D.chipSize}px;
      font-weight: 500;
      letter-spacing: 0.1px;
    }
    .chip.accent {
      border-color: ${D.color.chipAccentBorder};
      color: ${D.color.accentBright};
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: ${D.color.accentBright};
      display: inline-block;
      margin-right: 10px;
      box-shadow: 0 0 10px ${D.color.accentBright};
      vertical-align: middle;
    }
  </style></head><body>
    <div class="grid"></div>
    <div class="frame">
      <div class="brand" aria-label="neckarshore.ai">
        <img class="mark" src="${assets.nLogo}" alt="" />
        <span class="brand-text">eckarshore<span class="dotai">.ai</span></span>
      </div>
      <div>
        <div class="headline">${headlineHtml}</div>
        <div class="tagline">${escapeHtml(tagline)}</div>
      </div>
      <div class="chips">
        ${chipsHtml}
      </div>
    </div>
  </body></html>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const browser = await chromium.launch();

for (const card of cards) {
  if (card.skip) {
    console.log(`[SKIP] ${card.label}  (reason: ${card.skipReason ?? "flagged"})`);
    continue;
  }
  const context = await browser.newContext({
    viewport: { width: card.width, height: card.height },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.setContent(renderCard(card), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const outPath = resolve(ROOT, card.dest);
  await mkdir(dirname(outPath), { recursive: true });
  await page.screenshot({
    path: outPath,
    type: "jpeg",
    quality: 88,
    fullPage: false,
    clip: { x: 0, y: 0, width: card.width, height: card.height },
  });
  await context.close();

  const s = await stat(outPath);
  const kb = (s.size / 1024).toFixed(1);
  const limit = card.maxKB ?? 1024;
  const ok = s.size <= limit * 1024 ? "OK" : "OVER";
  console.log(`[${ok}] ${card.label}`);
  console.log(`       ${card.dest}  ${card.width}x${card.height}  ${kb} KB  (limit ${limit} KB)`);
  if (s.size > limit * 1024) {
    console.warn("       WARNING: exceeds limit");
  }
}

await browser.close();
console.log(`\nDone. ${cards.filter((c) => !c.skip).length} card(s) generated.`);
