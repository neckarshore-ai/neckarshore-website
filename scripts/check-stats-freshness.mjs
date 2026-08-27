#!/usr/bin/env node
/**
 * check-stats-freshness.mjs — der Wächter-Klassifikator hinter .github/workflows/stats-watchdog.yml.
 *
 * WARUM DAS EXISTIERT: update-stats.yml trug bis heute KEINEN Benachrichtigungsschritt. Vom
 * 2026-08-15 bis 2026-08-26 sind zwölf schedule-Läufe in Folge rot gelaufen, public/stats.json
 * stand still, und gefunden hat es ein Mensch, der zufällig ins Protokoll sah. Ein `if: failure()`
 * im Sammler (dort ergänzt) fängt den ROTEN Lauf. Er kann den AUSBLEIBENDEN Lauf nicht fangen —
 * ein Workflow, der nie startet, führt keinen Schritt aus. Dieser Wächter läuft als eigener,
 * winziger cron und misst statt des Laufs das ERGEBNIS: wie alt ist die veröffentlichte Zahl.
 *
 * DAS SIGNAL IST `updatedAt` AUS public/stats.json, und zwar bewusst statt des Laufstatus:
 *   - ein roter Lauf,
 *   - ein ausbleibender Lauf,
 *   - ein Lauf, der grün meldet und trotzdem nicht pusht
 * sehen am Laufstatus verschieden aus und am Alter der Zahl gleich. Der Wächter misst das, was die
 * Seite den Besuchern tatsächlich zeigt. `updatedAt` wird bei JEDEM Lauf neu gestempelt (siehe die
 * jq-Ausgabe in update-stats.yml), der Commit-Schritt findet deshalb immer einen Diff — ein
 * stehendes `updatedAt` heißt also wirklich "seitdem hat kein Lauf publiziert".
 *
 * SCHWELLE, HERGELEITET STATT GERATEN: der cron steht auf "0 4 * * *", GitHub verschiebt geplante
 * Läufe unter Last aber deutlich — der Lauf vom 2026-08-27 startete um 14:51 UTC, rund elf Stunden
 * zu spät. Der Wächter läuft um 12:00 UTC. Schlechtester GESUNDER Fall: der letzte Lauf kam gestern
 * um 04:00, der heutige hängt noch in der Warteschlange -> Alter 32 h. Erster KRANKER Fall: ein Tag
 * komplett ausgefallen -> Alter ab 45 h. 36 Stunden liegt sauber dazwischen. Die Trennung ist der
 * Grund für den Wert, nicht ein Bauchgefühl.
 *
 * FAIL-CLOSED bei fehlendem/unlesbarem Zeitstempel: eine Datei ohne `updatedAt` ist selbst schon
 * der Befund und wird als überfällig gemeldet, nie still übersprungen. (Gleiche Haltung wie
 * check-stats-staleness.mjs, andere Konsequenz: der Wächter DARF laut werden, jenes Gate nicht,
 * weil es mitten in der Veröffentlichung sitzt.)
 *
 * Reiner Kern (`classifyFreshness`) ist Werte-rein — keine fs, keine Uhr; die CLI reicht beides
 * hinein. Spiegelt die Trennung aus aggregate-test-scope.sh / check-stats-staleness.mjs.
 *
 * CLI:  node scripts/check-stats-freshness.mjs [statsJson] [thresholdHours] [nowISO]
 * Exit: IMMER 0 — der Klassifikator urteilt, der Workflow handelt. Schreibt `stale` / `age_hours` /
 *       `updated_at` nach $GITHUB_OUTPUT, wenn gesetzt.
 *
 * Tests: npm run test:unit  (tests/unit/check-stats-freshness.test.mjs)
 */

import fs from "node:fs";
import { fileURLToPath } from "node:url";

/** Siehe Herleitung im Kopf: 32 h gesund / 45 h krank -> 36 h trennt beides. */
export const DEFAULT_THRESHOLD_HOURS = 36;

/**
 * ageHours — Stunden (auf eine Nachkommastelle) zwischen ISO-Zeitstempel und now.
 * `null` bei fehlendem/unparsbarem Wert — der Aufrufer behandelt das als überfällig.
 */
export function ageHours(updatedAt, nowMs) {
  if (!updatedAt || typeof updatedAt !== "string") return null;
  const t = Date.parse(updatedAt);
  if (Number.isNaN(t)) return null;
  return Math.round(((nowMs - t) / 3_600_000) * 10) / 10;
}

/**
 * classifyFreshness — reines Urteil über EINEN Zeitstempel.
 * @param {string|null|undefined} updatedAt  ISO-Zeitstempel aus public/stats.json
 * @param {number} nowMs                     Epoch-Millisekunden als "jetzt"
 * @param {number} thresholdHours            strikt ÄLTER als das -> überfällig
 * @returns {{stale:boolean, ageHours:number|null, updatedAt:string|null, thresholdHours:number, reason:string}}
 *   reason: "fresh" | "overdue" | "unknown-timestamp"
 */
export function classifyFreshness(updatedAt, nowMs, thresholdHours = DEFAULT_THRESHOLD_HOURS) {
  const age = ageHours(updatedAt, nowMs);
  if (age === null) {
    return {
      stale: true,
      ageHours: null,
      updatedAt: updatedAt ?? null,
      thresholdHours,
      reason: "unknown-timestamp",
    };
  }
  // Ein Zeitstempel AUS DER ZUKUNFT (Uhrversatz, manipulierte Datei) ist nie überfällig, aber auch
  // nie ein Beleg für Frische — er fällt hier bewusst unter "fresh" und wird nicht künstlich zum
  // Alarm gemacht: der Wächter meldet Stillstand, keine Zeitzonen-Kuriositäten.
  return {
    stale: age > thresholdHours,
    ageHours: age,
    updatedAt,
    thresholdHours,
    reason: age > thresholdHours ? "overdue" : "fresh",
  };
}

/** Menschenlesbare Zeile für Protokoll und Issue-Text. */
export function formatVerdict(v) {
  if (v.reason === "unknown-timestamp") {
    return `ÜBERFÄLLIG: public/stats.json trägt keinen lesbaren updatedAt-Zeitstempel (gelesen: ${JSON.stringify(v.updatedAt)}).`;
  }
  if (v.stale) {
    return `ÜBERFÄLLIG: die veröffentlichte Zahl ist ${v.ageHours} h alt (Schwelle ${v.thresholdHours} h, updatedAt ${v.updatedAt}).`;
  }
  return `frisch: ${v.ageHours} h alt (Schwelle ${v.thresholdHours} h, updatedAt ${v.updatedAt}).`;
}

// --- CLI ---------------------------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) {
  const statsPath = process.argv[2] || "public/stats.json";
  const thresholdHours = Number(process.argv[3] || DEFAULT_THRESHOLD_HOURS);
  const nowMs = process.argv[4] ? Date.parse(process.argv[4]) : Date.now();

  let updatedAt = null;
  try {
    updatedAt = JSON.parse(fs.readFileSync(statsPath, "utf8")).updatedAt ?? null;
  } catch (err) {
    // Datei fehlt oder ist kaputt -> genau der Zustand, den der Wächter melden soll.
    console.error(`WARN: ${statsPath} nicht lesbar (${err.message}) — zählt als überfällig.`);
  }

  const verdict = classifyFreshness(updatedAt, nowMs, thresholdHours);
  console.error(formatVerdict(verdict));
  console.log(JSON.stringify(verdict));

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `stale=${verdict.stale}\nage_hours=${verdict.ageHours ?? "unbekannt"}\nupdated_at=${verdict.updatedAt ?? "unbekannt"}\nverdict=${formatVerdict(verdict)}\n`,
    );
  }
}
