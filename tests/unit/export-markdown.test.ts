/**
 * Unit tests for the Markdown-export core (src/lib/export/*).
 *
 * The feature: a server-side endpoint serves the CLEAN SOURCE markdown of a content
 * page (frontmatter-derived header + raw body + data-driven sections like the FAQ),
 * so the export round-trips losslessly back into the authored .md files and is ideal
 * for Obsidian / LLM use. These tests pin the three pure pieces:
 *   - serialize.ts   → buildMarkdownDocument(), faqToMarkdown() (content-agnostic core)
 *   - builders/product.ts → buildProductMarkdown() (neckarshore product wiring)
 *   - resolve.ts     → resolveExport() (path → builder, null for non-exportable)
 *
 * Run: `npm run test:unit`
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMarkdownDocument, faqToMarkdown, tableToMarkdown } from "../../src/lib/export/serialize";
import { buildProductMarkdown } from "../../src/lib/export/builders/product";
import { buildWebsiteMarkdown } from "../../src/lib/export/builders/website";
import { extraSectionsForSlug } from "../../src/lib/export/product-sections";
import { resolveExport } from "../../src/lib/export/resolve";

const OPTS = { baseUrl: "https://neckarshore.ai", exportedAt: "2026-06-28" };

// ── serialize.ts ────────────────────────────────────────────────────────────

test("TC-EXP-U01: buildMarkdownDocument emits YAML frontmatter, H1, lead blockquote, body and sections in order", () => {
  const md = buildMarkdownDocument({
    frontmatter: {
      title: "ClearPath",
      source: "https://neckarshore.ai/products/clearpath",
      site: "neckarshore.ai",
      exported: "2026-06-28",
    },
    title: "ClearPath — eine mentale Firewall",
    lead: "Beschreibe eine Entscheidung.",
    body: "## Das Problem\nDie meisten Fehlentscheidungen.",
    sections: [{ heading: "Häufige Fragen", body: "### Was?\n\nEine Antwort." }],
  });

  // Frontmatter block first, fenced by ---
  assert.match(md, /^---\n/, "must open with a YAML frontmatter fence");
  assert.match(md, /\ntitle: "ClearPath"\n/);
  assert.match(md, /\nsource: "https:\/\/neckarshore\.ai\/products\/clearpath"\n/);
  assert.match(md, /\nsite: "neckarshore\.ai"\n/);
  assert.match(md, /\nexported: "2026-06-28"\n/);

  // Body structure, in order
  const fmEnd = md.indexOf("\n---\n", 4) + 5;
  const afterFm = md.slice(fmEnd);
  assert.match(afterFm, /# ClearPath — eine mentale Firewall/);

  const h1 = md.indexOf("# ClearPath — eine mentale Firewall");
  const lead = md.indexOf("> Beschreibe eine Entscheidung.");
  const body = md.indexOf("## Das Problem");
  const faq = md.indexOf("## Häufige Fragen");
  assert.ok(h1 < lead && lead < body && body < faq, "order: H1 → lead → body → FAQ section");
  assert.match(md, /## Häufige Fragen\n\n### Was\?/);
  assert.ok(md.endsWith("\n"), "file ends with a single trailing newline");
});

test("TC-EXP-U02: buildMarkdownDocument escapes double-quotes in frontmatter values", () => {
  const md = buildMarkdownDocument({
    frontmatter: { title: 'He said "hi"' },
    title: "x",
    body: "",
  });
  assert.match(md, /\ntitle: "He said \\"hi\\""\n/);
});

test("TC-EXP-U03: buildMarkdownDocument omits the lead blockquote when no lead is given", () => {
  const md = buildMarkdownDocument({
    frontmatter: { title: "x" },
    title: "Title",
    body: "Body text.",
  });
  assert.doesNotMatch(md, /\n> /, "no blockquote when lead is absent");
});

test("TC-EXP-U04: faqToMarkdown renders each Q as H3 and the answer below it", () => {
  const out = faqToMarkdown([
    { q: "Was macht es?", a: "Es exportiert." },
    { q: "Wie?", a: "Server-seitig." },
  ]);
  assert.equal(out, "### Was macht es?\n\nEs exportiert.\n\n### Wie?\n\nServer-seitig.");
});

test("TC-EXP-U09: tableToMarkdown renders a GFM table and escapes pipes in cells", () => {
  const out = tableToMarkdown(
    ["A", "B"],
    [
      ["1", "2"],
      ["x|y", "z"],
    ],
  );
  assert.equal(out, "| A | B |\n| --- | --- |\n| 1 | 2 |\n| x\\|y | z |");
});

// ── product-sections.ts (per-slug tables, extensible) ────────────────────────

test("TC-EXP-U10: extraSectionsForSlug('clearpath') returns the biases table with terms + wikipedia links", () => {
  const sections = extraSectionsForSlug("clearpath");
  assert.equal(sections.length, 1);
  assert.equal(sections[0].heading, "Die wichtigsten Denkfehler");
  const body = sections[0].body;
  assert.match(body, /\| Denkfehler \| In einem Satz \| Mehr \|/);
  assert.match(body, /\| --- \| --- \| --- \|/);
  assert.match(body, /Bestätigungsfehler \(Confirmation Bias\)/);
  assert.match(body, /\[Wikipedia ↗\]\(https:\/\/de\.wikipedia\.org\/wiki\//);
});

test("TC-EXP-U11: extraSectionsForSlug returns [] for a product without a table", () => {
  assert.deepEqual(extraSectionsForSlug("snakeoil-check"), []);
});

// ── builders/product.ts ──────────────────────────────────────────────────────

test("TC-EXP-U05: buildProductMarkdown assembles a real product (clearpath) from its .md source + FAQ", () => {
  const result = buildProductMarkdown("clearpath", OPTS);
  assert.ok(result, "clearpath has a .md source → must export");
  assert.equal(result.filename, "neckarshore.ai - clearpath.md");

  const md = result.markdown;
  // Frontmatter from clearpath.md frontmatter
  assert.match(md, /\nsource: "https:\/\/neckarshore\.ai\/products\/clearpath"\n/);
  assert.match(md, /\nexported: "2026-06-28"\n/);
  assert.match(md, /\nsite: "neckarshore\.ai"\n/);
  // Raw body content from the source file (a known heading)
  assert.match(md, /## Das Problem/);
  // Data-driven FAQ section, pulled from product-faqs.ts (a known question)
  assert.match(md, /## Häufige Fragen/);
  assert.match(md, /### Was macht ClearPath\?/);
});

test("TC-EXP-U06: buildProductMarkdown returns null for a slug with no .md source", () => {
  assert.equal(buildProductMarkdown("does-not-exist", OPTS), null);
});

test("TC-EXP-U12: buildProductMarkdown('clearpath') includes the biases table, ordered before the FAQ", () => {
  const md = buildProductMarkdown("clearpath", OPTS)!.markdown;
  assert.match(md, /## Die wichtigsten Denkfehler/);
  assert.match(md, /\| Denkfehler \| In einem Satz \| Mehr \|/);
  assert.match(md, /Bestätigungsfehler \(Confirmation Bias\)/);
  const table = md.indexOf("## Die wichtigsten Denkfehler");
  const faq = md.indexOf("## Häufige Fragen");
  assert.ok(table > 0 && faq > 0 && table < faq, "biases table must come before the FAQ (mirrors the page)");
});

test("TC-EXP-U13: buildProductMarkdown filename leads with the site host (self-identifying across vaults)", () => {
  // Founder convention 2026-06-28: many sites' exports may land in one Obsidian vault /
  // LLM context, so the download filename carries the site host: "<host> - <slug>.md".
  const result = buildProductMarkdown("clearpath", OPTS)!;
  assert.equal(result.filename, "neckarshore.ai - clearpath.md");
  assert.ok(result.filename.startsWith("neckarshore.ai - "), "filename leads with the site host + separator");
  assert.ok(result.filename.endsWith("clearpath.md"), "slug + .md extension preserved at the end");
});

// ── builders/website.ts ──────────────────────────────────────────────────────

test("TC-EXP-U14: buildWebsiteMarkdown assembles a real case study (neckarshore) from its .md source + FAQ", () => {
  const result = buildWebsiteMarkdown("neckarshore", OPTS);
  assert.ok(result, "the neckarshore case study has a .md source → must export");
  assert.equal(result.filename, "neckarshore.ai - neckarshore.md");

  const md = result.markdown;
  // Frontmatter from websites/neckarshore.md, with the export header fields.
  assert.match(md, /\nsource: "https:\/\/neckarshore\.ai\/products\/websites\/neckarshore"\n/);
  assert.match(md, /\nsite: "neckarshore\.ai"\n/);
  assert.match(md, /\nexported: "2026-06-28"\n/);
  // Distinctive website frontmatter: status + the tech-stack chips as a machine list.
  assert.match(md, /\nstatus: "Live"\n/);
  assert.match(md, /\nstack: ".*Next\.js.*"\n/);
  // Raw body content from the source file (a known case-study heading).
  assert.match(md, /## Was war die Ausgangslage\?/);
  // Data-driven FAQ section, pulled from product-faqs.ts (a known question).
  assert.match(md, /## Häufige Fragen/);
  assert.match(md, /### Wie ist neckarshore\.ai gebaut\?/);
});

test("TC-EXP-U15: buildWebsiteMarkdown returns null for a slug with no .md source", () => {
  assert.equal(buildWebsiteMarkdown("does-not-exist", OPTS), null);
});

// ── resolve.ts ───────────────────────────────────────────────────────────────

test("TC-EXP-U07: resolveExport maps a product path (with or without trailing slash) to the product builder", () => {
  const a = resolveExport("/products/clearpath", OPTS);
  assert.ok(a, "/products/clearpath must resolve");
  assert.equal(a.filename, "neckarshore.ai - clearpath.md");

  const b = resolveExport("/products/clearpath/", OPTS);
  assert.ok(b, "trailing slash must still resolve");
});

test("TC-EXP-U16: resolveExport maps a two-segment website path to the website builder, not the product one", () => {
  const a = resolveExport("/products/websites/neckarshore", OPTS);
  assert.ok(a, "/products/websites/neckarshore must resolve");
  assert.equal(a.filename, "neckarshore.ai - neckarshore.md");
  // The two-segment website route must NOT be swallowed by the single-segment product
  // pattern — that would read products/websites.md (which doesn't exist) and 404.
  assert.match(a.markdown, /\/products\/websites\/neckarshore/);

  const b = resolveExport("/products/websites/neckarshore/", OPTS);
  assert.ok(b, "trailing slash must still resolve");
});

test("TC-EXP-U08: resolveExport returns null for non-exportable or malicious paths", () => {
  assert.equal(resolveExport("/", OPTS), null, "home has no source");
  assert.equal(resolveExport("/products/", OPTS), null, "products index has no slug");
  assert.equal(resolveExport("/products/websites", OPTS), null, "websites sub-portal index has no products/.md");
  assert.equal(resolveExport("/products/websites/", OPTS), null, "websites index trailing slash has no slug");
  assert.equal(resolveExport("/datenschutz", OPTS), null, "legal is hand-written JSX");
  assert.equal(resolveExport("/products/../../etc/passwd", OPTS), null, "no path traversal");
  assert.equal(resolveExport("/products/websites/../../etc/passwd", OPTS), null, "no path traversal on the website route");
  assert.equal(resolveExport("/products/Clearpath", OPTS), null, "slug charset is lowercase a-z0-9-");
});
