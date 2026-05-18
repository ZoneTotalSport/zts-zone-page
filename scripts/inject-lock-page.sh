#!/usr/bin/env bash
# Injecte <script src="/zts-lock-page.js" defer></script> dans le <head>
# de toutes les pages /articles/*.html et /apps/*/index.html (sauf generateur).
# Idempotent : skip si deja present.
#
# Usage : bash scripts/inject-lock-page.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FIREBASE_TAG='<script src="/firebase-auth.js" defer></script>'
FUNNEL_TAG='<script src="/zts-funnel.js" defer></script>'
FULLSCREEN_TAG='<script src="/zts-locked-fullscreen.js" defer></script>'
LOCK_TAG='<script src="/zts-lock-page.js" defer></script>'

inject_tag() {
  local f="$1" tag="$2" needle="$3"
  if grep -q "$needle" "$f"; then return 0; fi
  awk -v tag="$tag" '
    BEGIN { done = 0 }
    !done && /<\/head>/ { print "  " tag; done = 1 }
    { print }
  ' "$f" > "$f.tmp" && mv "$f.tmp" "$f"
  return 1
}

inject() {
  local f="$1" changed=0
  if ! grep -qi '</head>' "$f"; then
    echo "SKIP (no </head>) : $f"
    return 0
  fi
  inject_tag "$f" "$FIREBASE_TAG" 'firebase-auth.js' || changed=1
  inject_tag "$f" "$FUNNEL_TAG" 'zts-funnel.js' || changed=1
  inject_tag "$f" "$FULLSCREEN_TAG" 'zts-locked-fullscreen.js' || changed=1
  inject_tag "$f" "$LOCK_TAG" 'zts-lock-page.js' || changed=1
  if [ $changed -eq 1 ]; then echo "INJECTED : $f"; fi
}

count=0
for f in "$ROOT"/articles/*.html; do
  [ -f "$f" ] || continue
  inject "$f"
  count=$((count+1))
done

for d in "$ROOT"/apps/*/; do
  name="$(basename "$d")"
  case "$name" in
    generateur|_archive) continue ;;
  esac
  f="$d/index.html"
  [ -f "$f" ] || continue
  inject "$f"
  count=$((count+1))
done

echo "Done. Processed $count files."
