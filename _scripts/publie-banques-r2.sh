#!/bin/bash
# Publie les banques de donnees vers R2 (bucket `zts-banques`).
#
# LOT 1 vague D, 2026-08-17. UN SEUL chemin de code pour le versement initial
# (a la main) et pour la CI : si les deux divergeaient, la CI publierait autre
# chose que ce qu'on a teste, et la desynchronisation redeviendrait possible —
# exactement ce que ce script existe pour empecher.
#
# Usage :
#   bash _scripts/publie-banques-r2.sh              # publie les 43 banques
#   bash _scripts/publie-banques-r2.sh --essai      # sonde R2 en lecture, n'ecrit rien
#
# La publication est INTEGRALE, jamais incrementale : les 43 objets remontent
# a chaque fois. A cette taille (~30 Mo, ~60 s) comparer couterait une lecture
# R2 par objet pour economiser des ecritures qui ne genent personne. L'entete
# a annonce un mode incremental et un drapeau --tout pendant que le code
# poussait tout : ni l'un ni l'autre n'a jamais existe.
#
# En CI, `CLOUDFLARE_API_TOKEN` doit exister. En local, l'OAuth de wrangler suffit.

set -u
set -o pipefail

BUCKET="zts-banques"
RACINE="$(cd "$(dirname "$0")/.." && pwd)"
DATA="$RACINE/_data"

ESSAI=0
for a in "$@"; do
  case "$a" in
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

# ── Garde-fou : l'OUTIL doit exister avant de compter des echecs ──
# Le 17 aout 2026, cette etape a echoue 43 fois sur 43 en 4 ms chacune : le
# workflow n'installait pas wrangler, et `wrangler r2 object put` n'existait
# donc pas sur le runner. Le journal n'affichait que 43 « ECHEC », sans un mot
# sur la cause — l'absence d'un binaire ressemblait a 43 pannes reseau.
# Une cause unique doit se lire une fois, en clair, pas 43 fois en creux.
if ! command -v wrangler >/dev/null 2>&1; then
  echo "ERREUR — wrangler introuvable dans le PATH."
  echo
  echo "Aucune banque ne peut monter sans lui. En CI, il s'installe dans une"
  echo "etape dediee du workflow (npm install -g wrangler) ; en local, il vient"
  echo "avec la toolchain Node du poste."
  echo
  echo "Ce garde-fou existe parce que son absence s'est deja lue comme 43"
  echo "echecs de publication au lieu d'un outil manquant."
  exit 1
fi

if [ ! -d "$DATA" ]; then
  echo "ERREUR — $DATA introuvable. Les banques ont-elles ete deplacees ?"
  exit 1
fi

pousse() {
  local chemin="$1" cle="$2"
  local taille; taille=$(du -h "$chemin" | cut -f1 | tr -d ' ')

  if [ "$ESSAI" -eq 1 ]; then
    echo "  [essai] $cle  ($taille)"
    return 0
  fi

  # La sortie d'erreur de wrangler est CONSERVEE et reaffichee : c'est elle
  # qui distingue « jeton sans droit R2 » de « bucket absent » de « reseau ».
  # Elle etait redirigee vers /dev/null, ce qui a rendu une panne triviale
  # (binaire manquant) indiscernable d'une panne grave.
  local err
  if err=$(wrangler r2 object put "$BUCKET/$cle" --file "$chemin" \
             --content-type "application/json" --remote 2>&1 >/dev/null); then
    echo "  OK      $cle  ($taille)"
    return 0
  fi
  echo "  ECHEC   $cle"
  if [ -n "$err" ]; then
    echo "$err" | tail -4 | sed 's/^/            | /'
  fi
  return 1
}

# ── L'essai a blanc SONDE R2 pour de vrai ──
# Avant le 17 aout, `--essai` se contentait de lister des noms de fichiers :
# il n'appelait jamais wrangler, donc il aurait passe au vert le jour ou
# l'outil manquait ou le jeton n'avait pas le droit R2. Un essai qui ne peut
# pas echouer ne verifie rien.
# On fait donc UNE lecture reelle — lister les buckets — qui prouve les deux
# choses qui ont casse : wrangler fonctionne, et le jeton ouvre bien R2.
# Lecture seule : un essai n'ecrit pas, meme pour se rassurer.
sonde_r2() {
  local out
  if ! out=$(wrangler r2 bucket list 2>&1); then
    echo "  SONDE   ECHEC — wrangler ne peut pas lire R2 avec ce jeton."
    echo "$out" | tail -4 | sed 's/^/            | /'
    echo
    echo "Causes habituelles : le jeton n'a pas « Workers R2 Storage: Edit »,"
    echo "ou il ouvre plusieurs comptes et wrangler ne sait pas lequel viser"
    echo "(y remedier en exposant CLOUDFLARE_ACCOUNT_ID)."
    return 1
  fi
  if ! echo "$out" | grep -q "$BUCKET"; then
    echo "  SONDE   ECHEC — le jeton lit R2, mais le bucket « $BUCKET »"
    echo "          n'apparait pas dans la liste des buckets accessibles."
    return 1
  fi
  echo "  SONDE   OK — wrangler repond et le bucket « $BUCKET » est accessible."
  return 0
}

echo "Publication vers R2 « $BUCKET »"
if [ "$ESSAI" -eq 1 ]; then
  echo "(essai a blanc — rien ne sera ecrit, mais R2 est reellement sonde)"
  echo
  sonde_r2 || exit 1
fi
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

# Un essai a blanc n'a RIEN ecrit : il ne peut donc pas certifier que R2 est
# a jour, seulement que la publication a de quoi reussir. Dire l'un pour
# l'autre, c'est refabriquer la fausse assurance qu'on vient de payer.
if [ "$ESSAI" -eq 1 ]; then
  echo "Essai concluant : outil, jeton et bucket repondent, et les $TOTAL"
  echo "objets attendus sont tous presents. Rien n'a ete ecrit."
  exit 0
fi

echo "Toutes les banques sont a jour dans R2."
exit 0
