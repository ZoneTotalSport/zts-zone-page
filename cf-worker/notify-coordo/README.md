# Worker `zts-notify-coordo`

Envoie un courriel au **coordonnateur** d'une organisation quand un **animateur valide
un plan de semaine** dans le moteur Planificateur.

## Sécurité
- L'appelant doit présenter un **Firebase ID token** valide (`Authorization: Bearer`).
- Le **destinataire n'est pas fourni par le client** : le worker lit `organisations/{orgId}`
  via l'API REST Firestore **avec le token de l'appelant**. Les règles Firestore
  (`organisations.read : if request.auth != null`) garantissent que seul un utilisateur
  authentifié peut résoudre `coordoEmail` → pas de vecteur de spam vers une adresse arbitraire.

## Contrat
`POST /` (JSON) :
```json
{ "orgId": "abc123", "weekStart": "2026-06-22", "groupeNom": "Chico", "link": "https://…" }
```
Réponses : `200 {ok:true, sent:"coordo@…"}` · `401` non authentifié · `403` accès org refusé
· `422 NO_COORDO_EMAIL` (org sans courriel coordo) · `502` échec Resend.

## Déploiement
```bash
cd cf-worker/notify-coordo
npm install
export PATH="$HOME/.local/node/bin:$PATH"   # wrangler
wrangler secret put RESEND_API_KEY          # clé Resend (même compte que zts-send-pdf)
wrangler deploy
```

### Domaine
`wrangler.toml` cible `coordo.zonetotalsport.ca` (custom_domain). Deux options :
1. Créer ce sous-domaine dans Cloudflare → garder `NOTIFY_COORDO_URL` tel quel dans
   `apps/planificateur/app.js`.
2. Déployer sans la route `[[routes]]` et utiliser l'URL `*.workers.dev` directe →
   mettre `NOTIFY_COORDO_URL` à cette URL dans `app.js`.

## Pré-requis côté données
- Les **nouvelles** organisations stockent `coordoEmail` automatiquement (le moteur
  l'écrit à la création = courriel du créateur/coordo).
- Les **anciennes** orgs n'ont pas `coordoEmail` → la validation renvoie `NO_COORDO_EMAIL`.
  Recréer l'org (ou ajouter le champ à la main dans Firestore).

## `noreply@zonetotalsport.ca`
Le domaine d'envoi doit être vérifié sur Resend (déjà fait pour `zts-send-pdf`).
