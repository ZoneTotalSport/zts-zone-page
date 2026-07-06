# zts-colorier — déploiement

Worker pour l'app « Pages à colorier » (`/apps/colorier/`). Génère le line art
via **Cloudflare Workers AI** (modèle Flux) — **gratuit**, aucune clé externe.

## État (13 juin 2026) — DÉPLOYÉ ✅
- Worker live : `https://zts-colorier.zts-ccd.workers.dev`
- KV quota : namespace `COLORIER_QUOTA` (id `886d08dd8eba4488ae3136b09d8208e3`, binding `ANON_QUOTA`)
- Binding `AI` (Workers AI), modèle `@cf/black-forest-labs/flux-1-schnell`
- Quota : 15 images / IP / jour (`QUOTA_ANON_DAY`)
- `apps/colorier/app.js` → `API_BASE` pointe déjà sur l'URL ci-dessus.

## Redéployer après modif
```bash
cd "wix-deploy/cf-worker/colorier"
export PATH="$HOME/.local/node/bin:$PATH"
wrangler deploy
```

## Debug (renvoie le détail upstream dans la réponse d'erreur)
```bash
wrangler deploy --var ENVIRONMENT:debug      # active /debug/* + champ detail
wrangler deploy                              # remet en prod (debug off)
```
Route debug : `GET /debug/models` liste les modèles accessibles.

## Test
```bash
curl https://zts-colorier.zts-ccd.workers.dev/health
curl -X POST https://zts-colorier.zts-ccd.workers.dev/generate \
  -H "Content-Type: application/json" -H "Origin: https://zonetotalsport.ca" \
  -d '{"subject":"un ballon de basketball"}'
```

## Coût
Workers AI est inclus dans l'allocation quotidienne gratuite du compte Cloudflare
(Neurons/jour). Au-delà, facturation à l'usage très faible. Le quota KV borne l'abus.

## Note
Le secret `GEMINI_API_KEY` (posé lors d'un essai Gemini abandonné) n'est plus utilisé
— peut être supprimé : `wrangler secret delete GEMINI_API_KEY`.
