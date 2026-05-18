# Fusion #1 — Générateur IA unifié ✅

**Date validation** : 18 mai 2026
**Statut** : SHIPPÉ EN PROD

## URLs live
- **Front** : https://zonetotalsport.ca/apps/generateur/
- **Worker API** : https://api.zonetotalsport.ca/ (health `/health`, génération `/generate`)

## Worker Cloudflare
- **Name** : `zts-generateur` (prod) / `zts-generateur-dev` (staging)
- **Custom domain** : `api.zonetotalsport.ca` (configuré dans `wrangler.toml`)
- **Dernier deploy prod** : 2026-05-17 10:57 UTC (version `0.4.0`)
- **KV prod** : `ANON_QUOTA` id `3f1ca3dec85e4472930beea526ff9273`
- **Secrets** : `ANTHROPIC_API_KEY`, `FIREBASE_SERVICE_ACCOUNT` provisionnés
- **Endpoints** : `/health`, `/generate`, `/generations`, `/migrate-anon-generation`, `/generation/:id(/favori)`, `/debug/*` (gated env=dev)

## Commits clés (du plus ancien au plus récent)
- `a5e9b48` chore: cleanup gitignore + scoreboard WIP
- `9cd4703` chore(generateur): archive legacy SAE generator
- `bdbd3aa` refactor(generateur): migrate apps/generateur-ia → apps/generateur
- `aa31b79` feat(routing): add _redirects for /generateur clean URL (retiré en `769c610`)
- `9b325c7` feat(auth): create /bienvenue.html lead magnet page
- `441017b` feat(auth): redirect new signups to /bienvenue.html
- `2f9b0b3` feat(auth): add /login.html magic redirect page
- `d9d31b0` Merge feat/auth-gating
- `769c610` fix(routing): use /apps/generateur/ direct path
- `2dc4263` fix(auth): align bienvenue.html CTA with /apps/generateur/

## Tests de validation (18 mai)
- `GET /health` → `200 {"ok":true,"service":"zts-generateur","version":"0.4.0","env":"prod"}`
- `POST /generate` (input invalide) → `400 INVALID_INPUT` ✓
- `POST /generate` (input valide, IP anonyme épuisée) → `429 QUOTA_EXCEEDED` ✓
- Front HTML servi : `API_URL = 'https://api.zonetotalsport.ca/generate'` ✓
- CTA accueil (`index.html`, `wix/page-wow.html`) + lead magnet (`bienvenue.html`) pointent vers `/apps/generateur/`

## Dette technique reportée
1. **CORS whitelist `ia.zonetotalsport.ca`** — sous-domaine deprecated post-Fusion #1, à retirer du worker (`src/generateur-worker.js:23-24`) lors du prochain deploy
2. **Migration GitHub Pages → Cloudflare Pages** — pour activer `_redirects` natif et obtenir des clean URLs (ex. `/generateur` au lieu de `/apps/generateur/`)
3. **Spend limit Anthropic 7 USD/mois** — à monitorer dans le dashboard Anthropic
4. **`apps/_archive/generateur-legacy-2026-05/`** — purger après quelques mois si aucune régression remontée

## Prochaine étape
**Fusion #2 — Bibliothèque unifiée** (voir `zts-refonte-sequencage.md`).
Une seule `/bibliotheque` avec filtres (type, univers, niveau) regroupant jeux + SAÉ + éducatifs.
