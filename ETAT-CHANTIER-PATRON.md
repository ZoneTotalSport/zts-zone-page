# Chantier « patron » — refonte au modèle de la maquette

**Dernière mise à jour** : 4 août 2026, fin de session.
**Dépôt** : `ZoneTotalSport/zts-zone-page` → `~/dev/Remotion 2/wix-deploy/`
**`main`** : les quatre commits du 4 août, jusqu'à celui qui porte ce document.
(Inutile d'y écrire une empreinte : elle serait toujours celle du commit
précédent, ce qui a déjà semé la confusion en début de session.)

Ce document couvre le chantier ouvert le 2 août : porter l'habillage de la
maquette retenue sur tout le site. Le chantier précédent — montage du shell sur
les apps — est dans `ETAT-CHANTIER-HABILLAGE.md` et reste valide.

---

## La décision de départ

**La maquette qui fait foi** : `zts-final-marine_2.html`, version de **9:12** du
25 juillet. Elle dormait à la corbeille avec deux versions antérieures ; celle
d'empreinte `fc6e6551…` consignée dans l'ancien doc reste introuvable.

Retenue parce qu'elle seule porte `body[data-metier]`, un bloc de configuration
`METIERS`, l'animation `.bascule` au changement et des `id` sur le hero — c'est
la version où le sélecteur de métier **refait vraiment la page**. Et ses chemins
d'images sont relatifs à la racine, donc prête pour le dépôt.

> **Correction consignée** : j'avais rapporté que ses compteurs étaient faux
> (222, 203…). Erreur de lecture. Les trois versions portent les mêmes cibles —
> `data-cible="1439"`, `"1790"`, `"333"`. Les chiffres vus étaient l'animation
> de comptage saisie en plein vol.

**Copies de travail** : scratchpad de la session (effacé). **Les originaux sont
toujours à la corbeille**, non touchés.

---

## Ce qui est livré et en production

### Le patron — `shared/zts-modele.css` + `.js`

Le vocabulaire visuel commun, **préfixe `ztsp-`**. Boutons, titres offset,
eyebrow, hero, vedette, compteurs, mini-stats, bande défilante, panneaux,
cartes, tags, CTA, sélecteur de métier, les trois portes, et le décor de page.

**Pourquoi tout est préfixé, tokens compris** : la maquette nomme ses classes
`.btn`, `.card`, `.hero`, `.grid`. Ces noms entrent en collision frontale avec
les 100 Ko de CSS inline de l'accueil et avec Tailwind. Sans préfixe, le port
casse la page au premier lien.

**Ce que le patron ne porte pas** : le casier d'outils et la pause café sont au
shell (`ztsh-`), la barre de navigation au header partagé. La maquette les
portait parce qu'elle était une page autonome.

**Le personnage flottant n'est pas porté** — voir plus bas.

### Le décor de page — `html.ztsp-decor`

Marine, trame de points, rayons jaunes en rotation (140 s).
`prefers-reduced-motion` arrête la rotation. **Opt-in** : sans la classe, aucune
page ne change.

> **LA CLASSE VA SUR `<html>`, PAS SUR `<body>`.** Premier essai sur `body` : le
> marine s'affichait, mais ni la trame ni les rayons. Les deux couches sont en
> z-index négatif ; posées sur les pseudo-éléments d'un `body` qui porte
> lui-même un fond opaque, elles se résolvent dans le contexte d'empilement de
> la racine et passent **derrière** ce fond. Même piège que `fondSurEnveloppe`,
> payé le 28 juillet, même parade.

### L'en-tête partagé, refait — 1500 pages

Le grand bandeau cyan à rayons jaunes devient une barre marine.
Ordre de haut en bas : **PÉDAGOGIE PRIMAIRE** (38 px, cyan), **ZONE TOTAL
SPORT** (92 px), **l'heure** (22 px). C'est l'ordre du DOM, pas un `order` CSS —
un lecteur d'écran doit entendre la même séquence.

> **LE HEADER EXISTE EN DOUBLE.** `shared/zts.css` sert **1481 pages** dont
> l'accueil ; `shared/zts-header.css` en sert **30**, les apps. Les deux blocs
> étaient identiques au caractère près. J'ai d'abord modifié `zts-header.css`
> seul : aucun effet sur l'accueil, qui ne le charge pas. **Toute retouche doit
> aller dans les deux.** Un avertissement croisé est écrit dans chacune.

> **OPACITÉ À `.92`, JAMAIS `.66`.** Leçon du 27 juillet, appliquée d'emblée.
> À `.66` la barre emprunte sa teinte au fond de la page : sur `jeux`, qui
> impose `body{background:#f8fafc!important}` (D23), elle virait au gris sale.
> Vérifié : `rgba(6,23,38,0.92)` sur les quatre pages testées.

### Le hero de l'accueil

Étiquette, titre en offset cyan/rose, sous-titre, **les trois portes gardées**
(décision de Joey : même contenu, même hiérarchie, seul l'habillage change),
compteur géant et mini-stats.

**Contrats JS préservés**, vérifiés un par un : `choisirMetier()` + `data-metier`,
`data-target`/`data-suffix`, `#statPros` (worker d'abonnés), toutes les clés
`data-i18n`. Le titre en offset porte `data-i18n-attr="data-txt:hero.titleN"` —
sans quoi les calques colorés resteraient en français derrière un titre anglais.

### Le personnage flottant, retiré du site

Décision de Joey du 2 août. **Mr. Root reste la mascotte** — héros, images de
marque, maquette. C'est la bulle qui suit le lecteur qui disparaît. Les trois
densités portent `encourageur: false`.

Ce retrait défait les paliers b) à e) livrés le même jour. **Les paliers
n'étaient pas une erreur** : la garde générique qu'ils ont produite (`0ca4f8b`)
reste écrite et testée si le personnage revient.

### Le dock des séries, retiré

Il ne contenait plus que FIFA ; LNH et NBA en étaient sorties le 6 juillet, même
raison. `/apps-fifa/` reste en ligne pour le SEO — seule la carte de l'accueil
part.

---

### L'accueil, uniformisé — les deux décisions de Joey sont tombées

Joey a tranché le 4 août : le calendrier devient une **carte-lien vers le
planificateur**, et la section pause devient **sobre comme les autres**. Les
trois étapes du plan sont livrées.

| Section | Avant | Maintenant |
|---|---|---|
| hero | transparent | inchangé |
| menu du jour | dégradé `#0a0a18 → #2a1a4e`, 1105 px | transparent, 854 px |
| calendrier | carte blanche à texte foncé, 898 px | carte-lien au patron, 368 px |
| aujourd'hui | dégradé `#18181b → #0f0f2e`, 1704 px | transparent, 1013 px |
| pause | dégradé `#FF2A7A → #8B5CF6`, 1291 px | transparent, 759 px |

**La page passe de 9858 px à 6403 px.** Vérifié au banc : plus aucun enfant de
`body` de plus de 120 px ne porte de fond opaque, zéro erreur console.

Les trois polices de titre et les trois couleurs deviennent une :
`.ztsp-eyebrow` + `.ztsp-sectitre` + `.ztsp-sectrait`. Les six règles qu'elles
remplacent sont **supprimées**, pas neutralisées.

> **LES CARTES TRANSLUCIDES ONT DÛ ÊTRE OPACIFIÉES.** `.menu-jour-card` et
> `.zts-today-card` posaient du blanc à 4-5 %. Sur un dégradé uni c'était
> invisible ; sur le décor, **les rayons tournent derrière le texte de la
> carte** — le fond bouge sous les mots. Passées à `rgba(8,19,30,.55)`. À
> prévoir pour toute carte translucide qu'on posera sur le décor.

Le calendrier de présences n'est pas perdu : il vit dans le planificateur.
Et sa carte-lien **corrige le défaut du paramètre de métier** (ci-dessous) —
trois boutons, un par métier, chacun avec son `?metier=`. Pas de devinette :
l'accueil n'a plus d'état de métier depuis le retrait du stage 2,
`currentMetier()` y renvoie toujours `null`.

## Ce qui reste à faire

### 1. Le planificateur — jamais habillé

Vérifié en production : ni shell, ni patron, ni décor. Il garde **son propre
système** — un thème à deux accents par métier :

```
camp → #FF6B00 orange + #B026FF violet      ep → #00E5FF + #1E90FF
sdg  → #39FF14 + #169B62
```

C'est pour ça que sa mise en page détonne. Il porte aussi encore l'ancien décor
cyan-jaune, qu'il définit lui-même.

**Il était déjà identifié comme un cas particulier** : il masque l'en-tête
partagé en `?v2=1` et en mode intégré → premier cas d'app à deux densités
(décision du 28 juillet, D24).

> **DÉFAUT DU PARAMÈTRE DE MÉTIER — RÉGLÉ CÔTÉ ACCUEIL le 4 août.** Le
> calendrier pointait vers `/apps/planificateur/` **sans paramètre**, et l'app
> retombe sur « camp » : un prof d'ÉPS atterrissait dans une interface orange
> de camp de jour. La carte-lien qui l'a remplacé passe `?metier=`.
> **Le défaut reste entier ailleurs** : tout autre lien vers le planificateur
> sans paramètre a le même effet. Le contrat est `?metier=ep|camp|sdg`, lu par
> `init()` dans `apps/planificateur/app.js`. À vérifier au balayage des liens.

### 2. Étendre le décor aux apps

Une ligne par app : la classe `ztsp-decor` sur son `<html>`. À faire quand
l'accueil est stabilisé, pour ne pas propager un modèle qui bouge encore.

### 3. Le skill `zts-app-mise-en-page`

À étendre avec le patron, pour que les prochaines apps naissent conformes.
Pas commencé.

---

## Défaut connu, non réglé

**Un vide d'environ 200 px** entre la barre du haut et l'étiquette du hero. J'ai
retiré `min-height:100vh` et `justify-content:center` de `section.hero`, ce qui
en a enlevé une partie. Il subsiste un écart dont je n'ai pas trouvé l'origine :
les enfants du body avant le hero mesurent 0 de haut, donc ça vient d'ailleurs.
Cosmétique. À traquer proprement, pas en tâtonnant.

---

## Pièges de banc — à ne pas rediagnostiquer

Ceux du chantier précédent restent valides (`ETAT-CHANTIER-HABILLAGE.md`).
Deux de plus, payés le 4 août :

- **`box-sizing: border-box` mange les aplats fins.** `.ztsp-sectrait` fait 4 px
  de haut avec un contour de 2 px : sous la règle universelle que posent presque
  toutes les pages, les 4 px sont la hauteur TOTALE, les deux contours la
  remplissent et il ne reste **aucun** jaune. Le trait se dessinait tout noir.
  Parade : `box-sizing: content-box` sur l'élément. Vaut pour tout trait, tout
  filet, toute barre de quelques pixels.
- **Le panneau de prévisualisation garde le CSS en cache entre deux passes.**
  J'ai corrigé `zts-modele.css`, rechargé, et lu `box-sizing: border-box` dans
  le style calculé — la feuille servie était l'ancienne. Un `?cb=` sur l'URL de
  la feuille l'a débloqué. **Vérifier la règle dans le CSSOM** (`document.
  styleSheets`), pas seulement le style calculé, avant de conclure qu'un
  correctif ne prend pas.

Trois de la session précédente :

- **Un commentaire HTML fermé par `*/` au lieu de `-->`** avale tout ce qui
  suit jusqu'au prochain `-->`. Symptôme : un bloc `<style>` entier absent des
  feuilles, fond transparent, zéro règle appliquée. Vérifier par
  `commentaires ouverts == commentaires fermés`.
- **Le panneau de prévisualisation ne compose pas les pages longues** avec des
  éléments `sticky` : il dessine une image partielle, les éléments collants
  figés à leur position d'avant défilement. Une capture qui montre du vide là où
  le DOM dit qu'il y a du contenu **ment**. Parade : bancher la section seule
  dans une page courte.
- **`content: none !important` sur `body.metier-*::before`** aurait tué la trame
  du patron — le body porte les deux classes. Neutraliser les fonds, jamais le
  `content`. Et une règle de **même spécificité venant après** celle du patron
  (`body.metier-*::after{background:transparent}`) effaçait les rayons :
  supprimer plutôt que contourner.

---

## Ce qui attend Joey, hors chantier

- **`header-zts-SNIPPET.html`** — où le déplacer. Fichier unique, 22 Ko, présent
  nulle part ailleurs, dans le clone périmé `~/PROJETS_CLAUDE/zts-zone-page/`.
  Une fois déplacé, ce clone devient supprimable : tout le reste est dans
  `origin`.
- **Les 9 redirections Cloudflare** (`redirections-cloudflare.csv`) — pour
  supprimer les apps sportives (temps 2).
