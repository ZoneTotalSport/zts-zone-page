# TICKET — `50-jeunes-un-gymnase` : 81 % du texte hors conteneur

**Ouvert le :** 24 août 2026 · **État :** diagnostiqué et mesuré, **aucun code écrit**
**Fichier en cause :** `articles/50-jeunes-un-gymnase.html` — pas `zts-lock-page.js`
**Suite de :** `FIX-FUITES-MUR-COMPLETE.md` §4 · **Décision :** à toi, possiblement
avec le ménage des 23 squelettes doublés

---

## Le problème en une mesure

**`50-jeunes-un-gymnase` reste lisible à 91 % sans compte**, après le correctif du
mur déployé en PR #26. Le ticket précédent annonçait ~50 % : c'était faux, et
voici pourquoi.

Le correctif a appris au verrou à énumérer **tous** les conteneurs. Mais sur cet
article, le texte n'est dans aucun :

| | mots | part |
|---|---:|---:|
| dans un `.article-body` | 1 292 | 19 % |
| **hors de tout conteneur** | **5 524** | **81 %** |

Énumérer les conteneurs ne peut rien pour du contenu qui n'est dans aucun.

**Il est le seul dans ce cas.** Scan des 25 articles au parseur HTML : les
24 autres sont à **≤ 1 %** de texte hors conteneur.

---

## Où est passé le texte

Trois blocs de premier niveau sous `<article>`, frères des `.article-body` :

| Bloc | Ligne | Mots | Quoi |
|---|---:|---:|---|
| `#solutions-section` | 599–959 | **5 420** | **le cœur de l'article** — les 21 stratégies |
| `.my-12 bg-gradient-to-br…` | 399 | 79 | bannière de don |
| `.text-center py-8 mb-8` | 1032 | 70 | bloc de fin |

**`#solutions-section` porte 97 % du contenu orphelin.** C'est un bloc de
55 050 caractères contenant 3 onglets (`tab-btn` → `showTab()` en `onclick`),
3 `tab-content` et **21 `solution-card`**. C'est la section qui justifie le titre
de l'article, et c'est exactement celle qui est offerte gratuitement.

La structure d'ensemble :

```
<main>                                    ← squelette RÉCENT
  <article class="…zts-prose">
    <div class="article-body">            ←  2 enfants
    [bannière don]  [bloc de partage]
  </article>
</main>
<section class="zts-article-centered">    ← squelette ANCIEN
  <article class="…zts-prose">
    <div class="article-body">            ← 19 enfants   ← seul conteneur vraiment muré
    <div id="solutions-section">          ← 5 420 mots, DANS AUCUN CONTENEUR
    <div class="bg-white…"><div class="article-body">  ←  7 enfants (la conclusion)
  </article>
</section>
```

---

## Ma proposition

**Poser `class="article-body"` sur `#solutions-section` lui-même.** Une seule
ligne modifiée.

Ses 6 enfants directs rejoignent alors la liste de coupe, à leur place dans
l'ordre du document, entre le conteneur de 19 et celui de 7. Le total passe de
28 à 34 unités, et la coupure tombe au milieu du contenu réel au lieu de tomber
au milieu de l'intro.

Je ne recommande **pas** d'envelopper la section dans un nouveau
`<div class="article-body">` : elle ne compterait alors que pour **une seule**
unité de coupe, donc ses 5 420 mots seraient masqués ou visibles d'un bloc,
selon le côté où tombe la coupure. Tout ou rien, sur 80 % de l'article.

### Le risque typo, mesuré sur CE bloc

Le prescan avait mesuré, sur `un-jeu-trois-versions`, qu'ajouter `.article-body`
faisait passer les citations de **17 à 31,2 px** et changeait la police des `h3`.
C'était l'argument qui a fait geler cette approche.

**Sur `#solutions-section`, ce risque ne se reproduit pas.** Mesure faite en
production, en ajoutant la classe à chaud et en relevant les styles calculés
avant/après :

| Élément | Avant | Après |
|---|---|---|
| `h2` | — | **inchangé** |
| `h3` | — | **inchangé** |
| `p` | — | **inchangé** |
| **`li`** | 28,8 px | **33,6 px** (+17 %) |
| `blockquote` | — | **inchangé** |

**Un seul changement, sur les puces.** La raison : 27 des éléments de texte de
cette section portent un `style=` en ligne, qui l'emporte sur les règles
`.article-body …`. Les 147 autres ne sont pas touchés parce que leurs propriétés
coïncident déjà.

Reste donc à trancher une seule question : **+17 % sur les puces de la section
des 21 stratégies, est-ce acceptable ?** Si non, une règle de compensation d'une
ligne dans le `<style>` de l'article suffit — mais c'est du CSS de rattrapage,
et ça se paie en dette.

### Résultat attendu

De **91 %** à environ **50 %** de texte visible sans compte. À revalider avec la
méthode habituelle : `main` servi en parallèle sur un second port, mesure en
anonyme, **sur une origine neuve** (le navigateur sert `zts-lock-page.js` depuis
son cache — piège documenté dans `FIX-FUITES-MUR-COMPLETE.md` §5).

Témoins à garder identiques : `classes-difficiles-partie-1` à 32 %,
`grands-jeux-exterieurs-camp-de-jour` à 47 %.

---

## Le lien avec les 23 squelettes doublés

Cet article est un cas particulier — le seul avec du contenu orphelin — mais il
partage sa cause avec les 22 autres : **la migration a empilé deux squelettes
sans fusionner leur contenu**. Ici, un bloc est simplement tombé entre les deux.

Deux façons de le prendre :

**(a) Le corriger seul, tout de suite.** Une ligne, risque mesuré et circonscrit
aux puces, gain immédiat : 40 points de contenu qui cessent d'être offerts. C'est
ma recommandation si le ménage global n'est pas imminent — l'article est en
production et se fait lire aujourd'hui.

**(b) L'inclure dans le ménage des 23 squelettes.** Plus propre sur le fond : si
les deux `<article>` fusionnent, la question du conteneur orphelin disparaît
d'elle-même, sans classe à ajouter ni typo à compenser. Mais c'est un chantier
d'un autre ordre — 23 fichiers, chacun avec ses styles inline — et d'ici là
l'article reste ouvert à 91 %.

Le coût de faire (a) puis (b) est faible : la ligne ajoutée en (a) deviendra
inutile au moment du ménage et se retirera avec le reste.

---

## Méthode des mesures citées

Texte hors conteneur : parseur `html.parser` sur les 25 fichiers, comptage des
mots des `p`, `h2`, `h3`, `h4`, `li`, `blockquote` sous `article`, hors `nav`,
`footer` et `.zts-cta-inline`, réparti selon la présence d'un ancêtre
`.article-body` ou `.zts-inc`.

Risque typo : `getComputedStyle()` relevé sur la page de production avant et
après ajout de la classe, sur un représentant de chaque balise, plus un
représentant sans `style=` en ligne.

Part visible : mots non masqués par `.zts-half-hidden` sur mots totaux, en
navigation anonyme.
