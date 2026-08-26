# PRESCAN — Zone Rencontres

**Date :** 24 août 2026 · **Mode :** lecture seule, aucun fichier modifié
**Dépôt :** `~/dev/Remotion 2/wix-deploy/` · **Branche :** `main` @ `2b4be0b9`,
synchro avec `origin/main` (PR #25 fusionnée).
**État de l'arbre :** propre au périmètre près — `.gitignore` porte un ajout
non commité (`.env`), et deux tickets non suivis traînent à la racine
(`TICKET-CONTROLES-ARTICLES.md`, `TICKET-SITEMAP-ARTICLES-MANQUANTS.md`).
Rien de tout ça n'appartient à ce chantier ; je n'y touche pas.

**Ce document ne code rien. Il attend le GO de Joey.**

---

## 1. Ce qui existe et qui sera réutilisé tel quel

| Brique | Fichier | Rôle pour Rencontres |
|---|---|---|
| Shell d'habillage | `assets/ztsh-shell.css` + `.js` (689 + 1580 l.) | fond marine, rayons, personnage, rail. `ZTSShell.monter({densite:'travail'})` |
| Header partagé | `shared/header.html` → injecté par `shared/zts.js` dans `[data-zts-header]` | **1521 pages** |
| Menu | `shared/zts-menu.js`, tableau `MENU`, groupe `outils` | ajouter une app = **une ligne** |
| Mur d'inscription | `shared/zts-gate.js` (278 l.) | déjà chargé par **26 apps**. Émet `zts:auth` |
| Dictionnaires | `shared/i18n/fr.json` + `en.json` | clés `menu.<app>.nom` / `.desc` |
| Worker IA | `cf-worker/generateur/`, sert `api.zonetotalsport.ca` | Haiku par défaut, Sonnet en option, quota Firestore + KV |
| Vérif. Firebase | `cf-worker/generateur/src/auth.js` | `verifyIdToken()` — jeton Firebase → `uid` |
| Quotas | `cf-worker/generateur/src/quota.js` | Firestore `userQuotas/{uid}`, KV `anon:{ip}:{mois}` |
| Contrôles | `_scripts/verifie-habillage.py`, `verifie-glyphes-ztsh.py`, `verifie-secrets.sh` | hook `pre-commit` **actif** (`core.hooksPath=.githooks`) + CI |
| Polices | `/fonts/` — LuckiestGuy, Bangers, ZoneTotalSport | zéro Google Fonts |
| Partage natif | `shared/zts-partage.js`, `assets/zts-partage-article.js` | `navigator.share` déjà câblé |
| Reconnaissance vocale | `apps/evaluation/app.js:1990-2016` | précédent `webkitSpeechRecognition`, `lang:'fr-CA'` |

**App de référence, et non le gabarit.** `shared/app-template.html` est
**périmé** : il charge Google Fonts, ne connaît pas le shell, et pose
`data-metier="ep"`. Le vrai patron, c'est `apps/inventaire/` (23 août 2026) —
5 fichiers, `index.html` / `dataStore.js` / `app.js` / `styles.css` (+ `qr.js`),
et cet ordre de scripts exact :

```
shared/zts.css → assets/ztsh-shell.css → styles.css
shared/zts.js → shared/zts-gate.js → assets/ztsh-shell.js
→ ZTSShell.monter({densite:'travail'}) → dataStore.js → app.js
```

---

## 2. Sept écarts entre le prompt et le dépôt

Aucun n'est bloquant ; six se règlent d'eux-mêmes, le **B** demande un arbitrage.

### A — `dataStore.js` n'est pas un fichier partagé
Il n'existe pas dans `shared/`. C'est un **patron**, présent en deux
exemplaires : `apps/planificateur/dataStore.js` et
`apps/inventaire/dataStore.js` (529 l.). Je créerai donc
`apps/rencontres/dataStore.js` sur ce modèle — seul module du dossier qui parle
à Firestore et au Worker, `app.js` ne connaissant que `RencData.*`.
**L'invariant du prompt est respecté ; c'est seulement le fichier qui est
propre à l'app.**

### B — `users/{uid}/rencontres/{id}` serait **refusé en production** ⚠
`firestore.rules:` la règle `users` est
`match /users/{uid} { allow read, write: if ... }` — **sans** `{document=**}`.
Elle ne couvre donc **pas** les sous-collections, et la clause finale
`match /{document=**} { allow read, write: if false; }` les interdit.
Écrire à ce chemin renverrait `permission-denied` à chaque enregistrement.

Deux sorties :

1. **Collection plate `rencontres/{id}` avec champ `uid`** — le patron maison,
   utilisé par `performances`, `plans`, `inventaires`, `inventaireItems`.
   Règle de quatre lignes, requête `where('uid','==',uid)`, aucun effet de
   bord sur `users`.
2. Ouvrir `match /users/{uid}/{document=**}` — trois mots, mais qui ouvre
   **toutes** les futures sous-collections de `users` d'un coup, y compris
   celles que `/entrainement` pourrait y poser.

**Ma recommandation : la 1.** Même sécurité, portée minimale, cohérente avec
les quatre collections d'app déjà en place.

### C — Le menu ne se modifie pas dans `header.html`
Le `header.html` de la racine est **mort** : son seul chargeur, `includes.js`,
n'a aucun appelant (0 page). Les 1521 pages vivantes passent par
`shared/header.html`, qui délègue explicitement à `shared/zts-menu.js` :

> « AJOUTER UNE APP = une ligne dans MENU ci-dessous. Rien d'autre. »

Le prompt demande à juste titre de ne créer aucune classe et de ne pas toucher
à `.zts-btn` (gelée, 1489 pages) : **le mécanisme existant fait exactement
ça.** Une entrée dans le groupe `outils`, avec `i18n` / `i18nDesc` et
`badge:'nouveau'` (la table `BADGES` est réutilisable), plus deux paires de
clés dans les deux dictionnaires. Zéro ligne de CSS.

### D — La carte d'accueil : le prompt tranche une question déjà tranchée
Le 23 août, l'ajout d'un outil à l'accueil avait été **révoqué** :
`METIERS[*].apps` de `index.html` est du **code mort** (`renderToolsGrid()`
écrit dans `#tools-grid`, qui n'existe nulle part ; son appelant est gardé par
`currentMetier()`, qui exige une classe `metier-*` que rien ne pose). La
position retenue alors était « pas de section neuve pour une seule app ».

Le prompt demande maintenant explicitement un bloc « 🆕 Zone Rencontres ». **Je
le prends comme une décision qui remplace la précédente** et je le construirai
en **HTML réel**, pas via `METIERS[*].apps` — y ajouter une entrée n'afficherait
toujours rien.

Reste une question de forme : `index.html` n'a **pas** de classe de carte
réutilisable. Il a `.porte` (les trois portes d'univers, 88×… avec splash et
rotation au survol) et `#apps-grid` (sept micro-widgets instantanés). Voir
**décision 2** au §5.

### E — Whisper : le worker n'a **pas** de binding Workers AI
`cf-worker/generateur/wrangler.toml` déclare `[vars]` et `[[kv_namespaces]]`,
**aucun `[ai]`**. Il faut l'ajouter aux trois environnements (défaut, `dev`,
`production`). Conséquences chiffrées au §3.

### F — Modèle de transcription
`@cf/openai/whisper-large-v3-turbo` est le bon choix quand il est disponible :
il accepte une **indication de langue** (`fr`), ce que `@cf/openai/whisper` ne
fait pas — sur du français québécois avec des noms propres d'école, ça compte.
Repli automatique sur `@cf/openai/whisper` si le premier renvoie une erreur de
modèle inconnu. **À vérifier au premier déploiement, pas avant.**

### G — L'impression sort une page blanche
`assets/ztsh-shell.css:1192` masque `[class^="ztsh-"]` à l'impression, ce qui
attrape `.ztsh-page`, `body.ztsh-on` et `html.ztsh-on` : **les 41 apps migrées
impriment du blanc.** Non corrigé, décision de Joey en attente.
L'export PDF de Rencontres passe par `@media print` — il tombe donc en plein
dessus. Je reprendrai le **contournement local** déjà en place dans
`apps/inventaire/styles.css:912`, trois lignes dans la feuille de l'app :

```css
@media print {
  html.ztsh-on { display: block !important; }
  body.ztsh-on { display: block !important; }
  .ztsh-page   { display: block !important; }
}
```

Je ne touche pas au shell : c'est un fichier partagé par 41 apps, hors
périmètre.

---

## 3. Risques techniques, chiffrés

### R1 — Le découpage audio **dans le worker** est le vrai piège ⚠⚠
Le prompt demande de « découper les fichiers longs en segments (~5 min) côté
worker ». Un Worker Cloudflare est limité en **temps CPU**, pas en temps
d'attente réseau. Le worker actuel n'a jamais rencontré la limite parce qu'il
ne fait qu'attendre Anthropic (de l'I/O). Découper un `.m4a` de 60 min, c'est
du **calcul** : décodage, recherche des frontières de trames, ré-encodage.

**Recommandation : le découpage se fait côté navigateur**, dans un
`AudioContext`, et le client envoie N segments au worker, qui n'orchestre que
les appels Whisper et recolle le texte. Le navigateur a le processeur, le
fichier est déjà dans sa mémoire, et rien ne transite deux fois.

C'est aussi ce qui rend le repli du mode B gratuit : `MediaRecorder` produit
déjà des tranches côté client.

### R2 — Le coût, et le quota qui doit exister avant la première minute
Workers AI est facturé en **neurones**, avec une allocation quotidienne
gratuite. Une rencontre de 90 minutes n'est pas une requête, c'est 18 segments.
Sans plafond, **un seul utilisateur peut vider l'allocation de la journée pour
tout le site**, générateur compris — les deux partagent le même compte.

Le mécanisme existe déjà et se réutilise sans le réécrire : `readUserQuota` /
`incrementUserQuota` (`src/quota.js`). Il compte des **requêtes** ; il faut
qu'il compte des **minutes d'audio**. Deux ajouts, pas plus :
`QUOTA_MINUTES_MONTH` en `[vars]`, et un compteur `used_minutes` dans le même
document `userQuotas/{uid}`.

Chiffre à afficher **avant** de lancer, comme le demande le prompt : durée
détectée, minutes restantes au mois. Pas d'estimation en dollars — l'usager
n'a pas à connaître nos coûts.

### R3 — Web Speech API : le repli n'est pas un bonus, c'est le chemin normal
`webkitSpeechRecognition` n'existe **ni sur Firefox ni sur Safari**. Sur un Mac
ou un iPhone — la moitié du parc scolaire québécois — le mode B *est* le mode C.
Le `MediaRecorder` en tampon parallèle n'est donc pas une ceinture de sécurité,
c'est le moteur principal pour une part importante des usagers. Il sera écrit
et testé comme tel, pas comme un `catch`.

Deuxième piège, connu et non documenté : sur Chrome, `continuous:true`
**s'arrête tout seul** après quelques dizaines de secondes de silence. Une
rencontre a des silences. Il faut un redémarrage automatique sur `onend` tant
que l'usager n'a pas appuyé sur ⏹.

### R4 — `mailto:` tronque
Limite pratique ≈ 2000 caractères sur la plupart des clients, moins sur
Outlook. Un compte rendu structuré les dépasse presque toujours. Le prompt le
prévoit déjà (bouton « Copier » jumeau) ; je le rends **explicite dans
l'interface** : le bouton courriel n'envoie que titre + date + lien, et dit en
toutes lettres que le corps est dans le presse-papiers.

### R5 — Vie privée
L'audio d'une rencontre de comité contient des noms d'élèves et de personnel.
Il transitera par Workers AI. Le bandeau de consentement du prompt couvre les
participants ; il reste à décider si `politique.html` doit le mentionner.
**Décision 4 au §5.**

---

## 4. Périmètre exact des fichiers

**Créés** (7)
```
apps/rencontres/index.html
apps/rencontres/styles.css
apps/rencontres/dataStore.js
apps/rencontres/app.js
apps/rencontres/transcription.js     ← micro, MediaRecorder, découpage
cf-worker/generateur/src/rencontres.js
RENCONTRES-COMPLETE.md
```

**Modifiés** (10, tous en ajout)
```
shared/zts-menu.js            +1 ligne (groupe outils)
shared/i18n/fr.json           +2 clés
shared/i18n/en.json           +2 clés
ep.html                       +1 ligne dans ACTIVE
camps-de-jour.html            +1 ligne dans ACTIVE
service-de-garde.html         +1 ligne dans ACTIVE
index.html                    bloc Nouveautés (forme à décider)
firestore.rules               +1 bloc (4 lignes + commentaire)
sitemap.xml                   +1 <url> + 3 xhtml:link
cf-worker/generateur/wrangler.toml       +[ai] ×3 env, +QUOTA_MINUTES_MONTH
cf-worker/generateur/src/generateur-worker.js  +1 route, +import
cf-worker/generateur/src/quota.js        +minutes
```

**Jamais touchés**
`assets/ztsh-shell.*` · `shared/zts.css` · `shared/zts.js` ·
`shared/zts-gate.js` · `shared/header.html` · `.zts-btn` ·
`locked-whitelist.json` (l'app est **derrière** le mur) · `header.html` racine ·
`_to_delete/`

---

## 5. Quatre décisions qui te reviennent

> **1. Chemin Firestore.** Collection plate `rencontres/{id}` + champ `uid`
> (patron maison, portée minimale) — ou ouverture de
> `users/{uid}/{document=**}` ? *Recommandation : la collection plate.*

> **2. Forme du bloc d'accueil.** `index.html` n'a pas de carte réutilisable.
> (a) une bande « Nouveautés » sobre reprenant les tokens de la page, posée
> au-dessus des trois portes ; (b) une quatrième `.porte` — mais elle casse la
> symétrie des trois univers ; (c) une entrée dans `#apps-grid` — mais ce sont
> sept micro-widgets instantanés, et Rencontres n'en est pas un.
> *Recommandation : (a).*

> **3. Découpage audio : navigateur ou worker ?** Le prompt dit worker ; je
> recommande le navigateur (R1). Si tu tiens au worker, il faut d'abord
> confirmer que le compte Cloudflare est sur un plan payant.

> **4. `politique.html`.** Faut-il y ajouter un paragraphe sur le traitement
> des enregistrements ? Le fichier est hors périmètre déclaré ; je ne l'ouvre
> pas sans ton feu vert.

---

## 6. Vagues proposées, si GO

| # | Contenu | Livrable vérifiable |
|---|---|---|
| A | Coquille : `index.html`, shell, mur, `styles.css`. `verifie-habillage.py` au vert | l'app s'ouvre, mur en anonyme |
| B | `dataStore.js` + règles Firestore + mode A (notes manuelles, autosauvegarde 10 s) | une rencontre survit à un `kill` du navigateur |
| C | Mode B (micro, Web Speech + tampon `MediaRecorder`, minuteur, consentement) | dictée 2 min sur Chrome, texte à l'écran |
| D | Route worker + Whisper + quota en minutes + mode C (dépôt de fichier) | `.m4a` de 60 min transcrit et segmenté |
| E | Traitement IA (verbatim / structuré / passage), édition du résultat | les deux sorties sur la même rencontre |
| F | Classement, dossiers, glisser-déposer, vue liste | déplacement entre dossiers persistant |
| G | Envoi, export PDF/txt/md, `navigator.share`, correctif d'impression local | PDF non blanc |
| H | Les 5 ajouts v1 : Mes actions, gabarits, chaînage, présences, indicateur hors-ligne | vue transversale peuplée |
| I | Liens d'entrée (menu, 3 univers, accueil, sitemap) + `RENCONTRES-COMPLETE.md` | tunnel anonyme → inscription → app |
| J | *(après prod)* article de blog + carte `blog.html` + sitemap | — |

Les tests du §7 du prompt sont joués à la fin de chaque vague concernée, pas
tous à la fin.

---

## 7. Ce que je ne pourrai pas vérifier moi-même

Honnêtement, et d'avance :

- **Je ne crée pas de compte.** Le tunnel « anonyme → carte → inscription →
  retour app » sera vérifiable jusqu'à l'écran d'inscription. Le retour
  post-auth et le premier enregistrement Firestore restent à ta charge, comme
  les 4 tests de `LOT1-COMPLETE.md`.
- **Le déploiement du worker** (`wrangler deploy --env production`) et celui
  des règles Firestore demandent ton compte. Je livre le code et la commande.
- **La disponibilité de `whisper-large-v3-turbo`** sur le compte ne se
  constate qu'au premier appel réel.
- **Le micro** : je peux exercer le code, pas parler dans un micro. La dictée
  en français avec accents est un test humain.

---

## 8. Réponses de Joey — GO du 24 août 2026

Le prescan ci-dessus est conservé tel qu'il a été soumis. Voici ce qui a été
tranché, et qui fait foi pour la suite.

**Worktree dédié `~/dev/zts-rencontres`, branche `app/rencontres`** — rendu
obligatoire par la session parallèle qui éditait `zts-lock-page.js` dans
`~/dev/Remotion 2/wix-deploy/` pendant le prescan. Les deux chantiers ne
partagent plus d'arbre de travail, et `git diff --stat` redevient une preuve.

1. **Collection plate `rencontres/{id}` + `uid`.** Retenue.
   `create` si `request.resource.data.uid == request.auth.uid` ;
   `read/update/delete` si `resource.data.uid == request.auth.uid`.
   **Le déploiement des règles se fait depuis le worktree de la branche,
   jamais depuis `main`.**
2. **Bande Nouveautés sobre au-dessus des trois portes.** Retenue, et
   **générique** : le bloc doit accueillir les prochaines apps sans être
   réécrit. Remplace la décision du 23 août. `METIERS[*].apps` reste intact
   — c'est du code mort, on ne l'alimente pas.
3. **Découpage côté navigateur.** Retenu, avec une contrainte ajoutée :
   passage en **`OfflineAudioContext` 16 kHz mono avant segmentation**
   (mémoire et poids d'envoi), et **avertissement au-delà de 90 minutes**
   détectées. Le worker n'orchestre que Whisper et recolle le texte.
4. **`politique.html`** : un paragraphe — audio transcrit puis détruit, texte
   au compte de l'usager, responsabilité d'informer les participants.
   **Commit atomique séparé, annulable seul.**

Et sur les trois trouvailles :

- **Binding Workers AI** dans `wrangler.toml`, les trois environnements.
- **Quota en minutes**, avec un **plafond quotidien par utilisateur distinct
  de celui du générateur** — les deux ne se vident plus l'un l'autre.
- **Whisper est le chemin normal**, pas un repli. L'interface détecte
  `webkitSpeechRecognition` et annonce soit « transcription en direct », soit
  « transcription à la fin de l'enregistrement ». **Le mot « repli » ne paraît
  jamais à l'écran** : l'usager de Safari n'a pas une version dégradée, il a
  une version qui transcrit à la fin.
- **Contournement d'impression local en trois lignes.** Le shell reste intact.

*Fin du prescan.*
