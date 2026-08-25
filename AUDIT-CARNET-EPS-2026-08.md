# AUDIT — Carnet EPS (`apps/evaluation/`)

**Date :** 2026-08-25 · **Mandat :** A (lecture seule) · **Cible :** absorption future
dans l'onglet ÉVALUATION du Planificateur (fusion #3)

Aucun fichier n'a été modifié. Ce document est le seul écrit de l'audit.

---

## 1. La source Vite : INTROUVABLE (confirmé)

### Ce qui a été fouillé

| Recherche | Portée | Résultat |
|---|---|---|
| `vite.config.*` | `~/Desktop`, `~/Documents`, `~/dev`, `~/Downloads`, `~/PROJETS_CLAUDE`, iCloud, Google Drive (2 comptes) | **4 projets Vite**, aucun n'est le Carnet |
| `grep -ril "Carnet EPS"` | mêmes racines | **uniquement des copies du build** (9 clones de `apps/evaluation/`) |
| `package.json` | `~` sur 7 niveaux | 8 projets réels, aucun ne correspond |
| Spotlight `mdfind` | disque entier, contenu indexé (`carneteps-groups`, `App.jsx`) | rien hors builds |
| `git log --all --name-only` | dépôt `app-evaluation` | **aucun `src/`, aucun `package.json` n'a jamais été committé** |

### Les 4 projets Vite de la machine — aucun n'est le Carnet

| Projet | Chemin | Stack |
|---|---|---|
| `scoreboard-basketball` | `~/dev/Remotion 2/scoreboard-basketball` | React (`src/App.jsx`) |
| `omnigroupe` | `~/Desktop/OmniGroupe` | React 19 + Tailwind 4 + lucide-react |
| `planificateur-fls` | `~/PROJETS_CLAUDE/planificateur-fls` | **Vue** (`App.vue`) |
| `zts-workout` | `~/PROJETS_CLAUDE/zts-workout` | JS vanilla + router maison |

Le mandat annonçait 2 projets Vite ; il y en a **4**. Les deux ajouts
(`planificateur-fls`, `zts-workout`) ne sont pas des candidats : ni React, ni
lucide, ni sujet d'évaluation.

`~/Desktop/OmniGroupe` est le seul dont la stack (React + Tailwind + lucide)
correspond à celle du bundle — mais son `src/` est celui d'OmniGroupe, pas du
Carnet.

### Le dépôt `app-evaluation` n'a jamais contenu de source

Clone local : `~/Desktop/app-evaluation` (aussi `~/PROJETS_CLAUDE/app-evaluation`).
Remote : `github.com/ZoneTotalSport/app-evaluation`. Une seule branche (`main`).

L'historique complet (`git log --all --pretty=format: --name-only`) ne contient
que des fichiers publiés. Il révèle **4 générations du bundle** :

```
assets/index-B9JeHlau.js
assets/index-BqzDoR3c.js   ← celui en production
assets/index-CfXcYemz.js
assets/index-DN0Hu1Mm.js
```

Quatre builds successifs ont été poussés sans qu'aucun commit de source ne soit
fait. **La source n'a jamais été versionnée nulle part.**

### Conclusion A1

> **La source Vite du Carnet EPS est perdue.** Elle n'existe ni sur cette
> machine, ni dans l'historique du dépôt de déploiement. Toute reprise devra
> partir du bundle (rétro-ingénierie) ou d'une réécriture.

Le bundle est **partiellement lisible** — c'est la bonne nouvelle : minification
esbuild qui **préserve les noms de propriétés** et **toutes les chaînes**
(template literals). Les structures de données, l'i18n et l'arbre PFEQ sont
extractibles tels quels. Seuls les noms de variables locales et de composants
sont perdus (`Dt`, `He`, `Ye`…). Aucun `sourceMappingURL`.

### Code mort découvert au passage

`apps/evaluation/app.js` (99 819 octets) est la **V1 vanilla** du Carnet
(« Carnet EPS — Dual Mode », modes Aujourd'hui / Évaluation / Chrono / Compteur
/ Résumé). **`index.html` ne le charge plus** — seul le bundle React est chargé.
Il reste servi en production sans être utilisé.

Bonne nouvelle : la V1 vanilla **écrit exactement les mêmes clés `carneteps-*`**
que la V2 React. Les données d'un enseignant venu de la V1 sont lisibles par la
V2 sans conversion. Cette V1 est aussi la meilleure documentation lisible du
modèle de données (code non minifié, commenté en français).

---

## 2. Inventaire du bundle (`index-BqzDoR3c.js`, 366 617 o)

### Stack

React 19 (`createRoot`, `StrictMode`) + lucide-react (icônes inlinées comme
tableaux de `path`) + Tailwind (via CDN, chargé par `index.html`).

**Aucune dépendance réseau dans le bundle** — vérifié : 0 occurrence de
`firebase`, `firestore`, `fetch(`, `react-router`, `zustand`, `dexie`,
`recharts`, `jspdf`, `xlsx`. L'app est **entièrement autonome et locale**.

L'authentification et le mur ZTS sont **hors bundle**, injectés par `index.html`
(`/firebase-auth.js`, `/zts-lock-page.js`, `/zts-locked-fullscreen.js`,
`/zts-funnel.js`).

### Écrans / vues

Sept vues, identifiées par `id:` dans la barre de navigation :

| `id` | Libellé FR | Rôle |
|---|---|---|
| `dashboard` | Tableau de bord | Groupes actifs, élèves total, évaluations du jour, élèves à surveiller |
| `classes` | Mes Groupes | CRUD groupes + élèves, trombinoscope, journal de bord |
| `evaluate` | Évaluation & Outils | Présences, équipes, chrono, régulation, éval par compétences, tests physiques |
| `planning` | Planificateur | Grille horaire jour × période, assignation de groupes |
| `reports` | Rapports & Bulletins | Absences, retards, moyennes, statut complet/incomplet, export CSV |
| `games` | Banque de jeux | Jeux locaux (titre, catégorie, durée, lieu, description) |
| `settings` | Paramètres | Profil, critères perso, dates d'étapes, sauvegarde/restauration, langue, zoom |

Une **landing page** est intégrée au bundle (état `carneteps-landed`), avec 8
tuiles de présentation.

### Fonctions — vérification demandée

| Fonction annoncée | Statut | Preuve |
|---|---|---|
| PFEQ multi-échelles | ✅ **Confirmé** | Arbre `agir`/`interagir`/`sante` + 5 barèmes |
| Présences photo | ✅ **Confirmé** | IndexedDB `carneteps-photos-db`, clic photo = statut |
| Rapports | ✅ **Confirmé** | Vue `reports` + `exportCSV` + `text/csv` |
| Chrono / laps | ✅ **Confirmé** | `chrono`, `navette_laps`, tableau de paliers |
| Régulation | ✅ **Confirmé** | « Banc de retrait avec timer », clés `carneteps-conflicts-*` |
| Hors-ligne | ⚠️ **Nuance** | Voir ci-dessous |
| 5 langues | ✅ **Confirmé**, mais **pas celles attendues** | Voir ci-dessous |
| Absence tests navette / Cooper | ❌ **INFIRMÉ pour la navette** | Voir ci-dessous |

#### ⚠️ « Hors-ligne » n'est pas une PWA

0 occurrence de `serviceWorker`, `manifest`, `workbox`, `navigator.onLine`. La
tuile de la landing dit exactement : **« Hors-ligne — Données sur ton appareil »**.
C'est une promesse de *souveraineté des données* (tout en localStorage), pas de
fonctionnement sans réseau. **Un premier chargement exige la connexion** (React
est servi depuis le site, Tailwind et Google Fonts depuis des CDN externes).

#### ⚠️ Les 5 langues sont fr, en, es, **ru**, zh

Le russe, pas l'arabe ni le portugais. Blocs i18n complets confirmés :
`fr:{dashboard:…}`, `en:`, `es:`, `ru:`, `zh:`. Environ 200 clés chacun, tous
traduits (y compris les libellés PFEQ et les tests physiques).

Divergence à noter avec le reste du parc ZTS, qui est en **{fr, en, es, zh}**.
Le russe est une exclusivité du Carnet.

**Décision (Joey, 2026-08-25) : à la fusion, on garde FR/EN et on coupe le reste.**

#### ❌ Les tests physiques SONT présents (correction)

Le mandat demandait de confirmer leur absence. **Ils sont là** :

- **Test Léger-Boucher** (`legerBoucher`) — table de 21 paliers en dur
  (`{level, shuttles, speed, timePerShuttle}`, de 8 km/h à ~18 km/h), avec
  écriture de 4 mesures par élève : `leger_palier`, `leger_distance`,
  `leger_navette`, `leger_vitesse`.
- **Course Navette** (`navette`) — chrono par tour, `navette_laps` stocké en
  JSON.
- Menu **« Tests Physiques »** (`physTests`), traduit dans les 5 langues
  (`Beep Test` / `Shuttle Run` en anglais).

**Test de Cooper : absent, confirmé.** Les 2 occurrences de « Cooper » dans le
bundle sont le critère PFEQ `cooperation`, pas le test des 12 minutes.

### Modèle de données

**Aucun Firestore. Aucun réseau. localStorage + IndexedDB.**

#### Table des clés (`He`, 17 entrées)

```
carneteps-groups         carneteps-data           carneteps-attendance
carneteps-photos         carneteps-voice          carneteps-custom
carneteps-toggles        carneteps-pfeq           carneteps-evallabels
carneteps-evalcolors     carneteps-colormeanings  carneteps-stt
carneteps-title          carneteps-zoom           carneteps-lastgroup
carneteps-mode           carneteps-lang
```

#### Clés hors table (écrites en littéral par la V2 React)

```
carneteps-profile        carneteps-schedule       carneteps-games
carneteps-etape-dates    carneteps-landed
carneteps-conflicts-<…>  (régulation, préfixe dynamique)
carneteps-photos-db      (IndexedDB, store « photos »)
```

#### Structures

> **Référence de lecture :** tout ce qui suit est corroboré par `apps/evaluation/app.js`
> (V1 vanilla, non minifiée, commentée en français), qui écrit les mêmes clés.
> **Le citer plutôt que de deviner depuis le bundle** — c'est la source de vérité
> lisible du modèle de données.

**`carneteps-groups`** — tableau :
```js
{ id, name, level, color, students: [ { id, name } ] }
```
Ids générés par `${prefix}-${Date.now()}-${random36}` — p. ex. `st-1712…-a3f2b`.
**Non stables entre appareils** : deux imports du même groupe créent deux jeux
d'ids.

**`carneteps-data`** — évaluations, arbre à 4 niveaux :
```js
{ [groupId]: { [date]: { [studentId]: { [critereKey]: valeur } } } }
```
`date` au format généré par la fonction locale `at()` (aussi utilisée pour
nommer les backups). Accès : `Ye(groupId, date, studentId, critereKey)`,
écriture `A(groupId, date, studentId, critereKey, valeur)`.

**`carneteps-attendance`** — même forme sur 3 niveaux :
```js
{ [groupId]: { [date]: { [studentId]: 'present' | 'absent' | 'retard' } } }
```
Défaut implicite : `present`.

**`carneteps-photos-db`** (IndexedDB v1, store `photos`) — clé = `studentId`,
valeur = dataURL JPEG **redimensionnée à 400 px** côté client via canvas.

#### Arbre PFEQ

Trois compétences, ~60 critères au total :

| Clé | Libellé | Emoji | Couleur | Critères |
|---|---|---|---|---|
| `agir` | Agir (C1) | 🏃 | blue | 27 (`execution`, `principes`, `efficacite`, `planification`, `evaluation_a`, `equilibre`, `coordination`, `locomotion`, `manipulation`, `reception`, `lancer_precision`, `lancer_force`, `lancer_trajectoire`, `dribble`, `saut`, `roulade`, `grimper`, `esquive`, `feinte`, `posture`, `rythme`, `enchainement`, `precision_a`, `puissance`, `souplesse`, `endurance`, `vitesse`) |
| `interagir` | Interagir (C2) | 🤝 | orange | `cooperation`, `opposition`, `communication`, `synchronisation`, `strategie`, `demarquage`, `marquage`, `passes`, `arbitrage`, `role_attaque`, `role_defense`, `adaptation`, `transitions`, `ethique`, `leadership`, `gestion_conflits`, `encouragement`, `travail_equipe` |
| `sante` | Santé (C3) | ❤️ | pink | `habitudes`, `nutrition`, `hygiene`, `sommeil`, `frequence_cardiaque`, `intensite`, `condition_physique`, `echauffement`, `relaxation`, `securite`, `image_corporelle`, `gestion_stress`, `bien_etre`, `objectifs`, `autonomie`, `perseverance`, `respect_regles` |

Plus une 4e catégorie **`c4` / `custom_`** : critères créés par l'enseignant
(`carneteps-custom`).

**Contrainte dure :** l'évaluation est limitée à **5 critères sélectionnés
simultanément** (`n.length >= 5` refuse le 6e).

#### Échelles (`typeEchelle`) — 4 modes, 5 niveaux, une seule table de conversion

```js
{ Vert:100, Jaune:80, Rouge:60, Rubis:40, Gris:20,
  A:100, B:80, C:60, D:40, E:20,
  5:100, 4:80, 3:60, 2:40, 1:20,
  '++':100, '+':80, '+/-':60, '-':40, '--':20 }
```

Couleurs, lettres, chiffres, symboles — toutes ramenées au même barème
**/100 par pas de 20**. C'est le pivot de conversion pour la migration.

#### Contexte d'évaluation (état de session, non persisté tel quel)

```js
{ date, moyenAction: 'Basketball', selectedCriteria: [], typeEchelle: 'couleurs',
  ponderation: 15, etape: 'Etape 1', anneeScolaire: '2025-2026' }
```

### Export / import existant

**Export** (`Sauvegarde` → `Télécharger .json`) : fichier
`carneteps-backup-<date>.json`, objet plat `{ cléLocalStorage: valeurBrute }`,
couvrant les **17 clés de `He` + toutes les clés `carneteps-conflicts-*`**.

**Import** (`Restaurer`) : réécrit chaque paire dans localStorage, **sans
validation, sans fusion — écrasement pur**.

Export CSV également disponible (`text/csv`) pour les rapports.

#### ⚠️ Trois trous dans le backup — à corriger avant toute migration

1. **Les photos d'élèves ne sont PAS sauvegardées.** `carneteps-photos-db` est
   en IndexedDB ; `ct()` ne lit que `localStorage`. Un enseignant qui exporte,
   réinstalle et restaure **perd tout son trombinoscope** sans avertissement.
2. **5 clés actives de la V2 ne sont pas sauvegardées** : `carneteps-profile`
   (nom, école), `carneteps-schedule` (grille horaire), `carneteps-games`
   (banque de jeux perso), `carneteps-etape-dates` (dates des étapes),
   `carneteps-landed`. Elles ne figurent pas dans `He`.
3. **Inversement**, `He` sauvegarde 11 clés que la V2 React **ne lit plus**
   (`toggles`, `pfeq`, `voice`, `photos`, `title`, `colorMeanings`,
   `evalColors`, `stt`, `mode`, `lastGroup`, et `photos` en localStorage) —
   héritage de la V1 vanilla. Sans effet nocif, mais le backup ne reflète pas
   l'app réelle.

**Conséquence directe :** on ne peut pas fonder la migration sur le fichier de
backup existant. Il faut un exporteur dédié.

#### Décision sur le badge « Hors-ligne » (Joey, 2026-08-25)

Le badge ment en l'état. Deux options étaient sur la table — reformuler la tuile,
ou ajouter un service worker minimal (cache-first sur le bundle, ~30 lignes,
posable sans toucher au build). **Retenu : le service worker** — c'est le seul
ajout qui rend la promesse vraie, et il survit à la migration.

**Non urgent** : du confort, à faire après l'exporteur (A-bis) et le mandat B.

---

## 3. Plan de migration vers l'onglet ÉVALUATION du Planificateur

### La cible

`apps/planificateur/` est sur **Firestore**, avec les collections pertinentes :

| Collection | Champs observés |
|---|---|
| `groupes` | `nom`, `orgId`, `animateurUid`, `theme`, `metier` |
| `enfants` | `prenom`, `nom`, `photoUrl`, `groupeId`, `personnesAutorisees[]`, `particularites[]`, `noteParticuliere` |
| `evaluations` | `groupeId`, `enfantId`, `critereId`, `date`, `valeur` (String), `ts` |
| `evalConfig` | doc par groupe : `{ colonnes }` |
| `grillesType` | `groupeId`, `blocs[]` |
| `presences` | `journeeId`, `groupeId`, `enfantId`, `ts` |

Les deux modèles sont **structurellement compatibles**. Le Carnet stocke un
arbre imbriqué, le Planificateur des documents plats — c'est un aplatissement
mécanique, pas une refonte.

### Correspondance

| Carnet EPS (local) | Planificateur (Firestore) | Difficulté |
|---|---|---|
| `groups[].{id,name,level,color}` | `groupes` + `nom` | Facile. `level`/`color` n'ont pas de champ d'accueil → à ajouter, ou mapper `level` → `theme`. |
| `groups[].students[].{id,name}` | `enfants` + `prenom`/`nom` | **Moyenne.** Le Carnet a **un seul champ `name`**, le Planificateur en a deux. Découpage au premier espace, avec revue manuelle. |
| `data[g][date][s][crit] = valeur` | 1 doc `evaluations` par quadruplet | Facile mais **volumineux** : un groupe de 30 élèves × 5 critères × 20 séances = 3 000 documents. |
| `attendance[g][date][s]` | `presences` | **Difficile.** Le Carnet a 3 états (`present`/`absent`/`retard`) ; `presences` est indexé par `journeeId`, notion absente du Carnet. Il faut créer les journées ou ajouter un champ `date` + `statut`. |
| Photos IndexedDB (dataURL 400 px) | `enfants.photoUrl` | **Difficile.** dataURL → upload R2 (`img.zonetotalsport.ca`, déjà en place pour les fiches) → URL. Firebase Storage est écarté (exige Blaze). |
| `typeEchelle` + barème /100 | `evaluations.valeur` (String) + `evalConfig` | Facile : stocker la **valeur brute** (`Vert`, `A`, `4`, `++`) et l'échelle dans `evalConfig`. Le pivot /100 permet de rejouer n'importe quel affichage. |
| Arbre PFEQ (~60 critères) | `critereId` | Facile : les clés (`execution`, `dribble`…) sont déjà des identifiants stables. À figer comme référentiel partagé. |
| `carneteps-custom` | `evalConfig` / `grillesType` | Facile. |
| `carneteps-schedule` | Grille du Planificateur | À arbitrer : deux planificateurs coexistent. |
| `carneteps-games` | Banque de jeux ZTS | À arbitrer : doublon avec la banque de 1 439 jeux. |
| `leger_*`, `navette_laps` | **aucun équivalent** | Le Planificateur n'a pas de tests physiques. À créer, ou à traiter comme des `critereId` réservés. **Le Léger-Boucher et ses 21 paliers existent déjà côté Carnet** : le manque réel se réduit au **test de Cooper** et aux **normes par âge**. |

### Séquence recommandée

**Étape 0 — Ne rien casser.** Le Carnet reste en ligne, inchangé, tant que la
migration n'est pas prouvée. Aucun utilisateur ne doit perdre de données parce
qu'on a bougé.

**Étape 1 — L'exporteur = le pont de migration (mandat A-bis).** Ce n'est pas
seulement un correctif de perte de données : le JSON qu'il produit est **le
format d'entrée de l'importeur** de l'onglet ÉVALUATION. Un seul geste répare le
bug d'aujourd'hui et construit l'import de demain. Un export **complet** :
- les 17 clés de `He`,
- les 5 clés orphelines (`profile`, `schedule`, `games`, `etape-dates`, `landed`),
- les `carneteps-conflicts-*`,
- **et le contenu d'IndexedDB `carneteps-photos-db`**, en base64 dans le JSON.

Format versionné : `{ version: 2, exportedAt, localStorage: {…}, photos: {…} }`.
C'est le seul livrable dont dépend tout le reste.

> **Critère de recette (Joey, 2026-08-25) — non négociable :**
> export → **effacement complet des deux magasins** (`localStorage.clear()` +
> suppression de la base IndexedDB) → import → **trombinoscope intact**.
> Tant que ce cycle ne passe pas, l'exporteur n'est pas livré.

**Étape 2 — Importeur côté Planificateur.** Lit le JSON v2, propose un écran de
correspondance (découpage prénom/nom, choix du groupe cible), puis écrit en
Firestore par lots. **Idempotent** : réimporter le même fichier ne doit pas
dupliquer. Clé de déduplication suggérée :
`${groupeId}_${enfantId}_${critereId}_${date}` comme id de document
`evaluations` — le Carnet n'ayant pas d'ids stables, on les dérive du contenu.

**Étape 3 — Photos vers R2.** Les dataURL 400 px partent vers `zts-fiches`
(ou un bucket dédié) derrière `img.zonetotalsport.ca`. Voir le précédent des
fiches de jeu.

**Étape 4 — Bascule.** Le Carnet affiche un bandeau « exportez vos données ».
Une fois la fenêtre écoulée, `apps/evaluation/` redirige vers l'onglet
ÉVALUATION. Le dossier reste en place (les URL indexées ne doivent pas tomber
en 404).

**Étape 5 — Nettoyage.** Retirer `app.js` (V1 vanilla, code mort, 99 Ko) et les
3 bundles obsolètes de l'historique de `app-evaluation`.

---

## 4. Risques

| # | Risque | Gravité | Ce qu'on fait |
|---|---|---|---|
| 1 | **Les photos disparaissent au premier export.** IndexedDB hors backup, silencieusement. | 🔴 Élevée | Bloquant. Étape 1 avant tout le reste. |
| 2 | **Données invisibles.** Tout est dans le navigateur de chaque enseignant. Personne ne sait combien de gens utilisent le Carnet ni ce qu'ils y ont mis. Un `localStorage.clear()`, un changement de navigateur, un nettoyage Safari — et c'est parti. | 🔴 Élevée | Communiquer tôt. Ne pas dépendre d'un délai court : un prof qui rouvre l'app en septembre doit encore trouver son export. |
| 3 | **Aucune source.** Modifier l'app veut dire patcher un bundle minifié, ou réécrire. | 🔴 Élevée | Pour l'étape 1, un **script d'export séparé** chargé par `index.html` suffit : il lit localStorage et IndexedDB sans toucher au bundle. Zéro rétro-ingénierie. |
| 4 | **Ids non stables.** `Date.now()`+random, locaux à un appareil. Deux imports = deux jeux d'élèves. | 🟠 Moyenne | Ids dérivés du contenu à l'import, écran de correspondance manuel. |
| 5 | **`name` unique vs `prenom`/`nom`.** Découpage ambigu (« Marie-Pier St-Onge »). | 🟠 Moyenne | Découpage proposé + correction manuelle avant écriture. |
| 6 | **Volume Firestore.** Milliers de documents `evaluations` par enseignant, sur le plan gratuit. | 🟠 Moyenne | Chiffrer avant d'ouvrir l'import. Envisager un doc par (groupe, date) plutôt qu'un par cellule. |
| 7 | **Présences sans `journeeId`.** Le modèle cible suppose une journée ; le Carnet ne connaît que des dates. | 🟠 Moyenne | Créer des journées synthétiques, ou ajouter `date`+`statut` à `presences`. |
| 8 | **Perte de fonctions.** Léger-Boucher, navette, régulation, chrono, émulation, 5 langues n'existent pas dans le Planificateur. | 🟠 Moyenne | Décider explicitement, par fonction : porter ou abandonner. Ne pas laisser l'arbitrage se faire par omission. |
| 9 | **Régression linguistique.** Le Carnet a 5 langues ; le Planificateur n'en aura que 2. | 🟢 Faible | **Tranché (Joey, 2026-08-25) : à la fusion, FR/EN seulement.** `es`, `ru`, `zh` sont abandonnés. À annoncer, pas à laisser découvrir. |
| 10 | **`app.js` mort en production.** 99 Ko servis pour rien, et il reste la meilleure doc du modèle. | 🟢 Faible | Le lire avant de le supprimer. |
| 11 | **Le Carnet dépend de CDN externes** (Tailwind CDN, Google Fonts) — contraire à la règle ZTS « zéro Google Fonts ». | 🟢 Faible | Sans objet si l'app est absorbée. |

---

## 5. Recommandation

L'ordre qui compte : **réparer l'export avant de parler de fusion.** Tant que
l'exporteur laisse les photos derrière lui, chaque jour qui passe est un jour où
un enseignant peut perdre son trombinoscope en croyant l'avoir sauvegardé.

Le reste — correspondance des modèles, écriture Firestore, bascule — est du
travail mécanique sur des structures qui s'alignent bien. Le seul vrai chantier
d'arbitrage est la liste des fonctions du Carnet qui n'ont pas d'équivalent
dans le Planificateur (risque 8).

Et l'étape 1 ne demande **aucune** rétro-ingénierie du bundle : un script à part,
chargé par `index.html`, lit les deux magasins et produit le JSON v2.
