# Studio Jeu — éditeur de mises en scène sur terrain

Éditeur visuel : place joueurs, ballons, cônes, flèches, zones et textes sur un
terrain de gymnase en perspective 3/4, monte des **étapes** animées, exporte en
JSON / PNG / PDF. Le JSON produit est directement réutilisable par Remotion
(Phase 2) pour générer une vidéo.

- URL prod : `/apps/studio-jeu/` (GitHub Pages, pas de `_redirects`).
- Vanilla JS (aucun framework). jsPDF chargé par CDN pour l'export PDF.

## Architecture

```
apps/studio-jeu/
  index.html            UI
  studio.css            styles (importe ../../shared/zts.css)
  studio.js             éditeur (DOM) ; importe les modules purs ci-dessous
  data/jeux-index.json  index slim des 1439 jeux (893 Ko) pour le sélecteur
  data/pilotes/         scènes de démonstration (ex. scene-pfeq_64.json)

shared/studio-engine/           ← ES modules PURS (zéro window/document)
  projection.js         projection perspective terrain <-> image
  scene-schema.js       modèle de scène + étapes + interpolation
  elements.js           générateurs SVG des éléments (chaînes)
  terrain-gym.config.json   calibration du terrain (4 coins)
  assets/terrain-gym.png    fond complet (cadre sunburst + logo baked-in)
```

`projection.js` et `scene-schema.js` sont **importables par Remotion** : logique
déterministe, aucun accès DOM, aucune source d'aléa (pas de `Date.now`/`Math.random`).

### Terrain (PNG)

`assets/terrain-gym.png` : 3300×2550, 0,71 Mo (< 1,5 Mo → **pas d'optimisation
requise**). Le branding (cadre sunburst ZTS + logo + bandeau `zonetotalsport.ca`)
est *baked-in* et conservé tel quel : il apparaît dans les exports. Changer de
fond = déposer un nouveau PNG + recalibrer (voir « Calibration »).

## Coordonnées terrain (u, v)

Tout élément vit en coordonnées **terrain normalisées**, jamais en pixels écran :

- `u ∈ [0,1]` : 0 = côté gauche, 1 = côté droit
- `v ∈ [0,1]` : 0 = fond (loin, petit), 1 = avant (proche, gros)

`createProjector(config).project(u,v)` → `{ x, y, scale }` où `x,y` sont en
**fractions de l'image** (0-1) et `scale` un facteur relatif (~1 à l'avant, plus
petit vers le fond). Homographie unité→trapèze (Heckbert) + échelle dérivée de la
largeur projetée. `unproject(x,y)` fait l'inverse (drag écran → u,v).

Indépendant de la résolution : le même `(u,v)` se réutilise tel quel dans Remotion
en interpolant entre étapes.

## Schéma `scene-{id}.json`

```jsonc
{
  "version": 1,
  "gameId": "pfeq_64",        // id du jeu (banque) ou null en scène libre
  "gameTitle": "L'ÉPERVIER",
  "univers": "eps",            // eps | camps | sdg  (couleur d'accent)
  "terrain": "terrain-gym",    // id du config terrain
  "steps": [
    {
      "id": "step-1",
      "title": "Mise en place",
      "elements": [ /* voir ci-dessous */ ]
    }
  ]
}
```

### Éléments (`step.elements[]`)

Champ commun : `id` (unique dans l'étape ; **stable entre étapes** pour animer),
`type`.

| type     | champs                                                              |
|----------|--------------------------------------------------------------------|
| `player` | `u,v`, `color` (rouge\|bleu\|blanc\|noir), `label` (n°/lettre)      |
| `ball`   | `u,v`                                                              |
| `cone`   | `u,v`                                                              |
| `hoop`   | `u,v`, `color`                                                     |
| `pinnie` | `u,v`, `color`                                                     |
| `arrow`  | `u,v` (A), `u2,v2` (B), `kind` (run\|pass\|throw), `hex`           |
| `zone`   | `u,v`+`u2,v2` (boîte), `shape` (rect\|circle), `hex`              |
| `text`   | `u,v`, `text`, `style` (onomatopee\|libre), `rotation`, `hex`, `fontSize` |

**Impression N&B** : chaque couleur de joueur a une **forme distincte** —
rouge=cercle, bleu=carré, blanc=triangle, noir=losange.

### Animation entre étapes

`interpolateSteps(stepA, stepB, t)` (dans `scene-schema.js`) apparie les éléments
**par `id`** : même id → position interpolée (`u,v,u2,v2,rotation,fontSize`…) ;
présent seulement dans A → disparaît (`_opacity` 1→0) ; seulement dans B →
apparaît (0→1). C'est ce que fait le bouton **Lecture** (preview navigateur) et ce
que Remotion rejouera image par image.

Pour créer une transition : **Dupliquer l'étape**, puis déplacer les éléments —
les ids sont conservés, donc tout s'anime.

## Calibration (touche `C`)

Mode caché : affiche les 4 coins draggables (FG/FD/AD/AG) du plancher. On les
glisse sur le trapèze réel, puis **Copier config** / **Télécharger config**
régénère `terrain-gym.config.json`. Changer de fond (terrain extérieur, autre
palestre) = déposer le PNG + recalibrer en ~30 s, sans toucher au code.

## Sauvegarde / exports

- **Autosave** localStorage (clé `zts-studio-<gameId|libre>`).
- **JSON** : Télécharger / Charger (`scene-{id}.json`).
- **PNG** : étape courante rasterisée pleine résolution (3300×2550) — terrain +
  overlay SVG composés sur canvas.
- **PDF** (jsPDF) : une page paysage par étape (titre du jeu + titre d'étape +
  rendu + pied `zonetotalsport.ca`).

## Raccourcis

`C` calibration · `Suppr`/`Backspace` supprime la sélection · `Ctrl/Cmd+D`
duplique · `Échap` désélectionne / stoppe la lecture.
