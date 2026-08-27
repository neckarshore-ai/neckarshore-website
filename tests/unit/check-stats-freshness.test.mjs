/**
 * Unit-Gate für scripts/check-stats-freshness.mjs — den Wächter-Klassifikator.
 *
 * WAS HIER WIRKLICH GEPRÜFT WIRD: nicht "rechnet Stunden richtig", sondern die drei Eigenschaften,
 * an denen der Wächter im Ernstfall scheitern würde:
 *   1. die SCHWELLE trennt den gesunden Spätlauf (32 h) vom echten Ausfall (45 h). Die Zahlen sind
 *      aus dem Betrieb genommen (cron 04:00 UTC, tatsächlicher Lauf 2026-08-27 um 14:51 UTC,
 *      Wächter 12:00 UTC), nicht erfunden. Rutscht die Schwelle, wird der Wächter still oder laut.
 *   2. FAIL-CLOSED: fehlender/kaputter Zeitstempel meldet, statt still durchzurutschen. Ein Wächter,
 *      der bei unlesbarer Eingabe schweigt, ist genau der Zustand, den er ablösen soll.
 *   3. GRENZE IST STRIKT: exakt auf der Schwelle ist noch frisch. Sonst flattert der Alarm.
 *
 * Der zwölf-Nächte-Ausfall vom August ist als Regressionsfall direkt mitgeprüft.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_THRESHOLD_HOURS,
  ageHours,
  classifyFreshness,
  formatVerdict,
} from "../../scripts/check-stats-freshness.mjs";

const H = 3_600_000;
const NOW = Date.parse("2026-08-27T12:00:00Z");
const at = (hoursAgo) => new Date(NOW - hoursAgo * H).toISOString();

test("gesunder Spätlauf: 32 h alt ist NICHT überfällig (cron 04:00 + GitHub-Verzug)", () => {
  const v = classifyFreshness(at(32), NOW);
  assert.equal(v.stale, false, "32 h ist der schlechteste gesunde Fall und muss schweigen");
  assert.equal(v.reason, "fresh");
});

test("echter Ausfall: ein komplett fehlender Tag (45 h) meldet", () => {
  const v = classifyFreshness(at(45), NOW);
  assert.equal(v.stale, true);
  assert.equal(v.reason, "overdue");
});

test("REGRESSION 2026-08-15/26: der Ausfall wäre am ZWEITEN Morgen gemeldet worden, nicht am ersten", () => {
  // Echte Daten: letzter grüner Lauf 2026-08-14T05:24:09Z (gh run list), danach zwölf rote schedule-Läufe.
  // DIESER TEST HÄLT EINE GRENZE FEST, KEINEN ERFOLG. Am ersten Wächtermorgen ist der Stand 30,6 h alt —
  // und ein 30,6 h alter Stand ist von einem GESUNDEN verzögerten Lauf nicht unterscheidbar (der Lauf vom
  // 27.08. kam elf Stunden zu spät). Wer hier melden will, muss die Schwelle unter den GitHub-Verzug
  // drücken und kauft sich Fehlalarme bei jeder Verzögerung. Der Wächter meldet deshalb am zweiten
  // Morgen. Zwei Tage statt zwölf ist der ehrliche Gewinn — nicht "am nächsten Morgen".
  const letzterGruenerLauf = "2026-08-14T05:24:09Z";
  const ersterMorgen = classifyFreshness(letzterGruenerLauf, Date.parse("2026-08-15T12:00:00Z"));
  const zweiterMorgen = classifyFreshness(letzterGruenerLauf, Date.parse("2026-08-16T12:00:00Z"));
  assert.equal(ersterMorgen.stale, false, "30,6 h ist noch im Verzugsfenster — schweigen ist hier richtig");
  assert.equal(ersterMorgen.ageHours, 30.6, "Grenzwert festgenagelt: rutscht er, ändert sich die Aussage");
  assert.equal(zweiterMorgen.stale, true, "nach 54,6 h gibt es keine harmlose Erklärung mehr");
  assert.ok(zweiterMorgen.ageHours > 54, `Alter am zweiten Morgen, war ${zweiterMorgen.ageHours}`);
});

test("Grenze ist strikt: exakt auf der Schwelle gilt noch als frisch", () => {
  assert.equal(classifyFreshness(at(DEFAULT_THRESHOLD_HOURS), NOW).stale, false);
  assert.equal(classifyFreshness(at(DEFAULT_THRESHOLD_HOURS + 0.2), NOW).stale, true);
});

test("FAIL-CLOSED: fehlender Zeitstempel meldet, statt still durchzurutschen", () => {
  for (const kaputt of [null, undefined, "", "gestern", 12345, {}]) {
    const v = classifyFreshness(kaputt, NOW);
    assert.equal(v.stale, true, `${JSON.stringify(kaputt)} muss als überfällig gelten`);
    assert.equal(v.reason, "unknown-timestamp");
    assert.equal(v.ageHours, null);
  }
});

test("Schwelle ist übersteuerbar — das ist der Verfälschungshebel für die Bruchprobe", () => {
  const frisch = at(1);
  assert.equal(classifyFreshness(frisch, NOW).stale, false);
  assert.equal(classifyFreshness(frisch, NOW, 0).stale, true, "threshold 0 macht jeden Stand überfällig");
});

test("Zeitstempel aus der Zukunft löst keinen Alarm aus (Uhrversatz ist kein Stillstand)", () => {
  const v = classifyFreshness(at(-5), NOW);
  assert.equal(v.stale, false);
  assert.ok(v.ageHours < 0);
});

test("ageHours rechnet auf eine Nachkommastelle und meldet Unlesbares als null", () => {
  assert.equal(ageHours(at(21.1), NOW), 21.1);
  assert.equal(ageHours("kein-datum", NOW), null);
});

test("formatVerdict benennt in JEDEM Zweig den gemessenen Wert — der Issue-Text lebt davon", () => {
  assert.match(formatVerdict(classifyFreshness(at(45), NOW)), /ÜBERFÄLLIG.*45/);
  assert.match(formatVerdict(classifyFreshness(at(2), NOW)), /frisch/);
  assert.match(formatVerdict(classifyFreshness(null, NOW)), /ÜBERFÄLLIG.*updatedAt/);
});
