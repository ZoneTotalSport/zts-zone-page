# SCHÉMA OFFICIEL v2 — Banque de Jeux Sportifs Mondiaux

**Date :** 2026-04-08
**Auteur :** Zone Total Sport
**Objectif :** Standardiser et enrichir chaque fiche de jeu pour qu'un enseignant puisse l'utiliser sans autre référence.

---

## Principe directeur

> Chaque fiche de jeu doit être **autonome et complète**. Un enseignant qui lit la fiche pour la première fois doit pouvoir animer le jeu immédiatement, sans poser de questions, sans chercher ailleurs.

---

## Structure du fichier JSON (enveloppe)

```json
{
  "categorie": "Nom de la catégorie",
  "description": "Description de la catégorie",
  "total_jeux": 65,
  "date_creation": "2026-03-11",
  "date_revision": "2026-04-08",
  "auteur": "Zone Total Sport",
  "schema_version": "2.0",
  "jeux": [ ... ]
}
```

---

## Structure d'un jeu (champs obligatoires)

Tous les champs sont en **français québécois**. Le multilingue sera ajouté dans une phase future.

### Champs d'identification

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `id` | string | Identifiant unique (PREFIXE_###) | `"COOP_001"` |
| `titre` | string | Nom principal du jeu | `"Le Noeud Humain"` |
| `noms_alternatifs` | array[string] | Autres noms connus (min 1) | `["Human Knot", "La Pelote humaine"]` |
| `origine` | string | Pays/culture d'origine + contexte historique | `"Jeu coopératif occidental, popularisé dans les années 1970 par New Games Foundation (États-Unis)"` |

### Champs pédagogiques

| Champ | Type | Description | Minimum requis |
|-------|------|-------------|----------------|
| `intentions_pedagogiques` | string | Compétences visées selon le PFEQ, ce que l'élève développe | 2-3 phrases complètes |
| `competences_motrices` | array[string] | Compétences motrices spécifiques travaillées | Min 3 items |
| `valeurs` | array[string] | Valeurs éducatives promues | Min 3 items |

### Champs logistiques

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `niveau` | string | Niveau scolaire visé avec âges | `"Primaire 3e cycle → Secondaire 5 (10-17 ans)"` |
| `age_min` | number | Âge minimum | `10` |
| `age_max` | number | Âge maximum | `17` |
| `duree` | string | Durée totale incluant explication | `"15-25 minutes (5 min explication + 10-20 min jeu)"` |
| `nb_joueurs_min` | number | Nombre minimum de joueurs | `8` |
| `nb_joueurs_max` | number | Nombre maximum de joueurs | `30` |
| `espace` | string | Lieu requis | `"Gymnase ou extérieur plat"` |
| `niveau_activite` | string | Intensité physique | `"Modéré"` (valeurs: Faible / Modéré / Élevé / Très élevé) |

### Champs matériel

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `materiel` | array[object] | Liste détaillée du matériel | Voir format ci-dessous |

**Format matériel enrichi :**
```json
"materiel": [
  {
    "item": "Cônes",
    "quantite": "8-12",
    "obligatoire": true,
    "alternative": "Bouteilles d'eau, souliers"
  },
  {
    "item": "Dossards",
    "quantite": "2 couleurs (4-6 par couleur)",
    "obligatoire": true,
    "alternative": "Foulards, bracelets de couleur"
  },
  {
    "item": "Sifflet",
    "quantite": "1",
    "obligatoire": false,
    "alternative": "Signal vocal fort"
  }
]
```

**Si aucun matériel :** `"materiel": []` (tableau vide, comme avant)

### Champs de mise en place

| Champ | Type | Description | Minimum requis |
|-------|------|-------------|----------------|
| `disposition` | string | Organisation de l'espace ET des joueurs avant le début | 3-5 phrases décrivant précisément le setup |

**Exemple de disposition enrichie :**
```
"Délimiter un rectangle de 20m x 15m avec des cônes aux 4 coins. Diviser le groupe en 2 équipes égales. Chaque équipe se place derrière sa ligne de fond. Identifier 2 chasseurs avec des dossards. Prévoir une zone d'attente sur le côté pour les joueurs éliminés temporairement."
```

### Champs de déroulement (LE COEUR DE LA FICHE)

| Champ | Type | Description | Minimum requis |
|-------|------|-------------|----------------|
| `deroulement` | array[string] | Étapes numérotées du jeu | Min 8 étapes |

**Exigences pour le déroulement :**
1. Chaque étape = une action claire et concise
2. Inclure la mise en place initiale
3. Inclure le signal de départ
4. Décrire les actions des joueurs ET de l'enseignant
5. Expliquer clairement les règles de base
6. Préciser ce qui arrive quand un joueur est éliminé/touché
7. Indiquer comment le jeu se termine
8. Minimum 8 étapes, idéalement 10-12

**Exemple de déroulement enrichi :**
```json
"deroulement": [
  "Rassembler les élèves au centre du gymnase. Expliquer les règles en démontrant avec 2 volontaires.",
  "Former des groupes de 8 à 12 élèves. Chaque groupe forme un cercle serré.",
  "Chaque élève tend les bras vers le centre du cercle et saisit les mains de deux personnes DIFFÉRENTES (pas ses voisins immédiats). Vérifier que personne ne tient les deux mains de la même personne.",
  "Au signal de l'enseignant, les groupes tentent de se démêler pour reformer un cercle, SANS JAMAIS lâcher les mains.",
  "Les élèves peuvent passer par-dessus ou en dessous des bras des autres, tourner sur eux-mêmes, enjamber — mais pas lâcher.",
  "L'enseignant circule entre les groupes, encourage, et pose des questions : « Qui a une idée? », « Avez-vous essayé de passer par-dessous? »",
  "Si un groupe est bloqué depuis plus de 3 minutes, l'enseignant peut accorder UN « lâcher stratégique » : une paire de mains peut se lâcher et se reprendre dans une nouvelle position.",
  "Le jeu se termine quand le cercle est reformé (ou quand deux cercles entrelacés sont formés — c'est aussi une réussite!).",
  "Rassembler le groupe pour un retour : « Qu'est-ce qui a fonctionné? Qui a pris le leadership? Comment avez-vous communiqué? »",
  "Pour relancer : augmenter la taille des groupes ou ajouter une contrainte (silence, yeux fermés pour certains)."
]
```

### Champs de variantes

| Champ | Type | Description | Minimum requis |
|-------|------|-------------|----------------|
| `variantes` | array[object] | Variantes détaillées avec mise en oeuvre | Min 4 variantes |

**Format variante enrichi :**
```json
"variantes": [
  {
    "nom": "Version silencieuse",
    "description": "Aucune communication verbale permise. Les élèves doivent se démêler uniquement par le toucher et le regard. Augmente considérablement la difficulté et développe la communication non-verbale.",
    "niveau_difficulte": "Avancé"
  },
  {
    "nom": "Chronométré",
    "description": "Chaque groupe tente de battre son propre record. Première tentative = référence. Deuxième tentative = objectif de réduire le temps de 30%. Crée une saine compétition intra-groupe.",
    "niveau_difficulte": "Intermédiaire"
  }
]
```

### Champs de sécurité et adaptations

| Champ | Type | Description | Minimum requis |
|-------|------|-------------|----------------|
| `consignes_securite` | array[string] | Règles de sécurité spécifiques au jeu | Min 3 consignes |
| `adaptations_besoins_speciaux` | array[object] | Adaptations détaillées par type de besoin | Min 3 types |

**Format adaptations enrichi :**
```json
"adaptations_besoins_speciaux": [
  {
    "type": "Mobilité réduite",
    "adaptation": "L'élève en fauteuil roulant joue le rôle d'observateur-stratège qui dirige verbalement le groupe. Peut aussi participer si le cercle est assez grand pour que le fauteuil passe sous les bras levés."
  },
  {
    "type": "Déficience visuelle",
    "adaptation": "Jumeler l'élève avec un pair qui guide verbalement. Utiliser des bracelets texturés au lieu du contact direct des mains si souhaité."
  },
  {
    "type": "Trouble du spectre de l'autisme",
    "adaptation": "Avertir l'élève du contact physique à l'avance. Offrir l'option de porter des gants. Permettre de quitter et revenir si surcharge sensorielle."
  },
  {
    "type": "Difficulté d'attention",
    "adaptation": "Réduire la taille du groupe à 6 pour garder l'engagement. Donner un rôle actif : chronométreur ou coach d'équipe."
  }
]
```

**Format consignes de sécurité :**
```json
"consignes_securite": [
  "Ne jamais tirer brusquement sur les bras — risque de blessure à l'épaule.",
  "S'assurer que l'espace autour de chaque groupe est dégagé (min 2m entre les groupes).",
  "Interdire de forcer un passage — si ça bloque, chercher une autre solution.",
  "Porter attention aux élèves qui montrent de l'inconfort avec le contact physique."
]
```

### NOUVEAUX champs ajoutés (v2)

| Champ | Type | Description | Minimum requis |
|-------|------|-------------|----------------|
| `role_enseignant` | string | Ce que fait l'enseignant PENDANT le jeu | 3-5 phrases |
| `retour_au_calme` | string | Comment conclure l'activité proprement | 2-3 phrases |
| `questions_reflexion` | array[string] | Questions pour le bilan avec les élèves | Min 3 questions |
| `progression` | array[string] | Étapes pour complexifier le jeu graduellement | Min 3 niveaux |
| `erreurs_frequentes` | array[string] | Pièges courants à éviter pour l'enseignant | Min 3 erreurs |
| `tags` | array[string] | Mots-clés pour la recherche/filtrage | Min 5 tags |

**Exemples des nouveaux champs :**

```json
"role_enseignant": "Circuler entre les groupes sans donner de solutions. Poser des questions ouvertes pour stimuler la réflexion. Observer les dynamiques de leadership et de communication pour la rétroaction. Intervenir seulement si un groupe est frustré ou si la sécurité est compromise.",

"retour_au_calme": "Rassembler les élèves en cercle assis. Faire 3 respirations profondes. Animer une courte discussion de 2-3 minutes sur les stratégies utilisées et les apprentissages.",

"questions_reflexion": [
  "Qu'est-ce qui a été le plus difficile dans ce défi?",
  "Comment votre groupe a-t-il pris des décisions? Qui a émergé comme leader?",
  "Qu'est-ce que vous feriez différemment si on recommençait?",
  "Quel lien pouvez-vous faire avec le travail d'équipe dans la vie quotidienne?"
],

"progression": [
  "Niveau 1 — Découverte : Groupes de 6, communication libre, temps illimité.",
  "Niveau 2 — Intermédiaire : Groupes de 10, temps limité à 5 minutes.",
  "Niveau 3 — Avancé : Groupes de 12, version silencieuse (aucune parole).",
  "Niveau 4 — Expert : Groupes de 12+, yeux bandés pour la moitié du groupe."
],

"erreurs_frequentes": [
  "Faire des groupes trop gros (>12) dès le premier essai — commencer petit et augmenter.",
  "Ne pas vérifier que chaque élève tient les mains de deux personnes DIFFÉRENTES avant de commencer.",
  "Laisser un groupe bloqué trop longtemps sans intervention — la frustration tue le plaisir.",
  "Oublier de prévoir une alternative pour les élèves inconfortables avec le contact physique."
]
```

---

## Valeurs standardisées pour les champs contrôlés

### `niveau_activite`
- `"Faible"` — Peu de déplacements, jeu statique ou de réflexion
- `"Modéré"` — Déplacements intermittents, effort moyen
- `"Élevé"` — Course/mouvement constant, effort soutenu
- `"Très élevé"` — Sprint, effort maximal, haute intensité cardio

### `espace`
- `"Gymnase"`
- `"Extérieur"`
- `"Gymnase ou extérieur"`
- `"Salle de classe"`
- `"Cour d'école"`
- `"Piscine"`

### `niveau` (format standard)
- `"Préscolaire (3-5 ans)"`
- `"Primaire 1er cycle (6-7 ans)"`
- `"Primaire 2e cycle (8-9 ans)"`
- `"Primaire 3e cycle (10-11 ans)"`
- `"Secondaire 1er cycle (12-13 ans)"`
- `"Secondaire 2e cycle (14-16 ans)"`
- Combinaisons avec `→` : `"Primaire 2e cycle → Secondaire 1er cycle (8-13 ans)"`

### Préfixes d'ID par catégorie
| Préfixe | Catégorie |
|---------|-----------|
| COOP_ | Coopération |
| OPP_ | Opposition |
| POUR_ | Poursuite |
| PRESC_ | Préscolaire |
| EXT_ | Extérieur |
| TRAD_ | Traditionnels du monde |
| MAT_ | Avec matériel |
| SANS_ | Sans matériel |
| SCOL_ | Sports collectifs |
| SIND_ | Sports individuels |
| AUTO_ | Autochtones |
| OLYM_ | Olympiques/Paralympiques |
| SEC_ | Secondaire |
| MO1_ | Monde batch 01 |
| AME_ | Amériques/Europe |
| AAO_ | Afrique/Asie/Océanie |

---

## Checklist de qualité par jeu

Avant de considérer un jeu comme **complet v2**, vérifier :

- [ ] `titre` — Nom clair et évocateur
- [ ] `noms_alternatifs` — Au moins 1 nom alternatif
- [ ] `intentions_pedagogiques` — Min 2 phrases, lien avec PFEQ
- [ ] `niveau` — Format standardisé avec âges
- [ ] `duree` — Inclut temps d'explication + temps de jeu
- [ ] `but_du_jeu` — 1-2 phrases claires, compréhensible par un enfant
- [ ] `materiel` — Format enrichi (item/quantité/obligatoire/alternative) OU tableau vide
- [ ] `disposition` — Min 3 phrases, on peut visualiser le setup
- [ ] `deroulement` — Min 8 étapes détaillées, inclut début/milieu/fin
- [ ] `variantes` — Min 4 variantes avec nom + description + niveau
- [ ] `consignes_securite` — Min 3 consignes spécifiques au jeu
- [ ] `adaptations_besoins_speciaux` — Min 3 types (mobilité, sensoriel, cognitif)
- [ ] `role_enseignant` — Clair sur quoi faire pendant le jeu
- [ ] `retour_au_calme` — Comment conclure
- [ ] `questions_reflexion` — Min 3 questions ouvertes
- [ ] `progression` — Min 3 niveaux de complexification
- [ ] `erreurs_frequentes` — Min 3 pièges à éviter
- [ ] `competences_motrices` — Min 3 compétences
- [ ] `valeurs` — Min 3 valeurs
- [ ] `origine` — Pays/culture + contexte
- [ ] `tags` — Min 5 tags pertinents

---

## Migration v1 → v2

### Ce qui change :
1. `deroulement` : string → **array[string]** (toujours un tableau d'étapes)
2. `variantes` : array[string] → **array[object]** (nom + description + niveau)
3. `materiel` : array[string] → **array[object]** (item + quantité + obligatoire + alternative) ou `[]`
4. `adaptations_besoins_speciaux` : string → **array[object]** (type + adaptation)
5. **6 nouveaux champs** ajoutés : consignes_securite, role_enseignant, retour_au_calme, questions_reflexion, progression, erreurs_frequentes
6. Tous les champs multilingues `{fr, en, es, zh}` → **string français** (multilingue = phase future)

### Rétrocompatibilité :
Le frontend (`app.js`) utilise déjà des alias flexibles. Les nouveaux champs s'afficheront automatiquement s'ils sont présents. Seul le champ `consignes_securite` est déjà supporté dans le modal. Les 5 autres nouveaux champs nécessiteront une mise à jour du frontend (Phase 3).
