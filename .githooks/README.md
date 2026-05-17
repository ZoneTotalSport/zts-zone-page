# Git hooks

Hooks partagés via le repo. Git ne les active pas automatiquement après
un clone — il faut pointer `core.hooksPath` vers ce dossier une fois.

## Activation (après clone)

```bash
git config core.hooksPath .githooks
```

C'est local au clone — chaque dev / chaque nouvelle machine doit
relancer cette commande.

## Hooks présents

### `pre-commit`

Scanne les fichiers staged (Added/Modified) pour des marqueurs de
secrets :

- Clés privées (`-----BEGIN PRIVATE KEY-----`, RSA, OpenSSH)
- Service accounts Google (`client_email` se terminant par
  `.iam.gserviceaccount.com`, ou `private_key` débutant par BEGIN)
- AWS Access Keys (`AKIA...`)
- Anthropic API keys (`sk-ant-...`)
- OpenAI API keys (`sk-...`)
- Google API keys (`AIza...`)

Si un match est trouvé, le commit est bloqué et le pattern est affiché.
Pour bypass un faux positif : `git commit --no-verify`.

Les fichiers binaires sont skippés (détection via `file --mime`).
