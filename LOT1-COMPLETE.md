# LOT 1 — LOCKAGE : fusionné en production le 17 août 2026

**Fusion `b61ab6b`** (PR #9), branche `lot1/vague-a-cadenas`, 17 commits.
Worker `zts-jeux-data` redéployé à la main, version **`3000b10f`**.

## Ce qui est en production

**La liste reste ouverte, la fiche se ferme.** 1439 jeux et 1880 SAÉ restent
navigables, filtrables et cherchables sans compte — c'est l'argument de vente.
Ouvrir une fiche demande un compte gratuit, sauf trois vitrines par banque.

| Vague | Livré |
|---|---|
| A | Cadenas du chrome partagé ; `code-oreille` et `planificateur` gatés |
| B | 1440 fiches de jeux tronquées, 3 fiches vitrine entières |
| C | Mur au niveau de l'item dans les deux SPA, `freeItems.sae` rempli |
| D | 112 Mo de banques hors de l'arbre publié → R2 + Worker à deux portées |
| E | `teasing.html` et `index-old.html` deviennent des pages-relais |
| F | `colorier` : verrou réel, mascotte Mr. Root, carte de partage 1200×630 |

## Tests de bout en bout — ANONYME

Tous joués en production après la fusion et le redéploiement.

### Les robinets sont fermés

| Vérification | Résultat |
|---|---|
| `apps/jeux/data/jeux-merged.json` et les 5 autres anciennes URL | **404** ×6 |
| `/jeux/full.json`, `/sae/full.json`, `/moyens-action/full.json`, `/sae/detail/…`, `/planification/…` | **401** ×5 |
| Fuite de contenu hors vitrine dans `/jeux/public.json` | **0** sur 1439 |
| `If-None-Match` sur la charge publique | **304, 0 octet** |

### Les vitrines s'allument

| Banque | Vitrines | Contenu servi |
|---|---|---|
| jeux | 3 / 3 | déroulements de 13, 10 et 9 étapes |
| SAÉ | 3 / 3 | **4, 3 et 4 cours** — l'enrichissement du Worker fonctionne |

`freeItems` est bien arrivé sur la production : la jointure s'est faite seule à
la fusion, comme prévu depuis la vague D.

### Le comportement dans les deux SPA

| Écran | Attendu | Mesuré |
|---|---|---|
| `/apps/sae/` liste | navigable sans compte | **1880 SAÉ**, 30 cartes rendues |
| SAÉ ordinaire (*La Grande Famille des Balles*) | mur, fiche jamais ouverte | **mur affiché, modale fermée, corps vide** |
| SAÉ vitrine (*Les Légendes du Basketball*) | fiche entière | **21 602 caractères, cours présents, aucun mur** |
| Appels `/sae/detail/` sur une vitrine | aucun | **0** — le repli du Worker évite le 401 inutile |
| `/apps/jeux/` liste | navigable sans compte | **1439 cartes** |
| Jeu ordinaire (*Ballon chasseur royal*) | mur | **mur affiché, modale fermée** |
| Jeu vitrine | fiche entière | **7 sections, aucun mur** |

### Les fiches statiques

| Page | Attendu | Mesuré |
|---|---|---|
| `/jeux/ballon-chasseur-royal.html` | tronquée + CTA | **3 blocs masqués, CTA présent** |
| `/jeux/1-2-3-soleil.html` (vitrine) | entière | **0 bloc masqué, pas de CTA, pas de mur** |

### Les apps gatées et les vitrines

| Page | Mesuré |
|---|---|
| `/apps/planificateur/` | **mur non fermable**, défilement bloqué — « Cette ressource est réservée aux membres gratuits » |
| `/apps/colorier/` | **pas de mur**, 4 scripts de verrou chargés, `og:image` = la carte 1200×630, `twitter:card` = `summary_large_image` **seul**, plus aucune mention de bûcheron ni de lumberjack |
| `partage-colorier.png` | **200**, 248 825 o, `image/png` |
| `teasing.html`, `index-old.html` | **200**, `meta refresh` présent, `noindex, follow` |
| `/`, `/promo.html`, `/blog.html`, `/repertoire.html`, `/avis.html`, les 9 apps | **200** partout |

### Non-régression des sous-domaines

`jeux.`, `sae.`, `musique.`, `generateur.`, `gym.` : **301 vers la bonne cible**,
inchangés par la fusion.

## ⛔ Ce qui a échoué, et n'est PAS corrigé

### La publication CI vers R2 : 43 échecs sur 43

Le workflow `Garde-fous du dépôt` **échoue sur `main`** depuis la fusion.

**Cause : le workflow n'installe jamais `wrangler`.** Le script appelle
`wrangler r2 object put` ; la commande n'existe pas sur le runner, donc chaque
objet échoue en ~4 ms. Le secret `CLOUDFLARE_API_TOKEN` est bien présent et
n'est pas en cause. L'étape ne tourne que sur `main` — elle n'avait donc jamais
été exercée avant cette fusion, et les banques de la vague D avaient été montées
**à la main**.

**Impact réel aujourd'hui : nul.** Vérifié, pas supposé : les 43 objets que le
script publie sont **octet pour octet** ceux montés à la vague D (`cd4bb89`).
Les 134 fichiers de `_data/` qu'apporte la fusion sont tous dans
`_data/sources/`, que le script ne publie pas. R2 et le dépôt sont donc en
phase.

**Ce qui est cassé, c'est la garantie**, et elle compte : la vague D avait posé
comme décision qu'*« une désynchronisation entre le dépôt et R2 doit être
structurellement impossible, pas évitée par discipline »*. Aujourd'hui elle est
évitée par hasard. **À corriger avant toute modification d'une banque** — sinon
le site servira des données périmées sans que rien ne le signale.

Le correctif tient en une étape d'installation dans le workflow, plus
vraisemblablement `CLOUDFLARE_ACCOUNT_ID`. À faire sur une branche, avec un push
de vérification sur `main` — c'est le seul endroit où l'étape s'exécute.

## Ce qui n'a pas pu être testé

**Les tests « connecté » ne sont pas joués.** Je ne crée pas de compte et je ne
saisis pas de mot de passe. Restent à faire par Joey, avec un compte gratuit
réel :

- [ ] `/apps/jeux/` : **toutes** les fiches s'ouvrent, pas seulement trois.
- [ ] `/apps/sae/` : une SAÉ quelconque s'ouvre **avec ses cours** — c'est le
      chemin `/sae/detail/…` avec jeton, celui qui répond 401 à l'anonyme.
- [ ] `/apps/planificateur/` : la bibliothèque se remplit (1439 jeux).
- [ ] **Le jeton expiré** : laisser le planificateur ouvert plus d'une heure,
      puis naviguer. La banque doit se recharger après un rafraîchissement
      silencieux — **jamais une banque vide sans message**.

Les briques que ces tests exercent ont été vérifiées indirectement : les cinq
routes à jeton répondent 401 à l'anonyme, donc le contrôle d'accès fonctionne ;
ce qui reste à prouver, c'est le chemin passant.

## Reste ouvert, par ordre d'importance

1. **La publication CI vers R2** — ci-dessus. Le seul point qui appelle une
   correction.
2. **`ia.` fait 2 sauts** : sa cible n'a pas de barre finale. Un caractère à
   ajouter dans la règle de zone, au tableau de bord — je n'ai pas de jeton
   d'API pour le faire.
3. **7 collisions de slugs dans la banque SAÉ** : deux SAÉ homonymes
   deviendraient vitrines ensemble. Aucune ne touche les vitrines actuelles.
4. **`sitemap.xml`** déclare encore `generateur.`, `gym.` et `jeux.` en `<loc>`
   alors qu'ils redirigent — avertissement GSC, à traiter avec les huit autres.
5. **~1400 fiches et `sports-news.html`** pointent encore vers
   `jeux.zonetotalsport.ca` : un saut de plus, rien de cassé. Corriger
   `scripts/gen-jeux-fiches.js:176` **avant** la prochaine régénération.
6. **`teasing.html` et `index-old.html`** restent des relais jusqu'au chantier
   proxy orange, où les 7 items de chemins s'activeront.

## Retour arrière, si jamais

`git revert -m 1 b61ab6b` **plus** un `wrangler deploy` de la version
précédente du Worker. Les deux : sinon le site sans banques locales appelle un
Worker qui a changé de contrat.

Les données ne risquent rien — R2 et le dépôt gardent tout, et les 47 Mo sans
consommateur sont dans `_data/sources/`, pas à la poubelle.
