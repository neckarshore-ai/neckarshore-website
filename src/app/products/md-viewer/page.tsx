import type { Metadata } from "next";
import Image from "next/image";
import ImageModal from "@/components/ImageModal";
import ProductDetailPage, {
  productDetailMetadata,
} from "@/components/ProductDetailPage";

const SLUG = "md-viewer";

/** Intrinsic size of the source screenshot — passed through so next/image scales on the file's
 *  real ratio (2085 × 1206) instead of the component's 3:2 default. */
const SHOT = {
  src: "/images/products/md-viewer-split-view.png",
  width: 2085,
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
          {/* Click enlarges to 1080px wide at most — deliberately NOT full screen
              (Founder, 2026-08-15): a screenshot blown up past its own detail gets
              softer, not more readable. Viewport caps apply on top. */}
          <ImageModal
            src={SHOT.src}
            alt={SHOT.alt}
            width={SHOT.width}
            height={SHOT.height}
            maxWidthPx={1080}
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
