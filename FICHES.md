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

_scripts/
  zts-admin-claim.js       pose le custom claim admin (one-shot)
  zts-seed-sections.js     remplit la collection `sections`

storage.rules              NOUVEAU — règles Storage
firestore.rules            MODIFIÉ — blocs `fiches` et `sections`
firebase.json              MODIFIÉ — bloc `storage`
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
  imagePrincipale  string           chemin Storage (public)
  univers          'eps'|'camps'|'sdg'
  category         string           slug d'une section
  statut           'brouillon'|'publie'
  createdAt, updatedAt

fiches/{ficheId}/prive/contenu    ← lisible seulement si connecté
  butDuJeu         string
  imagePage2       string           chemin Storage (privé)
  sections         [ { titre, gabarit, orientation,
                       explications: [ { texte, imagePath } ] } ]
  statut           string           recopié, voir plus bas
```

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

## 6. À régler dans la console Firebase

Trois choses, dans cet ordre.

**1. Activer Cloud Storage.** Le projet `zone-total-sport` n'a aujourd'hui
ni `storage.rules` ni bloc `storage` dans `firebase.json` — le produit n'a
jamais été activé. Console → **Build → Storage → Commencer** → même région
que Firestore (`northamerica-northeast1`). Le bucket est déjà nommé dans
`firebase-auth.js` : `zone-total-sport.firebasestorage.app`.

**2. Autoriser le domaine.** Console → **Authentication → Settings →
Domaines autorisés** : `zonetotalsport.ca` doit y figurer (il y est
probablement déjà, `firebase-auth.js` tourne en production).

**3. CORS du bucket**, seulement si les images ne s'affichent pas.
Storage sert `Access-Control-Allow-Origin` par défaut sur les URL signées ;
si un blocage apparaît :

```bash
cat > cors.json <<'JSON'
[{"origin":["https://zonetotalsport.ca"],"method":["GET"],"maxAgeSeconds":3600}]
JSON
gcloud storage buckets update gs://zone-total-sport.firebasestorage.app --cors-file=cors.json
```

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

### b) Les règles — Firebase

Règle d'or de `CLAUDE.md` : **commit d'abord, déploiement ensuite.**

```bash
cd ~/dev/Remotion\ 2/wix-deploy
firebase login                             # si nécessaire
firebase deploy --only firestore:rules,storage --project zone-total-sport
```

Pour voir ce qui partirait sans rien envoyer :
`firebase deploy --only firestore:rules --dry-run --project zone-total-sport`

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

## 10. Ce qui reste

- **Pas encore lié** depuis la home ni le menu (`shared/zts-menu.js`).
  Volontaire : rien ne pointe vers `/fiches` tant que tu n'as pas publié une
  première fiche.
- **`sitemap.xml`** — ajouter `/fiches/` quand des fiches seront publiées.
  Les fiches elles-mêmes sont dynamiques : leur indexation demandera soit le
  Worker (§5), soit une génération statique au moment de publier.
- **Pas d'undo/redo** dans l'éditeur, comme dans `apps/studio-jeu`.
- **Suppression d'image** — remplacer une image écrase l'ancienne au même
  chemin ; il n'y a pas de bouton « vider la case ». Le bucket ne se remplit
  pas d'orphelins, mais on ne peut pas revenir à une case vide sans passer
  par la console.
- **Les pages `/fiches` ne portent pas le shell** (`ztsh-shell.css`). Une
  fiche est un document destiné à l'impression ; `_scripts/verifie-habillage.py`
  ne scanne que `apps/*` et ne les signale donc pas. À rediscuter si tu veux
  l'en-tête du site sur l'index.
