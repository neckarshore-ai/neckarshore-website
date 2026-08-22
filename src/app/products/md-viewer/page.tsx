import type { Metadata } from "next";
import Image from "next/image";
import ImageModal from "@/components/ImageModal";
import ProductDetailPage, {
  productDetailMetadata,
} from "@/components/ProductDetailPage";

const SLUG = "md-viewer";

/** Intrinsic size of the source screenshot — passed through so next/image scales on the file's
 *  real ratio (1901 × 1206) instead of the component's 3:2 default.
 *
 *  REPLACED 2026-08-15 (Founder: the enlargement was hard to read). The first shot was
 *  2085 × 1206 of the same window at a smaller type size; this one is a tighter crop, so
 *  the same pixel budget carries larger glyphs. Narrower file, MORE readable — which is
 *  why the zoom cap below moves in the opposite direction to the width. */
const SHOT = {
  src: "/images/products/md-viewer-split-view.jpg",
  width: 1901,
  height: 1206,
  alt: "md-viewer in geteilter Ansicht: links das gerenderte Markdown-Dokument, rechts der Quelltext mit farblicher Syntax-Hervorhebung.",
};

export function generateMetadata(): Metadata {
  return productDetailMetadata({
    slug: SLUG,
    title: "md-viewer — Markdown lesen ohne Editor | neckarshore.ai",
  });
}

export default function MdViewerPage() {
  return (
    <ProductDetailPage
      slug={SLUG}
      liveCtaNote="Läuft vollständig im Browser — die Datei wird nicht hochgeladen."
      media={
        <figure>
          {/* Click enlarges to the file's OWN width (1901px) at most, viewport caps on top.
              Still deliberately not "full screen at any size": the rule has not changed —
              a screenshot scaled past its own detail gets softer, not more readable.
              What changed is the file. The cap was 1080 against a 2085px-wide shot whose
              type was too small to survive the downscale; this replacement carries larger
              glyphs, so letting it reach its native width now ADDS legibility instead of
              spending it. Cap and source width are the same number on purpose — if the
              image is ever swapped again, move this with it (Founder-reported 2026-08-15:
              "in der Vergrößerung sehr schlecht lesbar"). */}
          <ImageModal
            src={SHOT.src}
            alt={SHOT.alt}
            width={SHOT.width}
            height={SHOT.height}
            maxWidthPx={SHOT.width}
            className="group block w-full cursor-zoom-in rounded-xl border border-primary/10 bg-white/40 p-1 transition-colors hover:border-accent dark:border-text-secondary/15 dark:bg-white/[0.03] dark:hover:border-accent-bright"
          >
            <Image
              src={SHOT.src}
              alt={SHOT.alt}
              width={SHOT.width}
              height={SHOT.height}
              sizes="(max-width: 768px) 100vw, 720px"
              className="h-auto w-full rounded-lg"
            />
          </ImageModal>
          <figcaption className="mt-3 text-sm text-muted dark:text-text-tertiary">
            Geteilte Ansicht: links gerendert, rechts der Quelltext.{" "}
            <span className="whitespace-nowrap">Zum Vergrößern klicken.</span>
          </figcaption>
        </figure>
      }
    />
  );
}
