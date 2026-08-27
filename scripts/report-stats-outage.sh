#!/usr/bin/env bash
# report-stats-outage.sh — der EINE Meldeweg für beide Ausfallarten des Statistik-Sammlers.
#
# WARUM GETEILT: es gibt zwei Melder — der `if: failure()`-Schritt in update-stats.yml (roter Lauf)
# und stats-watchdog.yml (ausbleibender Lauf / stehende Zahl). Zwei Kopien derselben Logik würden
# auseinanderlaufen, und die Kopie, die niemand testet, ist die, die im Ernstfall schweigt.
#
# WARUM ISSUE UND NICHT MAIL: GitHub verschickt bei scheiternden schedule-Läufen von sich aus eine
# Mail an den letzten Bearbeiter der cron-Zeile. Diese Mails KAMEN im August an und wurden nicht
# gelesen (Founder-Auskunft 2026-08-27). Ein zweiter Mail-Kanal repariert das nicht. Ein Issue schon:
# es bleibt offen, bis jemand es schließt, statt einmal vorbeizurauschen.
#
# ENTDOPPELUNG ÜBER DEN TITEL-MARKER, NICHT ÜBER EIN LABEL: ein Label muss existieren, sonst
# scheitert `gh issue create --label` — der Melder wäre dann von genau der Sorte Nebenbedingung
# abhängig, die er melden soll. Und die Suche läuft über die LISTEN-API mit lokalem Filter statt über
# `--search`: der Suchindex von GitHub hinkt Sekunden bis Minuten hinterher, und ein hinkender Index
# heißt bei zwölf Ausfällen in Folge zwölf Issues.
#
# Bei einem bereits offenen Issue wird KOMMENTIERT statt neu angelegt: ein Vorgang, eine Zeitleiste.
#
# Aufruf:  scripts/report-stats-outage.sh <marker> <titel> <body-datei>
# Braucht: GH_TOKEN mit `issues: write` (im Workflow job-scoped, nie workflow-scoped).
set -euo pipefail

MARKER="${1:?usage: report-stats-outage.sh <marker> <titel> <body-datei>}"
TITEL="${2:?fehlender Titel (arg 2)}"
BODY_DATEI="${3:?fehlende Body-Datei (arg 3)}"

[ -f "$BODY_DATEI" ] || { echo "FEHLER: Body-Datei $BODY_DATEI existiert nicht" >&2; exit 1; }
case "$TITEL" in
  *"$MARKER"*) ;;
  *) echo "FEHLER: der Titel muss den Marker '$MARKER' enthalten, sonst greift die Entdoppelung nicht" >&2; exit 1 ;;
esac

# Offener Vorgang mit demselben Marker? Lokaler Filter auf der Listen-API (kein Suchindex).
#
# VOLLSTAENDIG BLAETTERN statt `--limit 100`: ein Ausfall-Vorgang kann lange offen stehen, waehrend
# neuere Vorgaenge ihn nach hinten schieben. Faellt er aus dem Fenster, legt der naechste Melder
# einen zweiten an — also genau die Lawine, die die Entdoppelung verhindern soll, nur spaeter und
# schwerer zu erkennen. (CodeRabbit-Fund auf PR #210.)
#
# `/issues` liefert AUCH Pull Requests — `select(.pull_request == null)` ist deshalb Pflicht und
# nicht Kosmetik: ein PR mit dem Marker im Titel wuerde sonst als bestehender Vorgang gelten und die
# Meldung waere ein Kommentar am falschen Ort.
#
# KEIN `| head -n 1` HINTER gh. `--jq` laeuft PRO SEITE, also kann jede Seite eine Zeile liefern.
# Beendet `head` die Leitung nach der ersten, bekommt gh SIGPIPE, `pipefail` reicht 141 durch und
# `set -e` bricht das Skript ab — der Melder stirbt dann daran, dass er melden wollte. Nachgemessen
# statt hergeleitet: `set -euo pipefail; { echo 111; sleep 0.3; echo 222; } | head -n 1` -> exit 141.
# Die Ausgabe wird deshalb erst vollstaendig eingesammelt und danach die erste Zeile genommen; sed
# liest seine Eingabe zu Ende und schliesst die Leitung nicht vorzeitig. (Pruefagenten-Fund nach der
# Auslieferung von PR #213.)
REPO_SLUG=$(gh repo view --json nameWithOwner --jq .nameWithOwner)
TREFFER=$(gh api --paginate "repos/${REPO_SLUG}/issues?state=open&per_page=100" \
  --jq "[.[] | select(.pull_request == null) | select(.title | contains(\"${MARKER}\")) | .number] | first // empty")
BESTEHEND=$(printf '%s\n' "$TREFFER" | sed -n '1p')

if [ -n "$BESTEHEND" ]; then
  echo "Bestehender offener Vorgang #${BESTEHEND} — kommentiere statt neu anzulegen." >&2
  gh issue comment "$BESTEHEND" --body-file "$BODY_DATEI"
  echo "$BESTEHEND"
else
  echo "Kein offener Vorgang mit Marker '${MARKER}' — lege einen an." >&2
  URL=$(gh issue create --title "$TITEL" --body-file "$BODY_DATEI")
  echo "$URL" >&2
  basename "$URL"
fi
