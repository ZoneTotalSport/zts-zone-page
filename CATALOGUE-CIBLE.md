# CATALOGUE-CIBLE — le contrat du chantier SITE IMPECCABLE

> **Statut : décisions prises par Joey. Ce document ne se rediscute pas.**
> Il se lit avant toute intervention sur `apps/`, et il arbitre en cas de doute.
>
> Base factuelle : `INVENTAIRE-SITE.md` (vague 0, branche `inventaire/vague-0`).
> Rédigé en vague 1, le 2026-09-01. Les fusions décrites ici s'exécutent en **vague 2**,
> pas avant.

---

## Règle gelée

> **Aucune nouvelle app pendant la Phase 1.**

Toute idée d'outil nouveau se range dans un carnet et attend la fin de la Phase 1. La
réponse par défaut à un besoin non couvert est : *fonctionnalité d'un pilier existant*.
Aucune exception, aucune « petite app vite faite ».

---

## L'arithmétique du chantier

| | Aujourd'hui | Après vague 2 |
|---|---|---|
| Dossiers dans `apps/` | **49** | **19** |
| Piliers du catalogue | — | **18** |
| Apps absorbées par un pilier | — | **25** |
| Apps tuées en vague 1 | — | **3** (bricolages, planification, decodage) |
| Apps déjà mortes (relais en place) | 2 | 2 (nba-playoffs, nhl-playoffs) |
| En attente hors catalogue | — | **1** (moyens-action, cf. « Reporté ») |

49 = 18 piliers + 25 absorbées + 3 tuées + 2 déjà mortes + 1 reportée. Le compte tombe juste.

---

## 1. Le catalogue cible — 18 piliers

Ordre du tableau = **rang de passage en vague 2**.

**Colonne « Mur »** : `libre` = slug dans `locked-whitelist.json` → `freeResources` ;
`lock` = `zts-lock-page.js` + `zts-locked-fullscreen.js` ; `gate` = `zts-gate.js` ;
`cadenas` = `zts-cadenas.js`.

**Colonne « 3 améliorations max »** : volontairement **vide**. Joey la remplit. Trois lignes
maximum par pilier, et ce qui n'y est pas écrit ne se fait pas.

---

### Rang 1 — Jeux

| | |
|---|---|
| **Adresse** | `apps/jeux/` |
| **Absorbe** | `jeux-par-theme`, `jeux-rapides`, `jeux-calmes`, `activites-duree`, `echauffements`, `enigmes`, `plan-b-meteo`, `plan-b-pluie`, `brise-glace`, `grands-jeux`, `jeux-eau`, `rallyes`, `veillee-feu-de-camp`, `olympiades-scolaires` — **14 apps, en collections** |
| **Mur** | `libre` (whitelist) — la liste reste ouverte, les **fiches** restent murées |
| **Forme des collections** | titre + paragraphe d'intro + filtre sur `jeux-merged.json`. Les items en dur des 14 apps sont dédoublonnés (cf. `DOUBLONS-EXTRACTION.md`, 12 doublons déjà identifiés) puis intégrés au catalogue avec étiquette. |
| **3 améliorations max** | |

---

### Rang 2 — Planificateur

| | |
|---|---|
| **Adresse** | `apps/planificateur/` |
| **Absorbe** | `agenda`, `journee-pedago` |
| **Mur** | `lock` |
| **Note** | `moyens-action` est **reporté** ici après la bascule payante (Fusion #3). Ne pas l'absorber en vague 2. |
| **3 améliorations max** | |

---

### Rang 3 — Générateur IA

| | |
|---|---|
| **Adresse** | `apps/generateur/` |
| **Absorbe** | rien — **spécialisé, inchangé** |
| **Mur** | `lock` |
| **3 améliorations max** | |

---

### Rang 4 — SAÉ

| | |
|---|---|
| **Adresse** | `apps/sae/` |
| **Absorbe** | rien — **spécialisé, inchangé** |
| **Mur** | `libre` (whitelist) — liste ouverte, fiches murées |
| **3 améliorations max** | |

---

### Rang 5 — Éducatifs

| | |
|---|---|
| **Adresse** | `apps/educatifs/` |
| **Absorbe** | rien — **spécialisé, inchangé** |
| **Mur** | `lock` |
| **3 améliorations max** | |

---

### Rang 6 — Intervention Groupe

| | |
|---|---|
| **Adresse** | `apps/intervention-groupe/` ← **c'est cette adresse qui survit** |
| **Absorbe** | le **code** d'`omnigroupe` + le contenu d'`intervention-groupe` + `sos-conflits` + `code-oreille` + `transitions` + `roue-responsabilites` + `noms-de-clans` — **6 apps absorbées** |
| **Mur** | `lock` (l'app résultante porte des données ; `omnigroupe` est déjà en `lock`) |
| **Note** | `omnigroupe` porte aujourd'hui le `<title>` « Intervention Groupe » et le code le plus complet ; `intervention-groupe` porte l'adresse. La fusion prend le code de l'un et l'URL de l'autre. |
| **3 améliorations max** | |

---

### Rang 7 — Grille horaire

| | |
|---|---|
| **Adresse** | `apps/grille/` |
| **Absorbe** | rien — **spécialisé, inchangé** |
| **Mur** | `lock` |
| **3 améliorations max** | |

---

### Rang 8 — Scoreboard

| | |
|---|---|
| **Adresse** | `apps/scoreboard/` |
| **Absorbe** | `olympiades` — en **mode pointage inter-équipes** |
| **Mur** | `lock` |
| **3 améliorations max** | |

---

### Rang 9 — Musique

| | |
|---|---|
| **Adresse** | `apps/musique/` |
| **Absorbe** | `chansons-camp`, `comptines` — **en collections** |
| **Mur** | `libre` (whitelist) |
| **3 améliorations max** | |

---

### Rang 10 — TNI

| | |
|---|---|
| **Adresse** | `apps/tni/` |
| **Absorbe** | rien — **spécialisé, inchangé** |
| **Mur** | `lock` |
| **3 améliorations max** | |

---

### Rang 11 — Studio Jeu

| | |
|---|---|
| **Adresse** | `apps/studio-jeu/` |
| **Absorbe** | rien — **spécialisé, inchangé** |
| **Mur** | `cadenas` |
| **À corriger en vague 2** | l'app est **absente du sitemap** et **d'aucun hub d'univers**. Elle entre au sitemap **et** dans un hub. |
| **3 améliorations max** | |

---

### Rang 12 — Cours maternelle

| | |
|---|---|
| **Adresse** | `apps/cours-maternelle/` |
| **Absorbe** | rien — **spécialisé, inchangé** |
| **Mur** | `lock` |
| **3 améliorations max** | |

---

### Rang 13 — Suppléance

| | |
|---|---|
| **Adresse** | `apps/suppleance/` |
| **Absorbe** | rien — **spécialisé, inchangé** |
| **Mur** | `libre` (whitelist) |
| **3 améliorations max** | |

---

### Rang 14 — Inventaire

| | |
|---|---|
| **Adresse** | `apps/inventaire/` |
| **Absorbe** | rien — **spécialisé, inchangé** |
| **Mur** | `gate` |
| **3 améliorations max** | |

---

### Rang 15 — Rencontres

| | |
|---|---|
| **Adresse** | `apps/rencontres/` |
| **Absorbe** | rien — **spécialisé, inchangé** |
| **Mur** | `lock` — **le `gate` est retiré en vague 1** (double mur, cf. Partie C) |
| **3 améliorations max** | |

---

### Rang 16 — Colorier

| | |
|---|---|
| **Adresse** | `apps/colorier/` |
| **Absorbe** | rien — **spécialisé, inchangé** |
| **Mur** | `libre` (whitelist) |
| **3 améliorations max** | |

---

### Rang 17 — Performances

| | |
|---|---|
| **Adresse** | `apps/performances/` |
| **Absorbe** | rien — **spécialisé, inchangé** |
| **Mur** | `lock` — **le `gate` est retiré en vague 1** (double mur, cf. Partie C) |
| **3 améliorations max** | |

---

### Rang 18 — Carnet EPS

| | |
|---|---|
| **Adresse** | `apps/evaluation/` |
| **Absorbe** | rien |
| **Mur** | `lock` |
| **État** | **GELÉE — source perdue.** Aucune modification de code. La QA se fait **par test seulement**, jamais par relecture ou réécriture. Elle passe en dernier pour cette raison. |
| **3 améliorations max** | *(sans objet tant que la source est perdue)* |

---

## 2. Ce qui disparaît, et où ça va

### 2.1 — Absorbé par Jeux (14)

`jeux-par-theme` · `jeux-rapides` · `jeux-calmes` · `activites-duree` · `echauffements` ·
`enigmes` · `plan-b-meteo` · `plan-b-pluie` · `brise-glace` · `grands-jeux` · `jeux-eau` ·
`rallyes` · `veillee-feu-de-camp` · `olympiades-scolaires`

Chacune devient **une collection** : un titre, un paragraphe d'intro, un filtre sur
`jeux-merged.json`. Leurs items en dur (8 à 10 par app, ~120 au total) sont dédoublonnés
contre le catalogue de 1439, puis intégrés avec étiquette.

### 2.2 — Absorbé par Intervention Groupe (6)

`omnigroupe` · `sos-conflits` · `code-oreille` · `transitions` · `roue-responsabilites` ·
`noms-de-clans`

### 2.3 — Absorbé par Scoreboard (1)

`olympiades` → mode pointage inter-équipes.

### 2.4 — Absorbé par Musique (2)

`chansons-camp` · `comptines` → collections.

### 2.5 — Absorbé par Planificateur (2)

`agenda` · `journee-pedago`

### 2.6 — Tué en vague 1 (3)

| App | Sort | Pourquoi ce sort |
|---|---|---|
| `bricolages` | **relais** meta-refresh → `/service-de-garde.html` | avait un lien entrant et une entrée au sitemap |
| `planification` | **relais** meta-refresh → `/apps/planificateur/` | se déclarait « squelette de validation » ; le planificateur est le vrai |
| `decodage` | **relais** meta-refresh → `https://decodage.zonetotalsport.ca/` | hors mission ÉPS/Camp/SDG. **Le dossier reste en place** ; il sort seulement du sitemap, des hubs et de `nouveautes.json`. Le déménagement vers son propre dépôt est une tâche séparée. |

`entrainement/` suit le même traitement que `decodage` : dossier conservé, sorti des
surfaces publiques.

---

## 3. Reporté — à ne pas faire en vague 2

| Chantier | Condition de déclenchement |
|---|---|
| `moyens-action` → absorbé par **Planificateur** (Fusion #3) | après la bascule payante |
| **Fiche unique par jeu** — unifier `fiches/`, les 1440 `jeux/*.html` statiques et `apps/jeux` | après la bascule payante |

Tant que ces deux-là ne sont pas déclenchés, `moyens-action` reste un dossier vivant hors
catalogue, et les trois lecteurs de fiches coexistent.

---

## 4. Ordre de passage en vague 2

```
1  jeux                 ← le plus lourd, 14 absorptions, ouvre le chantier
2  planificateur
3  generateur
4  sae
5  educatifs
6  intervention-groupe   ← 6 absorptions, code d'omnigroupe + URL d'intervention-groupe
7  grille
--- puis le reste ---
8  scoreboard      12  cours-maternelle    16  colorier
9  musique         13  suppleance          17  performances
10 tni             14  inventaire          18  evaluation (gelée, en dernier)
11 studio-jeu      15  rencontres
```

---

*Contrat figé en vague 1. Toute modification de ce document est une décision de Joey,
pas un effet de bord d'un chantier.*
