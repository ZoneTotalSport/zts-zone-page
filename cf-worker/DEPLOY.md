# Deploy ZTS Notify Worker (5 min, dashboard CF)

## Étapes

1. https://dash.cloudflare.com → ton compte → **Workers & Pages**
2. **Create** → **Create Worker** → Name: `zts-notify` → **Deploy** (worker hello-world par defaut)
3. **Edit code** → efface tout → colle le contenu de `notify-worker.js` → **Deploy**
4. Onglet **Settings** → **Triggers** → **Add Custom Domain** PAS ICI. Plutot:
5. Va dans ton domaine **zonetotalsport.ca** → **Workers Routes** → **Add route**
   - Route: `zonetotalsport.ca/api/notify*`
   - Worker: `zts-notify`
   - Save

## Test

```bash
curl -X POST https://zonetotalsport.ca/api/notify \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Worker","message":"Si tu vois ca, ca marche!","priority":4,"tags":"rocket"}'
```

Tu devrais recevoir notif ntfy + Telegram.

## Modifier plus tard

Dashboard CF → Workers & Pages → `zts-notify` → Edit code → Deploy.
