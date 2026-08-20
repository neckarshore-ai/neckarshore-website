import type { Metadata } from "next";
import Image from "next/image";
import ProductDetailPage, {
  productDetailMetadata,
} from "@/components/ProductDetailPage";

const SLUG = "kaze";

/**
 * Kaze — Produktseite in der Vorschau-Haltung.
 *
 * KEIN `liveUrl` IM FRONTMATTER, und das ist eine Entscheidung, keine Luecke: die App ist
 * nicht im App Store. Damit greift die Vorschau-Haltung des geteilten Bausteins —
 * Vorschau-Schema ohne `url` und ohne Angebot, kein "Live ausprobieren", der Ruf zur Tat
 * ist ein Gespraech. Eine strukturierte Angabe, die eine Adresse oder ein Angebot
 * behauptet, das es nicht gibt, waere eine Falschaussage an eine Maschine.
 *
 * kaze.neckarshore.ai ist ABSICHTLICH NICHT als `liveUrl` eingetragen, obwohl die Adresse
 * antwortet. Sie traegt die Produktseite der App, nicht die App — und `liveUrl` schaltet
 * im Baustein das Live-Schema samt "Live ausprobieren" scharf. Wer darauf klickte,
 * bekaeme eine weitere Textseite statt eines Produkts. Der Verweis steht deshalb im
 * Fliesstext, wo er beschrieben werden kann.
 *
 * DAS BILD IST DAS APP-ICON, nicht ein Bildschirmfoto. Zwei Gruende: es gibt noch keine
 * abgenommenen Bildschirmfotos der App, und ein zusammengesuchtes waere eine Behauptung
 * ueber einen Stand, der sich taeglich bewegt. Das Icon dagegen ist fertig, es ist
 * dasselbe, das die App traegt — dieselbe Datei aus demselben Verfahren, nicht
 * nachgezeichnet —, und es transportiert genau das, was die Seite behauptet: ein Zeichen,
 * viel Ruhe drumherum.
 */
const ICON = {
  src: "/images/products/kaze-icon.png",
  size: 512,
  alt: "Das Kaze-App-Icon: das japanische Zeichen 風 für Wind, hell auf zinnoberrotem Grund.",
};

export function generateMetadata(): Metadata {
  return productDetailMetadata({
    slug: SLUG,
    title: "Kaze — Apps für eine Weile weglegen | neckarshore.ai",
  });
}

export default function KazePage() {
  return (
    <ProductDetailPage
      slug={SLUG}
      media={
        <figure>
          {/*
            Bewusst KEIN Vergroessern-Klick wie beim Bildschirmfoto der anderen Seite: ein
            Icon hat nichts, was sich beim Heranzoomen erschliesst. Und bewusst klein
            gehalten — es ist ein Icon, kein Titelbild; auf halbe Spaltenbreite gezogen
            saehe es aus wie ein Fehler.
          */}
          <Image
            src={ICON.src}
            alt={ICON.alt}
            width={ICON.size}
            height={ICON.size}
            sizes="160px"
            className="h-40 w-40 rounded-[22%] border border-primary/10 dark:border-text-secondary/15"
          />
          <figcaption className="mt-3 text-sm text-muted dark:text-text-tertiary">
            風 — Wind. Dasselbe Zeichen trägt die App, der Browser-Reiter und der
            Startbildschirm.
          </figcaption>
        </figure>
      }
    />
  );
}
