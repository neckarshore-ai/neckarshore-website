import type { Metadata } from "next";
import ProductDetailPage, {
  productDetailMetadata,
} from "@/components/ProductDetailPage";

const SLUG = "md-viewer";

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
    />
  );
}
