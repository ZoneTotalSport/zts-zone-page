#!/bin/bash
# Detection de secrets — hook pre-commit ET controle CI.
#
# Ce script etait le pre-commit du depot jusqu'au 26 juillet 2026, ou il a ete
# ecrase par les garde-fous d'habillage (3d90121). Le voici en script dedie :
# le pre-commit enchaine desormais les deux familles de verification, aucune
# ne peut plus faire disparaitre l'autre.
#
# DEUX MODES
#   (sans argument)  fichiers INDEXES — c'est ce qu'appelle .githooks/pre-commit
#   --arbre          TOUS les fichiers suivis — c'est ce qu'appelle la CI
#
# Le mode arbre existe parce que la CI n'a pas d'index : `git diff --cached` y
# renvoie le vide, et la version de ce script anterieure au 12 aout 2026 sortait
# alors en 0 sans avoir rien lu. Une etape verte qui ne verifie rien est pire
# qu'une etape absente — c'est le mode de panne silencieux que ce depot paie en
# boucle (voir D18 et D22 dans DETTE-TECHNIQUE-HABILLAGE.md). Garde-fou ajoute :
# en CI, un mode indexe qui ne trouve aucun fichier est une ERREUR, pas un succes.

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
  # Jeton de bot Telegram : <identifiant numerique>:<35 caracteres base64url>.
  # Ajoute le 24 aout 2026, apres en avoir trouve un EN CLAIR dans
  # telegram-notify.js — un fichier servi en JavaScript de navigateur sur les
  # pages du site, ou n'importe quel visiteur pouvait le lire. Les neuf motifs
  # precedents ne couvraient pas cette forme.
  #
  # La longueur EXACTE de 35 est ce qui rend le motif sur : un
  # `[A-Za-z0-9_-]{30,}` ouvert attraperait des identifiants et des sommes de
  # controle parfaitement anodins, et un controle qui crie a tort finit
  # contourne.
  '[0-9]{8,12}:[A-Za-z0-9_-]{35}'
)

# Exceptions portees sur le COUPLE fichier + motif, jamais sur le fichier seul :
# dispenser `.githooks/README.md` de tout controle laisserait passer une vraie
# cle collee dans la doc. Recensees le 12 aout 2026, quand la reparation des
# motifs (voir SELF-TEST plus bas) les a rendus visibles pour la premiere fois.
EXCEPTIONS=(
  # La doc du hook cite le motif qu'elle documente.
  '.githooks/README.md::-----BEGIN PRIVATE KEY-----'
  # .replace() qui retire l'en-tete d'une cle lue dans une variable
  # d'environnement — la cle elle-meme n'est pas dans le depot.
  'cf-worker/generateur/src/firestore.js::-----BEGIN PRIVATE KEY-----'
  # Meme cas, meme raison : le worker notify signe ses jetons Firestore avec
  # la cle de FIREBASE_SERVICE_ACCOUNT, un SECRET Cloudflare, et retire son
  # en-tete PEM avant de l'importer. Ajoute le 24 aout 2026 au rapatriement du
  # worker deploye. La cle n'est pas dans le depot, seul le marqueur l'est.
  'cf-worker/notify-worker.js::-----BEGIN PRIVATE KEY-----'
  # D27 montre le message d'erreur de grep : sans le motif en clair dans le
  # bloc de code, la demonstration ne montre plus rien. UNE seule occurrence
  # y est tolérée — les deux autres en-tetes y sont decrits en prose.
  'DETTE-TECHNIQUE-HABILLAGE.md::-----BEGIN PRIVATE KEY-----'
)

MOI='_scripts/verifie-secrets.sh'   # se cite lui-meme : motifs + cle autorisee

# ── SELF-TEST : un motif que grep refuse est un trou silencieux ──
# Jusqu'au 12 aout 2026 les greps s'ecrivaient `grep -E -o "$motif"` SANS `--`.
# Les trois motifs qui commencent par un tiret etaient donc pris pour des
# options : « grep: unrecognized option », sortie 2, avalee par `2>/dev/null`.
# Une cle privee nue (id_rsa, .pem) passait sans etre vue, et rien ne le disait.
#
# Ce defaut-la est desormais impossible par construction : tous les greps de ce
# script passent `--`. Le self-test couvre l'autre moitie du risque, celle qui
# reste ouverte — un motif MALFORME ajoute plus tard (crochet non ferme,
# quantificateur invalide) que grep refuse de la meme facon, avec la meme
# sortie 2, et qui ne detecterait donc plus rien sans prevenir. On teste chaque
# motif a vide : grep doit repondre 1 (aucune correspondance), jamais 2.
for pattern in "${PATTERNS[@]}"; do
  printf '' | grep -E -q -- "$pattern" 2>/dev/null
  code=$?
  if [ "$code" -ge 2 ]; then
    echo "ERREUR — motif refuse par grep (sortie $code) :"
    echo "   $pattern"
    echo
    echo "Il n'aurait rien detecte, en silence. Corrige l'expression avant de"
    echo "committer quoi que ce soit."
    exit 2
  fi
done

# ── Choix du mode ──
MODE="indexe"
if [ "${1:-}" = "--arbre" ]; then
  MODE="arbre"
fi

liste_fichiers() {   # emet la liste de fichiers, separee par des NUL
  if [ "$MODE" = "arbre" ]; then
    git ls-files -z
  else
    git diff --cached --name-only --diff-filter=AM -z
  fi
}

NB=$(liste_fichiers | tr -dc '\0' | wc -c | tr -d ' ')

if [ "$NB" -eq 0 ]; then
  if [ "$MODE" = "indexe" ] && [ -n "${CI:-}" ]; then
    echo "ERREUR — mode indexe en CI : aucun fichier a verifier."
    echo "La CI n'a pas d'index. Appelle le script avec --arbre."
    exit 2
  fi
  echo "secrets : aucun fichier a verifier (mode $MODE)."
  exit 0
fi

echo "secrets : $NB fichier(s), mode $MODE, ${#PATTERNS[@]} motifs."

# ── Balayage : un grep par motif sur toute la liste ──
# Un grep par FICHIER coutait ~20 000 processus sur l'arbre complet (plus de
# 5 minutes). Un grep par MOTIF descend a 10 invocations, ~37 s. `-I` remplace
# l'ancien test `file --mime` : grep saute les binaires tout seul.
#
# `-H` N'EST PAS DECORATIF — defaut trouve le 24 aout 2026. Quand la liste ne
# contient QU'UN SEUL fichier, grep n'ecrit pas son nom : la sortie devient
# `LIGNE:correspondance` au lieu de `FICHIER:LIGNE:correspondance`. Le decoupage
# ci-dessous prenait donc le NUMERO DE LIGNE pour un nom de fichier, et les deux
# garde-fous qui s'appuient dessus tombaient d'un coup :
#
#   · l'auto-exception `$MOI` ne matchait plus — le script se bloquait
#     lui-meme des qu'on le committait seul, ce qui est arrive avec ce
#     commit-ci ;
#   · les EXCEPTIONS, toutes portees sur le couple fichier::valeur, ne
#     matchaient plus non plus — committer `.githooks/README.md` seul aurait
#     ete refuse de la meme facon.
#
# Le defaut ne se voyait qu'en mode indexe, sur un commit a un seul fichier :
# la CI, qui balaie 2400 fichiers, ne pouvait pas le rencontrer.
FOUND=0
for pattern in "${PATTERNS[@]}"; do
  while IFS= read -r ligne; do
    [ -z "$ligne" ] && continue
    fichier="${ligne%%:*}"
    reste="${ligne#*:}"
    trouve="${reste#*:}"

    [ "$fichier" = "$MOI" ] && continue

    autorise=0
    for cle in "${CLES_PUBLIQUES[@]}"; do
      [ "$trouve" = "$cle" ] && autorise=1
    done
    for exc in "${EXCEPTIONS[@]}"; do
      [ "$fichier::$trouve" = "$exc" ] && autorise=1
    done
    [ "$autorise" -eq 1 ] && continue

    echo "SECRET DETECTE dans $fichier"
    echo "   motif  : $pattern"
    echo "   valeur : ${trouve:0:12}…"
    FOUND=1
  done < <(liste_fichiers | xargs -0 grep -EIHno -- "$pattern" 2>/dev/null | sort -u)
done

if [ "$FOUND" -eq 1 ]; then
  echo
  echo "REFUSE — un fichier contient ce qui ressemble a un secret."
  echo
  echo "Si c'est un vrai secret : retire-le du code, mets-le dans un secret"
  echo "Cloudflare ou une variable d'environnement, et revoque-le."
  echo
  echo "Si c'est une valeur publique legitime (nouvelle cle web Firebase par"
  echo "exemple) : ajoute-la a CLES_PUBLIQUES. Si c'est une mention inoffensive"
  echo "du motif lui-meme (doc, expression reguliere), ajoute le couple"
  echo "fichier::valeur a EXCEPTIONS, avec un commentaire qui dit pourquoi."
  echo "Le controle reste obligatoire — --no-verify n'est pas la solution,"
  echo "c'est l'aveu qu'on a arrete de le maintenir."
  exit 1
fi

echo "secrets : OK."
exit 0
