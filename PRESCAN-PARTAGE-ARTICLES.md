# PRESCAN — Partage social des articles de blogue

**Date :** 24 août 2026 · **Dépôt :** `~/dev/Remotion 2/wix-deploy` · **Branche :** `main`
**Portée :** lecture seule. **Aucun fichier du dépôt n'a été modifié.**

---

## 0. Le résumé qui change le plan

Le chantier partait de deux hypothèses. Les deux sont fausses, et il faut le dire avant
d'écrire une ligne de code.

**1. « Les articles n'ont pas de balises OG. »** Ils en ont tous. Les 25 articles portent
déjà `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`,
`og:locale`, `twitter:card=summary_large_image`, `twitter:title`, `twitter:image` et un
`<link rel="canonical">`. Les images pointent toutes vers un fichier qui existe, et 24 sur
25 dépassent 1200×630. **Le Commit 2 du plan est déjà fait à 96 %.** Il reste une seule
image à corriger.

**2. « Les 3-4 cercles du haut sont décoratifs. »** Ils ne le sont pas. Ce sont déjà quatre
boutons de partage fonctionnels — Facebook, X, LinkedIn, courriel — plus une pilule
« Copier le lien ». Ils marchent aujourd'hui. Les remplacer n'ajouterait rien ; les
**améliorer** en ajoute beaucoup (voir §5).

Ce qui manque vraiment, c'est ailleurs : le partage natif mobile, un vrai toast, la
suppression d'un doublon, et un article laissé complètement de côté.

**Bonne nouvelle sur les garde-fous :** les cercles vivent dans **chaque fichier d'article**,
pas dans un fichier partagé. Aucun des trois fichiers protégés (`header.html`,
`shared/zts.css`, `zts-lock-page.js`) n'a besoin d'être touché.

---

## 1. Inventaire — 25 articles, tous en français

`articles/*.html` — 25 fichiers. **Aucun dossier `en/`, aucune version anglaise séparée.**
Le multilingue se fait dans la même page, par `<span lang="fr|en|zh|es">`. Le volet
« versions EN : balises en anglais » du plan n'a donc pas d'objet : il n'y a pas de page EN
à baliser. Les `og:locale:alternate` (en, zh, es) sont déjà en place.

### Tableau article par article

Légende — **OG** : les 5 balises du plan (`og:title`, `og:description`, `og:image`,
`og:url`, `twitter:card`). **Img** : dimensions réelles du fichier `og:image`.
**Haut / Bas** : blocs de partage présents.

| # | Article | OG | `og:image` — dimensions | Haut | Bas | Mur |
|---|---------|:--:|------------------------|:----:|:---:|:---:|
| 1 | `50-jeunes-un-gymnase` | 5/5 | 2752×1536 ✅ | ✅ | ✅ | demi |
| 2 | `avance-annee-scolaire` | 5/5 | 1600×1600 ✅ ⚠ carré | ✅ | ✅ | demi |
| 3 | `bienfaits-sport-enfants` | 5/5 | 1600×872 ✅ | ✅ | ✅ | demi |
| 4 | `catastrophes-ordinaires` | 5/5 | 1920×1072 ✅ | ✅ | — | **libre** |
| 5 | `classes-difficiles-partie-1` | 5/5 | 1600×872 ✅ | ✅ | ✅ | demi |
| 6 | `classes-difficiles-partie-2` | 5/5 | 1600×893 ✅ | ✅ | ✅ | demi |
| 7 | `classes-difficiles-partie-3` | 5/5 | 1600×872 ✅ | ✅ | ✅ | demi |
| 8 | `color-run` | 5/5 | 1600×960 ✅ | ✅ | ✅ | demi |
| 9 | `comportements-perturbateurs` | 5/5 | 1600×872 ✅ | ✅ | ✅ | **libre** |
| 10 | `courbe-plaisir-jeu` | 5/5 | 1600×873 ✅ | ✅ | ✅ | demi |
| 11 | `eleves-cotes-eps` | 5/5 | 1600×1066 ✅ | ✅ | ✅ | demi |
| 12 | `faire-bouger-enfants` | 5/5 | 1600×1066 ✅ | ✅ | ✅ | **libre** |
| 13 | `foobaskill` | 5/5 | 2814×1536 ✅ | ✅ | ✅ | demi |
| 14 | `grands-jeux-exterieurs-camp-de-jour` | 5/5 | **900×289 ❌** | ✅ | — | demi |
| 15 | `harcelement-enseignants` | 5/5 | 1600×872 ✅ | ✅ | ✅ | demi |
| 16 | `jeux-course-1er-cycle` | 5/5 | 1600×1039 ✅ | ✅ | ✅ | demi |
| 17 | `nawatobi` | 5/5 | 2752×1536 ✅ | ✅ | ✅ | demi |
| 18 | `rentree-scolaire` | 5/5 | 1600×1036 ✅ | ✅ | ✅ | demi |
| 19 | `respect-eps` | 5/5 | 1600×872 ✅ | ✅ | ✅ | demi |
| 20 | `sae-course` | 5/5 | 1600×1600 ✅ ⚠ carré | ✅ | ✅ | demi |
| 21 | `suppleance-ecoles` | 5/5 | 2752×1536 ✅ | ✅ | ✅ | demi |
| 22 | `syndrome-gymnase` | 5/5 | 1600×893 ✅ | ✅ | ✅ | demi |
| 23 | `systeme-emulation-dollar` | 5/5 | 2752×1536 ✅ | ✅ | ✅ | demi |
| 24 | `systeme-emulation-dollars-ecole` | 5/5 | 1600×1066 ✅ | ✅ | ✅ | demi |
| 25 | `un-jeu-trois-versions` | 5/5 | 1800×1005 ✅ | **❌** | **❌** | **❌ aucun** |

**Totaux :** 25/25 OG complets · 24/25 images conformes · 24/25 partage en haut ·
22/25 partage en bas · 3 articles libres, 21 en demi-aperçu, **1 sans aucun mur**.

### Les seules images à problème

| Fichier | Dimensions | Verdict |
|---|---|---|
| `logo-zts.png` (utilisé par `grands-jeux-exterieurs-camp-de-jour`) | 900×289 | **Trop petit ET mauvais ratio (3.11:1).** Sous le minimum 1200×630 de Facebook, l'aperçu tombe en petite vignette carrée à gauche du titre au lieu de la grande carte. C'est un logo, pas une image d'article : la carte ne dit rien du contenu. |
| `avance-annee-scolaire.jpg` · `sae-course.jpg` | 1600×1600 | Assez grandes, mais **carrées**. Facebook recadre au ratio 1.91:1 → il coupe 47 % de la hauteur, centré. À vérifier à l'œil que le sujet survit au recadrage. Pas bloquant. |

**Aucune image n'a été redimensionnée**, conformément à la consigne.

⚠ `grands-jeux-exterieurs-camp-de-jour` n'a **aucune image locale** : ses 3 images de corps
sont des `https://images.unsplash.com/...` en lien direct, et il n'existe pas de
`articles/images/heroes/grands-jeux-*`. Corriger son `og:image` demande donc **une décision
de ta part** — voir §7, question 2.

---

## 2. Où vivent les cercles du haut

**Dans chaque fichier d'article, en HTML brut. Aucun fichier partagé n'est en cause.**

Le bloc est identique dans les 24 articles, commenté `<!-- Partage et retour -->`. Dans
`classes-difficiles-partie-1.html` il occupe les lignes 245-267 :

```html
<div class="mt-12 pt-8 border-t-4 border-slate-50 flex flex-col md:flex-row ...">
  <div class="flex items-center gap-3 flex-wrap justify-center">
    <p class="font-black text-slate-400 uppercase text-xs tracking-[0.2em]">Partager :</p>
    <a href="https://www.facebook.com/sharer/sharer.php?u=..." class="w-10 h-10 rounded-full bg-cyan-50 ...">
    <a href="https://twitter.com/intent/tweet?url=..."        class="w-10 h-10 rounded-full bg-cyan-50 ...">
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=..." class="w-10 h-10 rounded-full ...">
    <a href="mailto:?subject=Article%20Zone%20Total%20Sport&body=..." class="w-10 h-10 rounded-full ...">
    <button onclick="navigator.clipboard.writeText(window.location.href)...">Copier le lien</button>
```

Ce sont **4 cercles de 40×40 px** (`w-10 h-10 rounded-full`) dessinés par les classes
utilitaires Tailwind du CDN, plus une pilule jaune. Pas de CSS maison, pas d'include, pas
de `shared/`. Mesuré au navigateur sur `classes-difficiles-partie-1` : les quatre cercles
sont à `y = 1442`, la pilule à `y = 1516`.

### Pourquoi ils paraissent « en haut »

Les 23 articles concernés contiennent **deux squelettes empilés**, hérités de la migration :

```
<main>                              ← squelette RÉCENT (« ZTS HERO XXL »)
  <article> <div class="article-body">   ← VIDE dans 23 articles sur 25
           </div>
           [bannière don]  [les 4 cercles + Copier]   ← visible tout de suite
  </article>
  <aside>…</aside>
</main>
<section class="zts-article-centered">   ← squelette ANCIEN
  <article> <div class="article-body">   ← le VRAI texte de l'article
```

Le premier `.article-body` étant vide, les cercles apparaissent immédiatement sous le titre,
**avant le texte**. D'où l'impression d'une rangée décorative en haut de page. C'est en
réalité le pied de l'article récent, coincé au-dessus du corps de l'article ancien.

### Le doublon

Le squelette ancien porte **son propre bloc de partage**, plus bas, en pilules colorées
(`.share-btn`) : Copier le lien · Facebook · X · Courriel · **WhatsApp**. Sur
`50-jeunes-un-gymnase`, les deux blocs sont mesurés à `y = 3128` et `y = 34185` de la même
page. **23 articles servent donc deux blocs de partage concurrents**, de style différent,
avec des jeux de réseaux différents.

---

## 3. Interaction avec `zts-lock-page.js` — testée, RAS

`zts-lock-page.js` est chargé par les 25 articles. Trois sont dans
`locked-whitelist.json → freeArticles` (`faire-bouger-enfants`,
`comportements-perturbateurs`, `catastrophes-ordinaires`) ; les autres reçoivent le
demi-aperçu.

**Le mur ne masque que les enfants directs du `.article-body` le plus rempli**
(`applyHalf()`, ligne 244) — et il ne descend jamais dans les sous-arbres. Les deux blocs de
partage vivent **hors** de tout `.article-body` : le bloc du haut est frère du premier
`article-body`, celui du bas est dans une autre section.

Vérifié en navigateur, en anonyme, sur trois articles murés :

| Article | CTA du mur | Bloc haut | Bloc bas | Masqué ? |
|---|---|---|---|---|
| `classes-difficiles-partie-1` | y = 11 964 | y = 1 442 | y = 12 864 | **non, aucun des deux** |
| `50-jeunes-un-gymnase` | y = 16 461 | y = 3 128 | y = 34 185 | **non, aucun des deux** |
| `grands-jeux-exterieurs-camp-de-jour` | y = 17 510 | y = 20 148 | — | **non** |

**Réponse à la question 4 du chantier : oui, les cercles sont dans la zone toujours
visible.** Les habiller ou les enrichir n'entre en collision avec rien. Un visiteur anonyme,
mur affiché, garde accès aux boutons de partage — ce qui est d'ailleurs souhaitable.

---

## 4. Ce que le garde-fou `verifie-habillage.py` couvre — et ne couvre pas

`_scripts/verifie-habillage.py` passe actuellement : **41 apps, 0 bloquant, 4
avertissements** (préexistants : `studio-jeu`, `transitions`). Il le restera.

⚠ **Mais il ne scanne que `apps/`. Il ne regarde jamais `articles/`.** Il restera vert quoi
qu'on fasse dans ce chantier — y compris si on casse tout. **Ce n'est pas un filet ici.** Le
vrai contrôle sera le script de vérification proposé au Commit 0 ci-dessous, qui teste ce
qui compte réellement : les balises OG et le rendu de la carte.

---

## 5. Les vrais manques

Ce qui suit est ce que le chantier apporterait réellement, une fois retiré ce qui existe déjà.

| # | Manque | Où | Poids |
|---|--------|-----|:---:|
| 1 | **`navigator.share` absent partout.** Sur téléphone, aucun accès à la feuille de partage iOS/Android — le canal de partage le plus utilisé. | les 25 | **fort** |
| 2 | **Doublon de blocs.** Deux blocs de partage sur la même page, styles et réseaux divergents (WhatsApp en bas seulement, LinkedIn en haut seulement). | 23 | **fort** |
| 3 | **`un-jeu-trois-versions.html` n'a aucun bouton de partage.** | 1 | **fort** |
| 4 | **Le lien X ne passe pas le titre** dans le bloc du haut : `?url=…` sans `&text=`. Le tweet sort nu. (Le bloc du bas, lui, passe le titre.) | 24 | moyen |
| 5 | **X pointe encore sur `twitter.com/intent/tweet`.** Redirige toujours, mais l'URL à jour est `x.com/intent/post`. | 24 | faible |
| 6 | **Le courriel a un sujet générique** — « Article Zone Total Sport » — au lieu du titre de l'article. | 24 | moyen |
| 7 | **Pas de toast.** « Copier le lien » réécrit le libellé du bouton, sans confirmation visible ailleurs sur la page. | 24 | moyen |
| 8 | **Le bouton Copier détruit le multilingue.** `this.querySelector('span').textContent='Copié !'` écrase les 4 `<span lang>` et restaure ensuite « Copier le lien » en français dur — un lecteur anglophone se retrouve avec un bouton français après un clic. | 24 | moyen |
| 9 | **Aucun repli si `navigator.clipboard` échoue** (HTTP non sécurisé, permission refusée) : la promesse est rejetée en silence, rien ne se passe à l'écran. | 24 | moyen |
| 10 | **`og:image:width` / `og:image:height` absents (25/25).** Facebook doit télécharger l'image avant de savoir la dessiner : au tout premier partage, la carte sort souvent sans image. | 25 | moyen |
| 11 | **`og:image` de `grands-jeux…` = le logo**, 900×289. | 1 | **fort** |

**Hors périmètre, trouvé au passage** — deux fuites du mur, à traiter séparément :
- `un-jeu-trois-versions.html` n'a **aucun** `.article-body`. `contentContainer()` renvoie
  `null`, `applyHalf()` sort immédiatement : **l'article est lisible en entier par un
  visiteur anonyme** alors qu'il n'est pas dans la liste blanche.
- `50-jeunes-un-gymnase.html` a **trois** `.article-body` (2, 19 et 7 enfants). Le mur ne
  s'applique qu'au plus rempli ; **le troisième bloc, 7 sections, reste entièrement
  visible** sous le CTA d'inscription.

---

## 6. Plan de commits proposé (révisé)

Le plan d'origine — créer les boutons, poser les balises, injecter le script — supposait
qu'il n'y avait ni boutons ni balises. Version corrigée, **du moins risqué au plus risqué**,
chaque commit annulable seul.

### Commit 0 — filet de sécurité (nouveau fichier, rien d'existant touché)
`_scripts/verifie-partage-articles.py` : contrôle les 25 articles — les 5 balises présentes,
`og:image` existe sur disque et ≥ 1200×630, `og:url` == canonical == nom du fichier, au
moins un bloc de partage, pas de doublon. **À écrire en premier**, pour que les commits
suivants aient quelque chose qui les juge. `verifie-habillage.py` ne regarde pas `articles/`.

### Commit 1 — `assets/zts-partage-article.js` + son CSS (nouveaux fichiers)
⚠ **Pas `zts-partage.js` : ce nom est déjà pris.** `shared/zts-partage.js` (192 lignes)
existe et fait autre chose — c'est le bloc « Fais connaître ZoneTotalSport » du pied de page
et de `/bienvenue.html`, qui partage **le site**, pas l'article courant. Deux fichiers
homonymes à deux endroits seraient un piège pour le prochain qui passe. D'où le nom
`zts-partage-article.js`.

Le script **rehausse le bloc existant** au lieu de le remplacer : il repère le `<div>`
`Partage et retour`, garde les quatre cercles, et
- insère **en premier cercle** un bouton `navigator.share` — uniquement si l'API répond
  présente, donc invisible sur bureau ;
- réécrit `mailto:` avec le vrai titre en sujet ;
- ajoute `&text=<titre>` au lien X et le fait pointer sur `x.com/intent/post` ;
- reprend « Copier le lien » : toast `ztsp-toast` discret, multilingue préservé, repli
  `document.execCommand('copy')` si `navigator.clipboard` échoue ;
- classes préfixées **`ztsp-`**, aucune collision avec les `.zts-*` gelées ; cercles
  conservés, palette ZTS (`#00C4FF`, `#FFF000`, `#0F0F2E`).

Aucun SDK, aucun script tiers : liens sharer simples. Réutilise `ZTS.t()` pour les libellés
quand le dictionnaire est là, avec repli français explicite — le patron déjà suivi par
`shared/zts-partage.js`.

### Commit 2 — supprimer le bloc de partage en double (23 articles)
Retirer le bloc `.share-btn` du bas et garder celui du haut, **enrichi par le Commit 1**.
Décision à confirmer — voir §7, question 1 : c'est la seule suppression du chantier, et
WhatsApp n'existe que dans le bloc du bas.

### Commit 3 — corriger `grands-jeux-exterieurs-camp-de-jour` (1 fichier, 1 ligne)
`og:image` + `twitter:image` vers une vraie image d'article. **Bloqué sur ta décision** —
voir §7, question 2.

### Commit 4 — ajouter le bloc de partage à `un-jeu-trois-versions.html` (1 fichier)
Le seul article qui n'en a aucun.

### Commit 5 — `og:image:width` / `og:image:height` (25 fichiers, 2 lignes chacun)
Dimensions réelles, déjà mesurées et listées au §1. Purement additif.

### Commit 6 — injection du script dans les articles (25 fichiers, 1 ligne chacune)
Une balise `<script defer src="/assets/zts-partage-article.js"></script>`. Rollback trivial.

**Ce que le plan d'origine prévoyait et qui devient sans objet :**
- Commit 2 d'origine (poser les balises OG partout) → déjà fait, 25/25.
- Volet « versions EN » → il n'existe aucun fichier d'article anglais.

### Vérification, avant de te rendre la main
Serveur local sur `:8791`, en navigation anonyme, sur les 25 articles : clic sur chaque
bouton, toast de copie, presse-papiers relu, et validation de la carte OG par un parseur
local (pas de débogueur Facebook nécessaire pour contrôler la structure). Rapport final dans
`PARTAGE-ARTICLES-COMPLETE.md`.

---

## 7. Deux décisions qui t'appartiennent

**Question 1 — le doublon.** Je propose de garder le bloc du haut (cercles, enrichi) et de
supprimer celui du bas (`.share-btn`, pilules). Mais ça **retire WhatsApp**, qui n'existe
que dans le bloc du bas — et WhatsApp est un canal de partage réel entre profs. Trois
sorties possibles :
- **(a)** garder le haut, supprimer le bas, **et ajouter WhatsApp aux cercles du haut** — ma
  recommandation : un seul bloc, aucun réseau perdu ;
- **(b)** garder les deux tels quels (aucune suppression, mais la page reste incohérente) ;
- **(c)** garder le bas, supprimer le haut — non recommandé : le bas est sous le mur
  d'inscription, beaucoup moins vu.

**Question 2 — l'image de `grands-jeux-exterieurs-camp-de-jour`.** Cet article n'a aucune
image locale : ses 3 illustrations sont des liens directs vers Unsplash. Options :
- **(a)** tu fournis un rendu pour `articles/images/heroes/grands-jeux-exterieurs-camp-de-jour.jpg`
  en ≥ 1200×630 — ma recommandation, c'est la seule qui ne dépend de personne ;
- **(b)** pointer `og:image` sur l'une des Unsplash en `?w=1200&h=630&fit=crop` — marche
  tout de suite, mais la carte d'aperçu de ZTS dépend alors d'un serveur tiers ;
- **(c)** ne rien changer — la carte continue d'afficher le logo en petite vignette.

**Le reste du plan ne demande aucune décision** : rien ne touche `header.html`,
`shared/zts.css` ni `zts-lock-page.js`.

---

## 8. Méthode

Lecture des 25 fichiers ; extraction des balises et mesure des dimensions d'image en lisant
les en-têtes PNG/JPEG sur disque ; lecture de `zts-lock-page.js` (393 lignes) et de
`locked-whitelist.json` ; exécution de `_scripts/verifie-habillage.py` ; et rendu réel des
articles sur un serveur local `:8791`, en anonyme, avec relevé des positions des boutons et
de l'état du mur. Les coordonnées `y` citées sont des mesures, pas des estimations.

**Aucun fichier du dépôt n'a été créé, modifié ou supprimé** — hormis ce rapport.
