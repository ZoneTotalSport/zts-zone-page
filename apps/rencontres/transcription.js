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
