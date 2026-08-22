#!/usr/bin/env bash
# Recompile apps/decodage/app.js depuis src/.
#
#   cd apps/decodage/src && npm ci && ./construire.sh
#
# Les options ne sont PAS décoratives : `--charset=utf8` garde les accents et
# les émojis en clair dans le bundle. Sans elle, esbuild les échappe en \uXXXX
# et le fichier grossit de 3 ko pour un rendu identique — le bundle historique
# est en utf8, on reste dessus pour que les diffs restent lisibles.
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$HOME/.local/node/bin:$PATH"
./node_modules/.bin/esbuild index.jsx \
  --bundle --minify --format=iife --jsx=automatic --charset=utf8 \
  --outfile=../app.js
echo "→ apps/decodage/app.js : $(wc -c < ../app.js) octets"
