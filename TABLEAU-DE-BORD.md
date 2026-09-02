# TABLEAU DE BORD — Zone Total Sport

> **LE fichier de pilotage unique.** Chaque PR le met à jour ; si un état change ailleurs
> sans passer ici, c'est ici qui a tort et il faut le corriger.
>
> Dernière mise à jour : **2026-09-02** · `main` @ `892d2b17`

**1 clos · 1 actif · 2 en attente**

---

## Ligne directrice v2

*Inscrite telle que dictée par Joey, 2026-09-02.*

> Zone Total Sport est une plateforme **100 % en ligne et à distance** qui remplace le
> papier des trois métiers (ÉPS, SDG, camps).
>
> **Séquence** : site impeccable → période gratuite à date de fin annoncée → abonnements
> individuels payants → licences établissements vendues par courriel/visio.
>
> **Aucun déplacement, aucun inventaire physique.**
>
> **Objectif** : 3 organismes signés en 12 mois, 100 k$ brut en année 2, 100 % entreprise
> en année 3.
>
> **Signal d'arrêt** : zéro organisme au 30 juin 2027 → on refait l'offre.

## Phases

| | Phase | Fenêtre | Cible | Statut |
|---|---|---|---|---|
| **P0** | **Cadre légal** — REQ/NEQ, TPS-TVQ, compte affaires, CGU-confidentialité-remboursement | — | — | 🔴 **À faire, rien d'entamé** |
| **P1** | **SITE IMPECCABLE** | sept. → 15 nov. 2026 | — | 🟢 **EN COURS** — V0 faite, V1 en prod, V2 pilier Jeux en cours |
| **P2** | **Période gratuite et audience** — date de fin annoncée dès le jour 1 | nov. 2026 → janv. 2027 | ~500 inscrits | ⚪ à venir |
| **P3** | **Bascule payante** — Stripe, tarif fondateur | févr. 2027 | 100 payants ou 8 % de conversion | ⚪ à venir |
| **P4** | **Licences établissements** | mars → juin 2027 | 3 organismes payants au 30 juin | ⚪ à venir |
| **P5** | **Année 2** | sept. 2027 → août 2028 | 100 k$ brut, 15 sites | ⚪ à venir |
| **P6** | **Sortie** | année 3 | si 70 k$+ brut deux ans de suite **ET** récurrent ≥ 40 k$/an | ⚪ à venir |

⚠ **P0 n'est pas entamé et ne dépend d'aucune autre phase.** Il conditionne P3 : pas de
Stripe sans cadre légal. C'est la seule phase qui peut avancer en parallèle de P1.

---

## 🟢 ACTIF

### Chantier SITE IMPECCABLE — vague 2, pilier Jeux

Le plus gros morceau du chantier : 14 mini-apps absorbées dans le catalogue de jeux.
Découpé en 3 PR que Joey teste et fusionne l'une après l'autre.

| Vague | État | Preuve |
|---|---|---|
| **V0 — Inventaire** | ✅ Fait, **⚠ jamais poussé** | `82ef43dc` sur la branche locale `inventaire/vague-0`. **`INVENTAIRE-SITE.md` n'est pas sur `main`** : il vit sur une branche locale, jamais poussée. Si ce Mac tombe, l'inventaire est perdu. |
| **V1 — Contrat, kills, bogues** | ✅ Fusionnée | PR **#72** (`a4e4c6d3`) → correctif Jekyll `c11b4409` → PR **#75** (`892d2b17`). |
| **V2 — Pilier Jeux** | 🟢 PR A **fusionnée** (`cf1ab3da`), PR B prête | Branche `vague-2/jeux-ui`. |

**V2, les trois PR :**

| PR | Contenu | État |
|---|---|---|
| **A — Données** | 113 items, 12 doublons, 101 inédits, catalogue 1439 → **1540**, 887 jeux étiquetés, 10 catégories de matériel | ✅ **Fusionnée** (PR #76) |
| **B — UI** | Filtres croisés (univers, durée, âge, matériel), rangée de 14 collections, partage + lien fiche par jeu. **2 bogues préexistants corrigés** : favoris et impression cassés sur les 1540, filtre « cycle » qui ne filtrait rien | 🟢 **Prête** — `RAPPORT-QA-JEUX.md`, 0 blocage |
| **C — Bascule** | Les 14 dossiers deviennent des relais, hubs et sitemap à jour | 🟡 **Bloquée** — attend la fusion de B |

**Dettes ouvertes par la PR B** : `unpkg.com/lucide@latest` non épinglé dans `apps/jeux` (préexistant) ; `.zc-intro-carte` à 13,5 px sous le seuil de 14 px de la grille.

---

## 🟡 EN ATTENTE — dépend d'un geste de Joey

| Chantier | Ce qui bloque |
|---|---|
| **P0 — cadre légal** | Rien d'entamé, et il conditionne la bascule payante (P3). Seule phase qui peut avancer en parallèle du site. |
| **Deux gestes de déploiement de la PR A** | `bash _scripts/publie-banques-r2.sh` (la prod lit R2, pas le dépôt) et `wrangler deploy` dans `cf-worker/jeux-data/`. Sans eux, la PR B ne verra ni les 101 nouveaux jeux, ni `collections`, ni `materielCat`. Peuvent attendre la PR B. |

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
| **Enrichissement IA des étiquettes** sur les 1540 jeux, validé par Joey — élargira les 6 collections thématiques sans règle. **Pas un préalable à la PR B.** | tâche de fond |
| Choix du **lecteur unique** — SPA `apps/jeux` vs `fiches/` vs les 1440 statiques | après la bascule payante |
| `moyens-action` absorbé par le **Planificateur** (Fusion #3) | après la bascule payante |

---

## Prochain geste

**Tester et fusionner la PR #76.** Elle bloque B, qui bloque C.

https://github.com/ZoneTotalSport/zts-zone-page/pull/76

## Prochaines actions Joey

1. **Tester et fusionner la PR B** — les trois gestes sont écrits en §8 de
   `RAPPORT-QA-JEUX.md` : Jeux calmes + SDG doit donner 46 jeux, Plan B météo doit ouvrir
   les filtres tout seul, et l'étoile d'un jeu doit marcher pour la première fois.
2. **Ouvrir P0 — le cadre légal.** Rien n'est entamé, et sans lui pas de Stripe en
   février 2027. C'est la seule phase qui avance en parallèle du site.
3. **Pousser `inventaire/vague-0`**, ou accepter que `INVENTAIRE-SITE.md` n'existe que sur
   ce Mac.
4. **Tester `/apps/transitions/` connecté** — minuteur au bout, relance : la musique doit
   repartir du début. C'est le seul point de la vague 1 jamais vérifié.
