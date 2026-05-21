# COHÉRENCE V1 — COMPLÉTÉ

Décision : **Option B — freemium honnête**. Le compte est gratuit et instantané
mais devient la clé de la bibliothèque. On retire les promesses « sans compte /
pas de paywall » qui contredisaient le lock. Réf. : `AUDIT-SITE.md`, 4 items 🔴 NOW.

Date : 2026-05-21. Aucun déploiement effectué.

---

## Commits livrés

### Commit 1 — `b75863b` fix(message)
Retrait des promesses contradictoires, dans les **4 locales** (FR/EN/ES/ZH),
`index.html` + `footer.html` :
- `why1d` (carte « Gratuit. Pour vrai. ») : « Pas de freemium, pas de paywall…
  sans créer de compte » → « Zéro pub, zéro carte de crédit. Crée ton compte
  gratuit et débloque toute la bibliothèque : 90 cours, jeux, SAÉ et outils. »
- Bouton gate `gateContinue` : « Continuer sans inscription » → « Explorer les
  ressources gratuites » (l'icône `arrow-right` Lucide est conservée ; le « → »
  littéral de la consigne a été omis pour ne pas doubler la flèche).
- Titre « Gratuit. Pour vrai. » **conservé** (reste vrai).
- `footerDesc` **non modifié** : la description actuelle (« La plateforme gratuite
  de ressources en éducation physique… ») ne contient **aucune** promesse
  contradictoire → la condition de l'instruction (c) ne s'applique pas. À revoir
  manuellement si on veut quand même la reformuler vers « Crée ton compte ».

### Commit 2 — `4187cd8` fix(mobile)
Popups mobiles dans `index.html` (PAS `zts-locked-fullscreen.js`, déjà OK) :
- `.ia-popup-overlay` + `.gate-overlay` : `align-items:flex-start` + `overflow-y:auto`
  + `-webkit-overflow-scrolling:touch` + `padding: env(safe-area-inset-top,16px) 16px 32px`.
  Box interne : `margin:auto` (centre si ça rentre, scrolle sinon).
- Boutons X : `.ia-popup-close` et `.gate-close` sortis de l'offset négatif
  (`top:-16/-14px`) vers `top:8px; right:8px` → toujours visibles/cliquables.
  Padding-top ajouté (`.ia-popup-body` 52px, `.gate-header` 48px) contre le
  chevauchement. **Note** : seuls 2 X étaient en offset négatif (pas 4 — `.close-btn`
  était déjà `top:15px`, `.zts-lf-close` est dans sa box).
- `.comic-popup.fullscreen` : ajout du fallback `height:100dvh!important` après
  `100vh!important`.

### Commit 3 — couverture du lock : AUCUN changement de code
Vérification faite : **toutes** les apps de `wix-deploy/apps/*` embarquent déjà
`<script src="/zts-lock-page.js" defer>` — sauf `generateur` (ouvert volontairement,
quota « 3 essais »). Les apps servies depuis ce repo (`zonetotalsport.ca/apps/*` :
planificateur, scoreboard, transitions, omnigroupe) sont **donc déjà verrouillées**.
La whitelist (`jeux`, `sae`) n'a pas été touchée.

La faille décrite dans l'audit concerne uniquement les **sous-domaines** = des
déploiements séparés qui ne tirent pas leur HTML de ce repo. Rien à committer ici ;
voir la liste « à redéployer » ci-dessous.

### Commit 4 — `f0ce9ec` fix(honnêteté)
Nombre de profs unifié à **« 350+ »** (réel ≈ 390) partout, FR/EN/ES/ZH,
`index.html` + `footer.html` + `promo.html` :
- compteur hero (`data-target` 2300 → 350, restructuré avec `<span>+</span>`
  comme ses voisins), `subSocial`, `gateDesc`, `iaStat2Num`, `iaPerk4`,
  badges et meta de `promo.html`.

---

## À REDÉPLOYER À PART (sous-domaines — déploiements séparés)

Le lock ne couvre que `zonetotalsport.ca/apps/*`. Les apps liées dans la grille
d'accueil via `X.zonetotalsport.ca` sont des projets/déploiements distincts : il
faut **y embarquer `/zts-lock-page.js`** (et que `zts-lock-page.js`,
`zts-locked-fullscreen.js`, `firebase-auth.js`, `locked-whitelist.json` soient
servis à la racine du sous-domaine).

| Sous-domaine | À verrouiller ? | Statut |
|---|---|---|
| `agenda.zonetotalsport.ca` | OUI | redéploiement séparé requis |
| `educatifs.zonetotalsport.ca` | OUI | redéploiement séparé requis |
| `evaluation.zonetotalsport.ca` | OUI | redéploiement séparé requis |
| `grille.zonetotalsport.ca` | OUI | redéploiement séparé requis |
| `musique.zonetotalsport.ca` | OUI | redéploiement séparé requis |
| `tni.zonetotalsport.ca` | OUI | redéploiement séparé requis |
| `gym.zonetotalsport.ca` | OUI (à confirmer) | **aucun dossier `apps/gym/`** — identifier la source de ce sous-domaine |
| `jeux.zonetotalsport.ca` | NON (whitelist) | reste libre — OK |
| `sae.zonetotalsport.ca` | NON (whitelist) | reste libre — OK |

Apps déjà couvertes par ce repo (aucune action) : planificateur, scoreboard,
transitions, omnigroupe (`/apps/*`). `generateur` : ouvert volontairement.

NB : la copie locale `wix-deploy/apps/{agenda,educatifs,evaluation,grille,musique,tni}/`
contient déjà le script de lock — si ces sous-domaines sont redéployés depuis ces
dossiers, ils seront couverts automatiquement.

---

## RESTE À TESTER MANUELLEMENT

1. **Mobile (iPhone + iPad réels)** : ouvrir le popup IA et le popup gate →
   vérifier que le contenu scrolle entièrement et que le bouton X reste visible
   et cliquable (notch / barre d'adresse). Tester aussi le minuteur TNI plein
   écran (`comic-popup.fullscreen`) en `100dvh`.
2. **i18n** : changer la langue (FR/EN/ES/ZH) sur `index.html` et vérifier que
   `why1d`, `gateContinue`, `subSocial`, `iaStat2Num` affichent bien les nouveaux
   textes sans contradiction résiduelle.
3. **Compteur hero** : confirmer que « 350+ » s'anime correctement (structure
   `<span class="counter">` + `<span>+</span>` modifiée).
4. **Lock sous-domaines** : une fois redéployés, tester en navigation privée
   (anonyme) qu'un sous-domaine non-whitelisté affiche bien le pop-up cadenas.

## DÉCISIONS EN ATTENTE (arbitrage Joey)

- **Claims d'activité non touchés** (volontairement, hors périmètre « chiffre profs ») :
  - `shareMsg` (×4 langues, `index.html`) : « 349 collègues l'utilisent déjà ».
  - `iaSocialProof` (`zts-locked-fullscreen.js`, footer, index) : « Marie-Claude
    et 47 autres profs… cette semaine ».
  → décider : aligner sur « 350+ », neutraliser, ou laisser.
- **`footerDesc`** : actuellement neutre. La reformuler vers « Crée ton compte
  gratuit et débloque tout » si on veut renforcer le cadrage freemium.
- **Centralisation** : les chiffres restent dupliqués dans des dicts i18n
  hardcodés (2 fichiers × 4 locales). Une vraie source unique (`zts-stats.js`)
  éviterait une re-désync future — non fait ici (refactor invasif, hors périmètre).
