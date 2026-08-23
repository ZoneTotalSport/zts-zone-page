# ZONE INVENTAIRE — rapport de livraison

**Branche** `app/inventaire` · 5 commits · 23 août 2026
**Non fusionné, non déployé.** Deux déploiements restent à ta charge (§5).

---

## 1. Ce qui est livré

| Fichier | Rôle |
|---|---|
| `apps/inventaire/index.html` | Coquille habillée, densité `travail` |
| `apps/inventaire/styles.css` | Tableau large, cartes mobiles, feuille d'impression |
| `apps/inventaire/dataStore.js` | Seul point de contact avec Firestore et le Worker |
| `apps/inventaire/app.js` | Interface, photos, i18n FR/EN, achats, CSV |
| `cf-worker/generateur/src/generateur-worker.js` | Route `/inventaire-vision` (ajout) |
| `firestore.rules` | Blocs `inventaires` et `inventaireItems` (ajout) |
| `firestore.indexes.json` | Index composite `inventaireItems (uid, invId)` (ajout) |

**Aucun fichier d'app existant n'a été modifié.** Les trois fichiers hors
`apps/` sont ceux que j'avais annoncés au prescan et que tu as approuvés.

---

## 2. Décisions appliquées telles que tu les as tranchées

**Polices.** Zéro `<link>` Google Fonts. Les titres et les boutons prennent
`LuckiestGuy` (via `shared/zts.css`) et `ZoneTotalSportZTSH` avec
`size-adjust:50%` (via `assets/ztsh-shell.css`), toutes deux servies depuis
`/fonts/`. **Conséquence assumée : le corps de texte retombe sur la pile
système.** Quicksand ne vit que chez Google et n'est pas dans `/fonts/`.
L'app est la seule du site dans ce cas — les 46 autres chargent encore le lien.

**Photos.** Compression sur l'appareil : une grande passe à 1200 px JPEG q.72
pour l'IA (jamais stockée), une vignette à 320 px WebP q.72 stockée en
data-URI dans le document. Repli automatique en JPEG là où le WebP n'est pas
encodé (Safari ancien, quelques Android). **La pleine résolution n'est pas
conservée en v1** : « agrandir » montre la vignette agrandie.

**Worker et règles.** Code livré, déploiement à toi.

**Ajout A — jusqu'à 5 photos par objet.** La première sert à l'identification,
pastille `+N` sur la vignette, bouton `+ photo` sur chaque ligne ou carte.
Modale avec flèches, clavier ←/→, balayage horizontal, définition de la photo
principale et suppression. Refus net au-delà de 5, et refus au-delà du poids
de document.

**Ajout B — quatre états.** `Neuf` lime #A3FF00 · `Bon état` cyan ·
`OK` jaune #FFFC00 · `À remplacer` rose #FF0061. EN : `New` · `Good
condition` · `OK` · `To replace`. Filtre rapide par état, et « À remplacer »
alimente la liste d'achats au même titre qu'une quantité à acheter > 0.

---

## 3. Deux choix de conception à connaître

**Un document Firestore par objet, pas un par inventaire.** Un document
plafonne à 1 048 576 octets. À cinq vignettes, un objet pèse jusqu'à ~300 Ko :
tout un gymnase dans un seul document serait refusé dès le douzième objet.
`verifiePoids()` pèse le document **avant** l'envoi, avec `Blob` pour compter
les octets UTF-8 réels — sur des champs français, `length` sous-estime de
plusieurs kilo-octets. Le refus vient donc de l'app, avec un message lisible,
jamais d'une erreur de quota.

**Le hors-ligne est en LECTURE SEULE, et le dit.** Le cache local sert le
dernier état connu. Toute tentative de modification hors ligne est bloquée et
annoncée : une écriture hors ligne serait perdue au rechargement suivant, qui
rafraîchit depuis Firestore. Je n'ai pas voulu faire semblant.

**Un objet « à remplacer » sans quantité saisie compte pour 1** dans la liste
d'achats. Zéro dans une liste d'achats n'aurait aucun sens.

---

## 4. Ce que le banc automatisé a vérifié

Firestore et l'authentification ont été **simulés en console** pour piloter le
vrai code sans créer de compte. Je ne crée pas de comptes.

| Contrôle | Résultat |
|---|---|
| `verifie-habillage.py apps/inventaire` | **0 bloquant** — 1 avertissement `DIFF : 180 lignes ajoutées`, normal pour un fichier neuf |
| `verifie-glyphes-ztsh.py` | OK, aucun caractère non couvert dans un `.ztsh-titre` |
| `!important` hors `@media print` | 0 |
| z-index maximum des classes `.inv-*` | 2 (le chrome du shell occupe 300-399) |
| Valeurs en `rem` | 0 |
| Fond imposé sur `body` | aucun — le marine reste visible |
| 375 px et 768 px | mode cartes, débordement horizontal **0 px** (document et conteneur), champs à 16 px |
| 1440 px | mode tableau, colonnes toutes à leur largeur, défilement horizontal confiné au conteneur |
| Chaîne photo, vrais fichiers | PNG 900×900 → vignette **WebP 28 Ko**, refus net à la 6e photo |
| Tri | croissant/décroissant vérifié sur `qteMain`, `prix`, `nom`, `etat` |
| Filtres, recherche | conformes |
| Liste d'achats | groupée par catégorie, sous-totaux, total 288,96 $ |
| Bascule FR/EN | en-têtes, états, liste d'achats, boutons |

**Quatre défauts trouvés et corrigés** (commit `7db1b3a`) : clé i18n `vide` en
double qui mettait le message d'état vide dans un bouton ; largeurs de colonnes
ignorées (il fallait `min-width` sur `th` **et** `td`) ; espace avant
deux-points appliqué à l'anglais ; liste d'achats figée dans l'ancienne langue
après une bascule.

---

## 5. À ta charge — déploiement

```bash
cd "cf-worker/generateur" && npx wrangler deploy --env production
```

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

**L'index composite n'est pas optionnel.** Sans lui, Firestore refuse la
requête `where(uid).where(invId)` au premier chargement, et rien dans l'app ne
rattrape cette erreur — l'inventaire s'affichera vide.

Le worker utilise `env.SONNET_MODEL`, soit `claude-sonnet-4-6` selon le
`wrangler.toml` actuel. Je n'y ai pas touché.

---

## 6. Banc d'essai manuel — 14 tests

Je ne peux pas jouer ces tests : ils demandent un compte, un iPhone, et le
worker déployé.

### Photo et IA
1. **iPhone, nouvel objet.** Ouvre l'app sur iPhone, connecte-toi, touche
   « Prendre une photo », photographie un ballon. Attendu : la caméra arrière
   s'ouvre directement, puis « Analyse de la photo par l'IA… », puis une ligne
   avec nom, marque si le logo est lisible, description et catégorie remplis.
2. **Marque inventée.** Photographie un objet **sans** logo visible. Attendu :
   le champ Marque reste **vide**. Si l'IA invente une marque, dis-le-moi.
3. **Ordinateur, téléversement.** Sur ordi, « Choisir une image ». Attendu : le
   sélecteur de fichiers s'ouvre, même résultat.
4. **Worker absent.** Avant de déployer le worker, prends une photo. Attendu :
   « Identification impossible (…). La ligne est créée, remplis-la à la main. »
   — et la ligne existe bel et bien, avec sa photo.

### Photos multiples (ajout A)
5. **Deuxième photo sur iPhone.** Sur une ligne existante, touche `+ photo`,
   prends une vue de l'étiquette. Attendu : la vignette porte une pastille `+1`.
6. **Navigation dans la modale.** Touche la vignette. Attendu : la photo
   s'agrandit, « Photo 1 sur 2 », flèches visibles. **Balaye horizontalement**
   → photo suivante. Au clavier, ←/→ aussi.
7. **Photo principale.** Va sur la 2e photo, touche « ⭐ Photo principale ».
   Attendu : elle devient la vignette du tableau, le bouton passe à
   « ⭐ Déjà principale » et se désactive.
8. **Refus au-delà de 5.** Ajoute des photos jusqu'à 6. Attendu : blocage à 5,
   message « Maximum 5 photos par objet », en rose.
9. **Refus au poids.** Avec 4 ou 5 photos très détaillées, tente une de plus.
   Attendu, si le seuil est atteint : « Cet objet pèserait N Ko, au-delà de la
   limite de 878 Ko par fiche. » Jamais une erreur Firestore brute.

### Tableau et données
10. **Édition en ligne.** Change une quantité, un emplacement, un état.
    Attendu : les compteurs du haut bougent **immédiatement**, puis
    « 💾 Enregistré. » une seconde plus tard. Recharge : la valeur tient.
11. **Filtre par état (ajout B).** Filtre sur « À remplacer ». Attendu : seuls
    ces objets restent. Le badge est bien rose, « Neuf » bien lime.
12. **Liste d'achats.** Mets une quantité à acheter sur un objet et passe un
    autre à « À remplacer ». Attendu : les deux apparaissent, groupés par
    catégorie, l'objet à remplacer compté ×1. « Imprimer » ouvre une fenêtre
    propre — **si ton navigateur bloque les fenêtres, autorise-la**.
13. **Export CSV et impression.** Ouvre le CSV dans Excel : accents corrects,
    une valeur par colonne. `Ctrl+P` sur le tableau : en-têtes répétés, pas de
    cadre de champ, boutons absents.

### Langue et réseau
14. **Bascule FR/EN et hors-ligne.** Passe en EN : en-têtes, états (`New`,
    `Good condition`, `OK`, `To replace`), liste d'achats. Puis **coupe le
    wifi** et recharge : tes objets s'affichent depuis le cache, avec
    « 📴 Hors ligne : lecture seule. » ; toute modification est refusée.
    Rebranche : l'app recharge d'elle-même.

---

## 7. Deux réserves à dire franchement

**Le corps de texte n'est plus dans la police du site.** C'est la conséquence
directe et acceptée de « zéro Google Fonts ». Si le rendu te déplaît, la vraie
solution est d'auto-héberger Quicksand dans `/fonts/` — une décision qui
concerne les 47 apps, pas celle-ci seule.

**Je n'ai pas pu tester le vrai chemin IA.** Le worker n'est pas déployé, et je
ne crée pas de compte. Le handler est calqué ligne à ligne sur
`handleNutritionPhoto`, qui tourne en production, et le format de réponse est
renormalisé champ par champ côté worker. Mais **le premier appel réel reste à
faire** : c'est le test n° 1 du banc.
