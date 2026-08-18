# LOT 1 — LOCKAGE : fusionné en production le 17 août 2026

**Fusion `b61ab6b`** (PR #9), branche `lot1/vague-a-cadenas`, 17 commits.
**Correctif CI** : PR #11, fusionnée le 18 août.
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

## La publication CI vers R2 — cassée à la fusion, réparée le 18 août

**Ce qui s'était passé.** Le workflow `Garde-fous du dépôt` a échoué sur `main`
dès la fusion : 43 objets sur 43 en échec, chacun en ~4 ms. Le secret
`CLOUDFLARE_API_TOKEN` n'était pas en cause.

**Trois défauts, dont un seul avait été diagnostiqué :**

1. **Le workflow n'installait pas `wrangler`.** Le script appelle
   `wrangler r2 object put` ; le binaire n'est pas préinstallé sur les runners
   GitHub. Chaque objet échouait sur une commande introuvable.
2. **Le script avalait la sortie d'erreur de wrangler** (`2>&1` vers
   `/dev/null`). C'est ce qui a rendu une panne triviale indiscernable de
   43 pannes réseau, et ce qui a coûté le temps de diagnostic.
3. **`--essai` n'appelait jamais wrangler** : il se contentait de lister des
   noms de fichiers. Il serait donc passé au vert le jour même de la panne.

**La vraie leçon n'est aucune des trois.** L'étape ne tournait **que sur
`main`** : aucune PR ne pouvait la voir échouer, donc le défaut n'était
découvrable qu'une fois en production.

**Ce qui a été posé :**

- une étape d'installation de wrangler, épinglée au majeur ;
- un garde-fou qui vérifie l'outil **avant** de compter des échecs — une cause
  unique se lit une fois, en clair, pas 43 fois en creux ;
- la sortie d'erreur de wrangler conservée et réaffichée sous chaque échec ;
- `--essai` sonde désormais R2 **en lecture réelle** (liste des buckets), ce qui
  prouve les trois choses qui avaient cassé : wrangler répond, le jeton ouvre
  R2, le bucket existe ;
- cet essai tourne **sur chaque PR**, en lecture seule — une branche ne doit
  jamais écraser les banques que sert la production.

**Vérifié de bout en bout :**

| Étape | Résultat |
|---|---|
| En local, sans wrangler dans le PATH | **sortie 1**, un message unique nommant la cause |
| Essai à blanc sur la PR #11, avec le jeton de la CI | `SONDE OK — le bucket « zts-banques » est accessible`, 43 objets vus, rien écrit |
| Publication réelle au push sur `main` (`32131443228`) | **43 OK, 0 échec** — « Toutes les banques sont à jour dans R2 » |
| Le Worker après republication | `/jeux/public.json` 200, `/sae/public.json` 200, **3 vitrines SAÉ à 4/3/4 cours**, `/jeux/full.json` toujours **401** |

La sonde répondant avec le jeton de la CI, aucun `CLOUDFLARE_ACCOUNT_ID` n'est
nécessaire : le jeton n'ouvre qu'un compte.

**La garantie de la vague D est rétablie** : une désynchronisation entre le
dépôt et R2 redevient structurellement impossible, et non plus évitée par
discipline. C'était le dernier morceau de la vague D.

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

1. **`ia.` fait 2 sauts** : sa cible n'a pas de barre finale. Un caractère à
   ajouter dans la règle de zone, au tableau de bord — je n'ai pas de jeton
   d'API pour le faire.
2. **7 collisions de slugs dans la banque SAÉ** : deux SAÉ homonymes
   deviendraient vitrines ensemble. Aucune ne touche les vitrines actuelles.
3. **`sitemap.xml`** déclare encore `generateur.`, `gym.` et `jeux.` en `<loc>`
   alors qu'ils redirigent — avertissement GSC, à traiter avec les huit autres.
4. **~1400 fiches et `sports-news.html`** pointent encore vers
   `jeux.zonetotalsport.ca` : un saut de plus, rien de cassé. Corriger
   `scripts/gen-jeux-fiches.js:176` **avant** la prochaine régénération.
5. **`teasing.html` et `index-old.html`** restent des relais jusqu'au chantier
   proxy orange, où les 7 items de chemins s'activeront.

## Retour arrière, si jamais

`git revert -m 1 b61ab6b` **plus** un `wrangler deploy` de la version
précédente du Worker. Les deux : sinon le site sans banques locales appelle un
Worker qui a changé de contrat.

Les données ne risquent rien — R2 et le dépôt gardent tout, et les 47 Mo sans
consommateur sont dans `_data/sources/`, pas à la poubelle.
