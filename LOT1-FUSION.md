# LOT 1 — checklist de fusion

**Branche `lot1/vague-a-cadenas`, worktree `~/dev/zts-lot1`.**
À jouer dans l'ordre. Chaque étape dit ce qu'on vérifie et ce qu'on fait si ça
casse.

## Ce que la fusion met en production

| Vague | Effet visible |
|---|---|
| A | Pastilles « 🔒 Compte gratuit » dans le chrome, `code-oreille` et `planificateur` gatés |
| B | 1440 fiches de jeux tronquées, 3 fiches vitrine entières |
| C | Listes ouvertes, fiches murées dans les deux SPA, 3 vitrines par banque |
| D | 112 Mo de banques sortis de l'arbre publié, tout passe par le Worker |
| E | `teasing.html` et `index-old.html` deviennent des pages-relais |
| F | `colorier` charge le verrou, carte de partage, mascotte renommée |

**Le point de bascule réel, c'est `locked-whitelist.json`.** Le Worker le lit
sur la **production**. Tant que la fusion n'a pas eu lieu, `freeItems` n'existe
pas côté prod : les vitrines rendent zéro et les banques publiques sont servies
sans aucun item complet. À la seconde où `main` est publié, les six vitrines
s'allument d'elles-mêmes.

---

## 0. Avant de commencer

- [ ] **`git fetch` + rebase sur `origin/main`.** Une session parallèle écrit
      dans le même dépôt (`feat/fiches-atelier`). Le rebase doit être refait
      **juste avant** la fusion, pas la veille.
- [ ] Le contrôle passe : `python3 _scripts/verifie-habillage.py` → **0 bloquant**.
- [ ] La CI est verte sur la branche.

## 1. Le secret Cloudflare doit être en place

- [ ] `CLOUDFLARE_API_TOKEN` présent dans les secrets Actions du dépôt.

Sans lui, l'étape CI qui publie les banques vers R2 échoue — bruyamment, c'est
voulu. **Vérifier avant**, parce que l'échec arrive après la fusion.

## 2. Fusionner

- [ ] Fusion de `lot1/vague-a-cadenas` dans `main`, puis `push`.
- [ ] Attendre la fin du workflow de publication R2.
- [ ] Attendre la reconstruction GitHub Pages (compter quelques minutes).

## 3. ⚠ REDÉPLOYER LE WORKER — À LA MAIN

```bash
cd ~/dev/zts-lot1/cf-worker/jeux-data && wrangler deploy
```

**Ce n'est pas en CI.** Le Worker en ligne date de la vague D : il ne connaît
pas `enrichirVitrines()`, la fonction qui va chercher le détail des SAÉ
vitrine. Sans ce déploiement, les trois SAÉ vitrine s'ouvriront **vides** —
une fiche ouverte et creuse, le pire des deux mondes : le visiteur croit que
l'outil est cassé plutôt que verrouillé.

Vérifier tout de suite après :

```bash
curl -s https://zts-jeux-data.zts-ccd.workers.dev/sae/public.json \
  | python3 -c "import sys,json; d=json.load(sys.stdin); \
      v=[x for c in d.values() for x in (c if isinstance(c,list) else next((z for z in c.values() if isinstance(z,list)),[])) if x.get('_vitrine')]; \
      print(len(v),'vitrines'); [print(' ',i['titre'][:44],'cours=',len(i.get('cours') or [])) for i in v]"
```

Attendu : **3 vitrines, chacune avec ses 3 ou 4 cours**. Si le compte est bon
mais que `cours=0`, c'est que le Worker n'a pas été redéployé.

## 4. Tests de bout en bout — ANONYME

En navigation privée, sans compte.

- [ ] **Les six anciennes URL ne servent plus de données**

```bash
for u in apps/jeux/data/jeux-merged.json apps/sae/data/sae-all-light.json \
         apps/moyens-action/data.json apps/sae/data/sae-detail/prescolaire.json \
         apps/planification/data/camp.json apps/moyens-action/daily.json; do
  printf "%-52s %s\n" "$u" "$(curl -s -o /dev/null -w '%{http_code}' "https://zonetotalsport.ca/$u")"
done
```

Attendu : **404 partout**. Un 200 signifie qu'un fichier est resté dans l'arbre
publié.

- [ ] **`raw.githubusercontent` : résidu assumé, à constater, pas à corriger.**
      Le dépôt est public, l'historique conserve les banques. On ferme l'accès
      commode, pas celui d'un archiviste. Voir `LOT1-VAGUE-D.md`.

- [ ] **Le Worker refuse le contenu complet**

```bash
W=https://zts-jeux-data.zts-ccd.workers.dev
for p in /jeux/full.json /sae/full.json /moyens-action/full.json \
         /sae/detail/prescolaire.json /planification/camp.json; do
  printf "%-34s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$W$p")"
done
```

Attendu : **401 partout**.

- [ ] **Les quatre apps de banque fonctionnent sans compte**

| App | Attendu |
|---|---|
| `/apps/jeux/` | 1439 cartes navigables et filtrables ; clic sur un jeu ordinaire → **mur**, fermable ; les 3 vitrines s'ouvrent **entières** |
| `/apps/sae/` | 1880 SAÉ navigables ; clic ordinaire → **mur** ; les 3 SAÉ vitrine s'ouvrent **avec leurs cours** |
| `/apps/moyens-action/` | murée (pas de charge publique, c'est voulu) |
| `/apps/planification/` | murée |

- [ ] **Le jeu aléatoire** sur un jeu verrouillé affiche la phrase explicite,
      pas une ligne vide.
- [ ] **« Ajouter à mon cours »** sur une SAÉ verrouillée ouvre le mur.
- [ ] **Une fiche statique** `/jeux/<slug>.html` : tronquée, sauf les trois
      vitrines (`1-2-3-soleil`, `ballon-chasseur-classique`,
      `le-jardin-cooperatif`).
- [ ] **`/apps/colorier/`** s'ouvre **sans mur** — c'est une vitrine — et le
      cadenas du chrome partagé est visible.
- [ ] **Les 4 outils vitrine** (`suppleance`, `musique`, `colorier`) + les
      3 articles libres s'ouvrent sans compte.

## 5. Tests de bout en bout — CONNECTÉ

Avec un compte gratuit réel.

- [ ] `/apps/jeux/` : **toutes** les fiches s'ouvrent, pas seulement trois.
- [ ] `/apps/sae/` : une SAÉ quelconque s'ouvre **avec ses cours** — c'est le
      chemin `/sae/detail/…` avec jeton, celui que l'anonyme reçoit en 401.
- [ ] `/apps/planificateur/` : la bibliothèque se remplit (1439 jeux).
- [ ] **Le cas du jeton expiré** : laisser le planificateur ouvert plus d'une
      heure, puis naviguer. Attendu : la banque se recharge après un
      rafraîchissement silencieux du jeton — **jamais une banque vide sans
      message**. C'est le mode de panne que `zts-banques.js` existe pour éviter.
- [ ] **304 sur re-visite** : recharger une app ; le Worker doit répondre
      **304, 0 octet** sur la charge inchangée.

## 6. Après la fusion — ce qui reste ouvert

- **`ia.` fait encore 2 sauts** (cible sans barre finale). Défaut connu, sans
  gravité, corrigeable au tableau de bord.
- **Doublon `twitter:card` sur `colorier`** : la ligne `summary` d'origine
  subsiste sous la nouvelle. Facebook et LinkedIn rendront la grande carte ;
  pour X, il faudrait supprimer la ligne d'origine, donc une exception nommée
  dans le contrôle d'habillage. Décision de Joey.
- **7 collisions de slugs dans la banque SAÉ** — deux SAÉ homonymes
  deviendraient vitrines ensemble. Aucune ne touche les vitrines actuelles.
- **`sports-news.html`** (lignes 458 et 638) et les ~1400 fiches pointent
  encore vers `jeux.zonetotalsport.ca` : un saut de plus, rien de cassé. À
  traiter au balayage des fiches, avec
  `scripts/gen-jeux-fiches.js:176` **avant** la prochaine régénération.
- **`teasing.html` et `index-old.html`** restent des relais jusqu'au chantier
  proxy orange, où les 7 items de chemins s'activeront et où les fichiers
  pourront disparaître.
- **`sitemap.xml`** déclare encore `generateur.`, `gym.` et `jeux.` en `<loc>`
  alors qu'ils redirigent : avertissement GSC, à traiter d'un coup avec les
  huit autres sous-domaines.

## 7. Si ça tourne mal

Le retour arrière est un `git revert` de la fusion **plus** un `wrangler deploy`
de la version précédente du Worker. Les deux, sinon le site sans les banques
locales appelle un Worker qui, lui, a changé de contrat.

Les données, elles, ne risquent rien : R2 et le dépôt gardent les banques, et
aucune suppression n'a eu lieu — les 47 Mo sans consommateur sont dans
`_data/sources/`, pas à la poubelle.
