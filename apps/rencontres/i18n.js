/* Zone Rencontres — traduction de l'interface.
   ==========================================================================

   POURQUOI UN DICTIONNAIRE LOCAL PLUTOT QUE `shared/i18n/*.json`.

   Le dictionnaire partage est charge par TOUTES les pages du site — 1489 —
   et pese 6 ko. Cette app compte a elle seule ~250 chaines. Les y verser
   triplerait un fichier que 1488 pages telechargent sans jamais s'en servir.
   On garde donc le dictionnaire ici, avec l'app qui l'utilise.

   MAIS la LANGUE, elle, reste celle du site. `ZTS.langue()` est la seule
   definition de « quelle langue voit ce visiteur » (parametre `?lang=`, puis
   choix memorise, puis langue du navigateur), et `zts:langchange` est emis
   quand on clique FR/EN dans l'en-tete. On s'y branche au lieu d'inventer une
   deuxieme source de verite : c'est exactement la divergence que shared/zts.js
   a passe du temps a retirer du tunnel.

   TROIS FACONS DE S'EN SERVIR
   ---------------------------
   1. HTML statique  : `data-i18n="cle"` remplace le texte du noeud.
   2. Attributs      : `data-i18n-attr="placeholder:cle;title:cle2"`.
   3. JavaScript     : `RencI18n.t('cle')`, ou `t('cle', {nb: 3})` pour les
      chaines a trous. Les trous s'ecrivent `{nb}` dans le dictionnaire.

   La convention est celle de shared/zts.js, volontairement : quelqu'un qui
   connait l'une lit l'autre sans reapprendre.

   AJOUTER UNE CHAINE : la mettre dans FR **et** dans EN. Le controle
   `verifieCles()` plus bas crie dans la console si l'une manque, au
   chargement, en developpement comme en production — une cle absente rendrait
   silencieusement du francais dans une page anglaise, et personne ne le
   verrait avant un utilisateur. */

const RencI18n = (() => {
  'use strict';

  const FR = {
    /* ══ Barre d'outils et liste ══════════════════════════════════════ */
    'outils.rail':          '☰ Mes rencontres',
    'outils.nouvelle':      '+ Nouvelle rencontre',
    'outils.cherche':       'Chercher…',
    'outils.chercheAria':   'Chercher dans mes rencontres',
    'outils.filtreAria':    'Filtrer par type',
    'outils.tousTypes':     'Tous les types',
    'outils.enregistrer':   '💾 Enregistrer',
    'outils.mesActions':    '✅ Mes actions',
    'outils.autresActions': 'Autres actions',

    'type.comite':          'Comité',
    'type.statutaire':      'Statutaire',
    'type.autre':           'Autre',
    'type.comiteLong':      'Comité',
    'type.statutaireLong':  'Rencontre statutaire',
    'type.autreLong':       'Rencontre',

    'menu.suite':           '🔁 Créer la suite de cette rencontre',
    'menu.gabarit':         '📋 Partir d\'un gabarit d\'ordre du jour',
    'menu.envoyer':         '✉️ Envoyer par courriel',
    'menu.copier':          '📋 Copier le compte rendu',
    'menu.pdf':             '🖨️ Imprimer / PDF',
    'menu.txt':             '⬇️ Exporter en .txt',
    'menu.md':              '⬇️ Exporter en .md',
    'menu.voirOriginal':    '📄 Voir le texte original',
    'menu.partage':         '📤 Partager',
    'menu.supprimer':       '🗑️ Supprimer cette rencontre',

    /* ══ Reseau ═══════════════════════════════════════════════════════ */
    'reseau.horsLigne':     '📴 Pas de réseau. Tes notes continuent de s\'enregistrer sur cet appareil ; la transcription et l\'IA reprendront au retour de la connexion.',

    /* ══ Rail — dossiers ══════════════════════════════════════════════ */
    'rail.aria':            'Mes dossiers et mes rencontres',
    'rail.dossiers':        'MES DOSSIERS',
    'rail.nouveauDossier':  '➕ Nouveau dossier',
    'rail.rencontres':      'RENCONTRES',
    'rail.vide':            'Aucune rencontre pour l\'instant.',
    'rail.videAide':        'Le bouton « + Nouvelle rencontre » en crée une.',
    'rail.renommer':        'Renommer {nom}',
    'rail.supprimerDossier':'Supprimer {nom}',
    'rail.jeter':           'Supprimer « {titre} »',
    'rail.sansTitre':       'Sans titre',
    'rail.videFiltre':      'Aucune rencontre ne correspond.',
    'rail.videFiltreAide':  'Il y en a {nb} en tout — enlève un filtre pour les revoir.',
    'souci.directRefuse':   'Le navigateur n\'autorise pas l\'écriture en direct. L\'enregistrement continue : le texte s\'écrira à la fin.',
    'souci.directReseau':   'Réseau instable — l\'écriture en direct s\'est interrompue. L\'enregistrement continue.',
    'souci.directArrete':   'L\'écriture en direct s\'est arrêtée. L\'enregistrement continue : le texte s\'écrira à la fin.',
    'souci.interrompu':     '⚠ L\'enregistrement a été interrompu. Ce qui a été capté jusqu\'ici est conservé.',
    'souci.arretImpossible':'⚠ L\'arrêt de l\'enregistrement a échoué. Recharge la page ; ce qui est déjà écrit est conservé.',
    'micro.refuseCourt':    'Le micro a été refusé. Autorise-le dans la barre d\'adresse, puis redémarre.',
    'micro.absent':         'Aucun micro détecté sur cet appareil.',
    'micro.indisponible':   'Ce navigateur ne donne pas accès au micro.',
    'micro.enregIndisponible':'Ce navigateur ne sait pas enregistrer l\'audio.',
    'micro.erreur':         'Le micro n\'a pas pu démarrer.',

    /* ══ Accueil ══════════════════════════════════════════════════════ */
    'accueil.titre':        'ZONE RENCONTRES',
    'accueil.sous':         'Comité, rencontre statutaire, rencontre de parents. Tu prends les notes, tu parles, ou tu déposes l\'enregistrement — le compte rendu s\'écrit.',
    'accueil.ecrireNom':    'Écrire',
    'accueil.ecrireDesc':   'Tes notes, sauvegardées toutes les 10 secondes. Fonctionne sans réseau.',
    'accueil.parlerNom':    'Parler',
    'accueil.parlerDesc':   'Le micro écoute la rencontre et écrit à ta place.',
    'accueil.deposerNom':   'Déposer',
    'accueil.deposerDesc':  'Ton fichier Zoom, Teams ou Meet, déposé ici et transcrit.',

    /* ══ Retour et ecrans ═════════════════════════════════════════════ */
    'ecran.retour':         '← Retour à mes rencontres',
    'ecran.modifier':       'Modifier',
    'ecran.detailAria':     'La rencontre ouverte',

    /* ══ Mes actions ══════════════════════════════════════════════════ */
    'actions.titre':        'MES ACTIONS',
    'actions.aria':         'Mes actions',
    'actions.voirFaites':   'Montrer aussi ce qui est fait',
    'ech.sans':             'Sans échéance',
    'ech.retard':           'En retard',
    'ech.jour':             'Aujourd\'hui',
    'ech.semaine':          'Dans les 7 prochains jours',
    'ech.apres':            'Plus tard',
    'actions.videSansRencontre':'Aucune rencontre pour l\'instant. Les actions apparaissent ici dès qu\'un compte rendu en produit.',
    'actions.videUne':      'Aucune action dans ta rencontre. Le bouton « Écrire le compte rendu » en tire.',
    'actions.videPlusieurs':'Aucune action dans tes {nb} rencontres. Le bouton « Écrire le compte rendu » en tire.',
    'actions.toutCoche':    'Rien à faire — tout est coché. 🎉',
    'actions.echecCase':    '⚠ La case n\'a pas pu être enregistrée ({erreur}).',
    'gab.ajoute':           'Gabarit « {nom} » ajouté en tête des notes.',
    'suite.ouvreDabord':    'Ouvre une rencontre d\'abord.',
    'suite.reporteDe':      'Reporté de la rencontre précédente',
    'suite.unPoint':        '1 point reporté',
    'suite.desPoints':      '{nb} points reportés',
    'suite.uneAction':      '1 action encore ouverte',
    'suite.desActions':     '{nb} actions encore ouvertes',
    'suite.et':             ' et ',
    'suite.creeeAvec':      'Suite créée avec {quoi}. Enregistre quand tu veux.',
    'suite.creeeVide':      'Suite créée — rien n\'était en attente.',
    'actions.rien':         'Rien à faire pour l\'instant.',
    'actions.toutFait':     'Tout est fait. 🎉',
    'actions.enRetard':     'en retard',
    'actions.pour':         'pour le {date}',

    /* ══ En-tete ══════════════════════════════════════════════════════ */
    'entete.titrePh':       'Titre de la rencontre',
    'entete.date':          'Date',
    'entete.dateAria':      'Date de la rencontre',
    'entete.type':          'Type',
    'entete.typeAria':      'Type de rencontre',
    'entete.dossier':       'Dossier',
    'entete.dossierAria':   'Dossier de classement',
    'entete.animateur':     'Animateur',
    'entete.animateurPh':   'Qui anime',
    'entete.secretaire':    'Secrétaire',
    'entete.secretairePh':  'Qui prend les notes',
    'entete.participants':  'Participants',
    'entete.participantsPh':'Séparés par des virgules',
    'entete.presencesAria': 'Présences',
    'entete.supprimer':     '🗑️ Supprimer cette rencontre',
    'entete.titreDefaut':   'Rencontre du {quand}',
    'entete.nbParticipant': '{nb} participant',
    'entete.nbParticipants':'{nb} participants',
    'entete.nonClassee':    '— non classée —',

    /* ══ Commencer ════════════════════════════════════════════════════ */
    'demarrer.go':          '🎤 Commencer la rencontre',
    'demarrer.ou':          'ou',
    'demarrer.import':      'importer un enregistrement Zoom, Teams ou Meet',

    /* ══ Bande d'enregistrement ═══════════════════════════════════════ */
    'bande.pause':          '⏸ Pause',
    'bande.reprendre':      '▶ Reprendre',
    'bande.terminer':       '⏹ Terminer la rencontre',
    'bande.demarrer':       '▶ Démarrer',
    'bande.terminerCourt':  '⏹ Terminer',

    /* ══ Capture ══════════════════════════════════════════════════════ */
    'capture.aria':         'Comment capturer la rencontre',
    'capture.notes':        '✍️ Notes',
    'capture.micro':        '🎤 Micro',
    'capture.microDirect':  'transcription en direct',
    'capture.microFin':     'transcription à la fin',
    'capture.import':       '📁 Importer',
    'capture.microTitreDirect': 'Le texte s\'écrit pendant la rencontre.',
    'capture.microTitreFin':    'Le texte s\'écrit une fois l\'enregistrement terminé.',

    'format.aria':          'Mise en forme',
    'format.titre':         'Titre',
    'format.gras':          'Gras',
    'format.puces':         'Liste à puces',
    'format.numeros':       'Liste numérotée',
    'format.case':          'Case à cocher',
    'notes.aria':           'Notes de la rencontre',
    'notes.vide':           'Écris ici. Les points discutés, les décisions, ce qui reste à faire…',

    /* ══ Consentement ═════════════════════════════════════════════════ */
    'consent.titre':        'Avant de démarrer',
    'consent.texte':        'Assurez-vous d\'informer les participants que la rencontre est enregistrée et transcrite. L\'enregistrement sert à écrire le texte, puis il est effacé — seul le compte rendu est conservé, dans votre compte.',
    'consent.case':         'J\'ai compris, et j\'informe les participants.',
    'consent.rappel':       'Coche la case ci-dessus avant de démarrer.',

    /* ══ Micro ════════════════════════════════════════════════════════ */
    'micro.temoinAria':     'Ce que le micro entend, texte brut',
    'micro.temoinVide':     'Les mots apparaîtront ici à mesure.',
    'micro.temoinEtiq':     'Ce que le micro entend, tel quel — le compte rendu propre viendra après.',
    'micro.refuse':         'Le micro a été refusé. Autorise-le dans la barre d\'adresse, ou écris tes notes à la main — ça marche aussi.',
    'micro.introuvable':    'Aucun micro trouvé sur cet appareil. Tes notes à la main fonctionnent quand même.',
    'micro.occupe':         'Le micro est utilisé par une autre application. Ferme-la, puis réessaie.',
    'micro.echec':          'Le micro n\'a pas démarré ({erreur}). Tes notes à la main fonctionnent quand même.',
    'etat.echecRencontre':  '⚠ La rencontre n\'a pas pu être enregistrée ({erreur}). Tes notes restent sur cet appareil.',
    'micro.pasDeMicroIci':  'Ce navigateur ne donne pas accès au micro. Les deux autres façons de capturer restent ouvertes : écrire à la main, ou déposer un enregistrement.',
    'micro.modeDirect':     'Tu verras les mots défiler pendant que ça enregistre. La version propre — ponctuée, sans les « euh » — arrive à la fin.',
    'micro.modeFin':        'Le texte s\'écrit une fois l\'enregistrement terminé.',
    'micro.etiqDirect':     'Texte brut — la version propre arrive à la fin',
    'micro.etiqFin':        'Le texte apparaîtra ici à la fin de l\'enregistrement',
    'micro.termine':        'Enregistrement terminé — {duree}.',
    'micro.enPause':        'En pause.',

    /* ══ Import et ecriture du texte ══════════════════════════════════ */
    'depot.aria':           'Déposer un enregistrement, ou choisir un fichier',
    'depot.titre':          'Dépose ton enregistrement ici',
    'depot.desc':           'Zoom, Teams, Google Meet ou n\'importe quel enregistreur.',
    'depot.formats':        'mp3 · m4a · wav · mp4 · webm — ou clique pour choisir.',
    'depot.lancer':         'Écrire mon texte',
    'depot.annuler':        'Annuler',
    'depot.maintenant':     '🎙️ Écrire mon texte maintenant',
    'depot.mauvaisFormat':  'Format non reconnu. Accepte : mp3, m4a, wav, mp4, webm.',
    'depot.lecture':        'Lecture du fichier…',
    'depot.illisible':      'On n\'a pas réussi à lire ce fichier — il est peut-être trop long pour cet appareil.',
    'depot.duree':          'Enregistrement de {duree}.',
    'depot.cout':           'Ça prend {demande} de tes {reste} minutes gratuites d\'aujourd\'hui.',
    'depot.long':           '⚠ Plus de 90 minutes. Ça va prendre un bon moment, et ça utilise une bonne part de tes minutes gratuites du jour. Garde cette page ouverte.',
    'depot.dejaEnCours':    'On est déjà en train d\'écrire ton texte.',
    'depot.besoinReseau':   'Écrire ton texte demande Internet. Tes notes, elles, continuent de fonctionner.',
    'depot.prepare':        'Rencontre enregistrée. On prépare ton texte…',
    'depot.enCours':        'On écrit ton texte… {faits} morceaux sur {total}.',
    'depot.presqueFini':    'Presque fini…',
    'depot.tuPeuxFermer':   ' Tu peux fermer, on garde tout ce qui est déjà écrit.',
    'depot.sansReponse':    'Ça n\'a pas répondu. Réessaie dans un moment. ({erreur})',
    'depot.plusDeMinutes':  'Il te reste {reste} minutes aujourd\'hui.',
    'depot.aLaMain':        'Laisse cette page ouverte et demande-le quand tu veux — ',

    /* ══ C'est en surete ══════════════════════════════════════════════ */
    'odj.ceQuiSeDit':       'Ce qui se dit',
    'micro.notesMarchentQuandMeme':'Tes notes fonctionnent quand même — écris ici.',
    'depot.lectureImpossible':'Le fichier n\'a pas pu être lu.',
    'depot.formatIllisible': 'Ce fichier n\'a pas pu être décodé. Essaie un .mp3 ou un .m4a.',
    'depot.decodageEchec':  'Le fichier n\'a pas pu être décodé.',
    'depot.decoupage':      'Découpage…',
    'depot.pasAssez':       'Il ne reste pas assez de minutes aujourd\'hui pour cet enregistrement. Le compteur repart demain — ou découpe le fichier en deux.',
    'depot.pasAssezMaisSauve':'Il te reste {reste} minutes aujourd\'hui, et cet enregistrement en demande {demande}. Ta rencontre et tes notes sont enregistrées. Laisse cette page ouverte et demande-le quand tu veux — ou réessaie demain, le compteur repart.',
    'fini.titre':           'C\'est écrit, et c\'est enregistré.',
    'depot.gardeUn':        '— le premier morceau est conservé dans « Original ».',
    'depot.gardePlusieurs': '— les {nb} premiers morceaux sont conservés dans « Original ».',
    'fini.sousAuto':        'Rien ne se perdra plus — tu peux fermer. Le texte est dans « Original ».',
    'fini.sousImport':      'Le texte est dans « Original ».',
    'fini.sous':            'Rien ne se perdra plus — tu peux fermer.',

    /* ══ IA ═══════════════════════════════════════════════════════════ */
    'ia.structure':         '🗂️ Écrire le compte rendu',
    'ia.structureSous':     'Résumé, décisions, qui fait quoi',
    'ia.verbatim':          '📝 Écrire tout ce qui a été dit',
    'ia.verbatimSous':      'Mot à mot, rien de reformulé',
    'ia.passage':           '✂️ Résumer ce passage',
    'ia.modeleFin':         'Modèle plus fin',
    'cr.point':             'Point {nb}',
    'cr.nonAborde':         'Non abordé.',
    'cr.decisions':         'Décisions',
    'cr.actions':           'Actions à faire',
    'cr.reportes':          'Points reportés à la prochaine rencontre',
    'cr.pointsDiscutes':    'Points discutés',
    'cr.decisionsPrises':   'Décisions prises',
    'ia.rienANettoyer':     'Il n\'y a encore rien à nettoyer.',
    'ia.rienAResumer':      'Il n\'y a encore rien à résumer.',
    'ia.verbatimBloc':      'Mot à mot — bloc {n} sur {total}…',
    'ia.verbatimBlocReste': 'Mot à mot — bloc {n} sur {total} ({reste} comptes rendus restants aujourd\'hui)…',
    'ia.verbatimFini':      'Mot à mot terminé. Le texte reste modifiable à la main.',
    'ia.gardeUn':           '— le premier bloc est conservé.',
    'ia.gardePlusieurs':    '— les {nb} premiers blocs sont conservés.',
    'ia.aucuneParole':      '(aucune parole enregistrée sur ce point)',
    'ia.prepare':           'Compte rendu en préparation…',
    'ia.preparePoints':     'Compte rendu en préparation, point par point…',
    'ia.pret':              'Compte rendu prêt — {actions}{points}. Tout reste modifiable.',
    'ia.uneAction':         '1 action à faire',
    'ia.desActions':        '{nb} actions à faire',
    'ia.unNonAborde':       '1 point non abordé',
    'ia.desNonAbordes':     '{nb} points non abordés',
    'ia.selectionneDabord': 'Sélectionne d\'abord un passage dans « Original » (au moins quelques phrases).',
    'ia.resumePassage':     'Résumé du passage…',
    'ia.resumeAjoute':      'Résumé ajouté au bas du compte rendu.',
    'ia.travaille':         'On écrit…',
    'ia.echec':             'Ça n\'a pas fonctionné. Réessaie dans un moment. ({erreur})',
    'ia.rienATraiter':      'Il n\'y a pas encore de texte à travailler.',

    /* ══ Sortie ═══════════════════════════════════════════════════════ */
    'sortie.aria':          'Ce qui est affiché',
    'sortie.compteRendu':   'Compte rendu',
    'sortie.original':      'Original',
    'sortie.crAria':        'Compte rendu',
    'sortie.crVide':        'Le compte rendu s\'écrira ici. Il reste modifiable à la main avant l\'envoi.',
    'sortie.brutAria':      'Texte original',

    /* ══ Ordre du jour ════════════════════════════════════════════════ */
    'odj.aria':             'Ordre du jour',
    'odj.titre':            'ORDRE DU JOUR',
    'odj.effacer':          'Effacer',
    'odj.aide':             'Colle tes points, un par ligne. Ils deviendront des cases à cocher que tu suivras pendant la rencontre.',
    'odj.saisiePh':         'Horaire des surveillances\nBudget du matériel\nSorties d\'automne\nVaria',
    'odj.creer':            'Créer les points',
    'odj.fichier':          '📄 Depuis un fichier',
    'odj.gabarit':          '📋 Gabarit',
    'odj.rouvrir':          'Rouvrir',
    'odj.marquerRegle':     'Marquer comme réglé',
    'odj.enCours':          'en cours',
    'odj.piedUn':           '{nb} point réglé sur {total}. Coche un point quand il est réglé — ça n\'interrompt jamais l\'enregistrement.',
    'odj.piedPlusieurs':    '{nb} points réglés sur {total}. Coche un point quand il est réglé — ça n\'interrompt jamais l\'enregistrement.',
    'odj.creeUn':           '1 point créé. Coche-le quand il est réglé pendant la rencontre.',
    'odj.creePlusieurs':    '{nb} points créés. Coche-les à mesure pendant la rencontre.',
    'odj.effacerQuestion':  'Effacer l\'ordre du jour ?\n\nLes points et leurs horodatages partent. Tes notes, ton texte et ton compte rendu restent.',
    'odj.efface':           'Ordre du jour effacé.',
    'odj.aucunPoint':       'Aucun point trouvé — une ligne par point.',
    'odj.toutRegle':        'Tous les points sont réglés.',
    'odj.enregContinue':    'L\'enregistrement continue.',
    'odj.ouvreDabord':      'Ouvre ou crée une rencontre d\'abord.',
    'odj.numeroInconnu':    'Numéro inconnu.',
    'odj.nonAborde':        'Non abordé',
    'odj.pied':             '{faits} point sur {total} coché.',
    'odj.pieds':            '{faits} points sur {total} cochés.',

    'gab.question':         'Quel gabarit ?',
    'gab.tapeNumero':       'Tape un numéro.',
    'gab.statutaire.nom':   'Rencontre statutaire',
    'gab.statutaire.pts':   'Retour sur la dernière rencontre|Suivis et informations|Points de l\'équipe|Varia|Prochaine rencontre',
    'gab.comite.nom':       'Comité (EHDAA, activités, cour d\'école)',
    'gab.comite.pts':       'Ouverture et présences|Adoption de l\'ordre du jour|Suivi des dossiers|Nouveaux dossiers|Décisions|Prochaine rencontre',
    'gab.parents.nom':      'Rencontre de parents',
    'gab.parents.pts':      'Accueil|Portrait de l\'élève|Forces et défis|Ce qu\'on met en place|Suivi convenu',
    'gab.camp.nom':         'Coordination de camp',
    'gab.camp.pts':         'Retour sur la semaine|Groupes et animateurs|Sécurité et incidents|Sorties et matériel|Semaine à venir',
    'odj.titreTexte':       'Ordre du jour',
    'odj.rouvert':          '« {texte} » rouvert.',
    'odj.fichierIllisible': 'Le fichier n\'a pas pu être lu.',
    'gabarit.comite':       'Comité',
    'gabarit.statutaire':   'Rencontre statutaire',
    'gabarit.parents':      'Rencontre de parents',

    /* ══ Exports ══════════════════════════════════════════════════════ */
    'pied.envoyer':         '✉️ Envoyer par courriel',
    'pied.copier':          'Copier',
    'pied.pdf':             'PDF',
    'pied.txt':             '.txt',
    'pied.md':              '.md',
    'pied.partager':        'Partager',
    'cr.resume':            'Résumé',
    'courriel.aQui':        'À qui envoyer ce compte rendu ?\n(adresses séparées par des virgules)',
    'courriel.corpsColle':  'Le compte rendu complet est dans ton presse-papiers : colle-le ici (Ctrl+V ou Cmd+V).',
    'courriel.corpsSuit':   'Le compte rendu complet suit — copie-le depuis l\'application.',
    'courriel.ouvert':      'Courriel ouvert. Le compte rendu complet est dans le presse-papiers — colle-le dans le message.',
    'courriel.presseRefuse':'⚠ Le presse-papiers a été refusé. Utilise « Copier le compte rendu », puis colle dans le courriel.',
    'pied.copieOk':         'Compte rendu copié — colle-le où tu veux.',
    'pied.copieRefusee':    '⚠ La copie a été refusée par le navigateur.',
    'pied.partage':         'Partagé.',
    'pied.copie':           'Compte rendu copié.',
    'pied.txtFait':         'Fichier .txt téléchargé.',
    'pied.mdFait':          'Fichier .md téléchargé.',
    'pied.partageEchec':    'Le partage a échoué ({erreur}).',

    /* ══ Enregistrement et etats ══════════════════════════════════════ */
    'outils.enregistre':    '✓ Enregistré',
    'dossier.cree':         'Dossier créé.',
    'dossier.renomme':      'Dossier renommé.',
    'dossier.supprQuestion':'Supprimer le dossier « {nom} » ?',
    'dossier.supprAvecUne': 'Sa rencontre devient « non classée ». Elle n\'est pas effacée.',
    'dossier.supprAvecPlusieurs':'Ses {nb} rencontres deviennent « non classées ». Aucune n\'est effacée.',
    'dossier.supprVide':    'Il est vide.',
    'dossier.supprime':     'Dossier supprimé.',
    'dossier.supprimeAvecUne':'Dossier supprimé — sa rencontre est maintenant « non classée ».',
    'dossier.supprimeAvecPlusieurs':'Dossier supprimé — ses {nb} rencontres sont maintenant « non classées ».',
    'dossier.nonClassees':  'non classées',
    'etat.echecListe':      '⚠ La liste n\'a pas pu être relue ({erreur}).',
    'etat.enregistre':      'Enregistré.',
    'etat.reconnecte':      'Ta connexion a expiré. Recharge la page pour te reconnecter — tes notes sont sur cet appareil, rien n\'est perdu.',
    'etat.enregistrement':  'Enregistrement…',
    'etat.pasDeReseau':     'Pas de réseau — tes notes restent sur cet appareil et partiront au retour de la connexion.',
    'etat.memoirePleine':   '⚠ La mémoire de cet appareil est pleine : la copie de secours n\'a pas pu s\'écrire. Enregistre maintenant.',
    'etat.tropGros':        '⚠ Ce compte rendu dépasse la taille d\'un document ({poids} Ko sur {max} Ko). Allège-le avant d\'enregistrer.',
    'etat.echecEcriture':   '⚠ L\'enregistrement a échoué ({erreur}). Ton texte reste sur cet appareil.',
    'etat.retrouve':        'Notes retrouvées sur cet appareil — elles sont plus récentes que la dernière version enregistrée. Vérifie, puis enregistre.',
    'etat.brouillon':       'Rencontre non enregistrée retrouvée sur cet appareil. Vérifie, puis enregistre.',
    'etat.rienASupprimer':  'Rien à supprimer.',
    'etat.echecSuppression':'⚠ La suppression a échoué ({erreur}).',
    'etat.supprimee':       '« {titre} » supprimée.',
    'etat.echecDossiers':   '⚠ Les dossiers n\'ont pas pu être lus ({erreur}).',
    'etat.echecDeplacement':'⚠ Le déplacement a échoué ({erreur}).',
    'etat.deplacee':        '« {titre} » → {dossier}',

    'confirme.supprimer':   'Supprimer « {titre} » ?\n\nElle sera effacée définitivement.',
    'confirme.quitter':     'L\'enregistrement est en cours.\n\nL\'arrêter et enregistrer ?',
    'confirme.supprDossier':'Supprimer le dossier « {nom} » ?\n\nLes rencontres qu\'il contient ne sont pas supprimées : elles redeviennent non classées.',

    /* ══ Credits ══════════════════════════════════════════════════════ */
    'credits.min':          '{nb} min',
    'credits.cr':           '{nb} compte rendu',
    'credits.crs':          '{nb} comptes rendus',
    'credits.restants':     ' restants aujourd\'hui',
    'credits.detail':       'Ce qu\'il te reste aujourd\'hui : {minutes} minutes de micro sur {minutesMax}, et {ia} comptes rendus sur {iaMax}. Tout repart à neuf demain. C\'est gratuit, et ça le reste.',

    /* ══ Duree ════════════════════════════════════════════════════════ */
    'duree.moinsUneMinute': 'moins d\'une minute',
    'duree.minute':         '{nb} minute',
    'duree.minutes':        '{nb} minutes',
    'duree.heure':          '{h} h {m}'
  };

  const EN = {
    'outils.rail':          '☰ My meetings',
    'outils.nouvelle':      '+ New meeting',
    'outils.cherche':       'Search…',
    'outils.chercheAria':   'Search my meetings',
    'outils.filtreAria':    'Filter by type',
    'outils.tousTypes':     'All types',
    'outils.enregistrer':   '💾 Save',
    'outils.mesActions':    '✅ My to-dos',
    'outils.autresActions': 'More actions',

    'type.comite':          'Committee',
    'type.statutaire':      'Staff meeting',
    'type.autre':           'Other',
    'type.comiteLong':      'Committee',
    'type.statutaireLong':  'Staff meeting',
    'type.autreLong':       'Meeting',

    'menu.suite':           '🔁 Start the follow-up meeting',
    'menu.gabarit':         '📋 Start from an agenda template',
    'menu.envoyer':         '✉️ Send by email',
    'menu.copier':          '📋 Copy the minutes',
    'menu.pdf':             '🖨️ Print / PDF',
    'menu.txt':             '⬇️ Export as .txt',
    'menu.md':              '⬇️ Export as .md',
    'menu.voirOriginal':    '📄 See the original text',
    'menu.partage':         '📤 Share',
    'menu.supprimer':       '🗑️ Delete this meeting',

    'reseau.horsLigne':     '📴 No connection. Your notes keep saving on this device; transcription and AI will resume once you\'re back online.',

    'rail.aria':            'My folders and my meetings',
    'rail.dossiers':        'MY FOLDERS',
    'rail.nouveauDossier':  '➕ New folder',
    'rail.rencontres':      'MEETINGS',
    'rail.vide':            'No meetings yet.',
    'rail.videAide':        'The “+ New meeting” button creates one.',
    'rail.renommer':        'Rename {nom}',
    'rail.supprimerDossier':'Delete {nom}',
    'rail.jeter':           'Delete “{titre}”',
    'rail.sansTitre':       'Untitled',
    'rail.videFiltre':      'No meeting matches.',
    'rail.videFiltreAide':  'There are {nb} in total — remove a filter to see them again.',
    'souci.directRefuse':   'This browser doesn\'t allow live writing. Recording continues: the text will be written at the end.',
    'souci.directReseau':   'Unstable connection — live writing stopped. Recording continues.',
    'souci.directArrete':   'Live writing stopped. Recording continues: the text will be written at the end.',
    'souci.interrompu':     '⚠ The recording was interrupted. What was captured up to here is kept.',
    'souci.arretImpossible':'⚠ Stopping the recording failed. Reload the page; whatever is already written is kept.',
    'micro.refuseCourt':    'The mic was blocked. Allow it in the address bar, then restart.',
    'micro.absent':         'No mic detected on this device.',
    'micro.indisponible':   'This browser doesn\'t give access to the mic.',
    'micro.enregIndisponible':'This browser can\'t record audio.',
    'micro.erreur':         'The mic didn\'t start.',

    'accueil.titre':        'ZONE MEETINGS',
    'accueil.sous':         'Committee, staff meeting, parent meeting. You take the notes, you talk, or you drop in the recording — the minutes write themselves.',
    'accueil.ecrireNom':    'Write',
    'accueil.ecrireDesc':   'Your notes, saved every 10 seconds. Works with no connection.',
    'accueil.parlerNom':    'Talk',
    'accueil.parlerDesc':   'The mic listens to the meeting and writes for you.',
    'accueil.deposerNom':   'Drop in',
    'accueil.deposerDesc':  'Your Zoom, Teams or Meet file, dropped here and transcribed.',

    'ecran.retour':         '← Back to my meetings',
    'ecran.modifier':       'Edit',
    'ecran.detailAria':     'The open meeting',

    'actions.titre':        'MY TO-DOS',
    'actions.aria':         'My to-dos',
    'actions.voirFaites':   'Also show what\'s done',
    'ech.sans':             'No due date',
    'ech.retard':           'Overdue',
    'ech.jour':             'Today',
    'ech.semaine':          'In the next 7 days',
    'ech.apres':            'Later',
    'actions.videSansRencontre':'No meetings yet. To-dos show up here as soon as a set of minutes produces some.',
    'actions.videUne':      'Nothing to do in your meeting. The “Write the minutes” button produces them.',
    'actions.videPlusieurs':'Nothing to do across your {nb} meetings. The “Write the minutes” button produces them.',
    'actions.toutCoche':    'Nothing to do — everything is ticked. 🎉',
    'actions.echecCase':    '⚠ The checkbox couldn\'t be saved ({erreur}).',
    'gab.ajoute':           'Template “{nom}” added at the top of the notes.',
    'suite.ouvreDabord':    'Open a meeting first.',
    'suite.reporteDe':      'Carried over from the previous meeting',
    'suite.unPoint':        '1 item carried over',
    'suite.desPoints':      '{nb} items carried over',
    'suite.uneAction':      '1 to-do still open',
    'suite.desActions':     '{nb} to-dos still open',
    'suite.et':             ' and ',
    'suite.creeeAvec':      'Follow-up created with {quoi}. Save whenever you want.',
    'suite.creeeVide':      'Follow-up created — nothing was pending.',
    'actions.rien':         'Nothing to do right now.',
    'actions.toutFait':     'All done. 🎉',
    'actions.enRetard':     'overdue',
    'actions.pour':         'by {date}',

    'entete.titrePh':       'Meeting title',
    'entete.date':          'Date',
    'entete.dateAria':      'Meeting date',
    'entete.type':          'Type',
    'entete.typeAria':      'Meeting type',
    'entete.dossier':       'Folder',
    'entete.dossierAria':   'Filing folder',
    'entete.animateur':     'Chair',
    'entete.animateurPh':   'Who runs it',
    'entete.secretaire':    'Note-taker',
    'entete.secretairePh':  'Who takes the notes',
    'entete.participants':  'Attendees',
    'entete.participantsPh':'Separated by commas',
    'entete.presencesAria': 'Attendance',
    'entete.supprimer':     '🗑️ Delete this meeting',
    'entete.titreDefaut':   'Meeting of {quand}',
    'entete.nbParticipant': '{nb} attendee',
    'entete.nbParticipants':'{nb} attendees',
    'entete.nonClassee':    '— unfiled —',

    'demarrer.go':          '🎤 Start the meeting',
    'demarrer.ou':          'or',
    'demarrer.import':      'import a Zoom, Teams or Meet recording',

    'bande.pause':          '⏸ Pause',
    'bande.reprendre':      '▶ Resume',
    'bande.terminer':       '⏹ End the meeting',
    'bande.demarrer':       '▶ Start',
    'bande.terminerCourt':  '⏹ End',

    'capture.aria':         'How to capture the meeting',
    'capture.notes':        '✍️ Notes',
    'capture.micro':        '🎤 Mic',
    'capture.microDirect':  'live transcription',
    'capture.microFin':     'transcribed at the end',
    'capture.import':       '📁 Import',
    'capture.microTitreDirect': 'The text is written during the meeting.',
    'capture.microTitreFin':    'The text is written once the recording ends.',

    'format.aria':          'Formatting',
    'format.titre':         'Heading',
    'format.gras':          'Bold',
    'format.puces':         'Bulleted list',
    'format.numeros':       'Numbered list',
    'format.case':          'Checkbox',
    'notes.aria':           'Meeting notes',
    'notes.vide':           'Write here. What was discussed, what was decided, what\'s left to do…',

    'consent.titre':        'Before you start',
    'consent.texte':        'Make sure you tell the participants that the meeting is being recorded and transcribed. The recording is used to write the text, then it is deleted — only the minutes are kept, in your account.',
    'consent.case':         'Understood, and I\'m telling the participants.',
    'consent.rappel':       'Tick the box above before starting.',

    'micro.temoinAria':     'What the mic hears, raw text',
    'micro.temoinVide':     'The words will appear here as you go.',
    'micro.temoinEtiq':     'What the mic hears, as-is — the clean minutes come after.',
    'micro.refuse':         'The mic was blocked. Allow it in the address bar, or type your notes by hand — that works too.',
    'micro.introuvable':    'No mic found on this device. Typing your notes still works.',
    'micro.occupe':         'The mic is in use by another app. Close it, then try again.',
    'micro.echec':          'The mic didn\'t start ({erreur}). Typing your notes still works.',
    'etat.echecRencontre':  '⚠ The meeting couldn\'t be saved ({erreur}). Your notes stay on this device.',
    'micro.pasDeMicroIci':  'This browser doesn\'t give access to the mic. The two other ways to capture are still open: type your notes, or drop in a recording.',
    'micro.modeDirect':     'You\'ll see the words scroll by as it records. The clean version — punctuated, without the “ums” — comes at the end.',
    'micro.modeFin':        'The text is written once the recording ends.',
    'micro.etiqDirect':     'Raw text — the clean version comes at the end',
    'micro.etiqFin':        'The text will appear here once the recording ends',
    'micro.termine':        'Recording finished — {duree}.',
    'micro.enPause':        'Paused.',

    'depot.aria':           'Drop a recording, or choose a file',
    'depot.titre':          'Drop your recording here',
    'depot.desc':           'Zoom, Teams, Google Meet or any recorder.',
    'depot.formats':        'mp3 · m4a · wav · mp4 · webm — or click to choose.',
    'depot.lancer':         'Write my text',
    'depot.annuler':        'Cancel',
    'depot.maintenant':     '🎙️ Write my text now',
    'depot.mauvaisFormat':  'Format not recognized. Accepted: mp3, m4a, wav, mp4, webm.',
    'depot.lecture':        'Reading the file…',
    'depot.illisible':      'We couldn\'t read this file — it may be too long for this device.',
    'depot.duree':          '{duree} recording.',
    'depot.cout':           'This uses {demande} of your {reste} free minutes for today.',
    'depot.long':           '⚠ Over 90 minutes. This will take a while, and it uses a good chunk of your free minutes for the day. Keep this page open.',
    'depot.dejaEnCours':    'We\'re already writing your text.',
    'depot.besoinReseau':   'Writing your text needs the internet. Your notes keep working.',
    'depot.prepare':        'Meeting saved. Getting your text ready…',
    'depot.enCours':        'Writing your text… {faits} pieces out of {total}.',
    'depot.presqueFini':    'Almost done…',
    'depot.tuPeuxFermer':   ' You can close this — everything already written is kept.',
    'depot.sansReponse':    'No answer. Try again in a moment. ({erreur})',
    'depot.plusDeMinutes':  'You have {reste} minutes left today.',
    'depot.aLaMain':        'Leave this page open and ask for it whenever you want — ',

    'odj.ceQuiSeDit':       'What is being said',
    'micro.notesMarchentQuandMeme':'Your notes still work — type here.',
    'depot.lectureImpossible':'The file couldn\'t be read.',
    'depot.formatIllisible': 'This file couldn\'t be decoded. Try an .mp3 or an .m4a.',
    'depot.decodageEchec':  'The file couldn\'t be decoded.',
    'depot.decoupage':      'Splitting…',
    'depot.pasAssez':       'There aren\'t enough minutes left today for this recording. The counter resets tomorrow — or split the file in two.',
    'depot.pasAssezMaisSauve':'You have {reste} minutes left today, and this recording needs {demande}. Your meeting and your notes are saved. Leave this page open and ask for it whenever you want — or try again tomorrow, the counter resets.',
    'fini.titre':           'It\'s written, and it\'s saved.',
    'depot.gardeUn':        '— the first piece is kept under “Original”.',
    'depot.gardePlusieurs': '— the first {nb} pieces are kept under “Original”.',
    'fini.sousAuto':        'Nothing more can be lost — you can close this. The text is under “Original”.',
    'fini.sousImport':      'The text is under “Original”.',
    'fini.sous':            'Nothing more can be lost — you can close this.',

    'ia.structure':         '🗂️ Write the minutes',
    'ia.structureSous':     'Summary, decisions, who does what',
    'ia.verbatim':          '📝 Write everything that was said',
    'ia.verbatimSous':      'Word for word, nothing rephrased',
    'ia.passage':           '✂️ Summarize this passage',
    'ia.modeleFin':         'Finer model',
    'cr.point':             'Item {nb}',
    'cr.nonAborde':         'Not discussed.',
    'cr.decisions':         'Decisions',
    'cr.actions':           'To do',
    'cr.reportes':          'Items carried to the next meeting',
    'cr.pointsDiscutes':    'Items discussed',
    'cr.decisionsPrises':   'Decisions made',
    'ia.rienANettoyer':     'There\'s nothing to clean up yet.',
    'ia.rienAResumer':      'There\'s nothing to summarize yet.',
    'ia.verbatimBloc':      'Word for word — block {n} of {total}…',
    'ia.verbatimBlocReste': 'Word for word — block {n} of {total} ({reste} sets of minutes left today)…',
    'ia.verbatimFini':      'Word for word done. The text can still be edited by hand.',
    'ia.gardeUn':           '— the first block is kept.',
    'ia.gardePlusieurs':    '— the first {nb} blocks are kept.',
    'ia.aucuneParole':      '(nothing was recorded on this item)',
    'ia.prepare':           'Writing the minutes…',
    'ia.preparePoints':     'Writing the minutes, item by item…',
    'ia.pret':              'Minutes ready — {actions}{points}. Everything can still be edited.',
    'ia.uneAction':         '1 thing to do',
    'ia.desActions':        '{nb} things to do',
    'ia.unNonAborde':       '1 item not discussed',
    'ia.desNonAbordes':     '{nb} items not discussed',
    'ia.selectionneDabord': 'Select a passage under “Original” first (at least a few sentences).',
    'ia.resumePassage':     'Summarizing the passage…',
    'ia.resumeAjoute':      'Summary added at the bottom of the minutes.',
    'ia.travaille':         'Writing…',
    'ia.echec':             'That didn\'t work. Try again in a moment. ({erreur})',
    'ia.rienATraiter':      'There\'s no text to work with yet.',

    'sortie.aria':          'What is shown',
    'sortie.compteRendu':   'Minutes',
    'sortie.original':      'Original',
    'sortie.crAria':        'Minutes',
    'sortie.crVide':        'The minutes will be written here. You can still edit them by hand before sending.',
    'sortie.brutAria':      'Original text',

    'odj.aria':             'Agenda',
    'odj.titre':            'AGENDA',
    'odj.effacer':          'Clear',
    'odj.aide':             'Paste your items, one per line. They become checkboxes you tick during the meeting.',
    'odj.saisiePh':         'Supervision schedule\nEquipment budget\nFall outings\nOther business',
    'odj.creer':            'Create the items',
    'odj.fichier':          '📄 From a file',
    'odj.gabarit':          '📋 Template',
    'odj.rouvrir':          'Reopen',
    'odj.marquerRegle':     'Mark as covered',
    'odj.enCours':          'in progress',
    'odj.piedUn':           '{nb} of {total} item covered. Tick an item when it\'s covered — it never interrupts the recording.',
    'odj.piedPlusieurs':    '{nb} of {total} items covered. Tick an item when it\'s covered — it never interrupts the recording.',
    'odj.creeUn':           '1 item created. Tick it when it\'s covered during the meeting.',
    'odj.creePlusieurs':    '{nb} items created. Tick them off as you go during the meeting.',
    'odj.effacerQuestion':  'Clear the agenda?\n\nThe items and their timestamps go. Your notes, your text and your minutes stay.',
    'odj.efface':           'Agenda cleared.',
    'odj.aucunPoint':       'No items found — one line per item.',
    'odj.toutRegle':        'Every item is covered.',
    'odj.enregContinue':    'Recording continues.',
    'odj.ouvreDabord':      'Open or create a meeting first.',
    'odj.numeroInconnu':    'Unknown number.',
    'odj.nonAborde':        'Not discussed',
    'odj.pied':             '{faits} of {total} item ticked.',
    'odj.pieds':            '{faits} of {total} items ticked.',

    'gab.question':         'Which template?',
    'gab.tapeNumero':       'Type a number.',
    'gab.statutaire.nom':   'Staff meeting',
    'gab.statutaire.pts':   'Follow-up on the last meeting|Updates and information|Team items|Other business|Next meeting',
    'gab.comite.nom':       'Committee (special needs, activities, schoolyard)',
    'gab.comite.pts':       'Opening and attendance|Adoption of the agenda|Ongoing files|New files|Decisions|Next meeting',
    'gab.parents.nom':      'Parent meeting',
    'gab.parents.pts':      'Welcome|The student\'s profile|Strengths and challenges|What we\'re putting in place|Agreed follow-up',
    'gab.camp.nom':         'Camp coordination',
    'gab.camp.pts':         'Look back at the week|Groups and counsellors|Safety and incidents|Outings and equipment|The week ahead',
    'odj.titreTexte':       'Agenda',
    'odj.rouvert':          '“{texte}” reopened.',
    'odj.fichierIllisible': 'The file couldn\'t be read.',
    'gabarit.comite':       'Committee',
    'gabarit.statutaire':   'Staff meeting',
    'gabarit.parents':      'Parent meeting',

    'pied.envoyer':         '✉️ Send by email',
    'pied.copier':          'Copy',
    'pied.pdf':             'PDF',
    'pied.txt':             '.txt',
    'pied.md':              '.md',
    'pied.partager':        'Share',
    'cr.resume':            'Summary',
    'courriel.aQui':        'Who should receive these minutes?\n(addresses separated by commas)',
    'courriel.corpsColle':  'The full minutes are on your clipboard: paste them here (Ctrl+V or Cmd+V).',
    'courriel.corpsSuit':   'The full minutes follow — copy them from the app.',
    'courriel.ouvert':      'Email opened. The full minutes are on your clipboard — paste them into the message.',
    'courriel.presseRefuse':'⚠ The clipboard was blocked. Use “Copy the minutes”, then paste into your email.',
    'pied.copieOk':         'Minutes copied — paste them wherever you want.',
    'pied.copieRefusee':    '⚠ The browser refused to copy.',
    'pied.partage':         'Shared.',
    'pied.copie':           'Minutes copied.',
    'pied.txtFait':         '.txt file downloaded.',
    'pied.mdFait':          '.md file downloaded.',
    'pied.partageEchec':    'Sharing failed ({erreur}).',

    'outils.enregistre':    '✓ Saved',
    'dossier.cree':         'Folder created.',
    'dossier.renomme':      'Folder renamed.',
    'dossier.supprQuestion':'Delete the folder “{nom}”?',
    'dossier.supprAvecUne': 'Its meeting becomes “unfiled”. It is not deleted.',
    'dossier.supprAvecPlusieurs':'Its {nb} meetings become “unfiled”. None are deleted.',
    'dossier.supprVide':    'It is empty.',
    'dossier.supprime':     'Folder deleted.',
    'dossier.supprimeAvecUne':'Folder deleted — its meeting is now “unfiled”.',
    'dossier.supprimeAvecPlusieurs':'Folder deleted — its {nb} meetings are now “unfiled”.',
    'dossier.nonClassees':  'unfiled',
    'etat.echecListe':      '⚠ The list couldn\'t be re-read ({erreur}).',
    'etat.enregistre':      'Saved.',
    'etat.reconnecte':      'Your connection expired. Reload the page to sign back in — your notes are on this device, nothing is lost.',
    'etat.enregistrement':  'Saving…',
    'etat.pasDeReseau':     'No connection — your notes stay on this device and will go out once you\'re back online.',
    'etat.memoirePleine':   '⚠ This device\'s memory is full: the backup copy couldn\'t be written. Save now.',
    'etat.tropGros':        '⚠ These minutes exceed the size of one document ({poids} KB out of {max} KB). Trim them before saving.',
    'etat.echecEcriture':   '⚠ Saving failed ({erreur}). Your text stays on this device.',
    'etat.retrouve':        'Notes found on this device — they\'re newer than the last saved version. Check them, then save.',
    'etat.brouillon':       'An unsaved meeting was found on this device. Check it, then save.',
    'etat.rienASupprimer':  'Nothing to delete.',
    'etat.echecSuppression':'⚠ Deleting failed ({erreur}).',
    'etat.supprimee':       '“{titre}” deleted.',
    'etat.echecDossiers':   '⚠ The folders couldn\'t be read ({erreur}).',
    'etat.echecDeplacement':'⚠ Moving failed ({erreur}).',
    'etat.deplacee':        '“{titre}” → {dossier}',

    'confirme.supprimer':   'Delete “{titre}”?\n\nIt will be erased for good.',
    'confirme.quitter':     'Recording is in progress.\n\nStop it and save?',
    'confirme.supprDossier':'Delete the folder “{nom}”?\n\nThe meetings inside are not deleted: they go back to being unfiled.',

    'credits.min':          '{nb} min',
    'credits.cr':           '{nb} set of minutes',
    'credits.crs':          '{nb} sets of minutes',
    'credits.restants':     ' left today',
    'credits.detail':       'What you have left today: {minutes} minutes of mic out of {minutesMax}, and {ia} sets of minutes out of {iaMax}. Everything resets tomorrow. It\'s free, and it stays free.',

    'duree.moinsUneMinute': 'less than a minute',
    'duree.minute':         '{nb} minute',
    'duree.minutes':        '{nb} minutes',
    'duree.heure':          '{h} h {m}'
  };

  const DICOS = { fr: FR, en: EN };

  /* La langue vient du site, jamais d'ici — voir l'en-tete du fichier.

     `ZTS.getLang()` D'ABORD, et surtout pas `ZTS.langue()`.

     Les deux ne repondent pas la meme chose, et la difference se voit :
     `langue()` REDERIVE la langue a chaque appel, en commencant par le
     parametre `?lang=` de l'URL. Sur une page ouverte en `?lang=en`, elle
     repondra donc « en » pour toujours — meme apres un clic sur FR. Le shell,
     lui, bascule quand meme, parce qu'il garde sa langue courante dans une
     variable que `setLang()` met a jour, et c'est elle que `getLang()`
     expose. Se fier a `langue()` donnait exactement le defaut qu'on veut
     eviter : l'en-tete en francais, l'app en anglais, sur la meme page.
     Verifie au banc : apres un clic sur FR depuis `?lang=en`,
     `getLang()` = 'fr' et `langue()` = 'en'. */
  function lang() {
    try {
      if (window.ZTS && ZTS.getLang) return ZTS.getLang();
      if (window.ZTS && ZTS.langue) return ZTS.langue();
    } catch (e) { /* ZTS pas encore charge */ }
    // Meme corps de repli que shared/zts.js : un defaut « fr » en dur
    // recreerait la divergence que le tunnel a mis du temps a retirer.
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (q === 'fr' || q === 'en') return q;
      const saved = localStorage.getItem('zts_lang');
      if (saved === 'fr' || saved === 'en') return saved;
    } catch (e) { /* URL ou localStorage indisponible */ }
    return (navigator.language || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';
  }

  /**
   * Le texte d'une cle, avec ses trous remplis.
   *
   * Les trous s'ecrivent `{nom}` dans le dictionnaire et se passent en objet :
   *   t('rail.jeter', { titre: 'Comité EHDAA' })
   *
   * Une cle inconnue renvoie la cle elle-meme. C'est VOULU : ca se voit tout
   * de suite a l'ecran, alors qu'un repli silencieux vers le francais
   * passerait inapercu jusqu'a ce qu'un anglophone le signale.
   */
  function t(cle, trous) {
    const dico = DICOS[lang()] || FR;
    let s = (cle in dico) ? dico[cle] : (cle in FR ? FR[cle] : cle);
    if (trous) {
      Object.keys(trous).forEach(k => {
        s = s.split('{' + k + '}').join(String(trous[k]));
      });
    }
    return s;
  }

  /** Le pluriel, la ou le francais et l'anglais coupent au meme endroit. */
  function tn(cleUn, clePlusieurs, nb, trous) {
    const o = Object.assign({ nb: nb }, trous || {});
    return t(nb > 1 ? clePlusieurs : cleUn, o);
  }

  /** La cle est-elle a NOUS ? */
  function connait(cle) {
    return cle && (cle in FR);
  }

  /* Meme convention que shared/zts.js : `data-i18n` pour le texte,
     `data-i18n-attr="placeholder:cle;title:cle2"` pour les attributs.

     ON NE TOUCHE QU'AUX CLES QU'ON CONNAIT. La page porte aussi des cles du
     dictionnaire PARTAGE — `subnav.back_home` sur le lien « ← Accueil ».
     Sans ce garde-fou, on ecraserait ce lien par le texte « subnav.back_home »,
     puisqu'une cle inconnue se rend elle-meme. Le dictionnaire partage passe
     apres le notre et reparerait le lien, mais l'ordre des deux n'est garanti
     par rien : on ne s'en remet pas a une course. */
  function applique(racine) {
    racine = racine || document;
    racine.querySelectorAll('[data-i18n]').forEach(el => {
      const cle = el.getAttribute('data-i18n');
      if (connait(cle)) el.textContent = t(cle);
    });
    racine.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.getAttribute('data-i18n-attr').split(';').forEach(paire => {
        const [attr, cle] = paire.split(':').map(s => s.trim());
        if (attr && connait(cle)) el.setAttribute(attr, t(cle));
      });
    });
  }

  /**
   * Une cle presente d'un cote et pas de l'autre rendrait du francais dans
   * une page anglaise, en silence. On le dit tout de suite, dans la console,
   * en production comme en developpement — c'est le seul moment ou quelqu'un
   * peut encore le corriger avant un utilisateur.
   */
  function verifieCles() {
    const manqueEN = Object.keys(FR).filter(k => !(k in EN));
    const manqueFR = Object.keys(EN).filter(k => !(k in FR));
    if (manqueEN.length) console.warn('[Rencontres i18n] absentes de EN :', manqueEN);
    if (manqueFR.length) console.warn('[Rencontres i18n] absentes de FR :', manqueFR);
    return { manqueEN, manqueFR };
  }
  verifieCles();

  return { t, tn, lang, applique, connait, verifieCles, FR, EN };
})();
