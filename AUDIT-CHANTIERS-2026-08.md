# AUDIT GLOBAL — zonetotalsport.ca — 10 août 2026

Passe de **lecture seule**. Aucun fichier du site touché, aucun commit.
Chaque affirmation ci-dessous est vérifiée soit dans le dépôt (`fichier:ligne`),
soit en production (`curl` / navigateur réel sur `https://zonetotalsport.ca`).
**Les documents `*-COMPLETE.md` et les messages de commit n'ont servi à rien
ici** — ils ont été relus, puis contre-vérifiés, et deux d'entre eux se sont
révélés en avance sur la réalité (§1.6 polices, §2.2 auth).

Contexte de mesure : dépôt `~/dev/Remotion 2/wix-deploy`, branche `main` à
`d391e73`, production servie par GitHub Pages (`server: GitHub.com`,
`last-modified: Sun, 09 Aug 2026 19:39:17 GMT`).

---

## AVERTISSEMENT PRÉALABLE — deux choses à savoir avant de lire le reste

**1. `firebase-auth.js` est modifié sur le disque et non committé.**

```
git status --short  →  M firebase-auth.js
git diff --stat     →  428 insertions(+), 443 deletions(-)
```

L'en-tête du fichier local annonce `V2 (2026-08-09) : modal 2 etapes
(proposition de valeur → formulaire), fond floute translucide, mode wall pour
les apps gatees`. Ce travail **n'est pas en production** : le fichier servi est
identique à `HEAD` (`diff` binaire entre `curl .../firebase-auth.js` et
`git show HEAD:firebase-auth.js` → identiques). Une session parallèle a une
refonte de la modale d'inscription en cours. **Ne rien faire sur l'auth avant
d'avoir tranché le sort de ce diff** — c'est le fichier chargé sur ~1510 pages.

**2. Le verrou n'est pas là où les documents le disent.**

L'architecture réelle du gating a **trois** mécanismes distincts, pas un :

| Mécanisme | Fichier | Portée réelle |
|---|---|---|
| Mur plein écran | `zts-lock-page.js` | 15 apps + 25 articles |
| Portillon « soft » | `shared/zts-gate.js` | 24 apps |
| Cadenas sur cartes | `shared/zts-unlock.js` | 3 hubs (`#gridActive`) |
| Cadenas sur cartes (v1) | `zts-lock.js` | `blog.html` **seulement** |

`zts-lock.js` ne tourne plus sur l'accueil. `locked-whitelist.json` ne pilote
que deux des quatre mécanismes. Détail en §1.

---

# a) TABLEAU PAR CHANTIER

## 1. LOCKAGE / RÈGLE DES 3 VITRINES

### 1.1 — Vue d'ensemble

| Sous-chantier | État | Preuve |
|---|---|---|
| Vague 1A — 301 sous-domaines | **FAIT ET VÉRIFIÉ** | 9/9 en 301, §1.5 |
| Mur sur apps « lourdes » | **FAIT** (11 apps) | `zts-lock-page.js`, §1.3 |
| Portillon sur apps « gabarit » | **FAIT** (24 apps) | `zts-gate.js`, §1.3 |
| Demi-aperçu articles | **FAIT** (25/25) | `zts-lock-page.js:200-260` |
| **Verrou sur l'accueil** | **CASSÉ — inexistant** | §1.2 |
| **Verrou sur les 1440 fiches `/jeux/`** | **PAS COMMENCÉ** | §1.4 |
| **Règle 3-3-3-3** | **PAS COMMENCÉE** | §1.6 |
| **Fiche tronquée (mode vitrine)** | **PAS COMMENCÉE** (articles seuls) | §1.7 |
| 7 apps sans aucun verrou | **TROU** | §1.3 |
| Gate 100 % client | **PAR CONCEPTION — non contournable côté serveur** | §1.8 |

### 1.2 — L'accueil n'a plus aucun verrou. C'est le trou le plus grave.

Mesuré en navigateur réel sur `https://zonetotalsport.ca/` :

```js
{ locked: 0, gridActive: false, appsGrid: false, links: 27 }
```

Zéro élément verrouillé. Zéro conteneur que les scripts de verrou savent
reconnaître. **27 liens `/apps/…` cliquables** directement.

Cause exacte, en trois faits :

1. `index.html:4188-4189` ne charge que `firebase-auth.js` et `zts-funnel.js`.
   **`zts-lock.js` n'est plus dans la page** (`grep -l "zts-lock\.js" *.html` →
   `blog.html`, `index-old.html`, rien d'autre).
2. `index.html` charge `shared/zts-unlock.js` (confirmé en prod), mais ce module
   ne verrouille **que** `#gridActive` (`zts-unlock.js:74`) — un identifiant que
   `index.html` **ne contient pas** (`grep -c 'id="gridActive"' index.html` → 0).
3. L'ancien `zts-lock.js` ciblait `#appsGrid` (`zts-lock.js:92`) — identifiant
   également absent de `index.html` (`grep -c 'appsGrid' index.html` → 0).

Autrement dit : la page d'entrée du site, celle qui reçoit tout le trafic SEO et
tous les partages, distribue 27 liens vers les outils **sans jamais montrer un
cadenas ni demander un compte**. Le pilier n°1 de la vision est absent là où il
compte le plus.

### 1.3 — Inventaire exhaustif de ce qui est ouvert sans compte

**46 apps dans `apps/`** (hors `_archive`). Réparties ainsi :

**A. Ouvertes parce que sur la liste blanche (4)** — `locked-whitelist.json`
`freeResources` :
`jeux`, `sae`, `suppleance`, `musique`.

> `code-oreille` figure aussi dans `freeResources`, mais **l'entrée est inerte** :
> `apps/code-oreille/index.html` ne charge ni `zts-lock-page.js` ni
> `zts-gate.js`. La liste blanche l'autorise à passer une porte qui n'existe pas.

**B. Ouvertes parce qu'aucun verrou n'a jamais été posé (7)** :

| App | Verrou | Note |
|---|---|---|
| `code-oreille` | aucun | + pas de shell, pas de menu, pas d'OG |
| `colorier` | aucun | **c'est un outil vitrine voulu — voir §1.9** |
| `performances` | aucun | app Drive, dette D20 ouverte |
| `planificateur` | aucun | l'outil le plus lourd du site, dette D24 |
| `studio-jeu` | aucun | lien « 🔒 Administrateur » sur l'accueil, non gardé ici |
| `nba-playoffs` | aucun | contenu mort, cible d'une 301 inopérante |
| `nhl-playoffs` | aucun | idem |

Vérifié en prod : `/apps/colorier/`, `/apps/performances/`, `/apps/planificateur/`
→ **200**, et en navigateur `{ wall: false, gate: false }` sur `colorier`.

**C. Verrouillées et fonctionnelles (35)** — 11 par `zts-lock-page.js`
(`educatifs`, `agenda`, `cours-maternelle`, `evaluation`, `moyens-action`,
`grille`, `generateur`, `scoreboard`, `tni`, `omnigroupe`, `transitions`) et 24
par `zts-gate.js`.

Contre-épreuve en navigateur sur `/apps/educatifs/` :
`{ wall: true, bodyOverflow: "hidden", title: "Cette ressource est réservée aux
membres gratuits" }` — le mur fonctionne.

**Reste ouvert, hors apps :**

| Ressource | Volume | Preuve |
|---|---|---|
| Fiches de jeux statiques | **1440 pages HTML complètes** | §1.4 |
| `jeux-merged.json` | **12,0 Mo, 1439 jeux, 20 champs EN chacun** | `curl` → `200`, `12026449` octets |
| SAÉ via l'app whitelistée | **~1790 SAÉ** | somme de `apps/sae/data/sae-light/*.json` |
| Texte intégral des 22 articles barrés | 79 Ko / 55 `<p>` sur un article testé | §1.7 |
| `index.html` | toute la page + 27 liens | §1.2 |
| `blog.html` | cadenas sur les vignettes, **URLs directes libres** | `zts-lock.js` n'agit que sur `#grid` |
| `repertoire.html`, `avis.html`, `sports-news.html`, `promo.html`, `teasing.html`, `index-old.html` | pages entières | 200 en prod |
| `aidons-nous/` | forum entier | 200 en prod |

**Le point le plus coûteux, en une phrase :** un visiteur anonyme peut
télécharger `jeux-merged.json` d'un seul `curl` et repartir avec **la banque de
jeux au complet, bilingue, structurée en 20 champs**. Il n'y a pas d'inscription
à obtenir après ça.

### 1.4 — Les 1440 fiches `/jeux/` : aucun verrou, par construction

```
grep -rl "zts-lock-page.js" jeux/  →  0
grep -rl "shared/zts.js"    jeux/  →  1440
```

Les fiches chargent le chrome partagé (donc l'en-tête et le menu), mais **aucun
script de verrou**. Et même si on en ajoutait un, il ne mordrait pas :
`zts-lock-page.js:20-27` — la fonction `getSlug()` ne reconnaît que deux formes
d'URL :

```js
var m = p.match(/\/articles\/([^/]+?)(?:\.html)?$/);   // articles
m = p.match(/\/apps\/([^/]+)\/(?:index\.html)?$/);      // apps
return null;                                            // tout le reste
```

`/jeux/1-2-3-soleil.html` retombe sur `return null`, et `init()` sort
immédiatement (`zts-lock-page.js:262`). **Poser le script sur les 1440 fiches
sans toucher `getSlug()` ne ferait rien du tout.** C'est un piège à ne pas
payer : la correction de `getSlug()` est le prérequis, pas une finition.

Vérifié en prod : `/jeux/1-2-3-soleil.html` → 200, 15 510 octets, scripts
`/firebase-auth.js`, `/shared/zts.js`, `/zts-funnel.js` — pas de verrou.

### 1.5 — Vague 1A (sous-domaines) : CLOSE, vérifiée

Les 9 sous-domaines répondent bien en 301 vers le chemin canonique :

| Sous-domaine | Réponse |
|---|---|
| `jeux.` | `301 → /apps/jeux/` |
| `sae.` | `301 → /apps/sae/` |
| `educatifs.` | `301 → /apps/educatifs/` |
| `musique.` | `301 → /apps/musique/` |
| `suppleance.` | `301 → /apps/suppleance/` |
| `evaluation.` | `301 → /apps/evaluation/` |
| `generateur.` | `301 → /apps/generateur/` |
| `grille.` | `301 → /apps/grille/` |
| `agenda.` | `301 → /apps/agenda` (sans barre finale) |

**Aucune fuite : plus aucun sous-domaine ne sert l'app en entier.** Le chantier
est bel et bien fermé.

**Deux réserves, mineures mais réelles.** `REDIRECTIONS-CLOUDFLARE.md:36-44` les
annonçait ; elles sont confirmées à la mesure :

- `agenda.` et `ia.` font **2 sauts** au lieu d'un (`%{num_redirects}` = 2) :
  une ancienne Redirect Rule de zone s'évalue avant la Bulk Redirect et vise une
  cible sans barre oblique finale ; GitHub Pages émet alors un second 301.
  `gym.` fait bien 1 saut. Correctif : supprimer les deux vieilles règles dans
  **Rules → Redirect Rules**.
- **Les 7 items de chemins sont inopérants**, et le document dit pourquoi.
  Confirmé à la racine : `dig +short zonetotalsport.ca` → `185.199.108-111.153`,
  soit **les IP de GitHub Pages en direct**. Le domaine apex est en **DNS only**,
  pas derrière le proxy Cloudflare — donc aucune Bulk Redirect ne peut
  s'appliquer à un chemin de `zonetotalsport.ca`. Les 7 cibles répondent
  toujours **200** :

  ```
  /apps-nhl/ /apps-nba/ /apps-fifa/ /apps/nhl-playoffs/
  /apps/nba-playoffs/ /index-old.html /teasing.html   → 200 (toutes)
  ```

  Prérequis avant bascule en proxy orange : **SSL en mode Full**, pas Flexible
  (sinon boucle de redirection). C'est un chantier d'infrastructure, pas de code.

### 1.6 — Slugs vitrine 3-3-3-3 : PAS FIXÉS

`locked-whitelist.json` contient aujourd'hui **5 ressources et 3 articles** :

```json
"freeResources": ["jeux", "sae", "suppleance", "musique", "code-oreille"],
"freeArticles":  ["faire-bouger-enfants", "comportements-perturbateurs",
                  "catastrophes-ordinaires"]
```

Confronté à la cible 3-3-3-3 :

| Cible | Réalité | Écart |
|---|---|---|
| 3 jeux | `jeux` = **l'app entière + 1439 fiches + le JSON** | La vitrine est le magasin au complet |
| 3 SAÉ | `sae` = **~1790 SAÉ** | idem |
| 3 outils (`suppleance`, `musique`, `colorier`) | `suppleance` ✓, `musique` ✓, **`colorier` absent de la liste** mais ouvert par absence de verrou | Le bon résultat, par le mauvais chemin |
| 3 articles | ✓ **3 articles, exactement** | **Seul point conforme** |

Le format même du fichier est le blocage : `freeResources` accepte des **slugs
d'app**, pas des slugs d'items. Il n'existe aujourd'hui aucun endroit où écrire
« ces trois jeux-là sont libres ». Ouvrir 3 jeux au lieu de 1439 demande un
nouveau champ (`freeItems: { jeux: [...], sae: [...] }`) **et** une lecture de
ce champ à l'intérieur des deux SPA — ce n'est pas une édition de configuration,
c'est du code dans `apps/jeux` et `apps/sae`.

`code-oreille` devrait sortir de `freeResources` (entrée inerte, §1.3) et
`colorier` y entrer explicitement, pour que la liste dise la vérité.

### 1.7 — Mode fiche tronquée : codé pour les articles, nulle part ailleurs

**Fait, et de bonne facture, pour les articles** : `zts-lock-page.js:200-260`
coupe le contenu à la moitié (`Math.ceil(kids.length / 2)`), masque le reste en
`display:none`, insère un CTA, et laisse les articles de moins de 4 blocs
entiers. Coupe optimiste avant la réponse d'auth, donc **pas de flash** de
contenu pour les anonymes. Les 25/25 articles chargent le script.

**Deux limites, l'une par conception, l'autre non :**

- Le texte complet **reste dans le DOM** (choix assumé, commenté ligne 128 :
  « SEO préservé »). Vérifié en prod sur `harcelement-enseignants.html` :
  79 111 octets servis, 55 `<p>`. Un visiteur qui ouvre l'inspecteur — ou
  n'importe quel script — lit tout. C'est un arbitrage SEO/lockage, pas un bug,
  mais il doit être **décidé sciemment** maintenant que le lockage est le pilier
  n°1. Un rendu serveur ou un chargement du second moitié par `fetch` après auth
  fermerait le trou sans rien coûter au référencement du premier moitié.
- **Rien d'équivalent n'existe pour les fiches de jeux ni pour les SAÉ.**
  C'est un module à écrire, pas à brancher.

### 1.8 — Le gate est 100 % côté client : le dire clairement

`firestore.rules` protège les données Firestore, mais **tout le contenu du site
est du fichier statique servi par GitHub Pages**. Aucun verrou JavaScript ne peut
empêcher un `curl`. Preuve directe : `/apps/sae/` sert 28 907 octets à un
anonyme, `jeux-merged.json` sert ses 12 Mo, un article barré sert ses 79 Ko.

**Ce n'est pas une faille à corriger, c'est une propriété de l'hébergement.** La
question à trancher n'est pas « comment rendre le gate étanche » mais « quel
niveau de fuite est acceptable » :

- contre un visiteur ordinaire : le verrou client suffit, et c'est 95 % du sujet ;
- contre un concurrent qui aspire la banque : seul un backend le ferait
  (Cloudflare Worker devant les JSON, ou Firestore avec règles de lecture).

Recommandation : accepter la fuite sur le HTML, **fermer le seul robinet qui
donne tout d'un coup** — `jeux-merged.json` derrière un Worker qui vérifie un
jeton Firebase. C'est le meilleur rapport effort/valeur de tout le chantier
lockage (§b, LOT 2).

### 1.9 — App `colorier` : lacunes

Testée en production. **Le moteur fonctionne** — le Worker
`https://zts-colorier.zts-ccd.workers.dev` répond `{"ok":true,"image":"data:image/jpeg;base64,…"}`
sur `POST /generate {"subject":"joueur de soccer"}`, et `/gallery` renvoie
`200` avec des items réels. C'est un vrai outil, pas une maquette.

| Lacune | Preuve | Gravité |
|---|---|---|
| Absente de `locked-whitelist.json` | ouverte par **oubli**, pas par décision | moyenne |
| Le texte appelle encore la mascotte **« le bûcheron »** — 8 occurrences | `apps/colorier/index.html`, dont le message d'erreur visible « Oups, le bûcheron a glissé sur une bûche… » | **haute** — contredit la décision « prof d'ÉPS » |
| `og:image` = `favicon.png`, `twitter:card` = `summary` | `apps/colorier/index.html:18,21` | **haute** — outil vitrine partagé sans carte |
| UI balisée `data-i18n` (53 marqueurs) mais **`app.js` n'a aucune chaîne EN** | `grep -c "en:" apps/colorier/app.js` → 0 | haute |
| Charge Google Fonts | `apps/colorier/index.html:28` | basse (§8.2) |
| Aucun quota affiché tant qu'on n'a pas généré | `app.js:128 updateQuota` | basse |

Pour un outil censé être une des trois vitrines, les deux lignes hautes
(mascotte + carte de partage) sont à régler avant de le mettre en avant.

---

## 2. AUTH / INSCRIPTION

| Point | État | Preuve |
|---|---|---|
| A2 `signInWithPopup` mergé | **FAIT, en prod** | §2.1 |
| **Test réel iPhone Safari** | **PAS FAIT** | §2.2 |
| Retrait `getRedirectResult` (dû le 15 août) | **PAS FAIT** — échéance dans 5 jours | §2.3 |
| D20 `performances/app.js` | **NON CORRIGÉE** | §2.4 |
| D21 `aidons-nous` | **NON CORRIGÉE** | §2.4 |
| V2 de la modale | **NON COMMITTÉE** | avertissement en tête |

### 2.1 — A2 est bien en production

`curl https://zonetotalsport.ca/firebase-auth.js` → 36 779 octets, **identique à
`HEAD`**. Le fichier contient `signInWithPopup` (1 occurrence, ligne 666) avec le
commentaire de garde ligne 665 : *« AUCUN await avant signInWithPopup — appel
synchrone dans le handler de clic »*. La discipline est respectée dans ce
fichier-là.

### 2.2 — `signup_complete` n'a jamais été validé en conditions réelles

Le mécanisme existe et est correctement conçu : `firebase-auth.js:597` pose un
drapeau `sessionStorage` **synchrone** (pour survivre à la navigation), consommé
par `zts-funnel.js:88-126` qui émet l'événement vers GA4.

Mais **rien dans le dépôt n'atteste d'un test réel sur iPhone Safari**, et je ne
peux pas le produire depuis ici : il faut un vrai appareil, un vrai compte Google,
et la console GA4 ouverte. C'est le **dernier maillon non prouvé de tout le
tunnel d'inscription** — si `signup_complete` ne remonte pas, chaque décision de
conversion prise après coup s'appuiera sur un chiffre absent.

**À faire, dans cet ordre, sur un iPhone réel :** ouvrir `/apps/educatifs/` en
navigation privée → mur → « Continuer avec Google » → vérifier que le popup
s'ouvre (et non un blocage silencieux) → terminer → vérifier l'arrivée sur
`/bienvenue.html` → vérifier `signup_complete` dans GA4 → **Temps réel**.

### 2.3 — `getRedirectResult` : l'échéance du 15 août arrive

`firebase-auth.js:53-56`, toujours présent en prod (3 occurrences dans le fichier
servi) :

```js
// DEPRECIE — 2026-08-08 · RETRAIT PREVU LE 2026-08-15
firebase.auth().getRedirectResult().then(function(result) { … })
```

La fenêtre de rattrapage de 7 jours se ferme le **15 août**. Le retrait est
mécanique (le bloc + l'import), mais **il touche le fichier actuellement modifié
sur le disque** : le faire maintenant, c'est écraser ou entrer en conflit avec la
V2 non committée. → **Dépendance dure : trancher le diff avant de retirer.**

### 2.4 — D20 et D21 : les deux dernières portes Google non conformes

**D20 — `apps/performances/app.js:96` — confirmée, non corrigée :**

```js
async function connectDrive() {
  await waitForFirebase();                              // ← rend la main
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope(DRIVE_SCOPE);                       // ← pas de setCustomParameters
  const result = await firebase.auth().signInWithPopup(provider);
```

Le `await` rend la main à la boucle d'événements ; sur Safari iOS le geste
utilisateur a expiré au moment du `window.open`, et le popup est bloqué. Il n'y a
**aucun repli** ici — la connexion Drive échoue en silence. `select_account` est
également absent.

**D21 — `aidons-nous/index.html:437` — confirmée, non corrigée :**
`firebase.auth().signInWithPopup(provider)` sans `setCustomParameters({prompt:'select_account'})`.
`grep "select_account" aidons-nous/index.html` → **aucune occurrence**. C'est le
dernier site d'appel Google du site dans ce cas (les trois autres —
`firebase-auth.js`, `shared/zts-gate.js`, `apps/studio-jeu/admin-gate.js` — l'ont).

Les deux sont des correctifs de **quelques lignes**. D20 bloque réellement une
fonctionnalité sur le mobile le plus courant chez les enseignants.

---

## 3. HEADER + MENU DÉROULANT

**Verdict : FAIT et fonctionnel en production, sur l'immense majorité du site.**
Le mécanisme est plus solide que ce que laissait craindre la lecture du dépôt.

`shared/header.html` ne contient qu'un squelette ; les 6 entrées sont construites
par `shared/zts-menu.js`, **chargé dynamiquement** par `shared/zts.js:100-119`
(`loadMenu()`) après l'injection du header — un `<script>` inline dans un
`innerHTML` ne s'exécuterait pas, d'où ce détour. Confirmé en navigateur réel sur
`/ep.html` :

```js
{ menuEntries: ["🏠Accueil","🧰Outils pédagogiques▾","📋SAÉ▾","📅Planifications▾",
                "✏️Blog","🎮Jeux","☰","👤Connexion","FR","EN"],
  hasMenuJs: true }
```

### Couverture réelle (critère : la page charge `shared/zts.js`)

| Famille | Avec | Sans |
|---|---|---|
| Fiches `/jeux/` | **1440 / 1440** ✓ | — |
| Articles | **25 / 25** ✓ | — |
| Apps | **41 / 46** | `code-oreille`, `evaluation`, `nba-playoffs`, `nhl-playoffs`, `studio-jeu` |
| Pages racine | 9 | `aidons-nous.html`, `politique.html`, `promo.html`, `sports-news.html`, `teasing.html` (+ fichiers morts : `blog-avant`, `index-old`, `article-template`) |

**Pages vivantes à traiter — 8 au total**, et pas plus :

1. `apps/code-oreille/` — n'a ni menu, ni shell, ni OG. Exclue du chantier
   habillage par décision motivée le 9 août, mais **l'exclusion du shell ne
   justifie pas l'absence de menu** : ce sont deux mécanismes séparés
   (`shared/zts.js` vs `assets/ztsh-shell.css`). Le menu peut être ajouté seul.
2. `apps/evaluation/` — app verrouillée et utilisée, sans menu. Anomalie nette.
3. `apps/studio-jeu/` — lié depuis l'accueil (« 🔒 Administrateur »).
4. `apps/nba-playoffs/`, `apps/nhl-playoffs/` — contenu mort, cibles de 301
   inopérantes. **À laisser tomber, ou à supprimer** plutôt qu'à habiller.
5. `aidons-nous.html` + `aidons-nous/index.html` — le forum communautaire,
   entièrement hors du chrome du site.
6. `politique.html` — page légale, liée depuis le pied de page.
7. `promo.html`, `sports-news.html`, `teasing.html` — statut à trancher :
   vivantes ou mortes ? `teasing.html` est déjà dans le CSV de redirections.

Aucun article, aucune fiche de jeu ne porte l'ancien header. **Le chantier header
est à 97 % et son reliquat est petit et bien délimité.**

---

## 4. HABILLAGE ZTSH-SHELL

| Point | État | Preuve |
|---|---|---|
| Apps habillées | **40 / 46** ✓ | liste ci-dessous |
| Vague 2 (22 gabarits) | **FAITE** le 4 août | `ETAT-CHANTIER-HABILLAGE.md:130` + mesure |
| Personnage / paliers b) et c) | **SANS OBJET — le personnage est désactivé partout** | §4.2 |
| Conflit boutons flottants | **RÉGLÉ dans le code, dormant en pratique** | §4.2 |
| Fond marine en projection | **ABANDONNÉ — décision, pas dette** | §4.3 |
| D24 planificateur | **NON TRANCHÉE** | §4.4 |
| Pages hors apps (articles, jeux, racine) | **PAS COMMENCÉ — 0 %** | §4.5 |

### 4.1 — Les 6 apps non habillées

`code-oreille` (exclusion motivée), `evaluation`, `planificateur` (bloquée par
D24), `scoreboard`, `nba-playoffs`, `nhl-playoffs` (contenu mort).
**Reste réel : 3 apps** (`evaluation`, `scoreboard`, `planificateur`).

### 4.2 — Le personnage : la question ne se pose plus

`assets/ztsh-shell.js:114-127` — les trois densités portent `encourageur: false` :

```js
vitrine:    { …, encourageur: false, … },
travail:    { …, encourageur: false, … },
projection: { …, encourageur: false, … },
```

Commentaire ligne 110 : *« encourageur PASSE A false le 2 aout, sur decision de
Joey : le personnage flottant est retire du site »*. **Les paliers b) et c) sont
donc sans objet** — il n'y a plus de personnage à placer.

Quant au conflit `.cours-fab` / `.refresh-btn` / `.pf-helpbtn` / `.pv2-tbibtn` :
la garde **est écrite**, et bien écrite — `placerPersonnage()`
(`ztsh-shell.js:340-372`) détecte génériquement tout élément `fixed`/`sticky`
occupant le coin (pas une liste de sélecteurs codés en dur), décale de
260 px maximum, et **efface le shell** s'il ne peut pas dégager. Elle ne tourne
simplement jamais, puisque le personnage n'est pas monté.

→ **Rien à faire ici.** Si Joey veut réactiver le personnage un jour, la garde
est prête. Ce chantier peut sortir de la liste.

### 4.3 — Fond marine en projection : abandonné, et pour une bonne raison

Le banc `tni` **a été fait le 1er août** (`ETAT-CHANTIER-HABILLAGE.md:534`) et il
a trouvé un vrai défaut, corrigé depuis : `<html>` recevait `ztsh-on` sous
condition, `<body>` le recevait toujours — donc en densité `projection` le shell
effaçait le fond de l'app sans rien mettre à la place.

Décision du 2 août consignée ligne 625 : *« L'idée d'un fond marine en
`projection` est abandonnée »*. `projection` = tokens seuls, l'app décide de son
décor. **Ce n'est pas une dette, c'est une décision prise.** À rayer de la liste.

### 4.4 — D24 : la seule vraie décision qui bloque

`apps/planificateur/index.html:38` et `:467` :

```css
body.zts-embed [data-zts-header], … { display:none !important }
body.pv2       [data-zts-header], … { display:none !important }
```

Confirmé, non tranché. En mode intégré et en `?v2=1`, l'en-tête partagé
disparaît ; comme le shell ne pose pas sa propre barre mais **restyle
`.zts-header`**, pas d'en-tête ⇒ pas de barre du haut. Le planificateur est
l'app la plus lourde du site (4 éléments fixes à droite, classe `metier` en
collision, 5 variables en collision, plein écran, écriture Firestore, mode TBI).

**C'est une question pour Joey, pas un ticket :** en mode `?v2=1`, veut-on
l'en-tête partagé (et donc le menu, et donc la cohérence) ou l'écran plein
(et donc l'immersion) ? Tant que ce n'est pas répondu, l'app ne peut pas être
habillée.

### 4.5 — Ce que « Vague 2 » ne couvrait pas : tout le reste du site

```
grep -l  "ztsh-shell.css" *.html          →  0
grep -l  "ztsh-shell.css" articles/*.html →  0
grep -rl "ztsh-shell.css" jeux/           →  0
```

**Zéro page racine, zéro article, zéro fiche de jeu n'est habillée.** Les 46 apps
portent le shell ; les ~1475 autres pages du site portent seulement l'en-tête et
le pied de page partagés. Ce n'est pas nécessairement un défaut — le shell est
conçu pour des applications, pas pour des pages de lecture — mais **il faut
décider** si l'uniformisation visée par le chantier s'arrête aux apps. Si oui, le
chantier habillage est **terminé à 40/43 apps utiles** et peut être clos.

---

## 5. VENTE DES OUTILS — chantier neuf, matière première déjà là

**Verdict : PAS COMMENCÉ au sens « vendre », mais le terrain est meilleur que
prévu.** Il existe déjà des descriptions bilingues courtes ; ce qui manque, c'est
l'argument.

### 5.1 — Ce qui existe

Les trois hubs portent un tableau `ACTIVE` avec, pour chaque app, une description
**FR et EN** (`ep.html:97-124`, `camps-de-jour.html:96`, `service-de-garde.html:96`) :

```js
{ icon:'🎥', url:'apps/performances/', tag:'new',
  fr:{n:'Performances élèves', d:'Filme, range dans ton Drive, observe selon le PFEQ'},
  en:{n:'Student performances', d:'Film, auto-file to your Drive, PFEQ observation'} },
```

**C'est un bon socle** : 25 apps décrites, bilingues, en un seul endroit par hub.

### 5.2 — Pourquoi ça ne vend pas

Ces descriptions **nomment la fonction**, elles ne nomment ni la personne, ni le
problème, ni le gain. Comparaison, sur trois exemples réels :

| App | Aujourd'hui | Ce qui manque |
|---|---|---|
| Grille horaire | « Spécialistes, locaux et groupes » | *pour qui* : le spécialiste qui monte l'horaire de l'école en août ; *le problème* : trois jours de tableur et des conflits de local ; *le gain* : une heure |
| Carnet ÉPS | « Évaluation et présences » | *le problème* : les notes sur papier perdues au bulletin ; *le gain* : le bulletin se remplit tout seul |
| Ma Suppléance | « Plans clé en main pour suppléants » | *le problème* : le suppléant arrive à 7 h 50 sans plan ; *le gain* : un cours prêt en 2 minutes |

Sur l'accueil, c'est encore plus court : les cartes portent des étiquettes de
2 à 4 mots — « Fiches et générateurs », « Suivi des élèves », « Trames et
minuteries » (relevé en navigateur). **Aucune app du site n'a de fiche de vente.**

### 5.3 — Apps sans aucune description

Les **21 apps hors hub** (`colorier` et `performances` mises à part, qui figurent
sur `ep.html`) n'apparaissent dans aucun tableau `ACTIVE` : elles n'existent que
comme URL. Notamment `agenda`, `evaluation`, `grille`, `tni`, `omnigroupe`,
`moyens-action`, `cours-maternelle`, `code-oreille`, `scoreboard`, `transitions`.

### 5.4 — Où faire vivre ces descriptions — proposition

Une **source unique**, quatre points de consommation. C'est le seul modèle qui
évite trois versions divergentes du même argumentaire :

```
shared/apps-catalogue.json
{ "grille": {
    "fr": { "nom":"Grille horaire",
            "pitch":"Monte l'horaire de toute l'école en une heure, pas en trois jours",
            "pour":"Spécialiste qui bâtit l'horaire en août",
            "probleme":"Les conflits de local se découvrent en septembre",
            "gain":"Détection automatique des collisions" },
    "en": { … } } }
```

| Point de consommation | Ce qu'il consomme | Pourquoi |
|---|---|---|
| Cartes des 3 hubs | `nom` + `pitch` | remplace `ACTIVE[].d` — même place, meilleur texte |
| Accueil (`appsSection`) | `nom` + `pitch` | 27 liens actuellement nus |
| **Modale cadenas** | `pour` + `probleme` + `gain` de l'app demandée | **le plus fort levier du site** : l'argument arrive au moment exact où le visiteur veut la chose. Aujourd'hui `zts-locked-fullscreen.js` affiche un texte générique identique pour les 35 apps |
| Fiche par app (`/outils/<slug>.html`) | tout | pages SEO indexables qui vendent — et cible naturelle des partages |

**La modale cadenas d'abord.** Elle est déjà écrite, déjà affichée 35 fois sur le
site, et ne montre aujourd'hui aucun argument spécifique. Y injecter les trois
lignes de l'app demandée est un changement modeste au meilleur endroit possible.

---

## 6. PARTAGE RÉSEAUX SOCIAUX — rien n'existe

### 6.1 — Confirmation

Relevé en navigateur sur l'accueil : `share: []` — aucun élément dont le texte ou
la classe évoque le partage. Vérifié aussi : aucun `navigator.share` dans le
dépôt.

### 6.2 — Les cartes de partage : bonnes sur les jeux, faibles sur les outils

| Famille | `og:image` | `twitter:card` | Verdict |
|---|---|---|---|
| 1440 fiches `/jeux/` | `logo-zts.png` | `summary_large_image` | Carte présente mais **générique** — 1440 partages, une seule image |
| 25 articles | image héros propre (`articles/images/heroes/<slug>.jpg`) | `summary_large_image` | ✓ **le seul endroit fait correctement** |
| 43 apps | `favicon.png` | **`summary`** | ✗ vignette carrée minuscule, pas de grande carte |
| 14 pages | **aucun OG** | — | ✗ partage nu |

**Pages vivantes sans aucun OG :** `bienvenue.html` (le moment le plus chaud du
tunnel !), `login.html`, `repertoire.html`, `aidons-nous.html`, `politique.html`,
`sports-news.html`, `teasing.html`, et les apps `code-oreille`, `planificateur`,
`studio-jeu`, `nba-playoffs`, `nhl-playoffs`.

**Le pire cas est `bienvenue.html`** : c'est la page d'après-inscription, celle où
l'on veut que l'utilisateur partage — et c'est une des rares sans OG, sans image,
sans EN, et sans bouton de partage.

### 6.3 — Le bouton « Fais connaître Zone Total Sport » — conception

**Mécanique** — un seul module, `zts-partage.js`, chargé par `shared/zts.js`
comme l'est déjà `zts-newsletter.js` (`zts.js:245-247`) :

1. `navigator.share({title, text, url})` si disponible — couvre iOS et Android,
   c'est-à-dire la majorité du public enseignant ;
2. repli desktop : une rangée Facebook / X / LinkedIn / **Copier le lien**
   (le bouton « copier » est souvent le plus utilisé — il alimente les partages
   par courriel et par groupe Messenger, invisibles mais réels) ;
3. `ztsTrackFunnel('share_click', {canal, page})` pour mesurer.

**Pitch pré-rédigé** — deux longueurs, deux langues :

*FR, court (X, copier) :*
> Zone Total Sport : 1439 jeux, 1790 SAÉ et 20 outils pour l'éducation physique,
> le service de garde et le camp de jour. Gratuit, pour vrai.
> https://zonetotalsport.ca

*FR, long (Facebook, LinkedIn) :*
> Je viens de tomber sur Zone Total Sport et je le partage : 1439 jeux filtrables,
> 1790 SAÉ conformes au PFEQ, un générateur de SAÉ, une banque d'éducatifs, un
> carnet d'évaluation, une grille horaire… conçu par un prof d'ÉPS avec 22 ans
> d'expérience. Compte gratuit, aucune carte de crédit. Si tu enseignes l'ÉPS,
> travailles en service de garde ou en camp de jour, ça vaut les deux minutes.
> https://zonetotalsport.ca

*EN, court :*
> Zone Total Sport: 1,439 games, 1,790 lesson plans and 20 tools for PE teachers,
> after-school programs and day camps. Free, for real.
> https://zonetotalsport.ca

*EN, long :*
> Just found Zone Total Sport and I'm passing it on: 1,439 filterable games,
> 1,790 PFEQ-aligned lesson plans, an AI lesson generator, a drills bank, a
> gradebook, a scheduling grid — built by a PE teacher with 22 years in the gym.
> Free account, no credit card. Worth two minutes if you teach PE, run an
> after-school program or a day camp. https://zonetotalsport.ca

**Emplacements, par ordre de rendement attendu :**

1. **`/bienvenue.html`** — juste sous le bouton « Accéder à mes 90 cours ».
   L'utilisateur vient de recevoir quelque chose de gratuit ; c'est le pic de
   réciprocité de tout le parcours. **Si un seul emplacement est retenu, c'est
   celui-là.**
2. **Fin de fiche de jeu et fin d'article** — le lecteur satisfait, avec un pitch
   contextualisé (« Partage ce jeu »), ce qui donne au partage un objet concret
   plutôt qu'un site abstrait.
3. **Pied de page** — présence permanente, faible taux, coût nul (le pied de page
   est déjà partagé sur 1489 pages).
4. **En-tête** — je le déconseille : il est déjà à 10 éléments (6 entrées + burger
   + connexion + FR + EN), et un bouton de partage y entrerait en concurrence
   directe avec « Connexion », qui doit rester la première action.

---

## 7. BILINGUISME FR/EN

**Verdict : le chrome est bilingue, le contenu ne l'est qu'à moitié, et les trois
écrans qui décident d'une inscription sont FR seulement.**

### 7.1 — Ce qui est vraiment bilingue

| Élément | État | Preuve |
|---|---|---|
| En-tête, menu, pied de page, hubs | ✓ **complet** | `shared/i18n/{fr,en}.json` — **84 clés chacun, parité exacte** |
| Bascule FR/EN | ✓ fonctionne en prod | testé : `?lang`/`localStorage` → `html lang="en"`, hero « Getting kids moving, that's our mission! », nav « Home / Teaching tools / Learning units / Planning / Blog / Games » |
| Descriptions des hubs | ✓ FR+EN | `ACTIVE[].fr/.en`, 25 apps |
| **Données des 1439 jeux** | ✓ **exemplaire** | `jeux-merged.json` : **20 champs EN sur 1439/1439 jeux** — `titleEn`, `butEn`, `deroulementEn`, `variantesEn`, `consignesSecuriteEn`, `adaptationsEn`… |

### 7.2 — Ce qui est FR seulement — et ce sont les pires endroits

| Écran | Occurrences EN | Conséquence |
|---|---|---|
| **Modale cadenas** (`zts-locked-fullscreen.js`) | **0** | un anglophone voit un mur en français sur 35 apps |
| **Modale d'inscription** (`firebase-auth.js`) | **0** | le formulaire de conversion lui-même est FR |
| **`/bienvenue.html`** | **0** | l'accueil post-inscription est FR |
| Les 25 articles | FR seulement | — |

Les trois premiers forment **le tunnel de conversion complet**. Un visiteur
anglophone arrivant par un jeu (dont la fiche est traduite !) traverse un site
anglais jusqu'au moment de s'inscrire, où tout bascule en français. C'est le
maillon le plus incohérent du site.

> `shared/zts-gate.js:26-58` porte, lui, un dictionnaire FR/EN complet. Le bon
> patron existe donc déjà dans le dépôt — il suffit de le reproduire dans
> `zts-locked-fullscreen.js` et `firebase-auth.js`. Ce n'est pas une conception,
> c'est une recopie.

### 7.3 — Traduction Tier 1 : ce qui est arrivé dans `main`, exactement

La branche `origin/pont/wip` (1 commit, **22 juin**, `996f8db` — « trad Tier 1,
11 apps ») n'a jamais été fusionnée. Ce qui a atterri dans `main` par d'autres
chemins, mesuré app par app :

| App Tier 1 | Signaux EN dans `main` | Verdict |
|---|---|---|
| `jeux` | **5314** | ✓ complet (données) |
| `generateur` | 58 | ✓ |
| `educatifs` | 9 (+ `i18n.js`, `lang/translations.js` présents) | partiel |
| `musique` | 9 (+ `lang/translations.js` présent) | partiel |
| `sae` | 8 | partiel |
| `grille` | 1 | ✗ quasi nul |
| `tni` | 1 | ✗ quasi nul |
| `cours-maternelle` | **0** | ✗ |
| `moyens-action` | **0** | ✗ |
| `nba-playoffs` | **0** | ✗ (contenu mort) |
| `nhl-playoffs` | **0** | ✗ (contenu mort) |

`TRAD-SPEC.md` et `header-demos.html`, présents sur `pont/wip`, sont **absents de
`main`**.

**Attention avant de fusionner `pont/wip` :** la branche a 7 semaines et `main` a
divergé de **187 fichiers / 6301 insertions / 11847 suppressions** — `studio-jeu`
est arrivé depuis, les images de `suppleance` et `tni` ont changé. **Une fusion
directe ferait des dégâts.** La bonne manœuvre est un `git cherry-pick` fichier
par fichier sur les 5 apps où l'EN vaut vraiment le coup
(`cours-maternelle`, `moyens-action`, `grille`, `tni`, plus le complément
`educatifs`), en ignorant `nba-playoffs` et `nhl-playoffs`.

---

## 8. AUTRES

### 8.1 — Resend : le formulaire de capture de courriels échoue à chaque envoi

**C'est la panne silencieuse la plus coûteuse du site, et elle est active
maintenant.**

```
curl -X POST https://zts-send-pdf.zts-ccd.workers.dev/ \
     -d '{"email":"…"}'
→ {"ok":false,"error":"API key is invalid"}
```

Ce qui en dépend : `zts-newsletter.js`, chargé par `shared/zts.js:245-247` sur
**toutes les pages de contenu** — accueil, 3 hubs, blog, 25 articles, 1440 fiches
de jeux (exclut `/apps/*`, `bienvenue`, `politique`, `login`, `teasing`, `promo`,
ligne 31). Il s'ouvre à l'intention de sortie, à 50 % de défilement, ou après 35 s.

Chemin d'échec, `zts-newsletter.js:228-246` :

```js
.then(function (res) {
  if (res && res.ok) { … markDone(); track('newsletter_complete'); … }
  else { btn.disabled = false; showMsg(t().err, 'err'); }   // ← toujours ici
})
```

Le visiteur voit un message d'erreur, **son courriel n'est enregistré nulle part**
— ni Firestore, ni fichier, ni journal. Il est simplement perdu. Et comme
`markDone()` n'est jamais appelé, la modale **reviendra le harceler** à la visite
suivante.

**Deux replis, au choix, tous deux gratuits :**

- **Mise en veille propre (30 minutes)** — ne plus charger `zts-newsletter.js`
  tant que l'envoi ne marche pas, et rediriger le CTA « 90 cours » vers
  `ztsShowSignup()`. On perd la capture par courriel, on **gagne des comptes
  complets** — ce qui est justement le pilier n°1. C'est **ma recommandation** :
  le lead magnet par courriel entre de toute façon en concurrence avec
  l'inscription, et l'inscription vaut plus.
- **Repli gratuit (2 heures)** — écrire le courriel dans une collection Firestore
  `leads` (le SDK est déjà chargé partout, les règles existent), et laisser le
  Worker envoyer plus tard. Aucun courriel perdu, aucun coût.

À vérifier au passage : `cf-worker/notify-coordo/` dépend aussi de Resend
(`wrangler.toml`, `src/notify-coordo-worker.js`) — probablement muet lui aussi.

### 8.2 — Polices : le travail du 9 août est réel mais **partiel**

Le commit `bfb5754` a bien ajouté le `@font-face` local dans les **deux** fichiers
(`shared/zts.css:23,30` et `shared/zts-header.css:18,28`), avec l'alias sous le
nom Google — c'était le bon geste. **Mais les balises `<link>` vers Google n'ont
pas été retirées :**

```
fichiers appelant fonts.googleapis.com          →  1557
dont demandant explicitement Luckiest+Guy       →  1522
```

Répartition : 1440 fiches `/jeux/`, 26 articles, 15 fichiers `wix/`, et une
poignée d'apps. Le motif dominant, sur les 1440 fiches :
`css2?family=Luckiest+Guy&family=Quicksand:wght@500;700`.

Deux conséquences :

1. **1522 pages font toujours un aller-retour réseau vers Google** au chargement —
   coût de performance et d'attente, précisément ce que le passage au local
   visait à supprimer.
2. **L'objectif « 4 polices » n'est pas atteint dans les faits.** Sont encore
   demandées à Google, en plus des quatre : `Boogaloo`, `Patrick Hand`,
   `Fredoka One`, `Fredoka`, `DynaPuff`, `Schoolbell`, `Gloria Hallelujah`.
   `zts-locked-fullscreen.js:96` **injecte lui-même** un `<link>` Google
   (`family=Fredoka…&family=Luckiest+Guy`) à l'ouverture de la modale cadenas —
   c'est du CSS injecté par JS, exactement le cas que le balayage du 8 août avait
   manqué. Le mémo le signalait : **un balayage de polices doit couvrir les
   `@import` et le CSS injecté par JS**. Il reste au moins ce cas-là.

### 8.3 — Branches

**12 branches distantes sont à 0 commit d'avance sur `main`** — entièrement
fusionnées, supprimables sans perte :
`chore/hook-secrets-restaure`, `docs/file-attente`, `docs/phase-c`,
`feat/biblio-camp-seed`, `feat/planif-refonte-v2`, `feat/planif-semaine-presences`,
`fix/auth-et-compteurs`, `fix/menu-utilisateur-z-index`, `fix/routing-subdomains`,
`header/vague-a-articles`, `v2-merge`, et les branches locales correspondantes.

**5 branches portent du travail non fusionné :**

| Branche | Avance | Dernier commit | À faire |
|---|---|---|---|
| `claude/zero-signups-diagnostic-d3619k` | 7 | 9 juil. | **À lire avant tout chantier conversion** — « diagnostic zéro inscriptions (funnel/auth/redirects/SEO) » et « audit conversion (chemins de consommation gratuite) ». Ce diagnostic recouvre directement §1 et §5 |
| `claude/fix-analytics-seo` | 3 | 9 juil. | GA4 site-wide via `zts.js` + méta-descriptions coupées sur un mot entier. **Utile** si la mesure du tunnel compte |
| `claude/conversion-cta` | 2 | 9 juil. | CTA compte inline sur les fiches de jeux — **exactement le sujet de §1.4** |
| `feat/notif-stats-daily` | 3 | 18 juin | rapport quotidien (dépend de Resend, §8.1) |
| `pont/wip` | 1 | 22 juin | traduction Tier 1 — voir §7.3, **ne pas fusionner tel quel** |

Les trois branches `claude/*` datent du 9 juillet et traitent précisément des
sujets ouverts aujourd'hui. **À relire avant d'écrire quoi que ce soit sur la
conversion** — il y a peut-être du travail déjà fait.

### 8.4 — Dettes D17-D25 : lesquelles bloquent quoi

| Dette | État | Bloque |
|---|---|---|
| D17, D17bis, D18, D19 | ouvertes | Rien de ce qui précède (dette interne du shell) |
| **D20** `performances` popup iOS | **ouverte, confirmée** | **§2 auth** — casse une fonctionnalité sur iPhone |
| **D21** `aidons-nous` select_account | **ouverte, confirmée** | **§2 auth** |
| **D22** CI aveugle à la racine | **ouverte, confirmée** | **Tout.** `.github/workflows/verifie-habillage.yml:11` — `paths: ['apps/**','assets/ztsh-*','shared/**','_scripts/verifie-*']`. **`firebase-auth.js`, `firestore.rules`, `index.html`, `blog.html` passent en CI sans aucun contrôle.** Or c'est exactement là que va se faire le chantier lockage |
| D23 fonds `!important` | ouverte | Cosmétique. Décision, pas conséquence |
| **D24** planificateur | **ouverte, non tranchée** | **§4 habillage** — bloque la dernière app lourde |
| D25 doublons `header/footer.html` | ouverte | Risque de modifier le mauvais fichier. `includes.js` est mort (aucune page ne le charge) |

**D22 est la plus importante des sept**, et c'est contre-intuitif : elle ne casse
rien aujourd'hui, mais **tout le chantier lockage se joue à la racine du dépôt**
(`zts-lock*.js`, `locked-whitelist.json`, `firebase-auth.js`, `index.html`) —
c'est-à-dire dans l'angle mort de la CI. Élargir les `paths` **avant** d'ouvrir le
chantier, pas après.

---

# b) PLAN D'EXÉCUTION ORDONNÉ

Ordre : le lockage d'abord (pilier n°1), puis ce qui rapporte le plus par unité
d'effort sur l'inscription et le partage. Tailles : **petit** ≈ une séance,
**moyen** ≈ une journée, **gros** ≈ plusieurs jours.

## LOT 0 — Débloquer le terrain (à faire avant d'écrire une ligne)

| # | Action | Taille | Dépend de | Pourquoi maintenant |
|---|---|---|---|---|
| 0.1 | **Trancher le diff non committé de `firebase-auth.js`** (garder / jeter) | petit | — | Bloque 0.2, 2.x et tout le chantier auth. Fichier servi sur 1510 pages |
| 0.2 | **Retirer `getRedirectResult`** | petit | 0.1 | **Échéance 15 août — dans 5 jours** |
| 0.3 | **Élargir les `paths` de la CI à la racine** + y ajouter `verifie-secrets.sh` | petit | — | D22. Sans ça, tout le LOT 1 se fait sans filet |
| 0.4 | **Lire les 3 branches `claude/*`** (diagnostic zéro inscriptions, conversion-cta, analytics-seo) | petit | — | Du travail sur ces sujets existe peut-être déjà |
| 0.5 | Supprimer les 12 branches fusionnées | petit | — | Hygiène ; rend visibles les 5 qui comptent |

## LOT 1 — LOCKAGE (pilier n°1)

| # | Action | Taille | Dépend de |
|---|---|---|---|
| 1.1 | **Remettre un verrou sur l'accueil** — donner à `index.html` le conteneur que `zts-unlock.js` sait verrouiller, ou adapter le script aux cartes existantes | **moyen** | 0.3 |
| 1.2 | **Corriger `getSlug()`** pour reconnaître `/jeux/<slug>.html` | petit | 0.3 |
| 1.3 | **Étendre `locked-whitelist.json`** : ajouter `freeItems: {jeux:[3], sae:[3]}` ; sortir `code-oreille`, entrer `colorier` | petit | 1.2 |
| 1.4 | **Mode fiche tronquée** sur les 1440 fiches de jeux (réutiliser `applyHalf()` des articles) | **moyen** | 1.2, 1.3 |
| 1.5 | **Même chose côté SPA `apps/jeux` et `apps/sae`** : 3 items libres, le reste au cadenas | **gros** | 1.3 |
| 1.6 | Poser un verrou sur les 3 apps ouvertes par oubli (`performances`, `planificateur`, `studio-jeu`) | petit | — |
| 1.7 | **`jeux-merged.json` derrière un Worker** vérifiant un jeton Firebase | **moyen** | 1.5 |
| 1.8 | Décider du sort du texte intégral dans le DOM des articles (§1.7) | petit (décision) | — |

> **1.1 et 1.2 sont les deux plus rentables du document.** L'accueil est la porte
> d'entrée ; les 1440 fiches sont le plus gros volume de contenu ouvert.
> **1.7 est ce qui ferme réellement la fuite** — sans lui, le reste est un rideau.

## LOT 2 — CONVERSION (transformer le verrou en inscriptions)

| # | Action | Taille | Dépend de |
|---|---|---|---|
| 2.1 | **Test réel iPhone Safari du tunnel + `signup_complete` dans GA4** | petit | 0.1 |
| 2.2 | Corriger **D20** (`performances`) et **D21** (`aidons-nous`) | petit | 0.1 |
| 2.3 | **Traiter Resend** : mise en veille de `zts-newsletter.js` ou repli Firestore | petit | — |
| 2.4 | **`shared/apps-catalogue.json`** — pitch FR+EN pour les 46 apps | **moyen** | — |
| 2.5 | **Injecter l'argument de l'app demandée dans la modale cadenas** | petit | 2.4 |
| 2.6 | Traduire **modale cadenas + modale inscription + `/bienvenue.html`** (recopier le patron de `zts-gate.js`) | petit | 0.1 |
| 2.7 | Remplacer les descriptions des hubs et de l'accueil par les pitchs | petit | 2.4 |

> **2.5 est le meilleur rapport effort/valeur du document** : l'argument arrive
> pile au moment où le visiteur veut la chose, dans un composant déjà écrit et
> déjà affiché 35 fois.
> **2.3 est urgent** : la fuite de courriels est active aujourd'hui.

## LOT 3 — PARTAGE (pilier n°3)

| # | Action | Taille | Dépend de |
|---|---|---|---|
| 3.1 | `zts-partage.js` — Web Share API + replis + copier le lien, pitch FR/EN | **moyen** | — |
| 3.2 | Le poser sur **`/bienvenue.html`** | petit | 3.1 |
| 3.3 | OG complet sur `bienvenue`, `login`, `repertoire`, `aidons-nous`, `politique` + les 5 apps sans OG | petit | — |
| 3.4 | Passer les 43 apps en `summary_large_image` + image dédiée par app | **moyen** | 2.4 |
| 3.5 | Bouton en fin de fiche de jeu et fin d'article | petit | 3.1 |
| 3.6 | Image OG par fiche de jeu (remplacer `logo-zts.png`) | **gros** | 3.4 |

> **3.2 avant tout le reste** : `/bienvenue.html` est le pic de réciprocité.
> **3.3 est un préalable invisible** — un bouton de partage qui produit une carte
> vide fait plus de mal que pas de bouton du tout.

## LOT 4 — FINITIONS

| # | Action | Taille |
|---|---|---|
| 4.1 | Menu sur les 8 pages qui ne l'ont pas (§3) | petit |
| 4.2 | `colorier` : retirer les 8 « bûcheron », OG, EN dans `app.js` | petit |
| 4.3 | Retirer les `<link>` Google des 1522 pages + le `<link>` injecté par `zts-locked-fullscreen.js:96` | **moyen** (script de masse ⇒ essai à blanc obligatoire) |
| 4.4 | Cherry-pick sélectif de `pont/wip` sur 5 apps (§7.3) | **moyen** |
| 4.5 | Trancher **D24** (planificateur `?v2=1`) puis habiller `evaluation`, `scoreboard`, `planificateur` | moyen |
| 4.6 | Supprimer `nba-playoffs`, `nhl-playoffs`, `index-old.html`, `teasing.html` | petit |
| 4.7 | Passer le domaine apex en proxy orange (SSL **Full**) pour activer les 7 redirections de chemins | petit (infra) |
| 4.8 | Supprimer les vieilles Redirect Rules de zone (`agenda.`, `ia.`) pour retomber à 1 saut | petit (infra) |

## Dépendances entre chantiers — l'essentiel en cinq lignes

- **0.1 (diff auth) bloque 0.2, 2.1, 2.2, 2.6.** C'est le nœud à défaire en premier.
- **0.3 (CI) devrait précéder tout le LOT 1**, qui se joue entièrement à la racine.
- **1.2 (`getSlug`) conditionne 1.3 et 1.4** — sans elle, poser des verrous sur les
  fiches de jeux ne produit rigoureusement rien.
- **2.4 (catalogue) alimente 2.5, 2.7 et 3.4.** Une source, quatre consommateurs.
- **3.3 (OG) doit précéder 3.1** — sinon on distribue des cartes vides.

---

# c) L'ACCROCHEUR POST-INSCRIPTION

> *Ce qui suit est une recommandation, pas un constat. Elle s'appuie sur ce que
> le site contient déjà — je n'ai proposé que des choses réalisables avec la
> matière en place.*

## Le diagnostic, en une phrase

Le site est aujourd'hui une **bibliothèque** : on y vient chercher une chose, on
la prend, on repart. Une bibliothèque ne se partage pas et ne fidélise pas. Ce
qui rend un outil indispensable, c'est **d'y revenir sans le décider** — parce
qu'il détient quelque chose qu'on n'a pas ailleurs, ou parce qu'il arrive au bon
moment. Zone Total Sport a déjà tout pour ça et ne s'en sert pas.

Un signe concret : `/bienvenue.html` offre les 90 cours, puis dit *« Bookmarke
cette page »*. C'est demander à l'utilisateur de faire lui-même le travail de
rétention. Personne ne le fait.

## Ce qui rendrait le site indispensable au quotidien

### 1. « Mon lundi » — la page d'accueil de l'inscrit

**Le vrai accrocheur, et il ne demande aucun contenu nouveau.** Aujourd'hui, un
inscrit qui revient retombe sur la même page d'accueil qu'un anonyme. Il devrait
retomber sur **sa** page :

- son prochain cours planifié (le planificateur le sait déjà) ;
- un jeu suggéré selon le cycle et la météo (les données existent : `MENU.weather`
  sur les 3 hubs, 1439 jeux étiquetés intérieur/extérieur) ;
- ses 3 dernières SAÉ consultées ;
- ce qui a été ajouté depuis sa dernière visite.

C'est une page de composition, pas de création : **tout le contenu est déjà là.**
Elle transforme « un site où je vais chercher » en « un site qui m'attend ».

### 2. L'agenda comme crochet, pas comme app

`agenda`, `grille` et `evaluation` sont les trois seules apps où l'utilisateur
**dépose ses propres données**. Ce sont donc les trois seules qui créent un coût
de départ. Une banque de jeux se remplace ; un horaire d'école qu'on a monté
pendant deux heures, non.

**Elles sont pourtant présentées comme les autres** — « Suivi des élèves »,
« Spécialistes, locaux et groupes ». Elles devraient être poussées **en premier**
après l'inscription, pas noyées dans une grille de 25 cartes. Le message n'est pas
« voici un carnet », c'est *« mets tes groupes une fois, et le bulletin se remplit
tout seul en juin »*.

### 3. Le rendez-vous hebdomadaire

Un courriel du dimanche soir — *« Ton lundi : 3 jeux pour la pluie annoncée
demain »* — est la mécanique de rétention la plus éprouvée pour ce public, et le
site a déjà tout : 1439 jeux étiquetés, le menu du jour par métier, `blagues-citations.json`,
`ephemerides.json`, `conseils-eps.json`.

**Mais l'envoi de courriels est cassé (§8.1).** C'est la deuxième raison de régler
Resend, et la plus importante : sans canal de retour, il n'existe aucun moyen de
ramener un inscrit qui n'a pas mis le site en favori.

### 4. Ce qui donne envie de partager

Un enseignant ne partage pas un site. **Il partage une chose qui lui a sauvé une
journée**, et il la partage à ses collègues d'école, pas au monde.

Trois conséquences concrètes :

- **Partager l'objet, pas le site.** « Envoie ce jeu à un collègue » convertit
  mieux que « Fais connaître Zone Total Sport » — et le destinataire arrive sur
  une fiche utile, pas sur une page d'accueil. C'est aussi ce qui donne du sens à
  §1.4 : la fiche tronquée est **exactement** ce que le collègue doit voir.
- **Le moment.** Juste après avoir imprimé, exporté un PDF, ou terminé une
  planification. Pas dans l'en-tête.
- **La carte doit être belle** (§6.2). Un jeu partagé dans un groupe Facebook de
  profs d'ÉPS avec le logo générique passe inaperçu ; avec le titre du jeu, une
  image et « 1439 jeux gratuits », il est cliqué.

### 5. Ce que le lockage doit dire, et pas dire

Le lockage étant le pilier n°1, un mot sur sa formulation. Le mur actuel dit
*« Cette ressource est réservée aux membres gratuits »* — c'est un refus.

Ce que le visiteur doit lire, c'est un échange :

> **Ce jeu-ci est à toi. Les 1436 autres aussi, en 20 secondes.**
> Compte gratuit. Aucune carte. Tu repars avec 90 cours d'ÉPS clé en main.

Même mur, même code, même clic. La différence est que le premier ferme une porte
et le second en ouvre une — et c'est précisément ce que §2.5 (l'argument de vente
dans la modale cadenas) permet de faire app par app, jeu par jeu.

---

## Ce que je n'ai pas pu vérifier, et pourquoi

Par honnêteté sur la portée de cet audit :

- **Le tunnel d'inscription de bout en bout sur un vrai iPhone** — je n'ai pas
  d'appareil ni de compte Google de test. `signup_complete` reste non prouvé (§2.2).
- **Les chiffres GA4** (taux `locked_view` → `locked_click_signup` → `signup_complete`)
  — pas d'accès à la console. La branche `claude/zero-signups-diagnostic-d3619k`
  en contient peut-être (§8.3).
- **L'état du tableau de bord Cloudflare** — les 301 sont mesurées de l'extérieur,
  mais je n'ai pas vu les règles elles-mêmes. Le diagnostic « ancienne Redirect
  Rule de zone » (§1.5) est une inférence à partir des 2 sauts observés et du
  document, pas une lecture directe.
- **Le rendu visuel** de chaque page — j'ai vérifié la structure et le
  comportement en navigateur sur 4 pages, pas l'apparence des 1489.

---

*Audit réalisé le 10 août 2026 sur `main` @ `d391e73`. Lecture seule.
Aucun fichier du site modifié, aucun commit. **GO explicite requis avant toute
écriture.***
