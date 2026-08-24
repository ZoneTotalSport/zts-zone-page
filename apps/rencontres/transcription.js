/**
 * transcription.js — la capture au micro de Zone Rencontres.
 *
 * CE MODULE NE TOUCHE NI AU DOM DE L'APP NI A FIRESTORE. Il expose RencMicro,
 * une machine a etats qui previent par rappels. app.js decide quoi afficher,
 * dataStore.js decide quoi ecrire. Meme separation que partout ailleurs dans
 * ce dossier.
 *
 * DEUX CHEMINS, ET LE SECOND EST LE CHEMIN NORMAL
 *
 *   MediaRecorder     TOUJOURS actif. C'est la source de verite : l'audio
 *                     part au worker a l'arret, Whisper le transcrit, et ce
 *                     texte-la fait foi. Presente partout.
 *
 *   SpeechRecognition EN PLUS, quand le navigateur la porte. Elle ecrit a
 *                     l'ecran PENDANT la rencontre. Elle n'existe ni sur
 *                     Safari ni sur Firefox — donc ni sur Mac ni sur iPhone,
 *                     une bonne part du parc scolaire quebecois.
 *
 * Ce n'est pas « une bonne methode et une degradee ». C'est « le texte
 * s'ecrit pendant, ou le texte s'ecrit a la fin ». L'interface le dit dans ces
 * termes-la et JAMAIS autrement : le mot « repli » n'apparait nulle part a
 * l'ecran, et rien n'annonce a l'usager de Safari qu'il lui manque quelque
 * chose. Voir le §3B du cahier v2.
 *
 * Script classique, pas un module : charge AVANT app.js.
 */

const RencMicro = (() => {

  const Voix = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  /* Formats, par ordre de preference. Chrome et Firefox donnent du webm/opus ;
     Safari ne connait que mp4/aac. On ne devine pas : on demande au navigateur
     ce qu'il sait produire. Un mimeType non supporte passe a MediaRecorder
     sans erreur ET produit un fichier vide — panne silencieuse classique. */
  const FORMATS = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/ogg;codecs=opus'
  ];

  /* Les morceaux arrivent toutes les 5 secondes plutot qu'a la fin. Un onglet
     qui meurt a la 58e minute ne doit pas emporter 58 minutes d'audio. */
  const TRANCHE_MS = 5000;

  /* Redemarrage de la reconnaissance vocale : Chrome coupe `onend` tout seul
     apres quelques dizaines de secondes de silence, et une rencontre a des
     silences. On relance — mais avec un compteur : si elle retombe
     immediatement plus de six fois d'affilee, c'est qu'elle ne repartira pas
     (service indisponible, micro pris par une autre application), et une
     boucle serree ferait chauffer la machine pour rien. */
  const RELANCE_MS = 350;
  const RELANCE_MAX = 6;
  const RELANCE_VIVANTE_MS = 3000;   // au-dela, la session a vraiment servi

  const CLE_CONSENTEMENT = 'zts_renc_consentement';

  let etat = 'arret';            // 'arret' | 'enregistre' | 'pause'
  let flux = null;               // MediaStream
  let recorder = null;
  let morceaux = [];
  let voix = null;
  let voulueEnMarche = false;    // la reconnaissance doit-elle tourner ?
  let relances = 0;
  let debutSession = 0;
  let secondes = 0;
  let horloge = null;
  let finalCumul = '';
  let dernierMime = '';

  const rappels = { texte: null, minuteur: null, etat: null, audio: null, souci: null };

  function prevenir(quoi, a, b) {
    const f = rappels[quoi];
    if (typeof f === 'function') { try { f(a, b); } catch (e) { console.error('[RencMicro]', e); } }
  }

  function poseEtat(e) { etat = e; prevenir('etat', e); }

  /* ── Consentement ───────────────────────────────────────────────────────
     Memorise une fois pour toutes sur l'appareil. Ce n'est pas une case
     legale, c'est un rappel : c'est l'usager qui informe les participants,
     et l'app n'a aucun moyen de le faire a sa place. */

  function consentementDonne() {
    try { return localStorage.getItem(CLE_CONSENTEMENT) === '1'; }
    catch (e) { return false; }
  }

  function donneConsentement() {
    try { localStorage.setItem(CLE_CONSENTEMENT, '1'); } catch (e) {}
  }

  /* ── Minuteur ─────────────────────────────────────────────────────────
     Il ne compte que le temps ENREGISTRE : une pause de dix minutes ne doit
     pas gonfler la duree, sinon l'estimation de transcription de la vague D
     serait fausse du meme coup. */

  function demarreHorloge() {
    arreteHorloge();
    horloge = setInterval(function () {
      secondes += 1;
      prevenir('minuteur', secondes);
    }, 1000);
  }
  function arreteHorloge() { if (horloge) { clearInterval(horloge); horloge = null; } }

  function formate(s) {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    const deux = (n) => (n < 10 ? '0' : '') + n;
    return (h ? h + ':' : '') + deux(m) + ':' + deux(r);
  }

  /* ── Reconnaissance vocale ────────────────────────────────────────────── */

  function demarreVoix() {
    if (!Voix) return;
    try {
      voix = new Voix();
    } catch (e) { voix = null; return; }

    voix.lang = 'fr-CA';
    voix.continuous = true;
    voix.interimResults = true;
    voix.maxAlternatives = 1;

    voix.onresult = function (ev) {
      let provisoire = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const morceau = ev.results[i][0].transcript;
        if (ev.results[i].isFinal) {
          // Une phrase finale se colle a la suite, avec une espace et jamais
          // deux : le moteur rend parfois un fragment deja precede d'une.
          finalCumul = (finalCumul + ' ' + morceau.trim()).replace(/\s+/g, ' ').trim();
        } else {
          provisoire += morceau;
        }
      }
      prevenir('texte', finalCumul, provisoire.trim());
    };

    voix.onerror = function (ev) {
      const code = ev && ev.error;
      // `no-speech` et `aborted` sont la vie normale d'une rencontre : des
      // silences, et nos propres arrets. On ne derange pas l'usager avec ca.
      if (code === 'no-speech' || code === 'aborted') return;
      if (code === 'not-allowed' || code === 'service-not-allowed') {
        voulueEnMarche = false;
        prevenir('souci', 'texte-direct-refuse');
        return;
      }
      if (code === 'network') prevenir('souci', 'texte-direct-reseau');
    };

    voix.onend = function () {
      if (!voulueEnMarche) return;
      // Chrome coupe tout seul sur les silences. On relance, en surveillant
      // les relances qui echouent immediatement.
      const vecu = Date.now() - debutSession;
      if (vecu > RELANCE_VIVANTE_MS) relances = 0;
      relances += 1;
      if (relances > RELANCE_MAX) {
        voulueEnMarche = false;
        prevenir('souci', 'texte-direct-arrete');
        return;
      }
      setTimeout(function () {
        if (!voulueEnMarche) return;
        debutSession = Date.now();
        try { voix.start(); } catch (e) { /* deja demarree : sans consequence */ }
      }, RELANCE_MS);
    };

    voulueEnMarche = true;
    relances = 0;
    debutSession = Date.now();
    try { voix.start(); } catch (e) {}
  }

  function arreteVoix() {
    voulueEnMarche = false;
    if (!voix) return;
    try { voix.onend = null; voix.stop(); } catch (e) {}
    voix = null;
  }

  /* ── Enregistrement ───────────────────────────────────────────────────── */

  function formatChoisi() {
    if (typeof MediaRecorder === 'undefined') return '';
    if (!MediaRecorder.isTypeSupported) return '';
    for (let i = 0; i < FORMATS.length; i++) {
      if (MediaRecorder.isTypeSupported(FORMATS[i])) return FORMATS[i];
    }
    return '';   // le navigateur choisira ; on le laisse faire plutot que de forcer
  }

  /**
   * Demande le micro et commence. Rejette avec un code lisible plutot qu'avec
   * l'erreur brute du navigateur, dont les messages varient d'une version a
   * l'autre et ne se traduisent pas.
   */
  async function demarre() {
    if (etat !== 'arret') return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('MICRO_INDISPONIBLE');
    }
    try {
      flux = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          // Une rencontre a des voix loin du micro : la correction automatique
          // du gain sert davantage ici qu'elle ne nuit.
          autoGainControl: true
        }
      });
    } catch (e) {
      const c = e && e.name;
      if (c === 'NotAllowedError' || c === 'SecurityError') throw new Error('MICRO_REFUSE');
      if (c === 'NotFoundError' || c === 'DevicesNotFoundError') throw new Error('MICRO_ABSENT');
      throw new Error('MICRO_ERREUR');
    }

    morceaux = [];
    finalCumul = '';
    secondes = 0;
    dernierMime = formatChoisi();

    try {
      recorder = dernierMime ? new MediaRecorder(flux, { mimeType: dernierMime })
                             : new MediaRecorder(flux);
    } catch (e) {
      libereFlux();
      throw new Error('ENREGISTREUR_INDISPONIBLE');
    }
    // Le navigateur a pu retenir autre chose que ce qu'on a demande.
    dernierMime = recorder.mimeType || dernierMime;

    recorder.ondataavailable = function (ev) {
      if (ev.data && ev.data.size) morceaux.push(ev.data);
    };
    recorder.onerror = function () { prevenir('souci', 'enregistrement-interrompu'); };
    recorder.onstop = function () {
      const blob = new Blob(morceaux, { type: dernierMime || 'audio/webm' });
      libereFlux();
      prevenir('audio', blob, { secondes: secondes, mime: dernierMime });
    };

    recorder.start(TRANCHE_MS);
    demarreVoix();
    demarreHorloge();
    poseEtat('enregistre');
    prevenir('minuteur', 0);
  }

  function pause() {
    if (etat !== 'enregistre' || !recorder) return;
    try { recorder.pause(); } catch (e) {}
    arreteVoix();
    arreteHorloge();
    poseEtat('pause');
  }

  function reprend() {
    if (etat !== 'pause' || !recorder) return;
    try { recorder.resume(); } catch (e) {}
    demarreVoix();
    demarreHorloge();
    poseEtat('enregistre');
  }

  /** Termine. Le rappel `audio` recevra le blob complet. */
  function arrete() {
    if (etat === 'arret') return;
    arreteVoix();
    arreteHorloge();
    try {
      // `stop()` sur un enregistreur en pause ne declenche pas toujours un
      // dernier `ondataavailable` : on reprend une fraction de seconde pour
      // que la derniere tranche parte.
      if (recorder && recorder.state === 'paused') recorder.resume();
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      else prevenir('audio', new Blob(morceaux, { type: dernierMime || 'audio/webm' }),
                    { secondes: secondes, mime: dernierMime });
    } catch (e) {
      prevenir('souci', 'arret-impossible');
    }
    poseEtat('arret');
  }

  /** Coupe le micro. Sans ca, la pastille rouge de l'onglet reste allumee. */
  function libereFlux() {
    if (!flux) return;
    try { flux.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
    flux = null;
  }

  return {
    // `direct` dit si le texte s'ecrira PENDANT la rencontre. Il ne dit rien
    // de la qualite : la transcription de reference vient de Whisper dans les
    // deux cas.
    direct: !!Voix,
    disponible: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia
                   && typeof MediaRecorder !== 'undefined'),
    etat: function () { return etat; },
    secondes: function () { return secondes; },
    texte: function () { return finalCumul; },
    formate: formate,
    consentementDonne: consentementDonne,
    donneConsentement: donneConsentement,
    demarre: demarre, pause: pause, reprend: reprend, arrete: arrete,
    sur: function (quoi, f) { rappels[quoi] = f; }
  };
})();


/* ============================================================================
   RencAudio — decoder, reechantillonner, decouper.
   ----------------------------------------------------------------------------
   AUCUN RESEAU ICI. Ce module transforme un fichier en segments prets a
   partir ; c'est dataStore.js qui les envoie. Le partage est le meme que
   partout dans ce dossier : un seul fichier parle au serveur.

   POURQUOI TOUT CA SE FAIT DANS LE NAVIGATEUR (§3C du cahier v2). Un Worker
   Cloudflare est borne en TEMPS PROCESSEUR. Decoder un .m4a de 60 minutes est
   du calcul pur, et c'est la seule partie du travail que le navigateur fait
   mieux : le fichier est deja dans sa memoire, son processeur ne facture rien,
   et l'audio ne traverse pas le reseau deux fois.

   POURQUOI 16 kHz MONO AVANT LE DECOUPAGE, ET NON APRES. Un fichier de 60
   minutes en stereo 44,1 kHz decode tel quel occupe 60x60x44100x2x4 octets, un
   peu plus de 1,2 Go de memoire — un portable d'ecole n'en a pas la moitie de
   libre, et l'onglet meurt. En demandant a l'OfflineAudioContext de decoder
   DIRECTEMENT a 16 kHz, le meme fichier tient dans 230 Mo, puis 115 une fois
   ramene en mono. C'est la contrainte posee par Joey le 24 aout, et elle fait
   la difference entre « ca marche » et « ca marche sur ma machine ».

   16 kHz mono n'est pas une degradation : c'est exactement ce que Whisper
   consomme. Envoyer du 44,1 kHz stereo ferait transiter cinq fois plus
   d'octets pour que le modele les jette.
   ========================================================================== */

const RencAudio = (() => {

  const TAUX = 16000;          // ce que Whisper attend
  const SEGMENT_S = 300;       // 5 minutes
  const RECHERCHE_S = 5;       // fenetre de recherche d'un silence a la coupe
  const LONGUE_S = 90 * 60;    // au-dela, on previent

  const FORMATS_OK = ['.mp3', '.m4a', '.wav', '.mp4', '.webm', '.ogg', '.aac'];

  function formatAccepte(nom) {
    const n = String(nom || '').toLowerCase();
    return FORMATS_OK.some((e) => n.endsWith(e));
  }

  /**
   * Decode un fichier et rend un AudioBuffer 16 kHz MONO.
   *
   * Le taux est impose par le contexte lui-meme : `decodeAudioData` d'un
   * OfflineAudioContext reechantillonne pendant le decodage. C'est la que se
   * joue la memoire — reechantillonner APRES aurait deja fait exploser
   * l'onglet.
   *
   * Le mixage en mono passe par un second rendu plutot que par une moyenne a
   * la main : le graphe audio le fait en natif, sans copier deux canaux de
   * plusieurs centaines de mega-octets en JavaScript.
   */
  async function decode(fichier) {
    const Ctx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Ctx) throw new Error('AUDIO_INDISPONIBLE');

    let brut;
    try { brut = await fichier.arrayBuffer(); }
    catch (e) { throw new Error('LECTURE_IMPOSSIBLE'); }

    // Un contexte d'une seule image : il ne sert qu'a porter le decodeur et
    // son taux d'echantillonnage.
    const sonde = new Ctx(1, 1, TAUX);
    let decode16;
    try {
      decode16 = await sonde.decodeAudioData(brut);
    } catch (e) {
      throw new Error('FORMAT_ILLISIBLE');
    }

    if (decode16.numberOfChannels === 1) return decode16;

    const mono = new Ctx(1, decode16.length, TAUX);
    const src = mono.createBufferSource();
    src.buffer = decode16;
    src.connect(mono.destination);
    src.start();
    return await mono.startRendering();
  }

  /**
   * Cherche l'endroit le plus SILENCIEUX autour d'une coupe visee.
   *
   * Couper au milieu d'un mot donne deux moities qu'aucun modele ne recolle :
   * la fin du segment perd une syllabe, le debut du suivant commence sur un
   * fragment. On balaie cinq secondes de part et d'autre par fenetres de
   * 20 ms et on coupe la ou l'energie est la plus faible — entre deux phrases,
   * dans la vraie vie.
   *
   * On ne fait PAS de chevauchement : il ferait apparaitre les memes mots deux
   * fois dans le compte rendu, ce qui est plus visible qu'une coupe nette.
   */
  function coupeAuSilence(donnees, vise, borneMin, borneMax) {
    const fenetre = Math.round(TAUX * 0.02);
    const debut = Math.max(borneMin, vise - TAUX * RECHERCHE_S);
    const fin = Math.min(borneMax - fenetre, vise + TAUX * RECHERCHE_S);
    if (fin <= debut) return vise;

    let meilleur = vise, minimum = Infinity;
    for (let i = debut; i < fin; i += fenetre) {
      let somme = 0;
      for (let j = i; j < i + fenetre; j++) somme += donnees[j] * donnees[j];
      if (somme < minimum) { minimum = somme; meilleur = i; }
    }
    return meilleur;
  }

  /**
   * Encode une tranche de l'AudioBuffer en WAV 16 bits mono.
   * En-tete de 44 octets, PCM signe petit-boutiste — le format le plus
   * universellement lu, et celui que Whisper prend sans discuter.
   */
  function wav(donnees, debut, fin) {
    const n = fin - debut;
    const tampon = new ArrayBuffer(44 + n * 2);
    const vue = new DataView(tampon);
    const txt = (pos, s) => { for (let i = 0; i < s.length; i++) vue.setUint8(pos + i, s.charCodeAt(i)); };

    txt(0, 'RIFF');
    vue.setUint32(4, 36 + n * 2, true);
    txt(8, 'WAVE');
    txt(12, 'fmt ');
    vue.setUint32(16, 16, true);          // taille du bloc fmt
    vue.setUint16(20, 1, true);           // PCM
    vue.setUint16(22, 1, true);           // mono
    vue.setUint32(24, TAUX, true);
    vue.setUint32(28, TAUX * 2, true);    // octets par seconde
    vue.setUint16(32, 2, true);           // alignement de bloc
    vue.setUint16(34, 16, true);          // bits par echantillon
    txt(36, 'data');
    vue.setUint32(40, n * 2, true);

    let p = 44;
    for (let i = debut; i < fin; i++) {
      // Bornage avant conversion : un echantillon a 1.02 deviendrait un
      // craquement en repassant par le bas de l'entier signe.
      const v = Math.max(-1, Math.min(1, donnees[i]));
      vue.setInt16(p, v < 0 ? v * 0x8000 : v * 0x7FFF, true);
      p += 2;
    }
    return tampon;
  }

  /**
   * Decoupe un AudioBuffer en segments de ~5 minutes, coupes au silence.
   * @returns {Array<{wav:ArrayBuffer, secondes:number, index:number}>}
   */
  function segmente(buffer) {
    const donnees = buffer.getChannelData(0);
    const total = donnees.length;
    const pas = SEGMENT_S * TAUX;
    const out = [];
    let debut = 0, index = 0;

    while (debut < total) {
      let fin = debut + pas;
      if (fin >= total) fin = total;
      else fin = coupeAuSilence(donnees, fin, debut + Math.round(pas / 2), total);
      out.push({
        wav: wav(donnees, debut, fin),
        secondes: (fin - debut) / TAUX,
        index: index++
      });
      debut = fin;
    }
    return out;
  }

  return {
    TAUX: TAUX,
    SEGMENT_S: SEGMENT_S,
    LONGUE_S: LONGUE_S,
    formatAccepte: formatAccepte,
    decode: decode,
    segmente: segmente,
    wav: wav
  };
})();
