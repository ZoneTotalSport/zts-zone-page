# Redirections à poser dans Cloudflare — pages sportives retirées

**Créé le 27 juillet 2026.** À faire par Joey dans le tableau de bord Cloudflare,
zone `zonetotalsport.ca` → **Rules → Redirect Rules**.

## Pourquoi

Cinq pages ont été retirées du site le 27 juillet 2026 :

| URL retirée | Ce qui la remplace |
|---|---|
| `/apps-nhl/` | section « Matchs du jour », bas de l'accueil |
| `/apps-nba/` | idem |
| `/apps-fifa/` | idem |
| `/apps/nhl-playoffs/` | idem |
| `/apps/nba-playoffs/` | idem |

Le dépôt est servi par **GitHub Pages**, qui ne sait pas répondre `301`. Chaque
URL garde donc une page-relais : `<meta http-equiv="refresh" content="0">` plus
un `<link rel="canonical">` vers l'accueil. Google traite ce couple comme une
redirection permanente, mais c'est un pis-aller : le navigateur charge une page
avant de repartir, et la redirection n'existe pas pour les robots qui ignorent
le HTML.

## La règle à créer

Une seule règle suffit pour les cinq.

- **Nom** : `301 pages sportives retirées`
- **Si** — expression personnalisée :

```
(http.request.uri.path in {"/apps-nhl/" "/apps-nba/" "/apps-fifa/" "/apps/nhl-playoffs/" "/apps/nba-playoffs/"})
or (starts_with(http.request.uri.path, "/apps-nhl/"))
or (starts_with(http.request.uri.path, "/apps-nba/"))
or (starts_with(http.request.uri.path, "/apps-fifa/"))
or (starts_with(http.request.uri.path, "/apps/nhl-playoffs/"))
or (starts_with(http.request.uri.path, "/apps/nba-playoffs/"))
```

- **Alors** : URL de destination statique `https://zonetotalsport.ca/`
- **Code** : `301` — permanent
- **Conserver la chaîne de requête** : non

Les `starts_with` couvrent les anciennes ressources (polices, images) que des
pages tierces pourraient encore appeler.

## Une fois la règle en ligne

1. Vérifier : `curl -sI https://zonetotalsport.ca/apps-nhl/ | head -3` doit
   renvoyer `HTTP/2 301` et un `location: https://zonetotalsport.ca/`.
2. Les cinq `index.html` de relais peuvent alors être supprimés du dépôt — la
   règle Cloudflare s'applique avant que la requête n'atteigne GitHub Pages.
   Tant que la règle n'est pas posée, **les garder** : sans elles, ce sont cinq
   404, ce que la règle d'or n°3 interdit.
3. Search Console : les deux URLs `/apps/nhl-playoffs/` et `/apps/nba-playoffs/`
   ont quitté le sitemap (87 → 85 URLs). `/apps-nhl/` et `/apps-nba/` n'y ont
   jamais figuré, mais elles étaient indexées (`index, follow`) — leur
   désindexation prendra quelques semaines.
