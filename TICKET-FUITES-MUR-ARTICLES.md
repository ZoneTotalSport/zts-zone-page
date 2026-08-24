# TICKET — Trois fuites du mur d'inscription sur les articles

**Ouvert le :** 24 août 2026 · **Branche :** `partage/articles-social`
**Fichier en cause :** `zts-lock-page.js` — **protégé, non modifié**
**État :** diagnostiqué, chiffré, **non corrigé — décision requise**

---

## Pourquoi un ticket et pas un commit

Joey a demandé un commit séparé pour corriger les fuites. En cherchant à
l'écrire, j'ai constaté que **les trois défauts ont leur cause unique dans
`zts-lock-page.js`**, que les garde-fous du chantier interdisent de toucher — et
que **toute correction côté HTML seul change l'apparence des articles**, ce qui
est mesuré plus bas et n'est pas un diff neutre.

Corriger demande donc une décision qui n'est pas la mienne. Ce ticket porte le
diagnostic complet pour qu'elle se prenne en une lecture.

**Aucune de ces fuites n'a été introduite par ce chantier.** Toutes les mesures
ci-dessous ont été refaites sur `main` — un worktree servi en parallèle sur un
second port — et les chiffres sont identiques au mot près.

---

## Les trois fuites

### Fuite A — un article sur deux squelettes n'est muré que sur le premier

`contentContainer()` (ligne 274) choisit **un seul** `.article-body`, celui qui a
le plus d'enfants. `applyHalf()` (ligne 244) n'en masque que les enfants
directs. Un article dont le contenu est réparti sur plusieurs conteneurs n'est
donc muré que sur un seul.

`50-jeunes-un-gymnase.html` a trois `.article-body` frères — 2, 19 et 7 enfants.
Seul celui de 19 est muré. Entre les deux derniers vit toute la section
interactive des 21 stratégies, dans aucun conteneur.

> **Mesure, en anonyme : 6 311 mots visibles sur 6 796. 93 % de l'article est
> lisible sans compte.** Neuf éléments masqués en tout. Le CTA d'inscription
> s'affiche à 42 % de la hauteur, et 58 % de la page défile encore en dessous.

Référence d'un article sain, même mesure : `classes-difficiles-partie-1` →
3 423 mots visibles sur 10 718, soit **32 %**. `grands-jeux-exterieurs-camp-de-jour`
→ **47 %**. C'est ce que « demi-aperçu » veut dire.

### Fuite B — un article sans `.article-body` n'est pas muré du tout

`un-jeu-trois-versions.html` n'a aucun `.article-body` : son contenu vit dans un
`<div class="zts-inc">`. `contentContainer()` renvoie `null`, `demiApercu()`
sort à la ligne 315 sans rien faire.

> **Mesure : aucun élément masqué, aucun CTA, 100 % de l'article lisible.** Il
> n'est pourtant pas dans `freeArticles`.

### Fuite C — `freeArticles` est inerte

C'est l'inverse des deux autres, et personne ne l'a vu : **les trois articles
déclarés publics sont murés comme les autres.**

`init()` (ligne 340) traite les articles ainsi :

```js
// Articles → demi-aperçu pour tous (plus de plein écran bloquant)
if (info.kind === 'article') { initArticleHalf(info); return; }
```

Le `return` tombe **avant** tout appel à `loadWhitelist()`. Les branches `jeu` et
`resource`, elles, consultent bien la liste. Pour les articles, `isFree()` n'est
jamais appelé : `freeArticles` ne sert à rien.

> **Mesure sur `faire-bouger-enfants`, présent dans `freeArticles` : mur affiché,
> 54 éléments masqués, 4 815 mots visibles sur 9 010 — 53 %.** Il devrait être
> entier.

Les trois concernés : `faire-bouger-enfants`, `comportements-perturbateurs`,
`catastrophes-ordinaires`. Le commentaire du code — « demi-aperçu pour tous » —
décrit exactement ce qui se passe. Reste à savoir si c'est ce qui était voulu :
ces trois slugs ont été choisis comme appâts SEO, et ils sont tronqués.

---

## Pourquoi aucune correction HTML ne convient

`zts-lock-page.js` ne connaît qu'un sélecteur : `.article-body`. Le réparer sans
y toucher voudrait dire poser cette classe sur les conteneurs orphelins. Or elle
**porte le style** de la typographie d'article — `.article-body h2`,
`.article-body p`, `.article-body blockquote`, etc. sont définis dans le `<style>`
de chaque page.

Mesuré en direct sur `un-jeu-trois-versions`, en ajoutant la classe à `.zts-inc` :

| Élément | Avant | Après |
|---|---|---|
| `h3` — police | Bangers | LuckiestGuy |
| `h3` — marge haute | 0 px | 40 px |
| `p` — corps | 20 px | 19,2 px |
| `blockquote` — corps | 17 px | **31,2 px** |

Les citations doublent presque de taille. Ce n'est pas un diff neutre, et le
chantier demande des diffs minimaux.

Pour la fuite A, la variante — étendre le `.article-body` de `50-jeunes` jusqu'à
la fin de l'article — retomberait sur le même problème : la section interactive
des 21 stratégies hériterait de la typographie d'article.

---

## Trois sorties possibles

**(a) Corriger `zts-lock-page.js` — recommandé.** Trois changements courts et
ciblés, dans le seul fichier qui est réellement en cause :

1. `contentContainer()` retourne **la liste** des `.article-body`, et
   `applyHalf()` coupe sur l'ensemble concaténé. Règle les fuites A et B pour
   tous les articles présents et à venir, sans toucher à un seul fichier HTML.
2. Un sélecteur de repli — `article.zts-prose > .zts-inc` — pour les articles
   sans `.article-body`. Alternative à `.zts-inc` près : accepter n'importe quel
   enfant direct de `article.zts-prose`.
3. Consulter `loadWhitelist()` avant de murer un article, comme le font déjà les
   branches `jeu` et `resource`. Règle la fuite C.

C'est la seule option qui traite la cause. Elle demande de lever le gel sur ce
fichier — d'où ce ticket.

**(b) Ne corriger que la fuite C.** Un `if (isFree(...)) return;` de trois lignes,
la plus petite modification possible du fichier gelé, pour le défaut dont l'effet
est le plus contraire à l'intention : trois articles choisis comme appâts SEO,
tronqués depuis leur mise en liste blanche.

**(c) Ne rien corriger.** Deux articles restent lisibles à 93 % et 100 % sans
compte ; trois articles publics restent tronqués. Le ticket reste ouvert.

---

## Ce qu'il faudra revérifier après correction

Les mesures de référence, à refaire à l'identique en navigation anonyme :

| Article | Attendu après correction |
|---|---|
| `classes-difficiles-partie-1` | ~32 % visible — inchangé, c'est le témoin |
| `grands-jeux-exterieurs-camp-de-jour` | ~47 % visible — inchangé, second témoin |
| `50-jeunes-un-gymnase` | de 93 % à ~50 % |
| `un-jeu-trois-versions` | de 100 % à ~50 % |
| `faire-bouger-enfants` | de 53 % à **100 %** (liste blanche) |
| `comportements-perturbateurs` | 100 % (liste blanche) |
| `catastrophes-ordinaires` | 100 % (liste blanche) |

La mesure utilisée compte les mots des `p`, `h2`, `h3`, `li` et `blockquote` sous
`article`, hors `nav`, `footer` et blocs de CTA, et compare le total au sous-total
non masqué par `.zts-half-hidden`.
