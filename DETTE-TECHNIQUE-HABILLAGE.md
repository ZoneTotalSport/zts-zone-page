# Registre de dette technique — chantier habillage shell

Repéré pendant le prescan et la phase 1. **Rien de ceci n'est corrigé** : le
chantier d'habillage est additif, et corriger un de ces points changerait le
comportement ou l'apparence d'une app en production.

Ouvert le 25 juillet 2026. Une ligne par entrée, avec ce qu'elle coûterait.

---

## Signalé par vous à l'addendum

### D1 — `shared/zts.css:83-97` conditionne le fond à la présence de `data-metier`, pas à sa valeur

```css
body[data-metier] { background: transparent; }
body[data-metier]::before { /* photo de gymnase, fixed, inset:0, z-index:-3 */ }
body[data-metier]::after  { /* voile crème, fixed, inset:0, z-index:-2 */ }
```

Conséquence : poser `data-metier` sur une des 20 apps qui n'en ont pas leur
ajoute un fond gymnase et un voile crème. C'est la raison pour laquelle le
sélecteur de métier du shell est en mode `auto` et ne s'affiche que sur les
26 apps qui portent déjà un métier.

**Correctif** : remplacer `body[data-metier]` par
`body[data-metier="ep"], body[data-metier="sdg"], body[data-metier="camp"]`.
**Coût** : nul en apparence — les 26 apps concernées portent toutes une valeur
valide, sauf `studio-jeu` (voir D2). **Risque** : faible, mais à faire hors
habillage pour que la régression, s'il y en a une, soit attribuable.

### D2 — `apps/studio-jeu/index.html` porte `data-metier="eps"`

`shared/zts.css:75-77` ne connaît que `ep`, `sdg`, `camp`. La page perd
silencieusement sa variable `--metier` et retombe sur le cyan par défaut.

**Ce n'est pas une coquille à corriger en passant** : la corriger en `ep`
donnerait à l'app la couleur d'accent qu'elle n'a jamais eue. Changement
d'apparence, donc décision, donc hors habillage.

Interaction avec D1 : si D1 est corrigé sans D2, `studio-jeu` **perd** son
fond gymnase (aujourd'hui actif par la présence de l'attribut). Les deux
doivent être traités ensemble.

---

## Repéré au prescan

### D3 — Deux builds Vite sans source utilisable

| App | Source | État |
|---|---|---|
| `apps/scoreboard/` | `/Users/admin/dev/Remotion 2/scoreboard-basketball/` | source présent, hors dépôt |
| `apps/evaluation/` | **introuvable** | source absent |

Toute modification de leur `index.html` est écrasée au prochain build. Les
deux sont exclues du chantier.

**Prérequis, ticket séparé** : récupérer la source Vite de `apps/evaluation/`
et la remettre au dépôt. Tant que ce n'est pas fait, l'app n'est pas
maintenable — pas seulement inhabillable.

### D4 — `apps/evaluation/index.html:40` force la police sur `*` en `!important`

```css
html { font-size: 23px; }
*, body, button, input, select, textarea, p, span, div, td, th, li, a, label {
  font-family: 'Patrick Hand', cursive !important;
}
```

Rend l'app hermétique à toute typographie extérieure. Combiné à D3, c'est la
raison de son exclusion.

### D5 — Quatre copies de `ZoneTotalSport.ttf` dans le dépôt

`/fonts/`, `apps/jeux/`, `apps/moyens-action/`, `apps/nhl-playoffs/fonts/`.
Le shell utilise la copie racine en chemin absolu. Les trois autres restent en
place — les supprimer casserait les `@font-face` relatifs de ces apps.

**Correctif** : faire pointer les trois apps sur `/fonts/`, puis supprimer.
Trois diffs d'une ligne, mais trois régressions possibles.

### D6 — Sept lettres et cinq signes manquent à `ZoneTotalSport.ttf`

Lettres : `Ù Ÿ Æ Œ ÿ æ œ`. Ponctuation : `’ « » — °`.

Le plus insidieux est `’` (U+2019) : l'apostrophe droite `'` est couverte, la
courbe ne l'est pas, et c'est la courbe que produit la correction automatique
de la plupart des éditeurs. « L'ÉCOLE » passe, « L’ÉCOLE » bascule de police
en plein mot.

**Garde-fou en place** : `_scripts/verifie-glyphes-ztsh.py`, code de sortie 1
s'il trouve un cas dans un `.ztsh-titre`.
**Correctif définitif, hors chantier** : faire dessiner les douze glyphes.
Dépôts mentionnés par Joey : `police-de-caract-re` et `font`.

### D7 — Le « faux plein écran » n'est pas couvert par `:fullscreen`

Le CSS du shell se masque sous `:root:fullscreen`. Certaines apps
(`planificateur` avec `.pv2-tbibtn`, `cours-maternelle` en mode TBI) simulent
le plein écran avec une classe et `position:fixed; inset:0` — le shell
resterait visible par-dessus.

**À vérifier app par app** lors de sa migration, et à traiter par une règle
ciblée si le cas se présente. Non traité en phase 1 faute de cas concret.

### D8 — `shared/zts.js` : `ZTS.setMetier` n'a aucun appelant

API exportée depuis juin 2026, jamais appelée. Le métier est posé
statiquement dans le HTML. Ce n'est pas un bug, mais c'est un écart entre
l'API disponible et l'usage réel, qui a failli faire construire un deuxième
système. Documenté dans `NOTE-SETMETIER-2026-07.md`.

### D9 — `apps/planificateur/semaine-grid.js:562` redéfinit `setMetier` localement

Fonction homonyme, sans lien avec `ZTS.setMetier` : elle agit sur
`root.dataset.metier` et `modal.dataset.metier`, et persiste dans
`localStorage`. Système parallèle qui fonctionne. À ne pas unifier tant que la
question « métier de la page vs métier de l'utilisateur » n'est pas tranchée.

### D10 — Onze apps chargent Tailwind Play CDN en production

`acrosport`, `agenda`, `educatifs`, `evaluation`, `jeux`, `moyens-action`,
`musique`, `omnigroupe`, `sae`, `suppleance`, `transitions`.

`cdn.tailwindcss.com` est explicitement destiné au développement : il compile
le CSS dans le navigateur à chaque chargement et observe le DOM. Coût de
performance réel, et dépendance à un CDN tiers sur les deux apps les plus
visibles du site (`educatifs` 28 liens entrants, `sae` 27).

**Hors habillage.** Signalé parce que le shell injecte du DOM et déclenchera
donc un recalcul sur ces onze apps — à mesurer sur le pilote.

### D11 — `.ztg-out` à `z-index:9998` passe par-dessus le rail

`shared/zts-gate.js:91`, présent sur les 23 apps du gabarit,
`position:fixed; right:12px; bottom:12px`.

**Arbitré : on ne le déplace pas.** C'est un bouton de déconnexion, il a de
bonnes raisons d'être haut. Le rail s'écarte via `--ztsh-rail-garde-bas:96px`.
Consigné ici pour que personne ne « corrige » le rail en montant son z-index.

### D12 — Le focus dans le shell laisse passer les raccourcis à touche unique de l'app

Vérifié au banc d'essai : avec le focus sur un bouton du shell, une frappe
`d`, `f`, `+` ou `Escape` remonte jusqu'à `document`, où l'app l'intercepte.

C'est le comportement voulu — le shell ne vole rien, conformément à
l'arbitrage. Mais la conséquence est réelle sur les apps qui écoutent une
touche unique : `generateur` (`+ − 0 =`), `nba-playoffs` et `nhl-playoffs`
(idem), `tni` (`d e f g m s z`), `studio-jeu` (`c p Delete Backspace flèches`).

Ce n'est pas une régression : ces apps captent déjà ces touches quel que soit
le focus. Mais un utilisateur qui tabule jusqu'au rail puis tape `+` verra
l'app zoomer sans comprendre pourquoi.

**Atténuation déjà en place** : `tni` et `studio-jeu` sont en densité
`projection`, sans chrome. Restent `generateur` et les deux playoffs.
**À observer** lors de leur migration. Si le cas se révèle gênant, la
correction propre est côté app (ignorer la touche quand `document.activeElement`
n'est pas dans l'app) — donc hors chantier d'habillage.

### D13 — Texte blanc sur le rose : 3,87 pour un seuil de 4,5

`.zts-btn--communaute` et `.zts-modal__close` posent du texte blanc sur
`var(--rose)`. Mesuré : 3,51 avec l'ancien `#FF2D87`, 3,87 avec le `#FF0061`
de la maquette.

**Défaut antérieur au chantier, et atténué par lui** — pas introduit. Il reste
sous le seuil WCAG AA pour du texte normal (il passe pour du gros texte, seuil 3).

Les corrections possibles sortent toutes de l'habillage : assombrir le rose
(il cesserait d'être celui de la maquette), passer le texte en encre foncée
(lisible mais moins affirmé), ou grossir le libellé. À trancher avec Joey.

### D14 — Le portillon `zts-gate.js` n'a aucun contournement local

Les 23 apps du gabarit sont bloquées par un mur d'inscription avant tout
affichage, sans paramètre de développement ni exception `localhost`.

Conséquence pour le chantier : rejouer la liste fonctionnelle d'un gabarit
exige un compte réel. Masquer le portillon en JS depuis la console fausse le
test — le portillon fait partie de la composition (z-index 99999, `.ztg-out`
à 9998, `body.overflow:hidden`).

**Non corrigé** : ajouter un contournement local à un fichier de production
serait un risque de sécurité disproportionné pour un confort de test.

### D15 — Cinq apps déclarent `@font-face ZoneTotalSport` sans `size-adjust`

`apps/generateur/`, `apps/moyens-action/`, `apps/nhl-playoffs/`,
`apps/studio-jeu/studio.css`, `apps/jeux/styles.css`.

Le pilote de projection l'a montré en grand : deux `@font-face` de même nom de
famille, l'un avec `size-adjust:50%` et l'autre sans, produisent un rendu au
double de la taille demandée. Le logo du header débordait du cadre.

**Contourné, pas corrigé** : le shell déclare sa famille sous le nom
`ZoneTotalSportZTSH`, qui ne peut entrer en conflit avec aucune. Corriger les
cinq apps demanderait de toucher leurs fichiers — interdit par le contrat.

Le vrai correctif rejoint D5 et le ticket glyphes : une seule copie du TTF,
une seule déclaration, `size-adjust` inclus.

### D16 — Vingt apps sur 46 ne chargent pas `shared/zts.css`

`acrosport`, `agenda`, `colorier`, `cours-maternelle`, `educatifs`,
`evaluation`, `generateur`, `grille`, `jeux`, `moyens-action`, `musique`,
`nba-playoffs`, `nhl-playoffs`, `omnigroupe`, `sae`, `scoreboard`,
`studio-jeu`, `suppleance`, `tni`, `transitions`.

Elles chargent `zts-header.css` et/ou `zts-ultra.css` à la place — soit une
partie seulement du design system.

Conséquence directe sur ce chantier : tout habillage placé dans
`shared/zts.css` n'aurait touché que 26 apps, en laissant de côté les plus
visibles du site. C'est ce qui a fait déplacer l'habillage vers
`assets/ztsh-shell.css`.

**Non corrigé** : uniformiser le chargement demanderait de modifier 20
fichiers d'app. À traiter dans un chantier de consolidation du design system.

### D17 — Deux apps ont leur propre en-tête, hors de portée du shell

44 apps sur 46 portent l'hôte `data-zts-header` : le header est injecté par
`zts.js`, le balisage est identique partout, et le sélecteur `.zts-header` du
shell les couvre toutes.

Deux exceptions, qui sont aussi les deux seules apps sans aucun CSS partagé :

| App | En-tête | Restylable ? |
|---|---|---|
| `studio-jeu` | `<header class="studio-top">` | Oui, en ciblant `.studio-top` |
| `acrosport` | `<header class="…" style="background: radial-gradient(…)">` | **Non** |

`acrosport` porte son dégradé en **style inline**. Aucune règle externe ne peut
le surcharger sans `!important`, et le contrat l'interdit hors du bloc print.

Trois apps — `generateur`, `jeux`, `performances` — ont l'hôte **plus** un
`<header>` interne (`.zts-fiche2-header`, `.header`, `.pf-hero`). Ce sont des
composants de contenu, pas des barres de navigation : aucun doublon.

**Décision requise avant de migrer ces deux apps** : soit on accepte qu'elles
gardent leur en-tête (critère 6 en échec sur deux apps, dont une non
déployée), soit on autorise une exception ciblée. Ni l'un ni l'autre ne se
décide en passant.

### D18 — L'ordre de chargement du shell est une convention, pas une garantie

`assets/ztsh-shell.css` doit venir **après** `shared/zts.css`,
`zts-header.css` et `zts-ultra.css`. Sinon les surcharges perdent la cascade
et l'habillage est partiellement inactif — **sans aucune erreur visible**.

C'est le mode de panne le plus dangereux du chantier : silencieux, et
diagnostiqué comme « le shell ne marche pas » plutôt que comme un ordre de
balises.

**Garde-fou en place** : `_scripts/verifie-habillage.py` vérifie l'ordre, la
paire CSS/JS, l'appel de montage, la présence de l'enveloppe et la taille du
diff. Code de sortie 1 sur tout manquement bloquant. À lancer après chaque
migration et avant tout déploiement.

### D17 bis — `studio-jeu` se règle sans règle ciblée

Vérifié : `.studio-top` n'a **aucun style inline**, contrairement à
`acrosport`. Mieux, elle consomme déjà les tokens du design system —
`var(--metier)`, `var(--ink)`, `var(--font-impact)`, `var(--font-fun)`, 64
occurrences de `--ink` à elle seule.

Comme `studio-jeu` ne charge aucun CSS partagé, ces tokens n'étaient définis
nulle part chez elle : elle tombait sur ses valeurs de repli, dont l'ancien
cyan fluo `#00E5FF`.

Il a suffi d'ajouter **un repli `--metier` dans le `:root` du shell** pour
qu'elle s'harmonise. Aucune règle ciblée sur une classe d'app, aucun sélecteur
propre à `studio-jeu` dans un fichier partagé.

Le repli est dans `:root` et non dans `body.ztsh-on` : `shared/zts.css`
repeint `--metier` via `[data-metier="ep|sdg|camp"]`, plus spécifique, donc la
teinte par métier continue de gagner partout où elle existe.

### D19 — `shared/zts.css` et `shared/zts-header.css` dupliquent tout l'en-tête

Les deux fichiers portent **les mêmes règles d'en-tête, à l'identique** :
`.zts-header`, `.zts-header > *`, `.zts-header__brandwrap`, `.zts-header__brand`,
`.zts-header__nav` et les rotations `nth-child`. Un correctif appliqué à l'un
et pas à l'autre produit un site à deux comportements selon la page, puisque
toutes ne chargent pas les deux fichiers.

C'est ce qui vient d'arriver, en petit : le correctif de `z-index` du menu
utilisateur a dû être écrit **deux fois**, à `zts.css:262` et
`zts-header.css:89`. Rien ne signale la duplication, rien ne la vérifie.

Le piège est le même que D18 — silencieux. Un développeur qui `grep` la règle
la trouve, la corrige à l'endroit trouvé, et repart convaincu d'avoir fini.

**À faire** : décider laquelle des deux est la source de vérité, faire de
l'autre un `@import` ou la retirer des pages qui chargent déjà la première.
Tant que ce n'est pas tranché, toute modification de l'en-tête doit toucher
les deux fichiers, et `_scripts/verifie-habillage.py` gagnerait à comparer les
deux blocs et à échouer s'ils divergent.

### D20 — `apps/performances/app.js:96-101` : popup Google bloqué sur Safari iOS

```js
async function connectDrive() {
  await waitForFirebase();                                   // ← await AVANT le popup
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope(DRIVE_SCOPE);
  const result = await firebase.auth().signInWithPopup(provider);
```

Safari iOS n'autorise `window.open` que si l'appel est **synchrone dans le geste
utilisateur**. Le `await waitForFirebase()` rend la main à la boucle
d'événements : au moment du `signInWithPopup`, le geste a expiré et le popup est
bloqué. Il n'y a **aucun repli redirect** ici, contrairement aux autres sites
d'appel — la connexion Drive échoue simplement, sans message utile.

Deux corrections, indépendantes :
1. faire l'attente **avant** le clic (précharger au montage de la page) et
   garder `signInWithPopup` en première instruction du gestionnaire ;
2. ajouter `provider.setCustomParameters({ prompt: 'select_account' })` — absent
   ici (l.98), alors qu'il est en place sur `firebase-auth.js`,
   `shared/zts-gate.js` et `apps/studio-jeu/admin-gate.js`.

### D21 — `aidons-nous/index.html:456` : `select_account` manquant

Dernier site d'appel Google sans `setCustomParameters({prompt:'select_account'})`.
Sans lui, Google resigne en silence le seul compte ouvert : aucun sélecteur, et
l'utilisateur ne peut pas changer de compte ni constater qu'il s'est reconnecté.
C'est la moitié de la cause du bug « impossible de se déconnecter » corrigé sur
les deux autres portillons.

Inventaire complet au 28 juillet 2026 :

| fichier | `select_account` |
|---|---|
| `shared/zts-gate.js` | oui |
| `firebase-auth.js` | oui |
| `apps/studio-jeu/admin-gate.js` | oui |
| `aidons-nous/index.html` | **non** |
| `apps/performances/app.js` | **non** (voir D20) |
| `index-old.html` | oui — fichier mort |

### D22 — Le filtre `paths` de la CI laisse la racine sans aucun contrôle

`.github/workflows/verifie-habillage.yml` ne se déclenche que sur
`apps/**`, `assets/ztsh-*`, `shared/**` et `_scripts/verifie-*`.

Un commit qui ne touche que la racine — `firebase-auth.js`, `firestore.rules`,
`article-views.js`, `index.html`, `blog.html` — **ne déclenche aucun contrôle
automatique**. Ni habillage, ni glyphes, ni détection de secrets (qui n'a de
toute façon jamais été dans le workflow, seulement dans le hook local).

Ça veut dire que le fichier d'authentification servi sur 1510 pages et les
règles Firestore de production passent en CI sans être regardés.

**À faire quand le workflow sera retouché** : ajouter la racine aux `paths`, et
y ajouter une étape `_scripts/verifie-secrets.sh` — le hook local est
contournable par `--no-verify`, la CI ne l'est pas.

### D23 — Quatre apps imposent leur fond de page en `!important`

`jeux` (`body{background:#f8fafc!important}`, en production), `transitions`
(`body` + `body::before`), `planificateur` (`body.pv2`, dégradé conique),
`scoreboard` (`body{background-color:#E0F7FF!important}`, hors chantier).

Le shell pose son marine sur `<html>` et laisse `<body>` transparent, pour ne
masquer aucun décor en z-index négatif. Ces quatre déclarations recouvrent donc
le marine **et** les rayons (`.ztsh-rayons`, `z-index:-3`). Le chrome, lui,
reste lisible : la barre du haut porte sa propre teinte depuis le 27 juillet
(opacité `.92`), le casier et l'encourageur ont des fonds opaques.

**Non corrigé** : le shell n'a pas le droit de riposter — pas de `!important`
hors impression, pas de modification du fichier d'app. Retirer ces déclarations
changerait l'apparence d'apps en production : décision, pas conséquence.

**Garde-fou en place** : `_scripts/verifie-habillage.py` contrôle 6
(avertissement) et son mode `--fonds`, qui balaie les 45 apps migrées ou non.
Détail complet dans `AUDIT-FONDS-IMPORTANT-2026-07.md`.

### D24 — `planificateur` masque l'en-tête partagé dans ses deux modes modernes

`apps/planificateur/index.html:27` et `:401` :

```css
body.zts-embed [data-zts-header], … { display:none !important }
body.pv2 [data-zts-header], …       { display:none !important }
```

En mode intégré et en `?v2=1`, l'en-tête partagé disparaît. Le shell n'a pas de
barre à lui — il restyle `.zts-header`. Pas d'en-tête, pas de barre du haut.

**À trancher avant de migrer l'app**, pas pendant. S’ajoute au dossier « risque
3 maximum » du prescan (4 éléments fixes à droite, classe `metier` en collision,
5 variables en collision, plein écran, écriture Firestore, mode TBI).

### D25 — `header.html` et `footer.html` existent en deux exemplaires, et le chargeur de la copie racine est mort

| Fichier | Taille | Date | Qui le récupère |
|---|---|---|---|
| `shared/header.html` | 1 563 o | 4 juin | `shared/zts.js:198` — **les 1489 pages** |
| `header.html` (racine) | 4 354 o | 6 juillet | `includes.js:140` — **aucune page ne charge `includes.js`** |
| `shared/footer.html` | 4 979 o | 13 juillet | `shared/zts.js:199` |
| `footer.html` (racine) | 205 815 o | 13 juillet | `includes.js:146` — idem |

La copie servie est celle de `shared/` : `injectPartial()`
(`shared/zts.js:88-96`) construit son URL depuis le `src` de son propre script,
donc `/shared/`. Les copies racine sont pourtant les plus récentes et les plus
grosses — `footer.html` fait 205 Ko contre 5 Ko pour celle de `shared/`.

Deux lectures possibles, et c'est bien le problème : soit on maintient une
copie que personne ne sert, soit `includes.js` devait revenir et ne l'a jamais
fait. Personne ne peut trancher en lisant le code.

**Le piège concret** : j'ai conclu « fichiers orphelins, à rediriger en 301 »
d'une recherche de liens entrants le 28 juillet. Faux — ils sont récupérés par
du code, pas liés. Sur `header.html`, une 301 aurait cassé l'en-tête au premier
retour d'`includes.js`.

**Non corrigé** : trancher demande de savoir laquelle des deux copies fait foi,
et le `footer.html` racine de 205 Ko sent le reliquat d'un ancien pipeline.
À reprendre avec le chantier de consolidation du design system (voir D16).

### D26 — Sept apps portent la règle `#gymBg` sans l'élément

`#gymBg { position:fixed; inset:0; z-index:0; background:url(gym-bg.png) …;
opacity:1 }` est déclaré dans le CSS de **8 apps** — `agenda`, `educatifs`,
`evaluation`, `jeux`, `musique`, `sae`, `suppleance`, `tni`.

**L'élément n'existe dans le HTML que d'une seule : `tni`.** Sept règles ne
s'appliquent donc à rien, et l'image `gym-bg.png` qu'elles référencent n'est
jamais demandée.

Repéré au prescan personnage/fond du 29 juillet, en cherchant ce qui pourrait
recouvrir le marine du shell. Bonne nouvelle pour le chantier : sept obstacles
qui n'existent pas.

**Non corrigé, et volontairement hors de ce chantier.** Retirer sept blocs CSS
morts est sans risque mais sans rapport avec l'habillage ; ça appartient au
ménage du design system (voir D16). Consigné pour que le prochain qui cherche
« pourquoi le fond de gymnase n'apparaît pas » trouve la réponse ici.

Le cas `tni` est réel : opacité 0,15, donc translucide — le marine passerait au
travers, teinté, et le `<canvas id="whiteboard">` garde son blanc en propre.
Banc à faire avant d'activer le fond en densité projection.
