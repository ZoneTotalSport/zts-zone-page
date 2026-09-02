# RAPPORT-COLLECTIONS-JEUX — vague 2, PR A

> Généré par `_scripts/extrait-collections-jeux.js` le 2026-09-02.
> Relançable : même entrée, même sortie.

## Décompte

| | |
|---|---|
| Items extraits des 14 apps | **113** |
| Doublons du catalogue | **12** |
| Inédits ajoutés au catalogue | **101** |
| Catalogue | 1439 → **1540** jeux |
| Jeux portant au moins une collection | **887** |

## Par collection

| Collection | Extraits | Doublons | Inédits | Jeux étiquetés |
|---|---|---|---|---|
| 🎭 Jeux par thème | 8 | 1 | 7 | **8** |
| ⚡ Jeux rapides | 10 | 3 | 7 | **214** |
| 🧘 Jeux calmes | 8 | 0 | 8 | **164** |
| ⏳ Activités par durée | 9 | 0 | 9 | **9** |
| 🔥 Échauffements | 8 | 1 | 7 | **14** |
| 🧩 Énigmes & devinettes | 10 | 0 | 10 | **10** |
| ⛅ Plan B météo | 8 | 1 | 7 | **448** |
| 🌧️ Plan B jours de pluie | 8 | 0 | 8 | **62** |
| 😄 Brise-glace | 8 | 1 | 7 | **8** |
| 🏴 Grands jeux | 8 | 1 | 7 | **37** |
| 💦 Jeux d'eau | 8 | 0 | 8 | **55** |
| 🗺️ Rallyes & chasses au trésor | 4 | 0 | 4 | **4** |
| 🔥 Veillée & feu de camp | 8 | 0 | 8 | **8** |
| 🥇 Olympiades scolaires | 8 | 4 | 4 | **67** |

## Largeur des collections — étiquettes + règle

> Décision de Joey : une collection est une **règle**, pas seulement les étiquettes
> héritées de la mini-app. Cible 20-60 jeux. Une règle sous 15 est **signalée**,
> jamais forcée.

| Collection | Étiquettes | Règle | Total | |
|---|---|---|---|---|
| 🎭 Jeux par thème | 8 | — | **8** | ⚪ thématique — aucune règle tenable |
| ⚡ Jeux rapides | 10 | 212 | **214** | ⚠️ très large — la règle est quasi un filtre |
| 🧘 Jeux calmes | 8 | 157 | **164** | 🟡 hors cible, mais honnête |
| ⏳ Activités par durée | 9 | — | **9** | ⚪ thématique — aucune règle tenable |
| 🔥 Échauffements | 8 | 7 | **14** | ⚠️ règle sous 15 (7) — reste thématique |
| 🧩 Énigmes & devinettes | 10 | — | **10** | ⚪ thématique — aucune règle tenable |
| ⛅ Plan B météo | 8 | 441 | **448** | ⚠️ très large — la règle est quasi un filtre |
| 🌧️ Plan B jours de pluie | 8 | 54 | **62** | 🟡 hors cible, mais honnête |
| 😄 Brise-glace | 8 | — | **8** | ⚪ thématique — aucune règle tenable |
| 🏴 Grands jeux | 8 | 29 | **37** | ✅ dans la cible |
| 💦 Jeux d'eau | 8 | 54 | **55** | ✅ dans la cible |
| 🗺️ Rallyes & chasses au trésor | 4 | — | **4** | ⚪ thématique — aucune règle tenable |
| 🔥 Veillée & feu de camp | 8 | — | **8** | ⚪ thématique — aucune règle tenable |
| 🥇 Olympiades scolaires | 8 | 64 | **67** | 🟡 hors cible, mais honnête |

**Ce qui n'a pas de règle, et pourquoi.** Aucun champ du catalogue ne porte leur
critère ; le deviner reviendrait à étiqueter au jugé.

- `activites-duree` — `dureeMin <= 20` ramène **1434 des 1540** jeux (1165 sont
  à 15 min). Le filtre par durée fait déjà ce travail, mieux et sans mentir.
- `jeux-par-theme` — « thème » n'est pas un champ du catalogue.
- `enigmes`, `brise-glace`, `rallyes`, `veillee-feu-de-camp` — règles testées,
  toutes sous 15 jeux. Elles restent thématiques.

**Dette de fond, hors PR B** : l'enrichissement IA des étiquettes sur les
1540 jeux, validé par Joey. Il élargira les collections thématiques sans
règle. Ce n'est **pas** un préalable à la PR B.


## Filtre matériel — 10 catégories normalisées

> Pas de texte libre. Le premier mot-clé qui matche gagne, et « Sans matériel »
> passe en premier : c'est le filtre le plus demandé sur le terrain.

Champ dérivé `materielCat`, posé sur les **1429** jeux dont le matériel est
renseigné. Un jeu sans matériel renseigné n'en reçoit pas — absent laisse passer le
filtre, comme pour l'âge.

| Catégorie | Jeux | Part |
|---|---|---|
| Ballons | 418 | 29.3 % |
| Cônes / dossards | 279 | 19.5 % |
| Petit matériel varié | 169 | 11.8 % |
| Sans matériel | 161 | 11.3 % |
| Cerceaux | 133 | 9.3 % |
| Gros matériel de gym | 98 | 6.9 % |
| Cordes | 90 | 6.3 % |
| Eau / extérieur | 45 | 3.1 % |
| Papier / crayons | 24 | 1.7 % |
| Parachute | 12 | 0.8 % |

**Couverture : 95.4 %** rangés par un mot-clé explicite. Les
66 restants (4.6 %) tombent dans « Petit matériel varié »
faute de mieux — sous le seuil de 5 % fixé par Joey.


## Doublons écartés

> L'item extrait n'entre pas au catalogue. Le jeu qu'il désigne reçoit
> l'étiquette de la collection : il en fait bien partie.

### Jeux par thème — 1

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| La queue du dragon | Attraper la queue du dragon | `AAO_005` | arbitrage — Joey : vrai doublon, ecarte confirme. (1) |

### Jeux rapides — 3

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Le nœud humain | LE NŒUD HUMAIN | `pfeq_120` | titre identique (1) |
| Salade de fruits | La Salade de Fruits | `PRESC_030` | ratio >= 0.90 (0.93) |
| Le miroir | Le Miroir | `COOP_002` | titre identique (1) |

### Échauffements — 1

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Hélicoptères | HÉLICOPTÈRES (HELICOPTERS) | `pfeq_411` | ratio >= 0.84 + mot « helicopteres » (0.88) |

### Plan B météo — 1

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Yoga des animaux | Le Yoga des Animaux | `PRESC_011` | ratio >= 0.90 (0.91) |

### Brise-glace — 1

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Le nœud humain | LE NŒUD HUMAIN | `pfeq_120` | titre identique (1) |

### Grands jeux — 1

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Le volcan | LE VOLCAN | `pfeq_146` | titre identique (1) |

### Olympiades scolaires — 4

| Item extrait | ≈ Jeu du catalogue | id | Règle |
|---|---|---|---|
| Saut en longueur | Grand Saut en Longueur | `OLYM_002` | arbitrage — Revue : meme epreuve (elan-impulsion-reception). (1) |
| Course en sac | Le Carreras de Sacos (Course en sac — Amérique du Sud) | `AM-EU-042` | arbitrage — Revue : meme mecanique, habillage culturel different. (1) |
| Lancer dans le cerceau | Le Lancé dans le Cerceau | `PRESC_024` | ratio >= 0.90 (0.97) |
| Tir à la corde | Kéo Co (Tir à la corde vietnamien) | `AAO_050` | arbitrage — Revue : meme mecanique, habillage culturel different. (1) |

