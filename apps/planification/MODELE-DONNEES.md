# Modèle de données — App de planification ZTS

> Principe : **contenu ≠ affichage**. Tout le contenu vit dans `data/*.json` (jamais codé en dur dans le HTML).
> L'app charge le bon fichier selon le métier choisi, puis filtre/affiche.

## Décisions validées (Joey, 30 mai)
- **ÉP** : 90 cours **par niveau** × 4 niveaux (Maternelle, 1er, 2e, 3e cycle) ≈ 360 cours.
- **Camp** : groupes d'âge **5-7 / 8-10 / 11-12** (sans chevauchement).
- **Contenu** : importer les **90 cours maternelle existants** (`data/ep-maternelle.json`, 776 Ko) + générer le reste.
- **Design** : réutiliser le design system du mockup (`shared/zts.css`, header/footer/i18n/gate partagés).

## Schéma de tags commun (filtrage transversal)
Chaque entité porte un objet `tags` :
```
tags: {
  age:      ["5-7"] | ["maternelle"] ...   // tranches ou niveau
  niveau:   "maternelle|1er|2e|3e"         // ÉP seulement
  lieu:     ["gym","local","cour","parc"]
  espace:   "petit|moyen|grand"
  groupe:   "petit|grand|classe"
  materiel: ["ballons","cônes",...]
  energie:  "calme|moyen|defoulement"
  duree:    60                              // minutes (ÉP) ou null
  pfeq:     ["C1","C2"]                      // ÉP seulement
  moment:   "matin|midi|aprem|soir"
  contexte: ["plan_pluie","plan_meteo","theme","sos"]
}
```

## A) ÉP — entité « cours » (schéma RÉEL importé de l'app maternelle)
Fichier : `data/ep-<niveau>.json` → tableau de cours.
```
{
  id, titre, niveau, duree, espace, eleves,
  pfeq_principale, pfeq_secondaire, pfeq:[],
  intention, materiel:[], preparation:[],
  mise_en_train:{ nom,but,demo,deroulement:[],consignes:[],variantes:[],securite:[],
                  erreurs:[],questions_eleves:[],faq_enseignant:[],adaptations:[],duree },
  activite_1:{ …mêmes clés… },
  activite_2:{ …mêmes clés… },
  retour:{ …mêmes clés… },
  astuce, evaluation, liens, prolongement, groupe, periode,
  tags:{…}              // ajouté pour le filtrage
}
```
Niveaux : `ep-maternelle.json` (90, importé ✅), `ep-1er.json`, `ep-2e.json`, `ep-3e.json` (à générer).

## B) Camp — entité « semaine » (vue Semaine × Groupe d'âge → journée)
Fichier : `data/camp.json` → tableau de 7 semaines.
Journée 9 h–16 h en **7 blocs** : arrivée, avant-midi 1, avant-midi 2, dîner, après-midi 1, après-midi 2, départ.
```
{
  semaine:1, theme, theme_en, couleur, plan_b_meteo,
  groupes:{
    "5-7":  { blocs:[ {heure,plage,nom,desc,lieu,energie,materiel:[]} , …7 ] },
    "8-10": { blocs:[…] },
    "11-12":{ blocs:[…] }
  },
  tags:{…}
}
```

## C) Service de garde — entité « jour » (2 blocs : matin 7-9h, après-midi 15-18h)
Fichier : `data/sdg.json` → tableau de 200 jours (groupés par semaine/mois pour l'affichage).
Chaque bloc : routine d'accueil → jeu calme → jeu actif → plan pluie → retour au calme.
```
{
  jour:1, semaine:1, label,
  blocs:{
    matin: { plage:"7h00-9h00", items:[ {type:"accueil|jeu_calme|jeu_actif|plan_pluie|retour", nom, desc, lieu, materiel:[]} ] },
    aprem: { plage:"15h00-18h00", items:[ … ] }
  },
  tags:{…}
}
```

## Ordre de remplissage (après validation du modèle)
1. ÉP : générer 1er, 2e, 3e cycle (90 chacun) sur le schéma ci-dessus.
2. Camp : 7 semaines × 3 groupes.
3. SDG : 200 jours (gabarit répété, variantes par semaine/saison).
4. Traduction EN/ZH/ES du contenu (phase séparée — l'import maternelle est FR seulement).
