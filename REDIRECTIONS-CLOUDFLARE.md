# Redirections à poser dans Cloudflare

**Fichier prêt à importer : `redirections-cloudflare.csv`** — 12 lignes,
colonnes `source,destination,statut`. Cloudflare → **Rules → Bulk Redirects**
→ créer une liste → importer le CSV → créer la règle qui utilise la liste.

Chaque destination a été vérifiée le 28 juillet 2026 : les trois cibles
(`/`, `/apps/agenda/`, `/apps/generateur/`) répondent **200 sans aucun saut**.

## Ce que contient le CSV

**Les 5 pages sportives retirées** — détail plus bas : `/apps-nhl/`,
`/apps-nba/`, `/apps-fifa/`, `/apps/nhl-playoffs/`, `/apps/nba-playoffs/` →
l'accueil, où vivent désormais les matchs du jour.

**Deux sauts en trop à corriger.** `agenda.` et `ia.` redirigent déjà, mais
vers une cible **sans barre oblique finale** : GitHub Pages émet alors un
second 301 pour l'ajouter. Deux sauts au lieu d'un, à chaque visite. Ces deux
lignes **remplacent** les règles existantes, elles ne s'y ajoutent pas.

| Aujourd'hui | Après |
|---|---|
| `agenda.` → `/apps/agenda` → `/apps/agenda/` | `agenda.` → `/apps/agenda/` |
| `ia.` → `/apps/generateur` → `/apps/generateur/` | `ia.` → `/apps/generateur/` |

**Cinq orphelins de la racine**, servis en 200, sans `noindex`, sans aucun lien
entrant, absents du sitemap — donc indexables et sans usage :
`index-old.html` (494 Ko, l'ancienne home, dont le canonique pointe déjà sur
`/`), `header.html` et `footer.html` (fragments morts, jamais inclus nulle
part — GitHub Pages n'a pas d'includes), `login.html`, `teasing.html`.

`promo.html` en est **volontairement absent** : elle figure au sitemap et porte
son propre canonique. C'est une page vivante, pas un orphelin.

## Deux réglages à cocher dans la règle

1. **Correspondance des sous-chemins** sur les cinq pages sportives : les
   anciennes polices et images (`/apps-nhl/fonts/…`) doivent suivre. Sans
   cela, seule la page racine redirige.
2. **Conserver la chaîne de requête** : non. Les paramètres des anciennes apps
   n'ont aucun sens sur l'accueil.

## Ce qui n'est PAS dans le CSV, et pourquoi

**Les huit sous-domaines périmés de l'audit du 3 juillet redirigent déjà** —
vérifié le 28 juillet : `educatifs`, `evaluation`, `grille`, `musique`, `tni`,
`sae`, `suppleance`, `agenda` répondent tous 301 vers `/apps/<nom>/`. Seuls
`agenda` et `ia` traînaient le défaut de barre oblique, corrigé ci-dessus.

**Les vieilles URLs Wix `/en/…`** répondent 404 aujourd'hui. Une ligne
`https://zonetotalsport.ca/en/` → `https://zonetotalsport.ca/`, avec
correspondance des sous-chemins, les rattraperait si les impressions GSC le
justifient encore. Non incluse faute de mesure.

---

## Détail : les cinq pages sportives

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
