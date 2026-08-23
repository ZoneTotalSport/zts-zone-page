# Prompts d'images — article « Inventaire du matériel »

Article : `articles/inventaire-materiel-sans-effort.html`
Génération : Nano Banana / Gemini · Style : pop art ZTS · Format : 16:9

---

## Mode d'emploi

1. Générer les 8 images avec les prompts ci-dessous (le bloc de style est **déjà
   préfixé** à chacun — copier le bloc complet, sans le titre).
2. Déposer les PNG dans un dossier connecté ; les noms de sortie n'ont pas
   d'importance, la correspondance se fait par le numéro.
3. Conversion et intégration : `cwebp -q 82 -resize 1600 0`, puis
   décommenter le `<figure>` de l'emplacement correspondant dans le HTML.

Chaque emplacement est déjà réservé dans l'article sous la forme :

```html
<!-- IMG 3 : Trois piles, pas quatre... -->
<!-- Emplacement reserve. Deposer articles/images/inventaire-materiel-03-grand-tri.webp puis decommenter :
<figure class="zts-fig"> ... </figure>
-->
```

Le `alt` et la légende sont **déjà écrits** dans le commentaire, dans les
quatre langues — rien à rédiger au moment de l'activation.

Pour vérifier les images 5, 6 et 7 une fois intégrées, il faut cliquer le
bouton d'onglet correspondant (ou ouvrir la page sur `#eps`, `#sdg` ou
`#camps`, qui déplient directement le bon onglet).

---

## Tableau de correspondance

La Partie 3 de l'article (« Des solutions concrètes pour TA réalité ») est un
**système d'onglets** : trois boutons — ÉPS / Camps / S.D.G. — révèlent chacun
trois solutions. Les images 5, 6 et 7 vivent **à l'intérieur** de leur onglet et
n'apparaissent qu'après un clic sur le bouton correspondant. Les cinq autres
sont dans le flux normal de l'article, visibles immédiatement.

| # | Fichier cible | Emplacement dans l'article | Visible |
|---|---|---|---|
| 1 | `inventaire-materiel-01-hero.webp` | Ouverture, avant `#diagnostic` — sert aussi de `og:image` et d'image de carte sur `blog.html` | immédiatement |
| 2 | `inventaire-materiel-02-cercle-vicieux.webp` | Après l'encadré `.zts-cycle` | immédiatement |
| 3 | `inventaire-materiel-03-grand-tri.webp` | Fin du Pilier 1 (`#pilier-1`) | immédiatement |
| 4 | `inventaire-materiel-04-zonage-couleur.webp` | Fin du Pilier 2 (`#pilier-2`), après l'encadré `.zts-shelf` | immédiatement |
| 5 | `inventaire-materiel-05-brigade-eleves.webp` | Onglet **ÉPS** (`#tab-eps`), après la 3ᵉ solution | après clic sur `#eps` |
| 6 | `inventaire-materiel-06-chariot-sdg.webp` | Onglet **S.D.G.** (`#tab-sdg`), après la 3ᵉ solution | après clic sur `#sdg` |
| 7 | `inventaire-materiel-07-blitz-vendredi.webp` | Onglet **Camps** (`#tab-camps`), après l'encadré « 15 min » | après clic sur `#camps` |
| 8 | `inventaire-materiel-08-victoire.webp` | Conclusion (`#conclusion`), avant la question aux lecteurs | immédiatement |

> **Aucune image ajoutée ni retirée par le passage aux onglets.** Le sélecteur
> de corps de métier utilise trois icônes lucide (`book-open`, `tent`, `school`)
> dans les boutons — c'est déjà le visuel de la section. Une illustration
> supplémentaire au-dessus entrerait en concurrence avec les boutons et
> repousserait les onglets hors de l'écran.

> **Note sur les images 6 et 7** — le bloc de style impose le personnage
> récurrent (l'enseignant à la tuque bleue), mais ces deux scènes ne le
> mettent pas en vedette : la 6 montre une éducatrice de service de garde, la 7
> des moniteurs adolescents. Une phrase de désambiguïsation est ajoutée à la fin
> de ces deux prompts pour éviter que le modèle glisse l'enseignant dans le
> cadre. Si tu préfères l'y voir apparaître en arrière-plan, supprime simplement
> cette dernière phrase.

> **Cohérence de série** — les images 5, 6 et 7 étant désormais dans trois
> onglets frères, elles se retrouvent côte à côte quand un lecteur clique les
> trois boutons à la suite. Garde le même cadrage large et la même densité de
> personnages entre les trois : c'est ce qui fera lire le trio comme une série
> plutôt que comme trois illustrations sans rapport.

---

## 1 — Hero / couverture

`inventaire-materiel-01-hero.webp`

```
Pop art illustration, bold black outlines, halftone dots, vibrant flat colors. Palette: cyan and navy blue base with accents yellow #FFFC00, lime #A3FF00, orange #FFA200, pink #FF0061. Recurring character: friendly male PE teacher wearing a blue beanie (tuque), athletic sports shirt, whistle around neck. Consistent character across all images. No text in image. 16:9.

The PE teacher opens a storage room door on Friday evening; a chaotic avalanche of deflated balls, tangled hula hoops and cones spills out; his face shows comic despair; dramatic lighting from the hallway.
```

**Alt intégré** (attribut `alt`, français — un attribut HTML ne peut pas être multilingue,
et `zts-lang.js` ne bascule que les `<span lang>`) :
> Un enseignant d'éducation physique ouvre la porte du local de rangement et reçoit une avalanche de matériel.

**Légende intégrée** (`<figcaption>`, les 4 langues, déjà dans le commentaire) :

| Langue | Légende |
|---|---|
| Français | Vendredi, 16 h 30. Le moment où le local décide de te répondre. |
| English | Friday, 4:30 p.m. The moment the storage room decides to answer back. |
| 中文 | 星期五下午 4 点半。器材室决定开口回应你的那一刻。 |
| Español | Viernes, 16 h 30. El momento en que el almacén decide responderte. |

---

## 2 — Le cercle vicieux

`inventaire-materiel-02-cercle-vicieux.webp`

```
Pop art illustration, bold black outlines, halftone dots, vibrant flat colors. Palette: cyan and navy blue base with accents yellow #FFFC00, lime #A3FF00, orange #FFA200, pink #FF0061. Recurring character: friendly male PE teacher wearing a blue beanie (tuque), athletic sports shirt, whistle around neck. Consistent character across all images. No text in image. 16:9.

Circular diagram scene: the teacher runs on a giant hamster wheel made of clipboards, spreadsheets and broken equipment, loop composition, exhausted expression.
```

**Alt intégré** (attribut `alt`, français — un attribut HTML ne peut pas être multilingue,
et `zts-lang.js` ne bascule que les `<span lang>`) :
> L'enseignant court dans une roue de hamster faite de presse-papiers et de matériel brisé.

**Légende intégrée** (`<figcaption>`, les 4 langues, déjà dans le commentaire) :

| Langue | Légende |
|---|---|
| Français | La roue tourne. C'est elle qu'il faut casser, pas toi. |
| English | The wheel keeps turning. It's the wheel you need to break, not yourself. |
| 中文 | 轮子一直在转。该被打破的是轮子，不是你。 |
| Español | La rueda gira. Hay que romper la rueda, no a ti. |

---

## 3 — Le grand tri

`inventaire-materiel-03-grand-tri.webp`

```
Pop art illustration, bold black outlines, halftone dots, vibrant flat colors. Palette: cyan and navy blue base with accents yellow #FFFC00, lime #A3FF00, orange #FFA200, pink #FF0061. Recurring character: friendly male PE teacher wearing a blue beanie (tuque), athletic sports shirt, whistle around neck. Consistent character across all images. No text in image. 16:9.

The teacher triumphantly sorts equipment into three big labeled bins (keep / repair / donate visual icons, no text), garbage bag of dead stock beside him, satisfied grin.
```

**Alt intégré** (attribut `alt`, français — un attribut HTML ne peut pas être multilingue,
et `zts-lang.js` ne bascule que les `<span lang>`) :
> L'enseignant trie le matériel dans trois grands bacs identifiés : garder, réparer, donner.

**Légende intégrée** (`<figcaption>`, les 4 langues, déjà dans le commentaire) :

| Langue | Légende |
|---|---|
| Français | Trois piles, pas quatre. La pile « on verra » est la raison pour laquelle ton local déborde. |
| English | Three piles, not four. The “we'll see” pile is exactly why your room is overflowing. |
| 中文 | 三堆，不是四堆。「再说吧」那一堆，正是器材室爆满的原因。 |
| Español | Tres montones, no cuatro. El montón de «ya veremos» es justo la razón por la que tu almacén desborda. |

---

## 4 — Zonage couleur

`inventaire-materiel-04-zonage-couleur.webp`

```
Pop art illustration, bold black outlines, halftone dots, vibrant flat colors. Palette: cyan and navy blue base with accents yellow #FFFC00, lime #A3FF00, orange #FFA200, pink #FF0061. Recurring character: friendly male PE teacher wearing a blue beanie (tuque), athletic sports shirt, whistle around neck. Consistent character across all images. No text in image. 16:9.

Bright organized storage room with color-coded shelves (red, blue, green zones), shadow-board silhouettes behind hanging equipment, the teacher gives a thumbs up.
```

**Alt intégré** (attribut `alt`, français — un attribut HTML ne peut pas être multilingue,
et `zts-lang.js` ne bascule que les `<span lang>`) :
> Local de rangement organisé avec des étagères à code couleur et des silhouettes peintes derrière le matériel suspendu.

**Légende intégrée** (`<figcaption>`, les 4 langues, déjà dans le commentaire) :

| Langue | Légende |
|---|---|
| Français | Rouge, bleu, vert. Trois couleurs et le local se lit sans manuel. |
| English | Red, blue, green. Three colours and the room reads itself. |
| 中文 | 红、蓝、绿。三种颜色，器材室不用说明书就能读懂。 |
| Español | Rojo, azul, verde. Tres colores y el almacén se lee solo. |

---

## 5 — Brigade élèves (ÉPS)

`inventaire-materiel-05-brigade-eleves.webp`

```
Pop art illustration, bold black outlines, halftone dots, vibrant flat colors. Palette: cyan and navy blue base with accents yellow #FFFC00, lime #A3FF00, orange #FFA200, pink #FF0061. Recurring character: friendly male PE teacher wearing a blue beanie (tuque), athletic sports shirt, whistle around neck. Consistent character across all images. No text in image. 16:9.

Two proud elementary kids counting basketballs in a rolling cart while the teacher high-fives them, gym background.
```

**Alt intégré** (attribut `alt`, français — un attribut HTML ne peut pas être multilingue,
et `zts-lang.js` ne bascule que les `<span lang>`) :
> Deux élèves du primaire comptent des ballons de basketball dans un chariot pendant que l'enseignant les félicite.

**Légende intégrée** (`<figcaption>`, les 4 langues, déjà dans le commentaire) :

| Langue | Légende |
|---|---|
| Français | La brigade matériel : deux élèves, trente secondes, zéro ballon perdu. |
| English | The equipment crew: two students, thirty seconds, zero balls lost. |
| 中文 | 器材小队：两名学生，三十秒，一个球都不会丢。 |
| Español | La brigada de material: dos alumnos, treinta segundos, cero balones perdidos. |

---

## 6 — Chariot service de garde

`inventaire-materiel-06-chariot-sdg.webp`

```
Pop art illustration, bold black outlines, halftone dots, vibrant flat colors. Palette: cyan and navy blue base with accents yellow #FFFC00, lime #A3FF00, orange #FFA200, pink #FF0061. Recurring character: friendly male PE teacher wearing a blue beanie (tuque), athletic sports shirt, whistle around neck. Consistent character across all images. No text in image. 16:9.

A daycare educator pushes a closed rolling themed cart full of foam balls and jump ropes across a schoolyard, kids playing in background. The recurring PE teacher does not appear in this image.
```

**Alt intégré** (attribut `alt`, français — un attribut HTML ne peut pas être multilingue,
et `zts-lang.js` ne bascule que les `<span lang>`) :
> Une éducatrice de service de garde pousse un chariot fermé rempli de ballons mousse et de cordes à sauter dans une cour d'école.

**Légende intégrée** (`<figcaption>`, les 4 langues, déjà dans le commentaire) :

| Langue | Légende |
|---|---|
| Français | Un chariot fermé, un contenu écrit sur le couvercle, une personne responsable. |
| English | One closed cart, contents written on the lid, one person responsible. |
| 中文 | 一辆封闭推车，盖子上写着清单，一个明确的负责人。 |
| Español | Un carro cerrado, el contenido escrito en la tapa, una persona responsable. |

---

## 7 — Blitz du vendredi (camp)

`inventaire-materiel-07-blitz-vendredi.webp`

```
Pop art illustration, bold black outlines, halftone dots, vibrant flat colors. Palette: cyan and navy blue base with accents yellow #FFFC00, lime #A3FF00, orange #FFA200, pink #FF0061. Recurring character: friendly male PE teacher wearing a blue beanie (tuque), athletic sports shirt, whistle around neck. Consistent character across all images. No text in image. 16:9.

Teen camp counselors racing to pack labeled duffel bags, stopwatch floating above, playful competition energy, summer park setting. The recurring PE teacher does not appear in this image.
```

**Alt intégré** (attribut `alt`, français — un attribut HTML ne peut pas être multilingue,
et `zts-lang.js` ne bascule que les `<span lang>`) :
> Des moniteurs de camp adolescents se dépêchent de remplir des sacs identifiés, un chronomètre au-dessus d'eux.

**Légende intégrée** (`<figcaption>`, les 4 langues, déjà dans le commentaire) :

| Langue | Légende |
|---|---|
| Français | Quinze minutes, un chrono visible, et la corvée devient une course. |
| English | Fifteen minutes, a visible timer, and the chore becomes a race. |
| 中文 | 十五分钟，一个看得见的计时器，杂务就变成了比赛。 |
| Español | Quince minutos, un cronómetro a la vista, y la tarea se convierte en carrera. |

---

## 8 — Après / victoire

`inventaire-materiel-08-victoire.webp`

```
Pop art illustration, bold black outlines, halftone dots, vibrant flat colors. Palette: cyan and navy blue base with accents yellow #FFFC00, lime #A3FF00, orange #FFA200, pink #FF0061. Recurring character: friendly male PE teacher wearing a blue beanie (tuque), athletic sports shirt, whistle around neck. Consistent character across all images. No text in image. 16:9.

The teacher relaxes in a spotless storage room, feet up on a bin, phone in hand showing a checkmark, golden light, total zen.
```

**Alt intégré** (attribut `alt`, français — un attribut HTML ne peut pas être multilingue,
et `zts-lang.js` ne bascule que les `<span lang>`) :
> L'enseignant se détend dans un local de rangement impeccable, les pieds sur un bac, téléphone à la main.

**Légende intégrée** (`<figcaption>`, les 4 langues, déjà dans le commentaire) :

| Langue | Légende |
|---|---|
| Français | Le vendredi 16 h 30 d'après. Même local, même heure, autre vie. |
| English | The Friday 4:30 p.m. that comes after. Same room, same hour, different life. |
| 中文 | 之后的某个周五下午 4 点半。同一个器材室，同一个时间，不一样的人生。 |
| Español | El viernes de las 16 h 30 de después. Mismo almacén, misma hora, otra vida. |

---

## Conversion webp (commande de référence)

```bash
cd articles/images
for i in 01-hero 02-cercle-vicieux 03-grand-tri 04-zonage-couleur \
         05-brigade-eleves 06-chariot-sdg 07-blitz-vendredi 08-victoire; do
  cwebp -q 82 -resize 1600 0 "source-$i.png" -o "inventaire-materiel-$i.webp"
done
```

L'image 1 sert aussi de `og:image` (URL absolue dans le `<head>`) et d'image de
carte sur `blog.html` — c'est la seule dont le nom est référencé ailleurs que
dans le corps de l'article.
