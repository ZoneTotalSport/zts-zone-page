# APP-DECODAGE-COMPLETE — Zone — Décodage du corps (2026-08-15)

App privée de Joey, mise en ligne sur `/apps/decodage/` + route worker `POST /decodage`
sur `api.zonetotalsport.ca`. Trois commits atomiques sur la branche `feat/app-decodage`.

## Ce qui a été fait

### Commit 1 — feat(decodage): page privée
- `apps/decodage/index.html` (nouveau) : `robots` en `noindex, nofollow`, canonical
  `https://zonetotalsport.ca/apps/decodage/` conservé, `app.js` référencé en relatif.
- `apps/decodage/app.js` (nouveau, 262 633 o) : bundle esbuild (React 19.2.8, minifié,
  IIFE, jsx automatique).
- **Provenance du bundle — à savoir** : le fichier `app.js` compilé par la session
  claude.ai (265 271 o) n'a jamais pu être transféré en fichier (collé en texte
  seulement). Le bundle commité a été **recompilé ici depuis la source
  `zonedecodagev2.jsx`** fournie par Joey, avec les deux mêmes adaptations que la
  version claude.ai : URL `https://api.zonetotalsport.ca/decodage` à la place
  d'`api.anthropic.com`, champ `model` retiré du corps (imposé côté worker), plus le
  shim `window.storage` → `localStorage` préfixe `ztsdeco:`. Comportement validé par
  15 vérifications Playwright (voir « Testé »).
- Ni sitemap.xml, ni zts-gate.js, ni locked-whitelist.json touchés.

### Commit 2 — feat(worker): route POST /decodage
- Un seul fichier touché : `cf-worker/generateur/src/generateur-worker.js`.
  Les 9 routes existantes inchangées (le bloc `/decodage` est autonome, inséré avant
  le traitement OPTIONS générique pour que le préflight reçoive SES en-têtes CORS).
- Durcissements : `system` client **jeté** (copie serveur `SYSTEM_DECODAGE`),
  `max_tokens` plafonné à 8000, `Origin` filtré (`https://zonetotalsport.ca`
  uniquement, sinon 403), modèle imposé `claude-sonnet-4-6` (pas de haiku : le front
  attend du JSON strict et ne réessaie qu'une fois), quota KV 50/jour par IP.
- Réponse : corps Anthropic **brut** (passthrough `upstream.body`), statut d'origine,
  en-têtes CORS — pas d'enveloppe `{ok, data}`.
- CORS : `Allow-Origin: https://zonetotalsport.ca`, `Allow-Methods: POST, OPTIONS`,
  `Allow-Headers: Content-Type`, `Vary: Origin`, **pas** de `Allow-Credentials`
  (front en `credentials:"omit"`).
- Quota : clé `deco:<IP>:<AAAA-MM-JJ>`, `expirationTtl: 86400`, plafond 50, incrément
  seulement après réponse upstream 2xx. Compteur **propre à cette app** — pas le
  compteur anonyme mensuel du générateur.

### Commit 3 — feat(admin): accès aux outils + garde
- `apps/studio-jeu/index.html` (la page administration confirmée par Joey) : bloc
  `<nav class="ztsadmin-outils">` en bas de page, dans la zone couverte par
  `admin-gate.js`. Deux titres : « Zone — Illustrateur de jeux » → `/apps/studio-jeu/`
  et « Zone — Décodage du corps » → `/apps/decodage/`. Tokens exacts du bundle,
  aucun `!important`, focus visible, cibles ≥ 44 px, `prefers-reduced-motion` respecté.
- `apps/decodage/admin-gate.js` (nouveau) : copie conforme de
  `apps/studio-jeu/admin-gate.js`, **seules deux lignes de titre changent**
  (« Studio Jeu » → « Zone — Décodage du corps »).
  Nuance sur la contrainte « aucun !important ajouté » : la copie transporte le
  `background:#fff !important` du bouton Google, déjà présent tel quel dans le
  gate de Studio Jeu (style interne de l'overlay, pas un fond de page — le
  garde-fou habillage ne le signale pas). Aucun !important nouveau n'a été écrit.
- `apps/decodage/index.html` : ajout de `<script src="admin-gate.js?v=1">` avant
  `app.js`.

## Vérifications — testé vs déduit

### TESTÉ (exécuté, résultats observés)
- **Banc worker (Node, fetch bouchonné, KV bouchonné) : 11/11.**
  OPTIONS → 204 avec Allow-Origin exact et sans Allow-Credentials ; GET → 405 ;
  origine tierce → 403, origine absente → 403 (zéro appel Anthropic) ; system
  malveillant du client jeté (copie serveur envoyée) ; max_tokens 999999 → 8000,
  absent → 8000 ; model = claude-sonnet-4-6 ; content[] à la racine et extraction du
  front (filter type==="text" → 1ʳᵉ { → dernière }) parsable ; 6 corps malformés
  → 400 (messages manquants / vide / rôle invalide / content non-string / 41
  messages / > 60 000 caractères) ; 50 appels passent, le 51ᵉ → 429 sans appel
  Anthropic et avec CORS, une autre IP passe, clé `deco:IP:jour` avec TTL 86400 ;
  statut d'origine (529) conservé sans incrément de quota ; non-régression /health.
- **Identité du prompt système : `SYSTEM_DECODAGE` (worker) === `SYSTEM_PROMPT`
  (source) === littéral du bundle compilé — 5914 unités UTF-16, comparaison stricte
  `===` en Node : IDENTIQUE.** (5914 = longueur JS/UTF-16 ; 5903 points de code —
  les 11 émojis astraux comptent double en JS.)
- **E2E navigateur (Playwright/Chromium, route /decodage bouchonnée) : 15/15.**
  Montage sans erreur JS, fond marine + `.ztsh-rays` en `position:fixed`, appel
  sortant vers `api.zonetotalsport.ca/decodage` avec corps
  `{max_tokens, system, messages}` **sans** `model`, 7 interprétations affichées,
  crochets « Ça m'interpelle », bouton guérison, question d'introspection,
  historique écrit en `localStorage` (`ztsdeco:`) et relu après rechargement,
  dico « kist de baker » → fiche Kyste de Baker, phrase « déchirure du ménisque
  interne gauche et kyste de Baker » → les 2 fiches.
- `node --check` sur le worker : syntaxe OK.
- shared/zts.css : `git diff --stat -- shared/zts.css` vide (vérifié avant clôture).

### DÉDUIT (non exécuté contre la prod)
- Le comportement d'Anthropic en prod (jamais appelé pendant les tests — tout est
  bouchonné). La qualité des décodages IA reste à valider en ligne par Joey.
- Le rendu de la police ZoneTotalSport en prod (le TTF est chargé depuis
  `https://zonetotalsport.ca/fonts/…` — pas accessible depuis le banc local).
- Le KV réel de Cloudflare (bouchonné dans le banc).
- Le préflight CORS réel du navigateur contre le worker déployé.

## Les trois noms d'infrastructure repris du générateur (Fusion #1)
1. **Binding KV : `ANON_QUOTA`** (même namespace que le quota anonyme du générateur ;
   les clés decodage sont préfixées `deco:` et journalières — aucun chevauchement
   avec les clés mensuelles du générateur).
2. **Secret : `ANTHROPIC_API_KEY`** (clé serveur existante, `wrangler secret`).
3. **anthropic-version : `2023-06-01`** — note honnête : le générateur passe par
   `@anthropic-ai/sdk`, qui envoie cette valeur par défaut sans l'écrire dans le
   code. La route /decodage étant un passthrough `fetch` (nécessaire pour renvoyer
   le corps brut), la valeur est explicitée.

## Points restés ouverts

1. **Dette d'authentification de la route (assumée, décision Joey).** Le bundle
   n'envoie aucun jeton : `POST /decodage` reste appelable anonymement par quiconque
   forge l'en-tête `Origin`. Garde-fous en place : system figé, modèle imposé,
   max_tokens ≤ 8000, 50/jour/IP. La vraie correction — jeton Firebase envoyé par le
   front et vérifié côté worker (`verifyIdToken` existe déjà dans `auth.js`) — exige
   de recompiler le bundle : chantier séparé. La source `zonedecodagev2.jsx` est
   maintenant disponible, ce chantier est devenu réaliste.
   → Surveiller `api.zonetotalsport.ca/decodage` dans les analytics Cloudflare les
   premières semaines : sur une app privée, tout trafic non généré par Joey est un
   signal, pas du bruit.
2. **Nature de la garde admin : purement côté navigateur.** `admin-gate.js` est du
   JS client sur hébergement statique (repo public) : il masque l'outil mais
   n'empêche pas d'ouvrir l'URL directement (ni de lire les fichiers dans le repo).
   Le vrai plafond de coût reste le quota worker. Mieux possible avec la stack
   actuelle : Firebase Auth est déjà là — le front pourrait exiger un ID token et le
   worker le vérifier (même dette que le point 1, même correction). Un vrai contrôle
   d'accès aux FICHIERS exigerait de sortir la page de GitHub Pages (p. ex. derrière
   le worker). Non implémenté dans ces commits.
3. **Bundle recompilé, pas copié.** Fonctionnellement équivalent (15 vérifs E2E,
   prompt identique), mais pas octet-pour-octet le fichier de la session claude.ai
   (262 633 o vs 265 271 o — versions esbuild/React et transform JSX différentes).
   Si le fichier original refait surface, il peut remplacer `app.js` tel quel.
4. **Em-dash dans les titres admin.** « Zone — Décodage du corps » contient un tiret
   cadratin, absent des 145 glyphes de ZoneTotalSport.ttf (règle du dépôt : tiret
   simple dans les `.ztsh-titre`). Les classes `ztsadmin-*` ne sont pas couvertes par
   le garde-fou glyphes ; le — retombera sur Luckiest Guy au milieu du titre. Libellé
   gardé tel que spécifié par la mission — à harmoniser si ça choque à l'écran.
5. **Studio Jeu = page admin ET cible « Illustrateur ».** Aucune app
   `/apps/illustrateur/` n'existe dans le dépôt ; Joey a confirmé que la page admin
   est Studio Jeu, et le titre « Zone — Illustrateur de jeux » pointe vers
   `/apps/studio-jeu/` (l'outil existant qui génère l'illustration d'un jeu). Si un
   illustrateur dédié voit le jour, changer ce href.
6. **Le banc de tests n'est pas commité** (contrainte « un seul fichier touché » au
   commit 2) : `test-decodage.mjs` est livré à côté, à rejouer avec
   `node test-decodage.mjs` depuis `cf-worker/generateur/` au besoin.

## Déploiement (rien n'a été déployé — règle CLAUDE.md respectée)
- **Site** (GitHub Pages, depuis `main`) : merger `feat/app-decodage` dans `main`
  puis pousser.
- **Worker** : depuis le dossier `cf-worker/generateur/` sur la branche à jour :
  `export PATH="$HOME/.local/node/bin:$PATH"` puis
  `wrangler deploy --env production` (procédure CLAUDE.md / wrangler.toml — jamais
  via la console Cloudflare).

## Vérifications finales en ligne (à faire par Joey après déploiement)
1. https://zonetotalsport.ca/apps/decodage/ s'affiche : fond marine, rayons qui
   tournent, titres en police ZTS.
2. Dico : « kist de baker » → fiche Kyste de Baker ; « déchirure du ménisque interne
   gauche et kyste de Baker » → les 2 fiches.
3. Décodage : symptôme → 7 interprétations + solutions + question ; crochets
   « Ça m'interpelle » ; bouton guérison.
4. Historique : persiste après fermeture/réouverture du navigateur.
5. Console réseau : l'appel part vers api.zonetotalsport.ca/decodage, réponse 200.
6. Depuis la page admin (Studio Jeu) : les deux titres apparaissent et mènent au bon
   endroit.
7. Déconnecté : /apps/decodage/ affiche la porte de connexion admin.
