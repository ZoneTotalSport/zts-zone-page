# Prescan — fond marine et personnage dans les trois densités

**29 juillet 2026. Lecture seule, aucun fichier d'app touché, rien généralisé.**

Commandé avant d'étendre le fond marine et le personnage à toutes les apps, y
compris en densité `travail` et `projection`.

---

## 1. Collisions du coin bas-droit

Le personnage se pose à `right:96px; bottom:18px` — et à `right:12px;
bottom:12px` sous 1200 px, là où la place manque le plus.

### Ce qui occupe déjà ce coin

| App | Élément | right | bottom | z-index | Nature |
|---|---|---|---|---|---|
| **24 apps du gabarit** | `.ztg-out` | 12 | 12 | **9998** | bouton de déconnexion, injecté par `shared/zts-gate.js` |
| `agenda` | `.cal-mascot-float` | 20 | 20 | 10 | **mascotte de l'app** |
| `educatifs` | `.cours-fab` | 28 | 28 | 1000 | bouton flottant « mon cours » |
| `sae` | `.cours-fab` | 28 | 28 | 1000 | idem |
| `nba-playoffs` | `.refresh-btn` | 20 | 20 | 100 | actualiser |
| `nhl-playoffs` | `.refresh-btn` | 20 | 20 | 100 | actualiser |
| `performances` | `.pf-helpbtn` | 18 | 18 | 390 | aide |
| `planificateur` | `.pv2-tbibtn` | 14 | 14 | 360 | mode TBI |
| `planificateur` | `.p-perso` | 12 | 12 | — | **bulle de personnage de l'app** |

**Deux apps ont déjà leur personnage** : `agenda` et `planificateur`. Le shell
doit s'y effacer — c'est la consigne, et elle est juste : deux personnages dans
le même coin, ce n'est pas un défaut de style, c'est une image confuse.

**`.ztg-out` est le cas le plus large** : 24 apps, et son `z-index:9998` passe
**au-dessus** du personnage du shell (couche 300-399). Le bouton de déconnexion
resterait cliquable — mais il se poserait *sur* le personnage. Le rail avait
déjà ce problème et l'a réglé par `--ztsh-rail-garde-bas:96px`. Il faut la même
garde pour le personnage, sinon le coin se superpose sur 24 apps.

### Décompte

- **24 apps** : `.ztg-out` seul → garde basse suffisante
- **2 apps** : personnage propre (`agenda`, `planificateur`) → **le shell s'efface**
- **6 apps** : bouton flottant (`educatifs`, `sae`, `nba-playoffs`,
  `nhl-playoffs`, `performances`, `planificateur`) → décaler ou effacer
- Les autres : coin libre

---

## 2. Apps qui peignent leur propre fond plein cadre

Recherche des calques `position:fixed` couvrant le viewport et portant un fond.
Les modales, écrans de chargement et voiles transitoires sont écartés : ils
n'apparaissent qu'à la demande.

**Un seul calque permanent existe : `#gymBg`.**

```css
#gymBg { position: fixed; inset: 0; z-index: 0;
         background: url('gym-bg.png') center/cover no-repeat;
         opacity: 1; pointer-events: none; }
```

La règle CSS est présente dans **8 apps** — `agenda`, `educatifs`, `evaluation`,
`jeux`, `musique`, `sae`, `suppleance`, `tni`. **L'élément n'existe que dans
une seule** :

| App | Règle CSS | Élément dans le HTML | Conséquence |
|---|---|---|---|
| agenda, educatifs, evaluation, jeux, musique, sae, suppleance | oui | **non** | CSS morte, aucun obstacle |
| **`tni`** | oui | **oui** | seul cas réel |

Sept apps portent donc une règle qui ne s'applique à rien. C'est une bonne
nouvelle pour le chantier et une ligne de dette pour plus tard.

### Le cas `tni`, celui que tu as pointé

```css
#gymBg { position: fixed; inset: 0; z-index: 0;
         background: url('img/gym-bg-roots.jpg') center/cover;
         opacity: 0.15; }
```

**Opacité 0,15** — le calque est translucide. Le marine passerait donc au
travers, teinté par la photo de gymnase. Et la surface de travail est un
`<canvas id="whiteboard">` (`apps/tni/index.html:821`), opaque en propre : elle
garde son blanc quoi qu'il arrive.

Mécaniquement, ton attente se vérifie : **le marine n'apparaîtrait que dans les
marges**, et le tableau resterait blanc. Le banc reste à faire — `tni` n'est pas
migrée, il faut donc monter le shell dessus pour le voir. À faire avant de
généraliser, comme demandé.

---

## 3. Poids réel ajouté

| Fichier | Dimensions | Poids |
|---|---|---|
| `perso-ep.png` | 500 × 641 | 208,8 Ko |
| `perso-sdg.png` | 500 × 644 | 226,3 Ko |
| `perso-camp.png` | 500 × 642 | 249,7 Ko |
| `shared/img/perso/perso_eps.webp` | 857 × 1100 | 143,4 Ko |
| `shared/img/perso/perso_camps.webp` | 857 × 1100 | 191,2 Ko |
| `shared/img/perso/perso_sdg.webp` | 854 × 1100 | 169,4 Ko |

**Les trois webp existent**, pas seulement celle du prof d'ÉPS — elles étaient
sous `shared/img/perso/`.

**Mais le format n'est pas le vrai problème.** Le personnage s'affiche à
**132 px de large** (`assets/ztsh-shell.css:822`), 96 px sous 1200 px, 78 px
sous 700 px. On sert donc une image de 857 px pour l'afficher à 132 :
**6,5 fois trop de pixels**. Même à densité double, 264 px suffisent.

Mesure faite : redimensionner `perso-ep.png` à 264 px le fait passer de
**208,8 Ko à 48,5 Ko**, soit **−77 %**, et ce n'est que du PNG. En webp à cette
taille, on serait autour de 20-25 Ko.

**Recommandation** : ré-encoder les trois personnages à 264 px de large en webp
avant de généraliser. Le `<picture>` webp + repli PNG et le chargement paresseux
restent utiles, mais ils ne valent rien si l'image reste six fois trop grande.

**Obstacle d'outillage** : ni `cwebp` ni ImageMagick ne sont installés sur ce
Mac, et `sips` ne sait pas ré-encoder en webp. Le redimensionnement PNG a
fonctionné ; pour le webp il faut installer `webp` (Homebrew) ou passer par un
autre poste.

---

## 4. Ce que ça implique pour les quatre adaptations

| Adaptation | État |
|---|---|
| a) silencieux en travail et projection | à écrire — le montage appelle `prochain()` au chargement (`ztsh-shell.js:280`) |
| b) masqué à l'impression | **déjà couvert** — `@media print` masque tout `[class^="ztsh-"]` |
| c) masqué en plein écran | **déjà couvert** — `:root:fullscreen .ztsh-shell { display:none }` |
| d) effacement là où l'app a son personnage | à écrire — `agenda` et `planificateur`, plus la garde basse de 96 px pour `.ztg-out` sur 24 apps |

La banque d'encouragements (8 Ko) se charge aujourd'hui au montage en vitrine.
La passer au premier clic vaut pour les trois densités : en vitrine, le message
d'accueil s'afficherait alors après un aller-retour réseau. À trancher —
message d'accueil immédiat en vitrine, ou 8 Ko économisés partout.
