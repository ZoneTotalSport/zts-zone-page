# ZTS Notify Worker

`notify-worker.js` sert **trois** déclencheurs, tous déclarés dans
`cf-worker/wrangler.toml` depuis le 24 août 2026 :

| Déclencheur | Valeur |
|---|---|
| Domaine personnalisé | `notify.zonetotalsport.ca` |
| Route de zone | `zonetotalsport.ca/api/notify*` |
| Cron | `0 13 * * *` — rapport quotidien, handler `scheduled` |

---

## ⚠ Lis ceci avant tout `wrangler deploy`

**Le 24 août 2026, un déploiement a failli détruire ce worker.** Le dépôt
portait un instantané de juin — 90 lignes, un seul handler `fetch`, le jeton
Telegram en clair — alors que le worker déployé avait continué d'évoluer par le
tableau de bord : 287 lignes, un rapport quotidien, un accès Firestore, un
compteur de visites.

`wrangler deploy` **aligne** le remote sur les fichiers locaux, il ne fusionne
pas. Le déploiement aurait donc effacé la route de zone, le cron et tout le
code ajouté depuis juin. Joey l'a arrêté en voyant l'avertissement de
divergence.

**Le code de ce dossier a été rapatrié depuis la production. Il est de nouveau
fidèle.** La règle est celle de `firestore.rules` : toute modification faite au
tableau de bord se rapatrie **immédiatement** dans le dépôt.

---

## Les cinq secrets

Aucun n'est dans le dépôt, et aucun ne doit y revenir. Ils se posent une fois
et **survivent aux déploiements** — `wrangler deploy` ne les touche pas.

```bash
cd cf-worker
wrangler secret put TELEGRAM_BOT_TOKEN
wrangler secret put TELEGRAM_CHAT_ID
wrangler secret put NTFY_TOPIC
wrangler secret put FIREBASE_SERVICE_ACCOUNT
wrangler secret put TEST_KEY
```

Vérifier ce qui est en place :

```bash
cd cf-worker && wrangler secret list
```

Jusqu'au 24 août, le jeton Telegram était aussi écrit en clair dans
`telegram-notify.js`, servi en JavaScript de navigateur sur les pages du site.
Il a été révoqué auprès de `@BotFather`. `_scripts/verifie-secrets.sh` refuse
désormais un jeton Telegram recollé dans le dépôt.

---

## Déployer

```bash
export PATH="$HOME/.local/node/bin:$PATH"
cd cf-worker
wrangler deploy
```

La sortie doit annoncer **les trois déclencheurs**. S'il en manque un, arrête
et compare avec le tableau de bord avant d'insister.

## Tester

```bash
curl -X POST https://notify.zonetotalsport.ca/ \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Worker","message":"Si tu vois ca, ca marche!","priority":4,"tags":"rocket"}'
```

Réponse attendue : `{"ok":true}`, plus une notification ntfy **et** une
notification Telegram. **Si seule celle de ntfy arrive, un secret Telegram
manque.**

Le rapport quotidien se déclenche à la main, sans attendre 13 h UTC :

```bash
curl "https://notify.zonetotalsport.ca/test?key=<TEST_KEY>"
```

---

## ⚠ La source d'origine est perdue

Le fichier de ce dossier est la **sortie d'esbuild** — les aides `__defProp` /
`__name` en tête le montrent. La vraie source vivait dans
`cf-worker/notif-stats/`, signalé comme non commité dans `CLAUDE.md` : **ce
dossier n'existe plus sur ce Mac.**

Le code rapatrié est fidèle à ce qui tourne et se redéploie sans problème.
Mais si la source d'origine réapparaît, c'est elle qu'il faut committer à la
place — et cette fois la committer pour de bon.
