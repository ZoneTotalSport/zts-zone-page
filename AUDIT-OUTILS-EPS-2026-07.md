# Audit — Zone ÉPS « couteau suisse » (8 juillet 2026)

Objectif : que `ep.html` regroupe TOUS les outils indispensables du prof d'ÉPS au même endroit.
Inventaire au 8 juillet : 25 cartes actives + cahier de planification en iframe + app Performances élèves (ajoutée ce jour).

## ✅ Déjà couvert (fort)

| Besoin du prof | Outil en place |
|---|---|
| Banque d'activités | Banque de jeux (1439), Éducatifs, SAÉ (911), Générateur IA |
| Planifier | Cahier de planification (iframe), Agenda, Grille horaire |
| Évaluer | Carnet ÉPS, **Performances élèves (nouveau : vidéo + Drive + PFEQ)** |
| Animer au gymnase | Boîte à outils (signaux/chrono/équipes), Scoreboard, TNI, Musique, Échauffements |
| Situations spéciales | Suppléance, Plan B météo, Intervention groupe, Olympiades scolaires |
| Maternelle | 90 cours maternelle, Pages à colorier, Comptines |
| Communauté | Blog, Aidons-nous, Répertoire mondial |

## 🟡 Quick wins — apps EXISTANTES absentes du hub ÉPS (0 dev, juste des cartes)

1. **Omnigroupe** (`/apps/omnigroupe/`) — PWA assistant terrain EPS (séquenceur de cours, dessin
   tactique, 60 jeux inclusifs, mode TNI). C'est L'app ÉPS par excellence et elle n'est pas sur le hub.
2. **Moyens d'action** (`/apps/moyens-action/`) — 10 moyens d'action PFEQ avec modal TBI.
3. **Jeux rapides** (`/apps/jeux-rapides/`) — pour les 5 minutes de fin de cours.
4. **Brise-glace** (`/apps/brise-glace/`) — rentrée scolaire / nouveaux groupes.
5. **Jeux calmes** (`/apps/jeux-calmes/`) — retour au calme après l'effort.
6. **SOS Conflits** (`/apps/sos-conflits/`) — complément d'Intervention groupe.

## 🔴 Manques réels — outils indispensables à créer (priorisés)

1. **Test navette / PACER (test Léger)** — LE test cardio du Québec. Sons de paliers, écran
   TNI plein écran, saisie des résultats par élève, historique. Se branche sur les classes
   du Carnet. *Aucun équivalent gratuit fr-QC propre.* → gros aimant SEO.
2. **Machine à équipes** — génération d'équipes depuis les VRAIES listes de classe
   (persistées), avec contraintes (« séparer X et Y », équilibrer forts/faibles, capitaines).
   La Boîte à outils fait des équipes aléatoires simples, pas branchées sur les classes.
3. **Gestionnaire de tournois** — poules, éliminatoires simples/doubles, ronde suisse, affichage
   TNI du bracket. Le Scoreboard compte les points d'UN match; rien ne gère la structure.
4. **Minuteur d'intervalles / Tabata TNI** — rounds travail/repos, sons distincts, presets
   (Tabata 20/10, circuits à stations). Le chrono actuel est linéaire.
5. **Certificats & méritas imprimables** — générateur (nom, exploit, mascotte Mr Root, date),
   impression 4/page. Communication parents = grosse valeur émotive, très partageable.
6. **Défis cumulatifs d'école** — course au kilomètre / cumul collectif (classe X a couru Y km),
   thermomètre de progression TNI. Fort pour la motivation-école.
7. **Constructeur de circuits à stations** — plan du gymnase, stations glisser-déposer,
   affiches de station imprimables + rotation minutée (peut réutiliser le canvas d'Omnigroupe).
8. **Inventaire matériel** — liste du local de matériel, quantités, état, prêts. Niche mais
   personne ne l'offre.
9. **Fiches d'urgence rapides** — protocole commotion (retrait/retour au jeu), crise d'asthme,
   DEA : 1 page consultable en 10 secondes. Référentiel, pas d'app complexe.
10. **Vue « portfolio élève »** — extension de Performances élèves : chronologie d'UN élève
    (toutes ses vidéos/observations), exportable PDF pour bulletin/rencontre de parents.

## 🧭 Recommandation UX du hub

25+ cartes à plat = mur. Regrouper en 4 sections (le « couteau suisse » a des lames rangées) :
**📋 PLANIFIER** (cahier, agenda, grille, SAÉ, générateur) · **🏃 ANIMER** (jeux, éducatifs,
échauffements, boîte à outils, scoreboard, TNI, musique, omnigroupe) · **📊 ÉVALUER**
(carnet, performances, test navette à venir) · **🧰 SITUATIONS** (suppléance, plan B,
intervention, olympiades, maternelle).

## Ordre suggéré

1. Quick wins (6 cartes) + sections du hub — 1 session.
2. Test navette (aimant SEO + différenciateur) — 1-2 sessions.
3. Machine à équipes + Tabata — 1 session chacune.
4. Tournois, certificats, défis cumulatifs — ensuite.
