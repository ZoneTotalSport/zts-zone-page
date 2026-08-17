/* Génère ep-1er.json / ep-2e.json / ep-3e.json — 90 cours chacun, structure complète (schéma maternelle).
   Compose à partir de 10 domaines d'apprentissage × titres × variantes d'activités + saisons + PFEQ.
   node _generate-ep.js */
const fs = require('fs');

const CYCLES = {
  '1er': { niveau:'1er cycle (6-8 ans)', eleves:'20-28', diff:'On reste dans le jeu et la découverte; consignes courtes et imagées.' },
  '2e':  { niveau:'2e cycle (8-10 ans)', eleves:'24-30', diff:'On introduit la tactique simple et le respect des règles.' },
  '3e':  { niveau:'3e cycle (10-12 ans)', eleves:'24-32', diff:'On vise la stratégie d\'équipe, l\'autonomie et le dépassement personnel.' }
};
const PERIODES = ['Septembre — Novembre','Décembre — Février','Mars — Mai'];

// b(nom,but,deroulement[],consignes[],securite[],variantes[]) → bloc de phase
const b = (nom,but,der,con,sec,vr,duree)=>({nom,but,demo:'L\'enseignant montre l\'essentiel en 30 s, puis fait pratiquer.',deroulement:der,consignes:con,securite:sec,variantes:vr,erreurs:[],questions_eleves:[],adaptations:['Réduire la distance/les règles pour les élèves en difficulté; ajouter un défi pour les plus habiles.'],duree});

const DOMAINS = [
  { dom:'Locomotion', pfeqP:'C1', mat:['cônes','cerceaux','tapis'],
    titres:['Sur la piste','Le grand parcours','Cap sur la vitesse','Sauts en folie','L\'explorateur agile','Course aux trésors','Slalom express','Les ninjas du gym','Marathon des animaux'],
    warm:[b('Réveil locomoteur','Activer le corps par des déplacements variés.',['Marche, course lente, talons-fesses, montées de genoux sur 2 longueurs.','Pas chassés et déplacements latéraux.','Étirements dynamiques en mouvement.'],['« On occupe tout l\'espace, sans se foncer dessus. »'],['Espacer les départs.'],['Au signal, changer de mode de déplacement.'],'8 min')],
    act1:[b('Parcours d\'agilité','Enchaîner sauts, slaloms et équilibres.',['Installer un circuit (slalom de cônes, sauts dans les cerceaux, poutre au sol).','Passage individuel en continu, sans bousculer.','2-3 tours, on cherche la fluidité.'],['« On respecte la distance avec celui de devant. »','« On contrôle, la vitesse vient après. »'],['Tapis sous les zones de saut.'],['Chronométrer pour le plaisir.','Ajouter un obstacle à franchir.'],'18 min'),
      b('Les déménageurs','Transporter des objets en variant la course.',['Deux équipes rapportent des objets d\'une zone à l\'autre.','Un objet à la fois, mode de déplacement imposé au signal.','On compte les objets à la fin.'],['« On dépose, on ne lance pas. »'],['Zone de course dégagée.'],['Varier les modes (cloche-pied, à reculons).','Ajouter une zone-obstacle.'],'18 min'),
      b('Chrono-relais','Améliorer sa vitesse de réaction et de course.',['Équipes en colonnes, relais aller-retour.','Passage du témoin (ou tape dans la main).','3 manches, on note la progression.'],['« On attend le relais derrière la ligne. »'],['Couloirs séparés.'],['Départ au son varié.','Relais avec transport d\'objet.'],'18 min')],
    act2:[b('Le filet du pêcheur','Courir et esquiver dans un jeu de poursuite.',['Quelques « filets » (tagueurs) attrapent les « poissons ».','Touché = on rejoint le filet en se donnant la main.','Derniers poissons libres gagnent.'],['« On touche doucement, aux épaules. »'],['Délimiter clairement la zone.'],['Agrandir/réduire la zone.','Zones-refuge limitées dans le temps.'],'16 min'),
      b('Béret-vitesse','Réagir vite à l\'appel de son numéro.',['Deux équipes numérotées face à face.','À l\'appel d\'un numéro, les deux courent chercher l\'objet central.','Point pour qui le rapporte sans se faire toucher.'],['« On ne traverse pas avant son numéro. »'],['Objet mou au centre.'],['Appeler 2 numéros à la fois.','Mode coopératif.'],'16 min')],
    retour:[b('Étirements guidés','Faire redescendre le rythme cardiaque.',['Marche lente puis étirements doux des grands groupes musculaires.','Respiration: inspire 4 temps, expire 6.','Retour au calme assis.'],['« On tient l\'étirement sans rebond. »'],[],['Étirements en musique douce.'],'6 min')] },

  { dom:'Manipulation — ballons', pfeqP:'C1', mat:['ballons','cônes','cerceaux'],
    titres:['Mains de magicien','Maîtres du ballon','Lancer-attraper','Dribble académie','Cibles et passes','Jonglerie débutante','Ballon-contrôle','As de la passe','Précision parfaite'],
    warm:[b('Échauffement balle en main','Se familiariser avec le ballon.',['Faire le tour de la taille, des jambes avec le ballon.','Lancers verticaux et rattrapés sur place.','Petits dribbles statiques.'],['« On garde les yeux levés. »'],['Espacement suffisant.'],['Changer de main.'],'8 min')],
    act1:[b('Atelier lancer-attraper','Développer la coordination œil-main.',['En duos, passes à distance croissante.','Varier: passe à terre, en cloche, à deux mains.','Défi: nombre de passes sans échapper.'],['« On vise les mains du partenaire. »'],['Ballons mous au besoin.'],['Reculer à chaque réussite.','Ajouter une passe rebond.'],'18 min'),
      b('Parcours dribble','Contrôler le ballon en déplacement.',['Slalom de cônes en dribblant (main ou pied selon cycle).','Garder le contrôle, regard devant.','Aller-retour, on améliore la fluidité.'],['« Petites touches, ballon proche. »'],['Couloirs dégagés.'],['Chronométrer.','Main faible / pied faible.'],'18 min'),
      b('Cibles mouvantes','Affiner la précision des lancers.',['Viser des cibles (cerceaux, cônes) à distances variées.','5 lancers chacun, on compte les points.','Rotation des postes.'],['« On attend le signal pour récupérer. »'],['Zone de tir balisée.'],['Cibles plus loin/plus petites.'],'18 min')],
    act2:[b('Ballon-château','Protéger et viser des quilles en équipe.',['Chaque équipe défend ses quilles (cônes) et vise celles des autres.','Renversée = on la relève après 10 s.','Esprit d\'équipe et déplacement.'],['« Pas de lancer à la tête. »'],['Ballons mousse.'],['Ajouter des défenseurs.'],'16 min'),
      b('Passe à dix','Conserver le ballon par des passes.',['Deux équipes; faire 10 passes sans interception = 1 point.','Pas de contact, on se démarque.','Remise en jeu après un point.'],['« On joue le ballon, pas le joueur. »'],['Zone délimitée.'],['Réduire à 5 passes pour les plus jeunes.'],'16 min')],
    retour:[b('Respiration & ballon','Revenir au calme en douceur.',['Assis, ballon sur les genoux, respirations lentes.','Étirements bras et épaules.','Rangement ordonné du matériel.'],['« On respire par le nez. »'],[],['Yeux fermés.'],'6 min')] },

  { dom:'Jeux collectifs', pfeqP:'C2', mat:['dossards','cônes','foulards'],
    titres:['Tous ensemble','La grande poursuite','Stratèges en herbe','Attaque-défense','Les clans','Capture & liberté','Zone de jeu','Esprit d\'équipe','Le grand défi'],
    warm:[b('Mise en train collective','Créer l\'esprit de groupe et activer le corps.',['Déplacements libres, au signal former des groupes de N.','Petits défis (toucher 3 murs, se serrer la main).','Cercle final d\'énergie.'],['« On inclut tout le monde. »'],['Espace dégagé.'],['Varier la taille des groupes.'],'8 min')],
    act1:[b('Capture du drapeau','Coopérer pour voler le drapeau adverse.',['Deux camps, un drapeau chacun.','Traverser pour le voler; touché = prison, libéré par un coéquipier.','Rapporter le drapeau pour gagner.'],['« On touche aux épaules, sans agripper. »'],['Zone-prison sécuritaire.'],['Ajouter des gardiens.','Plusieurs drapeaux.'],'18 min'),
      b('Ballon-chasseur','Viser juste en équipe.',['Deux camps séparés par une ligne.','Touché = banc; ballon attrapé = un coéquipier revient.','Équipe qui élimine l\'autre gagne.'],['« On vise sous la taille. »'],['Ballons mousse.'],['Plusieurs ballons.','Mode roi protégé.'],'18 min'),
      b('Poule, renard, vipère','Comprendre une logique d\'équipe en triangle.',['Trois équipes, chacune attrape l\'autre selon le cycle.','Attrapés rejoignent l\'équipe gagnante.','Dernière équipe avec des membres gagne.'],['« On reste dans sa zone de départ. »'],['Zones balisées.'],['Foulards d\'identification.'],'18 min')],
    act2:[b('Les déménageurs malins','Allier course et stratégie.',['Voler les objets du camp adverse sans se faire toucher.','Touché = on rapporte l\'objet.','Le plus d\'objets à la fin gagne.'],['« Un objet à la fois. »'],['Zone centrale neutre.'],['Limiter le temps.'],'16 min'),
      b('Zone interdite','Se déplacer en évitant les défenseurs.',['Traverser une zone gardée par 2-3 défenseurs.','Touché = on recommence.','Tous passés = défi réussi.'],['« On change de défenseurs souvent. »'],['Zone claire.'],['Élargir la zone.'],'16 min')],
    retour:[b('Cercle d\'équipe','Revenir au calme et nommer un bon coup.',['Assis en cercle, respirations lentes.','Chacun nomme un bon coup d\'un coéquipier.','Applaudissement collectif final.'],['« On écoute celui qui parle. »'],[],['Bâton de parole.'],'6 min')] },

  { dom:'Coopération', pfeqP:'C2', mat:['cerceaux','cordes','ballons','tapis'],
    titres:['Mieux ensemble','Le défi du groupe','Confiance & entraide','Mission impossible','Tous solidaires','Le pont humain','Objectif commun','La chaîne','Un pour tous'],
    warm:[b('Réveil coopératif','Coopérer dès l\'échauffement.',['En duos, miroir de mouvements.','Déplacements à deux reliés par un cerceau.','Cercle final qui se lève sans les mains.'],['« On s\'ajuste à son partenaire. »'],['Espacement.'],['Trios.'],'8 min')],
    act1:[b('Traverser la lave','Coopérer pour franchir un espace.',['Le sol est de la lave; seuls les tapis/cerceaux sont sûrs.','L\'équipe traverse en se passant les supports.','Un pied au sol = l\'équipe recommence.'],['« On s\'entraide, personne ne reste seul. »'],['Tapis stables.'],['Réduire le nombre de supports.'],'18 min'),
      b('Le noeud humain','Résoudre un problème ensemble.',['En cercle, chacun attrape deux mains au hasard.','Se démêler sans lâcher pour reformer le cercle.','Communication essentielle.'],['« On ne tire pas brusquement. »'],['Groupes de 6-8.'],['Yeux d\'un membre fermés.'],'18 min'),
      b('Transport d\'équipe','Atteindre un objectif commun.',['Transporter un ballon sans les mains, à plusieurs.','Trajet imposé avec obstacles.','Échappé = on repart du dernier plot.'],['« On avance au rythme du groupe. »'],['Parcours dégagé.'],['Plus d\'obstacles.'],'18 min')],
    act2:[b('La tour collective','Construire ensemble sous contrainte.',['Avec le matériel donné, bâtir la plus haute structure stable.','Temps limité, tout le monde participe.','Présentation des tours.'],['« Chaque idée compte. »'],['Matériel léger.'],['Sans parler.'],'16 min'),
      b('Le parachute','Coopérer au parachute (sans élimination).',['Vagues, champignon, échanges de places sous la toile.','Tous tiennent et écoutent les signaux.','Variante balle qui rebondit.'],['« On tient bien, on suit le meneur. »'],['Espace large.'],['Adapté assis.'],'16 min')],
    retour:[b('Merci d\'équipe','Clore sur une note positive.',['Cercle, respirations lentes.','Chacun remercie un coéquipier.','Étirements doux.'],['« On regarde la personne qu\'on remercie. »'],[],[],'6 min')] },

  { dom:'Gymnastique & équilibre', pfeqP:'C1', mat:['tapis','bancs','cerceaux'],
    titres:['Petits acrobates','En équilibre','Roulades & appuis','Le cirque','Postures et contrôle','Gym au sol','Funambules','Souplesse & force','Acro-défis'],
    warm:[b('Échauffement articulaire','Préparer les articulations.',['Mobilisation cou, épaules, poignets, hanches, chevilles.','Gainage court (planche 15 s).','Étirements dynamiques.'],['« On bouge lentement et en contrôle. »'],['Tapis pour le sol.'],[],'8 min')],
    act1:[b('Ateliers gymniques','Explorer appuis, roulades et équilibres.',['Stations: roulade avant, équilibre sur banc, appui renversé assisté.','Rotation par petits groupes, 1 aide par station.','Progression à son rythme.'],['« On passe un à la fois sur le tapis. »'],['Tapis épais, parade de l\'adulte.'],['Niveaux par station.'],'20 min'),
      b('Parcours d\'équilibre','Maîtriser son équilibre dynamique.',['Marcher sur le banc, franchir, descendre en contrôle.','Variantes: sur la pointe, à reculons, objet sur la tête.','2-3 passages.'],['« Regard loin devant. »'],['Hauteur faible, tapis.'],['Yeux mi-clos.'],'18 min')],
    act2:[b('Statues & figures','Contrôler son corps en duo.',['En duos, créer des figures stables tenues 5 s.','Le partenaire assure la sécurité.','Présentation d\'une figure au groupe.'],['« On assure son partenaire. »'],['Au sol sur tapis.'],['Trios.'],'14 min')],
    retour:[b('Étirements de gym','Relâcher en souplesse.',['Étirements doux dos, jambes, épaules.','Respiration profonde allongé.','Rangement des tapis.'],['« On ne force jamais l\'étirement. »'],[],[],'6 min')] },

  { dom:'Athlétisme', pfeqP:'C1', mat:['cônes','sacs de sable','rubans','chrono'],
    titres:['Mini-olympiens','Cours, saute, lance','Records personnels','La piste','Lancer loin','Sauts d\'athlète','Vitesse pure','Défis d\'athlétisme','Vers le podium'],
    warm:[b('Échauffement d\'athlète','Préparer à l\'effort.',['Footing léger, gammes (talons-fesses, montées de genoux).','Accélérations progressives.','Mobilité chevilles et hanches.'],['« On augmente l\'intensité petit à petit. »'],['Piste dégagée.'],[],'8 min')],
    act1:[b('Ateliers athlétisme','Découvrir course, saut et lancer.',['Stations: sprint court, saut en longueur (pieds joints), lancer de précision.','Chacun note son meilleur essai.','Rotation des ateliers.'],['« On lance seulement vers la zone. »'],['Zones de lancer dégagées.'],['Mesurer ses progrès.'],'20 min'),
      b('Relais d\'équipe','Travailler la vitesse et le passage de relais.',['Équipes en couloirs, relais avec témoin.','Zone d\'échange respectée.','3 manches, on vise la fluidité.'],['« On part dans son couloir. »'],['Couloirs séparés.'],['Relais navette.'],'18 min')],
    act2:[b('Défi sauts','Améliorer la détente et la coordination.',['Concours de saut (longueur, multibonds) en sécurité.','3 essais, on garde le meilleur.','Encouragements d\'équipe.'],['« On réceptionne sur les deux pieds. »'],['Réception sur tapis/sable.'],['Saut avec élan.'],'14 min')],
    retour:[b('Retour au calme actif','Récupérer après l\'effort.',['Marche, respirations, étirements ciblés jambes.','Hydratation.','Bilan de ses records.'],['« On boit de l\'eau. »'],[],[],'6 min')] },

  { dom:'Danse & expression', pfeqP:'C2', mat:['musique','foulards'],
    titres:['En rythme','Corps et musique','Chorégraphes','Expression libre','Danse du monde','Mime & mouvement','Le grand spectacle','Rythme et coordination','Bouge ton style'],
    warm:[b('Réveil rythmé','Entrer dans le rythme.',['Suivre le tempo: frappes de mains, pas marqués.','Échauffement dansé guidé.','Isolation des parties du corps.'],['« On suit le rythme, à sa manière. »'],['Espace dégagé.'],[],'8 min')],
    act1:[b('Création de chorégraphie','Créer et mémoriser une séquence.',['En petits groupes, inventer 8 mouvements sur la musique.','Répéter et synchroniser.','Présentation aux autres.'],['« Toutes les idées sont bonnes. »'],['Zones par groupe.'],['Ajouter accessoires (foulards).'],'20 min'),
      b('Miroir et contrastes','Explorer l\'expression corporelle.',['En duos, jeu du miroir (lent/rapide, grand/petit).','Inverser les rôles.','Partager une trouvaille au groupe.'],['« On reste concentré sur son duo. »'],[],['Trios en chaîne.'],'18 min')],
    act2:[b('Statues dansantes','Allier mouvement et contrôle.',['Danser, figer au signal dans une pose imposée (thème).','Varier les thèmes (animal, robot).','Dernier à figer relance.'],['« On fige net au signal. »'],[],['Poses en duo.'],'14 min')],
    retour:[b('Relaxation guidée','Revenir au calme par la respiration.',['Allongé, balayage corporel guidé.','Respiration lente.','Réveil en douceur.'],['« On ferme les yeux si on veut. »'],[],[],'6 min')] },

  { dom:'Jeux de précision', pfeqP:'C1', mat:['poches','cibles','quilles','cerceaux'],
    titres:['Dans le mille','Maîtres viseurs','Cibles & adresse','Quilles et poches','Précision au top','Le tir parfait','Adresse en folie','Vise et marque','Champions de visée'],
    warm:[b('Échauffement d\'adresse','Préparer le geste de lancer.',['Lancers doux d\'une poche sur place, deux mains puis une.','Cercles de bras et poignets.','Lancers à un partenaire proche.'],['« On contrôle le geste. »'],['Espacement.'],[],'8 min')],
    act1:[b('Parcours de cibles','Améliorer la précision à distances variées.',['Stations de cibles (cerceaux au sol, quilles, paniers).','5 essais par station, on compte les points.','Rotation.'],['« On récupère au signal. »'],['Zone de tir balisée.'],['Cibles plus loin/petites.'],'20 min'),
      b('Pétanque-poches','Viser un point cible avec finesse.',['Lancer ses poches le plus près du « cochonnet ».','Tours alternés en équipes.','On mesure la distance.'],['« On attend que la zone soit vide. »'],[],['Cible mobile.'],'18 min')],
    act2:[b('Bowling de gym','Renverser des quilles avec dosage.',['Faire rouler/ lancer pour renverser les quilles.','Points selon les quilles tombées.','Rotation rapide.'],['« On lance à ras le sol. »'],['Couloir dégagé.'],['Reculer la ligne.'],'14 min')],
    retour:[b('Calme et concentration','Recentrer après l\'effort fin.',['Respirations lentes assis.','Étirements bras/épaules.','Rangement précis du matériel.'],['« On respire calmement. »'],[],[],'6 min')] },

  { dom:'Initiation sports collectifs', pfeqP:'C2', mat:['ballons','buts','dossards','cônes'],
    titres:['Mini-soccer','Initiation basket','Hockey cosom','Ultimate junior','Handball découverte','Tchoukball','Volley ballon','Kin-ball','Sport-passion'],
    warm:[b('Échauffement spécifique','Préparer aux gestes du sport du jour.',['Footing avec ballon, conduites simples.','Passes en duos.','Tirs/échanges légers.'],['« On garde la tête haute. »'],['Aire de jeu dégagée.'],[],'8 min')],
    act1:[b('Ateliers techniques','Apprendre les gestes de base.',['Stations: passe, conduite/dribble, tir.','Démonstration puis pratique guidée.','Rotation par groupes.'],['« On vise la précision avant la force. »'],['Espaces séparés.'],['Main/pied faible.'],'20 min'),
      b('Matchs adaptés','Mettre en jeu les apprentissages.',['Petits matchs (3v3/4v4) règles simplifiées.','Rotation fréquente, tout le monde joue.','Bonus pour les passes avant de marquer.'],['« On joue le ballon, fair-play. »'],['Zones réduites.'],['Imposer N passes avant tir.'],'18 min')],
    act2:[b('Défi habiletés','Consolider une habileté clé.',['Concours d\'habileté (précision de tir/passe).','Essais comptés, encouragements.','Bilan des progrès.'],['« On respecte les tours. »'],[],['Cible plus exigeante.'],'14 min')],
    retour:[b('Retour fair-play','Revenir au calme et valoriser le respect.',['Étirements, respirations.','On nomme un geste fair-play vu.','Rangement.'],['« On félicite l\'adversaire. »'],[],[],'6 min')] },

  { dom:'Conditionnement ludique', pfeqP:'C3', mat:['tapis','cônes','chrono','cordes'],
    titres:['En forme!','Circuit énergie','Défi cardio','Mission santé','Bouge ton coeur','Fit-jeu','Endurance fun','Force & souplesse','Santé active'],
    warm:[b('Activation cardio','Élever le rythme en s\'amusant.',['Jeu de course doux (jacques a dit actif).','Mobilité générale.','Accélérations courtes.'],['« On écoute son corps. »'],['Espace dégagé.'],[],'8 min')],
    act1:[b('Circuit-stations','Travailler les capacités physiques en s\'amusant.',['Stations: saut à la corde, gainage, déplacements, sauts.','30 s effort / 20 s repos, rotation.','2 tours selon la forme.'],['« On adapte l\'intensité à soi. »'],['Hydratation prévue.'],['Plus/moins de tours.'],'20 min'),
      b('Tabata junior','Découvrir l\'effort fractionné ludique.',['8 rounds de 20 s d\'exercice / 10 s repos.','Exercices simples (sauts, montées de genoux).','Encouragements collectifs.'],['« On garde une bonne posture. »'],['Repères au sol.'],['Réduire les rounds.'],'16 min')],
    act2:[b('Jeu d\'endurance','Maintenir un effort modéré dans le jeu.',['Grand jeu de course continue (épervier, relais longs).','Pauses-eau régulières.','Plaisir avant performance.'],['« On respire régulièrement. »'],['Pauses prévues.'],['Zones plus grandes.'],'14 min')],
    retour:[b('Récupération & bilan santé','Récupérer et parler saines habitudes.',['Étirements complets, respiration.','Discussion: comment se sent le corps après l\'effort?','Hydratation.'],['« On boit et on respire. »'],[],[],'6 min')] }
];

const pick = (a,i)=>a[((i%a.length)+a.length)%a.length];

function buildCycle(cycleKey){
  const C = CYCLES[cycleKey];
  const cours = [];
  for(let i=0;i<90;i++){
    const d = DOMAINS[i % DOMAINS.length];
    const v = Math.floor(i / DOMAINS.length); // 0..8
    const titre = pick(d.titres, v).toUpperCase();
    const per = i<30?0:i<60?1:2;
    const a1 = pick(d.act1, v), a2 = pick(d.act2, v+1), w = pick(d.warm, v), r = pick(d.retour, v);
    const pfeq = d.pfeqP==='C3' ? ['C3','C1'] : (d.pfeqP==='C2' ? ['C2','C1','C3'] : ['C1','C2','C3']);
    cours.push({
      id: i+1, titre, niveau: C.niveau, duree:'60 minutes',
      espace:'Gymnase ou grand espace dégagé', eleves: C.eleves,
      pfeq_principale: d.pfeqP+' — domaine : '+d.dom,
      pfeq_secondaire: '', pfeq,
      intention: `Cours du domaine « ${d.dom} » (${titre}). ${C.diff} L'élève développe ses habiletés à travers une mise en train, deux activités et un retour au calme, en lien avec la compétence ${d.pfeqP}.`,
      materiel: d.mat,
      preparation: ['Délimiter l\'aire de jeu et les zones de sécurité.','Sortir et répartir le matériel par station.','Préparer le signal d\'arrêt et les équipes.'],
      mise_en_train: w, activite_1: a1, activite_2: a2, retour: r,
      astuce:'Garder les transitions courtes : le matériel est prêt et les équipes formées à l\'avance.',
      evaluation:`Observer l\'engagement moteur et le respect des consignes (${d.pfeqP}).`,
      prolongement:'Reprendre l\'activité gagnante en complexifiant les règles au prochain cours.',
      groupe: (per*30+1)+'-'+((per+1)*30), periode: PERIODES[per]
    });
  }
  return cours;
}

for(const k of Object.keys(CYCLES)){
  const data = buildCycle(k);
  fs.writeFileSync(__dirname+'/ep-'+k+'.json', JSON.stringify(data));
  console.log('ep-'+k+'.json :', data.length, 'cours');
}
