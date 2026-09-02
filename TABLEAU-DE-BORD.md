# TABLEAU DE BORD — Zone Total Sport

> **LE fichier de pilotage unique.** Chaque PR le met à jour ; si un état change ailleurs
> sans passer ici, c'est ici qui a tort et il faut le corriger.
>
> Dernière mise à jour : **2026-09-02** · `main` @ `892d2b17`

**1 clos · 1 actif · 2 en attente · 2 à préciser**

---

## ⚠ Deux sections que je ne peux pas remplir

La convention du tableau de bord interdit d'inventer un statut. Deux sections demandées
reposent sur de l'information qui **n'existe nulle part dans le dépôt** — elles viennent
du travail de stratégie mené ailleurs.

| Section | Ce qui manque |
|---|---|
| **Ligne directrice v2** | Aucune occurrence de « ligne directrice » dans les 40+ `.md` du dépôt. Je ne sais pas ce que v2 dit, ni en quoi elle diffère de v1. |
| **Phases 0-6 du démarrage** | Le dépôt ne connaît que des « Phase 1 » / « Phase 2 » éparses et sans rapport entre elles (Phase 1 = cohérence du site, livrée le 12 juin ; Phase 2 = Remotion ; Phase 3 = sélecteur biblio). **Aucun cadre en 7 phases numérotées 0 à 6.** |

**Statut incertain — à préciser par Joey.** Colle-moi les deux listes et je les inscris
telles quelles, sans les reformuler.

---

## 🟢 ACTIF

### Chantier SITE IMPECCABLE — vague 2, pilier Jeux

Le plus gros morceau du chantier : 14 mini-apps absorbées dans le catalogue de jeux.
Découpé en 3 PR que Joey teste et fusionne l'une après l'autre.

| Vague | État | Preuve |
|---|---|---|
| **V0 — Inventaire** | ✅ Fait, **⚠ jamais poussé** | `82ef43dc` sur la branche locale `inventaire/vague-0`. **`INVENTAIRE-SITE.md` n'est pas sur `main`** : il vit sur une branche locale, jamais poussée. Si ce Mac tombe, l'inventaire est perdu. |
| **V1 — Contrat, kills, bogues** | ✅ Fusionnée | PR **#72** (`a4e4c6d3`) → correctif Jekyll `c11b4409` → PR **#75** (`892d2b17`). |
| **V2 — Pilier Jeux** | 🟢 PR A prête, non poussée | Branche `vague-2/jeux-donnees`, 2 commits. |

**V2, les trois PR :**

| PR | Contenu | État |
|---|---|---|
| **A — Données** | 113 items extraits, 19 doublons, 94 inédits, catalogue 1439 → **1533**, 111 jeux étiquetés | 🟢 **Prête** — `aa9dac7a` (contrat + grille) et `27c1d457` (données) |
| **B — UI** | Recherche, filtres croisés, rangées de collections, partage par jeu | 🟡 **Bloquée** — attend la fusion de A |
| **C — Bascule** | Les 14 dossiers deviennent des relais, hubs et sitemap à jour | 🟡 **Bloquée** — attend la fusion de B |

---

## 🟡 EN ATTENTE — dépend d'un geste de Joey

| Chantier | Ce qui bloque |
|---|---|
| **Deux décisions du pilier Jeux** | **(1)** Les collections font 4 à 10 jeux sur 1533 — garder cette sélection courte, ou élargir par règle déterministe ? **(2)** Le filtre « matériel » demande un vocabulaire court et fermé (`aucun`, `ballons`, `cônes`…) que je ne dériverai pas sans arbitrage. |
| **Deux gestes de déploiement de la PR A** | `bash _scripts/publie-banques-r2.sh` (la prod lit R2, pas le dépôt) et `wrangler deploy` dans `cf-worker/jeux-data/`. Sans eux, la PR B ne verra ni les 94 jeux ni les nouveaux champs d'index. Peuvent attendre la PR B. |

---

## ✅ CLOS

| Chantier | Date | Restes |
|---|---|---|
| **SITE IMPECCABLE — vague 1** | 2026-09-02 | Aucun. Les 3 régressions rapportées venaient toutes du même bug (`_data/campagne` cassait le build Jekyll) et sont réglées. Vérifié en prod : `/apps/transitions/` 200, `/wix/donation.html` sans `wix-auth.js`, 404 marine habillée à toute profondeur. |

---

## Décisions signées

| Décision | Date | Où c'est écrit |
|---|---|---|
| **Catalogue cible : 18 piliers**, 25 apps absorbées, 3 tuées, 1 reportée | 2026-09-01 | `CATALOGUE-CIBLE.md` |
| **Les 3 améliorations du pilier Jeux** — collections ; recherche + filtres croisés ; partage vers la fiche statique | 2026-09-02 | `CATALOGUE-CIBLE.md` |
| **Règle de l'âge** : un âge non renseigné **passe toujours** le filtre | 2026-09-02 | `CATALOGUE-CIBLE.md` |
| **Aucune fusion de PR par Cowork, jamais** — la fusion est un geste de Joey après test | 2026-09-02 | `CATALOGUE-CIBLE.md`, règle gelée n°2 |
| **Dossiers `_*` privés** — aucun asset servi n'y vit | 2026-09-02 | `CLAUDE.md` + `_scripts/verifie-assets-jekyll.py` |
| **Aucune nouvelle app pendant la Phase 1** | 2026-09-01 | `CATALOGUE-CIBLE.md`, règle gelée n°1 |
| **La grille de sortie clôt chaque pilier** — 8 sections, identiques aux 18 | 2026-09-02 | `GRILLE-SORTIE-APP.md` |

## Dettes inscrites

| Dette | Quand |
|---|---|
| Combler `ageMin`/`ageMax` sur les **721 jeux** qui en manquent (718/1439 seulement sont renseignés) | tâche de fond, hors vague |
| Choix du **lecteur unique** — SPA `apps/jeux` vs `fiches/` vs les 1440 statiques | après la bascule payante |
| `moyens-action` absorbé par le **Planificateur** (Fusion #3) | après la bascule payante |

---

## Prochain geste

**Pousser et ouvrir la PR A.** Elle est prête, contrôles au vert, et elle bloque B puis C.

```
cd ~/dev/"Remotion 2"/wix-deploy
git push -u origin vague-2/jeux-donnees
gh pr create --base main --head vague-2/jeux-donnees \
  --title "Vague 2 PR A — les 14 mini-apps absorbées en collections" \
  --body-file PR-vague2-A.md
rm PR-vague2-A.md
```

## Prochaines actions Joey

1. **Pousser et fusionner la PR A** après lecture de `RAPPORT-COLLECTIONS-JEUX.md` — les
   19 doublons, un par un : est-ce que chacun désigne bien le même jeu ?
2. **Trancher les deux décisions du pilier Jeux** — largeur des collections, vocabulaire
   du filtre matériel. La PR B en dépend.
3. **Pousser `inventaire/vague-0`**, ou accepter que `INVENTAIRE-SITE.md` n'existe que sur
   ce Mac.
4. **Tester `/apps/transitions/` connecté** — minuteur au bout, relance : la musique doit
   repartir du début. C'est le seul point de la vague 1 jamais vérifié.
5. **Me donner la ligne directrice v2 et les phases 0-6** pour compléter ce tableau.
