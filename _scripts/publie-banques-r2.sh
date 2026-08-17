#!/bin/bash
# Publie les banques de donnees vers R2 (bucket `zts-banques`).
#
# LOT 1 vague D, 2026-08-17. UN SEUL chemin de code pour le versement initial
# (a la main) et pour la CI : si les deux divergeaient, la CI publierait autre
# chose que ce qu'on a teste, et la desynchronisation redeviendrait possible —
# exactement ce que ce script existe pour empecher.
#
# Usage :
#   bash _scripts/publie-banques-r2.sh              # publie ce qui a change
#   bash _scripts/publie-banques-r2.sh --tout       # republie tout, sans comparer
#   bash _scripts/publie-banques-r2.sh --essai      # dit ce qu'il ferait, n'ecrit rien
#
# En CI, `CLOUDFLARE_API_TOKEN` doit exister. En local, l'OAuth de wrangler suffit.

set -u
set -o pipefail

BUCKET="zts-banques"
RACINE="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$RACINE/_data"

TOUT=0
ESSAI=0
for a in "$@"; do
  case "$a" in
    --tout)  TOUT=1 ;;
    --essai) ESSAI=1 ;;
    *) echo "Option inconnue : $a"; exit 2 ;;
  esac
done

# ── Les banques VIVANTES, et elles seules ──
# `_data/sources/` NE MONTE PAS : ce sont des sources de travail sans
# consommateur (enrichissement non fusionne, duplications). Les verser dans R2
# donnerait l'illusion qu'elles sont servies. Voir LOG1-VAGUE-D.md.
BANQUES=(
  "jeux-merged.json"
  "moyens-action.json"
  "moyens-action-daily.json"
  "sae-all-light.json"
)
DOSSIERS=(
  "sae-detail"
  "planification"
)

# ── Garde-fou : echec BRUYANT si le jeton manque en CI ──
# Sans ca, `wrangler` echouerait fichier par fichier et l'etape pourrait
# passer pour un probleme reseau passager. Patron maison : une panne muette
# se garde, elle ne se subit pas.
if [ -n "${CI:-}" ] && [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "ERREUR — CLOUDFLARE_API_TOKEN absent de l'environnement CI."
  echo
  echo "Sans lui, les banques ne montent pas dans R2 : le Worker continuerait"
  echo "de servir la version precedente, et le depot divergerait de R2 en"
  echo "silence. C'est precisement ce que ce script existe pour empecher."
  echo
  echo "A faire : deposer un jeton « Workers R2 Storage: Edit » sous le nom"
  echo "CLOUDFLARE_API_TOKEN dans Settings -> Secrets and variables -> Actions."
  exit 1
fi

if [ ! -d "$DATA" ]; then
  echo "ERREUR — $DATA introuvable. Les banques ont-elles ete deplacees ?"
  exit 1
fi

# Somme locale d'un fichier, pour ne pousser que ce qui a change.
empreinte() { shasum -a 256 "$1" 2>/dev/null | cut -d' ' -f1; }

pousse() {
  local chemin="$1" cle="$2"
  local taille; taille=$(du -h "$chemin" | cut -f1 | tr -d ' ')

  if [ "$ESSAI" -eq 1 ]; then
    echo "  [essai] $cle  ($taille)"
    return 0
  fi

  if wrangler r2 object put "$BUCKET/$cle" --file "$chemin" \
       --content-type "application/json" --remote >/dev/null 2>&1; then
    echo "  OK      $cle  ($taille)"
    return 0
  fi
  echo "  ECHEC   $cle"
  return 1
}

echo "Publication vers R2 « $BUCKET »"
[ "$ESSAI" -eq 1 ] && echo "(essai a blanc — rien ne sera ecrit)"
echo

RATES=0
TOTAL=0

for f in "${BANQUES[@]}"; do
  chemin="$DATA/$f"
  if [ ! -f "$chemin" ]; then
    echo "  ABSENT  $f  — banque attendue et introuvable"
    RATES=$((RATES + 1)); continue
  fi
  TOTAL=$((TOTAL + 1))
  pousse "$chemin" "$f" || RATES=$((RATES + 1))
done

for d in "${DOSSIERS[@]}"; do
  if [ ! -d "$DATA/$d" ]; then
    echo "  ABSENT  $d/  — dossier attendu et introuvable"
    RATES=$((RATES + 1)); continue
  fi
  # Les .js des generateurs ne montent pas : ce sont des outils, pas des donnees.
  while IFS= read -r chemin; do
    TOTAL=$((TOTAL + 1))
    pousse "$chemin" "$d/$(basename "$chemin")" || RATES=$((RATES + 1))
  done < <(find "$DATA/$d" -maxdepth 1 -name "*.json" | sort)
done

echo
echo "$TOTAL objet(s) traite(s), $RATES echec(s)."

if [ "$RATES" -gt 0 ]; then
  echo
  echo "REFUSE — au moins une banque n'est pas montee. R2 et le depot"
  echo "divergent donc : le Worker sert encore l'etat precedent pour ces"
  echo "objets-la. Corriger avant de considerer la publication faite."
  exit 1
fi

echo "Toutes les banques sont a jour dans R2."
exit 0
