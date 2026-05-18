# Dette technique

## 2026-05-18 — Routing /generateur

CTAs et JSON-LD pointent vers `/apps/generateur/` (path direct) au
lieu de `/generateur` (URL propre). Raison : GitHub Pages ne supporte
pas le format `_redirects` (Netlify/Cloudflare Pages exclusif).

**À faire** : migrer le site vers Cloudflare Pages pour activer les
clean URLs. Le `_redirects` initialement créé (commit aa31b79) a été
retiré, garder cette dette en tête pour la migration future.

## 2026-05-17 — Assets dupliqués dans apps/generateur/

Pour servir ia.zonetotalsport.ca (CF Pages, racine =
apps/generateur/, renommé depuis apps/generateur-ia/ le 2026-05-18 ;
ancien legacy archivé sous apps/_archive/generateur-legacy-2026-05/),
6 fichiers ont été dupliqués depuis la racine du repo :

- `bucheron-generateur.png` (226 KB)
- `bucheron-hero.png` (233 KB)
- `bucheron-basketball.png` (258 KB)
- `firebase-auth.js` (31 KB)
- `zts-ultra.css` (12 KB)
- `favicon.png` (optimisé à 5.8 KB, original racine reste 3.1 MB)

**À migrer un jour** vers une structure `apps/_shared/` avec un script
de copy au build (CF Pages preset = build hook) ou via la stratégie
de monorepo restructuration (option C du diagnostic 2026-05-17).

**Risque actuel** : drift si un de ces fichiers évolue à la racine
sans être synchronisé dans apps/generateur/.

**Mitigation temporaire** : checkpoint manuel à chaque modif de ces
fichiers.

## 2026-05-17 — favicon.png racine = 3.1 MB

`wix-deploy/favicon.png` pèse 3.1 MB. À optimiser dans un commit
dédié (cible <50 KB). Hors scope du fix subdomain ia. — l'apex
zonetotalsport.ca continue à servir l'original lourd.
