import { test, expect } from "@playwright/test";
import { ALL_ROUTES } from "./helpers";

/**
 * Barrierefreiheit auf JEDER Adresse — nicht auf drei.
 *
 * WAS SICH GEAENDERT HAT UND WARUM. Dieses Spec verdrahtete bis zum 22.08.2026 drei
 * Adressen fest ("/", "/impressum", "/datenschutz") und war damit auf 25 von 28 blind.
 * Genau diese Blindheit ist der Grund, warum ein Kontrast-Verstoss monatelang unbemerkt
 * live stand: geprueft wurde, woran jemand gedacht hatte, nicht, was es gibt. Die
 * Adressen kommen jetzt aus derselben Quelle wie beim Kontrast-Waechter (`ALL_ROUTES`,
 * abgeleitet aus dem sitemap-Modul) — eine neue Seite wird geprueft, weil sie existiert.
 *
 * WAS DIE AUSWEITUNG GEFUNDEN HAT: nichts. Alle 28 Adressen bestehen alle fuenf Regeln,
 * gemessen gegen einen Produktionsbau vor dem Bau dieses Specs. Das ist die ehrliche
 * Fassung — die Blindheit war real, der Schaden aus IHR ist heute null. Der Wert liegt
 * ab jetzt in der Zukunft: die naechste Seite mit zwei H1 oder ohne Alt-Text faellt auf,
 * statt zu warten, bis jemand zufaellig hinsieht.
 *
 * WARUM DIE PRUEFNUMMERN JETZT DEN PFAD TRAGEN. Die alten festen Nummern (TC-A11Y-001
 * bis -015) waren an drei Adressen gebunden. Bei einer abgeleiteten Liste gibt es keine
 * stabile Nummer mehr: jede neue Seite wuerde alle folgenden Nummern verschieben, und
 * eine verschobene Nummer in einem Protokoll ist schlimmer als gar keine. Der Pfad ist
 * der stabile Bezeichner — `TC-A11Y-/products/omnopsis-alt` benennt genau eine Pruefung
 * auf genau einer Seite. Alte Protokollzeilen mit TC-A11Y-006 beschreiben vergangene
 * Laeufe und bleiben gueltig.
 *
 * FUENF GETRENNTE PRUEFUNGEN JE ADRESSE, nicht eine gebuendelte: die Fehlermeldung IST
 * die Diagnose. Eine gebuendelte Pruefung sagt "Seite X ist kaputt", fuenf getrennte
 * sagen "Seite X hat zwei H1" — und nur die zweite Auskunft erspart die Suche.
 */
test.describe("Accessibility", () => {
  for (const path of ALL_ROUTES) {
    test(`TC-A11Y-${path}-h1: ${path} hat genau eine H1`, async ({ page }) => {
      await page.goto(path);
      expect(await page.locator("h1").count(), `${path} sollte genau 1 H1 haben`).toBe(1);
    });

    test(`TC-A11Y-${path}-headings: ${path} ueberspringt keine Ueberschriften-Ebene`, async ({
      page,
    }) => {
      await page.goto(path);
      const levels = await page.$$eval("h1, h2, h3, h4, h5, h6", (els) =>
        els.map((el) => Number(el.tagName.slice(1))),
      );

      let last = 0;
      for (const level of levels) {
        if (last > 0) {
          expect(level <= last + 1, `${path}: H${last} → H${level} (Sprung)`).toBe(true);
        }
        last = level;
      }
    });

    test(`TC-A11Y-${path}-lang: ${path} traegt das Sprach-Attribut`, async ({ page }) => {
      await page.goto(path);
      expect(await page.locator("html").getAttribute("lang")).toBe("de");
    });

    test(`TC-A11Y-${path}-alt: ${path} — jedes Bild hat einen Alt-Text`, async ({ page }) => {
      await page.goto(path);
      const missing = await page.$$eval("img", (imgs) =>
        imgs.filter((img) => !img.getAttribute("alt")).map((img) => img.getAttribute("src")),
      );
      expect(missing, `${path}: Bilder ohne Alt-Text: ${missing.join(", ")}`).toEqual([]);
    });

    test(`TC-A11Y-${path}-aria: ${path} — Schaltflaechen in der Navigation haben einen Namen`, async ({
      page,
    }) => {
      await page.goto(path);
      const unnamed = await page.$$eval(
        "nav button",
        (buttons) =>
          buttons.filter((b) => !(b.getAttribute("aria-label") || b.textContent?.trim())).length,
      );
      expect(unnamed, `${path}: Schaltflaechen ohne zugaenglichen Namen`).toBe(0);
    });
  }
});
