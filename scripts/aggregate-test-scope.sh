#!/usr/bin/env bash
# aggregate-test-scope.sh — roll up per-repo stats.json files into the estate test-scope object.
#
# Pure aggregation (dir-in → JSON-out): given a stats-config.json (repos[] with an optional
# statsPath each) and a directory of already-fetched per-repo stats.json files, it sums the
# additive estate contribution and emits the decomposed estate test-scope object on stdout.
#
# The fetch (curl over the GitHub contents API) deliberately lives in the caller
# (.github/workflows/update-stats.yml), so THIS file — the bug-prone jq logic — is the exact
# code path the unit test exercises (tests/unit/aggregate-test-scope.test.mjs). Separation of
# concerns: network I/O in YAML, no-double-count math here.
#
# No-double-count contract (docs/reference/stats-json-contract.md):
#   - .tests.total and .tests.byType are ADDITIVE (distinct runner totals; sum(byType)==total).
#     ACHTUNG, DAS GILT PRO PRODUZENT UND NICHT FUER DIESE AUSGABE: `byType` wird nur aus den LIVE
#     Produzenten gebaut, `total` aus live+seed. Saat-Zeilen tragen per Definition keine Typangabe,
#     also ist sum(byType) systematisch KLEINER als total. Bis 2026-08-27 benannte kein Feld die
#     Differenz, und ein Leser, der nachrechnete, hielt die Gesamtzahl fuer falsch (genau das ist
#     dem Founder passiert). Deshalb gibt es jetzt `untyped_total`, und die ehrliche Eigenschaft
#     lautet:  sum(byType) + untyped_total == total   (ausser wenn ein audited_floor greift, der
#     total per max() anhebt — dann ist total groesser und `audited_floor.applied` sagt warum).
#   - .tests.lenses are OVERLAPPING, display-only subsets — NEVER summed into total or byType.
# Fail-closed-visible:
#   - a repo with a statsPath whose file is absent/unparseable contributes 0, emits a WARN on
#     stderr, and lands in missing[]. Never a silent 0.
# Fail-soft (rollout window):
#   - a producer with a numeric .tests.total but no .tests.byType (the live omnopsis-backend
#     OLD shape, before the Task-1 producer lands) still contributes its total; byType → {}.
#
# Floor seed (optional 3rd arg — backlog #244):
#   A repo that does NOT yet self-report a stats.json (Plan 3 rollout pending) can still
#   contribute its audited test count via a committed seed file ({floor, repos:[{repo,total}]}).
#   Seed repos are ADDED to the live rollup, but a LIVE producer with the same `repo` slug WINS
#   (the seed entry is dropped) → no double-count; the number auto-corrects toward live data as
#   repos start self-reporting. `reporting`/`expected`/`missing` stay LIVE-ONLY (a seed entry is
#   not a "producer"). `floor:true` from the seed propagates to the output (→ the public tile's
#   load-bearing "+"). Without a seed arg the behaviour is unchanged (floor:false, per_repo=live).
#   A seed row's `audited_sha` (Durchstich SHA that produced its total, or null) is PROPAGATED into
#   the rollup; the seed's `sha_note` (internal provenance) is NOT. Un-audited rows stay null.
#
# SHA-stamp coverage (Test Charter — the estate count is auditable, SHA-stamped):
#   The output carries `unstamped[]` = merged rows with audited_sha:null (pre-withhold = the TRUE
#   audit signal), and the script emits a stderr WARN listing them. Fail-OPEN: the warn NEVER
#   changes the exit code (guardrail #244 — the count must keep publishing).
#
# Usage:  aggregate-test-scope.sh <stats-config.json> <stats-dir> [seed.json]
#   stats-dir holds one file per fetched producer, named "<owner>__<name>.json".
# Output: estate test-scope JSON on stdout (no updatedAt — the caller stamps that).
set -euo pipefail

CONFIG="${1:?usage: aggregate-test-scope.sh <stats-config.json> <stats-dir> [seed.json]}"
STATS_DIR="${2:?usage: aggregate-test-scope.sh <stats-config.json> <stats-dir> [seed.json]}"
SEED="${3:-}"

# Expected producers = repos that declare a statsPath. A repo with no statsPath is simply not
# yet a producer (expected during the Plan 3 rollout) and is not counted in `expected`.
EXPECTED=$(jq '[.repos[] | select(.statsPath != null)] | length' "$CONFIG")

PER_REPO_FILE=$(mktemp)
MISSING_FILE=$(mktemp)
trap 'rm -f "$PER_REPO_FILE" "$MISSING_FILE"' EXIT

while IFS=$'\t' read -r OWNER NAME SLUG; do
  FILE="${STATS_DIR}/${OWNER}__${NAME}.json"

  # Valid iff the file exists AND carries a numeric .tests.total (works for both the old
  # {tests:{total}} shape and the new {tests:{total,byType}} contract shape).
  if [ ! -f "$FILE" ] || ! jq -e '.tests.total | numbers' "$FILE" >/dev/null 2>&1; then
    echo "WARN: ${SLUG} — stats.json absent or unparseable (no numeric .tests.total); contributing 0" >&2
    printf '%s\n' "$SLUG" >> "$MISSING_FILE"
    continue
  fi

  # Normalize the per-repo contribution. byType/lenses/endpoints degrade gracefully if absent.
  jq -c --arg slug "$SLUG" '{
    repo: (.repo // $slug),
    audited_sha: (.audited_sha // null),
    total: .tests.total,
    byType: (.tests.byType // {}),
    lenses: (.tests.lenses // {}),
    endpoints: (.endpoints // 0)
  }' "$FILE" >> "$PER_REPO_FILE"
done < <(jq -r '.repos[] | select(.statsPath != null) | [.owner, .name, (.owner + "/" + .name)] | @tsv' "$CONFIG")

MISSING_JSON=$(sort "$MISSING_FILE" | jq -R . | jq -s .)

# Floor-seed contribution (backlog #244): seed repos NOT already covered by a live producer.
# Live wins by `repo` slug → a repo that starts self-reporting drops out of the seed (no
# double-count). Seed entries carry no byType/endpoints (totals-only floor) and `seeded:true`.
LIVE_SLUGS=$(jq -s -c '[.[].repo]' "$PER_REPO_FILE")
SEED_FLOOR=false
SEED_JSON='[]'
AUDITED_FLOOR='null'
if [ -n "$SEED" ]; then
  if [ ! -f "$SEED" ]; then
    echo "ERROR: seed file '$SEED' not found" >&2
    exit 1
  fi
  SEED_FLOOR=$(jq '.floor // false' "$SEED")
  # Audited floor (optional seed field `audited_floor` — Founder directive 2026-07-10): a Lenin
  # estate-recount total ({total, audited, source}) that per-repo pipeline coverage has not caught
  # up to yet (under-reporting emitters / not-yet-reporting repos). Output total = max(live+seed
  # sum, audited_floor.total); the field is emitted with `applied: true|false` so consumers (and
  # the TC-CNT-085 honesty invariant) can verify WHY the headline exceeds Σ per_repo. Self-
  # retiring: once live producers sum past it, `applied` flips false and the organic number leads.
  # Carries NO repo slugs (per_repo[] + missing[] stay the only slug-bearing fields, TC-CNT-083).
  AUDITED_FLOOR=$(jq -c '.audited_floor // null' "$SEED")
  # Propagate the seed's audited_sha (Test Charter: the estate count is auditable, SHA-stamped).
  # A seed row that a Lenin Durchstich covered carries its SHA here → it reaches the rollup. An
  # un-audited row stays null (do NOT invent SHAs). sha_note is INTERNAL provenance, never copied
  # into the rollup. A PRIVATE repo's SHA is nulled downstream by withhold-private-repos.sh.
  SEED_JSON=$(jq -c --argjson live "$LIVE_SLUGS" '
    [ .repos[]
      | select((.repo as $r | $live | index($r)) | not)
      | { repo: .repo, audited_sha: (.audited_sha // null), total: (.total // 0), byType: {}, lenses: {}, endpoints: 0, seeded: true } ]
  ' "$SEED")
fi

# Aggregate over the MERGED set (live + seed). total = Σ .total; byType = merge-add per key
# (live only — seed is totals-only); endpoints = Σ. lenses are intentionally NOT aggregated
# (they overlap and would double-count). `reporting`/`expected`/`missing` stay LIVE-ONLY.
# Output shape (#244): repos = MERGED count, floor = seed flag, per_repo = the merged array.
OUT=$(jq -s -S \
  --argjson expected "$EXPECTED" \
  --argjson missing "$MISSING_JSON" \
  --argjson seed "$SEED_JSON" \
  --argjson floor "$SEED_FLOOR" \
  --argjson afloor "$AUDITED_FLOOR" \
  '. as $live
  | ($live + $seed) as $merged
  | {
    total: ([$merged[].total] | add // 0),
    byType: (reduce $live[].byType as $b ({}; reduce ($b | to_entries[]) as $e (.; .[$e.key] = ((.[$e.key] // 0) + $e.value)))),
    # Die Summe der Zeilen, die NICHTS zu byType beitragen — sie macht die Differenz zwischen
    # sum(byType) und total benennbar statt unerklaerlich.
    # DEFINITION UEBER byType-LEERE, NICHT UEBER `seeded`: der Fall "Live-Produzent mit numerischem
    # total, aber ohne byType" ist im Fail-soft-Absatz oben ausdruecklich vorgesehen (alte
    # omnopsis-backend-Form). Ueber `seeded` gezaehlt wuerde die Zusicherung an genau diesem Fall
    # brechen; ueber byType-Leere gezaehlt ist sie per Konstruktion wahr. Heute liefern beide
    # Definitionen dieselbe Zahl (419) — die Wahl zahlt sich erst spaeter aus.
    untyped_total: ([$merged[] | select((.byType | length) == 0) | .total] | add // 0),
    endpoints: ([$merged[].endpoints] | add // 0),
    reporting: ($live | length),
    expected: $expected,
    missing: $missing,
    floor: $floor,
    repos: ($merged | length),
    unstamped: ([$merged[] | select(.audited_sha == null) | .repo] | sort),
    per_repo: $merged
  }
  | (if $afloor == null then .
     else . + {
       audited_floor: ($afloor + { applied: (($afloor.total // 0) > .total) }),
       total: ([ .total, ($afloor.total // 0) ] | max)
     } end)' "$PER_REPO_FILE")

# --- SHA-stamp coverage warn (Test Charter: the estate count is auditable, SHA-stamped) ---
# A merged row with audited_sha:null is UN-STAMPED (no covering Durchstich, or a live producer
# that omits it). `unstamped[]` is keyed on the PRE-withhold audited_sha = the TRUE audit signal:
# the audited-but-private repos carry their real SHA here and are NOT flagged (post-withhold they'd
# ALL read null → daily cry-wolf). The workflow maps unstamped[] through withhold-private-repos.sh
# (same 3-way as missing[]) so the persistent job summary never leaks a raw private slug.
# Fail-OPEN by design — NEVER exit non-zero; the estate count must keep publishing (guardrail #244).
UNSTAMPED_N=$(printf '%s' "$OUT" | jq '.unstamped | length' 2>/dev/null || echo 0)
if [ "${UNSTAMPED_N:-0}" -gt 0 ] 2>/dev/null; then
  UNSTAMPED_LIST=$(printf '%s' "$OUT" | jq -r '.unstamped | join(", ")' 2>/dev/null || echo "?")
  echo "WARN: ${UNSTAMPED_N} merged row(s) carry audited_sha:null (un-stamped): ${UNSTAMPED_LIST}" >&2
fi

printf '%s\n' "$OUT"
