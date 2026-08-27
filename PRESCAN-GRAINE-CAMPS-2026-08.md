# PRESCAN — Réplication de la graine camps vers ÉPS et SDG

**Date :** 2026-08-25 · **Mandat D, lecture seule** · **Échéance : septembre**

Aucun fichier modifié. Ce document est le seul écrit du mandat.

---

## 1. État de `feat/biblio-camp-seed` — le chiffre d'abord

```
en avance sur main :   0 commit
en retard  sur main : 355 commits
diff vs main        :   VIDE
```

**La branche est un ancêtre direct de `main`.** Vérifié par
`git merge-base --is-ancestor` : elle est **entièrement contenue** dans `main`.
Son HEAD (`502feb11`, 7 juillet) *est* la base commune.

**Fusion à blanc :** `git merge-tree` ne produit **aucune sortie**. Zéro conflit,
parce qu'il n'y a rien à fusionner.

> ### Il n'y a pas de fusion à faire. Tout le travail camps est déjà en production.
>
> **La branche a été supprimée le 2026-08-25** (décision Joey), locale et
> distante, après contrôle : ancêtre de `main`, 0 commit unique. Son HEAD
> `502feb11` reste joignable dans l'historique de `main` — rien n'est perdu.
> Motif : une étiquette historique qui donne l'illusion d'un travail en attente.
>
> C'était l'inconnue qui commandait le plan de septembre. Elle est levée, et dans
> le bon sens : **aucun risque de conflit, aucune dette de rebase, aucun délai**.
> La branche est une étiquette historique. On peut la supprimer, ou la laisser
> dormir — elle ne coûte rien et ne bloque rien.

### Les acquis des mandats antérieurs sont bien dans `main`

| Élément | État | Preuve |
|---|---|---|
| Bouton `.zts-action` | ✅ | Défini `shared/zts.css:349`, **82 usages** dans le Planificateur (6 `index.html` + 34 `app.js` + 42 `app-v2.js`) |
| Banque 61 activités | ✅ | `apps/planificateur/data/mini-banques-camp.json`, **61 entrées** |
| Tiroir Jeux | ✅ | `apps/planificateur/tiroir-jeux.js`, lit `PlanifData.loadBanqueCamp()` ; `dataStore.js` + tiroir chargés par `index.html` |

---

## 2. Anatomie de la banque camps

### 2.1 Les 15 champs

`apps/planificateur/data/mini-banques-camp.json` — 61 entrées, **tous les champs
présents sur les 61** (aucun trou).

| Champ | Nature | Transversal ? |
|---|---|---|
| `id`, `slug` | `mb-<source>-<titre-kebab>` | ✅ transversal |
| `title` / `titleEn` | titre bilingue | ✅ transversal |
| `but` / `butEn` | intention, une phrase | ✅ transversal |
| `deroulement` / `deroulementEn` | `Array<String>`, 2 à 4 étapes | ✅ transversal |
| `materiel` / `materielEn` | `Array<String>` | ✅ transversal |
| `duree` | `String` libre | ✅ transversal |
| `icon` | emoji | ✅ transversal |
| `univers` | `Array<String>` — **`["camps"]` sur les 61** | ⚙️ **l'axe de réplication** |
| `source` | app d'origine | ✅ transversal |
| `tags` | objet, voir ci-dessous | ⚠️ **mi-transversal, mi-propre aux camps** |

**La structure est déjà multi-univers.** `univers` est un tableau : rien à changer
au schéma pour accueillir `["eps"]` ou `["sdg"]`, ni pour qu'une activité serve
deux univers.

**Deux champs sont peu remplis** : `duree` sur **7/61**, `materiel` non vide sur
**9/61**. Ce n'est pas bloquant (le tiroir filtre sur `tags`), mais toute
promesse de filtre « par durée » serait creuse aujourd'hui.

### 2.2 Les tags — où se joue la spécificité d'univers

| Tag | Valeurs observées | Verdict |
|---|---|---|
| `materiel` | `aucun` (52), `leger` (9) | ✅ transversal |
| `espace` | `partout` (22), `interieur` (19), `exterieur` (17), `boise` (2), `terrain` (1) | ✅ transversal — `boise` est camp, mais la valeur est optionnelle |
| `groupe` | `tous` (48), `grand` (11), `petit` (2) | ✅ transversal |
| `energie` | `calme` (9), `actif` (6), `haute` (5), `moyenne` (3) | ⚠️ **incohérent** : deux échelles coexistent (`actif`/`calme` et `haute`/`moyenne`). 38/61 n'ont pas ce tag. |
| `type` | `pedago` (19), `chanson` (10), `veillee` (7), `brise-glace` (6), `jeu-eau` (6), `jeu-theme` (6), `rallye` (4), `grand-jeu` (3) | ⛔ **propre aux camps** — un vocabulaire par univers |
| `moment` | `rassemblement`, `accueil`, `soir`, `canicule`, `diner`, `bloc-matin-1`… (12 valeurs) | ⛔ **propre aux camps** — la journée d'un camp, pas celle d'une école |
| `theme` | `ralliement`, `jeu`, `pirates`, `medieval`, `jungle`, `espace`… | ⛔ **propre aux camps** |
| `age` | `8-12` (8), `5-7` (4) | ✅ transversal, mais **présent sur 12/61 seulement** |

**À retenir pour la réplication :** le squelette et 4 tags sur 8 se transposent
tels quels. `type`, `moment` et `theme` demandent **un vocabulaire par univers** —
c'est le seul vrai travail de conception.

### 2.3 D'où viennent les 61

Extraites de **8 applications existantes du dépôt**, pas créées :

| Source | Extraites | Disponibles dans l'app |
|---|---|---|
| `journee-pedago` | 19 | 45 options (7 créneaux × ~3, développées) |
| `chansons-camp` | 10 | 10 |
| `veillee-feu-de-camp` | 7 | 8 |
| `brise-glace` | 6 | 8 |
| `jeux-eau` | 6 | 8 |
| `jeux-par-theme` | 6 | 8 |
| `rallyes` | 4 | 4 |
| `grands-jeux` | 3 | 8 |

Ces apps sont des **fichiers HTML monolithiques** (13-16 Ko) avec les données
inline en `const GAMES = [...]` / `SONGS` / `SLOTS` / `MODELS`. Champs d'origine
serrés : `id, n, d, fr, en, icon, steps, age, mat, lieu, dur`.

**C'est ça, la graine :** une passe d'extraction depuis les apps « fiche unique »,
avec normalisation vers les 15 champs et pose des tags.

### 2.4 Aucun lien avec `jeux-merged.json`

**Ce sont deux banques indépendantes. Aucun doublon d'identifiant possible.**

- mini-banques : clé = `slug`, préfixe **`mb-`** sur les 61
- catalogue : clé = `id`, préfixes `pfeq_*`, `SANS_*` (1439 jeux, `_data/jeux-merged.json`)

`dataStore.js` les **fusionne à la lecture** et les normalise vers une fiche
commune (`ref` = `j.id` pour le catalogue, `e.slug` pour les mini-banques). Le
catalogue arrive du Worker `zts-jeux-data` (`/jeux/full.json`) ; les mini-banques
sont un fichier statique local.

> Le commentaire en tête de `dataStore.js` note que `slug` **n'existe pas encore**
> dans `jeux-merged.json`. Si ÉPS sème depuis le catalogue plutôt que depuis les
> apps, cette absence devient un sujet.

---

## 3. Ce que la réplication exige — chiffré

### 3.1 Le gisement, par univers

D'après le classement des pages hub (`ep.html`, `camps-de-jour.html`,
`service-de-garde.html`), en comptant les entrées réelles de chaque app :

| Univers | Semable **sans créer de contenu** | Apps sources |
|---|---|---|
| **SDG** | **68** | `journee-pedago` (19), `jeux-rapides` (10), `activites-duree` (9), `bricolages` (8), `jeux-calmes` (8), `plan-b-pluie` (8), `sos-conflits` (6) |
| **Camps** | 54 *(déjà fait : 61, `journee-pedago` inclus)* | `chansons-camp` (10), `brise-glace` (8), `grands-jeux` (8), `jeux-eau` (8), `jeux-par-theme` (8), `veillee-feu-de-camp` (8), `rallyes` (4) |
| **ÉPS** | **50** | `enigmes` (10), `comptines` (8), `echauffements` (8), `intervention-groupe` (8), `olympiades-scolaires` (8), `plan-b-meteo` (8) |

> ⚠️ **`journee-pedago` est classée SDG dans les hubs, mais ses 19 activités sont
> déjà taguées `univers:["camps"]`.** Soit on les passe en `["camps","sdg"]` — le
> champ est un tableau, c'est prévu — soit on assume l'écart. À trancher, mais
> c'est deux minutes, pas un chantier.

**Total réaliste sans écrire une ligne de contenu neuf : ~118 activités
supplémentaires** (68 SDG + 50 ÉPS), portant la banque de 61 à **~179**.

### 3.2 Le second gisement, bien plus gros — et déjà là

`_data/planification/` contient **des plans complets déjà générés**, avec leurs
générateurs :

| Fichier | Contenu | Taille |
|---|---|---|
| `ep-maternelle.json` | **90 cours** | 790 Ko |
| `ep-1er.json` | **90 cours** | 306 Ko |
| `ep-2e.json` | **90 cours** | 305 Ko |
| `ep-3e.json` | **90 cours** | 307 Ko |
| `sdg.json` | **200 jours** | 1 050 Ko |
| `camp.json` | 7 semaines × 3 groupes | 81 Ko |

Plus `_generate-ep.js`, `_generate-sdg.js`, `_generate-camp.js`.

**Les 360 cours d'ÉP annoncés dans MERGE-PLAN.md existent réellement.** Et ils
sont bien plus riches que les mini-banques — 21 champs, dont **`pfeq`,
`pfeq_principale`, `pfeq_secondaire`**, et quatre temps structurés
(`mise_en_train`, `activite_1`, `activite_2`, `retour`).

> **Ce sont des objets différents.** Une mini-banque = une activité atomique de
> 5 minutes qu'on glisse dans un bloc. Un cours ÉP = une séance complète de
> 60 minutes. **Ne pas les confondre dans la même banque** : le tiroir servirait
> des fiches de deux ordres de grandeur.

### 3.3 Champs à ajouter par univers

| Univers | Ajout | Pourquoi |
|---|---|---|
| **ÉPS** | `pfeq` : `{ principale, secondaire, savoirs[] }` | Le PFEQ est l'ossature de l'ÉPS. Le vocabulaire existe déjà dans `ep-*.json` et dans le Carnet EPS (3 compétences, ~60 critères) |
| **ÉPS** | `niveau` : `maternelle｜1er｜2e｜3e` | Remplace `age` (`5-7`/`8-12`), qui ne parle pas aux enseignants |
| **SDG** | `moment` : vocabulaire scolaire (`avant-classe`, `dîner`, `après-classe`, `pédago`) | Le `moment` camps (`canicule`, `veillée`) n'a aucun sens en service de garde |
| **SDG** | `duree` **réellement rempli** | Le SDG fonctionne par créneaux courts et contraints ; c'est là que le filtre par durée compte vraiment |
| **Les trois** | `type` : un vocabulaire par univers | 8 valeurs camps aujourd'hui, aucune transposable telle quelle |

---

## 4. Backlog `MERGE-PLAN.md`

120 lignes. Décisions **verrouillées le 2026-06-21**. Résumé de l'état réel.

### Fait

- **Phase 3 (chemin critique été)** : sélecteur biblio + seed Camp — ✅ **en prod**
- Worker `cf-worker/notify-coordo/` + `Semaines.validate()` + bouton « Valider et
  notifier le coordo » — ✅ **codé** (23 juin)
- Coquille v2 : **par défaut** depuis le 9 juillet (`?v1=1` pour revenir à l'ancienne)

### Entamé / en attente d'un geste de Joey

- **Notification coordo** : `wrangler secret put RESEND_API_KEY`, `wrangler deploy`,
  créer `coordo.zonetotalsport.ca`, recréer l'org de test, tester connecté

### Pas commencé — le backlog ÉPS de septembre (ajouté 2026-07-05)

| Item | État | Difficulté |
|---|---|---|
| **Étiquettes numériques de groupes** (101, 102, 203…) | ⛔ non commencé | Faible — le sélecteur accepte déjà un libellé libre |
| **Bascule de groupe à un tap** entre périodes | ⛔ non commencé | Moyenne — pas de re-navigation par menus |
| **Timeline période × groupe** | ⛔ non commencé | **La plus lourde.** Le mode camp est *1 groupe / jour* ; l'ÉPS est *période 1 → 101, période 2 → 203*. C'est un axe de données en plus, pas un habillage |
| **Tiroir Jeux hérite du contexte** (pré-filtre âge depuis le groupe) | ⛔ non commencé | Faible — même gabarit, seule la source du contexte change |
| Re-seed ÉP/SDG par le même pattern | ⛔ non commencé | Moyenne — voir §3 |
| Vue calendrier daté ÉP | ⛔ non commencé | Moyenne |

**La timeline période × groupe est le vrai morceau de septembre.** Tout le reste
est du réglage ; celui-là change le modèle de la journée.

---

## 5. D24 — le masquage de l'en-tête : les faits

**Correction au libellé du mandat :** ce n'est pas `?v2=1`. Le déclencheur a
changé le 9 juillet.

### Deux mécanismes distincts, souvent confondus

**A. `body.pv2`** — posé par `app-v2.js:74`, donc **dans le rendu normal du
Planificateur**. Règle `index.html:467` :

```css
body.pv2 [data-zts-header], body.pv2 .zts-subnav, body.pv2 .p-perso,
body.pv2 [data-zts-footer], body.pv2 .zts-metier-banner { display:none!important }
```

Or `state.v2 = !_params.has('v1')` (`app.js:2054`) — **v2 est le défaut**. Donc
**tout visiteur normal du Planificateur n'a ni en-tête ni pied de page ZTS**, sauf
s'il ajoute `?v1=1`. Ce n'est pas un mode d'intégration : c'est le comportement
courant.

**B. `body.zts-embed`** — posé par `?embed=1` (`app.js:2050`), pour l'affichage en
iframe dans un hub. Masque la même chose, plus le fond, et rapporte sa hauteur au
parent par `postMessage`.

### Les options, sans trancher

| # | Option | Ce qu'on gagne | Ce qu'on perd |
|---|---|---|---|
| 1 | **Statu quo** | Zéro travail. La coquille v2 est autonome et assumée depuis juillet | Le Planificateur reste hors du chrome du site : pas de menu partagé, pas de bascule de langue, pas de pied de page. Un utilisateur qui y entre par un lien direct **n'a aucun chemin de retour** |
| 2 | **Rendre l'en-tête à v2, garder le masquage pour `embed` seul** | Cohérence avec les 41 autres apps ; navigation et langue reviennent | Il faut vérifier que le chrome ne casse pas la mise en page v2 (barre métier en haut, calendrier pleine largeur). Risque visuel réel, à mesurer |
| 3 | **En-tête allégé** — logo + retour + langue, sans le menu déroulant | Compromis : on rend le chemin de retour sans encombrer | Une variante de chrome de plus à maintenir, contre le principe « un seul shell » |
| 4 | **Trancher à la fusion** | Le Planificateur devient le moteur unifié ; la question se pose alors pour ÉPS, SDG et camps d'un coup, une seule fois | On garde jusque-là une app majeure hors du chrome, y compris pour les nouveaux venus de septembre |

**Fait à peser :** le Planificateur est l'app qui reçoit le seed camps, puis ÉPS
et SDG. C'est la **porte d'entrée** de la rentrée. Un utilisateur sans chemin de
retour vers le site, en septembre, c'est un coût de conversion — pas seulement un
détail d'habillage.

### Position arrêtée (Joey, 2026-08-25) — confirmation formelle à venir

**Ni option 1 ni option 2.** Pas d'en-tête complet : le Planificateur est le
produit-phare, il a son propre décor, et la règle du shell veut que la densité
descende quand une app se réorganise. Mais un visiteur sans chemin de retour est
une **fuite** — l'aimant de la rentrée doit ramener vers ZTS.

**Retenu : chrome minimal — le logo ZTS cliquable vers l'accueil, discret, rien
d'autre.**

⚠️ **Aucune des quatre options ne décrit exactement ça.** L'option 3 est la plus
proche, mais son périmètre était plus large (logo **+ retour + sélecteur de
langue**). La position de Joey est **plus étroite** : logo seul, qui fait office
de retour. Pas de langue, pas de menu.

C'est donc une **option 3 restreinte** — à traiter comme telle au moment de coder,
et non comme l'option 3 telle qu'écrite plus haut.

---

## 6. Risques pour septembre

| # | Risque | Gravité | Note |
|---|---|---|---|
| 1 | **Timeline période × groupe** — change le modèle de la journée, pas juste l'affichage | 🔴 Élevée | Le seul item du backlog qui touche les données. À commencer en premier ; tout le reste peut suivre |
| 2 | **Vocabulaire des tags à inventer** pour `type`, `moment`, `theme` × 2 univers | 🟠 Moyenne | Travail de conception, pas de code. Le faire **avant** l'extraction, sinon on retague 118 fiches |
| 3 | **Confusion des deux gisements** — mini-banques (atomiques) vs `_data/planification` (séances complètes) | 🟠 Moyenne | Les mélanger dans le tiroir donnerait des fiches de deux ordres de grandeur. Décider tôt |
| 4 | **`duree` et `materiel` quasi vides** (7/61 et 9/61) | 🟠 Moyenne | Un filtre « par durée » promis serait creux. Le SDG en a plus besoin que les camps |
| 5 | **`energie` a deux échelles** (`actif`/`calme` vs `haute`/`moyenne`), absent sur 38/61 | 🟢 Faible | À unifier pendant l'extraction, pas après |
| 6 | **`journee-pedago` classée SDG mais taguée camps** | 🟢 Faible | Deux minutes : `univers: ["camps","sdg"]` |
| 7 | **Pas de `slug` dans `jeux-merged.json`** | 🟢 Faible | Ne mord que si ÉPS sème depuis le catalogue plutôt que depuis les apps |
| 8 | **Le Planificateur n'a pas de chrome** (§5) | 🟢 Faible techniquement, 🟠 pour la conversion | Décision, pas travail |

**Aucun risque de branche, de conflit ou de rebase.** C'était l'inconnue ; elle
est levée.

---

## 7. Séquence proposée — à valider

**Une observation d'abord :** le prescan a supprimé le risque que tu redoutais le
plus. Il n'y a pas de fusion, donc pas de dette technique à payer avant de
commencer. Septembre démarre d'une page propre — le temps disponible va au
contenu et à la timeline, pas à réparer du passé.

### Chantier 1 — Vocabulaire des tags *(conception, aucun code)*
Arrêter `type`, `moment`, `theme` pour ÉPS et SDG, plus le sort de `age` vs
`niveau` et l'unification d'`energie`. **Doit précéder toute extraction** : le
faire après, c'est retaguer 118 fiches à la main. Livrable : un tableau de
correspondance dans un document.

### Chantier 2 — Extraction SDG *(68 activités)*
SDG avant ÉPS : gisement plus gros (68 vs 50), et ses apps sources ont la même
forme que les 8 déjà traitées — le script d'extraction se réutilise presque tel
quel. C'est la répétition qui valide le pattern à moindre risque.

### Chantier 3 — Extraction ÉPS *(50 activités)*
Même passe, plus l'ajout de `pfeq` et `niveau`. Le vocabulaire PFEQ existe déjà
(`ep-*.json`, et le Carnet EPS : 3 compétences, ~60 critères — voir l'audit).

### Chantier 4 — Timeline période × groupe
**Le vrai morceau.** Étiquettes numériques + bascule à un tap + axe
période × groupe. À faire pendant que les banques sont fraîches, mais c'est
indépendant : il peut démarrer en parallèle des chantiers 2-3 si le temps presse.

### Chantier 5 — Tiroir contextuel
Pré-filtre âge/niveau hérité du groupe. Petit, et il dépend des chantiers 2-4.

### Hors séquence, à trancher quand tu veux
- **D24** : le chrome du Planificateur (§5, quatre options)
- Les 360 cours ÉP et 200 jours SDG de `_data/planification/` : **deuxième
  gisement, dix fois plus riche**, mais d'une autre nature. Mérite son propre
  chantier — pas un ajout à celui-ci.

### Sur l'ordre
Je propose 1 → 2 → 3 → 4 → 5, mais **4 peut démarrer tout de suite en parallèle**
si tu veux sécuriser l'échéance : c'est le seul item dont la durée est vraiment
incertaine, et il ne dépend d'aucun des autres.

---

# LEÇON DE MÉTHODE — mesurer le mur au lieu du catalogue

**Ajouté le 2026-08-25, après une fausse alerte qui a failli coûter un chantier.**

## Ce qui s'est passé

Recette prod du seed SDG. Mesure du catalogue via `window.ZTSBanques.jeux()` :
**1439 jeux, dont 3 seulement portant un champ `univers`**. Conclusion tirée —
et rapportée — « la copie R2 est désynchronisée du dépôt, il faut republier ».

Un mandat de republication a été ouvert sur cette base. Son prescan l'a annulé.

## Ce qui était vrai

Le Worker `zts-jeux-data` a **deux URL par banque** :

| Route | Qui | Contenu |
|---|---|---|
| `/<banque>/public.json` | tout le monde | **12 champs** de `liste` par item — `univers` n'en fait pas partie |
| `/<banque>/full.json` | jeton valide | `corps = brut` — **l'objet R2 tel quel, zéro transformation** |

La mesure a été faite **déconnectée**, donc sur `public.json`. Les 3 jeux portant
`univers` étaient les **3 vitrines**, que `reduire()` sert entières :

```js
if (vitrines.has(slug)) return { ...item, _slug: slug, _vitrine: true };
```

Vérifié : `avecUnivers === vitrines === 3`, et ce sont **les mêmes**. Ce qui
prouve l'inverse de la conclusion initiale — **R2 porte bien les univers**, sinon
les vitrines ne les auraient pas.

## La règle

> **Toute mesure du Worker doit préciser la portée (`public` / `full`) et l'état
> de connexion. Sans ça, on mesure le mur, pas le catalogue.**

Un compte de champs, un compte d'items, un filtre par univers : aucun de ces
chiffres ne veut dire quoi que ce soit tant que ces deux paramètres ne sont pas
énoncés. Les noter **dans le rapport**, pas seulement les avoir en tête.

## C'est la deuxième fois

Même famille de piège au **mandat C** : le bloc d'inscription masquait
l'application, donc la recette n'a jamais vu la barre de navigation du bas —
et le bouton de sauvegarde qui la recouvrait est passé inaperçu jusqu'à ce
qu'un vrai profil connecté l'expose.

**Le contexte anonyme fausse les recettes de ce site**, parce que presque tout y
est muré. À traiter comme une variable de test explicite, au même titre que la
largeur de viewport ou l'état du cache.

## Discipline de recette, à jour

1. **Cache forcé** avant toute mesure réseau *(retenu après deux prises)*
2. **Portée et connexion énoncées** avec tout chiffre venant du Worker *(celle-ci)*
3. Ce qu'un anonyme ne peut pas voir se teste **connecté**, ou se déclare non testé
