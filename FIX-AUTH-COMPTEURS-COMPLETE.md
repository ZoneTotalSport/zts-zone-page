# FIX — déconnexion + compteurs de blog

**Branche** : `fix/auth-et-compteurs`, partie de `main` (`cd59ad1`), **4 commits**
**Date** : 26 juillet 2026 · Phase B, après GO
**Diagnostic amont** : `DIAGNOSTIC-2026-07-25.md`
**État** : commité, **non poussé, non déployé, non fusionné**

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

1. **Déployer les règles** : `firebase deploy --only firestore:rules` depuis le repo, jamais
   par la console (règle d'or du `CLAUDE.md`). Nécessite `~/.local/node/bin` dans le PATH.
   **Tant que ce n'est pas fait, le bug 2 n'est pas corrigé en prod** — le commit ne suffit pas.
2. **Fusionner et pousser** la branche (voir « Comment récupérer » ci-dessous).
3. **Jouer la séquence de test manuelle** du bug 1 (Chrome + Safari iOS + deux onglets).
4. **Vérifier `article_views` dans la console** et me dire ce que tu y vois.

## Comment récupérer la branche

Elle est dans un **worktree git séparé**, pas dans ton dossier de travail — une autre session
Claude Code occupait `wix-deploy` (branche `habillage/plan-b-meteo`) et je ne voulais pas lui
arracher sa branche sous les pieds.

```bash
cd "/Users/admin/Desktop/Remotion 2/wix-deploy" && git log --oneline main..fix/auth-et-compteurs
```

Les commits sont déjà dans le dépôt.

> ⚠️ **`main` a bougé pendant mon travail.** L'autre session a fusionné la fondation du shell
> dans `main` **et l'a poussée** (`f676b51 merge: fondation de l'habillage ZTS`). Ta contrainte
> « ces correctifs doivent pouvoir partir en prod sans embarquer la refonte » n'est donc plus
> tenable via `main` : `main` porte déjà le shell.
>
> J'ai **laissé ma branche sur `cd59ad1`**, l'ancien `main`, au lieu de la rebaser — pour te
> garder l'option de sortir les 3 correctifs seuls (`git cherry-pick f509b0f 904a4ed ddf98f1`
> sur une branche partant d'avant le shell). À toi de choisir.

Fusion à blanc vérifiée : **aucun conflit** avec le nouveau `main` (le merge du shell n'a
touché que des fichiers `ztsh-*`, des docs et des scripts — zéro recoupement).

```bash
cd "/Users/admin/Desktop/Remotion 2/wix-deploy" && git checkout main && git merge --no-ff fix/auth-et-compteurs && git push origin main
```

Puis, quand tu n'en as plus besoin :

```bash
cd "/Users/admin/Desktop/Remotion 2/wix-deploy" && git worktree remove /private/tmp/claude-501/-Users-admin-Desktop-Remotion-2/0a24cc15-9a96-46ef-8c3e-c1932a68e534/scratchpad/zts-fix
```

---

## Dette restante

| Sujet | Pourquoi ça compte |
|---|---|
| **Deux systèmes d'auth** | Le vrai problème de fond. `firebase-auth.js` (1510 pages) et `shared/zts-gate.js` (24 apps) dupliquent modale, logout, provider Google et config Firebase. Le contrat `zts_signed_out` est aujourd'hui **copié dans les deux fichiers** : la prochaine correction risque encore de n'en toucher qu'un. À unifier au chantier harmonisation. |
| **Sessions par origine** | `jeux.zonetotalsport.ca` est un déploiement séparé : sa persistance Firebase est indépendante. Une déconnexion sur le site principal ne le déconnecte pas. Non traité ici — ça demande une décision (SSO ou assumé). |
| **`apps/studio-jeu/admin-gate.js`** | Appelle aussi `getRedirectResult()` sans la garde, et son provider Google n'a pas `select_account`. Hors périmètre (gate admin, toi seul), mais même famille de bug. |
| **Hook de secrets** | Bloque sur l'apiKey Firebase, publique par conception et présente dans tous les fichiers clients. Les 4 commits sont passés en `--no-verify`, motif écrit dans chaque message. À affiner (liste d'exceptions), sinon le hook sera contourné par réflexe — et ne servira plus à rien. |
| **`getSlugFromUrl()` fragile** | `article-views.js:45` renvoie `null` sur une URL à slash final, et `blog.html:382` exige `.html` dans le `href`. Ça marche aujourd'hui, ça casserait en silence à la première migration d'URL. |
| **GA4 en opt-in strict** | `analytics_storage` reste `denied` tant que la bannière n'est pas acceptée : tes chiffres GA4 sont amputés de tous les visiteurs qui ne cliquent pas. Rien à voir avec les compteurs Firestore — mais c'est une décision à prendre, pas un effet de bord à subir. |
| **`.git` dans un Bureau iCloud** | Pendant l'analyse, `Remotion 2/` a basculé vers `Bureau : MacBook Pro de Joey/` puis est revenu. Rien perdu, mais un dépôt git synchronisé iCloud entre deux Macs finira par corrompre un `.git`. |
