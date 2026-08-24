# Deploy ZTS Notify Worker

`notify-worker.js` sert `notify.zonetotalsport.ca` (voir `cf-worker/wrangler.toml`).
Il relaie les notifications du site vers **ntfy** et vers **Telegram**.

---

## ⚠ Les deux secrets, à poser AVANT le premier déploiement

Depuis le 24 août 2026, le jeton du bot Telegram **n'est plus dans le code**. Il
vit dans un secret Cloudflare, même patron qu'`ANTHROPIC_API_KEY` pour
`zts-generateur` :

```bash
cd cf-worker
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
```

Les deux se saisissent **au clavier, dans l'invite de wrangler**. Ils ne
s'écrivent ni dans `wrangler.toml`, ni dans un `.env`, ni dans un message de
commit — `_scripts/verifie-secrets.sh` refuse désormais un jeton Telegram
recollé dans le dépôt, et c'est voulu.

**Sans ces deux secrets, le worker fonctionne quand même** : il envoie la
notification ntfy, saute Telegram, et écrit une ligne d'avertissement en
journal. Il ne tombe pas, et il ne part pas non plus vers `/botundefined/`.

### Pourquoi

Jusqu'au 24 août, le jeton était écrit en clair **ici et dans
`telegram-notify.js`** — un fichier servi en JavaScript de navigateur sur les
pages du site. N'importe quel visiteur pouvait le lire dans la source, et il
s'affichait dans la console dès que l'appel échouait. Le jeton compromis a été
révoqué auprès de `@BotFather`.

---

## Déploiement

```bash
export PATH="$HOME/.local/node/bin:$PATH"
cd cf-worker
wrangler deploy
```

## Test

```bash
curl -X POST https://notify.zonetotalsport.ca/ \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Worker","message":"Si tu vois ca, ca marche!","priority":4,"tags":"rocket"}'
```

Réponse attendue : `{"ok":true}`, plus une notification ntfy **et** une
notification Telegram. **Si seule celle de ntfy arrive, les secrets ne sont pas
posés** — c'est le symptôme à reconnaître.

## Vérifier les secrets en place

```bash
cd cf-worker && wrangler secret list
```
