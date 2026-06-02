/* Génère sdg.json — 200 jours (40 sem. × 5), 2 blocs/jour. Contenu ENRICHI :
   chaque item a objectif (but), déroulement, variantes, astuce, matériel. node _generate-sdg.js */
const fs = require('fs');
const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];

function theme(s){
  if(s<=4)  return '🍂 Rentrée & nouvelles amitiés';
  if(s<=8)  return '🍁 Automne & couleurs';
  if(s<=12) return '🧤 Vers l\'hiver';
  if(s<=16) return '🎁 Fêtes & partage';
  if(s<=21) return '❄️ Plein hiver';
  if(s<=25) return '⛄ Carnaval & jeux de neige';
  if(s<=30) return '🌱 Le printemps arrive';
  if(s<=35) return '🌷 Nature & grand air';
  return '☀️ Vers l\'été';
}
// rb : item enrichi
const rb=(type,nom,desc,but,der,vari,astuce,lieu,mat)=>({type,nom,desc,but,deroulement:der,variantes:vari,astuce,lieu,materiel:mat||[]});

const ACCUEIL = [
  rb('accueil','Coin lecture','Livres et albums au choix, ambiance feutrée à l\'arrivée.','Offrir un retour au calme à l\'arrivée et donner le goût de lire.',
    ['Disposer coussins et livres dans un coin défini.','Accueillir chaque enfant par son prénom, l\'inviter à choisir un livre.','Lecture autonome ou à deux jusqu\'au rassemblement.'],
    ['Ajouter des marionnettes pour « lire » l\'histoire.','Coin écoute avec une histoire audio.'],'Renouveler les livres chaque semaine selon le thème pour relancer l\'intérêt.','local',['livres','coussins']),
  rb('accueil','Coin dessin libre','Feuilles et crayons; thème libre sur musique douce.','Permettre une transition douce et l\'expression créative.',
    ['Préparer feuilles et crayons aux tables.','Proposer un thème ouvert (mon week-end, mon animal préféré).','Afficher quelques dessins sur le babillard.'],
    ['Dessin collectif sur une grande feuille.','Mandalas à colorier pour les plus grands.'],'Mettre une musique instrumentale douce pour baisser le niveau sonore.','local',['feuilles','crayons']),
  rb('accueil','Casse-têtes & jeux calmes','Tables de casse-têtes et petits jeux de société à l\'accueil.','Stimuler la concentration et la coopération dès le matin.',
    ['Installer 3-4 tables avec un jeu différent chacune.','Les enfants choisissent et changent librement.','Ranger ensemble au signal.'],
    ['Défi : compléter un casse-tête en équipe avant le rassemblement.'],'Garder des jeux de 5-10 min pour qu\'ils puissent les finir.','local',['casse-têtes','jeux de société']),
  rb('accueil','Coin construction','Blocs et briques; bâtir librement, seul ou à deux.','Développer la motricité fine et l\'imaginaire au réveil.',
    ['Sortir les bacs de blocs dans la zone tapis.','Lancer un mini-défi (la plus haute tour, un pont).','Photo des constructions avant de ranger.'],
    ['Thème de construction lié à la semaine (un château, une fusée).'],'Un tapis délimite la zone et évite que les blocs se dispersent.','local',['blocs']),
  rb('accueil','Pâte à modeler','Modelage libre aux tables, pour se centrer en douceur.','Apaiser et travailler la motricité fine des doigts.',
    ['Distribuer une boule de pâte par enfant.','Proposer un défi simple (façonne ton animal préféré).','Exposer les créations quelques minutes.'],
    ['Ajouter emporte-pièces et rouleaux.'],'Garder la pâte dans des contenants hermétiques pour la réutiliser.','local',['pâte à modeler']),
  rb('accueil','Coloriage thématique','Coloriages liés au thème de la semaine.','Transition calme + lien avec le thème en cours.',
    ['Imprimer des coloriages du thème.','Coin tranquille avec crayons de couleur.','Afficher une murale collective des coloriages.'],
    ['Coloriage géant collectif au sol.'],'Varier le thème chaque semaine pour garder la nouveauté.','local',['coloriages','crayons']),
  rb('accueil','Coin écoute','Histoire audio ou musique calme avec coussins.','Décompresser et développer l\'écoute.',
    ['Installer un coin coussins près de l\'enceinte.','Lancer une histoire audio courte.','Échange : qu\'avez-vous préféré?'],
    ['Histoire à deviner : on coupe avant la fin, ils inventent la suite.'],'Une veilleuse ou lumière tamisée renforce le calme.','local',['enceinte','coussins'])
];
const CALME = [
  rb('jeu_calme','Tour des humeurs','En cercle, chacun nomme son humeur du matin avec un geste.','Accueillir les émotions et créer le lien de groupe.',
    ['S\'asseoir en cercle.','Chacun dit son prénom + son humeur avec un geste.','Le groupe répète le geste pour le valoriser.'],
    ['Utiliser des cartes-émotions pour les plus jeunes.'],'Nommer aussi SA propre humeur d\'éducateur : ça donne l\'exemple.','local',[]),
  rb('jeu_calme','Devine le son','Yeux fermés, identifier les sons produits par l\'éducateur.','Développer l\'attention auditive et le calme.',
    ['Les enfants ferment les yeux.','Produire un son (froisser, taper, verser).','Ils devinent; on dévoile l\'objet.'],
    ['Les enfants produisent les sons à tour de rôle.'],'Commencer fort puis de plus en plus subtil pour capter l\'attention.','local',[]),
  rb('jeu_calme','Le roi du silence','Avancer en silence pour toucher la chaise sans se faire repérer.','Travailler la maîtrise de soi et la concentration.',
    ['Un « roi » assis, yeux bandés, garde une chaise.','Les autres avancent en silence pour la toucher.','Au moindre bruit, le roi pointe : on recule.'],
    ['Plusieurs objets à voler pour accélérer.'],'Idéal juste avant une transition pour calmer le groupe.','local',['1 chaise']),
  rb('jeu_calme','Memory géant','Cartes à retourner au sol, en équipes calmes.','Mémoire, tour de rôle et patience.',
    ['Disposer les paires de cartes face cachée.','Chaque équipe retourne 2 cartes à son tour.','Les paires trouvées sont retirées.'],
    ['Thème des cartes lié à la semaine.'],'Limiter à 12-16 cartes pour les petits.','local',['cartes memory']),
  rb('jeu_calme','Yoga des animaux','Postures douces (chat, arbre, cobra) tenues en respirant.','Détente corporelle et respiration.',
    ['Montrer une posture à la fois.','Tenir 15 s en respirant lentement.','Enchaîner 4-5 postures puis relaxation.'],
    ['Inventer une histoire qui relie les postures.'],'Voix lente et douce : le ton donne le rythme.','local',['tapis']),
  rb('jeu_calme','Histoire à rebondir','On construit une histoire, chacun ajoute une phrase.','Imagination, écoute et expression orale.',
    ['L\'éducateur lance le début.','Chacun ajoute une phrase à tour de rôle.','On termine tous ensemble par « FIN ».'],
    ['Piger un objet/mot à inclure dans sa phrase.'],'Relancer si ça bloque avec une question ouverte.','local',[]),
  rb('jeu_calme','Téléphone arabe','Transmettre une phrase chuchotée jusqu\'au dernier.','Écoute attentive et plaisir partagé.',
    ['Une phrase chuchotée passe d\'oreille en oreille.','Le dernier la dit tout haut.','On compare avec l\'originale.'],
    ['Version dessin : on transmet un dessin au lieu d\'une phrase.'],'Phrases drôles = fous rires garantis.','local',[]),
  rb('jeu_calme','Dessin coopératif','Une grande fresque où chacun ajoute un élément.','Coopération et créativité collective.',
    ['Dérouler une grande feuille au sol.','Chacun ajoute un élément à tour de rôle.','On nomme la fresque ensemble.'],
    ['Thème imposé (notre cour de rêve).'],'Afficher la fresque : fierté collective.','local',['grande feuille','crayons'])
];
const ACTIF_M = [
  rb('jeu_actif','Statues musicales','On bouge, on fige au signal; doux réveil du corps.','Activer le corps en douceur avant l\'école.',
    ['Mettre la musique, les enfants bougent.','À l\'arrêt, tout le monde fige.','Qui bouge fait une grimace puis repart.'],
    ['Figer dans une pose imposée (animal, lettre).'],'Varier la vitesse de la musique pour doser l\'énergie.','local',['musique']),
  rb('jeu_actif','Jacques a dit','Mouvements guidés pour se dégourdir avant l\'école.','Écoute des consignes + mise en mouvement.',
    ['« Jacques a dit : saute! » → on exécute.','Sans « Jacques a dit », on ne bouge pas.','Erreur = on fait une pirouette rigolote.'],
    ['Un enfant devient le meneur.'],'Enchaîner tête, bras, jambes pour réveiller tout le corps.','local',[]),
  rb('jeu_actif','Déplacements d\'animaux','Traverser le local en ours, crabe, grenouille.','Motricité globale variée.',
    ['Nommer un animal et son déplacement.','Traverser la zone à sa manière.','Changer d\'animal à chaque retour.'],
    ['Parcours avec un animal par section.'],'Demander aussi le cri de l\'animal : plus d\'engagement.','local',[]),
  rb('jeu_actif','Parcours express','Mini-parcours coussins/cônes à enchaîner 2-3 fois.','Coordination et équilibre.',
    ['Monter un court circuit (slalom, saut, équilibre).','Passage individuel en continu.','2-3 tours, on cherche la fluidité.'],
    ['Chronométrer pour le plaisir.'],'Tapis sous les zones de saut pour la sécurité.','local',['coussins','cônes']),
  rb('jeu_actif','Danse du matin','Courte chorégraphie simple à suivre ensemble.','Réveil énergique et coordination.',
    ['Montrer 4 mouvements simples.','Les répéter sur la musique.','Enchaîner de plus en plus vite.'],
    ['Les enfants proposent un mouvement chacun.'],'Une chanson connue = adhésion immédiate.','local',['musique']),
  rb('jeu_actif','Chaises coopératives','Variante de la chaise musicale où l\'on s\'entraide.','Coopération + écoute du signal.',
    ['On enlève une chaise à chaque tour.','À l\'arrêt, tout le monde doit s\'asseoir (même sur les genoux).','But commun : tenir sur le moins de chaises.'],
    ['Bancs au lieu de chaises pour la sécurité.'],'On ne pousse pas : insister sur l\'entraide.','local',['chaises'])
];
const ACTIF_S = [
  rb('jeu_actif','Poule, renard, vipère','Trois équipes se chassent en triangle dans la cour.','Défoulement et logique d\'équipe.',
    ['3 équipes : poule attrape vipère, vipère renard, renard poule.','Attrapé = rejoint l\'équipe gagnante.','Dernière équipe avec des membres gagne.'],
    ['Foulards de couleur pour s\'identifier.'],'Bien délimiter les zones-camps pour éviter les collisions.','cour',['dossards']),
  rb('jeu_actif','Ballon-chasseur doux','Ballons mousse, élimination douce et retour rapide au jeu.','Adresse, esquive et plaisir.',
    ['Deux camps séparés par une ligne.','Touché sous la taille = banc; balle attrapée = un coéquipier revient.','Équipe qui élimine l\'autre gagne la manche.'],
    ['Plusieurs ballons; mode « roi » à protéger.'],'Manches courtes pour que tout le monde rejoue vite.','cour',['ballons mousse']),
  rb('jeu_actif','Capture du foulard','Voler le foulard du camp adverse sans se faire toucher.','Stratégie d\'équipe et course.',
    ['Chaque camp garde son foulard.','Traverser pour le voler; touché = prison, libéré par un coéquipier.','Rapporter le foulard pour gagner.'],
    ['Plusieurs foulards; gardiens désignés.'],'Zone-prison près de la ligne pour des libérations possibles.','cour',['foulards','cônes']),
  rb('jeu_actif','Grand jeu de course','Relais et courses variées par équipes.','Vitesse, coordination, esprit d\'équipe.',
    ['Équipes en colonnes derrière la ligne.','Relais aller-retour, transmission par la main.','3 manches avec modes variés.'],
    ['Relais avec transport d\'objet.'],'Couloirs bien séparés pour éviter les contacts.','cour',['cônes']),
  rb('jeu_actif','Soccer libre','Match amical encadré, équipes mixtes.','Jeu collectif et plaisir du ballon.',
    ['Former des équipes équilibrées.','Petits matchs avec rotation fréquente.','Valoriser les passes avant les buts.'],
    ['Plusieurs petits terrains pour jouer plus.'],'Imposer un nombre de passes avant de marquer = plus de coopération.','cour',['ballon','buts']),
  rb('jeu_actif','Kickball','Croisement baseball-soccer, tout le monde frappe.','Course, frappe au pied et jeu d\'équipe.',
    ['Le frappeur botte le ballon roulé et court aux buts.','L\'équipe en défense récupère et fait le tour.','Rotation des rôles.'],
    ['Plusieurs buts pour accélérer.'],'Tout le monde frappe avant de changer de rôle.','cour',['ballon','buts']),
  rb('jeu_actif','Parcours d\'obstacles','Circuit extérieur d\'adresse et d\'équilibre.','Motricité globale et dépassement.',
    ['Installer un circuit (cônes, cerceaux, bancs).','Passage en continu, on s\'encourage.','Tours libres à son rythme.'],
    ['Chrono pour le plaisir; version en équipe.'],'Prévoir une file d\'attente courte pour rester actif.','cour',['cônes','cerceaux']),
  rb('jeu_actif','Drapeau-défis','Capture du drapeau avec mini-épreuves aux stations.','Stratégie, course et coopération.',
    ['Deux camps, un drapeau chacun.','Réussir une mini-épreuve pour gagner une immunité.','Voler le drapeau adverse pour gagner.'],
    ['Ajouter des zones neutres.'],'Mélanger épreuves physiques et énigmes pour varier.','cour',['drapeaux','cônes'])
];
const ATELIER_S = [
  rb('jeu_calme','Bricolage récup','Créer un objet libre à partir de matériel recyclé.','Créativité et réemploi.',
    ['Mettre à disposition carton, bouchons, rouleaux.','Chacun fabrique un objet en 25 min.','Mini-expo des créations.'],
    ['Thème imposé lié à la semaine.'],'Garder une boîte de récup toute l\'année pour ne jamais manquer.','local',['carton','colle','retailles']),
  rb('jeu_calme','Atelier dessin','Dessin guidé ou libre lié au thème de la semaine.','Expression et motricité fine.',
    ['Proposer un thème (mon héros, ma saison).','Dessin libre avec crayons/feutres.','Partage volontaire au groupe.'],
    ['Dessin à 4 mains en duo.'],'Afficher une « galerie de la semaine » au mur.','local',['feuilles','crayons']),
  rb('jeu_calme','Jeux de société','Tournoi amical de jeux de plateau en petits groupes.','Stratégie, tour de rôle, fair-play.',
    ['Répartir les jeux par table selon l\'âge.','Parties courtes, rotation des joueurs.','On félicite les adversaires à la fin.'],
    ['Mini-tournoi avec classement amical.'],'Choisir des jeux de 10-15 min pour boucler une partie.','local',['jeux de société']),
  rb('jeu_calme','Coin construction libre','Défis de construction (la plus haute tour, un pont).','Logique, motricité fine, persévérance.',
    ['Donner un défi de construction.','Travail seul ou en équipe.','Présenter sa structure.'],
    ['Contrainte : tenir un objet sur la structure.'],'Photographier les réussites pour un « mur des bâtisseurs ».','local',['blocs']),
  rb('jeu_calme','Atelier scientifique','Petite expérience simple et sécuritaire à observer.','Curiosité et observation.',
    ['Présenter l\'expérience (volcan, densité, bulles).','Observer et décrire ce qui se passe.','Émettre une hypothèse ensemble.'],
    ['Les enfants prédisent avant l\'expérience.'],'Toujours tester l\'expérience avant pour éviter les surprises.','local',['matériel d\'expérience']),
  rb('jeu_calme','Cuisine sans cuisson','Brochettes de fruits ou trempettes à préparer ensemble.','Autonomie, hygiène et plaisir partagé.',
    ['Lavage des mains obligatoire.','Préparer des brochettes/trempettes simples.','Déguster ensemble.'],
    ['Décorer une assiette « visage rigolo ».'],'Vérifier les allergies AVANT toute activité alimentaire.','local',['aliments','ustensiles']),
  rb('jeu_calme','Lecture & BD','Coin lecture libre, albums et bandes dessinées.','Plaisir de lire et retour au calme.',
    ['Coin confortable avec choix de livres.','Lecture autonome ou à deux.','Échange : un coup de cœur à partager.'],
    ['Lecture à voix haute par un grand pour les petits.'],'Une sélection BD attire souvent les réticents à la lecture.','local',['livres']),
  rb('jeu_calme','Aide aux devoirs','Temps calme encadré pour les devoirs, par niveau.','Soutien scolaire et autonomie.',
    ['Regrouper par niveau, espace calme.','Soutien individuel au besoin.','Vérification et rangement du matériel.'],
    ['Tutorat : un grand aide un plus jeune.'],'Un coin « j\'ai fini » avec activité calme évite le bruit.','local',['matériel scolaire'])
];
const RETOUR_M = [
  rb('retour','Transition vers les classes','Rangement en chanson, rappel des consignes, départ calme au signal.','Transition ordonnée et sereine vers l\'école.',
    ['Chanson de rangement pour ramasser ensemble.','Rappel des consignes de la journée.','Départ par petits groupes au signal.'],
    ['Désigner des « capitaines de rangement ».'],'Toujours la même chanson : le rituel accélère le rangement.','local',[]),
  rb('retour','File tranquille','On se met en rang en silence et on rejoint les classes.','Calme avant la transition.',
    ['Signal de rassemblement.','Mise en rang en silence.','Marche calme vers les classes.'],
    ['Marcher « comme une fourmi » (lent et silencieux).'],'Féliciter le rang le plus calme pour renforcer.','local',[])
];
const DEPART_S = [
  rb('retour','Départ échelonné','Coin calme près de la porte, jeu de société tranquille en attendant les parents.','Fin de journée sereine et sécuritaire.',
    ['Regrouper le matériel et ranger.','Coin calme près de la sortie.','Jeu tranquille en attendant les parents.'],
    ['Petit bilan : mon moment préféré aujourd\'hui.'],'Garder un registre des départs pour la sécurité.','local',['jeux de société']),
  rb('retour','Cercle de fin','Bilan de la journée et rangement avant le départ.','Clore positivement et reconnaître les bons coups.',
    ['Cercle, respirations lentes.','Chacun nomme un bon moment.','Applaudissement collectif, puis rangement.'],
    ['Bâton de parole qui circule.'],'Terminer sur une note positive aide le retour à la maison.','local',[])
];
const planPluie = a => rb('plan_pluie','Plan B pluie',`Si la cour est inaccessible, « ${a.nom} » se transforme en version intérieure.`,'Garder l\'activité possible malgré la météo.',
  [`Déplacer « ${a.nom} » au gymnase si libre.`,'Sinon : parcours moteur ou chaises coopératives en local.','Réduire l\'espace et le nombre de joueurs au besoin.'],
  ['Alterner avec un jeu calme si l\'énergie monte trop.'],'Avoir TOUJOURS un plan intérieur prêt évite l\'improvisation.','gym',['tapis','coussins']);
const COLLATION = rb('accueil','Collation & détente','Lavage des mains, collation et temps calme pour décompresser de l\'école.','Recharger les batteries après l\'école.',
  ['Lavage des mains, collation assise.','Temps calme (musique douce, discussion libre).','Transition vers l\'activité du soir.'],
  ['Coin discussion : « le meilleur moment de ma journée ».'],'Vérifier les allergies; prévoir une collation de secours.','local',['collation']);

const pick=(a,i)=>a[((i%a.length)+a.length)%a.length];
const days=[];
for(let j=0;j<200;j++){
  const semaine=Math.floor(j/5)+1, jourSem=j%5;
  const acc=pick(ACCUEIL,j), cal=pick(CALME,j*2+1), actM=pick(ACTIF_M,j+jourSem), retM=pick(RETOUR_M,j);
  const actS=pick(ACTIF_S,j*3+2), ate=pick(ATELIER_S,j*2), dep=pick(DEPART_S,j);
  days.push({
    jour:j+1, semaine, jourSem:jourSem+1,
    label:`Semaine ${semaine} · ${JOURS[jourSem]}`, theme:theme(semaine),
    blocs:{
      matin:{ plage:'7 h 00 – 9 h 00', items:[acc,cal,actM,planPluie(actM),retM] },
      aprem:{ plage:'15 h 00 – 18 h 00', items:[COLLATION,actS,ate,planPluie(actS),dep] }
    },
    tags:{ age:['5-12'], lieu:['local','cour','gym'], moment:'matin', contexte:['plan_pluie'] }
  });
}
fs.writeFileSync(__dirname+'/sdg.json', JSON.stringify(days));
console.log('sdg.json :', days.length, 'jours — items enrichis (but, déroulement, variantes, astuce)');
