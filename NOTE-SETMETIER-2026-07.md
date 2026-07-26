# NOTE — Contrat actuel de `setMetier`

**Date** : 25 juillet 2026 · **Demandée par** : addendum §A, corollaire `setMetier` · **Portée** : lecture seule, préalable à la phase 1.

---

## 1. Ce que `setMetier` fait aujourd'hui

`shared/zts.js:124-127`, dans son intégralité :

```js
function setMetier(key) { // 'ep' | 'sdg' | 'camp' | null
  if (key) document.body.setAttribute('data-metier', key);
  else document.body.removeAttribute('data-metier');
}
```

C'est tout. La fonction pose ou retire un attribut sur `<body>`. Elle ne persiste rien, n'émet aucun événement, ne filtre aucune donnée, ne retraduit rien, ne recharge rien.

## 2. Qui l'appelle

**Personne.** Recherche `setMetier` sur tout le dépôt, hors `node_modules` :

| Occurrence | Nature |
|---|---|
| `shared/zts.js:124` | définition |
| `shared/zts.js:231` | export dans `window.ZTS` |
| `apps/planificateur/semaine-grid.js:562,565,573` | **fonction locale homonyme, sans rapport** — voir §5 |

`ZTS.setMetier` est une **API morte**. Elle est exportée depuis juin 2026 et n'a jamais eu d'appelant. Le métier est posé **statiquement dans le HTML** : `<body data-metier="sdg">`.

## 3. Où la valeur est stockée

**Nulle part.** Il n'y a aucune persistance :

- pas de `localStorage`, pas de `sessionStorage`, pas de cookie, pas de Firestore ;
- pas de paramètre d'URL ;
- la seule source de vérité est l'attribut HTML écrit en dur dans chaque `index.html`.

**Conséquence de conception majeure** : le métier est aujourd'hui une propriété **de la page**, pas **de l'utilisateur**. `apps/jeux-eau/` est une app de camp de jour, point final — ce n'est pas « la vue camp de jour » d'une app générique. Un sélecteur de métier persistant, comme celui de la maquette, introduit une notion qui n'existe pas encore dans le système.

## 4. Répartition réelle sur les 46 apps

| État | Nb | Apps |
|---|---|---|
| `data-metier="camp"` | 9 | `brise-glace`, `chansons-camp`, `grands-jeux`, `jeux-eau`, `jeux-par-theme`, `noms-de-clans`, `olympiades`, `rallyes`, `veillee-feu-de-camp` |
| `data-metier="sdg"` | 8 | `activites-duree`, `bricolages`, `jeux-calmes`, `jeux-rapides`, `journee-pedago`, `plan-b-pluie`, `roue-responsabilites`, `sos-conflits` |
| `data-metier="ep"` | 8 | `comptines`, `echauffements`, `enigmes`, `intervention-groupe`, `olympiades-scolaires`, `performances`, `plan-b-meteo`, `planificateur` |
| **`data-metier="eps"`** | **1** | **`studio-jeu` — valeur invalide, voir §6** |
| **aucun attribut** | **20** | `acrosport`, `agenda`, `colorier`, `cours-maternelle`, `educatifs`, `evaluation`, `generateur`, `grille`, `jeux`, `moyens-action`, `musique`, `nba-playoffs`, `nhl-playoffs`, `omnigroupe`, `planification`, `sae`, `scoreboard`, `suppleance`, `tni`, `transitions` |

**26 apps sur 46 ont un métier. Les 20 autres n'en ont pas** — et ce n'est pas un oubli : ce sont majoritairement les grosses apps transversales (`jeux`, `sae`, `educatifs`, `generateur`) qui servent les trois métiers à la fois.

## 5. Le système parallèle du planificateur

`apps/planificateur/semaine-grid.js` définit **sa propre** `setMetier`, sans lien avec celle de `zts.js` :

```js
function setMetier(m){
  metier = m;
  root.dataset.metier = m;          // ← sur le conteneur, pas sur <body>
  modal.dataset.metier = m;
  localStorage.setItem(ns('metier'), m);   // ← persiste, contrairement à ZTS.setMetier
}
```

Lue au démarrage : `let metier = opts.metier || localStorage.getItem(ns('metier')) || 'ep'` (`semaine-grid.js:205`). Pilotée par un sélecteur maison `.metier-sw`.

C'est un deuxième système, avec persistance, sur un autre nœud, dans un autre namespace. Il fonctionne aujourd'hui. **Le shell ne doit ni le remplacer ni le synchroniser** — `planificateur` est de toute façon en dernière vague.

## 6. Trois pièges à connaître avant de brancher le sélecteur

### 6.1 `data-metier="eps"` est une valeur morte en production

`apps/studio-jeu/index.html` porte `data-metier="eps"`. `shared/zts.css:75-77` ne connaît que `ep`, `sdg`, `camp`. La page perd donc silencieusement sa variable `--metier` et retombe sur le défaut cyan. C'est un bug existant, **antérieur au chantier** — je le signale, je ne le corrige pas. `studio-jeu` passe de toute façon en densité `projection`.

### 6.2 Poser `data-metier` sur une app qui n'en a pas **change son fond de page**

`shared/zts.css:83-97` — les règles sont conditionnées à la **présence** de l'attribut, pas à sa valeur :

```css
body[data-metier] { background: transparent; }
body[data-metier]::before { /* photo de gymnase, inset:0, fixed, z-index:-3, opacity:.45 */ }
body[data-metier]::after  { /* voile crème, inset:0, fixed, z-index:-2 */ }
```

Sur les **20 apps sans métier**, un sélecteur qui appellerait `ZTS.setMetier('ep')` rendrait `body` transparent et poserait par-dessus une photo de gymnase et un voile crème. Sur `tni` (canvas plein cadre), `omnigroupe` (canvas de dessin) ou `transitions` (plan de gym), c'est un changement visuel majeur, pas un habillage.

**À l'inverse**, sur les 26 apps qui ont déjà un métier, changer `ep` → `sdg` ne touche **pas** le fond (mêmes règles, même image) : seule `--metier` bascule, et avec elle les teintes d'accent. C'est sans danger.

### 6.3 `injectPerso` ne s'exécute qu'au chargement, et en opt-in strict

`shared/zts.js:135-137` :
```js
if (!b.classList.contains('has-perso')) return;   // opt-in strict
if (!b.getAttribute('data-metier')) return;        // besoin d'un métier actif
```

Une seule app dans tout le dépôt porte `has-perso` : **`performances`**. Le personnage par métier est donc quasi inexistant côté apps.

Bonne nouvelle : le div `.zts-perso` est stylé par `body[data-metier="x"] .zts-perso`, donc si l'attribut change en direct, **l'image du personnage suit** (c'est du CSS pur). Le commentaire « aucun MutationObserver » porte sur l'injection du div, pas sur son apparence.

Mauvaise nouvelle : si le shell pose un métier sur une app qui n'en avait pas, `injectPerso` a déjà tourné et rendu la main — le div ne sera jamais créé. Sans conséquence, sauf sur `performances` qui a déjà son métier.

## 7. Recommandation

Le concept de métier **existe**, mais il est statique, non persistant, et absent de 20 apps. Le sélecteur de la maquette suppose l'inverse : dynamique, persistant, universel. L'écart est réel et il faut le trancher.

**Ma recommandation, en trois points :**

1. **`ZTSShell` appelle `ZTS.setMetier`, jamais autre chose.** Conforme à l'addendum §B2. Une seule ligne : `window.ZTS?.setMetier?.(cle)`, avec chaînage optionnel pour les 3 apps qui ne chargent pas `zts.js` (`acrosport`, `evaluation`, `studio-jeu`).

2. **Le sélecteur n'apparaît que sur les 26 apps qui ont déjà un métier.** Sur les 20 autres, `ZTSShell.monter()` le rend absent. Ça évite d'un coup le piège 6.2, et ça reflète la vérité du système : `sae` et `jeux` servent les trois métiers, un sélecteur y serait un mensonge.

3. **La persistance est un ajout, pas un habillage.** Si vous voulez qu'un choix de métier suive Joey d'une app à l'autre, il faut une clé `zts:metier` et une lecture au démarrage dans `shared/zts.js` — c'est une fonctionnalité, avec ses questions propres (quel métier gagne : l'attribut HTML de la page, ou la préférence stockée ?). **Je recommande de ne rien persister en phase 1** : le sélecteur pose l'attribut, émet `zts:metier-change`, et rien de plus. Aucune app ne souscrit à l'événement tant que vous n'avez pas donné un GO app par app, exactement comme le prompt d'origine l'exige.

Si vous préférez la persistance dès la phase 1, dites-le — mais alors la règle de préséance (page vs préférence) doit être tranchée avant que j'écrive une ligne, parce qu'elle décide du comportement des 26 apps qui portent déjà un métier en dur.
