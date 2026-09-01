# G3-STABILISATION — CLOS le 31 août 2026

Branche `proto/g2`. Deux défauts, tous deux trouvés, corrigés et vérifiés.

---

## F-01 — P0 : toute fenêtre sous 1520 px était traitée comme un téléphone

**Symptôme (Joey, deux fois dans son Chrome, fenêtre de 1200 à 1450 px)** : le
contenu se comprimait dans une colonne d'environ 400 px collée en haut à gauche,
fond marine vide à droite. Une fois au chargement, une fois au premier
défilement.

**Cause** — `calerLaBarre()`, `proto-g3.js` :
```js
const utile = window.innerWidth / z;          // z = 2 par défaut
document.documentElement.dataset.etroit = utile < 760 ? '1' : '0';
```
Le zoom par défaut du proto est **200 %** (« lisible du gymnase »). La place
utile valait donc `innerWidth / 2` : sur 1300 px de fenêtre, 650 — sous le
seuil. **Toute fenêtre de moins de 1520 px basculait en mise en page
téléphone.**

⚠ **Le défilement n'était pas la cause.** Mesuré : `data-etroit` valait déjà `1`
au chargement, avant tout scroll. Le défilement provoquait un `resize` —
l'apparition de la barre de défilement — qui recalait la mise en page et rendait
l'effondrement visible. D'où la fausse piste « bug au scroll », et le symptôme
« chargement correct, puis effondrement au premier scroll ».

**Correctif** : le seuil se compare à la **largeur réelle de la fenêtre**. Un
grand écran reste un grand écran, quel que soit le grossissement du texte. Un
second terme (`utile < 420`) garde le piège n° 18 fermé : une vraie tablette
étroite, ou un zoom extrême qui ne laisse que 400 px de place réelle, méritent
toujours la colonne unique.

**Recette** — vérifiée au navigateur :

| Fenêtre | Zoom | `data-etroit` | Attendu |
|---|---|---|---|
| 1200 px | 200 % | 0 | 0 ✅ |
| 1300 px | 200 % | 0 | 0 ✅ |
| 1450 px | 200 % | 0 | 0 ✅ |
| 459 px | 200 % | 1 | 1 ✅ |
| 803 px | 300 % | 1 | 1 ✅ (garde-fou) |

Et à 1300 px, après 900 px de défilement : `data-etroit` reste 0, nav collée à 0.

---

## F-02 — la barre des neuf portes décollait sous 760 px

**Cause** — `proto.css` : `.ecrans-nav{position:static}` dans la media query
`max-width:760px`. La barre défilait hors de l'écran. Sur tablette, on descendait
dans sa journée et on n'avait plus aucun moyen de changer d'écran sans tout
remonter — sur l'écran où l'on descend le plus.

**Correctif** : `position:sticky; top:0`, comme en large.

**Recette** — fenêtre de 459 px, `data-etroit=1`, document de 8791 px :
avant défilement la nav est à 438 (sa place naturelle) ; après 700 px de
défilement elle est à **0** et reste visible. ✅

---

## Correctif connexe livré dans le même mandat

**Le cran de taille est borné.** `protog2:zoom` n'accepte plus que les huit
valeurs de `ZOOMS` ; toute autre valeur retombe sur 200 **et la clé fautive est
réécrite**, sinon le chargement suivant relit la même valeur. `calerLaBarre()`
passe par `zoomActuel()` au lieu de lire la clé en direct.

Reproduit avant correctif : `zoom = "5000"` sur une fenêtre de 1700 px faisait
basculer toute la page en colonne étroite (`utile = 34`). Après : `"5000"`,
`"abc"` et `"-300"` retombent tous sur 200, et le cran 230 % fonctionne
normalement.

---

## Deux pièges d'outillage payés, à ne pas reconfondre

1. **Un panneau navigateur masqué ne peint pas.** Les captures reviennent
   noires ou vides et ne prouvent **rien**. Le code le disait déjà dans
   `appliquerZoom()` ; deux sessions successives sont tombées dedans. Le juge
   fiable reste l'écran de Joey.
2. **200 % est le zoom PAR DÉFAUT du proto**, pas un résidu de test. Un zoom à
   2× dans des mesures est normal — ne pas en conclure qu'un cran est resté
   coincé.

---

## Ce qui reste ouvert (hors de ce mandat)

- **G3-FICHE** : les 5 correctifs de la fiche de cours, plus l'addenda
  G3-FICHE-2 dont l'écran LA PLANIFICATION est livré. Rapport QA formel exigé
  avant clôture.
- ⚠ **Les données de démonstration du proto ont été effacées** pendant le
  diagnostic (vidage du préfixe `protog2:`). Le proto repart vierge : c'est une
  maquette à données factices, rien d'irremplaçable, mais il faut reposer un
  groupe pour retrouver une journée peuplée.
