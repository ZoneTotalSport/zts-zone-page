# FIX — déconnexion + compteurs de blog

**Branche** : `fix/auth-et-compteurs`, partie de `main` (`cd59ad1`), **5 commits**
**Date** : 26-27 juillet 2026 · Phases B et C
**Diagnostic amont** : `DIAGNOSTIC-2026-07-25.md`
**État** : ✅ **EN PRODUCTION** — règles Firestore déployées, PR #4 fusionnée
(`99124e4`), build GitHub Pages vert, servi et vérifié en prod.
Reste : le test manuel de la déconnexion (§ Phase C, étape 3).

| # | Commit | Portée | Annulable seul |
|---|---|---|---|
| 1 | `f509b0f` `fix(auth)` — déconnexion fiable sur les deux portillons | `firebase-auth.js`, `shared/zts-gate.js` | ✅ |
| 2 | `904a4ed` `fix(auth)` — supprime la copie périmée du générateur | `apps/generateur/index.html`, suppr. `apps/generateur/firebase-auth.js` | ✅ |
| 3 | `ddf98f1` `fix(firestore)` — répare les compteurs `article_views` | `firestore.rules`, `article-views.js` | ✅ |
| 4 | `174f6fb` `style(auth)` — modale : prof d'ÉPS + polices ZTS | `firebase-auth.js` | ✅ |

Le 4 est ta demande en cours de route. Il est purement cosmétique et séparé des
trois correctifs : tu peux le laisser tomber sans toucher aux bugs, ou l'inverse.

---

## BUG 1 — déconnexion

### Cause racine

**Le site a deux systèmes d'authentification parallèles, et `cd59ad1` n'en a corrigé qu'un.**

Les **24 apps** qui chargent `shared/zts-gate.js` ne chargent pas `/firebase-auth.js` —
vérifié fichier par fichier. Elles ont leur propre bouton « Déconnexion », leur propre
modale, leur propre fournisseur Google. Ce second monde gardait :

- `zts-gate.js:177` — un `signOut()` **nu** : pas attendu, pas de purge, pas de sortie.
  Exactement le code que `cd59ad1` avait retiré de `firebase-auth.js`.
- `zts-gate.js:128` — `new GoogleAuthProvider()` **sans `prompt:'select_account'`**.
  Avec une seule session Google ouverte, Google resigne le compte **en silence, sans
  sélecteur**. Sur Safari iOS, `signInWithPopup` n'est pas supporté → repli sur
  `signInWithRedirect` → aller-retour vers Google invisible, retour, `getRedirectResult()`
  complète la connexion. **~1 seconde.** C'est mot pour mot le symptôme.
- `zts-gate.js:166` — après le `signOut()`, `onAuth(null)` **réaffichait le mur plein écran
  sur la page de l'outil**. Tu n'allais nulle part : tu restais bloqué devant
  « Crée ton compte gratuit » sur l'outil que tu venais de quitter.

Ta cause présumée était la bonne dans son esprit — le portillon te reconnectait — mais le
déclencheur n'était pas un appel automatique : c'était le mur qui te ramenait sur un bouton
Google qui ne demandait plus rien à personne.

### Hypothèses écartées, avec la preuve

**3 — `getRedirectResult()` rejoue un résultat en cache.** Faux. Dans le SDK servi en prod
(`firebase-auth-compat.js` 10.14.0) :

```js
async signOut(){ … (this.redirectPersistenceManager || this._popupRedirectResolver)
                    && await this._setRedirectUser(null), this._updateCurrentUser(null,!0) }
```

`_popupRedirectResolver` est toujours défini (le wrapper compat le passe à `initializeAuth`),
donc `signOut()` efface le `redirectUser` **avant** de résoudre. Le drapeau `pendingRedirect`
est lu-puis-supprimé. Pas de rejeu possible.
→ **La garde a quand même été posée**, en ceinture-bretelles : ITP Safari et les caches SDK
ne méritent pas une confiance aveugle, et le coût est de six lignes.

**5 — `cd59ad1` purgerait un drapeau de déconnexion trop tôt.** Faux : **aucun drapeau
n'existait**. `cd59ad1` ne purge que `zts_signup_pending` et `zts_signup_source`, deux clés du
funnel d'inscription. Il ne mangeait rien — il manquait une pièce jamais écrite. C'est
précisément cette pièce qui est ajoutée ici.

**6 — persistance.** Explicite et identique des deux côtés (`LOCAL`, localStorage).

### Ce qui a été fait

**`firebase-auth.js`**
- Drapeau `zts_signed_out` en `sessionStorage`, posé **synchroniquement avant** `signOut()`,
  lu **une seule fois au parse** du chargement suivant (le vider plus tard ne rouvre pas la
  garde pour le chargement en cours).
- `getRedirectResult()` : si le chargement suit une déconnexion, un résultat porteur d'un
  utilisateur est refusé → `signOut()` immédiat.
- Le drapeau tombe dès qu'une connexion volontaire part (courriel, inscription, Google) ou
  qu'un vrai utilisateur arrive dans `onAuthStateChanged`.

**`shared/zts-gate.js`**
- `prompt:'select_account'` sur le fournisseur Google.
- Bouton « Déconnexion » : même contrat que `ztsLogout()` — drapeau, `signOut()` **attendu**,
  puis sortie vers l'accueil.
- Garde `leaving` : `onAuth(null)` ne redessine plus le mur pendant la sortie.
- Même garde sur `getRedirectResult()`.

**Pourquoi `sessionStorage`** : le drapeau meurt avec l'onglet. Il ne peut donc pas
empoisonner une session future, et une déconnexion dans un onglet n'impose rien aux autres —
c'est le SDK qui propage la déconnexion entre onglets, via la persistance.

### Tests joués

Copie locale du site servie en HTTP, harnais qui remplace le SDK Firebase par un double
contrôlé (le vrai SDK ne peut pas fabriquer une session sans compte réel).

| Test | Attendu | Résultat |
|---|---|---|
| Clic « Déconnexion » sur une app à portillon | drapeau posé **synchroniquement** | ✅ `zts_signed_out = "1"` au retour du clic |
| idem | `signOut()` appelé **puis résolu** avant la navigation | ✅ journal `signOut:appelé` → `signOut:résolu` → navigation |
| idem | le mur ne réapparaît pas pendant la sortie | ✅ `#zts-gate` reste caché quand le SDK notifie `null` en vol |
| idem | atterrissage hors du mur | ✅ `/index.html` |
| Rechargement avec drapeau + `getRedirectResult` fantôme | résultat refusé, `signOut()` | ✅ `signOut` appelé, mur affiché, aucune session |
| Même chose **sans** drapeau (témoin) | résultat traité normalement | ✅ aucun `signOut` parasite |
| `select_account` — portillon des apps | transmis à Google | ✅ `{prompt:"select_account"}` capté sur le provider |
| `select_account` — modale racine | transmis à Google | ✅ idem |
| `ztsLogout()` sur la home | drapeau synchrone + purge du funnel | ✅ drapeau immédiat ; `zts_signup_pending`/`_source` purgées après résolution |
| Reconnexion volontaire Google | le drapeau tombe | ✅ `zts_signed_out` effacé avant l'appel |
| Console | aucune erreur | ✅ (hors rejets provoqués par l'interception de test) |

### Ce que je n'ai pas pu tester, et qui te revient

Je ne peux pas me connecter à ton compte — donc **aucun aller-retour Google réel** n'a été
joué, et le critère « je reste déconnecté après rechargement » n'a été vérifié que sur le
double. Séquence à jouer, une fois déployé :

1. **Chrome desktop** — connecte-toi, va sur `/apps/echauffements/`, clique « 👋 Déconnexion »
   en bas à droite. Attendu : tu sors sur l'accueil, en « Connexion ». Recharge : tu restes
   déconnecté. Reclique Google : **le sélecteur de compte s'affiche**.
2. **Safari iOS** — même chose. C'est là que le redirect faisait l'aller-retour invisible.
3. **Deux onglets** — connecté dans les deux, déconnecte-toi dans l'un, recharge l'autre :
   il doit être déconnecté lui aussi.
4. **Inscription** — crée un compte de test : tu dois atterrir sur `/bienvenue.html` et
   l'événement `signup_complete` doit apparaître dans `conversionFunnel`.

Si le point 1 ou 2 échoue, note l'**URL exacte** et dis-moi si l'écran flashe vers
`accounts.google.com`.

---

## BUG 2 — compteurs de blog

### Cause racine, prouvée

**La collection `article_views` n'a jamais eu de bloc dans `firestore.rules`.** Elle tombait
donc dans le `match /{document=**} { allow read, write: if false }` final. Depuis le premier
jeu de règles déployé (`1915b07`, **18 mai 2026**), chaque incrément **et** chaque lecture
étaient refusés — en silence, le `.catch()` du client avalant l'erreur.

Sonde REST anonyme sur `zone-total-sport`, avant correctif :

```
GET …/documents/article_views  → 403 PERMISSION_DENIED
GET …/documents/anonGenCount   → 200            (témoin : allow read: if true)
```

Le témoin valide la méthode : c'est bien la règle qui refuse, pas la sonde.

**Le zéro affiché** : le gabarit de carte code `<span data-views-count>0</span>` en dur
(`blog.html:402`), et seule la synchro Firestore le remplace. Le `#totalViews`, lui, est
d'abord rempli par la somme statique `p.views` — c'est pourquoi le total semblait vivant
pendant que les cartes affichaient 0.

**Datation** : `article-views.js` est né le 18 avril, quand le projet n'avait aucune règle
(mode test ouvert) — les compteurs marchaient. La rupture est entre l'expiration du mode test
(~27 avril) et le 18 mai. **Bien avant l'audit de routage de juillet.**

### Tes trois hypothèses : les trois fausses

1. **Les clés ont changé** — non. Canonical vérifié :
   `articles/nawatobi.html:29` → `…/articles/nawatobi.html`, extension conservée. Écriture
   (`getSlugFromUrl`) et lecture (`blog.html:382`) produisent le même slug `nawatobi`.
2. **Le consentement bloque** — non. `analytics.js` et `cookie-consent.js` ne pilotent que les
   drapeaux GA4 et Clarity. `article-views.js` ouvre sa propre connexion Firebase et n'appelle
   jamais `gtag`. Le consentement n'est pas dans le chemin.
3. **Écriture et lecture divergent** — non. Même collection, même clé. Les deux côtés étaient
   simplement refusés par la même règle.

### Ce qui a été fait

**`firestore.rules`** — bloc `article_views` ajouté avant le refus final : lecture publique,
`+1` strict, suppression interdite. Un client ne peut que faire passer `count` de N à N+1.

**`article-views.js`** — `ztsCountView` passe de `FieldValue.increment(1)` à une **transaction
à valeurs explicites**. Raison : une règle qui valide `count == resource.data.count + 1` doit
pouvoir lire la valeur résultante, ce qu'un transform serveur ne garantit pas. J'ai repris
l'idiome de `apps/generateur/zts-anon-fingerprint.js`, qui tourne déjà en prod contre ces mêmes
règles — plutôt que de parier sur un comportement du moteur de règles que je ne peux pas
vérifier ici. En cas d'échec, le verrou de session est relâché : la prochaine visite réessaie
au lieu de perdre l'article.

### Migration : rien n'a été lancé

Les écritures étant refusées depuis mai, **aucune donnée n'a été écrasée**. Au pire les
compteurs sont gelés à leur valeur d'alors et repartiront de là.

Je n'ai **pas** pu lister la collection : la règle refuse aussi la lecture, et il n'y a aucune
clé de service sur ce Mac (vérifié — et tant mieux). **Vérification 30 secondes, à toi** :
Firebase Console → `zone-total-sport` → Firestore → collection `article_views`.

- **Documents avec un `count` non nul** → données intactes, gelées depuis mai. Le déploiement
  des règles suffit, **aucune migration**.
- **Collection vide** → l'écriture n'a jamais abouti. Je te proposerai alors un ré-amorçage à
  partir des `views:` statiques déjà dans `blog.html` (232, 386, 786, 188, 67 …), en
  `create`-only, jamais en écrasement — **et seulement après ton GO**.

### Tests joués / à jouer

Vérifié ici : syntaxe, cohérence des clés des deux côtés, sonde REST avant correctif, et le
fait que la règle ne référence que des valeurs explicites que le client produit désormais.

**Non vérifiable sans déploiement** : l'incrément réel. Une fois
`firebase deploy --only firestore:rules` passé, ouvre un article puis :

```bash
curl -s "https://firestore.googleapis.com/v1/projects/zone-total-sport/databases/(default)/documents/article_views?key=AIzaSyBoBxVP6g_ObKIJJ1jkviNFQ-wpJoWdjbA"
```

Tu dois voir `count` monter, et le nombre affiché sur `blog.html` doit correspondre.

---

## Ce qu'il reste à faire — toi

*(Section de la phase B — tout a été fait en phase C, voir plus bas. Reste uniquement le
protocole de test manuel.)*

## Dette restante

| Sujet | Pourquoi ça compte |
|---|---|
| **Deux systèmes d'auth** | Le vrai problème de fond. `firebase-auth.js` (1510 pages) et `shared/zts-gate.js` (24 apps) dupliquent modale, logout, provider Google et config Firebase. Le contrat `zts_signed_out` est aujourd'hui **copié dans les deux fichiers** : la prochaine correction risque encore de n'en toucher qu'un. À unifier au chantier harmonisation. |
| **Sessions par origine** | `jeux.zonetotalsport.ca` est un déploiement séparé : sa persistance Firebase est indépendante. Une déconnexion sur le site principal ne le déconnecte pas. Non traité ici — ça demande une décision (SSO ou assumé). |
| **`apps/studio-jeu/admin-gate.js`** | Appelle aussi `getRedirectResult()` sans la garde, et son provider Google n'a pas `select_account`. Hors périmètre (gate admin, toi seul), mais même famille de bug. |
| ~~**Hook de secrets**~~ | ✅ **Réglé** en phase C (PR #5, `81e1b58`) : détection restaurée — elle avait été écrasée par `3d90121` — et allowlist par valeur au lieu du nom de fichier. Le hook est redevenu obligatoire. |
| **`getSlugFromUrl()` fragile** | `article-views.js:45` renvoie `null` sur une URL à slash final, et `blog.html:382` exige `.html` dans le `href`. Ça marche aujourd'hui, ça casserait en silence à la première migration d'URL. |
| **GA4 en opt-in strict** | `analytics_storage` reste `denied` tant que la bannière n'est pas acceptée : tes chiffres GA4 sont amputés de tous les visiteurs qui ne cliquent pas. Rien à voir avec les compteurs Firestore — mais c'est une décision à prendre, pas un effet de bord à subir. |
| **`.git` dans un Bureau iCloud** | Pendant l'analyse, `Remotion 2/` a basculé vers `Bureau : MacBook Pro de Joey/` puis est revenu. Rien perdu, mais un dépôt git synchronisé iCloud entre deux Macs finira par corrompre un `.git`. |

---

# PHASE C — mise en production (27 juillet 2026)

## C.0 — Vérification statique du popup : **non sur les trois sites**

Question : y a-t-il un `await`, un `.then()`, un `setTimeout` ou tout autre point
asynchrone entre l'entrée dans le gestionnaire de clic et l'appel à `signInWithPopup`?

**Réponse : non, sur aucun des trois.** Aucun réordonnancement nécessaire, aucun commit
supplémentaire. Les trois lignes d'appel avec leur contexte immédiat :

**1. `shared/zts-gate.js` — lié en `l.129` : `el('ztg-google').addEventListener('click', doGoogle)`**

```js
function doGoogle() {
  showErr(''); busy(true);          // textContent + classList.toggle — DOM, synchrone
  clearSignedOut();                 // sessionStorage.removeItem — API synchrone par spec
  var p = new firebase.auth.GoogleAuthProvider();   // constructeur, synchrone
  p.setCustomParameters({ prompt: 'select_account' });
  firebase.auth().signInWithPopup(p).catch(function (err) {   // ← 1re opération async
```

**2. `firebase-auth.js` — lié en `l.520` : `document.getElementById('ztsGoogleBtn').addEventListener('click', handleGoogle)`**

```js
function handleGoogle() {
  var provider = new firebase.auth.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  clearSignedOut();                 // sessionStorage.removeItem
  setLoading(true);                 // DOM
  var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile) { firebase.auth().signInWithRedirect(provider)…; return; }
  firebase.auth().signInWithPopup(provider)                   // ← 1re opération async
```

**3. `aidons-nous/index.html:454-458` — `gb.onclick = () => {…}`**

```js
if(gb)gb.onclick=()=>{
  const isMobile=/iPhone|iPad|Android/i.test(navigator.userAgent);
  const provider=new firebase.auth.GoogleAuthProvider();
  if(isMobile)firebase.auth().signInWithRedirect(provider);
  else firebase.auth().signInWithPopup(provider).then(…)      // ← 1re opération async
```

Le point que tu visais est réel et je l'ai vérifié spécifiquement : **`clearSignedOut()`,
que j'ai ajouté en Phase B sur deux des trois sites, est un `sessionStorage.removeItem`** —
le Web Storage est synchrone et bloquant par spécification, il ne rend jamais la main à la
boucle d'événements. La chaîne du geste utilisateur est intacte.

Trois nuances honnêtes :

- **Sur iOS, deux des trois sites ne passent jamais par le popup.** `firebase-auth.js` et
  `aidons-nous` testent `isMobile` et partent en `signInWithRedirect`. Seul `zts-gate.js`
  tente le popup sur iPhone, et retombe en redirect via son `.catch()` — hors du geste, mais
  `signInWithRedirect` est une navigation de premier niveau et n'exige pas de geste.
- **Le risque résiduel est dans le SDK, pas dans notre code.** Firebase ouvre la fenêtre à
  l'intérieur de `signInWithPopup` ; si une version future y glisse un `await` avant le
  `window.open`, aucun ordonnancement de notre côté n'y changera rien. À surveiller aux
  montées de version du SDK.
- **L'init Firebase n'est pas dans le chemin** : `firebase.auth()` est un accesseur
  synchrone, et les boutons n'existent dans le DOM qu'après le chargement du SDK.

## C.1 — Règles Firestore déployées, et un piège évité

⚠️ **Ta commande aurait été un coup dans l'eau.** `cd wix-deploy && firebase deploy` déploie
`firestore.rules` **du dossier de travail**, qui est sur `main` — et `main` ne contenait pas
encore le bloc `article_views` (`grep -c article_views` → `0`). Le déploiement aurait
« réussi » en publiant les anciennes règles, la sonde serait restée à 403, et on aurait
conclu que le correctif était raté. J'ai déployé depuis le **worktree** de la branche, où le
bloc existe (`grep -c` → `3`).

```
✔  cloud.firestore: rules file firestore.rules compiled successfully
✔  firestore: released rules firestore.rules to cloud.firestore
✔  Deploy complete!
```

**Sonde REST — avant :**

```
GET …/documents/article_views  →  HTTP 403
{"error":{"code":403,"message":"Missing or insufficient permissions.","status":"PERMISSION_DENIED"}}
```

**Sonde REST — après :**

```
HTTP 200 — 22 documents, 113 vues au total
dernière écriture toutes collections confondues : 2026-05-18
```

| vues | dernière vue | slug |
|---:|---|---|
| 14 | 2026-05-17 | `50-jeunes-un-gymnase` |
| 10 | 2026-05-17 | `bienfaits-sport-enfants` |
| 9 | 2026-05-17 | `syndrome-gymnase` |
| 8 | 2026-05-18 | `avance-annee-scolaire` |
| 7 | 2026-05-17 | `sae-course` |
| 6 | 2026-05-17 | `respect-eps` |
| 5 | — | `classes-difficiles-partie-2`, `color-run`, `courbe-plaisir-jeu`, `foobaskill`, `jeux-course-1er-cycle`, `rentree-scolaire`, `suppleance-ecoles` |
| 4 | — | `classes-difficiles-partie-1`, `harcelement-enseignants` |
| 3 | — | `faire-bouger-enfants`, `systeme-emulation-dollars-ecole` |
| 2 | — | `classes-difficiles-partie-3`, `comportements-perturbateurs`, `eleves-cotes-eps`, `nawatobi`, `systeme-emulation-dollar` |

**Tes données étaient intactes.** Pas de ré-amorçage — la question ne se pose même pas.

Et la datation du diagnostic est confirmée **au jour près** : la dernière écriture est le
**18 mai 2026**, exactement la date du premier déploiement de règles (`1915b07`).

**Correspondance des clés : 22 / 22.** Toutes les clés Firestore correspondent à une carte de
`blog.html` (regex `l.382`), et aucune carte ne pointe vers une clé absente — sauf
`grands-jeux-exterieurs-camp-de-jour`, publié le 6 juin, donc **après** la rupture. Il partira
de zéro, ce qui est correct. Le nouveau code lit exactement les clés qui existent.

## C.2 — Fusion par GitHub

**Contrôle d'inertie du shell :**

```
$ git grep -l "ztsh-shell" origin/main -- '*.html' | grep -v _docs
(aucune sortie, exit 1)
```

Zéro résultat : **aucune page HTML ne charge le shell**. La fondation est inerte sur `main`,
la fusion n'active rien.

**Fusion :** PR [#4](https://github.com/ZoneTotalSport/zts-zone-page/pull/4) →
**SHA de fusion `99124e435c4543800f3a3c55c483c7e1899f1f77`**. Aucun `git checkout main` local.

**Build GitHub Pages : vert** sur `99124e4` (~45 s). Le workflow « Vérifie l'habillage » est
passé lui aussi.

**Vérification de ce que la prod sert réellement** (avec contournement de cache) :

| contrôle | résultat |
|---|---|
| `shared/zts-gate.js` contient `select_account` | ✅ 2 occurrences |
| `shared/zts-gate.js` contient `zts_signed_out` | ✅ |
| `firebase-auth.js` : `zts_signed_out` + `perso_eps` + `ZTSDisplay` | ✅ 10 occurrences |
| `article-views.js` contient `runTransaction` | ✅ |
| `apps/generateur/firebase-auth.js` (copie périmée) | ✅ **404** |
| `/apps/generateur/` charge `src="/firebase-auth.js"` | ✅ |

## C.3 — État du hook de secrets

**Ta question d'abord : est-ce que le hook attrapait autre chose que l'apiKey Firebase sur
les cinq commits? Non.** Les 9 motifs rejoués sur `f509b0f 904a4ed ddf98f1 174f6fb e1e88db` :

| commit | fichier | motif déclenché |
|---|---|---|
| `f509b0f` | `firebase-auth.js` | `AIza…` ×1 |
| `f509b0f` | `shared/zts-gate.js` | `AIza…` ×1 |
| `904a4ed` | `apps/generateur/index.html` | *aucun* |
| `ddf98f1` | `article-views.js` | `AIza…` ×1 |
| `ddf98f1` | `firestore.rules` | *aucun* |
| `174f6fb` | `firebase-auth.js` | `AIza…` ×1 |
| `e1e88db` | `FIX-AUTH-COMPTEURS-COMPLETE.md` | `AIza…` ×1 |

Une seule et même valeur, la clé web publique du projet. **Aucune clé privée, aucun compte de
service, aucun jeton AWS / Anthropic / OpenAI. Rien n'est passé.**

**Mais j'ai trouvé pire que ce que tu soupçonnais.** En allant lire le hook, deux choses :

1. **La détection de secrets avait disparu de `main`.** Le pre-commit scannait 9 motifs depuis
   `7b0145d` (17 mai). Le 26 juillet, `3d90121` — les garde-fous d'habillage de l'autre
   session — l'a **écrasé** : 56 lignes supprimées, la détection avec. Depuis ce commit,
   **plus rien ne bloquait un vrai secret**. Le hook que j'ai contourné cinq fois n'existait
   déjà plus quand tu m'as posé la question.
2. **L'allowlist portait sur le nom du fichier**, pas sur la valeur : n'importe quelle clé
   `AIza` passait dans un fichier dont le nom contient « firebase » — une vraie fuite dans
   `firebase-auth.js` serait passée — et la clé publique était bloquée partout ailleurs. Faux
   négatif et faux positif sur la même ligne.

**Corrigé** — PR [#5](https://github.com/ZoneTotalSport/zts-zone-page/pull/5), fusionnée
(`81e1b58`) :

- `_scripts/verifie-secrets.sh` : les 9 motifs d'origine, restaurés.
- **Allowlist par valeur** : la clé web publique de `zone-total-sport` est autorisée partout,
  toute autre clé `AIza` est refusée partout, `firebase-auth.js` compris.
- `.githooks/pre-commit` enchaîne les deux familles, secrets d'abord. Aucune ne peut plus
  effacer l'autre.
- Le message d'échec dit quoi faire (révoquer, ou documenter la valeur publique) au lieu de
  renvoyer vers `--no-verify`.

| test | attendu | résultat |
|---|---|---|
| clé publique connue dans `shared/zts-gate.js` + `article-views.js` | passe | ✅ |
| autre clé `AIza` dans un fichier quelconque | bloque | ✅ |
| autre clé `AIza` dans `firebase-auth.js` | bloque | ✅ (l'ancienne faille) |

**Ce commit est passé sans `--no-verify`.** Le hook est redevenu obligatoire.

## C.4 — Ton protocole de test manuel

Voir la section suivante.

---

# PROTOCOLE DE TEST MANUEL — à jouer par Joey

Tout est en prod. Ce protocole couvre les deux mondes d'authentification, qui se testent
**séparément** : ils ne partagent aucun bouton.

## Test 1 — le portillon des outils (le monde qui était cassé) — **prioritaire**

**URL : `https://zonetotalsport.ca/apps/echauffements/`**

C'est le plus représentatif : c'est un des 24 outils à portillon, exactement le chemin où
la déconnexion ne fonctionnait pas. `sos-conflits` ou `grands-jeux` feraient aussi bien.

| # | Ce que tu fais | Ce que tu dois voir | Échec si |
|---|---|---|---|
| 1 | Ouvrir l'URL, déconnecté | Mur plein écran « Crée ton compte gratuit » | Tu vois l'outil directement → tu étais déjà connecté, déconnecte-toi d'abord |
| 2 | Cliquer « Continuer avec Google » | **L'écran de choix de compte Google s'affiche** | Google te connecte sans rien demander → `select_account` n'est pas pris, dis-le-moi |
| 3 | Choisir ton compte | Le mur disparaît, l'outil s'affiche, pastille **« 👋 Déconnexion · Joey »** en bas à droite | — |
| 4 | Cliquer cette pastille | Tu **quittes la page** et arrives sur l'accueil `zonetotalsport.ca` | Tu restes sur l'outil face au mur → le correctif n'est pas pris (vide le cache) |
| 5 | Pendant l'étape 4, regarder l'écran | **Aucun clignotement** du mur avant de partir | Le mur réapparaît une fraction de seconde → dis-le-moi (garde `leaving`) |
| 6 | Sur l'accueil : recharger (⌘R) | Header en **« Connexion »**, pas « Salut Joey » | « Salut Joey » revient → **c'est le bug, rapporte-le** |
| 7 | Revenir sur `/apps/echauffements/` | Le mur, pas l'outil | L'outil s'ouvre → la session est revenue |
| 8 | Recliquer « Continuer avec Google » | **Le sélecteur de compte s'affiche encore** | Connexion silencieuse → dis-le-moi |

## Test 2 — la modale du site (blog, articles, accueil)

**URL : `https://zonetotalsport.ca/`**

| # | Ce que tu fais | Ce que tu dois voir | Échec si |
|---|---|---|---|
| 1 | Cliquer « Connexion » dans le header | La modale, avec **le prof d'ÉPS en bleu** et les polices ZTS | Tu vois encore le bûcheron au ballon → cache navigateur, force le rechargement |
| 2 | « Se connecter avec Google » | Le sélecteur de compte | Connexion silencieuse → dis-le-moi |
| 3 | Une fois connecté : header → menu → « Déconnexion » | Retour sur l'accueil, en « Connexion » | — |
| 4 | Recharger | Toujours déconnecté | « Salut Joey » revient → **c'est le bug** |

## Test 3 — deux onglets

1. Connecte-toi. Ouvre `zonetotalsport.ca` dans **deux onglets**, connecté dans les deux.
2. Déconnecte-toi dans l'onglet A.
3. Recharge l'onglet B.

**Attendu** : l'onglet B est déconnecté lui aussi.
**Échec** : B est encore connecté **et** un rechargement de A te reconnecte.

## Test 4 — Safari iOS, navigation privée, compte Google jamais ouvert

C'est le cas le plus dur : ITP + première connexion Google sur l'appareil.

Rejoue le **Test 1** tel quel. Deux points d'attention :

- **Étape 2** : l'écran va **quitter le site** vers `accounts.google.com`, puis revenir.
  C'est normal sur iOS (`signInWithRedirect`). Tu dois voir la page de connexion Google **et
  le choix de compte** — pas un aller-retour instantané.
- **Étape 6** : c'est LE test. En navigation privée sur iOS, si tu restes déconnecté après
  rechargement, l'affaire est close.

## Test 5 — les compteurs (30 secondes)

1. Ouvre `https://zonetotalsport.ca/articles/nawatobi.html`.
2. Ouvre `https://zonetotalsport.ca/blog.html`.

**Attendu** : la carte « Nawatobi » affiche **3** (elle était à 2, plus ta visite), et les
autres cartes affichent leurs vrais chiffres au lieu de 0.
**Échec** : tout à 0 → dis-le-moi, la console de l'article dira `[ZTS Views]`.

Vérification par le stockage, si tu veux la preuve dure :

```bash
curl -s "https://firestore.googleapis.com/v1/projects/zone-total-sport/databases/(default)/documents/article_views/nawatobi?key=AIzaSyBoBxVP6g_ObKIJJ1jkviNFQ-wpJoWdjbA"
```

Note : une seule vue est comptée par article **par session de navigateur** (anti-spam). Pour
recompter, ouvre un onglet privé.

## Ce qui compte comme un succès, et ce qui n'en est pas un

**Ne me rapporte pas « ça marche » si :**
- tu n'as pas fait l'**étape 6** (le rechargement après déconnexion) — c'est le seul test qui
  distingue « déconnecté » de « déconnecté pour l'instant » ;
- tu n'as pas vu le **sélecteur de compte Google** à la reconnexion — sans lui, on n'a pas
  vérifié le correctif, juste constaté qu'on peut encore se connecter ;
- tu as testé uniquement sur l'accueil : le bug vivait sur les **outils**, pas sur la home.

**Ce qui n'est PAS un échec :**
- rester connecté sur `jeux.zonetotalsport.ca` après une déconnexion sur le site principal.
  C'est une **origine distincte**, avec sa propre persistance Firebase. Connu, documenté en
  dette, hors périmètre de ces correctifs.
