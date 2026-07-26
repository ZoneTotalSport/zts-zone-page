# PRESCAN — Habillage shell ZTS

**Date** : 25 juillet 2026
**Repo** : `ZoneTotalSport/zts-zone-page` → `/Users/admin/Desktop/Remotion 2/wix-deploy/` (branche `main`)
**Maquette de référence** : `/Users/admin/Downloads/zts-final-marine.html` (553 lignes)
**Phase** : 0 — lecture seule. Aucun fichier d'app touché, aucun commit.

---

## 0. Résumé exécutif

46 apps scannées sous `apps/` (le dossier `_archive` est exclu). Elles se répartissent en deux familles très inégales :

| Famille | Nb | Description | Risque moyen |
|---|---|---|---|
| **Gabarit partagé** | 23 | ~190 lignes, tout inline, `shared/zts.css` + `shared/zts.js` + `zts-gate.js`. Structure identique. | 1 |
| **Apps custom** | 23 | Chacune son CSS/JS, entre 300 et 20 000 lignes. Deux sont des builds Vite. | 2 à 3 |

**Le prescan a trouvé quatre blocages qui doivent être réglés avant d'écrire une ligne de shell.** Ils ne sont pas dans la liste des six collisions du prompt, et trois d'entre eux invalident des choix de nommage qui, appliqués tels quels, casseraient des apps en production.

### Les quatre blocages

**B1 — Le namespace `zts-` est déjà pris, et il est massivement utilisé.**
`shared/zts.css` définit déjà ~70 classes `.zts-*` (`.zts-btn`, `.zts-card`, `.zts-modal`, `.zts-grid`, `.zts-container`, `.zts-header`…) utilisées par les 23 apps du gabarit et par une bonne partie des apps custom. La règle du prompt — « styler uniquement les éléments qui portent une classe `zts-` » — reviendrait à styler le design system existant. Il faut un préfixe distinct. Ma recommandation : **`ztsh-`** (h = habillage/shell).

**B2 — `window.ZTS` est déjà occupé par une autre API.**
`shared/zts.js:229` expose `window.ZTS = { t, setLang, getLang, applyI18n, openModal, closeModal, setMetier, countUp, paths }`. Ces méthodes sont appelées par presque toutes les apps (`ZTS.getLang()`, `ZTS.openModal()`). Déclarer un nouveau `ZTS.monter()` par-dessus écraserait l'objet et casserait l'i18n et les modales de ~35 apps d'un coup. Il faut soit **`window.ZTSShell.monter()`**, soit greffer sur l'existant sans réassigner : `window.ZTS.shell = {…}`. Ma recommandation : `ZTSShell`, pour que le shell reste totalement indépendant du design system.

**B3 — Un header fixe existe déjà sur 43 apps sur 46, et le shell en propose un deuxième.**
`shared/zts-header.css:29` : `.zts-header { position:fixed; top:0; z-index:200 }`, injecté par `zts.js` via `<div data-zts-header>` sur **43 apps** (les 3 exceptions sont `acrosport`, `evaluation`, `studio-jeu`). Le shell de la maquette ajoute sa propre `.topbar` (logo + nav + bouton utilisateur) en flux normal. Résultat sur ces 43 apps : deux barres de navigation superposées, et la topbar du shell passe **sous** le header existant (z-index shell 100–199 < 200). Cela viole aussi directement le critère de phase 4 « aucune app n'apparaît deux fois dans la navigation ». Décision requise avant la phase 1 : la topbar et le sélecteur de métier du shell doivent-ils **remplacer** `data-zts-header`, ou le shell se limite-t-il au rail + encourageur + pause café dans les apps ? (Ma recommandation en §7.)

**B4 — `apps/evaluation/` impose ses polices en `!important` sur `*`.**
`apps/evaluation/index.html:40` : `*, body, button, input, select, textarea, p, span, div, td, th, li, a, label { font-family:'Patrick Hand', cursive !important }` — plus `html { font-size:23px }`. Le shell y perdrait Luckiest Guy, Bangers et Nunito sur tous ses éléments, et le prompt lui interdit d'utiliser `!important` pour se défendre. Trois issues possibles, toutes à arbitrer : exempter `evaluation` du shell, autoriser une exception `!important` documentée sur ce seul fichier, ou modifier l'app (interdit par le contrat). Détail en §4.

---

## 1. Méthode

Analyse statique de tous les `.html`, `.js`, `.css` sous `apps/` (hors `node_modules`), plus les scripts globaux chargés en `/` (`zts-lock-page.js`, `zts-locked-fullscreen.js`, `zts-funnel.js`, `firebase-auth.js`, `zts-ultra.css`) et le design system `shared/`.

Extraction par app : `id` et classes (dans le HTML **et** dans le CSS et le JS générateur de DOM), `z-index > 40`, clés de stockage, polices, éléments `position:fixed` à moins de 90 px du bord droit, contrôles interactifs, appels réseau, accès Firebase, glisser-déposer, raccourcis clavier, canvas, exports, impression.

Le trafic réel n'est pas mesurable ici (GA4 non interrogeable hors session interactive). J'utilise le **nombre de pages du site qui lient vers l'app** comme approximation de visibilité, ce qui suffit pour ordonner les vagues.

---

## 2. Les six collisions du prompt, réévaluées

### 2.1 CSS global — **plus grave que prévu**

La maquette pose `*{box-sizing:border-box;margin:0;padding:0}` et des sélecteurs de type nus (`button`, `.card h3`, `.card p`). Deux constats :

- `shared/zts.css:177` pose **déjà** `*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}`. Les 26 apps qui le chargent l'absorbent donc sans dommage.
- Mais **2 apps ne chargent aucun CSS partagé** (ni `shared/zts.css`, ni `zts-header.css`, ni `zts-ultra.css`) : **`acrosport`** et **`studio-jeu`**. Le reset les toucherait pour la première fois.
- Et **11 apps chargent `https://cdn.tailwindcss.com`** (Tailwind Play CDN) : `acrosport`, `agenda`, `educatifs`, `evaluation`, `jeux`, `moyens-action`, `musique`, `omnigroupe`, `sae`, `suppleance`, `transitions`. Ce CDN génère du CSS à la volée en observant le DOM. Le shell qui injecte du DOM après son boot déclenchera un recalcul Tailwind — pas de casse attendue, mais un coût perf à mesurer sur le pilote.

**Conséquence directe** : la maquette utilise `.grid`, `.card`, `.btn`, `.hero`, `.wrap`, `.info`, `.sub`, `.tag`, `.logo`, `.cta`, `.titre`, `.src`, `.metier`, `.halftone`, `.tags` — **toutes des classes non préfixées**. `.grid` est en plus un utilitaire Tailwind (`display:grid`). Scan des collisions réelles :

| App | Classes de la maquette déjà utilisées |
|---|---|
| `sae` | `grid`, `hero`, `info`, `tag`, `titre` |
| `jeux` | `cta`, `hero`, `logo`, `tag`, `wrap` |
| `educatifs` | `grid`, `hero`, `info`, `sub`, `tag` |
| `cours-maternelle` | `btn`, `grid`, `hero`, `wrap` |
| `planificateur` | `btn`, `grid`, `metier`, `titre` |
| `moyens-action` | `grid`, `hero`, `tag`, `tags` |
| `studio-jeu` | `btn`, `card`, `src` |
| `grille` | `btn`, `grid`, `hero` |
| `acrosport` | `grid`, `halftone`, `src` |
| `omnigroupe` | `grid`, `titre` |
| `transitions` | `grid`, `src` |
| `musique` | `grid`, `hero` |
| `agenda`, `scoreboard`, `suppleance` | `grid` |
| `evaluation` | `hero` |
| `generateur` | `titre` |
| `nba-playoffs` | `logo` |
| `performances` | `tags` |

**19 apps sur 46.** Verdict : **tout préfixer en `ztsh-`, sans exception, y compris les classes internes** (`.ztsh-casier`, `.ztsh-outil`, `.ztsh-bulle`…). Le `box-sizing` va sur `.ztsh-shell *`, jamais sur `*`.

### 2.2 Collisions d'`id` — **aucune, mais à verrouiller quand même**

Bonne nouvelle : aucune des 46 apps n'utilise `bulle`, `bulleTxt`, `plateau`, `btnCafe`, `persoEnc`, `persoHero`, `heroSub`, `heroCri`, `cafeTxt`, `cafeGenre`, `cafeSrc`. Le champ est libre aujourd'hui. Il faut quand même préfixer (`ztsh-bulle`, `ztsh-plateau`…) : ces noms sont assez génériques pour qu'une app future les reprenne, et le coût du préfixe est nul.

### 2.3 Empilement `z-index` — **l'échelle proposée est trop basse**

Recensement de tout ce qui existe déjà au-dessus de 40 :

| Couche | `z-index` | Source |
|---|---|---|
| Overlay page verrouillée | **99999** | `zts-lock-page.js:63` (+ `body.style.overflow='hidden'`) |
| Overlay plein écran verrouillé | **99998** | `zts-locked-fullscreen.js:19` |
| Gate d'authentification | **99999** | `shared/zts-gate.js:65` |
| Bouton « déconnexion » du gate | **9998** | `shared/zts-gate.js:91` — `position:fixed; right:12px; bottom:12px` |
| Header partagé | **200** | `shared/zts-header.css:29` |
| Apps (max relevés) | jusqu'à **100001** | `generateur`, `agenda`, `educatifs`, `grille`, `jeux`, `musique`, `sae`, `scoreboard`, `suppleance`, `tni`, `transitions`, `evaluation`, `planificateur` |

Détail par app (valeurs > 40, les 4 plus hautes) :

| App | z-index relevés |
|---|---|
| `generateur` | 100001, 100000, 200, 100 |
| `agenda`, `educatifs`, `grille`, `jeux`, `musique`, `sae`, `scoreboard`, `suppleance`, `tni`, `transitions`, `evaluation`, `planificateur` | 100000 puis 99999 / 10000 / 9999 / 8000 / 5000 / 3000 / 2000 / 1000 / 500 / 400 / 300 / 200 / 100 |
| `acrosport` | 2000, 1001, 1000, 900 |
| `cours-maternelle` | 9999, 100, 80 |
| `moyens-action` | 9999, 1000 |
| `nba-playoffs`, `nhl-playoffs` | 9999, 1000, 200, 100 |
| `studio-jeu` | 9999, 100, 90, 60 |
| `performances` | 500, 400, 390 |
| 23 apps du gabarit | *aucun* |

L'échelle du prompt (chrome shell 100–199) place le shell **sous le header existant (200)** et sous la moitié des panneaux d'app. Échelle recommandée à documenter dans le shell :

```
0–199      contenu et panneaux d'app
200        header partagé existant (.zts-header) — NE PAS TOUCHER
300–399    chrome du shell  ← nouvelle réservation
1000–99997 modales et overlays d'app
99998+     gates et verrous (zts-lock-page, zts-locked-fullscreen, zts-gate)
```

Le shell à 300–399 passe au-dessus du header et des panneaux courants, et reste sous les modales et sous les verrous — ce qui est le comportement voulu : quand une page est verrouillée, le rail ne doit pas flotter par-dessus le mur de paiement.

### 2.4 Recouvrement physique — **7 apps concernées**

Éléments `position:fixed` à moins de 90 px du bord droit, qui seraient masqués par le rail (70 px de large, `right:14px`) :

| App | Élément | Position |
|---|---|---|
| `planificateur` | `.pv2-drawer` (tiroir jeux) | `right:4vw` |
| `planificateur` | `.pv2-tbibtn` (bouton mode TBI) | `right:14px` |
| `planificateur` | `#ztsExitFs` (sortie plein écran) | `right:14px` |
| `planificateur` | `.p-perso` (bulle Mr Root) | `right:12px` |
| `nba-playoffs` | `.zoom-controls` (zoom TNI) | `right:12px` |
| `nhl-playoffs` | `.zoom-controls` (zoom TNI) | `right:12px` |
| `generateur` | `.zts-zoom` (barre zoom verticale) | `right:16px` |
| `agenda` | `.cal-mascot-float` | `right:20px` |
| `performances` | `.pf-helpbtn` | `right:18px` |
| **23 apps du gabarit** | `.ztg-out` (bouton déconnexion du gate) | `right:12px; bottom:12px; z-index:9998` |

`.ztg-out` est le cas le plus large : présent sur les 23 apps du gabarit, et à `z-index:9998` il passera **par-dessus** le rail du shell. Il faudra soit décaler le rail, soit décaler `.ztg-out` — ce dernier vit dans `shared/zts-gate.js`, un fichier partagé, donc modifiable une seule fois pour les 23 apps sans toucher au code des apps elles-mêmes. C'est la seule modification hors-shell que je recommande d'autoriser.

La variable `--ztsh-marge-droite` doit être exposée, et **le repli du rail en ruban horizontal doit être le comportement par défaut en densité `travail`**, pas seulement sous 1200 px. Sur `planificateur` et les deux playoffs, un rail vertical est incompatible avec l'app, point.

### 2.5 Polices — **une erreur de chemin dans la maquette**

La maquette écrit :
```css
@font-face{font-family:'ZoneTotalSport';src:url('/fonts/zonetotalsport.ttf') format('truetype');font-display:swap}
```

Le fichier réel est **`/fonts/ZoneTotalSport.ttf`** (majuscules). Cloudflare Pages est sensible à la casse → **404 systématique**. De plus, l'usage établi partout dans le repo (`index-old.html:193`, `apps/generateur/index.html`) ajoute deux propriétés que la maquette omet :

```css
@font-face{
  font-family:'ZoneTotalSport';
  src:url('/fonts/ZoneTotalSport.ttf') format('truetype');
  font-display:swap;
  size-adjust:50%;                 /* ← la police rend 2× trop gros sans ça */
  unicode-range:U+0020-007E;       /* ← la police ne couvre pas les accents */
}
```

Sans `size-adjust:50%`, tous les logos du shell seront deux fois trop gros. Sans `unicode-range`, les accents français tomberont dans un fallback illisible. **Les deux sont obligatoires.**

Chargement Google Fonts : 44 apps sur 46 chargent déjà `Luckiest Guy`, 43 chargent `Bangers`. Le shell ne doit **pas** ajouter un second `<link>` Google Fonts sur ces apps — doublon de requête. En revanche `Nunito` n'est chargé que par 2 apps (`educatifs`, `tni`) et `Schoolbell` par 8. Recommandation : le shell charge **une seule requête Google Fonts consolidée**, en `<link>` unique, et n'applique ses familles qu'à `.ztsh-*`. La `--ztsh-f-corps` doit rester purement locale au shell : `agenda`, `colorier`, `generateur` utilisent Inter, `evaluation` force Patrick Hand, `cours-maternelle` charge 6 `@font-face` locaux — aucune ne doit changer d'apparence.

Polices auto-hébergées existantes à ne pas dupliquer : `ZoneTotalSport.ttf` (4 copies dans le repo : `/fonts/`, `apps/jeux/`, `apps/moyens-action/`, `apps/nhl-playoffs/fonts/`), plus 6 TTF dans `apps/cours-maternelle/`, `apps/omnigroupe/`, `apps/nba-playoffs/`.

### 2.6 Stockage et réseau — **le préfixe `zts:` est libre, la route café n'existe pas**

**Stockage.** Aucune app n'utilise le préfixe `zts:` (deux-points). Les préfixes en usage sont `zts_` et `zts-` (tiret/underscore) : `zts-lang`, `zts_anon_count_v1`, `zts_signup_source`, `zts_my_playlist`, `zts_nba_zoom`, `zts_nhl_zoom`, `zts_chrono_record`, `zts_mat_welcome`, `zts-studio-*`. **`zts:` est donc utilisable sans risque**, et suffisamment distinct pour qu'un `Object.keys(localStorage).filter(k=>k.startsWith('zts:'))` ne ramasse jamais une clé d'app. Inventaire complet par app en §4.

**Réseau.** La maquette suppose `POST https://api.zonetotalsport.ca/pause-cafe`. **Cette route n'existe pas.** Le worker `zts-generateur` (`cf-worker/generateur/src/generateur-worker.js`, route `api.zonetotalsport.ca` en `custom_domain`) sert exclusivement : `/health`, `/generate`, `/nutrition`, `/steps`, `/food-search`, `/nutrition-photo`, `/generations`, `/migrate-anon-generation`, `/generation/:id`. Trois choses à régler avant que la pause café fonctionne — détail en §7.

---

## 3. Quatre collisions supplémentaires, absentes du prompt

### 3.1 L'impression — **10 apps concernées**

Il faut distinguer deux mécanismes, et un seul est dangereux.

**Impression de la page courante** — `window.print()` sur la page elle-même. **10 apps** : `acrosport`, `colorier` (repli si jsPDF absent), `educatifs`, `generateur`, `journee-pedago`, `olympiades`, `planificateur`, `planification`, `rallyes`, `sae`. Ces impressions produisent des fiches que Joey distribue à des élèves.

**Impression via `window.open()`** — l'app construit un document HTML neuf dans un onglet séparé, puis l'imprime. **4 apps** : `cours-maternelle` (`app.js:545`), `jeux` (`app.js:1065`), `transitions` (`index.html:877`), `evaluation` (`app.js:1702`). **Le shell n'est pas dans cette fenêtre — aucun risque.**

Sans règle dédiée, sur les 10 premières, le rail fixe, l'encourageur et le bouton pause café **apparaîtront sur chaque feuille imprimée**. 16 apps ont déjà leurs propres règles `@media print`, mais aucune ne connaît le shell. Le shell doit donc contenir, dès la phase 1 :

```css
@media print { .ztsh-shell, [class^="ztsh-"], [class*=" ztsh-"] { display:none } }
```

C'est le seul cas où un sélecteur d'attribut large est justifié : il est borné au préfixe du shell.

### 3.2 Les raccourcis clavier à touche unique — **6 apps concernées**

| App | Touches captées sur `document` |
|---|---|
| `tni` | `d`, `e`, `f`, `g`, `m`, `s`, `z`, `Escape` |
| `studio-jeu` | `c`, `C`, `p`, `P`, `Delete`, `Backspace`, `←`, `→`, `Enter`, `Escape` |
| `generateur`, `nba-playoffs`, `nhl-playoffs` | `+`, `−`, `0`, `=`, `Escape` |
| `acrosport` | `←`, `→`, `Escape` |

Le risque va dans le sens inverse de celui décrit dans le prompt : ce n'est pas le shell qui capture, c'est **l'app qui capture ce qui se passe dans le shell**. Un champ de saisie dans le shell (aucun n'est prévu aujourd'hui, mais le sélecteur de métier est focusable) transmettrait ses frappes à l'app. Le shell doit donc, sur ses propres éléments seulement, poser un `keydown` qui `stopPropagation()` — **ce que le contrat interdit explicitement**. Arbitrage nécessaire : je propose d'autoriser `stopPropagation` uniquement sur les événements **originés d'un nœud `.ztsh-*`** (`e.target.closest('.ztsh-shell')`), ce qui ne bloque jamais un événement de l'app.

### 3.3 Le mode plein écran — **4 apps concernées**

`acrosport` (3 appels), `studio-jeu` (4), `tni` (2), `planificateur` (`#ztsExitFs`). Si l'app passe **un élément** en plein écran, le shell disparaît (correct). Si elle passe `document.documentElement`, le shell reste visible par-dessus le contenu projeté au TNI — inacceptable en classe. À vérifier élément par élément lors de la migration, et à couvrir par une règle `:fullscreen .ztsh-shell{display:none}`.

### 3.4 Les deux builds Vite — **le contrat ne s'y applique pas**

`apps/scoreboard/` et `apps/evaluation/` sont des sorties de build : `index.html` minimal + `assets/index-<hash>.js`. Le source de `scoreboard` est `/Users/admin/Desktop/Remotion 2/scoreboard-basketball/` (Vite). Le source d'`evaluation` **n'est pas dans ce repo**.

Conséquences :
- Ajouter les balises du shell dans `apps/scoreboard/index.html` serait **écrasé au prochain build**. Il faut modifier `scoreboard-basketball/index.html` puis rebuilder — ce qui change le hash du bundle et fait exploser le « diff sous 30 lignes ».
- Pour `evaluation`, sans le source, toute modification de `index.html` sera perdue au prochain build de qui que ce soit.

**Recommandation : sortir `scoreboard` et `evaluation` du chantier d'habillage**, et les traiter comme un lot séparé une fois la question du source d'`evaluation` réglée.

---

## 4. Fiches par app

### 4.A — Famille « gabarit partagé » (23 apps, risque 1)

**Fiche commune.** Toutes ces apps sont structurellement identiques.

- **Chemin** : `apps/<slug>/index.html` — fichier unique, ~175 à 231 lignes, 9 à 15 Ko.
- **URL servie** : `https://zonetotalsport.ca/apps/<slug>/` (canonical confirmé dans chaque fichier).
- **Densité recommandée** : `vitrine` — ce sont des banques de contenu qu'on consulte, pas des outils qu'on pilote pendant un cours.
- **CSS** : `shared/zts.css` (fichier propre) + un `<style>` inline de ~18 lignes pour les classes locales préfixées (`jr-`, `cc-`, `ol-`, `nc-`, `rl-`, `rr-`, `jp-`).
- **JS** : aucun fichier propre. `shared/zts.js` + `shared/zts-gate.js` + un `<script>` inline de 60 à 120 lignes.
- **`id` racine** : 9 à 14 par app, tous préfixés par 2 lettres locales (`jrSearch`, `jrGrid`, `jrModal`, `ccSearch`, `olNew`…). **Zéro collision** avec le shell.
- **Classes** : `zts-container`, `zts-grid`, `zts-app-card`, `zts-modal`, `zts-metier-banner`, `zts-subnav` + classes locales préfixées. **Zéro collision** avec le shell.
- **`z-index > 40`** : **aucun**, dans les 23.
- **Stockage local** : **aucun**, dans les 23.
- **Polices** : un seul `<link>` Google Fonts — `Luckiest Guy`, `Bangers`, `Fredoka`, `Quicksand`, `Caveat`. Aucun `@font-face` local.
- **Contrôles à moins de 90 px du bord droit** : `.ztg-out` (bouton déconnexion, injecté par `zts-gate.js`) à `right:12px; bottom:12px; z-index:9998`. **Le seul point de friction physique.**
- **Réseau** : aucun `fetch`. Données en dur dans le `<script>` inline.
- **Firebase** : `zts-gate.js` uniquement (contrôle d'accès). Aucune écriture Firestore.
- **Risque : 1.** Justification : fichier unique, pas de CSS global propre, pas de z-index, pas de stockage, pas de réseau, pas de canvas, pas de glisser-déposer, pas de raccourci clavier. C'est le terrain d'essai idéal.

**Inventaire fonctionnel — variante « filtre + modale » (17 apps)**
`activites-duree`, `bricolages`, `brise-glace`, `comptines`, `echauffements`, `enigmes`, `grands-jeux`, `intervention-groupe`, `jeux-calmes`, `jeux-eau`, `jeux-par-theme`, `jeux-rapides`, `olympiades-scolaires`, `plan-b-meteo`, `plan-b-pluie`, `sos-conflits`, `veillee-feu-de-camp`

À rejouer, dans cet ordre, sur chacune :
1. La page charge, le gabarit s'affiche, le compteur d'éléments est cohérent.
2. Le champ de recherche filtre en direct (`oninput`).
3. Chaque puce de filtre bascule et se marque `active`.
4. La combinaison recherche + 2 puces filtre correctement.
5. Un filtre sans résultat affiche le message vide.
6. Un clic sur une carte ouvre la modale ; le contenu correspond.
7. `Entrée` sur une carte au clavier ouvre la modale.
8. Le bouton ✕ et `Escape` ferment la modale.
9. Le bascule FR/EN du header retraduit **tout**, y compris les puces déjà actives et le contenu de la modale.
10. Les liens de sous-navigation (retour métier, retour accueil) pointent juste.
11. Le bouton de déconnexion `.ztg-out` reste cliquable.
12. Console : zéro erreur.

**Inventaire fonctionnel — variantes particulières (6 apps)**

| App | Métier | Fonctions à rejouer en plus |
|---|---|---|
| `chansons-camp` | camp | Recherche `ccSearch`, 2 séries de puces (`fE`, `fT`), modale `ccOpen`. Pas de filtre durée. |
| `journee-pedago` | sdg | `<select>` de thème → `jpFill()` ; bouton **Surprise** → tirage aléatoire ; bouton **Imprimer** → `window.print()` ; un `<select>` + un dé par bloc, qui recomposent la journée. **Pas de modale.** |
| `noms-de-clans` | camp | Puces de thème → `ncStatic()` ; bouton **Générer** → `ncGen()` produit une liste de noms. **Pas de modale, pas de recherche.** |
| `olympiades` | camp | Champ `olNew` + **Ajouter** ; renommage inline d'une équipe (`oninput`) ; boutons de points `+1 / +3 / +5 / −1` ; suppression d'équipe ; **Réinitialiser** ; **Imprimer** ; recalcul du podium. **État en mémoire, perdu au rechargement — comportement actuel, à ne pas « corriger ».** |
| `rallyes` | camp | `<select>` nombre de stations ; **Générer** → `rlGen()` ; modale de station ; **Imprimer**. |
| `roue-responsabilites` | sdg | `<textarea>` d'items → `rrBuild()` en direct ; 4 boutons de préréglage ; **Tourner** (`rrSpin`, animation) ; **Démarrer** / **Réinitialiser** ; affichage du résultat. |

`planification` (24ᵉ app de la famille, légèrement plus grosse) : 745 lignes HTML + 410 lignes JS, 9 modales, 3 sous-navigations, `<input type="search">`, données dans `data/`. Aucun z-index, aucun stockage. **Risque 1**, mais à traiter en fin de vague 1 plutôt qu'en tête.

---

### 4.B — Apps custom (23 apps)

> Légende : **Densité** = `vitrine` (on consulte) ou `travail` (on pilote pendant un cours, souvent au TNI).

#### `acrosport` — risque 2
- **Chemin** `apps/acrosport/index.html` (2 079 lignes, 152 Ko) · **URL** `/apps/acrosport/` · **Non déployée, 1 lien entrant** · **Densité** `travail`
- **CSS/JS** : tout inline. **Aucun CSS partagé chargé** — Tailwind CDN + Lucide seulement.
- **z-index** : 2000, 1001, 1000, 900
- **Classes en collision** : `grid`, `halftone`, `src`
- **Variables en collision** : `--ink`
- **Stockage** : `acro_favs`
- **Polices** : `DynaPuff`, `Luckiest Guy` (Google Fonts)
- **Fixed droite < 90 px** : aucun
- **Fonctions à rejouer** : 7 onglets (Accueil, Échauffement, Rôles, Figures, Sécurité, Vidéos, Quiz) · bascule FR/EN · 5 niveaux de statue (Solo→Extrême) · minuteur 10 s / 1 / 2 / 3 min · lancer de dé · sélecteur 1-5+ participants · sélecteur de cycle · **Projeter** (plein écran, 3 appels) · **Imprimer** · **Vider** (favoris `acro_favs`) · navigation ‹ › · `Escape` ferme · 93 `onclick` inline.
- **Risque 2** : pas de CSS partagé (le reset la toucherait pour la première fois), plein écran, impression, et une classe `halftone` qui porte le même nom qu'un calque de fond du shell.

#### `agenda` — risque 3
- **Chemin** `apps/agenda/` (654 HTML + 1 645 JS + 1 150 CSS, 161 Ko) · **URL** `/apps/agenda/` · **Densité** `travail`
- **CSS** : `style.css` propre + `shared/zts-header.css` + Tailwind CDN. **Pas de `shared/zts.css`.**
- **z-index** : **100000**, 9999, 999, 100
- **Classes en collision** : `grid` · **Variables** : `--cyan`, `--orange`
- **Stockage** : `agenda_events`, `agenda_global_notes`, `agenda_lang`, `agenda_periods`, `agenda_pres_seen`, `agenda_weekly` — **6 clés, données réelles de Joey**
- **Fixed droite** : `.cal-mascot-float` à `right:20px`
- **Globaux** : `ZTS_LANDING_CONFIG`, `deleteHebdoBlock`, `openSeqModal`, `updateHebdoDayStatus`, `ztsHideLanding`, `ztsResetLanding`, `ztsShowLanding`
- **Fonctions à rejouer** : navigation mois « / » · 5 `<select>` · 5 champs texte + 1 nombre + 1 date · **Enregistrer** · **Ajouter** · éditeur riche (Gras, Italique, Liste) · **Valider & fermer** · 21 points de modale · blocs hebdo (création, suppression, changement de statut) · persistance des 6 clés après rechargement · bascule de langue.
- **Risque 3** : 6 clés de stockage portant des données réelles, z-index à 100000, mascotte flottante à droite, Firebase chargé.

#### `colorier` — risque 2
- **Chemin** `apps/colorier/` (277 + 408 JS + 313 CSS, 44 Ko) · **URL** `/apps/colorier/` · **Densité** `vitrine`
- **CSS** : `zts-ultra.css` + `zts-header.css` + `styles.css`. Pas de `shared/zts.css`.
- **z-index** : aucun > 40 · **Collisions** : aucune
- **Stockage** : aucun · **Polices** : Inter, Luckiest Guy, Patrick Hand
- **Fonctions à rejouer** : champ de thème · `<select>` × 2 · curseur (`range`) · case à cocher · sélecteur de couleur · **Générer** (2 `fetch` vers le worker `colorier`) · **Réessayer** · rendu canvas (2) · export PDF via jsPDF · **Imprimer** (3 appels) · téléchargement PNG.
- **Risque 2** : dépend d'un worker Cloudflare qui, d'après le journal projet, **n'a pas encore sa clé Gemini** — vérifier que l'app est fonctionnelle avant de l'habiller, sinon le test de non-régression est vide de sens.

#### `cours-maternelle` — risque 3
- **Chemin** `apps/cours-maternelle/` (3 624 HTML + **19 747 JS**, 1,16 Mo) · **URL** `/apps/cours-maternelle/` · **9 liens entrants** · **Densité** `travail`
- **CSS** : `zts-header.css` + inline. Pas de `shared/zts.css`. Font Awesome CDN + confetti CDN.
- **z-index** : 9999, 100, 80
- **Classes en collision** : `btn`, `grid`, `hero`, `wrap` · **Variables** : `--ink`, `--ink-soft`
- **Stockage** : `zts_mat_welcome`
- **Polices** : **6 `@font-face` locaux** (Gloria Hallelujah, Kranky, Love Ya Like A Sister, Luckiest Guy, Swanky and Moo Moo, The Girl Next Door) + Bangers/Inter/Montserrat en Google Fonts
- **Globaux** : 14 fonctions sur `window` (`openCourseModal`, `renderTBIGrid`, `switchView`, `rollSurprise`, `toggleDoneCourse`, `toggleStep`, `unlock`…)
- **Fonctions à rejouer** : mode démo · 4 filtres de saison · 4 filtres de moment (Mise en train, Activité 1, Activité 2, Retour) · 7 durées (5→60) · **mode TBI** (bascule de grille complète) · modale de cours · cocher une étape · marquer un cours fait · surprise aléatoire · écran de bienvenue (`zts_mat_welcome`) · **Imprimer** (3) · 3 champs fichier + 3 courriels + 3 nombres · 119 `onclick` inline.
- **Risque 3** : 20 000 lignes de JS, 4 classes en collision dont `btn` et `wrap`, mode TBI plein cadre, 14 globaux.

#### `educatifs` — risque 3
- **Chemin** `apps/educatifs/` (371 + 2 760 JS + 3 219 CSS, 191 Ko) · **URL** `/apps/educatifs/` · **28 liens entrants — l'app la plus liée du site** · **Densité** `travail`
- **CSS** : `style.css` + `zts-ultra.css` + `zts-header.css` + Tailwind CDN
- **z-index** : **100000**, 9999, 1000, 200
- **Classes en collision** : `grid`, `hero`, `info`, `sub`, `tag` — **5, le maximum avec `sae`**
- **Stockage** : `favoris-educatifs`, `mon-cours-config`, `mon-cours-educatifs`, `zts-lang`
- **Réseau** : `fetch('data/educatifs/…')`
- **Fonctions à rejouer** : écran d'accueil **Commencer** · 4 `<select>` de filtre · 4 champs texte · **Favoris** · **Tout vider** · construction de « mon cours » (persistée) · **Imprimer** (4 appels) · **Sauvegarder PDF** · **Partager** · modale (122 points) · `Escape` · bascule FR/EN (`APP_TRANSLATIONS`) · canvas (1).
- **Risque 3** : app la plus visible du site, 5 collisions de classes, 4 clés de stockage, impression et export PDF.

#### `evaluation` (Carnet EPS) — risque 3, **build Vite, source absent**
- **Chemin** `apps/evaluation/` (`index.html` 94 lignes + `assets/index-BqzDoR3c.js` + `app.js` 2 188 lignes, 558 Ko) · **URL** `/apps/evaluation/` · **7 liens entrants** · **Densité** `travail`
- **CSS global de l'app** : `html{font-size:23px}` **et** `*, body, button, input, select, textarea, p, span, div, td, th, li, a, label { font-family:'Patrick Hand' !important }` → **blocage B4**
- **z-index** : **100000**, 400, 300, 200 · **Classes** : `hero` · **Variables** : `--cyan`, `--orange`
- **Stockage** : **24 clés** `carneteps-*` (`-data`, `-groups`, `-attendance`, `-photos`, `-pfeq`, `-schedule`, `-evalcolors`, `-profile`, `-voice`, `-zoom`…) — **le plus gros volume de données réelles du site**
- **Glisser-déposer** : 13 points · **Canvas** : 3 · **Export** : 10 · **Audio** : 1 (reconnaissance vocale)
- **Risque 3.** **Recommandation : exclure du chantier.** Sans le source Vite, toute balise ajoutée à `index.html` sera perdue au prochain build, et l'`!important` sur `*` rend le shell illisible de toute façon.

#### `generateur` (Générateur IA) — risque 3
- **Chemin** `apps/generateur/` (467 + 2 289 JS + 1 412 CSS, 171 Ko) · **URL** `/apps/generateur/` et **`https://ia.zonetotalsport.ca`** (projet Pages distinct `zts-zone-page`) · **Densité** `vitrine`
- **z-index** : **100001** (le plus haut du site), 100000, 200, 100
- **Classes** : `titre` · **Variables** : `--orange`
- **Stockage** : `zts_anon_count_v1`, `zts_signup_source` — **quota anonyme, ne pas perturber**
- **Fixed droite** : `.zts-zoom` à `right:16px` (barre de zoom verticale) — **collision frontale avec le rail**
- **Réseau** : 6 `fetch` vers `api.zonetotalsport.ca` (`/generate`, `/generations`, `/generation/:id`, `/migrate-anon-generation`)
- **Clavier** : `+`, `−`, `0`, `=`, `Escape`
- **Fonctions à rejouer** : formulaire de génération complet · quota anonyme (3/mois) · quota connecté (10/mois) · **Réessayer** · **Annuler** · édition inline de la fiche · export PDF (jsPDF) · favori · **Imprimer** (2) · zoom `+`/`−`/`⟲` · **Déconnexion** · modales (8).
- **Risque 3** : deux domaines servent la même app, quota en jeu, barre de zoom pile où va le rail.

#### `grille` (Grille horaire) — risque 3
- **Chemin** `apps/grille/` (693 + 266 JS + 493 CSS, 94 Ko) · **URL** `/apps/grille/` · **Densité** `travail`
- **z-index** : **100000**, 9999, 5000, 100
- **Classes en collision** : `btn`, `grid`, `hero` · **Variables** : `--cyan`, `--orange`
- **Stockage** : `gh2`, `gh_lang`
- **Fonctions à rejouer** : **Commencer** · **Comment utiliser** · onglets Spécialistes / Classes / Locaux · **Config** · **Auto** (placement automatique) · **Valider** (détection de conflits) · **PDF** (html2pdf) · **Vider** · ajout de période / récré / dîner / matière · édition ✏️ · **Sauvegarder** · 8 champs nombre + 8 texte + 2 heure + 1 case · 6 `<select>` · 54 `onclick` inline · bascule FR/EN.
- **Risque 3** : moteur de placement, détection de conflits, export PDF, 3 collisions de classes.

#### `jeux` (Banque de 1439 jeux) — risque 3
- **Chemin** `apps/jeux/` (962 + 2 109 JS + 3 918 CSS, 213 Ko) · **URL** `/apps/jeux/` · **Densité** `travail`
- **CSS** : `styles.css` + `zts-header.css` + Tailwind CDN
- **z-index** : **100000**, 9999, 3000, 2000
- **Classes en collision** : `cta`, `hero`, `logo`, `tag`, `wrap` — **5**
- **Variables** : `--cyan`, `--cyan-dark`, `--lime`, `--orange` — **4, dont `--cyan-dark` et `--lime` qui sont propres au shell**
- **Stockage** : `eps-favorites`, `eps-lang`, `eps-theme`, `zts-lang`
- **Polices** : 4 `@font-face` locaux (`ZoneTotalSport`, `Bangers`, `Barriecito`, `LuckiestGuyZTS`) + 9 familles Google
- **Réseau** : `fetch('data/jeux-merged.json')`
- **Fonctions à rejouer** : chargement des 1439 jeux · recherche · 6 `<select>` de filtre · filtres durée (≤15 / 15-20 / 20-30 / 30+) · compétences C1/C2/C3 · cycles 1/2/3 · matériel (Ballon, Frite, Cônes, Foulard, Tapis, Cerceaux, Dossards, Corde…) · minuteur (1/2/5/10/15/20 min, Démarrer / Pause / Réinitialiser) · favoris persistants · thème · modale de fiche (70 points) · **Imprimer** la fiche · `Escape` · FR/EN.
- **Risque 3** : 5 collisions de classes et 4 de variables — le plus haut total du site.

#### `moyens-action` — risque 2
- **Chemin** `apps/moyens-action/index.html` (1 000 lignes, 34 Ko) · **URL** `/apps/moyens-action/` · **7 liens entrants** · **Densité** `vitrine`
- **z-index** : 9999, 1000 · **Classes** : `grid`, `hero`, `tag`, `tags` · **Variables** : `--cyan`, `--jaune`
- **Stockage** : aucun · **Réseau** : `fetch('data.json')` + `daily.json`
- **Polices** : `ZoneTotalSport.ttf` local + `LuckiestGuyZTS` + 5 familles Google
- **Fonctions à rejouer** : grille des 10 moyens d'action · ouverture de la modale par moyen (11 points) · fermeture ✕ · `closeMoyen` global · contenu du jour (`daily.json`) · mode TBI.
- **Risque 2** : fichier unique de 1000 lignes, 4 collisions de classes, mais pas de stockage ni d'export.

#### `musique` — risque 2
- **Chemin** `apps/musique/` (237 + 1 017 JS + 921 CSS, 73 Ko) · **URL** `/apps/musique/` · **8 liens entrants** · **Densité** `vitrine`
- **z-index** : **100000**, 9999, 100 · **Classes** : `grid`, `hero` · **Variables** : `--orange`
- **Stockage** : `zts-lang`, `zts_my_playlist`
- **Fonctions à rejouer** : **Commencer** · 3 champs texte · **Jouer** (iframes YouTube) · **+ Ajouter** à la liste (persistée) · `Enter` valide · FR/EN.
- **Risque 2** : iframes YouTube — vérifier que le rail ne recouvre pas le lecteur.

#### `nba-playoffs` — risque 2
- **Chemin** `apps/nba-playoffs/index.html` (1 387 lignes, 64 Ko) · **URL** `/apps/nba-playoffs/` · **Densité** `travail` (TNI)
- **z-index** : 9999, 1000, 200, 100 · **Classes** : `logo` · **Variables** : `--orange`
- **Stockage** : `zts_nba_zoom` · **Polices** : 12 `@font-face` locaux + Inter
- **Fixed droite** : `.zoom-controls` à `right:12px` — **collision frontale avec le rail**
- **Fonctions à rejouer** : onglets Séries actuelles / Résultats / Meneurs · `fetch` API NBA (via proxy CORS, avec repli) · **Réessayer** · zoom `+` / `−` / `↺` persistant · modale de série (67 points) · `Escape` · raccourcis `+`, `−`, `0`, `=`.
- **Risque 2**, mais **le rail vertical est incompatible** : cette app est projetée au TNI en plein cadre.

#### `nhl-playoffs` — risque 2
Identique à `nba-playoffs` : 2 373 lignes, `zts_nhl_zoom`, `.zoom-controls` à `right:12px`, 13 `@font-face` locaux dont `ZoneTotalSport`, variables en collision `--cyan`, `--cyan-dark`, `--jaune`, `--orange` (**4**), modale 51 points. **Même verdict : rail en ruban obligatoire.**

#### `omnigroupe` — risque 3
- **Chemin** `apps/omnigroupe/` (2 449 HTML + 1 515 JS, 661 Ko) · **URL** `/apps/omnigroupe/` · **Densité** `travail`
- **CSS** : Tailwind CDN + `zts-header.css`, tout le reste inline. **Aucun `<link>` Google Fonts** — 5 `@font-face` locaux.
- **z-index** : **aucun > 40** (bonne surprise pour une app de cette taille)
- **Classes** : `grid`, `titre`
- **Stockage** : `ig-welcome-seen`, `og-emu-groups`, `og-eq-conflicts`, `og-lang`, `omni-journal`, `omni-seq` — **6 clés**
- **Canvas** : 3 · **Glisser-déposer** : 3 · **Export** : 3
- **Fonctions à rejouer** : 4 onglets · **SOS CRISE** / **CODE BLANC** · filtres de jeux (Tagues, Ballons, Parachute, Coop, Relais, Stratégie) · séquenceur de cours (Arrivée, Entrée, Routine, Activité, Retour au calme, Fin) · **canvas de dessin Bézier** (Effacer, Lisser, Sauvegarder le dessin, redimensionnement par poignée) · **Générer les équipes** (Élimination / Rotation, gestion des conflits) · **Exporter** / **Enregistrer** · journal · i18n FR/EN/ES/ZH · 110 `onclick` inline · 3 champs nombre + 3 texte + 1 recherche + 4 `<select>`.
- **Risque 3** : canvas de dessin avec poignées de redimensionnement — un rail fixe qui recouvre la zone de dessin casse l'outil. Densité `travail` obligatoire, rail en ruban.

#### `performances` — risque 2
- **Chemin** `apps/performances/` (384 + 446 JS, 47 Ko) · **URL** `/apps/performances/` · **Densité** `vitrine`
- **CSS** : `shared/zts.css` (une des 4 apps custom qui le charge proprement)
- **z-index** : 500, 400, 390 · **Classes** : `tags` · **Stockage** : `pf_drive`
- **Fixed droite** : `.pf-helpbtn` à `right:18px`
- **Fonctions à rejouer** : **Comment ça marche** · **Me connecter** (Firebase) · **Connecter mon Drive** (OAuth `drive.file`) · **Filmer** (capture vidéo) · **Importer une vidéo** · 6 `<select>` PFEQ · champ date · **Enregistrer la performance** (écriture Firestore `performances`, owner-only) · **Sauvegarder** · **Annuler** · `Escape`.
- **Risque 2** : OAuth Google Drive et écriture Firestore — un test de non-régression demande un vrai compte. À planifier avec Joey.

#### `planificateur` — risque 3, **le plus élevé du site**
- **Chemin** `apps/planificateur/` (823 HTML + **4 404 JS** répartis sur `app.js`, `app-v2.js`, `dataStore.js`, `tiroir-jeux.js`, `semaine-grid.js`, 331 Ko) · **URL** `/apps/planificateur/` (+ `?v2=1`) · **10 liens entrants** · **Densité** `travail`
- **CSS** : `shared/zts.css` · **JS** : `shared/zts.js` + `firebase-auth.js` + 5 fichiers propres
- **z-index** : **100000**, 99999, 400, 360
- **Classes en collision** : `btn`, `grid`, **`metier`**, `titre` — **`metier` est le nom du sélecteur de métier du shell, collision directe**
- **Variables en collision** : `--cyan`, `--ink`, `--jaune`, `--orange`, `--rose` — **5, le maximum du site**
- **Stockage** : `planif_role`, `planif_tbi`, `pv2school`
- **Fixed droite** : **4 éléments** — `.pv2-drawer` (`right:4vw`), `.pv2-tbibtn` (`right:14px`), `#ztsExitFs` (`right:14px`), `.p-perso` (`right:12px`)
- **Firestore** : écriture confirmée (`dataStore.js`) · **Audio** : 6 (minuterie, buzzer) · **Glisser-déposer** : 2 · **Canvas** : 2
- **Fonctions à rejouer** : tableau de bord d'accueil · anneau de présences · confettis · vue Jour (cases riches multi-lignes, médias glisser-déposer, copie de case complète) · vue Semaine (`semaine.html` : périodes/heures inline, activités, popup, minuterie, buzzer basket, marquage FAIT N&B) · calendrier → popup de présences · rôle animateur/coordo · **tiroir Jeux** (`.pv2-drawer`) · carnet d'évaluation iDoceo · minuteur · copier-coller · **mode TBI** (`.pv2-tbibtn`) · plein écran + `#ztsExitFs` · bulle Mr Root (`.p-perso`) · **Imprimer** (2) · 6 `fetch` · `Enter` / `Escape`.
- **Risque 3 maximum.** 4 éléments fixes à droite, une classe `metier` en collision directe avec le sélecteur du shell, 5 variables en collision, plein écran, écriture Firestore, mode TBI. **À placer en toute dernière vague, ou à exclure.**

#### `sae` (Banque de 911 SAÉ) — risque 3
- **Chemin** `apps/sae/` (590 + 3 931 JS + 3 728 CSS, 258 Ko de code, 78 Mo avec les données) · **URL** `/apps/sae/` · **27 liens entrants — 2ᵉ app la plus liée** · **Densité** `travail`
- **z-index** : **100000**, 9999, 1000, 500
- **Classes en collision** : `grid`, `hero`, `info`, `tag`, `titre` — **5**
- **Variables** : `--cyan` · **Stockage** : `favoris-sae`, `mon-cours-sae`, `mon-cours-sae-config`, `mon-cours-sae-eval`, `zts-lang`
- **Réseau** : `fetch('data/sae-all-light.json')` + `fetch('data/sae-detail/…')` (chargement paresseux)
- **Fonctions à rejouer** : **Commencer** · **12 `<select>`** de filtre (niveau, cycle, compétence, durée, nombre de cours…) · 4 champs texte + 2 radios · **Favoris** · fiche SAÉ enrichie (cours 3-10) · **+ Ajouter** à mon cours · **Imprimer** (4) · **Sauvegarder PDF** · **Partager** · modale (67 points) · `Espace` / `Enter` / `Escape` · canvas (2) · FR/EN · `_currentModalSAE` global.
- **Risque 3** : 2ᵉ app la plus visible, 5 collisions de classes, 12 sélecteurs, 4 impressions.

#### `scoreboard` — risque 3, **build Vite**
- **Chemin** `apps/scoreboard/` (`index.html` 95 lignes + `assets/index-Bi4bbmdW.js`, 280 Ko) · **Source Vite** : `/Users/admin/Desktop/Remotion 2/scoreboard-basketball/` · **URL** `/apps/scoreboard/` · **8 liens entrants** · **Densité** `travail`
- **z-index** : **100000**, 10000 · **Classes** : `grid` · **Variables** : `--jaune`, `--orange`, `--rose`
- **Stockage** : aucun · **Glisser-déposer** : 6 · **Réseau** : 3 `fetch`
- **Fichiers médias** : `nba-horn.mp3`, `siren-blast.mp3`
- **Fonctions à rejouer** : squelette commun Basketball / Hockey / Football · pointage · chronomètre · fautes/pénalités · sirène et corne · mode TNI plein écran · glisser-déposer d'équipes.
- **Risque 3, mais surtout : hors contrat.** Toute modification de `apps/scoreboard/index.html` est écrasée au prochain `npm run build`. **Recommandation : exclure du chantier** ou traiter dans le repo source, hors des critères d'acceptation.

#### `studio-jeu` — risque 3
- **Chemin** `apps/studio-jeu/` (176 HTML + **2 104 JS** + 389 CSS, 125 Ko) · **URL** `/apps/studio-jeu/` · **Densité** `travail`
- **CSS/JS** : `studio.css` + `studio.js` + `admin-gate.js`. **Aucun CSS ni JS partagé.**
- **z-index** : 9999, 100, 90, 60 · **Classes en collision** : `btn`, **`card`**, `src`
- **Stockage** : `zts-studio-*`, `zts-studio-lang`
- **Polices** : `ZoneTotalSport.ttf` chargé **deux fois** — en `@font-face` (`studio.css`) et en `fetch(...).arrayBuffer()` (`studio.js:1344`) pour l'export PDF
- **Clavier** : `c`, `C`, `p`, `P`, `Delete`, `Backspace`, `←`, `→`, `Enter`, `Escape` — **le jeu de raccourcis le plus dense du site**
- **Plein écran** : 4 appels · **Canvas** : 2 · **Export** : 11
- **Fonctions à rejouer** : éditeur de terrain en perspective · placement joueurs / flèches / zones / personnages · jouée pas-à-pas (⏮ Début, ⏭ Action/Espace) · groupes d'actions (fondu simultané) · annuler ↩ / refaire ↪ · titre ZTS stylable (contour, ombre) · bulles BD · **Fichier ▾** (Nouvelle scène, Charger JSON, Télécharger JSON) · **Exporter ▾** (PNG étape courante, Fiche PDF toutes étapes) · **Terrain ▾** · palette 🎨 · **Vider la scène** · **Choisir un jeu** · REC 🎙️ · projection 📽️ · bilingue FR/EN · lien de partage 🔗 · `admin-gate.js`.
- **Risque 3** : aucun CSS partagé, raccourcis à touche unique très denses, canvas plein cadre, 11 points d'export. Le rail vertical y est **structurellement incompatible**.

#### `suppleance` — risque 2
- **Chemin** `apps/suppleance/` (330 + 1 616 JS + 1 174 CSS, 380 Ko) · **URL** `/apps/suppleance/` · **5 liens entrants** · **Densité** `travail`
- **z-index** : **100000**, 999, 100, 50 · **Classes** : `grid` · **Variables** : `--cyan`, `--orange`
- **Stockage** : `suppl_agenda`, `suppl_breaks`, `suppl_lang`
- **Fonctions à rejouer** : **Commencer** · 2 champs nombre · `<select>` · **Ajouter** une période · filtre **Tous** · **Insérer dans la période** · modale (11 points) · 17 `onclick` inline · persistance des 3 clés · FR/EN.
- **Risque 2** : structure claire, pas d'export, pas de canvas.

#### `tni` (Tableau numérique) — risque 3
- **Chemin** `apps/tni/` (1 286 HTML + 266 JS + 493 CSS, 72 Ko) · **URL** `/apps/tni/` · **5 liens entrants** · **Densité** `travail` — **c'est l'app de projection par excellence**
- **z-index** : **100000**, 99999, 8000, 6000
- **Variables en collision** : `--cyan`, `--cyan-dark`, `--lime`, `--orange` — **4**
- **Stockage** : aucun
- **Clavier** : `d`, `e`, `f`, `g`, `m`, `s`, `z`, `Escape` — **8 raccourcis à touche unique sur `document`**
- **Plein écran** : 2 · **Canvas** : 3 · **Glisser-déposer** : 6
- **Fonctions à rejouer** : **C'est parti** / **Commencer** / **Comment utiliser** · outils **Dessin** (`d`) / **Bouger** · **Gomme** (`e`) · **Vider** · **Photo** · **Vidéo** · **Bulle** · **Web** · **Grille** (`g`) · **Plein écran** (`f`) · **Annuler** · **Sauver** (`s`) · curseur d'épaisseur · 2 champs fichier · glisser-déposer de médias (6 points) · **Suggestion** / **Envoyer** · modale (15 points) · 31 `onclick` inline.
- **Risque 3** : 8 raccourcis à touche unique + plein écran + canvas plein cadre. **Le rail vertical est incompatible et le shell doit se masquer en plein écran.** Candidat sérieux à l'exclusion.

#### `transitions` — risque 3
- **Chemin** `apps/transitions/` (1 240 HTML + 261 JS + 482 CSS, 97 Ko avec 73 Mo d'images) · **URL** `/apps/transitions/` · **8 liens entrants** · **Densité** `travail`
- **CSS** : `zts-header.css` + `zts-ultra.css` + Tailwind CDN + **GSAP CDN**
- **z-index** : **100000**, 9999, 2000, 1000 · **Classes** : `grid`, `src` · **Variables** : `--cyan`
- **Stockage** : `zts_chrono_record` · **Audio** : 4 (Future House)
- **Globaux** : `gymZoom`, `ZTS_LANDING_CONFIG`, `ztsHideLanding/Reset/Show`
- **Fonctions à rejouer** : 6 onglets (Signaux, Chrono, Zones, Capitaines, Trame, Plan Gym) · **🔊 Gym** (audio) · **Commencer** / **Comment utiliser** · chronomètre (**Démarrer** / **Reset**, record persisté) · **Tout décocher** · **Imprimer** · **Assigner** / **Mélanger** / **Effacer** capitaines · **➖ / ➕** · **Effacer tout** · **⏹️ STOP** · plan de gym : objets en cercle blanc, **clic pour redimensionner** (`gymZoom`), 5 ballons SVG · 2 curseurs + 1 nombre + 1 case · animations GSAP · `Escape` · 32 `onclick` inline.
- **Risque 3** : GSAP anime le DOM, plan de gym interactif plein cadre, audio, impression.

---

## 5. Tableau récapitulatif des collisions à régler

| # | Collision | Portée | Où la régler | Gravité |
|---|---|---|---|---|
| **B1** | Namespace `zts-` déjà pris par le design system (~70 classes) | **46 apps** | Shell — préfixer en `ztsh-` | **Bloquant** |
| **B2** | `window.ZTS` déjà occupé (`getLang`, `openModal`…) | **~35 apps** | Shell — `window.ZTSShell` | **Bloquant** |
| **B3** | Header fixe `.zts-header` (z 200) + topbar du shell = double navigation | **43 apps** | Décision produit (§7) | **Bloquant** |
| **B4** | `evaluation` force `font-family !important` sur `*` + `html{font-size:23px}` | 1 app | Exclure l'app, ou exception documentée | **Bloquant** |
| C1 | Classes non préfixées de la maquette (`grid`, `card`, `btn`, `hero`, `wrap`, `info`, `sub`, `tag`, `logo`, `cta`, `titre`, `src`, `metier`, `halftone`, `tags`) | **19 apps** | Shell — préfixe intégral | Haute |
| C2 | Échelle z-index du prompt (100–199) trop basse : sous le header (200) et sous 13 apps | **43+ apps** | Shell — réserver 300–399 | Haute |
| C3 | `*{box-sizing;margin;padding}` de la maquette | 2 apps sans CSS partagé (`acrosport`, `studio-jeu`) | Shell — `.ztsh-shell *` | Haute |
| C4 | Rail 70 px à droite masque des contrôles fixes | 7 apps + `.ztg-out` sur 23 | `--ztsh-marge-droite` + ruban en densité `travail` | Haute |
| C5 | `.ztg-out` (déconnexion) à `z-index:9998`, `right:12px` passe par-dessus le rail | **23 apps** | `shared/zts-gate.js` — 1 modif partagée | Haute |
| C6 | Chemin de police faux : `/fonts/zonetotalsport.ttf` → `/fonts/ZoneTotalSport.ttf`, + `size-adjust:50%` + `unicode-range` manquants | Toutes | Shell | Haute |
| **C7** | **Impression de la page courante** : rail, encourageur et pause café sur les feuilles | **10 apps** | Shell — `@media print` | Haute |
| **C8** | **Raccourcis à touche unique captés sur `document` par l'app** | 6 apps (`tni`, `studio-jeu`, `generateur`, `nba`, `nhl`, `acrosport`) | Shell — `stopPropagation` borné à `.ztsh-shell` | Moyenne |
| **C9** | **Plein écran** : le shell reste visible si `documentElement` | 4 apps | Shell — `:fullscreen .ztsh-shell{display:none}` | Moyenne |
| **C10** | **Builds Vite** : `index.html` écrasé au build | 2 apps (`scoreboard`, `evaluation`) | Exclure du chantier | Moyenne |
| C11 | Variables CSS de la maquette déjà définies avec d'autres valeurs (`--cyan`, `--jaune`, `--orange`, `--rose`, `--ink`, `--lime`, `--cyan-dark`) | 15 apps + `shared/zts.css` | Shell — toutes les variables en `--ztsh-*` | Moyenne |
| C12 | Tailwind Play CDN régénère du CSS sur mutation du DOM | 11 apps | Mesurer sur le pilote | Basse |
| C13 | `zts.js` injecte header/footer en **asynchrone** (`fetch` + `innerHTML`) — ordre de montage non déterministe | 43 apps | Shell — attendre `zts:ready` s'il existe | Basse |
| C14 | Route `POST /pause-cafe` inexistante sur `api.zonetotalsport.ca` | Shell | Worker `zts-generateur` (§7) | Basse |
| C15 | `zts-lock-page.js` pose `body.style.overflow='hidden'` sous verrou | 16 apps | Aucune action — le shell à z 300 passe sous l'overlay 99999 | Info |

---

## 6. Ordre de migration en vagues

### Vague 0 — préparatifs, avant tout habillage
Ne touche aucune app.
1. Trancher B1, B2, B3, B4 (§7).
2. Corriger le chemin et les attributs de la police dans la maquette (C6).
3. Décaler `.ztg-out` dans `shared/zts-gate.js` (C5) — **une modification, 23 apps servies**.
4. Ajouter la route `/pause-cafe` au worker, ou décider que le shell se contente du repli local (C14).

### Vague 1 — le pilote : **1 app**
**`plan-b-meteo`** — gabarit complet (recherche + puces + modale + i18n), métier `ep` (le métier par défaut du shell), 2 liens entrants, risque 1, zéro z-index, zéro stockage, zéro fixed.

Pourquoi pas `noms-de-clans` (le plus petit) : il n'a ni modale ni recherche, donc il ne testerait pas le scopage là où ça compte.

**Règle du prompt à appliquer telle quelle** : plus de trois correctifs de collision sur ce pilote ⇒ retour en phase 1.

### Vague 1 bis — le pilote de contrainte : **1 app**
Un gabarit passe trop facilement pour valider le shell sur du code réel. Je recommande un **second pilote**, immédiatement après, sur **`suppleance`** (risque 2, 5 liens entrants, une seule collision de classe, stockage simple, pas d'export ni de canvas). C'est l'app custom la plus proche du cas moyen.

Si les deux pilotes passent, le shell est bon. Sinon on corrige le shell, pas les apps.

### Vague 2 — le reste du gabarit : **22 apps**
`activites-duree`, `bricolages`, `brise-glace`, `chansons-camp`, `comptines`, `echauffements`, `enigmes`, `grands-jeux`, `intervention-groupe`, `jeux-calmes`, `jeux-eau`, `jeux-par-theme`, `jeux-rapides`, `journee-pedago`, `noms-de-clans`, `olympiades`, `olympiades-scolaires`, `plan-b-pluie`, `rallyes`, `roue-responsabilites`, `sos-conflits`, `veillee-feu-de-camp`, puis `planification`.

Diff attendu : identique sur les 22. Si une seule diverge, c'est un signal.

### Vague 3 — apps custom à faible risque : **5 apps**
`colorier`, `musique`, `moyens-action`, `performances`, `acrosport`.
`acrosport` n'est pas déployée : c'est le meilleur endroit pour tester le shell sur une app sans CSS partagé, sans risque de production.

### Vague 4 — apps custom moyennes : **4 apps**
`agenda`, `grille`, `nba-playoffs`, `nhl-playoffs`.
Les deux playoffs partagent le même code : les migrer ensemble, avec le rail en ruban obligatoire.

### Vague 5 — les grosses, une par une : **5 apps**
`educatifs`, `sae`, `jeux`, `cours-maternelle`, `transitions`.
Un GO distinct par app. Ce sont les plus visibles du site (28, 27, et 9 liens entrants).

### Vague 6 — cas particuliers, à décider app par app : **4 apps**
`generateur` (deux domaines, quota), `omnigroupe` (canvas), `tni` (8 raccourcis + plein écran), `studio-jeu` (canvas + 10 raccourcis + aucun partagé).
Pour `tni` et `studio-jeu`, la question honnête est : **est-ce qu'un rail d'outils a du sens dans une app qui est elle-même un outil plein cadre projeté au TNI ?** Ma réponse est non. Je recommande de leur donner un shell réduit (aucun chrome, seulement les variables de thème) ou de les exclure.

### Hors chantier
`scoreboard` et `evaluation` — builds Vite, voir §3.4 et B4.

**Total : 44 apps habillables, 2 exclues, dont 4 à shell réduit.**

---

## 7. Réponses aux trois questions du prompt

### Q1 — Le chemin réel de `zonetotalsport.ttf`

**`/fonts/ZoneTotalSport.ttf`** — majuscules Z, T, S. La maquette écrit le nom tout en minuscules, ce qui donne un 404 sur Cloudflare Pages.

Le bloc correct, tel qu'utilisé partout ailleurs dans le repo :

```css
@font-face{
  font-family:'ZoneTotalSport';
  src:url('/fonts/ZoneTotalSport.ttf') format('truetype');
  font-display:swap;
  size-adjust:50%;
  unicode-range:U+0020-007E;
}
```

`size-adjust:50%` est **obligatoire** — sans lui la police rend au double de la taille demandée. `unicode-range:U+0020-007E` l'est tout autant : la police ne contient pas les caractères accentués, et sans cette limite les « é », « à », « ç » du shell tomberaient dans un fallback qui casse l'alignement visuel.

Trois autres copies du fichier existent (`apps/jeux/`, `apps/moyens-action/`, `apps/nhl-playoffs/fonts/`) — le shell doit utiliser la copie racine, en chemin absolu, pour être identique sur les 46 apps.

### Q2 — La route et le format du worker pour la pause café

**La route n'existe pas.** `api.zonetotalsport.ca` pointe (via `custom_domain`) sur le worker `zts-generateur` défini dans `cf-worker/generateur/wrangler.toml`, dont `src/generateur-worker.js` ne sert que : `/health`, `/generate`, `/nutrition`, `/steps`, `/food-search`, `/nutrition-photo`, `/generations`, `/migrate-anon-generation`, `/generation/:id`.

Trois choses à faire avant que le bouton fonctionne :

1. **Ajouter la route** `POST /pause-cafe` dans `generateur-worker.js`. Le contrat proposé par la maquette (`{metier, deja}` → `{genre, texte, source}`) est bon, je le reprendrais tel quel.
2. **Élargir `ALLOWED_ORIGINS`** (`generateur-worker.js:21`). La liste actuelle est `zonetotalsport.ca`, `www.`, `ia.`, `www.ia.` + localhost. Si la pause café est appelée depuis d'autres sous-domaines, ils doivent y être ajoutés — sinon le `fetch` échoue et l'app retombe silencieusement sur `CAFE_REPLI`.
3. **Vérifier la règle WAF.** Un rate-limit de 5 requêtes / 10 s par IP est actif sur `api.zonetotalsport.ca`. Un prof qui clique trois fois de suite sur « Pause café » pendant qu'une génération tourne peut se faire couper. Le repli local existe, donc le pire cas est dégradé, pas cassé — mais il faut le savoir.

**Ma recommandation pour la phase 1** : livrer le shell avec **le seul repli local** (`CAFE_REPLI`, 10 entrées, 1,3 Ko), sans appel réseau. Ça respecte « aucun appel réseau au chargement », ça rend le shell testable immédiatement, et ça découple l'habillage d'un chantier worker. On branche le worker en phase 4 ou plus tard.

### Q3 — Encourageur et pause café dans les apps de travail ?

**Je suis d'accord avec vous : vitrine seulement.** Trois raisons concrètes sorties du prescan, pas de l'opinion :

1. **L'impression.** 10 apps impriment la page courante pour produire des fiches distribuées aux élèves. Un personnage qui parle et un bouton « Pause café » sur une feuille de consignes, c'est un défaut visible en classe. Une règle `@media print` règle le symptôme, mais la vraie réponse est de ne pas les mettre là.
2. **Le plein écran et le TNI.** `tni`, `studio-jeu`, `acrosport`, `planificateur`, `cours-maternelle` (mode TBI), `scoreboard`, `nba`/`nhl` sont projetés devant un groupe. Un personnage qui s'anime dans le coin pendant qu'on explique une règle capte l'attention des enfants, pas celle de l'adulte.
3. **L'encombrement du coin bas-droit est déjà réel.** `.ztg-out` y est sur 23 apps, `.p-perso` sur `planificateur`, `.pf-helpbtn` sur `performances`, `.cal-mascot-float` sur `agenda`. L'encourageur à `right:96px; bottom:18px` arrive dans un coin déjà occupé — et `planificateur` a déjà **sa propre** bulle de personnage.

Configuration recommandée par défaut :

| Densité | Rail | Sélecteur de métier | Encourageur | Pause café |
|---|---|---|---|---|
| `vitrine` | vertical à droite | oui | **oui** | **oui** |
| `travail` | **ruban horizontal** | oui | **non** | **non** |

Soit : encourageur et pause café sur **~28 apps** (les 23 gabarits + `colorier`, `musique`, `moyens-action`, `performances`, `generateur`), et jamais sur les 16 apps de travail.

### Et B3 — ma recommandation sur le double header

C'est la seule question que le prompt ne pose pas et qui doit être tranchée avant d'écrire le shell.

**Recommandation : dans les apps, le shell n'affiche PAS de topbar.** `data-zts-header` reste seul maître du haut de page. Le shell y apporte : le sélecteur de métier (glissé **sous** le header existant, dans le flux), le rail, et — en densité `vitrine` seulement — l'encourageur et la pause café.

La topbar complète de la maquette (logo + nav + bouton utilisateur) est le chrome de la **home**, pas des apps. La mettre dans les apps crée une deuxième navigation, une deuxième identité de marque et un conflit de z-index, pour zéro gain : le header existant fait déjà ce travail sur 43 apps sur 46.

Si vous voulez au contraire que le shell **remplace** `zts-header.css`, c'est un chantier légitime mais différent : il touche `shared/`, il change l'apparence de la home, et il sort du cadre « habillage additif, jamais soustractif ». Il mérite son propre prompt.

---

## 8. Poids du shell — mesure préalable

Extrait de la maquette, non minifié, non gzippé :

| Bloc | Poids |
|---|---|
| CSS total | 15,0 Ko |
| JS total | 12,4 Ko |
| — dont `ENCOURAGEMENTS` (100 chaînes) | 8,1 Ko |
| — dont `CAFE_REPLI` (10 entrées) | 1,3 Ko |
| — dont logique pure | **3,1 Ko** |
| **Total brut** | **27,1 Ko** |

Le budget de 60 Ko est confortable. Deux remarques :

- Une bonne moitié du CSS (`.hero`, `.panneau`, `.card`, `.cta`, `.bande`, `.offset`, `.compteur`, `.mini-stats`) est du **contenu de la home**, pas du chrome. Il n'a rien à faire dans le shell des apps. Le chrome réel (rail, encourageur, pause café, sélecteur de métier, variables) devrait tenir sous 8 Ko.
- Les 8,1 Ko d'encouragements ne servent qu'en densité `vitrine`. Sur les 16 apps de travail, ce sont 8 Ko de texte téléchargé pour rien. À charger paresseusement, ou à séparer en `ztsh-encouragements.js`.

---

## 9. Ce qu'il me faut de vous pour lancer la phase 1

1. **B1** — Confirmez le préfixe `ztsh-` pour toutes les classes et variables du shell (ou proposez le vôtre).
2. **B2** — Confirmez `window.ZTSShell.monter()` plutôt que `ZTS.monter()`.
3. **B3** — Tranchez : le shell **n'affiche pas** de topbar dans les apps (ma recommandation), ou il **remplace** `data-zts-header` (autre chantier).
4. **B4 + C10** — Confirmez l'exclusion de `evaluation` et `scoreboard` du chantier.
5. **C5** — Autorisez la modification unique de `shared/zts-gate.js` pour décaler `.ztg-out` (seule entorse hors-shell que je recommande).
6. **C8** — Autorisez le `stopPropagation` borné aux événements originés d'un nœud `.ztsh-*` (le contrat l'interdit tel qu'écrit).
7. **Q2** — Confirmez : phase 1 avec **repli local uniquement**, worker `/pause-cafe` renvoyé à plus tard.
8. **Vague 6** — Confirmez le principe d'un **shell réduit** (variables de thème seulement, aucun chrome) pour `tni` et `studio-jeu`.

Rien n'a été écrit ni committé en dehors de ce fichier. J'attends votre GO.
