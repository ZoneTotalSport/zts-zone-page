# Studio Jeu — Phase 1 complète

Éditeur visuel de mises en scène sur terrain de gymnase (perspective 3/4),
fondation de la génération vidéo Remotion (Phase 2). Branche `feat/studio-jeu`.

## Ce qui est fait

**Commit 1 — projection + config + schéma** (`shared/studio-engine/`)
- `projection.js` : homographie unité→trapèze (Heckbert), `project(u,v)→{x,y,scale}`,
  `unproject`, échelle perspective (fond plus petit). ES module pur, testé Node
  (coins exacts err ~0, aller-retour unproject exact, scale 0.54 fond → 1.0 avant).
- `scene-schema.js` : modèle scène/étapes, ids déterministes, `interpolateSteps`
  (appariement par id). Pur, testé Node.
- `terrain-gym.config.json` : 4 coins du plancher en fractions d'image.
- `assets/terrain-gym.png` (3300×2550, 0,71 Mo < 1,5 Mo → pas d'optimisation).

**Commit 2 — palette SVG** (`elements.js`)
- Générateurs SVG purs (chaînes, zéro DOM). Joueurs 4 couleurs **avec forme
  distincte** (N&B) : rouge=cercle, bleu=carré, blanc=triangle, noir=losange.
- Ballon, cône, cerceau, dossard. Flèches course/passe/lancer (suivent la
  perspective). Zones semi-transparentes. Texte/onomatopée.

**Commit 3 — éditeur** (`apps/studio-jeu/`)
- Overlay SVG sur le PNG, éléments en (u,v). Palette clic/drag, sélection +
  inspecteur (label, couleur, dupliquer, z-index, supprimer), déplacement pointeur,
  flèches/zones au glisser, poignées de bout.
- Étapes : ajouter / **dupliquer** / renommer / naviguer / supprimer.
- **Lecture** : interpolation u,v entre étapes (rAF + easeInOut).
- Autosave localStorage + Charger/Télécharger JSON.
- Sélecteur de jeu : index slim `data/jeux-index.json` (893 Ko vs 12 Mo) + recherche.
- Thème par univers (eps/camps/sdg). **Calibration** touche `C` (4 coins draggables
  → régénère le config).

**Commit 4 — exports + pilote + doc**
- **PNG** : étape rasterisée pleine résolution (terrain + overlay sur canvas,
  non-taint vérifié). **PDF** : jsPDF, 1 page paysage/étape (même pipeline).
- **Pilote** : `data/pilotes/scene-pfeq_64.json` — *L'ÉPERVIER*, 3 étapes
  (mise en place → traversée → variante chaîne). Vérifié navigateur, tous les
  types d'éléments exercés, perspective correcte.
- `apps/studio-jeu/README.md` : schéma `scene-{id}.json` documenté.

**Commit 5 — persos importés (image)**
- Import d'images perso (bouton palette « Mes persos → ＋ Importer »), miniaturisées
  ≤ 512 px → data-URI dans `scene.assets` (référencées par `assetId`, pas de blob
  dupliqué par étape). Persos réutilisables (miniatures cliquables dans la palette).
- Élément `image` : déplaçable, redimensionnable (poignée jaune + boutons), rotation,
  ombre BD (filtre SVG). **S'anime entre étapes** (`scaleMul` ajouté aux clés
  interpolées). Vérifié : rendu perspective, resize, export PNG non-taint (image
  embarquée + ombre) — marche pour PNG et PDF.

## Décisions

- **Chemin** `shared/studio-engine/` (et non `fiche-engine/` du 1er brief).
- **Ref jeu = `id`** (pas de slug dans la banque). Nommage `scene-{id}.json`.
- **Branding baked-in** : le PNG garde cadre + logo + bandeau ; la calibration
  ne porte que sur le trapèze de plancher.
- **Homographie** (pas bilinéaire) : spacing perspective correct, sans dépendance.
- **Index slim** au lieu de charger `jeux-merged.json` (12 Mo) dans le navigateur.
- **Coords (u,v) partout** : indépendance résolution + réutilisation directe Remotion.
- **Séparation stricte** : `shared/studio-engine/*` purs (aucun window/document,
  aucun Date.now/Math.random) → importables tels quels par Remotion.

## Dette technique / limites

- **Lecture non vérifiée visuellement** dans le preview headless : l'onglet est
  `visibilityState:"hidden"`, donc `requestAnimationFrame` est gelé. La logique
  (`interpolateSteps`) est testée en Node et le rendu des keyframes est vérifié.
  Fonctionne dans un vrai navigateur visible.
- **Polices dans les exports** : le SVG rasterisé en `<img>` n'hérite pas des
  webfonts de la page → *fallback* Impact pour les labels/onomatopées dans le
  PNG/PDF (lisible, mais pas Luckiest Guy). À améliorer en embarquant la police en
  data-URI dans le SVG si fidélité exacte requise.
- **Zones = cercle** : approximées par polygone échantillonné (28 pts) ; suffisant.
- **Pas d'undo/redo**. Autosave écrase ; pas d'historique.
- **Calibration mobile** : poignées OK au doigt mais fines ; à agrandir si besoin.
- **Pas encore lié** depuis la home ni le hub outils (app autonome pour l'instant).
- **PNG/PDF non commités** (binaires, exports runtime déclenchés par l'utilisateur).

## Plan Phase 2 — Remotion (scene.json → MP4)

1. **Projet Remotion** important `shared/studio-engine/projection.js` +
   `scene-schema.js` tels quels (déjà purs).
2. **Composition** : fond = `terrain-gym.png` ; pour chaque frame, `t` global mappé
   sur (étape courante, étape suivante, progression) → `interpolateSteps(a,b,t)` →
   projeter chaque élément via `project(u,v)` → rendre les mêmes SVG (`elements.js`)
   en composants React/SVG Remotion.
3. **Timing** : durée/étape + temps de maintien configurables (repris du DUR/HOLD
   de la Lecture navigateur) ; easing identique (`easeInOut`).
4. **Sortie** : `npx remotion render` → MP4 (+ option GIF Reels/Shorts, format court
   filmé-gymnase déjà privilégié par Joey).
5. **Fidélité polices** : embarquer Luckiest Guy dans le bundle Remotion (règle la
   limite « fallback Impact » côté vidéo).
6. **Pont éditeur→vidéo** : bouton « Exporter pour vidéo » = le JSON actuel, aucune
   transformation (le schéma est déjà le contrat).

## Vérifié

Rendu perspective (formes N&B distinctes, échelle fond/avant), placement palette,
sélection + inspecteur, drag + autosave, étapes (ajout/dup/nav/suppr), thème par
univers, sélecteur de jeu (1439), calibration (4 coins + trapèze aligné au
plancher), export PNG composité propre (sans halos/poignées), pilote 3 étapes.

## Reste (hors Phase 1)

Lier depuis la home / hub outils · undo-redo · fidélité polices exports · Phase 2
Remotion.
