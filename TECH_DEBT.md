# Dette technique

## 2026-05-17 — Assets dupliqués dans apps/generateur-ia/

Pour servir ia.zonetotalsport.ca (CF Pages, racine =
apps/generateur-ia/), 6 fichiers ont été dupliqués depuis la racine
du repo :

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
sans être synchronisé dans apps/generateur-ia/.

**Mitigation temporaire** : checkpoint manuel à chaque modif de ces
fichiers.

## 2026-05-17 — favicon.png racine = 3.1 MB

`wix-deploy/favicon.png` pèse 3.1 MB. À optimiser dans un commit
dédié (cible <50 KB). Hors scope du fix subdomain ia. — l'apex
zonetotalsport.ca continue à servir l'original lourd.
