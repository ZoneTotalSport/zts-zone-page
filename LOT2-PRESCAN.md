# LOT 2 CONVERSION — prescan

**21 août 2026. Lecture seule.** Aucun code livré, rien en production.
Base : `main` à `f362d89` (PR #16 fusionnée).

---

## 1. Le stash « v2-modal-2-etapes » — 6 conflits, tous au même endroit

Rejoué sur une branche neuve depuis `main` actuel. Le stash date du 9 août
(base `d391e73`) ; `main` a bougé de 40+ commits depuis.

**`git stash apply` → 6 conflits, un seul fichier : `firebase-auth.js`.**

| Ligne | Zone en conflit |
|---|---|
| 28-46 | Le commentaire qui documente le RETRAIT de `zts_signed_out` ↔ sa définition |
| 63-80 | `onAuthStateChanged` seul ↔ `getRedirectResult()` + `_signedOutAtLoad` |
| 596 | ↔ `clearSignedOut()` dans `handleLogin` |
| 658 | ↔ `clearSignedOut()` dans `handleSignup` |
| 683 | ↔ `clearSignedOut()` dans le chemin Google |
| 822 | ↔ `markSignedOut()` avant `signOut()` |

**Les six sont le même conflit.** Le stash est antérieur au LOT 0, qui a retiré
`getRedirectResult` et son drapeau `zts_signed_out` le 12 août. Appliquer le
stash tel quel **réintroduirait le chemin redirect** — celui dont le test iPhone
n'a jamais été joué, et dont le retrait était une décision, pas un nettoyage.

**Bonne nouvelle : la modale V2 elle-même s'applique proprement.** Aucun des six
conflits ne touche `buildStep1HTML`, `buildStep2HTML`, `renderStep1`,
`renderStep2`, les styles, ni la preuve sociale. La résolution est mécanique —
garder `Updated upstream` aux six endroits — mais je ne l'ai pas faite : c'est
ton point d'arrêt.

### Le piège que l'application en bloc ferait passer

**Le stash REGRESSE la table d'erreurs.** `main` en compte 14 ; le stash 12. Il
perd deux entrées ajoutées depuis le 9 août :

| Code | `main` | stash |
|---|---|---|
| `auth/wrong-password` | `Mot de passe incorrect.` | **absent** → message générique `Erreur: …` |
| `auth/cancelled-popup-request` | `null` (silence volontaire) | **absent** → erreur affichée pour rien |

`auth/cancelled-popup-request` est levé quand l'utilisateur ouvre deux fenêtres
de connexion : le `null` de `main` le tait exprès. Le stash l'afficherait.

**Conclusion : ce stash se reprend à la main, morceau par morceau — pas en
bloc.** Ce qu'on garde : les deux étapes, les styles, la preuve sociale, le
bouton retour, l'œil sur le mot de passe. Ce qu'on jette : les six hunks
`signed_out`, et la table d'erreurs (celle de `main` est meilleure).

## 2. Inventaire des surfaces

### Le tunnel — qui parle, qui traduit

| Fichier | Rôle | i18n FR/EN |
|---|---|---|
| `firebase-auth.js` | **la modale d'inscription/connexion** | ❌ **aucune** |
| `zts-locked-fullscreen.js` | le mur plein écran | ❌ **aucune** |
| `zts-lock-page.js` | le demi-mur des fiches | ❌ **aucune** |
| `zts-cadenas.js` | cadenas du menu | ✅ `T{fr,en}` + `lang()` |
| `shared/zts-gate.js` | mur des apps | ✅ `T{fr,en}` + `lang()` |
| `shared/zts-unlock.js` | cartes verrouillées du hub | ✅ `T{fr,en}` + `lang()` |
| `bienvenue.html` | l'arrivée après inscription | ❌ **0 `data-i18n`** |

Le périmètre de (c) est exactement la colonne rouge : trois modules et une page.

⚠ **Deux `lang()` différentes coexistent.** `shared/zts-gate.js:54` lit
`localStorage` seul ; `zts-cadenas.js:73` a trois niveaux de repli
(`ZTS.getLang()`, puis `localStorage`, puis `navigator.language`). Un visiteur
anglophone qui n'a jamais cliqué le sélecteur voit donc le cadenas en anglais et
le mur des apps en français. À unifier **avant** d'en câbler trois de plus.

### Le chrome partagé — un fichier, pas 1489

| Mesure | Valeur |
|---|---|
| Pages portant `data-zts-header` | **1519** |
| Pages chargeant `shared/zts.js` | **1518** |
| dont `jeux/` | 1440 |
| dont `apps/` | 42 |
| dont `articles/` | 25 |

Le header et le pied sont **injectés** par `injectPartial()`
(`shared/zts.js:127`) depuis `shared/header.html` et `shared/footer.html`. Le
bouton de partage se pose donc dans **un seul fichier** + les dictionnaires
`shared/i18n/{fr,en}.json`. Aucune des 1519 pages n'est touchée.

⚠ **Ne pas confondre avec `footer.html` à la racine** — 207 Ko, une page
autonome héritée, qui contient déjà un bouton « Partager le site » (`donBtn2`,
en FR/EN/ZH). Il n'est **pas** dans le chrome injecté. Le modifier ne toucherait
rien.

### Le worker de preuve sociale

`https://zone-subscriber-count.zts-ccd.workers.dev/` répond aujourd'hui :

```json
{"total":340,"today":0,"yesterday":2,"last7days":5,"last30days":7,"thisMonth":6}
```

`cache-control: public, max-age=300`, CORS ouvert. **340** — contre 335 au
LOT 0 et 328 codé en dur dans `claude/conversion-cta`.

**Le stash lit déjà le worker** (`fetchProof()`), avec un garde-fou `total > 50`
et un repli textuel. Rien n'est codé en dur : l'exigence (a) est donc **déjà
satisfaite par le stash**. Un défaut subsiste : `_proofText` est calculé au
chargement du script ; si la modale s'ouvre avant que le `fetch` réponde, elle
affiche le repli générique et ne se corrige jamais. Il faut re-rendre à
l'arrivée du chiffre.

## 3. Périmètre — ce qui est déjà fait, ce qui reste

### ⚠ `locked_click_signup` tiré 3× : DÉJÀ CORRIGÉ le 13 août

Le brief demande de le réparer. Vérification faite : **il ne l'est plus.**
Quatre émetteurs existent, chacun tire **une fois par intention** :

| Émetteur | Quand |
|---|---|
| `zts-lock.js:89` | **seulement en repli**, si le pop-up est absent — sinon `return` avant |
| `zts-locked-fullscreen.js:105` | le bouton du pop-up, qui EST la demande |
| `zts-lock-page.js:146` | le bouton du demi-mur (pas de pop-up sur ces pages) |
| `shared/zts-unlock.js:98` | la carte du hub |

Le commentaire de `zts-lock.js:74` documente la correction. Et **aucune page ne
charge à la fois `zts-lock.js` et `shared/zts-unlock.js`** — vérifié sur les
quatre pages qui chargent `zts-unlock.js` : pas de recouvrement possible.

**Le brief est en retard là-dessus, comme il l'était pour le chantier 1.**

### Le chemin Google à 3 clics : RÉEL, et la cause est d'une ligne

`firebase-auth.js:761` :

```js
root.ztsShowSignup = function() { showModal('signup'); };
```

**La fonction ignore son argument.** Le mur plein écran appelle pourtant
`ztsShowSignup({ provider: 'google' })` (`zts-locked-fullscreen.js:108`) après
avoir déjà demandé le fournisseur au visiteur. Le choix est jeté ; la modale
s'ouvre sur le formulaire courriel ; il faut re-cliquer « Google ».

Les 3 clics : **① Google dans le mur → ② Google dans la modale → ③ choisir son
compte.** Le ① est du pur frottement — l'intention était déjà exprimée.

### (d) Le générateur est invisible — mesuré

Absent du header et du pied partagés. Lié depuis **3 pages seulement** :
`index.html`, `ep.html`, `bienvenue.html`. Aucune mention des 3 essais gratuits
hors de sa propre page.

Les 1440 fiches de jeux — la surface SEO dominante — n'y renvoient jamais.
C'est là que se trouve le trafic, et c'est le seul outil qu'on peut essayer sans
compte.

**Ma proposition, par rapport qualité/effort :**

1. **Le mur plein écran et le demi-mur des fiches** portent déjà l'attention au
   bon moment (quelqu'un vient de buter sur un contenu réservé). Une seconde
   ligne — « ou essaie le générateur, 3 fiches gratuites, sans compte » — coûte
   deux phrases et touche les 1440 fiches par un module déjà chargé.
2. **Le pied partagé** : une carte « Générateur IA — 3 essais sans inscription »,
   un fichier, 1519 pages.
3. **`ia.zonetotalsport.ca`** — le nom que quelqu'un taperait — redirige en deux
   sauts (§2 du chantier 2). Un caractère au tableau de bord, et c'est chez toi.

Je ne propose **pas** de bandeau permanent sur les fiches : `claude/conversion-cta`
en portait un, et le §D de `LOT0-COMPLETE.md` a déjà tranché qu'on garde l'idée
et pas le code.

### (e) Les 3 idées de `claude/conversion-cta`, réécrites

| # | Défaut d'origine | Réécriture |
|---|---|---|
| 1 | `zts-jeux-cta.js:54` injecte un `@import` Google Fonts (Nunito) en JS — sur 1440 pages | **Aucune police injectée.** Les tokens locaux du shell, comme partout depuis le 4 août |
| 2 | « 328 profs » codé en dur, deux fois | Le worker, **340** aujourd'hui, avec re-rendu à l'arrivée du chiffre (§2) |
| 3 | Un 6e émetteur de `locked_click_signup` | **Aucun nouvel émetteur.** Les 4 existants suffisent et sont déjà dédupliqués |

## 4. Ordre des vagues proposé, et les points d'ARRÊT

L'ordre suit une règle : **ce qui est mesuré passe avant ce qui est visible**, et
rien de bilingue ne se câble avant que `lang()` soit unique.

### Vague A — la modale V2 (2 commits, ta consigne 3a)

- **A1** — reprise du stash morceau par morceau : les deux étapes, les styles,
  le bouton retour, la preuve sociale re-rendue à l'arrivée du chiffre.
  **Les six hunks `signed_out` sont jetés, la table d'erreurs de `main` est
  gardée.**
- **A2** — l'écran argumentaire + `ztsShowSignup(opts)` qui **honore enfin son
  argument** : Google demandé dans le mur ⇒ Google déclenché directement.
  3 clics → 2. Le `locked_click_signup` n'est pas touché : il est déjà juste.

**⛔ ARRÊT 1** — la modale est le tunnel. Rien d'autre ne bouge avant qu'elle
soit vue et validée en navigateur.

### Vague B — `lang()` unique, puis le tunnel bilingue (3c)

- **B1** — une seule `lang()` pour les six modules, celle de `zts-cadenas.js`
  (trois niveaux de repli). Corrige au passage l'anglophone qui voit deux
  langues sur la même page.
- **B2** — `firebase-auth.js`, `zts-locked-fullscreen.js`, `zts-lock-page.js` et
  `bienvenue.html` passent au patron `T{fr,en}`.

**⛔ ARRÊT 2** — B1 touche six modules du tunnel d'un coup. À valider seul.

### Vague C — le bouton de partage (3b)

`shared/header.html` ou `shared/footer.html` + `shared/i18n/{fr,en}.json`.
Bilingue **par construction**, puisque B est passée avant. `navigator.share`
quand il existe, repli sur les liens réseaux sinon.

**⛔ ARRÊT 3.**

### Vague D — la mise en avant du générateur (3d)

Les deux surfaces du §(d), une fois le tunnel stable et bilingue.

**⛔ ARRÊT 4.**

### Pourquoi cet ordre

- **A avant tout** : c'est le seul écran que traversent *toutes* les
  inscriptions. Le réparer d'abord, c'est mesurer les vagues suivantes sur un
  tunnel qui ne fuit plus.
- **B avant C et D** : câbler deux surfaces bilingues de plus sur deux `lang()`
  divergentes, c'est doubler le défaut avant de le corriger.
- **D en dernier** : envoyer du monde vers le générateur avant que la modale et
  la langue soient réglées, c'est dépenser de l'attention sur un tunnel qu'on
  sait cassé.

## 5. Ce que ce prescan n'a pas tranché

- **La résolution des 6 conflits** — mécanique, mais c'est ton arrêt.
- **Où exactement poser le bouton de partage** — header ou pied. Le pied est
  moins intrusif, le header plus vu. À décider avec toi.
- **Le texte du pitch de partage** — c'est de la voix de marque, pas de la
  technique.
- **`font-patrick` dans `bienvenue.html`** — Patrick Hand est sortie du site le
  4 août. À vérifier si l'alias Tailwind pointe encore quelque part, comme les
  alias `font-fredoka` / `font-baloo` repointés dans la branche news.
