# LOT 1 — VAGUE D : fermer les robinets de données

**En cours.** Branche `lot1/vague-a-cadenas`. Rien en production.

## Pourquoi cette vague existe

L'audit du 10 août (§1.8) avait identifié `jeux-merged.json` — 12 Mo, 1439 jeux,
20 champs EN chacun — comme « le seul robinet qui donne tout d'un coup ». La
mesure a montré bien plus large : **112 Mo** de banques structurées étaient
servies en clair à un simple `curl`.

| Dossier | Poids | Sort |
|---|---|---|
| `jeux-merged.json` | 12,0 Mo | **R2** — banque vivante (SPA jeux, planificateur) |
| `moyens-action/data.json` | 10,4 Mo | **R2** — banque vivante |
| `sae-all-light.json` | 2,9 Mo | **R2** — banque vivante (liste SAÉ) |
| `sae/data/sae-detail/` (32 f.) | 31 Mo | **R2** — banque vivante, appelée par fiche |
| `planification/data/` (7 f.) | 2,8 Mo | **R2** — banque vivante |
| `jeux/data/jeux/` (24 f.) | 16 Mo | **`_data/sources/`** — contient de l'enrichissement non fusionné |
| `sae/data/sae/` (32 f.) | 31 Mo | **`_data/sources/`** — duplication d'enveloppe |
| `sae/data/sae-light/` (32 f.) | 1,9 Mo | **`_data/sources/`** — aucun consommateur |
| `moyens-action/daily.json` | 4,6 Mo | **`_data/sources/`** — aucun consommateur |

## Ce qui a été mesuré, pas supposé

**Les consommateurs réels, en production, dans un navigateur :**

- `/apps/jeux/` → `jeux-merged.json` seulement. `data/jeux/` jamais touché.
- `/apps/sae/` → `sae-all-light.json` au chargement, puis
  `sae-detail/<catégorie>.json` **à l'ouverture d'une fiche**. `data/sae/`
  jamais touché.
- `/apps/moyens-action/` → `data.json` seulement (son `fetch` est en ligne dans
  le HTML, d'où un premier grep manqué sur les `.js`). `daily.json` jamais
  touché — le doc de prescan de juillet se trompait sur ce point.
- `/apps/planification/` → ses 7 fichiers, par `fetch(file)`.

**`sae/data/sae/` vs `sae-detail/` — duplication confirmée.** Même schéma
(27 clés), 32 fichiers, 1880 items, et **identiques au JSON près** une fois
l'enveloppe retirée : `sae/` emballe dans `{domaine, total_sae, programme, sae}`,
`sae-detail/` est le même tableau, nu. Rien à perdre.

> Au passage : **1880 SAÉ**, pas ~1790 comme l'estimait l'audit (qui sommait
> `sae-light/`). Le site affiche « 1700+ » — la marge est plus large qu'annoncé.

**`jeux/data/jeux/` — NE PAS SUPPRIMER.** Sur ses 24 fichiers, **trois portent
un schéma plus riche que le fusionné** :

| Fichier | Items | Ce qu'il a en plus |
|---|---|---|
| `monde_batch01.json` | 65 | titres `{fr, en, es, zh}`, `noms_alternatifs` multilingues, champ `image` |
| `opposition.json` | 65 | idem |
| `poursuite.json` | 80 | idem |

`jeux-merged.json` est **bilingue FR/EN** et n'a **aucun champ image**. Ces
210 items portent donc deux langues et une illustration que la banque servie ne
contient pas. C'est du travail en cours, pas un cadavre. Voir le ticket
ci-dessous.

## Décisions

1. **Rien ne sort du dépôt.** Les 47 Mo sans consommateur vont dans
   `_data/sources/`, pas à la poubelle. On ne verrouille pas des cadavres, mais
   on ne supprime pas non plus ce qu'on n'a pas fini de lire.
2. **Banques vivantes dans R2.** Le Worker cesse de lire `raw.githubusercontent`
   (voir « résidu » plus bas) : la source devient un stockage privé.
3. **Publication automatisée, pas conventionnelle.** Une étape CI pousse les
   banques vers R2 à chaque fusion sur `main`. Une désynchronisation entre le
   dépôt et R2 doit être structurellement impossible, pas évitée par discipline.
4. **Deux URL par banque**, jamais une seule qui varie selon un en-tête —
   `Vary: Authorization` anéantirait le cache du bord et risquerait de servir la
   charge d'un membre à un anonyme.
5. **Les générateurs suivent leurs données.**
   `_data/planification/_generate-*.js` écrivent avec `__dirname` : les laisser
   dans `apps/` les aurait fait régénérer les fichiers dans l'ancien emplacement
   publié, rouvrant le robinet en silence au prochain lancement.

## Révision d'architecture consignée

`apps/planificateur/CLAUDE.md` portait, depuis le MVP : *« Bibliothèque unifiée
= JSON statique (PAS Firestore) »*. **Cette décision n'est pas renversée** — les
banques restent des fichiers statiques, elles cessent seulement d'être servies
en clair. Motif de la révision : le lockage est le pilier n°1 depuis le
10 août. La note datée est portée dans ce `CLAUDE.md` même.

## Résidu accepté, noir sur blanc

**Le dépôt est public.** `git clone` et `raw.githubusercontent.com` donnent
accès aux banques, y compris dans `_data/`, y compris après leur passage à R2 —
l'historique git les conserve. Vérifié : `raw.githubusercontent.com/…/_data/
jeux-merged.json` répond **200, 12 026 449 octets** à une requête anonyme.

**Aucune réécriture d'historique.** Le choix est assumé : on ferme **l'accès
commode** — celui d'un visiteur, d'un script, d'un concurrent pressé — pas
l'accès d'un archiviste déterminé. Même arbitrage que pour le HTML des articles
barrés (audit §1.7 et §1.8) : le verrou client n'est pas étanche, il est
dissuasif.

Trois options avaient été évaluées ; le dépôt privé a été écarté parce que
GitHub Pages ne sert un dépôt privé qu'à partir d'un plan payant — en gratuit,
passer le dépôt en privé **éteint le site**.

## Fragilité gardée en CI

Le seul rempart entre `_data/` et le web ouvert est une convention Jekyll.
**Un `.nojekyll` à la racine réexposerait les 112 Mo instantanément**, sans que
rien ne casse et sans que personne ne le voie. Le workflow `Garde-fous du dépôt`
échoue donc si ce fichier apparaît. Patron maison : une panne muette se garde
en CI.

## Reste à faire

- [x] Pipeline CI de publication vers R2 (`_scripts/publie-banques-r2.sh`)
- [x] Worker `zts-jeux-data` : source R2, plus aucune référence au dépôt
- [x] Route par chemin `sae-detail/<f>` et `planification/<f>`, jeton requis
- [x] Basculer les 5 consommateurs (jeux, planificateur, sae, moyens-action,
      planification) via `zts-banques.js`
- [x] Consigner l'état réel des sous-chemins dans `REDIRECTIONS-CLOUDFLARE.md`
      (mesuré le 17 août : query string OK, **sous-chemins NON**)
- [ ] ⛔ **BLOQUÉ — chemins profonds de `jeux.`, `generateur.` et `gym.`.**
      Il faut un **jeton d'API Cloudflare** avec « Account Filter Lists → Edit » ;
      le jeton OAuth de wrangler ne porte que workers/kv/d1 — vérifié le 17 août.
      Marche à suivre et pièges : `REDIRECTIONS-CLOUDFLARE.md`, section
      « État au 17 août ». **Seule tâche du lot qui touche la production.**
- [x] **Note datée** dans `apps/planificateur/CLAUDE.md` (révision d'architecture)
- [x] **Rebase sur `origin/main`** — au 17 août la branche contient déjà tout
      `origin/main` (`8963480`), 11 commits devant, 0 derrière. À **refaire**
      juste avant la fusion : la session parallèle pousse sur `feat/fiches-atelier`
- [ ] **Tests finaux** : les six anciennes URL + `raw` → plus de données ;
      les 4 apps fonctionnelles anonyme ET connecté ; membre → full en 200 puis 304

### État au 17 août 2026 — branche `lot1/vague-a-cadenas`

Le Worker **est en ligne** (`https://zts-jeux-data.zts-ccd.workers.dev`), le
bucket `zts-banques` contient les 43 objets. **Rien du site n'est en production**
— `main` est intact, tout vit sur la branche.

Mesuré en ligne, anonyme :

| Route | Avant | Après |
|---|---|---|
| `/jeux/public.json` | 12 026 Ko en clair | **473 Ko**, 1439 items, 0 champ de contenu |
| `/sae/public.json` | 2 880 Ko en clair | **721 Ko**, 1880 items, 0 champ pédagogique |
| `/jeux/full.json`, `/sae/detail/…`, `/planification/…`, `/moyens-action/full.json` | ouverts | **401** |
| ETag + `If-None-Match` | — | **304**, 0 octet |

Les vitrines rendent 0 : le Worker lit `locked-whitelist.json` sur la
**production**, qui n'a pas encore `freeItems`. La jointure est vérifiée bonne
(les trois slugs existent avec les bons titres) — elles s'allumeront à la fusion,
sans autre intervention.

### À la fusion — trois choses à ne pas oublier

1. **Le secret `CLOUDFLARE_API_TOKEN`** doit être en place dans les secrets
   Actions, sinon l'étape de publication échoue (bruyamment, c'est voulu).
2. **`freeItems`** arrive avec la branche : les vitrines s'allument d'elles-mêmes.
3. Vérifier que `wrangler.toml` ne porte **aucun** `GITHUB_REF` / `GITHUB_REPO` —
   leur réapparition serait une régression vers la lecture par `raw`.

## Deux petits fichiers laissés servis, volontairement

- `apps/musique/data/audio_urls.json` (320 Ko) — des URL, pas du contenu.
- `apps/studio-jeu/data/jeux-index.json` (896 Ko) — index allégé d'une app
  privée derrière `admin-gate.js`.

---

## TICKET SÉPARÉ — enrichissement des jeux

**Ce n'est pas de la dette, c'est de la valeur produit non livrée.**

1. **210 jeux en quatre langues à fusionner** — `monde_batch01`, `opposition`,
   `poursuite` dans `_data/sources/jeux-categories/`. Titres et noms
   alternatifs en `fr, en, es, zh` ; `jeux-merged.json` n'est que FR/EN.
2. **65 illustrations à produire.** Les items riches déclarent
   `image: "data/img/MO1_001.svg"` — **le dossier n'existe pas**. Les
   illustrations ont été prévues, jamais dessinées. C'est aussi la réponse à la
   question « fiches vitrine illustrées » de la vague B : le champ existe côté
   données, les fichiers non.
3. ⚠ **L'outil de fusion est hors dépôt et n'est pas rejouable.** Aucun script
   du dépôt ne fabrique `jeux-merged.json` ni `sae-all-light.json` — vérifié :
   les cinq fichiers qui les mentionnent sont tous des *consommateurs*. La
   fusion a été faite à la main ou par un outil perdu. **À retrouver ou à
   réécrire avant toute fusion**, sinon on repart d'une reconstruction complète.
