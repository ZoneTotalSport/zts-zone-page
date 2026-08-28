# Promotion sociale des articles ZTS — fichier maître

**Chantier :** promotion sociale des 27 articles de blog de zonetotalsport.ca
**Produit le :** 28 août 2026 · **Calendrier :** 1er septembre 2026 → 21 mars 2027 · **81 posts prêts à coller**
**Règle :** aucune publication automatisée. Tout ce document est du copier-coller manuel.

---

## 0. Prérequis vérifié — le bug des pastilles de partage

**Verdict : NON BLOQUANT. Le calendrier peut partir.** Mais il y a une dette à ne pas perdre de vue.

Vérification faite en prod le 28 août, dans un vrai navigateur, sur `50-jeunes-un-gymnase` et `faire-bouger-enfants` :
les six boutons (Facebook, X, LinkedIn, courriel, WhatsApp, copier le lien) s'affichent avec leurs icônes de marque
correctes, remplies en bleu ZTS (`rgb(0,134,173)`) sur pastille cyan clair. Capture DOM à l'appui : chaque `<svg>` a
son `viewBox="0 0 24 24"`, un `<path>` de marque, `visibility: visible`, une boîte de 20×20 px. **Aucune pastille vide.**

**Mais voici pourquoi ça a cassé le 25 août, et pourquoi ça peut recasser :**

Le HTML servi par le serveur contient, sur **24 des 25 articles concernés**, des icônes déclarées en
`<i data-lucide="facebook">`, `data-lucide="twitter"` et `data-lucide="linkedin"` — chargées depuis
`https://unpkg.com/lucide@latest`. Or **Lucide ne fournit plus d'icônes de marque** : elles ont été retirées de la
bibliothèque. Ces trois-là ne peuvent donc jamais se rendre par cette voie, alors que `data-lucide="mail"` existe
toujours et se rend très bien. C'est **exactement** le symptôme rapporté : « seule l'icône courriel se rend ».

Ce qui sauve la situation aujourd'hui, c'est `/assets/zts-partage-article.js` (le script de la PR #25) : il
**reconstruit** la barre de partage au chargement et injecte les vrais chemins SVG de marque. Autrement dit, les
icônes correctes n'existent que si ce script s'exécute.

**Conséquence, et c'est la dette :** trois façons de faire revenir les pastilles vides, sans rien changer au code.
1. `unpkg.com` lent ou bloqué (réseau d'école, filtrage) → `lucide@latest` ne charge pas.
2. `lucide@latest` n'est pas épinglé : une version majeure publiée demain peut casser l'appel.
3. `/assets/zts-partage-article.js` qui échoue, arrive en retard, ou est servi depuis un cache périmé → la barre
   d'origine reste en place, avec ses trois `<i>` de marque introuvables.

**Correctif recommandé (hors du présent chantier, à passer à Claude Code) :** écrire les SVG de marque *en dur dans
le HTML* des articles plutôt que de dépendre d'un CDN tiers, et au minimum **épingler une version de Lucide**
(`lucide@0.xxx.x`) au lieu de `@latest`. Un site qui vit de partage social ne devrait pas avoir ses boutons de
partage suspendus à un CDN externe non versionné.

---

## 0 bis. Deux trouvailles SEO à corriger avant la campagne

Ce ne sont pas des bloquants pour publier, mais ce sont des trous par où fuit du trafic organique — et le chantier
consiste justement à envoyer du monde vers ces pages.

**① Quatre articles sont absents de `sitemap.xml`.** Le sitemap en déclare 23; le blogue en publie 27.
Manquent à l'appel :

- `catastrophes-ordinaires` — **et c'est le plus grave : c'est un des trois appâts SEO libres à 100 %.** Un article
  volontairement ouvert pour capter du trafic organique, invisible du sitemap.
- `comptes-rendus-rencontres`
- `inventaire-materiel-sans-effort`
- `un-jeu-trois-versions`

Les quatre répondent 200 et sont bien liés depuis `blog.html` : Google finira par les trouver, mais plus tard et avec
moins de poids. Régénérer le sitemap est une correction de dix minutes pour un gain direct.

**② L'image OG de `50-jeunes-un-gymnase` a une URL à espaces encodés** :
`images/Images%20article%2050%20jeunes%20gymnase%20/image%201%20article%20blig%2050%20jeunes%201%20gymnase.png`
— noter le dossier qui finit par un espace, et la faute de frappe `blig`. Ça fonctionne aujourd'hui, mais c'est
fragile au premier nettoyage de dossier et ça détonne à côté de la convention propre `heroes/<slug>.jpg` des
26 autres articles. À renommer.

**③ Constat de catalogue (chapeau stratégiste).** Sur 27 articles, **21 visent l'ÉPS**, 1 seul est purement camp de
jour (`grands-jeux-exterieurs-camp-de-jour`) et **aucun n'est purement service de garde** — les trois articles qui
parlent au SDG (`un-jeu-trois-versions`, `inventaire-materiel-sans-effort`, `catastrophes-ordinaires`) sont des
articles transversaux. C'est la raison pour laquelle la rotation des univers du calendrier ci-dessous penche vers
l'ÉPS : **le déséquilibre n'est pas dans le calendrier, il est dans le catalogue.** Deux ou trois articles
strictement SDG (animation du midi, jeux calmes en local restreint, transitions de fin de journée) et deux
strictement camp (semaine type d'animateur, plan B pluie) rééquilibreraient la campagne — et ouvriraient deux
univers de recherche organique que ZTS n'occupe pratiquement pas.

---

## 1. Inventaire des 27 articles

| # | Slug | Titre | Univers | Appât SEO | Image OG |
|---|------|-------|---------|-----------|----------|
| 1 | `faire-bouger-enfants` | Faire bouger les enfants au primaire : 10 leviers | ÉPS + service de garde | ★ libre 100 % | `…/heroes/faire-bouger-enfants.jpg` |
| 2 | `comportements-perturbateurs` | Comportements perturbateurs en EPS : que faire ? | ÉPS | ★ libre 100 % | `…/heroes/comportements-perturbateurs.jpg` |
| 3 | `catastrophes-ordinaires` | Vomi, guêpes et alarme de feu : le guide des catastrophes ordinaires | ÉPS + camp de jour + service de garde | ★ libre 100 % | `…/heroes/catastrophes-ordinaires.jpg` |
| 4 | `grands-jeux-exterieurs-camp-de-jour` | 20 grands jeux extérieurs pour camp de jour | camp de jour | — | `…/heroes/grands-jeux-exterieurs-camp-de-jour.jpg` |
| 5 | `un-jeu-trois-versions` | Jeux inclusifs : un seul jeu, trois versions | service de garde + ÉPS + camp de jour | — | `…/heroes/un-jeu-trois-versions.jpg` |
| 6 | `50-jeunes-un-gymnase` | Grands groupes en gymnase : 21 stratégies EPS | ÉPS + camp de jour + service de garde | — | `…/Images%20article%2050%20jeunes%20gymnase%20/image%201%20article%20blig%2050%20jeunes%201%20gymnase.png` |
| 7 | `courbe-plaisir-jeu` | Courbe du plaisir : combien de temps un jeu en EPS | camp de jour + ÉPS | — | `…/heroes/courbe-plaisir-jeu.jpg` |
| 8 | `inventaire-materiel-sans-effort` | Inventaire du matériel sportif : la méthode éclair | service de garde + ÉPS + camp de jour | — | `…/heroes/inventaire-materiel-sans-effort.jpg` |
| 9 | `jeux-course-1er-cycle` | Jeux de course pour le 1er cycle : 12 idées EPS | ÉPS | — | `…/heroes/jeux-course-1er-cycle.jpg` |
| 10 | `color-run` | Color Run à l'école : guide complet d'organisation | camp de jour + ÉPS | — | `…/heroes/color-run.jpg` |
| 11 | `respect-eps` | Respect en EPS : installer une culture saine | ÉPS | — | `…/heroes/respect-eps.jpg` |
| 12 | `eleves-cotes-eps` | Élèves cotés en EPS : adapter ses cours | ÉPS | — | `…/heroes/eleves-cotes-eps.jpg` |
| 13 | `classes-difficiles-partie-1` | Classes difficiles en EPS : poser le cadre (1/3) | ÉPS | — | `…/heroes/classes-difficiles-partie-1.jpg` |
| 14 | `classes-difficiles-partie-2` | Classes difficiles en EPS : stratégies (2/3) | ÉPS | — | `…/heroes/classes-difficiles-partie-2.jpg` |
| 15 | `classes-difficiles-partie-3` | Classes difficiles en EPS : durer (3/3) | ÉPS | — | `…/heroes/classes-difficiles-partie-3.jpg` |
| 16 | `nawatobi` | Nawatobi : corde à sauter japonaise en gymnase | ÉPS | — | `…/heroes/nawatobi.png` |
| 17 | `foobaskill` | Foobaskill : sport hybride soccer-basket en EPS | ÉPS | — | `…/heroes/foobaskill.png` |
| 18 | `sae-course` | SAÉ course primaire : situation prête à utiliser | ÉPS | — | `…/heroes/sae-course.jpg` |
| 19 | `systeme-emulation-dollar` | Système d'émulation par dollars en classe | ÉPS | — | `…/heroes/systeme-emulation-dollar.png` |
| 20 | `systeme-emulation-dollars-ecole` | Émulation par dollars à l'échelle de l'école | ÉPS | — | `…/heroes/systeme-emulation-dollars-ecole.jpg` |
| 21 | `bienfaits-sport-enfants` | Bienfaits du sport pour les enfants : guide EPS | ÉPS | — | `…/heroes/bienfaits-sport-enfants.jpg` |
| 22 | `syndrome-gymnase` | Syndrome du gymnase : repérer l'épuisement EPS | ÉPS | — | `…/heroes/syndrome-gymnase.jpg` |
| 23 | `harcelement-enseignants` | Harcèlement envers les enseignants : agir | ÉPS | — | `…/heroes/harcelement-enseignants.jpg` |
| 24 | `suppleance-ecoles` | Suppléance en école : guide pratique terrain | ÉPS | — | `…/heroes/suppleance-ecoles.png` |
| 25 | `comptes-rendus-rencontres` | Les comptes rendus de rencontre sans y passer ta soirée | ÉPS + service de garde | — | `…/heroes/comptes-rendus-rencontres.jpg` |
| 26 | `rentree-scolaire` | Rentrée scolaire en EPS : guide de démarrage | ÉPS | — | `…/heroes/rentree-scolaire.jpg` |
| 27 | `avance-annee-scolaire` | Préparer l'année scolaire en EPS : checklist d'été | ÉPS | — | `…/heroes/avance-annee-scolaire.jpg` |

Les 27 URL ont été vérifiées une à une : **27 × HTTP 200**, `og:title`, `og:description` et `og:image` présentes
partout. Teasers complets dans le CSV joint.

---

## 2. Calendrier de publication

**Cadence :** 3 posts par semaine, un article par semaine décliné sur les trois plateformes.

| Créneau | Jour | Heure | Plateforme | Pourquoi ce moment |
|---|---|---|---|---|
| 1 | Mardi | 19 h 00 | Facebook | Le soir en semaine, quand les profs et les éducatrices scrollent après le souper |
| 2 | Jeudi | 7 h 30 | LinkedIn | Avant la journée de travail, pic d'audience professionnelle |
| 3 | Dimanche | 10 h 00 | X | Préparation de la semaine, faible concurrence dans le fil |

**Ordre de passage :** les trois appâts SEO d'abord (semaines 1 à 3), puis rotation des univers en tenant compte de
la saison — rentrée en septembre, gestion de classe à l'automne, motivation et épuisement en hiver, préparation des
camps et événements de fin d'année au printemps. **Pause de deux semaines** aux fêtes (21 et 28 décembre).

| Sem. | Semaine du | Article | Univers | Appât |
|---|---|---|---|---|
| 1 | 1 sept. 2026 | Faire bouger les enfants au primaire : 10 leviers | ÉPS + service de garde | ★ |
| 2 | 8 sept. 2026 | Comportements perturbateurs en EPS : que faire ? | ÉPS | ★ |
| 3 | 15 sept. 2026 | Vomi, guêpes et alarme de feu : le guide des catastrophes ordinaires | ÉPS + camp de jour + service de garde | ★ |
| 4 | 22 sept. 2026 | Rentrée scolaire en EPS : guide de démarrage | ÉPS |  |
| 5 | 29 sept. 2026 | Jeux inclusifs : un seul jeu, trois versions | service de garde + ÉPS + camp de jour |  |
| 6 | 6 oct. 2026 | Jeux de course pour le 1er cycle : 12 idées EPS | ÉPS |  |
| 7 | 13 oct. 2026 | Courbe du plaisir : combien de temps un jeu en EPS | camp de jour + ÉPS |  |
| 8 | 20 oct. 2026 | Grands groupes en gymnase : 21 stratégies EPS | ÉPS + camp de jour + service de garde |  |
| 9 | 27 oct. 2026 | Respect en EPS : installer une culture saine | ÉPS |  |
| 10 | 3 nov. 2026 | Élèves cotés en EPS : adapter ses cours | ÉPS |  |
| 11 | 10 nov. 2026 | Syndrome du gymnase : repérer l'épuisement EPS | ÉPS |  |
| 12 | 17 nov. 2026 | Classes difficiles en EPS : poser le cadre (1/3) | ÉPS |  |
| 13 | 24 nov. 2026 | Classes difficiles en EPS : stratégies (2/3) | ÉPS |  |
| 14 | 1 déc. 2026 | Classes difficiles en EPS : durer (3/3) | ÉPS |  |
| 15 | 8 déc. 2026 | Système d'émulation par dollars en classe | ÉPS |  |
| 16 | 15 déc. 2026 | Nawatobi : corde à sauter japonaise en gymnase | ÉPS |  |
| 17 | 5 janv. 2027 | Foobaskill : sport hybride soccer-basket en EPS | ÉPS |  |
| 18 | 12 janv. 2027 | Émulation par dollars à l'échelle de l'école | ÉPS |  |
| 19 | 19 janv. 2027 | SAÉ course primaire : situation prête à utiliser | ÉPS |  |
| 20 | 26 janv. 2027 | Les comptes rendus de rencontre sans y passer ta soirée | ÉPS + service de garde |  |
| 21 | 2 févr. 2027 | Bienfaits du sport pour les enfants : guide EPS | ÉPS |  |
| 22 | 9 févr. 2027 | Color Run à l'école : guide complet d'organisation | camp de jour + ÉPS |  |
| 23 | 16 févr. 2027 | 20 grands jeux extérieurs pour camp de jour | camp de jour |  |
| 24 | 23 févr. 2027 | Harcèlement envers les enseignants : agir | ÉPS |  |
| 25 | 2 mars 2027 | Suppléance en école : guide pratique terrain | ÉPS |  |
| 26 | 9 mars 2027 | Inventaire du matériel sportif : la méthode éclair | service de garde + ÉPS + camp de jour |  |
| 27 | 16 mars 2027 | Préparer l'année scolaire en EPS : checklist d'été | ÉPS |  |

---

## 3. Les 81 posts, prêts à coller

Chaque bloc = une semaine = un article. Copie le texte tel quel, colle-le, joins l'image indiquée. Les liens sont
nus : si tu publies dans un **groupe** Facebook, ajoute
`?utm_source=facebook&utm_medium=groupe&utm_campaign=<nom-du-groupe>` à la fin du lien (voir l'annexe).

### Semaine 1 — Faire bouger les enfants au primaire : 10 leviers  ★ appât SEO (libre à 100 %)

**Univers :** ÉPS + service de garde · **Lien :** https://zonetotalsport.ca/articles/faire-bouger-enfants.html

<details open>
<summary><b>Facebook — mardi 1 sept. 2026, 19:00</b></summary>

*Image : `promo/faire-bouger-enfants-carre.webp`*

```
Y'a des semaines où t'as l'impression que les enfants passent plus de temps assis qu'en mouvement, même à l'école.
On a rassemblé 10 leviers concrets pour faire bouger les jeunes du primaire : des jeux à essayer dès demain, des rituels actifs entre deux périodes, pis des idées qui marchent même quand t'as pas de gymnase de libre.
Rien de théorique là-dedans : c'est du testé sur le plancher.
Toi, c'est quoi ton truc no 1 pour réveiller un groupe amorphe un mardi après-midi ?
👉 https://zonetotalsport.ca/articles/faire-bouger-enfants.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 3 sept. 2026, 07:30</b></summary>

*Image : `promo/faire-bouger-enfants-carre.webp`*

```
La sédentarité chez les 5-12 ans n'est pas seulement une question de temps d'éducation physique : elle se joue aussi dans les transitions, les récréations et les moments creux de la journée.
Cet article rassemble 10 leviers applicables dès la semaine prochaine, autant pour un cours structuré au gymnase que pour une plage d'animation en service de garde.
Chaque levier est accompagné d'exemples de jeux et de rituels actifs testés en milieu scolaire primaire.
L'objectif n'est pas d'ajouter une tâche de plus, mais de récupérer du mouvement là où il y en avait déjà la place.
À lire et à partager avec votre équipe-école.
https://zonetotalsport.ca/articles/faire-bouger-enfants.html
```

</details>

<details open>
<summary><b>X — dimanche 6 sept. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/faire-bouger-enfants.jpg)`*

```
10 leviers pour faire bouger les enfants au primaire : des jeux à essayer demain, des rituels actifs entre les cours, zéro théorie.
Article complet, gratuit, sans compte :
https://zonetotalsport.ca/articles/faire-bouger-enfants.html
#ÉPS #servicedegarde
```

</details>


### Semaine 2 — Comportements perturbateurs en EPS : que faire ?  ★ appât SEO (libre à 100 %)

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/comportements-perturbateurs.html

<details open>
<summary><b>Facebook — mardi 8 sept. 2026, 19:00</b></summary>

*Image : `promo/comportements-perturbateurs-carre.webp`*

```
Le petit qui lance le ballon dans le plafond pendant les consignes. Celui qui part à courir avant le signal. Celui qui teste, juste pour voir.
On a mis noir sur blanc comment repérer les déclencheurs avant l'explosion, à quel moment intervenir (et surtout quand se taire), pis comment éviter que ça monte en escalade devant les 27 autres.
C'est du terrain, pas de la théorie de bac.
Ton pire déclencheur à toi, c'est lequel : les transitions, le matériel, ou l'attente du tour ?
👉 https://zonetotalsport.ca/articles/comportements-perturbateurs.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 10 sept. 2026, 07:30</b></summary>

*Image : `promo/comportements-perturbateurs-carre.webp`*

```
En éducation physique, un comportement perturbateur ne commence presque jamais au moment où on le voit : il commence dans la transition d'avant, dans l'attente d'un tour, ou dans une consigne trop longue.
Cet article propose une lecture en trois temps — identifier les déclencheurs, choisir le moment d'intervention, désamorcer sans escalade — avec des outils applicables dans un gymnase bruyant et un groupe complet.
Il s'adresse autant aux enseignants d'éducation physique qu'aux personnes qui animent de grands groupes en contexte parascolaire.
Une ressource utile en début d'année, quand le cadre se pose encore.
https://zonetotalsport.ca/articles/comportements-perturbateurs.html
```

</details>

<details open>
<summary><b>X — dimanche 13 sept. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/comportements-perturbateurs.jpg)`*

```
Repérer le déclencheur avant l'explosion, intervenir au bon moment, éviter l'escalade devant les 27 autres.
Guide complet sur les comportements perturbateurs au gymnase, gratuit :
https://zonetotalsport.ca/articles/comportements-perturbateurs.html
#ÉPS #gestiondeclasse
```

</details>


### Semaine 3 — Vomi, guêpes et alarme de feu : le guide des catastrophes ordinaires  ★ appât SEO (libre à 100 %)

**Univers :** ÉPS + camp de jour + service de garde · **Lien :** https://zonetotalsport.ca/articles/catastrophes-ordinaires.html

<details open>
<summary><b>Facebook — mardi 15 sept. 2026, 19:00</b></summary>

*Image : `promo/catastrophes-ordinaires-carre.webp`*

```
Le vomi en plein milieu du gymnase. La guêpe dans le local. L'alarme de feu pendant que la moitié du groupe est en maillot.
Ta formation ne t'a jamais parlé de ça. Nous, oui.
On a documenté 14 situations que tout le monde vit pis dont personne ne parle, avec 3 à 4 solutions concrètes pour chacune — incluant le fameux réflexe « Code Oreille » pour gérer sans paniquer devant 25 témoins.
Laquelle t'est déjà arrivée ? (On sait que t'en as une.)
👉 https://zonetotalsport.ca/articles/catastrophes-ordinaires.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 17 sept. 2026, 07:30</b></summary>

*Image : `promo/catastrophes-ordinaires-carre.webp`*

```
Il existe une catégorie d'imprévus dont on ne parle jamais en formation initiale : l'accident corporel devant un groupe, l'insecte qui déclenche une panique collective, l'évacuation au moment le plus inopportun de la journée.
Ces situations sont pourtant fréquentes, et la qualité de la réponse tient presque entièrement à ce qui a été préparé d'avance.
Cet article documente 14 scénarios réels avec, pour chacun, trois à quatre pistes d'intervention concrètes, plus un protocole simple pour préserver la dignité de l'enfant devant témoins.
Utile en éducation physique, en camp de jour comme en service de garde — les trois milieux vivent exactement les mêmes scènes.
https://zonetotalsport.ca/articles/catastrophes-ordinaires.html
```

</details>

<details open>
<summary><b>X — dimanche 20 sept. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/catastrophes-ordinaires.jpg)`*

```
Vomi en plein gymnase, guêpe dans le local, alarme de feu au pire moment : 14 situations que ta formation n'a jamais couvertes, avec des solutions.
Gratuit, sans compte :
https://zonetotalsport.ca/articles/catastrophes-ordinaires.html
#ÉPS #campdejour #servicedegarde
```

</details>


### Semaine 4 — Rentrée scolaire en EPS : guide de démarrage

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/rentree-scolaire.html

<details open>
<summary><b>Facebook — mardi 22 sept. 2026, 19:00</b></summary>

*Image : `promo/rentree-scolaire-carre.webp`*

```
La première semaine en éducation physique, c'est là que se joue le reste de l'année. Pas dans le contenu : dans les routines.
L'article couvre ce qu'il faut installer dès les premiers cours — les signaux, les règles, le rangement, l'entrée et la sortie du gymnase — pis le matériel à prévoir avant que tout le monde se garroche dessus.
Un cadre posé en septembre, c'est des mois de gestion en moins.
Ta première activité de l'année avec un nouveau groupe, c'est quoi ?
👉 https://zonetotalsport.ca/articles/rentree-scolaire.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 24 sept. 2026, 07:30</b></summary>

*Image : `promo/rentree-scolaire-carre.webp`*

```
En éducation physique, la première semaine détermine une large part de l'année : les routines installées à ce moment-là deviennent les automatismes du groupe pour les dix mois suivants.
Cet article détaille ce qui mérite d'être posé dès les premiers cours — signaux d'arrêt et de regroupement, règles de circulation, protocole d'entrée et de sortie du gymnase, gestion du matériel — ainsi que la préparation matérielle à faire en amont.
Il aborde également le volet professionnel de la rentrée pour les personnes en début de carrière : dossier au centre de services scolaire, préparation aux entrevues, stratégies de réseautage.
https://zonetotalsport.ca/articles/rentree-scolaire.html
```

</details>

<details open>
<summary><b>X — dimanche 27 sept. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/rentree-scolaire.jpg)`*

```
La première semaine en ÉPS se joue dans les routines, pas dans le contenu.
Signaux, règles, entrée et sortie du gymnase, matériel à prévoir : le guide de démarrage d'année :
https://zonetotalsport.ca/articles/rentree-scolaire.html
#ÉPS #rentréescolaire
```

</details>


### Semaine 5 — Jeux inclusifs : un seul jeu, trois versions

**Univers :** service de garde + ÉPS + camp de jour · **Lien :** https://zonetotalsport.ca/articles/un-jeu-trois-versions.html

<details open>
<summary><b>Facebook — mardi 29 sept. 2026, 19:00</b></summary>

*Image : `promo/un-jeu-trois-versions-carre.webp`*

```
Un jour, pour « inclure » un enfant, je lui ai donné une tâche à part pendant que les autres jouaient. J'étais fier de moi. Sauf que je venais de fabriquer l'exclusion en pensant faire de l'inclusion.
L'article explique la méthode des 4 boutons — ZONE, RYTHME, RÔLE, RETOUR — pour adapter un jeu sans jamais sortir l'enfant du groupe, avec 30 solutions concrètes réparties entre le gymnase, le camp de jour pis le service de garde.
Ça t'est déjà arrivé, toi, de réaliser après coup que ton adaptation isolait au lieu d'inclure ?
👉 https://zonetotalsport.ca/articles/un-jeu-trois-versions.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 1 oct. 2026, 07:30</b></summary>

*Image : `promo/un-jeu-trois-versions-carre.webp`*

```
Adapter une activité pour un enfant à besoins particuliers tourne souvent au piège : en créant une version « spéciale », on retire l'enfant du jeu commun tout en croyant l'inclure.
Cet article propose une méthode en quatre variables — la zone, le rythme, le rôle et le retour — qui permet de faire coexister trois niveaux de difficulté dans un seul et même jeu.
Un exemple filé (le ballon chasseur) montre le principe décliné en gymnase, en camp de jour et en service de garde, suivi de 30 solutions concrètes, dix par milieu.
La dernière section propose trois gestes applicables dès le prochain lundi, sans matériel supplémentaire.
Particulièrement pertinent pour les équipes de service de garde scolaire qui accueillent des groupes très hétérogènes en fin de journée.
https://zonetotalsport.ca/articles/un-jeu-trois-versions.html
```

</details>

<details open>
<summary><b>X — dimanche 4 oct. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/un-jeu-trois-versions.jpg)`*

```
Adapter un jeu pour un enfant à besoins particuliers sans créer une activité à part : la méthode des 4 boutons + 30 solutions terrain.
https://zonetotalsport.ca/articles/un-jeu-trois-versions.html
#servicedegarde #inclusion #ÉPS
```

</details>


### Semaine 6 — Jeux de course pour le 1er cycle : 12 idées EPS

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/jeux-course-1er-cycle.html

<details open>
<summary><b>Facebook — mardi 6 oct. 2026, 19:00</b></summary>

*Image : `promo/jeux-course-1er-cycle-carre.webp`*

```
« On court-tu encore ? » — la phrase qui tue en 1re année.
Le problème, c'est rarement la course : c'est de courir pour rien. On a rassemblé 12 jeux de course pour le 1er cycle, avec un bagage moteur léger et des variantes pour relancer sans tout réexpliquer : attrape la souris, les feux de circulation, l'invasion, le mur de résistance…
Simples à monter, faciles à comprendre en 30 secondes.
Ton classique de 1re-2e année qui fonctionne toujours, c'est lequel ?
👉 https://zonetotalsport.ca/articles/jeux-course-1er-cycle.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 8 oct. 2026, 07:30</b></summary>

*Image : `promo/jeux-course-1er-cycle-carre.webp`*

```
Au 1er cycle du primaire, la course est souvent utilisée comme remplissage : on fait courir parce qu'il faut dépenser de l'énergie, sans intention motrice claire.
Cet article propose 12 jeux de course construits sur un bagage moteur volontairement léger — les consignes tiennent en une trentaine de secondes — avec, pour chacun, des variantes permettant de relancer le jeu sans réexpliquer.
L'ensemble couvre plusieurs familles : poursuite, invasion, relais d'obstacles, jeux de capture et de stratégie.
Une base solide pour bâtir une séquence de début d'année en éducation physique au primaire.
https://zonetotalsport.ca/articles/jeux-course-1er-cycle.html
```

</details>

<details open>
<summary><b>X — dimanche 11 oct. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/jeux-course-1er-cycle.jpg)`*

```
12 jeux de course pour le 1er cycle : bagage moteur léger, consignes de 30 secondes, variantes pour relancer.
Pour ne plus jamais faire courir « pour rien » :
https://zonetotalsport.ca/articles/jeux-course-1er-cycle.html
#ÉPS #éducationphysique #primaire
```

</details>


### Semaine 7 — Courbe du plaisir : combien de temps un jeu en EPS

**Univers :** camp de jour + ÉPS · **Lien :** https://zonetotalsport.ca/articles/courbe-plaisir-jeu.html

<details open>
<summary><b>Facebook — mardi 13 oct. 2026, 19:00</b></summary>

*Image : `promo/courbe-plaisir-jeu-carre.webp`*

```
Tu connais le moment. Le jeu roule, tout le monde embarque… pis d'un coup, ça s'effrite. Deux qui chialent, trois qui s'assoient.
C'est pas ton groupe le problème : c'est la courbe du plaisir. Chaque jeu monte, plafonne, pis redescend — le truc, c'est d'arrêter avant la descente.
L'article explique comment lire les signaux, quand relancer, pis quand changer complètement d'activité.
Toi, tu le sens comment que c'est le temps d'arrêter un jeu ?
👉 https://zonetotalsport.ca/articles/courbe-plaisir-jeu.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 15 oct. 2026, 07:30</b></summary>

*Image : `promo/courbe-plaisir-jeu-carre.webp`*

```
L'engagement dans un jeu suit une courbe en U inversé : montée, plateau, puis décrochage. La compétence d'animation ne consiste pas à trouver le jeu parfait, mais à reconnaître le sommet de cette courbe et à arrêter juste avant.
Cet article détaille les causes de désorganisation d'une activité (écart de compétences, conflits, pression des pairs), les signaux observables du décrochage, et les leviers pour prolonger le plateau : variation des défis, rétroaction, rotation des rôles.
C'est une compétence directement transférable en camp de jour, où une même journée enchaîne huit à dix activités et où le coût d'un jeu qui s'étire est immédiat.
https://zonetotalsport.ca/articles/courbe-plaisir-jeu.html
```

</details>

<details open>
<summary><b>X — dimanche 18 oct. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/courbe-plaisir-jeu.jpg)`*

```
Un jeu monte, plafonne, puis s'effrite. Le secret : arrêter avant la descente.
La courbe du plaisir, les signaux à lire et quand relancer un groupe qui décroche :
https://zonetotalsport.ca/articles/courbe-plaisir-jeu.html
#campdejour #animation #ÉPS
```

</details>


### Semaine 8 — Grands groupes en gymnase : 21 stratégies EPS

**Univers :** ÉPS + camp de jour + service de garde · **Lien :** https://zonetotalsport.ca/articles/50-jeunes-un-gymnase.html

<details open>
<summary><b>Facebook — mardi 20 oct. 2026, 19:00</b></summary>

*Image : `promo/50-jeunes-un-gymnase-carre.webp`*

```
Deux groupes fusionnés, un remplaçant qui ne s'est pas présenté, pis te v'là avec 50 jeunes dans un gymnase prévu pour 25.
On a compilé 21 stratégies pour survivre — pis même bien travailler — dans cette situation-là : le bruit, le manque de matériel, les écarts de niveaux, la surcharge sensorielle, les transitions qui virent au chaos.
Sept stratégies pour l'ÉPS, sept pour le camp de jour, sept pour le service de garde. Tout testé sur le terrain.
C'est quoi ton record personnel de jeunes dans un gymnase ?
👉 https://zonetotalsport.ca/articles/50-jeunes-un-gymnase.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 22 oct. 2026, 07:30</b></summary>

*Image : `promo/50-jeunes-un-gymnase-carre.webp`*

```
Les grands groupes en gymnase ne sont plus l'exception : fusion de classes, absence non remplacée, journée pédagogique, période de pluie en camp — la situation revient plusieurs fois par mois.
Cet article part de sept problématiques documentées (acoustique, matériel insuffisant, écarts de compétences motrices, surcharge sensorielle, transitions, fatigue de fin de journée) et propose 21 stratégies réparties par métier.
La structure est volontairement séparée : ce qui fonctionne en enseignement structuré n'est pas ce qui fonctionne en animation, et l'article assume cette distinction plutôt que de la lisser.
Les besoins particuliers (TDAH, TSA, limitation motrice) sont traités dès la conception des activités, pas en correctif.
https://zonetotalsport.ca/articles/50-jeunes-un-gymnase.html
```

</details>

<details open>
<summary><b>X — dimanche 25 oct. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/Images%20article%2050%20jeunes%20gymnase%20/image%201%20article%20blig%2050%20jeunes%201%20gymnase.png)`*

```
50 jeunes dans un gymnase prévu pour 25 : 21 stratégies pour le bruit, le matériel, les écarts de niveaux et les transitions.
7 pour l'ÉPS, 7 pour le camp, 7 pour le SDG :
https://zonetotalsport.ca/articles/50-jeunes-un-gymnase.html
#ÉPS #gestiondeclasse
```

</details>


### Semaine 9 — Respect en EPS : installer une culture saine

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/respect-eps.html

<details open>
<summary><b>Facebook — mardi 27 oct. 2026, 19:00</b></summary>

*Image : `promo/respect-eps-carre.webp`*

```
Le respect, ça ne s'affiche pas sur un carton au mur : ça s'installe, semaine après semaine, avec des rituels.
L'article propose cinq outils pédagogiques concrets pour bâtir une vraie culture de respect au gymnase — dont la fiche réflexive à choix multiples, celle qui fait réfléchir l'élève au lieu de le punir dans le vide.
Il y a aussi des exemples de conséquences qui ont du sens, pas juste des punitions.
Ton rituel d'ouverture de cours, il ressemble à quoi ?
👉 https://zonetotalsport.ca/articles/respect-eps.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 29 oct. 2026, 07:30</b></summary>

*Image : `promo/respect-eps-carre.webp`*

```
Le respect en éducation physique est rarement un problème de règles : les règles existent presque toujours. C'est un problème de rituels — ce qui est répété assez souvent pour devenir une norme de groupe.
Cet article présente cinq outils pédagogiques éprouvés au primaire (lettres, présentations d'élèves, journaux de bord, affiches co-construites, fiches réflexives à choix multiples) et explique comment les articuler à un système de conséquences cohérent.
La fiche réflexive, en particulier, déplace la logique de la sanction vers la responsabilisation, sans allonger le temps de gestion pendant le cours.
https://zonetotalsport.ca/articles/respect-eps.html
```

</details>

<details open>
<summary><b>X — dimanche 1 nov. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/respect-eps.jpg)`*

```
Le respect au gymnase, ça s'installe avec des rituels, pas avec une affiche.
5 outils pédagogiques concrets, dont la fiche réflexive qui fait réfléchir au lieu de punir dans le vide :
https://zonetotalsport.ca/articles/respect-eps.html
#ÉPS #climatscolaire
```

</details>


### Semaine 10 — Élèves cotés en EPS : adapter ses cours

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/eleves-cotes-eps.html

<details open>
<summary><b>Facebook — mardi 3 nov. 2026, 19:00</b></summary>

*Image : `promo/eleves-cotes-eps-carre.webp`*

```
T'as un élève coté dans ton groupe, un plan d'intervention de trois pages, pis 40 minutes pour faire bouger 26 jeunes. On fait quoi, concrètement ?
L'article passe à travers les grandes familles de cotes — troubles du comportement, déficiences intellectuelles et motrices, enjeux sensoriels et de communication — avec des adaptations qui fonctionnent en gymnase, sans sortir l'élève du groupe.
C'est du pratique, pas du copier-coller de politique ministérielle.
Ton adaptation la plus payante jusqu'à maintenant, c'était quoi ?
👉 https://zonetotalsport.ca/articles/eleves-cotes-eps.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 5 nov. 2026, 07:30</b></summary>

*Image : `promo/eleves-cotes-eps-carre.webp`*

```
Les plans d'intervention sont écrits pour la classe. Le gymnase, lui, a ses propres contraintes : grand espace, bruit, déplacements rapides, matériel partagé, transitions nombreuses.
Cet article traduit les principales familles de cotes — troubles du comportement, déficiences intellectuelles, déficiences motrices, enjeux sensoriels et de communication — en adaptations concrètes applicables pendant un cours d'éducation physique.
Le principe directeur reste le même du début à la fin : adapter l'activité plutôt que retirer l'élève, et conserver la participation au jeu commun comme critère de réussite de l'adaptation.
https://zonetotalsport.ca/articles/eleves-cotes-eps.html
```

</details>

<details open>
<summary><b>X — dimanche 8 nov. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/eleves-cotes-eps.jpg)`*

```
Un élève coté, un plan d'intervention de 3 pages et 40 minutes pour faire bouger 26 jeunes : on fait quoi concrètement ?
Adaptations par famille de cotes, applicables en gymnase :
https://zonetotalsport.ca/articles/eleves-cotes-eps.html
#ÉPS #inclusion
```

</details>


### Semaine 11 — Syndrome du gymnase : repérer l'épuisement EPS

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/syndrome-gymnase.html

<details open>
<summary><b>Facebook — mardi 10 nov. 2026, 19:00</b></summary>

*Image : `promo/syndrome-gymnase-carre.webp`*

```
Tu cries plus fort qu'avant. Tu commences à trouver tes groupes « pénibles ». Tu comptes les jours jusqu'au congé pédagogique.
Ce n'est pas juste de la fatigue de novembre. L'article décrit 8 signes du syndrome du gymnase — l'épuisement professionnel version prof d'éducation physique — pis 5 réflexes pour désamorcer avant de frapper le mur.
Ça se lit en 10 minutes, pis ça vaut la peine même si tu penses que ça ne s'adresse pas à toi.
Tu le reconnais, ce moment-là dans l'année ?
👉 https://zonetotalsport.ca/articles/syndrome-gymnase.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 12 nov. 2026, 07:30</b></summary>

*Image : `promo/syndrome-gymnase-carre.webp`*

```
L'épuisement professionnel en éducation physique prend une forme particulière : bruit constant, charge vocale, grands groupes, isolement dans l'école, et une fatigue physique qui masque longtemps la fatigue psychologique.
Cet article décrit huit signes précurseurs observables et cinq réflexes de désamorçage applicables avant que la situation ne devienne un arrêt de travail.
Il s'adresse autant aux enseignants qu'aux directions, qui sont souvent les mieux placées pour repérer ces signaux chez un membre de leur équipe et intervenir tôt.
https://zonetotalsport.ca/articles/syndrome-gymnase.html
```

</details>

<details open>
<summary><b>X — dimanche 15 nov. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/syndrome-gymnase.jpg)`*

```
Crier plus fort qu'avant, trouver ses groupes « pénibles », compter les jours : 8 signes du syndrome du gymnase et 5 réflexes pour désamorcer avant le mur.
https://zonetotalsport.ca/articles/syndrome-gymnase.html
#ÉPS #santéautravail
```

</details>


### Semaine 12 — Classes difficiles en EPS : poser le cadre (1/3)

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/classes-difficiles-partie-1.html

<details open>
<summary><b>Facebook — mardi 17 nov. 2026, 19:00</b></summary>

*Image : `promo/classes-difficiles-partie-1-carre.webp`*

```
Y'a des groupes qui te font douter de ton choix de carrière. On a écrit un guide en trois parties pour ceux-là.
La partie 1 s'attaque au début : comprendre d'où vient le comportement (famille, besoins non comblés, opposition), bâtir une vraie relation de confiance, pis poser le cadre dès la première minute de cours.
Parce qu'un cadre installé en septembre, c'est trois mois de gestion en moins.
Ton premier cours avec un groupe difficile, tu le commences comment ?
👉 https://zonetotalsport.ca/articles/classes-difficiles-partie-1.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 19 nov. 2026, 07:30</b></summary>

*Image : `promo/classes-difficiles-partie-1-carre.webp`*

```
Premier volet d'un guide en trois parties sur les groupes difficiles en éducation physique.
Cette première partie porte sur ce qui précède l'intervention : identifier les causes probables d'un comportement (contexte familial, besoins non satisfaits, difficultés d'apprentissage, trouble oppositionnel), construire une relation de confiance authentique, et poser un cadre lisible dès les premières minutes du premier cours.
Le postulat de départ est simple : la gestion de classe se joue davantage en septembre qu'en janvier, et un cadre installé tôt réduit mécaniquement le volume d'interventions du reste de l'année.
https://zonetotalsport.ca/articles/classes-difficiles-partie-1.html
```

</details>

<details open>
<summary><b>X — dimanche 22 nov. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/classes-difficiles-partie-1.jpg)`*

```
Guide en 3 volets sur les classes difficiles en ÉPS. Partie 1 : comprendre d'où vient le comportement, bâtir la confiance, poser le cadre dès la 1re minute.
https://zonetotalsport.ca/articles/classes-difficiles-partie-1.html
#ÉPS #gestiondeclasse
```

</details>


### Semaine 13 — Classes difficiles en EPS : stratégies (2/3)

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/classes-difficiles-partie-2.html

<details open>
<summary><b>Facebook — mardi 24 nov. 2026, 19:00</b></summary>

*Image : `promo/classes-difficiles-partie-2-carre.webp`*

```
Partie 2 du guide sur les classes difficiles : cette fois, on est dans le feu de l'action.
Règles claires, routines prévisibles, renforcement positif qui ne sonne pas faux, gestion du temps, transitions qui ne dégénèrent pas. Des stratégies d'intervention à appliquer en direct, pendant que le cours roule.
La partie 1 posait le cadre; celle-ci, c'est le mode d'emploi quand ça déborde quand même.
Les transitions, c'est-tu ton point faible à toi aussi ?
👉 https://zonetotalsport.ca/articles/classes-difficiles-partie-2.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 26 nov. 2026, 07:30</b></summary>

*Image : `promo/classes-difficiles-partie-2-carre.webp`*

```
Deuxième volet du guide sur les groupes difficiles en éducation physique, consacré à l'intervention en temps réel.
On y traite des routines qui rendent le cours prévisible, du renforcement positif appliqué avec assez de précision pour rester crédible, de la gestion du temps et des transitions — le moment où se produit la majorité des débordements.
La dernière section aborde l'adaptation pédagogique comme levier de gestion : une activité mal calibrée génère plus de comportements difficiles qu'un manque d'autorité.
À lire à la suite de la partie 1, qui porte sur l'installation du cadre.
https://zonetotalsport.ca/articles/classes-difficiles-partie-2.html
```

</details>

<details open>
<summary><b>X — dimanche 29 nov. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/classes-difficiles-partie-2.jpg)`*

```
Classes difficiles en ÉPS, partie 2 : les stratégies d'intervention en direct. Routines prévisibles, renforcement positif, transitions qui ne dégénèrent pas.
https://zonetotalsport.ca/articles/classes-difficiles-partie-2.html
#ÉPS #gestiondeclasse
```

</details>


### Semaine 14 — Classes difficiles en EPS : durer (3/3)

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/classes-difficiles-partie-3.html

<details open>
<summary><b>Facebook — mardi 1 déc. 2026, 19:00</b></summary>

*Image : `promo/classes-difficiles-partie-3-carre.webp`*

```
Partie 3, la plus rare : comment on se relève d'un cours qui a mal viré, pis comment on tient jusqu'en juin.
On parle de gestion de conflits, de collaboration avec les parents, d'observation ciblée des comportements qui reviennent, pis de la fatigue qui s'accumule quand on recommence chaque semaine avec le même groupe.
C'est la partie que personne n'écrit, parce qu'elle parle de durée plutôt que de trucs.
Après une séance qui vire mal, tu fais quoi pour décrocher ?
👉 https://zonetotalsport.ca/articles/classes-difficiles-partie-3.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 3 déc. 2026, 07:30</b></summary>

*Image : `promo/classes-difficiles-partie-3-carre.webp`*

```
Troisième et dernier volet du guide sur les groupes difficiles en éducation physique. Celui-ci porte sur la durée plutôt que sur la technique.
Il aborde la gestion des conflits dans le groupe, l'observation ciblée des comportements récurrents, la collaboration avec les parents comme partenaires plutôt que comme instance de sanction, et l'articulation entre apprentissage moteur, régulation émotionnelle et compétences sociales.
La question sous-jacente est celle de la soutenabilité : ce qui fonctionne une semaine et ce qui tient encore en mai ne sont pas toujours les mêmes pratiques.
https://zonetotalsport.ca/articles/classes-difficiles-partie-3.html
```

</details>

<details open>
<summary><b>X — dimanche 6 déc. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/classes-difficiles-partie-3.jpg)`*

```
Classes difficiles en ÉPS, partie 3 : se relever d'une séance ratée et tenir jusqu'en juin.
Conflits, collaboration avec les parents, observation ciblée, durabilité :
https://zonetotalsport.ca/articles/classes-difficiles-partie-3.html
#ÉPS #viedenseignant
```

</details>


### Semaine 15 — Système d'émulation par dollars en classe

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/systeme-emulation-dollar.html

<details open>
<summary><b>Facebook — mardi 8 déc. 2026, 19:00</b></summary>

*Image : `promo/systeme-emulation-dollar-carre.webp`*

```
La motivation en éducation physique, ça se travaille comme le reste. Un système d'émulation par dollars, bien monté, ça change l'ambiance d'un groupe en quelques semaines.
L'article explique comment le mettre en place sans y passer tes soirées : ce qui mérite un dollar, les niveaux de progression, les défis individuels pis collectifs, pis les récompenses qui fonctionnent vraiment (indice : c'est rarement du matériel).
Tu peux démarrer dès lundi matin.
T'as déjà essayé un système de points ? Ça a tenu combien de temps ?
👉 https://zonetotalsport.ca/articles/systeme-emulation-dollar.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 10 déc. 2026, 07:30</b></summary>

*Image : `promo/systeme-emulation-dollar-carre.webp`*

```
Le manque de motivation en éducation physique est un phénomène courant, et souvent mal traité : on ajoute de la compétition là où il faudrait de la progression visible.
Cet article détaille la mise en place d'un système d'émulation par dollars à l'échelle d'un groupe : critères d'attribution liés à la participation, à l'effort et à l'attitude, système de niveaux pour rendre la progression individuelle lisible, et défis collectifs pour éviter que le dispositif ne devienne purement individualiste.
Le volet économie de classe (coupons, échanges, récompenses) est décrit avec assez de précision pour être implanté sans phase pilote.
https://zonetotalsport.ca/articles/systeme-emulation-dollar.html
```

</details>

<details open>
<summary><b>X — dimanche 13 déc. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/systeme-emulation-dollar.png)`*

```
Un système d'émulation par dollars en ÉPS : ce qui mérite un dollar, les niveaux, les défis collectifs et les récompenses qui fonctionnent vraiment.
Prêt à démarrer lundi matin :
https://zonetotalsport.ca/articles/systeme-emulation-dollar.html
#ÉPS #motivation
```

</details>


### Semaine 16 — Nawatobi : corde à sauter japonaise en gymnase

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/nawatobi.html

<details open>
<summary><b>Facebook — mardi 15 déc. 2026, 19:00</b></summary>

*Image : `promo/nawatobi-carre.webp`*

```
Une corde à sauter, un tremplin, pis des noms de mouvements en japonais : le nawatobi, c'est le genre d'activité qui fait taire un gymnase au complet.
Arrivé au Québec au début des années 90, ça combine technique, rythme pis travail d'équipe — pis ça impressionne autant les élèves que les parents lors des présentations.
L'article couvre les bases techniques, les formations, la sécurité pis une progression pensée pour le primaire.
Tu l'as déjà essayé avec tes groupes ?
👉 https://zonetotalsport.ca/articles/nawatobi.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 17 déc. 2026, 07:30</b></summary>

*Image : `promo/nawatobi-carre.webp`*

```
Le nawatobi, forme japonaise du saut à la corde pratiquée sur tremplin, a été introduit au Québec au début des années 1990 et reste peu documenté en français.
Cet article en présente les origines, la nomenclature des mouvements par type de rotation, les formations de groupe, les règles de sécurité, ainsi qu'une progression par catégories construite autour de routines de vingt sauts.
C'est une activité intéressante à plusieurs titres en milieu scolaire : faible coût de matériel, forte composante rythmique et coopérative, et rendu spectaculaire lors des présentations de fin d'étape.
https://zonetotalsport.ca/articles/nawatobi.html
```

</details>

<details open>
<summary><b>X — dimanche 20 déc. 2026, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/nawatobi.png)`*

```
Le nawatobi — corde à sauter japonaise sur tremplin — est arrivé au Québec au début des années 90.
Bases techniques, formations, sécurité et progression primaire :
https://zonetotalsport.ca/articles/nawatobi.html
#ÉPS #éducationphysique
```

</details>


### Semaine 17 — Foobaskill : sport hybride soccer-basket en EPS

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/foobaskill.html

<details open>
<summary><b>Facebook — mardi 5 janv. 2027, 19:00</b></summary>

*Image : `promo/foobaskill-carre.webp`*

```
Le petit qui est bon au soccer mais nul au basket. L'autre, c'est l'inverse. Le foobaskill règle ça : un terrain divisé, deux disciplines dans le même match.
Inventé en 2017 par trois profs d'éducation physique suisses, ça mélange soccer et basketball avec un système de pointage qui force la coopération.
L'article donne les règles complètes, la progression, les éducatifs pis les adaptations pour le primaire.
Ça te tenterait de l'essayer avec ton 3e cycle ?
👉 https://zonetotalsport.ca/articles/foobaskill.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 7 janv. 2027, 07:30</b></summary>

*Image : `promo/foobaskill-carre.webp`*

```
Le foobaskill est un sport hybride développé en 2017 par trois enseignants d'éducation physique suisses : le terrain est divisé en deux zones, une par discipline, et les équipes alternent entre soccer et basketball au cours d'un même match.
L'intérêt pédagogique tient au système de pointage, qui rend une équipe forte dans une seule discipline structurellement incapable de gagner seule — ce qui redistribue les rôles au sein du groupe.
L'article couvre les règles, les bénéfices moteurs et cognitifs, une progression d'apprentissage et les adaptations nécessaires au primaire.
https://zonetotalsport.ca/articles/foobaskill.html
```

</details>

<details open>
<summary><b>X — dimanche 10 janv. 2027, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/foobaskill.png)`*

```
Le foobaskill : soccer et basketball dans le même match, terrain divisé, pointage qui force la coopération. Inventé en 2017 par trois profs d'ÉPS suisses.
Règles, progression, éducatifs, adaptations primaire :
https://zonetotalsport.ca/articles/foobaskill.html
#ÉPS #sportscolaire
```

</details>


### Semaine 18 — Émulation par dollars à l'échelle de l'école

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/systeme-emulation-dollars-ecole.html

<details open>
<summary><b>Facebook — mardi 12 janv. 2027, 19:00</b></summary>

*Image : `promo/systeme-emulation-dollars-ecole-carre.webp`*

```
Quand le système d'émulation fonctionne dans ta classe, la question suivante arrive vite : est-ce qu'on l'étend à l'école au complet ?
L'article couvre le déploiement à grande échelle : comment coordonner plusieurs profs sans que ça devienne un cauchemar administratif, comment fonctionne la semaine des achats d'activités, pis pourquoi il ne faut surtout pas mettre de limite quotidienne.
La suite logique du modèle classe.
Ça existe-tu déjà, un système comme ça, dans ton école ?
👉 https://zonetotalsport.ca/articles/systeme-emulation-dollars-ecole.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 14 janv. 2027, 07:30</b></summary>

*Image : `promo/systeme-emulation-dollars-ecole-carre.webp`*

```
Passer d'un système d'émulation de classe à un dispositif à l'échelle de l'école change la nature du projet : ce n'est plus une pratique pédagogique individuelle, c'est un chantier d'équipe-école.
Cet article traite des conditions de réussite du déploiement : critères d'attribution partagés entre les enseignants, absence de plafond quotidien pour soutenir la persévérance, et organisation de la « semaine des achats d'activités » — compilation, allocation, planification logistique.
Il précise également le rôle attendu de chaque enseignant dans l'observation et le suivi, qui est la principale cause d'essoufflement des systèmes de ce type après quelques mois.
https://zonetotalsport.ca/articles/systeme-emulation-dollars-ecole.html
```

</details>

<details open>
<summary><b>X — dimanche 17 janv. 2027, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/systeme-emulation-dollars-ecole.jpg)`*

```
Étendre un système d'émulation par dollars à l'école entière : coordination entre profs, semaine des achats d'activités, durabilité.
La suite logique du modèle classe :
https://zonetotalsport.ca/articles/systeme-emulation-dollars-ecole.html
#ÉPS #équipeécole
```

</details>


### Semaine 19 — SAÉ course primaire : situation prête à utiliser

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/sae-course.html

<details open>
<summary><b>Facebook — mardi 19 janv. 2027, 19:00</b></summary>

*Image : `promo/sae-course-carre.webp`*

```
Une SAÉ sur la course, complète, prête à utiliser : 8 cours, objectifs différenciés par année, fiche élève incluse, critères alignés sur le PFEQ.
Pas besoin de la réécrire — juste de l'imprimer pis de l'adapter à ton contexte. On explique aussi comment garder la motivation quand on travaille la course sur plusieurs semaines (le vrai défi).
Tu la travailles comment, toi, la course, en début d'année ?
👉 https://zonetotalsport.ca/articles/sae-course.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 21 janv. 2027, 07:30</b></summary>

*Image : `promo/sae-course-carre.webp`*

```
Une situation d'apprentissage et d'évaluation complète sur la course au primaire, structurée en huit cours, avec des objectifs différenciés selon le niveau et une fiche élève prête à imprimer.
Les critères d'évaluation sont alignés sur le Programme de formation de l'école québécoise, ce qui permet de l'intégrer directement à une planification annuelle plutôt que de la traiter comme une activité isolée.
L'article traite aussi d'un enjeu rarement abordé dans les SAÉ publiées : le maintien de la motivation quand la même compétence motrice est travaillée sur plusieurs semaines consécutives.
https://zonetotalsport.ca/articles/sae-course.html
```

</details>

<details open>
<summary><b>X — dimanche 24 janv. 2027, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/sae-course.jpg)`*

```
Une SAÉ sur la course prête à utiliser : 8 cours, objectifs différenciés par année, fiche élève incluse, critères alignés sur le PFEQ.
https://zonetotalsport.ca/articles/sae-course.html
#ÉPS #SAÉ #PFEQ
```

</details>


### Semaine 20 — Les comptes rendus de rencontre sans y passer ta soirée

**Univers :** ÉPS + service de garde · **Lien :** https://zonetotalsport.ca/articles/comptes-rendus-rencontres.html

<details open>
<summary><b>Facebook — mardi 26 janv. 2027, 19:00</b></summary>

*Image : `promo/comptes-rendus-rencontres-carre.webp`*

```
Comité, rencontre statutaire, rencontre de parents. Tu prends des notes, pis tu passes ta soirée à les remettre au propre. Chaque fois.
L'article montre trois façons de capturer une rencontre selon son type — écrire, parler, ou déposer l'enregistrement — pis comment le compte rendu s'écrit ensuite, décisions et actions comprises. Avec une vue « Mes actions » pour ne plus rien échapper d'une rencontre à l'autre.
Tes comptes rendus, tu les fais quand, honnêtement ? Le soir même ou trois jours plus tard ?
👉 https://zonetotalsport.ca/articles/comptes-rendus-rencontres.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 28 janv. 2027, 07:30</b></summary>

*Image : `promo/comptes-rendus-rencontres-carre.webp`*

```
Le compte rendu de rencontre est une tâche à faible valeur perçue et à coût réel élevé : elle est presque toujours reportée, puis exécutée de mémoire, plusieurs jours après la rencontre.
Cet article propose trois modes de capture selon le type de rencontre — prise de notes, dictée, dépôt d'un enregistrement — et distingue deux formats de sortie : la transcription mot à mot et le compte rendu structuré, qui ne servent pas les mêmes usages.
La partie la plus utile concerne le suivi : une vue transversale des actions engagées, qui permet de reprendre un dossier d'une rencontre à l'autre sans relire l'ensemble des documents.
https://zonetotalsport.ca/articles/comptes-rendus-rencontres.html
```

</details>

<details open>
<summary><b>X — dimanche 31 janv. 2027, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/comptes-rendus-rencontres.jpg)`*

```
Comité, statutaire, rencontre de parents : capturer la rencontre en écrivant, en parlant ou en déposant l'enregistrement — le compte rendu s'écrit ensuite, décisions et actions comprises.
https://zonetotalsport.ca/articles/comptes-rendus-rencontres.html
#éducation #productivité
```

</details>


### Semaine 21 — Bienfaits du sport pour les enfants : guide EPS

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/bienfaits-sport-enfants.html

<details open>
<summary><b>Facebook — mardi 2 févr. 2027, 19:00</b></summary>

*Image : `promo/bienfaits-sport-enfants-carre.webp`*

```
Quand un parent ou une direction te demande « à quoi ça sert vraiment, l'éducation physique ? », ça peut être utile d'avoir les arguments à portée de main.
On a rassemblé sur une seule page les bienfaits du sport chez les enfants du primaire : santé physique, santé mentale, confiance en soi, développement social. Avec des données, pas juste des impressions.
Près d'un enfant sur quatre est en surpoids ou obèse — ça met la conversation en perspective.
Tu utilises quoi comme argument quand on coupe dans tes périodes ?
👉 https://zonetotalsport.ca/articles/bienfaits-sport-enfants.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 4 févr. 2027, 07:30</b></summary>

*Image : `promo/bienfaits-sport-enfants-carre.webp`*

```
Les enseignants d'éducation physique doivent régulièrement justifier la valeur de leur discipline — devant une direction, un conseil d'établissement, ou des parents.
Cet article rassemble en une page les effets documentés de l'activité physique chez les enfants du primaire : bénéfices sur la santé physique et la prévention, réduction du stress et de l'anxiété, développement de la confiance en soi, et acquisition de compétences sociales.
Les repères de fréquence hebdomadaire y sont précisés, ce qui en fait un document utilisable tel quel en appui à une demande de ressources ou de temps d'enseignement.
https://zonetotalsport.ca/articles/bienfaits-sport-enfants.html
```

</details>

<details open>
<summary><b>X — dimanche 7 févr. 2027, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/bienfaits-sport-enfants.jpg)`*

```
« Près d'un enfant sur quatre est en surpoids ou obèse. »
Les bienfaits du sport au primaire — santé physique, mentale, émotionnelle, sociale — rassemblés sur une page :
https://zonetotalsport.ca/articles/bienfaits-sport-enfants.html
#ÉPS #santédesjeunes
```

</details>


### Semaine 22 — Color Run à l'école : guide complet d'organisation

**Univers :** camp de jour + ÉPS · **Lien :** https://zonetotalsport.ca/articles/color-run.html

<details open>
<summary><b>Facebook — mardi 9 févr. 2027, 19:00</b></summary>

*Image : `promo/color-run-carre.webp`*

```
Imagine 1000 élèves habillés en blanc qui virent arc-en-ciel en 45 minutes. C'est l'événement dont on parle encore en juin.
Sauf qu'une Color Run, ça se prépare 4 à 6 mois d'avance : budget, parcours, sécurité, poudre, stations, bénévoles. On a mis tout ça dans un guide complet, étape par étape, avec les affaires auxquelles personne ne pense la première fois.
Ton école ou ton camp en a déjà fait une ? Raconte comment ça s'est passé.
👉 https://zonetotalsport.ca/articles/color-run.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 11 févr. 2027, 07:30</b></summary>

*Image : `promo/color-run-carre.webp`*

```
Une Color Run réussie ressemble à une fête spontanée. Elle est en réalité le résultat de quatre à six mois de planification : budget, choix de date, tracé du parcours, protocole de sécurité, approvisionnement en poudre, recrutement et briefing des bénévoles.
Ce guide décompose l'événement en étapes ordonnées, avec les points de friction que l'on découvre généralement à la première édition : gestion des vents dominants aux stations de couleur, circulation des groupes, nettoyage, et communication aux parents.
Applicable en milieu scolaire comme en camp de jour, pour une centaine de participants comme pour un millier.
https://zonetotalsport.ca/articles/color-run.html
```

</details>

<details open>
<summary><b>X — dimanche 14 févr. 2027, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/color-run.jpg)`*

```
1000 élèves en blanc qui deviennent arc-en-ciel : la Color Run, ça se prépare 4 à 6 mois d'avance.
Guide complet — budget, parcours, sécurité, stations, bénévoles :
https://zonetotalsport.ca/articles/color-run.html
#campdejour #événementscolaire
```

</details>


### Semaine 23 — 20 grands jeux extérieurs pour camp de jour

**Univers :** camp de jour · **Lien :** https://zonetotalsport.ca/articles/grands-jeux-exterieurs-camp-de-jour.html

<details open>
<summary><b>Facebook — mardi 16 févr. 2027, 19:00</b></summary>

*Image : `promo/grands-jeux-exterieurs-camp-de-jour-carre.webp`*

```
Fin d'après-midi, 30 degrés, un groupe qui commence à s'étioler dans le gazon. Faut sortir un gros jeu, pis vite.
On a monté 20 grands jeux extérieurs clé en main pour les camps de jour : poursuites, jeux d'eau pour la canicule, jeux coopératifs, pis des grands jeux thématiques classés par groupe d'âge.
Tout est gratuit, pas de compte à créer, juste à lire pis à sortir dehors.
Ton grand jeu qui marche à tous les coups, c'est lequel ?
👉 https://zonetotalsport.ca/articles/grands-jeux-exterieurs-camp-de-jour.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 18 févr. 2027, 07:30</b></summary>

*Image : `promo/grands-jeux-exterieurs-camp-de-jour-carre.webp`*

```
Un groupe qui s'ennuie devient, en quelques minutes, un groupe difficile à animer. C'est vrai en camp de jour plus qu'ailleurs, parce que la journée est longue et l'espace, ouvert.
Cet article rassemble 20 grands jeux extérieurs prêts à animer, organisés par intention : brûler de l'énergie, rafraîchir un groupe en canicule, souder une équipe en début de semaine, ou marquer une fin de session.
Chaque jeu est présenté avec son groupe d'âge cible et le matériel réellement nécessaire — rien qui demande un budget d'achat.
Une ressource utile pour les coordonnateurs qui préparent la banque d'activités de leur équipe d'animation.
https://zonetotalsport.ca/articles/grands-jeux-exterieurs-camp-de-jour.html
```

</details>

<details open>
<summary><b>X — dimanche 21 févr. 2027, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/grands-jeux-exterieurs-camp-de-jour.jpg)`*

```
20 grands jeux extérieurs clé en main pour ton camp de jour : poursuite, eau, coopération, grands jeux thématiques, classés par âge.
Gratuit :
https://zonetotalsport.ca/articles/grands-jeux-exterieurs-camp-de-jour.html
#campdejour #animation
```

</details>


### Semaine 24 — Harcèlement envers les enseignants : agir

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/harcelement-enseignants.html

<details open>
<summary><b>Facebook — mardi 23 févr. 2027, 19:00</b></summary>

*Image : `promo/harcelement-enseignants-carre.webp`*

```
On parle beaucoup d'intimidation entre élèves. Beaucoup moins de ce que vivent certains enseignants — de la part de collègues, de parents, parfois de la direction.
L'article aide à reconnaître les signes du harcèlement psychologique en milieu scolaire, explique quoi documenter, à qui s'adresser, et quels recours existent réellement.
Personne ne devrait avoir à gérer ça tout seul.
Est-ce qu'on en parle assez, dans nos écoles ? Si le sujet te concerne ou concerne quelqu'un autour de toi, ça vaut la lecture.
👉 https://zonetotalsport.ca/articles/harcelement-enseignants.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 25 févr. 2027, 07:30</b></summary>

*Image : `promo/harcelement-enseignants-carre.webp`*

```
Le harcèlement psychologique en milieu scolaire est bien documenté lorsqu'il touche les élèves, beaucoup moins lorsqu'il vise le personnel enseignant.
Cet article définit ce que recouvre le harcèlement psychologique au travail dans le contexte scolaire, décrit ses manifestations et ses effets sur la santé, puis détaille les démarches concrètes : documentation des faits, signalement interne, recours externes disponibles.
Il aborde également le rôle des politiques d'établissement dans la prévention.
Une ressource à connaître, et à transmettre à une personne qui en aurait besoin.
https://zonetotalsport.ca/articles/harcelement-enseignants.html
```

</details>

<details open>
<summary><b>X — dimanche 28 févr. 2027, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/harcelement-enseignants.jpg)`*

```
Harcèlement psychologique envers les enseignants : reconnaître les signes, documenter, savoir à qui s'adresser et quels recours existent.
Un sujet dont on parle trop peu :
https://zonetotalsport.ca/articles/harcelement-enseignants.html
#éducation #santéautravail
```

</details>


### Semaine 25 — Suppléance en école : guide pratique terrain

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/suppleance-ecoles.html

<details open>
<summary><b>Facebook — mardi 2 mars 2027, 19:00</b></summary>

*Image : `promo/suppleance-ecoles-carre.webp`*

```
Arriver dans une école que tu ne connais pas, avec six groupes différents dans la journée pis un plan de cours écrit à la main sur un post-it. Bienvenue en suppléance.
L'article rassemble ce qui fait la différence : quoi préparer avant d'arriver, comment accueillir un groupe qui va te tester dans les 90 premières secondes, comment gérer les comportements sans historique, pis quoi laisser comme compte rendu à la fin.
Du concret pour ceux qui commencent — pis des rappels pour les autres.
Ta pire journée de suppléance, elle ressemblait à quoi ?
👉 https://zonetotalsport.ca/articles/suppleance-ecoles.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 4 mars 2027, 07:30</b></summary>

*Image : `promo/suppleance-ecoles-carre.webp`*

```
La suppléance concentre en une journée toutes les difficultés du métier : groupe inconnu, absence d'historique relationnel, planification incomplète, et un test systématique de la part des élèves dans les premières minutes.
Ce guide couvre le cycle complet : activation du dossier auprès d'un centre de services scolaire, préparation avant l'arrivée, accueil et installation du climat, gestion des comportements sans connaissance préalable du groupe, et rédaction d'un compte rendu utile à l'enseignant titulaire.
Utile aux personnes qui débutent en suppléance, et aux écoles qui souhaitent mieux les accueillir.
https://zonetotalsport.ca/articles/suppleance-ecoles.html
```

</details>

<details open>
<summary><b>X — dimanche 7 mars 2027, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/suppleance-ecoles.png)`*

```
Six groupes inconnus dans la même journée, un plan écrit sur un post-it : le guide pratique de la suppléance au primaire.
Préparation, accueil, gestion sans historique, compte rendu :
https://zonetotalsport.ca/articles/suppleance-ecoles.html
#suppléance #éducation
```

</details>


### Semaine 26 — Inventaire du matériel sportif : la méthode éclair

**Univers :** service de garde + ÉPS + camp de jour · **Lien :** https://zonetotalsport.ca/articles/inventaire-materiel-sans-effort.html

<details open>
<summary><b>Facebook — mardi 9 mars 2027, 19:00</b></summary>

*Image : `promo/inventaire-materiel-sans-effort-carre.webp`*

```
L'inventaire du matériel, c'est l'affaire qu'on repousse jusqu'à ce qu'on la fasse un samedi, dans un local poussiéreux, en sacrant.
On propose une autre méthode : 4 piliers (tri radical, zonage visuel, micro-inventaires rotatifs, numérisation), 9 solutions adaptées au gymnase, au service de garde pis au camp, avec un plan de 7 jours pour tout démarrer.
Un objet sans adresse est un objet en sursis — c'est pas mal ça, l'idée.
Ton local à matériel, il ressemble à quoi honnêtement en ce moment ?
👉 https://zonetotalsport.ca/articles/inventaire-materiel-sans-effort.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 11 mars 2027, 07:30</b></summary>

*Image : `promo/inventaire-materiel-sans-effort-carre.webp`*

```
L'inventaire du matériel est une tâche invisible : jamais planifiée, jamais rémunérée, et pourtant refaite chaque année dans l'urgence de juin.
Cet article propose de sortir de la logique du grand tableau annuel — statique, obsolète en deux semaines — au profit de quatre piliers : tri radical, zonage visuel du local, micro-inventaires rotatifs et numérisation légère.
Neuf solutions concrètes sont déclinées par milieu (gymnase scolaire, service de garde, camp de jour), suivies d'un plan d'implantation étalé sur sept jours.
Pertinent pour les techniciennes et responsables de service de garde qui gèrent un local partagé entre plusieurs équipes.
https://zonetotalsport.ca/articles/inventaire-materiel-sans-effort.html
```

</details>

<details open>
<summary><b>X — dimanche 14 mars 2027, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/inventaire-materiel-sans-effort.jpg)`*

```
« Un objet sans adresse est un objet en sursis. »
4 piliers, 9 solutions terrain et un plan de 7 jours pour faire l'inventaire du matériel sans y perdre tes fins de semaine :
https://zonetotalsport.ca/articles/inventaire-materiel-sans-effort.html
#servicedegarde #ÉPS
```

</details>


### Semaine 27 — Préparer l'année scolaire en EPS : checklist d'été

**Univers :** ÉPS · **Lien :** https://zonetotalsport.ca/articles/avance-annee-scolaire.html

<details open>
<summary><b>Facebook — mardi 16 mars 2027, 19:00</b></summary>

*Image : `promo/avance-annee-scolaire-carre.webp`*

```
Juin arrive, pis avec lui la tentation de tout fermer pis de partir. Sauf que deux ou trois heures investies maintenant, c'est une rentrée pas mal plus douce en août.
L'article propose une checklist d'été : revoir la planification annuelle, préparer les documents du parascolaire, faire l'inventaire pis passer les commandes pendant qu'il reste du budget, pis faire un vrai bilan de l'année.
Rien d'héroïque — juste les affaires qui coûtent trois fois plus cher à faire en août.
Tu en fais-tu, toi, de la préparation d'été ? Ou tu débranches complètement ?
👉 https://zonetotalsport.ca/articles/avance-annee-scolaire.html
```

</details>

<details open>
<summary><b>LinkedIn — jeudi 18 mars 2027, 07:30</b></summary>

*Image : `promo/avance-annee-scolaire-carre.webp`*

```
La fin d'année scolaire est le moment le moins coûteux pour préparer la suivante : le contexte est encore frais, le matériel est sous les yeux, et les budgets ne sont pas tous fermés.
Cette checklist d'été couvre quatre chantiers : révision de la planification annuelle à la lumière de ce qui a réellement fonctionné, préparation administrative du parascolaire et des tournois, inventaire du matériel avec commandes budgétisées, et bilan professionnel personnel.
Une planification structurée reste la colonne vertébrale d'un programme d'éducation physique cohérent — et elle se construit mieux en juin qu'à la mi-août.
https://zonetotalsport.ca/articles/avance-annee-scolaire.html
```

</details>

<details open>
<summary><b>X — dimanche 21 mars 2027, 10:00</b></summary>

*Image : `carte OG automatique (https://zonetotalsport.ca/articles/images/heroes/avance-annee-scolaire.jpg)`*

```
Deux ou trois heures en juin = une rentrée pas mal plus douce en août.
Checklist d'été pour l'ÉPS : planification annuelle, parascolaire, inventaire, commandes avant la fin du budget :
https://zonetotalsport.ca/articles/avance-annee-scolaire.html
#ÉPS #planification
```

</details>


---

## 4. VOLET 2 — Images promo dédiées

**Livrables joints :**

- `_data/prompts-promo-social.json` — **32 prompts** : 27 carrés 1080×1080 (un par article) + 5 stories 1080×1920
  pour les articles prioritaires seulement.
- `scripts/gen-images-promo.mjs` — script de génération **idempotent** : il saute ce qui existe déjà, produit
  **une seule image puis s'arrête** pour que tu valides le style, et ne fait le lot qu'au second appel.

**Style imposé dans chaque prompt**, cohérent avec la série de l'article inventaire : photographie documentaire
réaliste, lumière naturelle, faible profondeur de champ. **Aucun texte, aucun logo, aucune mascotte, aucun rendu
cartoon ou 3D** — le texte vit dans le post, pas dans l'image. Enfants de dos ou de trois quarts, jamais de visage
net au premier plan. Diversité réaliste des origines, des morphologies et des habiletés. Chaque prompt porte aussi
un `negative_prompt` explicite.

**Nommage :** `promo/<slug>-carre.webp` et `promo/<slug>-story.webp`. Le script refuse tout nom hors de ce patron.

**Ordre de génération :**

- **Lot 1 (9 images carrées + 5 stories) :** les 3 appâts SEO — `faire-bouger-enfants`,
  `comportements-perturbateurs`, `catastrophes-ordinaires` — plus les deux meilleurs par univers :
  `grands-jeux-exterieurs-camp-de-jour` et `courbe-plaisir-jeu` (camp), `un-jeu-trois-versions` et
  `inventaire-materiel-sans-effort` (service de garde), `50-jeunes-un-gymnase` et `jeux-course-1er-cycle` (ÉPS).
- **Lot 2 :** les 18 restantes, **après la lecture des premières métriques** — inutile de brûler du quota sur des
  articles dont on ne sait pas encore s'ils convertissent.

**Marche à suivre, en local (le sandbox ne joint pas l'API Gemini) :**

```bash
# à la racine du dépôt wix-deploy
export GEMINI_API_KEY=…
node scripts/gen-images-promo.mjs --seches     # affiche le plan sans rien appeler
node scripts/gen-images-promo.mjs              # 1 image, puis arrêt volontaire
# … tu valides promo/faire-bouger-enfants-carre.webp …
node scripts/gen-images-promo.mjs --lot1       # le lot prioritaire
node scripts/gen-images-promo.mjs --tout       # le reste, plus tard
```

En attendant que les images existent, **les cartes OG des articles font le travail** : les 27 sont en place,
≥ 1200×630, avec titre et teaser. Les colonnes « image » du calendrier indiquent `promo/…` pour Facebook et
LinkedIn (où l'image téléversée bat toujours la carte OG) et « carte OG automatique » pour X, où le lien génère
lui-même sa carte.

---

## 5. QA de livraison

Rapport du contrôle automatisé passé sur les 81 posts (script `build.py`, rejouable) :

| Contrôle | Résultat |
|---|---|
| Les 27 articles ont bien leurs 3 posts | ✅ 81/81 |
| Lien présent et exact dans chaque post | ✅ 81/81 |
| Un seul lien par post (pas de lien parasite) | ✅ 81/81 |
| Longueur X ≤ 280 caractères (règle t.co, liens comptés 23) | ✅ max **253** / 280 |
| Longueur X ≤ 280 en littéral (pire cas, sans t.co) | ✅ max **280** / 280 |
| Facebook : question d'accroche présente | ✅ 27/27 |
| Facebook : 3-5 phrases | ✅ 27/27 |
| LinkedIn : 4-6 phrases | ✅ 27/27 |
| X : 2-3 hashtags | ✅ 27/27 |
| Aucun hashtag sur Facebook ni LinkedIn | ✅ (choix assumé : ils y nuisent à la portée) |
| Chemins d'images conformes au patron `promo/<slug>-carre.webp` | ✅ 54/54 |
| URL des 27 articles en HTTP 200 | ✅ 27/27 (relevé en prod le 28 août) |
| Doubles espaces / coquilles de frappe | ✅ 0 |
| Orthographe et accents FR (é, è, ç, œ, apostrophes) | ✅ relu, tutoiement québécois cohérent |

**Bloquants : 0 · Majeurs : 0 · Mineurs : 0 · Cosmétiques : 0 — verdict : prêt à publier.**

**Cohérence des hashtags.** Un vocabulaire volontairement resserré, pour que les posts de ZTS forment une série
reconnaissable plutôt qu'un nuage : `#ÉPS` (22 posts, le marqueur maison), `#campdejour` et `#servicedegarde` (les
deux autres univers), `#gestiondeclasse`, `#inclusion`, `#éducationphysique`, `#animation`, `#santéautravail`, plus
une poignée de hashtags de circonstance (`#SAÉ`, `#PFEQ`, `#rentréescolaire`, `#suppléance`…). Jamais plus de trois
par post.

**Limites de cet audit, dites franchement :** je n'ai pas pu vérifier le rendu réel des cartes de partage dans le
débogueur de Facebook ni dans le validateur de X (les deux exigent une session connectée) — seulement que les
balises OG et Twitter sont présentes et bien formées côté HTML. Fais passer les trois appâts SEO dans
`developers.facebook.com/tools/debug` avant le premier post : ça force aussi le rafraîchissement du cache de
Facebook, qui garde parfois une vieille version de la carte pendant des semaines.

---

## Annexe — Cartographie des communautés Facebook

> **Avertissement de méthode.** Tout ce tableau vient de la recherche web publique. Facebook bloque la lecture automatisée de ses pages : **aucun nombre de membres ni aucune règle de groupe n'a pu être vérifié**. Les colonnes « Taille » et « Règles » sont donc à remplir par toi, connecté à ton compte, avant le premier partage. Les entrées marquées *à vérifier* n'ont pas pu être confirmées par une source — ne les approche pas avant de les avoir vues de tes yeux.

### Univers 1 — Enseignants d'éducation physique (ÉPS)

| # | Nom | Type | Lien | Pays | Potentiel | Pourquoi |
|---|-----|------|------|------|-----------|----------|
| 1 | Communauté FÉÉPEQ | Groupe | https://www.facebook.com/groups/feepeq/ | QC | ⭐⭐⭐ | Groupe de la fédération québécoise des profs d'ÉPS — cœur de cible exact |
| 2 | ÉPS : JE partage, TU partages, on s'ENTRAIDE ! (SAÉs & +) | Groupe | https://www.facebook.com/groups/1416245518617186/ | QC | ⭐⭐⭐ | Le partage de ressources EST la raison d'être du groupe |
| 3 | EPS Mania | Groupe | https://www.facebook.com/groups/epsmania/ | FR | ⭐⭐⭐ | Collectif EPS français de référence (site + page + compte X actifs) |
| 4 | FÉÉPEQ (page officielle) | Page | https://www.facebook.com/FEEPEQ/ | QC | ⭐⭐⭐ | Visibilité institutionnelle; viser une mention plutôt qu'un post |
| 5 | La Prof d'Éduc | Page | https://www.facebook.com/laprofdeduc/ | QC | ⭐⭐⭐ | Créatrice de contenu ÉPS très suivie — cible de partenariat, pas de spam |
| 6 | Les TIC en ÉPS | Groupe | https://www.facebook.com/groups/ticeneps/ | QC | ⭐⭐ | Outils numériques en ÉPS — parfait pour les articles « apps » et inventaire |
| 7 | AEEPS (national) | Page | https://www.facebook.com/p/AEEPS-100064564634996/ | FR | ⭐⭐ | Association professionnelle EPS de référence en France |
| 8 | AEEPS Rennes | Page | https://www.facebook.com/aeeps35/ | FR | ⭐⭐ | Relais régional AEEPS |
| 9 | AEEPS Amiens | Page | https://www.facebook.com/aeepsamiens/ | FR | ⭐⭐ | Relais régional AEEPS |
| 10 | AEEPS Poitiers | Page | https://www.facebook.com/p/AEEPS-Poitiers-100063458379196/ | FR | ⭐⭐ | Relais régional AEEPS |
| 11 | Grand Défi Pierre Lavoie | Page | https://www.facebook.com/LeGDPL/ | QC | ⭐⭐ | Audience large mais forte densité de profs d'ÉPS engagés |
| 12 | Éditions EP&S (Revue EP&S) | Page | https://www.facebook.com/EditionsEPS/ | FR | ⭐⭐ | Lectorat exactement dans la cible, logique éditoriale — partenariat |
| 13 | PHE Canada / EPS Canada | Page | https://www.facebook.com/PHECanada/ | CA | ⭐⭐ | Pancanadien bilingue, portée plus large |
| 14 | FÉÉPEQ-Estrie | Page | https://www.facebook.com/feepeqestrie/ | QC | ⭐ | Antenne régionale, audience restreinte |
| 15 | RSEQ (page nationale) | Page | https://www.facebook.com/RSEQ1/ | QC | ⭐ | Orienté sport étudiant compétitif, pas pédagogie de classe — utile en visibilité seulement. Pages régionales : [Montréal](https://www.facebook.com/RSEQMtl/), [Montérégie](https://www.facebook.com/RseqMonteregie/), [Outaouais](https://www.facebook.com/RseqOutaouais/), [Mauricie](https://www.facebook.com/rseqmauricie/), [Saguenay–Lac-St-Jean](https://www.facebook.com/rseqsaglac/), [Est-du-Québec](https://www.facebook.com/RSEQEstDuQuebecviesaine/), [Côte-Nord](https://www.facebook.com/rseqcn/), [Chaudière-Appalaches](https://www.facebook.com/RSEQQCA/) |
| 16 | EP&Santé Belgique — Groupe de partage des enseignants en ÉP | Groupe | https://www.facebook.com/groups/collectif.eps.impact/ | BE *(à vérifier)* | ⭐ | Le pays affiché par Google est incohérent d'une requête à l'autre — vérifier avant d'y entrer |

*Non trouvé :* aucune communauté Facebook d'enseignants d'ÉPS spécifique à la **Suisse romande** n'a pu être confirmée (associations présentes uniquement sur leur site web).

### Univers 2 — Camps de jour (animateurs, coordonnateurs, loisir municipal)

| # | Nom | Type | Lien | Pays | Potentiel | Pourquoi |
|---|-----|------|------|------|-----------|----------|
| 1 | Association des camps du Québec (ACQ) | Page | https://www.facebook.com/campsquebec/ | QC | ⭐⭐⭐ | Organisme référent des camps au Québec |
| 2 | Animateurs de camp de jour | Groupe | https://www.facebook.com/groups/543076239088292/ | QC | ⭐⭐⭐ | Échange direct entre animateurs — le meilleur endroit pour une banque de jeux |
| 3 | Le Journal de l'Animation | Page | https://www.facebook.com/JDAnimation/ | FR | ⭐⭐⭐ | Média 100 % animation (BAFA, ACM) — partenaire éditorial potentiel |
| 4 | Le Coin des Animateurs | Page | https://www.facebook.com/lecoindesanimateurs/ | FR | ⭐⭐⭐ | Site quasi jumeau de ZTS — audience identique, à approcher en échange, pas en promo |
| 5 | DAFA — page officielle | Page | https://www.facebook.com/programmeDAFA/ | QC | ⭐⭐⭐ | Touche tous les futurs animateurs certifiés du Québec |
| 6 | BAFA/BAFD Animateurs / Directeurs | Groupe | https://www.facebook.com/groups/373264892856568/ | FR | ⭐⭐⭐ | Grand groupe d'entraide, questions de jeux fréquentes |
| 7 | Conseil québécois du loisir (CQL) | Page | https://www.facebook.com/ConseilQuebecoisduLoisir/ | QC | ⭐⭐ | Fédère loisir municipal, camps et DAFA |
| 8 | Association québécoise du loisir municipal (AQLM) | Page | https://www.facebook.com/aqml.net/ | QC | ⭐⭐ | Coordonnateurs et responsables loisirs — décideurs *(URL à confirmer)* |
| 9 | Réseau URLS du Québec | Page | https://www.facebook.com/ReseauURLS/ | QC | ⭐⭐ | Relais institutionnel vers les URLS régionales |
| 10 | Fédération québécoise des centres communautaires de loisir | Page | https://www.facebook.com/fqccl/ | QC | ⭐⭐ | Beaucoup de centres organisent des camps de jour |
| 11 | Association québécoise du loisir public (AQLP) | Page | https://www.facebook.com/aqlp.loisir/ | QC | ⭐⭐ | Loisir public au sens large |
| 12 | AnimyJob.com | Page | https://www.facebook.com/animyjob/ | FR | ⭐⭐ | Publie déjà du contenu « jeux » — partenariat plutôt que partage |
| 13 | Recrutement animateur(rice)/directeur(rice) BAFA/BAFD | Groupe | https://www.facebook.com/groups/794426717277423/ | FR | ⭐ | Surtout des offres d'emploi |
| 14 | Animateurs BAFA Hauts-de-France | Groupe | https://www.facebook.com/groups/animateurs.bafa/ | FR | ⭐ | Actif mais régional |
| 15 | Plaines de jeux gratuites de Belgique | Groupe | https://www.facebook.com/groups/1734822386692588/ | BE *(à vérifier)* | ⭐ | Semble s'adresser aux parents, pas aux animateurs |

*Non trouvé :* aucun groupe québécois dédié spécifiquement aux **coordonnateurs** de camps municipaux, et aucun groupe belge professionnel d'animateurs de plaines confirmé.

### Univers 3 — Services de garde scolaires (et petite enfance en second)

| # | Nom | Type | Lien | Pays | Potentiel | Pourquoi |
|---|-----|------|------|------|-----------|----------|
| 1 | Association québécoise de la garde scolaire (AQGS) | Page | https://www.facebook.com/gardescolaire/ | QC | ⭐⭐⭐ | Association nationale des SDG scolaires — cible exacte |
| 2 | Éducateurs(trices) — service de garde milieu scolaire | Groupe | https://www.facebook.com/groups/44292910604/ | QC | ⭐⭐⭐ | Le groupe d'échange du métier |
| 3 | Association québécoise des CPE (AQCPE) | Page | https://www.facebook.com/aqcpe/ | QC | ⭐⭐ | Petite enfance — pertinent pour les jeux actifs 4-5 ans |
| 4 | BAFA/BAFD Animateurs / Directeurs | Groupe | https://www.facebook.com/groups/373264892856568/ | FR | ⭐⭐ | Couvre aussi le périscolaire 3-17 ans |
| 5 | Réseau Animateurs - Directeurs de colos de CHOC ! | Groupe | https://www.facebook.com/groups/ReseauAnimateurDirecteur/ | FR | ⭐⭐ | Jeux actifs, tranche d'âge proche |
| 6 | Altereducs (accueil extrascolaire ATL) | Page | https://www.facebook.com/altereducs | BE | ⭐⭐ | Organisation-ressource de référence en Belgique francophone |
| 7 | Collectif indépendant des ATSEM de France | Page | https://www.facebook.com/Collectif.ATSEM/ | FR | ⭐⭐ | ATSEM encadrent la pause méridienne — orientation surtout syndicale |
| 8 | Atsem National | Page | https://www.facebook.com/atsemnational/ | FR | ⭐⭐ | Même public que ci-dessus |
| 9 | Regroupement des CPE Québec / Chaudière-Appalaches | Page | https://www.facebook.com/rcpe0312/ | QC | ⭐ | Régional, petite enfance |
| 10 | Animateurs BAFA Hauts-de-France | Groupe | https://www.facebook.com/groups/animateurs.bafa/ | FR | ⭐ | Régional |
| 11 | Le Monde Des Assistantes Maternelles Agréées | Page | https://www.facebook.com/LeMondeDesAssistantesMaternellesAgreees/ | FR | ⭐ | 0-4 ans surtout — hors cible principale |
| 12 | Profs dispos Belgique | Groupe | https://www.facebook.com/groups/1900105506966153/ | BE | ⭐ | Offres de remplacement, pas d'échange pédagogique |

*Écartés volontairement (offres d'emploi ou page d'un seul établissement) :* Éducatrice à l'enfance (offre d'emploi ville de Québec), CPE Allô mon ami, STAGES/ATELIERS POUR ENFANTS BELGIQUE, Job 2026 - Animateurs, Les BAFA de l'ENEP, La Zone Youhou! — Camps de jour.

---

## Stratégie d'approche — ne pas passer pour du spam

**Le principe :** dans un groupe professionnel, un lien posté par un inconnu est de la pub. Le même lien posté par quelqu'un qu'on a déjà vu répondre à trois questions, c'est une ressource. La différence coûte trois semaines.

**Séquence en 4 temps, par groupe :**

1. **Semaines 1-2 — présence silencieuse.** Tu rejoins, tu lis les règles épinglées (c'est là que se trouve la politique de promo), tu observes le rythme et le ton. Zéro publication.
2. **Semaines 2-4 — valeur pure.** Tu réponds à 3-5 questions d'autres membres, en donnant la réponse complète dans le commentaire, **sans lien**. C'est l'étape que tout le monde saute et c'est celle qui fait toute la différence.
3. **Semaine 4+ — premier partage.** Un seul article, celui qui répond exactement à une question déjà posée dans le groupe. Format : le contenu utile résumé en 3-4 lignes dans le post lui-même, le lien en fin de message ou en premier commentaire selon les règles du groupe.
4. **Rythme de croisière — 1 partage par mois maximum par groupe**, jamais deux groupes le même jour avec le même texte (Facebook détecte le copier-coller multi-groupes et réduit la portée).

**Quoi partager où :**

| Univers | Articles à privilégier | Ton |
|---|---|---|
| ÉPS | comportements-perturbateurs, 50-jeunes-un-gymnase, jeux-course-1er-cycle, classes-difficiles (3 parties), respect-eps | Collègue à collègue, tutoiement, vocabulaire du gymnase |
| Camp de jour | grands-jeux-exterieurs-camp-de-jour, courbe-plaisir-jeu, color-run, catastrophes-ordinaires | Direct, court, orienté « demain matin » |
| Service de garde | un-jeu-trois-versions, inventaire-materiel-sans-effort, faire-bouger-enfants, catastrophes-ordinaires | Respectueux du métier, jamais « juste de la garderie » |

**Les 3 appâts SEO (`faire-bouger-enfants`, `comportements-perturbateurs`, `catastrophes-ordinaires`) sont lisibles à 100 % sans compte** — ce sont les seuls à partager dans un groupe où on te reprocherait un mur d'inscription. C'est aussi ce qui doit ouvrir ta relation avec chaque nouveau groupe.

**Les pages ne se traitent pas comme les groupes.** ACQ, AQGS, FÉÉPEQ, Le Journal de l'Animation, Le Coin des Animateurs, La Prof d'Éduc : on n'y publie pas, on leur écrit. Message privé ou courriel, proposition d'échange de contenu ou de mention. Une seule mention par la page de la FÉÉPEQ vaut vingt posts dans un groupe.

**Les cinq erreurs qui te brûlent un groupe :**

- Poster le jour de ton arrivée.
- Le même texte copié-collé dans quatre groupes le même après-midi.
- Un post qui ne contient que le lien et l'image OG.
- Répondre à une question par « j'ai un article là-dessus » sans donner la réponse.
- Ignorer une règle épinglée qui interdit les liens commerciaux — un seul avertissement d'admin et tu perds l'accès pour de bon.

**Mesure :** ajoute un paramètre UTM à chaque lien partagé en groupe (`?utm_source=facebook&utm_medium=groupe&utm_campaign=<slug-du-groupe>`) pour savoir lesquels rapportent des inscriptions et lesquels sont du bruit. Le calendrier ci-dessus utilise les liens nus — ajoute l'UTM au moment de coller dans un groupe, pas sur ta page.


---

## 6. Mode d'emploi

1. **Avant le premier post :** régénérer `sitemap.xml` (4 articles manquants), passer les 3 appâts dans le débogueur
   de partage de Facebook, et générer au moins le lot 1 des images promo.
2. **Chaque semaine :** ouvrir `calendrier-posts-zts.csv` (ou la section 3 ci-dessus), filtrer sur la semaine, coller
   les trois posts aux créneaux indiqués.
3. **Dans les groupes Facebook :** ne jamais coller le post du calendrier tel quel le jour de ton arrivée — suivre la
   séquence en 4 temps de l'annexe, et ajouter l'UTM au lien.
4. **Après 3-4 semaines :** lire les métriques (clics, inscriptions par article), puis décider quels articles méritent
   le lot 2 d'images promo — et, s'il y a un mort au classement, réécrire son post plutôt que son article.

*Fichiers de ce chantier : `calendrier-posts-zts.csv` (1 ligne par post) · `_data/prompts-promo-social.json` ·
`scripts/gen-images-promo.mjs` · le présent fichier maître.*
