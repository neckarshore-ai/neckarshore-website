import { buildLlmsFullText } from "@/lib/llms-full";

// Statically generated at build time → served from the CDN. The expanded companion to
// the derived /llms.txt index: same overview + the full Markdown of every md-backed
// indexable product page (llmstxt.org "full" variant). No runtime compute, no cookies.
export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsFullText(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
