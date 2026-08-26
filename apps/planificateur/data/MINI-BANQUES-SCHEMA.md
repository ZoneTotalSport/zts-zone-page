# Schéma de la mini-banque — `mini-banques.json`

**Vocabulaire gelé le 2026-08-25.** Aucune valeur hors de ce document ne doit
apparaître dans la banque. Une source qui porte une information sans case
propre part à l'arbitrage — **on n'invente pas de valeur**.

Fichier généré : ne pas éditer à la main.

```bash
node apps/planificateur/data/_generate-mini-banques.js
```

La source de vérité reste l'application d'origine (`apps/<app>/index.html`,
tableau `GAMES` / `SONGS` / `SLOTS` / `MODELS` inline). Corriger là-bas, puis
régénérer.

---

## Principe directeur : une dimension = une nature

Le vocabulaire est né du constat que quatre tags empilaient deux natures
chacun — `energie` mélangeait deux échelles, `moment` mélangeait horaire et
météo, `theme` mélangeait habillage narratif et fonction pédagogique, `duree`
mélangeait échelle qualitative et texte libre. Chaque champ ci-dessous ne
répond qu'à **une** question.

**Tag absent ≠ tag vide.** Un tag absent laisse passer tous les filtres — le
tiroir applique « inconnu = matche tout », donc on ne cache jamais de contenu.
Un tag deviné, lui, ment en silence. **En cas de doute : ne pas poser le tag.**

---

## Champs de premier niveau

| Champ | Type | Note |
|---|---|---|
| `id`, `slug` | `String` | `mb-<source>-<titre-kebab>`. Le préfixe `mb-` distingue du catalogue 1439 (`pfeq_*`, `SANS_*`…) |
| `title` / `titleEn` | `String` | |
| `but` / `butEn` | `String` | Une phrase : à quoi sert l'activité |
| `deroulement` / `deroulementEn` | `Array<String>` | 2 à 4 étapes |
| `materiel` / `materielEn` | `Array<String>` | **Obligatoire si `tags.materiel === 'specifique'`** |
| `icon` | `String` | Emoji |
| `univers` | `Array<String>` | `camps` · `sdg` · `eps`. **Une fiche peut en servir plusieurs** |
| `source` | `String` | App d'origine |
| `ageMin`, `ageMax` | `Number` | **Des nombres, pas une tranche.** Voir ci-dessous |
| `dureeMin` | `Number` | **Des minutes, pas un palier.** Voir ci-dessous |

### Pourquoi `ageMin`/`ageMax` en nombres

Les apps sources utilisaient trois échelles incompatibles (`5-7`, `5-6`,
`8-12`, `7-9`, `10-12`, `8-9`). Stocker le nombre et **rendre** la catégorie
règle le conflit : le filtre ÉPS affiche des cycles, les filtres SDG et camps
des tranches, la donnée reste unique.

C'est aussi le schéma du catalogue 1439 (`ageMin`/`ageMax`), avec lequel cette
banque fusionne à la lecture — l'aligner **supprime** une conversion.

> ⚠️ **Ne pas dériver le cycle scolaire de l'âge.** Un enfant de 8 ans est en
> 1er ou en 2e cycle selon son mois de naissance. Quand la source donne le
> niveau (les fiches ÉPS de `_data/planification/ep-*.json`), le conserver
> explicitement plutôt que le recalculer.

### Pourquoi `dureeMin` en minutes

Même raisonnement. Le catalogue porte `dureeMin` **rempli sur 1439/1439**, avec
des valeurs de 5 à 40 min dont 94 % à 15 ou moins. Des paliers `15/30/60`
mettraient une chanson de 3 minutes et un jeu de 15 dans le même seau.

---

## Tags transversaux

| Tag | Valeurs | Question posée |
|---|---|---|
| `materiel` | `aucun` · `leger` · `specifique` | De quoi ai-je besoin ? |
| `espace` | `interieur` · `exterieur` · `partout` | Filtre grossier |
| `lieu` | `gym` · `classe` · `couloir` · `local` · `boise` · `terrain` | Lieu précis, **optionnel** |
| `groupe` | `petit` · `grand` · `tous` | Combien d'enfants ? |
| `energie` | `calme` · `modere` · `actif` | Quelle intensité ? |
| `meteo` | `pluie` · `canicule` · `froid` · `vent` | **Conçu pour** cette condition |
| `fonction` | `echauffement` · `ralliement` · `retour-au-calme` · `transition` | À quoi ça sert ? |
| `theme` | `pirates` · `jungle` · `espace` · `medieval` · `eau` | Quel habillage narratif ? |
| `moment` | *par univers, voir plus bas* | Quand dans la journée ? |
| `type` | *par univers, voir plus bas* | Quelle famille d'activité ? |

### `espace` et `lieu` : deux niveaux, pas un

`espace` sert le filtre grossier ; `lieu` précise et reste facultatif. Un bois
et un terrain sont `espace: exterieur` **plus** `lieu: boise|terrain` — pas des
valeurs d'`espace`, comme c'était le cas avant le seed.

### `meteo` veut dire « conçu pour », jamais « compatible avec »

Une activité en gymnase convient à la pluie, au froid et au vent. Si le tag
voulait dire « compatible », il finirait sur toutes les fiches d'intérieur et
ne filtrerait plus rien. Il n'est posé que quand la condition est **la raison
d'être** de l'activité : les jeux d'eau pour la canicule, les plans B pour la
pluie.

### `fonction` et `moment` ne se recouvrent pas

Test de départage : **« puis-je répondre sans connaître l'horaire ? »**

- **Oui** → `fonction`. Une transition ou un retour au calme peuvent arriver
  n'importe quand : ce sont des effets recherchés.
- **Non** → `moment`. `accueil`, `diner`, `depart` sont des positions.

### `materiel: specifique` impose `materiel[]`

Annoncer du matériel sans dire lequel ne rend service à personne. Le générateur
ne pose `specifique` que lorsqu'il peut remplir la liste.

---

## Vocabulaires par univers

### `moment`

| Univers | Valeurs |
|---|---|
| `camps` | `accueil` · `rassemblement` · `diner` · `soir` · `depart` |
| `sdg` | `arrivee` · `transition` · `sieste` · `fin-de-journee` |

> **Les créneaux de grille ne sont pas des moments.** `bloc-matin-1`,
> `bloc-apres-midi-2` et consorts ont été **retirés des fiches** : le créneau
> est une propriété du placement dans le Planificateur, pas de l'activité.
> La même activité sert à 9 h et à 14 h.

### `type`

Une famille d'activité, qui suit la source dont elle vient.

| Univers | Valeurs |
|---|---|
| `camps` | `pedago` · `chanson` · `veillee` · `brise-glace` · `jeu-eau` · `jeu-theme` · `rallye` · `grand-jeu` |
| `sdg` | `jeu-calme` · `plan-b` · `bricolage` · `jeu-rapide` · `activite-duree` · `intervention` |
| `eps` | `echauffement` · `enigme` · `comptine` · `intervention` · `plan-b` · `olympiade` |

`intervention` et `plan-b` servent SDG **et** ÉPS : même famille d'activité, deux
univers. C'est voulu — le vocabulaire décrit la nature, pas la provenance.

### Propre à l'ÉPS

| Tag | Valeurs | État |
|---|---|---|
| `zone` | `global` · `cardio` · `haut` · `bas` | **peuplé** — 7 fiches, depuis `echauffements` |
| `pfeq` | compétence 1 · 2 · 3 | **vide** — voir ci-dessous |

> **Aucune des six sources ÉPS ne porte de `pfeq` ni de niveau scolaire.** Le
> mandat disait « quand la source les donne » : elles ne les donnent pas, donc
> rien n'a été inventé. Les fiches ÉPS sortent avec `ageMin`/`ageMax` seulement.
> Peupler `pfeq` demanderait un jugement pédagogique fiche par fiche — c'est un
> travail d'enseignant, pas d'extraction.

### Formes de contenu particulières

Deux sources ÉPS ne suivent pas le patron `d` + `steps` :

| Source | Forme native | Traitement |
|---|---|---|
| `comptines` | `ly` (paroles) + `gest` (geste) | `gest` → `but`, `ly` → `deroulement` en un bloc. **Suit le précédent des chansons de camp** |
| `enigmes` | `q` (question) + `a` (réponse) | `q` → `but`, `a` → `deroulement`. ⚠️ Ce n'est pas l'usage prévu de ces champs — signalé à l'arbitrage |

---

## Fichiers de travail (non committés)

Produits par le générateur, ignorés par git :

| Fichier | Contenu |
|---|---|
| `_a-arbitrer.json` | Valeurs sources sans case propre — décision de Joey |
| `_estimations-duree.json` | Fiches sans `dureeMin`, à réviser avant d'être posées |

`_doublons-sdg.md` est committé : il documente ce qui a été **écarté** et
pourquoi, comme `DOUBLONS-EXTRACTION.md` pour la passe camps.
