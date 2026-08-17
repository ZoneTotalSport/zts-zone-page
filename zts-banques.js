/**
 * ZTS Banques — accès client aux banques de données servies par le Worker.
 *
 * LOT 1 vague D, 2026-08-17. Les banques ne sont plus des fichiers statiques
 * servis par GitHub Pages : elles vivent dans R2, derrière
 * https://zts-jeux-data.zts-ccd.workers.dev, en deux portées —
 *   /<banque>/public.json   tout le monde, vitrines + champs de liste
 *   /<banque>/full.json     jeton Firebase valide, la banque entière
 *   /sae/detail/<f>.json    jeton requis, un fichier de détail
 *   /planification/<f>.json jeton requis, un fichier de planification
 *
 * POURQUOI CE MODULE EXISTE
 * Cinq consommateurs doivent maintenant présenter un jeton. Répéter la logique
 * cinq fois, c'est cinq occasions de rater le cas qui compte : le JETON EXPIRÉ.
 *
 * LE CAS DU JETON EXPIRÉ — la raison d'être de ce fichier.
 * Un jeton Firebase vit une heure. Le planificateur, gaté depuis la vague A,
 * est le genre d'outil qu'on laisse ouvert tout un après-midi : au retour,
 * `getIdToken(false)` peut rendre un jeton périmé, le Worker répond 401, et
 * l'app afficherait une banque VIDE à un membre parfaitement légitime — sans
 * erreur visible, juste un écran creux. C'est le pire mode de panne : il
 * ressemble à « il n'y a rien » plutôt qu'à « ça n'a pas marché ».
 * On force donc UN rafraîchissement (`getIdToken(true)`) et on réessaie une
 * fois avant de conclure quoi que ce soit. Une seule reprise : au-delà, c'est
 * que la session est vraiment finie, et boucler ne ferait qu'aggraver.
 *
 * Charge avec `defer`. Dépend de firebase-auth.js pour le jeton, mais
 * fonctionne sans lui : sans jeton, on demande la charge publique.
 */
(function (root) {
  'use strict';

  var BASE = 'https://zts-jeux-data.zts-ccd.workers.dev';

  // Un fetch par (banque, portée) et par page : les deux SPA appellent parfois
  // deux fois au démarrage, et 12 Mo tirés deux fois ne pardonnent pas.
  var _enCours = {};

  function jetonBrut(forcer) {
    try {
      var u = root.firebase && root.firebase.auth && root.firebase.auth().currentUser;
      if (!u) return Promise.resolve(null);
      return u.getIdToken(!!forcer).catch(function (e) {
        console.warn('[banques] getIdToken:', e && e.message);
        return null;
      });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  // Attend que firebase-auth.js ait tranché — sinon un membre qui recharge
  // tombe sur la charge publique parce que l'auth n'avait pas encore répondu,
  // et se retrouve avec une app amputée sans comprendre pourquoi.
  function attendreAuth() {
    return new Promise(function (resolve) {
      if (!root.ztsOnAuth) {
        var essais = 0;
        var t = setInterval(function () {
          if (root.ztsOnAuth || ++essais > 25) {   // 5 s au plus
            clearInterval(t);
            if (root.ztsOnAuth) root.ztsOnAuth(function (u) { resolve(u); });
            else resolve(null);
          }
        }, 200);
        return;
      }
      var fait = false;
      root.ztsOnAuth(function (u) { if (!fait) { fait = true; resolve(u); } });
    });
  }

  function appel(chemin, jeton) {
    var opts = { cache: 'default' };
    if (jeton) opts.headers = { Authorization: 'Bearer ' + jeton };
    return fetch(BASE + chemin, opts);
  }

  /**
   * Charge une banque.
   * @param {string} chemin  ex. '/jeux/full.json', '/sae/detail/prescolaire.json'
   * @param {{public?: string}} opts  chemin de repli si pas de jeton
   */
  function charge(chemin, opts) {
    opts = opts || {};
    var cle = chemin;
    if (_enCours[cle]) return _enCours[cle];

    var p = attendreAuth().then(function (user) {
      if (!user) {
        // Anonyme : la charge publique, ou rien si la route n'en a pas.
        if (!opts.public) {
          return Promise.reject(new Error('compte requis pour ' + chemin));
        }
        return appel(opts.public, null).then(lis);
      }

      return jetonBrut(false).then(function (jeton) {
        return appel(chemin, jeton).then(function (r) {
          if (r.status !== 401) return lis(r);

          // LE CAS QUI COMPTE : jeton périmé alors que la session est vivante.
          // Un rafraîchissement forcé, un seul réessai.
          console.warn('[banques] 401 avec une session active — rafraîchissement du jeton');
          return jetonBrut(true).then(function (frais) {
            if (!frais) throw new Error('session expirée');
            return appel(chemin, frais).then(function (r2) {
              if (r2.ok) return lis(r2);
              // Toujours refusé : on le dit, on ne rend pas un tableau vide.
              throw new Error('refus après rafraîchissement (' + r2.status + ')');
            });
          });
        });
      });
    });

    // Un échec ne doit pas empoisonner les appels suivants de la page.
    p = p.catch(function (e) { delete _enCours[cle]; throw e; });
    _enCours[cle] = p;
    return p;
  }

  function lis(r) {
    if (!r.ok) throw new Error('banque ' + r.status);
    return r.json();
  }

  root.ZTSBanques = {
    charge: charge,
    // Raccourcis lisibles pour les appelants.
    jeux: function () { return charge('/jeux/full.json', { public: '/jeux/public.json' }); },
    sae: function () { return charge('/sae/full.json', { public: '/sae/public.json' }); },
    saeDetail: function (f) { return charge('/sae/detail/' + f); },
    moyensAction: function () { return charge('/moyens-action/full.json'); },
    planification: function (f) { return charge('/planification/' + f); },
    BASE: BASE
  };
})(window);
