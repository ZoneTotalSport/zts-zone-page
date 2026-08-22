# Zone — Décodage du corps

App privée (`/apps/decodage/`), derrière `admin-gate.js`. Page en
`noindex, nofollow`, liée nulle part dans le chrome partagé.

Détail de la mise en ligne d'origine : `APP-DECODAGE-COMPLETE.md` à la racine
du dépôt. Détail du module perte de poids : `DECODAGE-MODULE-POIDS.md`.

## Comment on la construit

Jusqu'au 22 août 2026, seul le bundle compilé `app.js` était dans le dépôt : la
source vivait dans l'iCloud de Joey, et toute retouche exigeait de retrouver ce
fichier. La source est maintenant dans `src/`.

```bash
cd apps/decodage/src
npm ci
./construire.sh          # écrit ../app.js
```

Node depuis `~/.local/node/bin` (voir CLAUDE.md). `construire.sh` fixe les
options : `--bundle --minify --format=iife --jsx=automatic --charset=utf8`.
`--charset=utf8` n'est pas décorative — sans elle les accents et les émojis
partent en `\uXXXX` et le bundle grossit de 3 ko pour un rendu identique.

**Le bundle est commité.** GitHub Pages sert des fichiers statiques : rien ne
compile à la livraison. Un changement dans `src/` qui n'est pas suivi d'un
`./construire.sh` ne change **rien** en production.

Le `?v=` de `<script src="app.js?v=N">` dans `index.html` est à incrémenter à
chaque bundle, sinon les navigateurs qui ont déjà l'ancien le gardent.

### Fidélité de la reconstruction

La source de `src/` a été vérifiée contre le bundle en production : recompilée,
elle produit un fichier identique caractère pour caractère, **à une exception
près** — esbuild écrit aujourd'hui `__toESM(x, 1)` là où la version de l'époque
écrivait `__toESM(x)`. C'est un artefact de version d'esbuild sur du code
d'interop CommonJS, sans effet fonctionnel. Autrement dit : `src/` est bien la
source du fichier en ligne, pas une réécriture approchante.

## Fichiers

| Fichier | Rôle |
|---|---|
| `src/index.jsx` | Point d'entrée : shim `window.storage` → `localStorage` (préfixe `ztsdeco:`) puis montage React. |
| `src/app.jsx` | Coquille, navigation, Chat (décodage IA), Historique, Dictionnaire, Approches. |
| `src/ui.jsx` | Jetons visuels partagés : palette `C`, `STYLES`, `Carte`, `BoutonCyan`, `champStyle`, `URL_API`. |
| `src/perte-de-poids.jsx` | Le 8e onglet — module « perte de poids : le déclic émotionnel ». |
| `app.js` | Bundle compilé, **servi en production**. Ne jamais l'éditer à la main. |
| `admin-gate.js` | Porte Firebase Auth, copie de celle de Studio Jeu. |

## L'appel à l'IA

Le front n'appelle jamais `api.anthropic.com` : il passe par
`POST https://api.zonetotalsport.ca/decodage` (worker
`cf-worker/generateur/src/generateur-worker.js`). Le worker **jette** le
`system` envoyé par le client et sert le sien. Le front ne choisit qu'une clé :

| `body.mode` | Prompt servi |
|---|---|
| absent, ou valeur inconnue | `SYSTEM_DECODAGE` |
| `"poids"` | `SYSTEM_POIDS` |

**Conséquence à ne pas oublier : changer un prompt système se fait dans le
worker, pas ici.** Une modification de prompt exige un `wrangler deploy`, pas
seulement un rebuild du bundle.

Banc du worker : `cd cf-worker/generateur && node test-decodage-poids.mjs`.

## Le module « perte de poids » — les garde-fous

Ce module touche au poids et au comportement alimentaire. Ses règles ne sont
pas des préférences de ton : **ce sont des contraintes de sécurité.** Elles
tiennent à deux endroits, et il faut les deux.

1. **Zéro chiffre de corps** — aucun champ de poids, d'IMC, de poids cible, de
   calories, de mesures, aucune pesée, aucune courbe. Le seul nombre du module
   est le curseur de résonance 0-10, qui mesure un ressenti.
2. **Zéro plan alimentaire** — pas de diète, de jeûne, de restriction, d'aliment
   à éviter, d'exercice prescrit. Ni dans l'interface, ni dans la réponse de
   l'IA. Une demande explicite est renvoyée vers une nutritionniste ou un
   médecin.
3. **Aucun jugement corporel dans les textes** — on parle de vécu, de
   protection, de besoin. Jamais « kilos en trop », « mauvaises habitudes »,
   « il faut ».
4. **Filet troubles alimentaires** — `SYSTEM_POIDS` impose à l'IA d'arrêter le
   décodage et d'orienter (ANEB 1 800 630-0907, Info-Social 811) dès que les
   réponses évoquent restriction sévère, compensation, crises avec perte de
   contrôle ou détresse. Côté interface, l'encart de ressources est sur
   l'accueil du module, et la réponse `{"alerte": …}` remplace toute la
   lecture par ce message plus les ressources.
5. **Avertissement à l'entrée du module** — carte sur l'accueil du module :
   réflexion personnelle, aucune valeur diagnostique, ne remplace pas un suivi
   médical, et un surpoids peut avoir des causes médicales qui relèvent d'un
   médecin.

   L'avertissement est **à l'entrée, une fois**. Il n'est répété ni en haut des
   écrans internes, ni en bas — décision Joey du 22 août 2026, sur une app
   privée à un seul utilisateur qui sait déjà ce qu'il fait. Ne pas le
   réinstaller « par prudence » : c'est du bruit, et ç'a déjà été retiré une
   fois.

Le point 4 vit **dans le worker**. Une retouche du bundle seule ne le change
pas ; une retouche du worker seule non plus. Toucher à l'un des deux sans
l'autre laisse un garde-fou à moitié en place.

## Stockage

Tout passe par `window.storage`, un seul mécanisme, servi par `localStorage`
sous le préfixe `ztsdeco:`.

| Clé | Contenu |
|---|---|
| `decodage:<horodatage>` | Une session d'historique. Écrite par le Chat **et** par la lecture IA du module poids (`mode:"poids"`), pour qu'elles apparaissent au même endroit. |
| `poids:questionnaire` | Brouillon des 12 axes : réponses, résonances, dernier axe ouvert. |
| `poids:parcours` | Journal du fil des 21 jours. |

Les clés `poids:` sont volontairement hors du préfixe `decodage:` : l'écran
Historique liste `decodage:` et n'a pas à voir passer les brouillons.
