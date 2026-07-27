#!/bin/bash
# Detection de secrets a la validation — restaure depuis 7b0145d / 0b3fbd1.
#
# Ce script etait le pre-commit du depot jusqu'au 26 juillet 2026, ou il a ete
# ecrase par les garde-fous d'habillage (3d90121). Le voici en script dedie :
# le pre-commit enchaine desormais les deux familles de verification, aucune
# ne peut plus faire disparaitre l'autre.
#
# Deux changements par rapport a la version d'origine :
#  1. l'ancienne exception « fichier dont le nom contient firebase » laissait
#     passer n'importe quelle cle AIza dans firebase-auth.js — et bloquait la
#     cle publique partout ailleurs (shared/zts-gate.js, article-views.js).
#     L'exception porte maintenant sur la VALEUR de la cle, pas sur le nom du
#     fichier : la cle web publique du projet est autorisee partout, toute
#     autre cle AIza est refusee partout, y compris dans firebase-auth.js.
#  2. le message dit quoi faire plutot que de renvoyer vers --no-verify.

set -u

# Cle web Firebase du projet zone-total-sport. Publique par conception : elle
# est servie dans le bundle de chaque page du site, elle identifie le projet
# et n'autorise rien par elle-meme (les regles Firestore font l'autorisation).
# Ce n'est PAS un secret. Toute AUTRE cle AIza reste bloquee.
CLES_PUBLIQUES=(
  'AIzaSyBoBxVP6g_ObKIJJ1jkviNFQ-wpJoWdjbA'
)

PATTERNS=(
  '"private_key":[[:space:]]*"-----BEGIN'
  '-----BEGIN PRIVATE KEY-----'
  '-----BEGIN RSA PRIVATE KEY-----'
  '-----BEGIN OPENSSH PRIVATE KEY-----'
  '"client_email":[[:space:]]*"[^"]+@[^"]+\.iam\.gserviceaccount\.com"'
  'AKIA[0-9A-Z]{16}'
  'sk-ant-[a-zA-Z0-9_-]{40,}'
  'sk-[a-zA-Z0-9]{48}'
  'AIza[0-9A-Za-z_-]{35}'
)

FILES=$(git diff --cached --name-only --diff-filter=AM)
[ -z "$FILES" ] && exit 0

FOUND=0
while IFS= read -r file; do
  [ -z "$file" ] && continue
  [ -f "$file" ] || continue
  # Le script se cite lui-meme (patterns + cle autorisee) : ne pas s'auto-bloquer.
  case "$file" in _scripts/verifie-secrets.sh) continue;; esac
  file --mime "$file" 2>/dev/null | grep -q 'charset=binary' && continue

  for pattern in "${PATTERNS[@]}"; do
    while IFS= read -r trouve; do
      [ -z "$trouve" ] && continue
      autorise=0
      for cle in "${CLES_PUBLIQUES[@]}"; do
        [ "$trouve" = "$cle" ] && autorise=1
      done
      [ "$autorise" -eq 1 ] && continue
      echo "SECRET DETECTE dans $file"
      echo "   motif  : $pattern"
      echo "   valeur : ${trouve:0:12}…"
      FOUND=1
    done < <(grep -E -o "$pattern" "$file" 2>/dev/null | sort -u)
  done
done <<< "$FILES"

if [ "$FOUND" -eq 1 ]; then
  echo
  echo "COMMIT REFUSE — un fichier indexe contient ce qui ressemble a un secret."
  echo
  echo "Si c'est un vrai secret : retire-le du code, mets-le dans un secret"
  echo "Cloudflare ou une variable d'environnement, et revoque-le."
  echo
  echo "Si c'est une valeur publique legitime (nouvelle cle web Firebase par"
  echo "exemple) : ajoute-la a CLES_PUBLIQUES dans _scripts/verifie-secrets.sh,"
  echo "avec un commentaire qui dit pourquoi elle est publique. Le hook reste"
  echo "obligatoire — --no-verify n'est pas la solution, c'est l'aveu qu'on a"
  echo "arrete de le maintenir."
  exit 1
fi

exit 0
