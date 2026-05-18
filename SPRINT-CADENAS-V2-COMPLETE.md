# Sprint Cadenas V2 — Release note

**Date :** 18 mai 2026
**Objectif :** convertir 1-3 % des visiteurs anonymes (baseline 0,28 %)
en membres inscrits, en verrouillant 95 % du contenu derriere une
inscription gratuite avec lead magnet (90 cours d'EPS).

## Avant
- Cadenas mou : overlay CSS sur items #3+ des grilles index/blog
- Pages individuelles (`/articles/*.html`, `/apps/*/index.html`)
  totalement ouvertes — URL directe contourne tout
- Generateur IA : 3 essais anonymes localStorage (reset si effacement)
- Aucun tracking funnel
- Aucune Firestore rule (validation 100 % worker)

## Apres
- **Whitelist source unique** : `locked-whitelist.json` (4 slugs libres)
- **Cadenas dur pages** : `zts-lock-page.js` injecte dans 39 pages, slug
  pas dans whitelist + non-auth → pop-up plein ecran bloquant
- **Cadenas grilles** refactored : `zts-lock.js` v2 lit la whitelist,
  promet le bonus 90 cours, emet events funnel
- **Pop-up plein ecran** unique : `zts-locked-fullscreen.js` (Pop Art
  Mr. Root, Patrick Hand, cyan/violet, dashed, offset shadow)
- **Generateur** : fingerprint SHA-256 + Firestore `anonGenCount`,
  2 essais gratuits puis pop-up. Worker reste 2e ligne de defense.
- **Funnel analytics** : `zts-funnel.js` ecrit dans Firestore
  `conversionFunnel` (locked_view, locked_click_signup,
  locked_click_login, signup_complete) + piggyback GA4
- **Firestore rules** : append-only `conversionFunnel`, monotonic +1
  cap 999 sur `anonGenCount`, read-self sur `userQuotas`, deny-all
  par defaut

## Fichiers crees
- `locked-whitelist.json`
- `zts-lock-page.js`
- `zts-locked-fullscreen.js`
- `zts-funnel.js`
- `apps/generateur/zts-anon-fingerprint.js`
- `firestore.rules`
- `scripts/inject-lock-page.sh`

## Fichiers modifies
- `zts-lock.js` (refactor whitelist + bonus 90 cours + funnel)
- `index.html`, `blog.html` (ajout funnel + fullscreen scripts)
- `apps/generateur/index.html` (ajout funnel + fullscreen + fingerprint)
- `apps/generateur/app.js` (gate fingerprint avant call, fullscreen sur
  QUOTA_EXCEEDED, ANON_LIMIT 3 → 2)
- 22 `articles/*.html` + 17 `apps/*/index.html` (injection scripts head)

## Whitelist actuelle (`locked-whitelist.json`)
```json
{
  "freeResources": ["jeux", "planificateur"],
  "freeArticles": ["faire-bouger-enfants", "comportements-perturbateurs"]
}
```

## Ajouter une nouvelle ressource ou un nouvel article
**Rien a faire.** La whitelist est manuelle et fige les 4 slugs SEO.
Tout nouvel article ou nouvelle app est automatiquement verrouille.

Pour permettre l'injection des scripts cadenas sur une nouvelle page :
```bash
bash scripts/inject-lock-page.sh
```
Le script est idempotent (skip si scripts deja presents).

Pour changer la whitelist : editer `locked-whitelist.json` directement.
Cache localStorage TTL = 1 h cote client (donc rollout < 1 h).

## Deploiement
1. `git push` (GitHub Pages auto-deploy)
2. `firebase deploy --only firestore:rules`
3. Verifier en navigation privee (cf. checklist plus bas)

## Checklist verification (navigation privee)
- [ ] zonetotalsport.ca : grille apps montre cadenas sur items 3+
- [ ] Clic sur ressource verrouillee → pop-up plein ecran Pop Art
- [ ] Clic sur `jeux` ou `planificateur` (whitelist) → ouvre normalement
- [ ] /articles/faire-bouger-enfants.html → ouvre normalement
- [ ] /articles/respect-eps.html → page bloquee par pop-up plein ecran
- [ ] /apps/scoreboard/ → page bloquee par pop-up plein ecran
- [ ] /apps/generateur/ : generer 2 fois → 3e essai bloque par pop-up
- [ ] Rafraichir + changer onglet → fingerprint persiste, toujours bloque
- [ ] S'inscrire → cadenas disparait partout, redirige vers /bienvenue.html
- [ ] Se deconnecter → cadenas revient

## Metriques baseline a surveiller
- Inscriptions/semaine (avant : 2)
- Conversion % (avant : 0,28 %, cible 1-3 %)
- Funnel ratio : `locked_view` → `locked_click_signup` → `signup_complete`
- Generateur : volume essais anonymes vs inscriptions post-3e essai

GA4 : marquer `locked_click_signup` et `signup_complete` comme
conversions dans Admin → Events apres la 1re semaine de donnees.

## Dette technique reportee
- **Migration token-per-user 90 cours** : actuellement
  `DEMO2026` partage. Migration prevue hors scope.
- **GA4 conversion flagging** : a faire manuellement dans Admin GA4.
- **Liens internes index.html** : certains liens directs vers
  `/apps/xxx/` dans le HTML body pointent toujours en clair. La page
  cible bloque mais la grille pourrait mieux signaler.
- **Email du courriel 90 cours apres signup** : verifier que
  `ztsNotifySignup()` declenche bien le workflow Resend (handler
  non confirme dans cette session).
- **Apps satellites non-injectees** : `_archive`, `zone-pro` (pas
  d'index.html). A traiter si elles deviennent actives.
- **Mode admin** : pas de bypass pour Joey en navigation privee
  cote test — utiliser ztsLogout/login.
