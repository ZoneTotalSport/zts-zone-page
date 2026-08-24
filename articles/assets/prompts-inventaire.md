# Prompts d'images — article « Inventaire du matériel »

Article : `articles/inventaire-materiel-sans-effort.html`
Génération : Nano Banana / Gemini · Style : **photo documentaire ZTS** · Livré : 8/8

> **Ce fichier est la référence de style des prochains articles.** Il a été
> réécrit après la livraison pour décrire le style réellement retenu. La
> première version imposait une illustration pop art (contours noirs, trames de
> points, personnage récurrent à la tuque bleue) ; ce parti a été abandonné au
> profit de la photo documentaire, décision prise sur la série livrée. Ne pas
> ressortir l'ancien bloc pop art : les deux styles ne cohabitent pas dans un
> même blogue.

---

## Le bloc de style

À préfixer à **chaque** prompt de scène, sans modification. C'est lui qui tient
la série ensemble d'un article à l'autre.

```
Documentary photography, realistic, natural available light. Real Quebec elementary school setting: cinder-block walls, varnished hardwood gym floor with painted court lines, worn municipal equipment. Candid unposed moment, mid-action, people often seen from behind or in three-quarter view, faces rarely front-facing. Muted natural palette — wood tones, beige block, cool window light — with color coming only from the equipment itself (balls, bins, pinnies). Shallow depth of field, 35mm look. No text, no logo, no signage in image. No studio lighting, no stock-photo smiles, no illustration or 3D render.
```

**Ce que le bloc garantit** — l'unité de la série tient à quatre choses, dans
cet ordre : la lumière (naturelle, jamais d'appoint), le décor (bloc de béton +
plancher de gymnase verni), le cadrage (candide, de dos ou de trois quarts), et
la couleur (neutre partout sauf le matériel). Si un prompt de scène contredit
l'un des quatre, c'est le bloc qui gagne.

**Ce qu'il faut éviter** — le sourire de banque d'images, l'éclairage de studio,
le sujet qui regarde l'objectif, le gymnase neuf et vide. Les locaux de nos
lecteurs sont usés ; les images doivent l'être aussi.

### Format

Les 8 images livrées sont en **4:3** (2400 × 1792 à la source), sauf le hero en
**16:9** (2752 × 1536). Ce n'était pas le plan initial, mais le résultat se tient :
le hero panoramique ouvre l'article, les sept autres respirent en hauteur dans
la colonne de texte. **Pour les prochains articles, reprendre cette règle :
16:9 pour le hero, 4:3 pour les images de corps.**

---

## Mode d'emploi

1. Générer les images avec le bloc de style + le prompt de scène.
2. Déposer les PNG dans un dossier connecté ; les noms de sortie n'ont pas
   d'importance, la correspondance se fait par le numéro.
3. Convertir en webp (voir la commande en fin de fichier) vers
   `articles/images/`, sous le nom `inventaire-materiel-NN-slug.webp`.
4. Décommenter le `<figure>` correspondant dans le HTML.

Chaque emplacement est réservé dans l'article sous la forme :

```html
<!-- IMG 3 : Trois piles, pas quatre... -->
<!-- Emplacement reserve. Deposer articles/images/inventaire-materiel-03-grand-tri.webp puis decommenter :
<figure class="zts-fig"> ... </figure>
-->
```

⚠ **Les `alt` sont à revalider après génération.** Ceux d'origine décrivaient les
scènes prévues ; ils ont dû être réécrits pour décrire les photos réellement
produites. Un `alt` qui décrit une image qui n'existe pas est pire que pas
d'`alt` du tout. Les `alt` ci-dessous sont les versions **finales, en place dans
l'article**. Même vigilance pour les légendes : deux d'entre elles (2 et 6) ont
été réécrites parce qu'elles s'appuyaient sur un détail visuel absent de la photo.

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

> **Cohérence de série** — les images 5, 6 et 7 étant dans trois onglets frères,
> elles se retrouvent côte à côte quand un lecteur clique les trois boutons à la
> suite. Garder le même cadrage large et la même densité de personnages entre
> les trois : c'est ce qui fait lire le trio comme une série plutôt que comme
> trois photos sans rapport.

---

## 1 — Hero / couverture

`inventaire-materiel-01-hero.webp` · 16:9

```
[bloc de style]

Late Friday afternoon in an empty school gym. A teacher in a jacket, sports bag on his shoulder, stands with his back to us in front of an open metal storage cabinet. The shelves are overloaded with balls, hula hoops and cones; a dozen balls have already rolled out onto the hardwood floor at his feet. Long low light from the high windows, dust in the air. He is simply looking at it, not reacting.
```

**Alt** (français — un attribut HTML ne peut pas être multilingue, et
`zts-lang.js` ne bascule que les `<span lang>`) :
> Un enseignant, sac de sport à l'épaule, ouvre la porte d'une armoire de rangement dans un gymnase ; des ballons et des cerceaux débordent des tablettes et roulent sur le plancher.

**Légende** (`<figcaption>`, les 4 langues) :

| Langue | Légende |
|---|---|
| Français | Vendredi, 16 h 30. Le moment où le local décide de te répondre. |
| English | Friday, 4:30 p.m. The moment the storage room decides to answer back. |
| 中文 | 星期五下午 4 点半。器材室决定开口回应你的那一刻。 |
| Español | Viernes, 16 h 30. El momento en que el almacén decide responderte. |

---

## 2 — Le cercle vicieux

`inventaire-materiel-02-cercle-vicieux.webp` · 4:3

```
[bloc de style]

A teacher sits alone at a folding table set up in the middle of an empty gym, seen from behind and slightly to the side, head in both hands. In front of him: tall stacks of paper, binders and a basketball resting on the pile. Storage bins full of equipment on the floor around him. Fluorescent tube overhead, cold light. Exhaustion, not drama.
```

**Alt** :
> Un enseignant assis à une table de gymnase, la tête dans les mains, devant des piles de paperasse et des bacs de matériel posés au sol.

**Légende** :

| Langue | Légende |
|---|---|
| Français | Recompter à la main chaque année : c'est ce cycle-là qu'il faut casser, pas toi. |
| English | Counting it all by hand year after year: that's the cycle to break, not yourself. |
| 中文 | 年复一年用手清点：该被打破的是这个循环，不是你。 |
| Español | Volver a contarlo todo a mano cada año: ese es el ciclo que hay que romper, no tú. |

> Légende réécrite après livraison : la version d'origine parlait d'une roue qui
> tourne, image absente de la photo finale.

---

## 3 — Le grand tri

`inventaire-materiel-03-grand-tri.webp` · 4:3

```
[bloc de style]

Close low-angle shot of three storage bins lined up on a gym floor — grey, yellow and green — each with a strip of masking tape as a label. A pair of adult hands lowers a worn volleyball into the third bin. Basketballs and tangled nets fill the first, ropes and tape the second, folded pinnies the third. Only the hands and the legs of the person are in frame. Window light from the left.
```

**Alt** :
> L'enseignant trie le matériel dans trois grands bacs identifiés : garder, réparer, donner.

**Légende** :

| Langue | Légende |
|---|---|
| Français | Trois piles, pas quatre. La pile « on verra » est la raison pour laquelle ton local déborde. |
| English | Three piles, not four. The “we'll see” pile is exactly why your room is overflowing. |
| 中文 | 三堆，不是四堆。「再说吧」那一堆，正是器材室爆满的原因。 |
| Español | Tres montones, no cuatro. El montón de «ya veremos» es justo la razón por la que tu almacén desborda. |

---

## 4 — Zonage couleur

`inventaire-materiel-04-zonage-couleur.webp` · 4:3

```
[bloc de style]

Interior of a tidy equipment room seen through the open doorway. Metal shelving on both sides, each shelf edge taped in a different colour — blue, yellow, red, green. Balls sorted by size, stacks of yellow cones, folded red pinnies. On the back wall, a pegboard with painted silhouettes behind the hanging racquets and hoops. Skylight above, everything legible at a glance. No people.
```

**Alt** :
> Local de rangement organisé avec des étagères à code couleur et des silhouettes peintes derrière le matériel suspendu.

**Légende** :

| Langue | Légende |
|---|---|
| Français | Rouge, bleu, vert. Trois couleurs et le local se lit sans manuel. |
| English | Red, blue, green. Three colours and the room reads itself. |
| 中文 | 红、蓝、绿。三种颜色，器材室不用说明书就能读懂。 |
| Español | Rojo, azul, verde. Tres colores y el almacén se lee solo. |

---

## 5 — Brigade élèves (ÉPS)

`inventaire-materiel-05-brigade-eleves.webp` · 4:3

```
[bloc de style]

Two elementary students in team pinnies, hands on a bin full of basketballs, counting. Beside them an adult holds a clipboard and writes the numbers on a tally sheet — only the forearms and hands of the adult are visible. Gym floor with painted lines, open storage room door in the background. Cropped tight, nobody's face fully shown. Ordinary and busy, not celebratory.
```

**Alt** :
> Deux élèves en dossard comptent des ballons de basketball dans un bac pendant qu'un adulte inscrit les quantités sur une feuille fixée à une planchette.

**Légende** :

| Langue | Légende |
|---|---|
| Français | La brigade matériel : deux élèves, trente secondes, zéro ballon perdu. |
| English | The equipment crew: two students, thirty seconds, zero balls lost. |
| 中文 | 器材小队：两名学生，三十秒，一个球都不会丢。 |
| Español | La brigada de material: dos alumnos, treinta segundos, cero balones perdidos. |

---

## 6 — Chariot service de garde

`inventaire-materiel-06-chariot-sdg.webp` · 4:3

```
[bloc de style]

An adult pushes a wheeled wire cage cart across an asphalt schoolyard, seen from behind at chest height. The cart is loaded with soccer balls, jump ropes and pool noodles; one hand steadies a ball on top. Long shadows, low golden sun, hopscotch chalk and a play structure in the soft background. Only the torso and arms of the adult are in frame.
```

**Alt** :
> Une personne pousse un chariot à roulettes rempli de ballons, de cordes à sauter et de frites de piscine sur l'asphalte d'une cour d'école.

**Légende** :

| Langue | Légende |
|---|---|
| Français | Un chariot par thème, un contenu connu d'avance, une personne responsable au retour. |
| English | One cart per theme, a known set of contents, one person accountable when it comes back. |
| 中文 | 每个主题一辆推车，清单事先明确，归还时有一个负责人。 |
| Español | Un carro por tema, un contenido conocido de antemano, una persona responsable al devolverlo. |

> Légende réécrite après livraison : la version d'origine décrivait un chariot
> fermé à couvercle, alors que la photo montre un chariot grillagé ouvert. Le
> texte de la solution, lui, continue de recommander le chariot fermé — c'est
> un conseil, pas une description de l'image.

---

## 7 — Blitz du vendredi (camp)

`inventaire-materiel-07-blitz-vendredi.webp` · 4:3

```
[bloc de style]

Teen camp counselors in yellow pinnies packing up at the end of the day in a summer park. One holds a stopwatch clearly in view, another passes a red racquet to a pair of open hands, a third holds a volleyball. A blue bin in the foreground already holds balls, racquets and a rolled orange net. Warm afternoon light through trees, picnic table behind. Movement, mid-gesture, faces cropped out.
```

**Alt** :
> Des moniteurs de camp en dossard jaune rangent ballons et raquettes dans un bac bleu à l'extérieur, l'un d'eux tenant un chronomètre bien en vue.

**Légende** :

| Langue | Légende |
|---|---|
| Français | Quinze minutes, un chrono visible, et la corvée devient une course. |
| English | Fifteen minutes, a visible timer, and the chore becomes a race. |
| 中文 | 十五分钟，一个看得见的计时器，杂务就变成了比赛。 |
| Español | Quince minutos, un cronómetro a la vista, y la tarea se convierte en carrera. |

---

## 8 — Après / victoire

`inventaire-materiel-08-victoire.webp` · 4:3

```
[bloc de style]

Same gym as image 1, but immaculate. Wide shot: an ordered wall of metal shelving holding colour-sorted bins, mats stacked flat, balls in tidy rows. A teacher walks into the open storage room carrying a small bundle of pinnies, seen from behind, unhurried. A second open door shows a tool wall. Clean hardwood, bright daylight, nothing on the floor.
```

**Alt** :
> Un enseignant entre dans un local de rangement impeccable : étagères alignées, bacs de couleur identifiés, ballons rangés et plancher de gymnase dégagé.

**Légende** :

| Langue | Légende |
|---|---|
| Français | Le vendredi 16 h 30 d'après. Même local, même heure, autre vie. |
| English | The Friday 4:30 p.m. that comes after. Same room, same hour, different life. |
| 中文 | 之后的某个周五下午 4 点半。同一个器材室，同一个时间，不一样的人生。 |
| Español | El viernes de las 16 h 30 de después. Mismo almacén, misma hora, otra vida. |

> L'image 8 doit répondre à l'image 1 : même décor, même heure, état inverse.
> C'est la seule contrainte de composition imposée entre deux images de la série.

---

## Conversion webp (ce qui a été fait)

Redimensionnement à 1600 px de large, qualité 80, Lanczos. Résultat sur la
série : **27,1 Mo → 1,3 Mo (−95 %)**, entre 117 et 307 ko par image.

```bash
cd articles/images
for i in 01-hero 02-cercle-vicieux 03-grand-tri 04-zonage-couleur \
         05-brigade-eleves 06-chariot-sdg 07-blitz-vendredi 08-victoire; do
  cwebp -q 80 -resize 1600 0 "source-$i.png" -o "inventaire-materiel-$i.webp"
done
```

Les `<img>` portent les dimensions **réelles** après conversion (`width`/`height`),
pas une valeur théorique : 1600 × 893 pour le hero, 1600 × 1195 pour les sept
autres. C'est ce qui évite le saut de mise en page au chargement. Si une image
est régénérée dans un autre rapport, il faut remesurer et corriger ces
attributs — les laisser faux est pire que les omettre.
