# Fiches de jeu — éditeur et pages publiques

Branche `feat/fiches-firebase`. Livré le 16 août 2026.

Portage sur Firebase de la maquette « Fiche de jeu.dc.html » : le contenu
vit dans Firestore, les images dans Storage, l'édition est réservée à
l'admin, et la consultation publique s'arrête à la page 1.

---

## 1. Ce que la maquette était vraiment

Trois constats relevés en exécutant le fichier livré, pas en le lisant.

**`support.js` n'était pas autonome.** C'est le runtime d'artefact Claude
(`dc-runtime`). Au chargement il téléchargeait **React 18.3.1 + ReactDOM
depuis unpkg.com** (~142 Ko, avec SRI). Sans accès à unpkg : page blanche,
`document.body.innerText` vide — reproduit en navigateur. Une page publique
du site aurait dépendu d'un CDN tiers pour s'afficher.

**`image-slot.js` ne persistait rien.** Il lisait et écrivait un fichier
voisin `.image-slots.state.json` via un pont `window.omelette` qui n'existe
que dans l'hôte d'artefacts. Sur un serveur normal : 404 observé, composant
en lecture seule — son propre commentaire d'en-tête le disait. **Il n'y
avait donc aucune image à migrer** : seuls `zts-fiche-textes`,
`zts-fiche-pages` et `zts-unlocked` contenaient quelque chose.

**Les textes étaient indexés par position.** `leaves()` parcourait tous les
`h1/h2/h3/p/li/div/span` de chaque page et numérotait `p0-l0`, `p0-l1`…
Trois conséquences : ajouter une phrase décalait toute la carte sur le
mauvais élément ; des morceaux d'interface (« PORTRAIT », « SUITE », « BUT
DU JEU ») étaient sauvegardés comme du contenu ; et le **titre n'a jamais
été éditable** (le parcours saute les `<span>` d'un `<h1>`), pas plus que
les deux variantes de la page 4 (elles contiennent un `<strong>`).

Le portage remplace tout ça par des champs nommés (`data-champ="sections.0.
explications.1.texte"`) qui pointent directement dans le document Firestore.

---

## 2. Fichiers

```
fiches/
  index.html               /fiches — index public, groupé par catégorie
  fiche.html               page publique d'une fiche
  zts-fiche-modele.js      moteur de rendu (vanille, zéro dépendance)
  zts-fiche-formes.js      rendu des formes et des surcharges de style
  zts-image-slot.js        <image-slot> : téléversement Storage
  zts-fiches-firebase.js   accès Firestore + Storage
  zts-fiche.css            habillage de page + CSS d'impression
  assets/
    fond-zts.png           fond portrait/paysage (inchangé)
    fond-page2.png         fond de la page 2 — quantifié 262 Ko → 41 Ko,
                           pixels identiques (l'image n'a que 4 couleurs)
    logo-bandeau2.png      bandeau du bas (inchangé)

admin/fiches/
  index.html               /admin/fiches — éditeur protégé
  zts-editeur.js           logique d'édition, sauvegarde, migration
  zts-atelier.js           coque d'édition : barre, rail, dock, sélection
  zts-atelier.css          habillage sombre de la coque (admin seulement)

_scripts/
  zts-admin-claim.js       pose le custom claim admin (one-shot)
  zts-seed-sections.js     remplit la collection `sections`

cf-worker/fiches-img/
  wrangler.toml            binding R2 `FICHES` → bucket `zts-fiches`
  src/auth.js              vérification du jeton Firebase (dupliqué de jeux-data)
  src/worker.js            GET pub/prive, PUT et DELETE admin

storage.rules              CONSERVÉ mais PLUS DÉPLOYÉ — documente le modèle
                           pub/ prive/ que le Worker reproduit
firestore.rules            MODIFIÉ — blocs `fiches` et `sections`
firebase.json              plus de bloc `storage` (voir §6)
```

La police n'est **pas** dupliquée : `zts-fiche.css` pointe sur
`/fonts/ZoneTotalSport.ttf`, la copie de référence
(voir `TICKET-TTF-COPIE-UNIQUE.md`). Elle est déclarée sous le nom distinct
**`ZoneTotalSportFiche`**, comme l'exige `CLAUDE.md` — une `@font-face`
nommée « ZoneTotalSport » entre en collision avec celles de
`jeux`/`moyens-action`/`studio-jeu` et rend au double de sa taille.
**Pas de `size-adjust:50%` ici** : la maquette a été composée contre la
fonte non ajustée (titre à `font-size:24px`) ; l'ajouter diviserait toutes
les tailles par deux.

---

## 3. Modèle de données

Le document est **scindé en deux**, et c'est ce qui fait tenir le mur
d'inscription.

```
fiches/{ficheId}                  ← lisible par tous si statut == 'publie'
  slug             string           unique, [a-z0-9-]
  titre            string
  sousTitre        string
  badges           [{ texte, couleur, largeur? }]
  imagePrincipale  string           chemin R2 (zone pub/), voir §6
  univers          'eps'|'camps'|'sdg'
  category         string           slug d'une section
  statut           'brouillon'|'publie'
  createdAt, updatedAt

fiches/{ficheId}/prive/contenu    ← lisible seulement si connecté
  butDuJeu         string
  imagePage2       string           chemin R2 (zone prive/), voir §6
  sections         [ { titre, gabarit, orientation,
                       explications: [ { texte, imagePath } ] } ]
  statut           string           recopié, voir plus bas
```

**Les chemins d'image** ont la forme `fiches/{ficheId}/{pub|prive}/{slotId}.{jpg|png}`
— c'est à la fois ce que Firestore stocke et la clé dans R2, donc les deux ne
peuvent pas diverger. Ce n'est **jamais** une URL complète : le domaine du
Worker est une constante côté client (§6).

**Les deux moitiés du mur doivent rester cohérentes.** Firestore scinde le
document pour le TEXTE ; le Worker fait la même coupure pour les IMAGES. Une
image de la page 2 rangée par erreur dans `pub/` percerait le mur sans que le
document Firestore ait bougé d'un octet.

**Pourquoi scinder.** Une règle « lecture publique si `statut == 'publie'` »
posée sur un document unique ne protège rien : le déroulement complet part
dans la même réponse REST, et le mur n'est plus qu'un masquage côté
navigateur. Un `curl` sur l'API Firestore suffirait à tout lire. La coupure
est donc dans la donnée, pas dans l'affichage.

`statut` est recopié dans le document privé pour que sa règle de lecture
n'ait pas besoin d'un `get()` sur le parent — une lecture facturée de moins
à chaque affichage de fiche.

Côté Storage, même découpe : `fiches/{id}/pub/*` est public (c'est la
vignette de l'index et l'image `og:`), `fiches/{id}/prive/*` demande une
session. Sans ça le mur ne tiendrait pas : l'identifiant de la fiche est
public et les noms de fichiers dérivent du champ, donc devinables.

### Gabarits de section

Le modèle `sections[]` demandé rend les quatre pages de la maquette :

| Section | `gabarit` | Rendu |
|---|---|---|
| Déroulement | `pleine` | sa propre page, titre 34 px, cases 300×170 |
| Matériel & préparation | `demi` | partage une page avec la suivante, titre 30 px, cases 260×132 |
| Variantes | `demi` | ↑ même page |
| sections ajoutées | `pleine` | une page chacune, portrait ou paysage |

L'alternance texte/image et l'alternance des ombres (cyan / jaune) courent
sur toute la **page**, pas sur la section : dans la maquette, « Variantes »
reprend l'alternance là où « Matériel » l'avait laissée.

### Balisage léger dans les textes

`**Tempête :**` rend une amorce en jaune, comme le `<strong
style="color:#FFF200">` codé en dur de la maquette — à la différence près
que celle-ci rendait justement le texte non éditable.

---

## 4. Sections de publication

Elles ne sont pas inventées : `_scripts/zts-seed-sections.js` les extrait de
`apps/jeux/data/jeux-merged.json`, qui classe déjà les 1439 jeux du site sur
deux axes — `univers` (eps 1233 / camps 909 / sdg 113) et `category`
(18 valeurs, chacune avec son nom, son icône et sa couleur). Reprendre cette
taxonomie évite d'avoir deux vocabulaires concurrents dans le même site, ce
que la règle d'or n°2 de `CLAUDE.md` interdit.

L'ordre est celui du nombre de jeux par catégorie, décroissant :
`collectifs` (177), `poursuites` (139), `traditionnels` (133), `opposition`
(110), `ballons-chasseurs` (100), `ludiques` (83), `cooperatifs` (68),
`afrique-asie` (65), `ameriques-europe` (65), `avec-materiel` (65),
`olympiques` (60), `autochtones` (59), `secondaire` (57), `duels` (54),
`prescolaire` (54), `exterieur` (50), `sans-materiel` (50),
`individuels` (50).

---

## 5. URLs

`/jeux/` héberge déjà **1439 pages HTML statiques** et 1439 entrées dans
`sitemap-jeux.xml`. Les fiches vivent donc sous `/fiches/`, sans toucher à
l'existant.

| URL | Sert |
|---|---|
| `/fiches/` | index des fiches publiées |
| `/fiches/fiche.html?f={slug}` | une fiche — **forme active** |
| `/fiches/{slug}` | même fiche, URL propre — **demande un Worker** |
| `/admin/fiches/` | éditeur |

GitHub Pages ne sait pas router `/fiches/{slug}` vers un fichier. `fiche.html`
lit **déjà** le slug depuis le chemin *ou* depuis `?f=` : le jour où le
Worker est déployé, il n'y a rien à migrer, il suffit de passer
`URLS_PROPRES` à `true` dans `fiches/index.html`.

Le Worker, si tu le veux (tu as déjà wrangler 4.100.0 et `cf-worker/`) :

```js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const m = url.pathname.match(/^\/fiches\/([a-z0-9-]+)\/?$/);
    if (!m) return fetch(request);
    url.pathname = '/fiches/fiche.html';
    url.searchParams.set('f', m[1]);
    return fetch(new Request(url, request));
  }
};
```

Route Cloudflare : `zonetotalsport.ca/fiches/*`.

---

## 6. Les images ne sont PAS dans Firebase Storage

**Décision du 17 août 2026.** Créer un bucket Firebase exige le forfait
**Blaze**, qui bascule *tout* le projet en facturé à l'usage — Firestore
compris, alors qu'il s'arrête aujourd'hui net au quota Spark. Et le palier
« Always Free » des buckets `*.firebasestorage.app` ne couvre que
US-CENTRAL1/EAST1/WEST1, jamais `northamerica-northeast1`, la région de la
base.

Les images vivent donc dans **Cloudflare R2**, bucket `zts-fiches`, derrière
le Worker **`zts-fiches-img`**. R2 ne facture aucun trafic sortant.

Le bloc `storage` a été retiré de `firebase.json` : tant qu'il y était,
`firebase deploy` échouait **même en ne demandant que les règles Firestore**,
parce que le CLI vérifie l'existence du bucket avant de déployer quoi que ce
soit. `storage.rules` reste dans le dépôt — il documente le modèle
`pub/` `prive/` que le Worker reproduit — mais il n'est plus déployé.

### Le Worker

| Route | Qui |
|---|---|
| `GET /img/{ficheId}/pub/{fichier}` | tout le monde, cache du bord 24 h |
| `GET /img/{ficheId}/prive/{fichier}` | jeton Firebase valide, cache navigateur seulement |
| `PUT` · `DELETE /img/{ficheId}/{zone}/{fichier}` | admin (`claims.admin` ou `zts@hotmail.ca`) |

**Deux chemins distincts, pas une URL dont le corps varie** — même
raisonnement que `zts-jeux-data` : une URL unique qui dépend de
`Authorization` imposerait `Vary: Authorization`, ce qui anéantit le cache du
bord et risque de servir une image de membre à un anonyme si une couche ignore
le `Vary`.

**Bucket séparé de `zts-banques`** : les banques sont réécrites par la CI à
chaque poussée sur `main` et sont régénérables depuis le dépôt ; les rendus DAZ
ne le sont pas. Contenu jetable et contenu irremplaçable ne partagent pas un
bucket.

### Pourquoi une image privée passe par un `blob:`

Un `<img src>` n'envoie **aucun en-tête**, donc jamais l'`Authorization` :
une URL nue vers `/prive/` recevrait 401 à chaque illustration de membre.
Firebase Storage réglait ça en glissant un jeton dans la query string de
`getDownloadURL()`. Ici `urlDe()` récupère les octets avec le jeton puis les
donne au navigateur sous forme de `blob:` URL. Le public, lui, reste une
concaténation pure — donc cacheable par le navigateur et par le bord.

C'est aussi pourquoi le cache `_cacheUrl` **survit** côté privé : sans lui,
chaque redessin de l'éditeur retéléchargerait toutes les illustrations.
`ZTSFichesDB.oublierImages()` libère les `blob:` avant de charger une autre
fiche.

### Ce qui reste à faire dans la console Firebase

**Autoriser le domaine.** Console → **Authentication → Settings → Domaines
autorisés** : `zonetotalsport.ca` doit y figurer (il y est probablement déjà,
`firebase-auth.js` tourne en production).

Le **custom claim** n'est pas requis pour démarrer : les règles acceptent le
repli par courriel `zts@hotmail.ca`. Pour le poser proprement, voir §7.

---

## 7. Déploiement

Le site est servi par **GitHub Pages** (`CNAME`, dépôt `zts-zone-page`), pas
par Firebase Hosting — `firebase.json` ne contient que `firestore` et
maintenant `storage`. Il y a donc **deux déploiements distincts**.

### a) Les pages — git

```bash
cd ~/dev/Remotion\ 2/wix-deploy
git config core.hooksPath .githooks       # sur un poste neuf seulement
git checkout feat/fiches-firebase
git push -u origin feat/fiches-firebase
# puis fusion dans main quand tu es satisfait :
git checkout main && git merge --ff-only feat/fiches-firebase && git push
```

GitHub Pages reconstruit tout seul. Vérifie ensuite
`https://zonetotalsport.ca/fiches/`.

### b) Les règles Firestore — Firebase

Règle d'or de `CLAUDE.md` : **commit d'abord, déploiement ensuite.**

```bash
cd ~/dev/Remotion\ 2/wix-deploy
firebase login                             # si nécessaire
firebase deploy --only firestore:rules --project zone-total-sport
```

Pour voir ce qui partirait sans rien envoyer, ajoute `--dry-run`.

**Pas de `--only storage`** : voir §6. Le bloc a été retiré de `firebase.json`
et `storage.rules` n'est plus déployé.

### b bis) Le Worker des images — Cloudflare

```bash
cd ~/dev/Remotion\ 2/wix-deploy/cf-worker/fiches-img
export PATH="$HOME/.local/node/bin:$PATH"
npm install                                # première fois seulement
wrangler deploy
```

Sert sur `https://zts-fiches-img.zts-ccd.workers.dev`. Le client pointe dessus
par la constante `IMG_BASE` de `fiches/zts-fiches-firebase.js`. Firestore
stocke un **chemin**, jamais une URL complète : passer un jour à
`img.zonetotalsport.ca` ne demandera que de changer cette constante et
d'ajouter un domaine personnalisé — rien à migrer en base.

Sonde : `curl https://zts-fiches-img.zts-ccd.workers.dev/health`

### c) Les sections — une fois

```bash
# hors du dépôt, pour ne pas y faire entrer firebase-admin ni la clé
mkdir -p ~/zts-outils && cd ~/zts-outils && npm install firebase-admin

cd ~/dev/Remotion\ 2/wix-deploy
NODE_PATH=~/zts-outils/node_modules \
  node _scripts/zts-seed-sections.js --simulation      # aperçu, n'écrit rien

NODE_PATH=~/zts-outils/node_modules \
GOOGLE_APPLICATION_CREDENTIALS=~/cle-zts.json \
  node _scripts/zts-seed-sections.js
```

La clé de service se télécharge dans **Paramètres du projet → Comptes de
service → Générer une nouvelle clé privée**. **Garde-la hors du dépôt** :
`_scripts/verifie-secrets.sh` la refuserait au commit, et il aurait raison.

### d) Le custom claim — optionnel, une fois

```bash
cd ~/dev/Remotion\ 2/wix-deploy
NODE_PATH=~/zts-outils/node_modules \
GOOGLE_APPLICATION_CREDENTIALS=~/cle-zts.json \
  node _scripts/zts-admin-claim.js zts@hotmail.ca
```

Déconnecte-toi puis reconnecte-toi sur `/admin/fiches` pour rafraîchir le
jeton (sinon il porte l'ancien claim pendant au plus une heure).

Une fois le claim posé et vérifié, tu peux retirer le repli par courriel :
supprime la ligne `request.auth.token.email == 'zts@hotmail.ca'` dans
`firestore.rules` **et** `storage.rules`, et vide `COURRIELS_ADMIN` dans
`fiches/zts-fiches-firebase.js`. Ne le fais pas avant d'avoir confirmé que
l'éditeur s'ouvre avec le claim seul.

---

## 8. Migration depuis la maquette

Au premier chargement de `/admin/fiches`, si `zts-fiche-textes`,
`zts-fiche-pages` ou `zts-unlocked` existent dans le navigateur, l'éditeur
reconstruit une fiche à partir d'eux et affiche « Contenu de l'ancienne
maquette récupéré ».

La table de correspondance (`MIGRATION` dans `zts-editeur.js`) a été
**relevée en exécutant la maquette d'origine**, pas devinée. Les entrées
d'interface (`p0-l0` « PORTRAIT », `p1-l1` « BUT DU JEU »…) ne sont pas
migrées. Le titre et les deux variantes n'ont rien à migrer : ils n'étaient
pas éditables.

**Les clés locales ne sont purgées qu'après une sauvegarde Firestore
réussie.** Tant que le serveur n'a pas accusé réception, le contenu reste
sur le disque. Si une sauvegarde échoue, la fiche est écrite dans
`zts-fiche-brouillon` et reprise au chargement suivant.

Il faut ouvrir `/admin/fiches` **dans le navigateur qui contient ces clés** —
c'est-à-dire celui où tu as travaillé sur la maquette.

---

## 9. Écarts assumés avec la maquette

Mesurés par comparaison pixel à pixel, page par page, contre la maquette
rendue avec ses vraies polices.

| Page | Écart fort | Cause |
|---|---|---|
| 1 | **0,58 %** | icône de case vide (SVG au lieu d'un emoji) + antialiasing |
| 4 | **0,70 %** | idem |
| 2 | 7,2 % | le fond manquait dans le zip, il est maintenant en place ; « BUT DU JEU » passe de `#FFF200` sur blanc à `#101010` ; la case image remplit son cadre au lieu de 911×474 dans 941×480 |
| 3 | dimensions | 856×1172 → **850×1100**, comme les pages 1 et 4 (le fond était dessiné en 850×1100 : il restait 6 px à droite et 72 px de cyan nu en bas). Reçoit l'étiquette d'en-tête qui lui manquait |

Autres normalisations, toutes réversibles :

- **Étiquettes de la page 1** — la première portait `width:181px` et
  `letter-spacing:1px` en dur, les autres non. Le champ optionnel `largeur`
  permet de reproduire l'original au pixel ; sans lui, largeur naturelle.
- **4e case de la page 3** — 288×241 là où ses voisines faisaient 300×170.
  Uniformisée.
- **Textes des cases vides** — « Le matériel », « Le terrain »… deviennent
  « Illustration 1, 2, 3 ». Visible seulement tant qu'aucune image n'est
  déposée.

---

## 10. L'atelier d'édition

Le bouton **MODE ÉDITION** ouvre une coque de logiciel vectoriel, portée de
la maquette (section 11 de `CHANGEMENTS-pour-cowork.md`). Quatre éléments
fixes, tous en `.zts-ui` — donc absents de l'impression et du mode public :

| Élément | Rôle |
|---|---|
| `#zts-atl-barre` | annuler/refaire, ordre, dupliquer, supprimer, grille, règles, aimantation, pas et sous-divisions, repères, export/import JSON, nom du document, repli. Deux rangées contextuelles : **Objet** (fond, trait, épaisseur, ombre, tracé ouvert/fermé et angles/courbes, alignement page) et **Caractère** (police, taille, couleur, contour, ombre, alignement, interligne, lettres, mots, titre alterné) |
| `#zts-atl-rail` | sélection, plume, points d'ancrage + 7 outils de pose : rectangle, cercle, ligne, flèche, boîte, étiquette, texte |
| `#zts-atl-dock` | 246 px, trois onglets : **Transformer** (X/Y/L/H, rotation, masquer), **Calques** (par page, œil / ▲▼ / ✕), **Historique** |
| `#zts-atl-etat` | rappel des raccourcis + objet sélectionné |

Gestes : clic = sélectionner, glisser = déplacer, poignée jaune =
redimensionner, double-clic = écrire, `Suppr` = effacer, `Échap` =
désélectionner, `Ctrl+Z` / `Ctrl+Maj+Z`, `Ctrl+D` = dupliquer.

**Plume** : clic pose un point, double-clic ou `Entrée` termine (`Maj+Entrée`
ferme le tracé), `Échap` annule. Un tracé de moins de deux points est jeté
plutôt que gardé comme point invisible. Le bouton **points d'ancrage**
affiche les poignées du tracé sélectionné : glisser déplace un point,
double-clic le retire.

**Grille, règles, repères, aimantation** — la grille et les règles sont des
réglages de **poste de travail** (`localStorage: zts-atelier-vue`) ; les
**repères appartiennent à la fiche** (`fiche.reperes`), pour que tu les
retrouves en la rouvrant. Un clic sur une règle pose un repère, on le glisse
pour le déplacer, double-clic pour l'effacer. L'aimantation accroche à 7 px
des bords, centres et marges de la page, des bords et centres des autres
formes, et des repères ; le bouton `#` y ajoute les lignes de grille.
**`Alt` la neutralise** le temps d'un déplacement. Les guides magenta ne
s'affichent que pendant le geste.

**Export / import JSON** — le document d'échange est la fiche **sans `id` ni
`slug`** : ceux-là appartiennent à Firestore, réimporter un fichier dans une
autre fiche ne doit pas en voler l'adresse. L'import écrase champ par champ
plutôt que de remplacer le document, pour qu'un vieil export ne fasse pas
disparaître les champs qu'il ne connaît pas.

### Ce que l'atelier écrit

Rien de neuf : les deux champs étaient déjà acceptés par
`zts-fiches-firebase.js` et déjà rendus par `zts-fiche-formes.js` côté
public. L'atelier ferme la boucle.

- `fiche.formes` — tableau, ordre du tableau = ordre de peinture. Un tracé
  (`type: 'trace'`) n'a **ni x/y ni w/h** : ses `points` sont en unités de
  page, en absolu. Déplacer, redimensionner ou aligner un tracé passe donc
  par ses points, jamais par des champs de géométrie.
- `fiche.reperes` — `{ p0: {v:[x…], h:[y…]} }`, mobilier d'atelier. Stocké
  pour que tu retrouves tes guides ; jamais lu par les pages publiques.
- `fiche.styles` — surcharges indexées par **clé explicite**, jamais par
  chemin d'indices DOM :
  - `sections.0.explications.1.texte` → `[data-champ]`
  - `b:sections.0.explications.1.imagePath` → `[data-bloc]`, le **cadre**
    de la case. C'est lui qu'on déplace : `<image-slot>` est en
    `position:absolute;inset:0`, donc bouger la case sans son cadre
    laisserait le contour noir sur place.

`styles.titre.altA` / `.altB` sont à part : elles se posent au **rendu**
(les `<span>` du titre sont regénérés par `titreColore`), pas par
`appliquerStyle`. Le titre reste stocké en texte brut.

### Trois points d'attention

1. **`appliquerDecalages()`** est le seul endroit à ajuster si un en-tête ou
   un pied de site vient s'insérer autour des pages. Tout s'y calcule à
   partir des dimensions réelles du chrome, jamais de constantes — la barre
   d'outils du document y est repoussée sous la barre de l'atelier.
2. **Les dimensions de page ne doivent jamais bouger** (850×1100 portrait,
   1100×850 paysage) : les coordonnées des formes sont en unités de page.
3. **Un champ ne se supprime pas, il se masque.** L'effacer laisserait un
   trou que le modèle recréerait au rendu suivant.

### Deux pièges à connaître

- **Le SVG d'un tracé couvre la page entière** — c'est ce qui lui permet de
  déborder sans être rogné. Le mesurer donnerait donc 850×1100 à tous les
  coups : sa boîte, c'est celle de ses points (`boiteTrace`). Même raison
  pour laquelle il est en `pointer-events:none` en public — le rendre
  cliquable intercepterait les clics sur ce qu'il recouvre, à commencer par
  le bouton SUITE. L'atelier n'ouvre le pointage que sur son `<path>`, et
  seulement là où il est **peint**.
- **Les règles vivent dans le `.zts-page-wrap`, pas dans la page.** La page
  est en `overflow:hidden` : une règle posée à −18 px y serait purement et
  simplement rognée.

---

## 11. Ce qui reste

- **Pas encore lié** depuis la home ni le menu (`shared/zts-menu.js`).
  Volontaire : rien ne pointe vers `/fiches` tant que tu n'as pas publié une
  première fiche.
- **`sitemap.xml`** — ajouter `/fiches/` quand des fiches seront publiées.
  Les fiches elles-mêmes sont dynamiques : leur indexation demandera soit le
  Worker (§5), soit une génération statique au moment de publier.
- **Suppression d'image** — remplacer une image écrase l'ancienne au même
  chemin ; il n'y a pas de bouton « vider la case ». Le bucket ne se remplit
  pas d'orphelins, mais on ne peut pas revenir à une case vide sans passer
  par la console.
- **Les pages `/fiches` ne portent pas le shell** (`ztsh-shell.css`). Une
  fiche est un document destiné à l'impression ; `_scripts/verifie-habillage.py`
  ne scanne que `apps/*` et ne les signale donc pas. À rediscuter si tu veux
  l'en-tête du site sur l'index.
