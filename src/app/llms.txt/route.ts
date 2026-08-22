import { buildLlmsIndexText } from "@/lib/llms-index";

// Statically generated at build time → served from the CDN. Replaces the former
// hand-written public/llms.txt (deleted 2026-08-15): the product tree, the audited test
// figure and the date are derived, so the index cannot fall behind the site again.
// No runtime compute, no cookies.
export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsIndexText(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
