/**
 * ZTS - Telegram Notifications
 * Envoie des notifications au bot Telegram de Joey
 * pour les visites, inscriptions et avis
 */
(function() {
  'use strict';

  var BOT_TOKEN = '8629738673:AAHOU6Gq1pUE1h2K0QJ-edYcS2rw1snk_uI';
  var CHAT_ID = '897290762';
  var API_URL = 'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage';

  // ── ntfy.sh : push notif phone (alternative Telegram) ──
  // Topic prive, dur a deviner. Installer app ntfy + s'abonner a ce topic.
  var NTFY_TOPIC = 'zts-joey-9k3mq7xv4p';
  var NTFY_URL = 'https://ntfy.sh/' + NTFY_TOPIC;

  function sendNtfy(title, message, priority, tags) {
    try {
      fetch(NTFY_URL, {
        method: 'POST',
        headers: {
          'Title': title,
          'Priority': priority || '3',
          'Tags': tags || ''
        },
        body: message
      }).catch(function(){});
    } catch(e) {}
  }

  // Strip HTML tags pour ntfy (texte brut)
  function stripHtml(s) {
    return String(s).replace(/<[^>]+>/g, '').replace(/\n+/g, '\n').trim();
  }

  // Anti-spam: max 1 notif visite par session
  var _visitNotified = sessionStorage.getItem('zts_visit_notif');

  // ── Worker proxy first-party (bypass Brave/uBlock) ──
  var WORKER_URL = 'https://notify.zonetotalsport.ca/';

  function sendViaWorker(title, message, priority, tags) {
    return fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title, message: message, priority: priority || 3, tags: tags || '' })
    });
  }

  function sendTelegram(text, ntfyMeta) {
    var clean = stripHtml(text);
    var firstLine = clean.split('\n')[0] || 'ZTS';
    var rest = clean.split('\n').slice(1).join('\n') || clean;
    var meta = ntfyMeta || {};

    // 1) Try Worker proxy (server-side, bypass tous bloqueurs). Si OK, stop.
    sendViaWorker(firstLine, rest, meta.priority, meta.tags)
      .then(function(r) {
        if (r && r.ok) return; // Worker a tout fait
        throw new Error('worker not ok');
      })
      .catch(function() {
        // 2) Fallback: direct ntfy + Telegram (marche pour browsers permissifs)
        if (ntfyMeta !== false) sendNtfy(firstLine, rest, meta.priority, meta.tags);
        fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'HTML' })
        }).catch(function(){});
      });
  }

  // ── Notification de visite ──
  function notifyVisit() {
    if (_visitNotified) return;
    sessionStorage.setItem('zts_visit_notif', '1');
    _visitNotified = true;

    var page = window.location.pathname || '/';
    var ref = document.referrer || 'Direct';
    var now = new Date();
    var time = now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
    var date = now.toLocaleDateString('fr-CA');
    var lang = navigator.language || 'inconnu';
    var platform = navigator.platform || 'inconnu';
    var screen = window.screen ? window.screen.width + 'x' + window.screen.height : 'inconnu';
    var mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? '📱 Mobile' : '💻 Desktop';

    sendTelegram(
      '📊 <b>Nouveau visiteur!</b>\n' +
      '📄 Page: <code>' + page + '</code>\n' +
      '🔗 Source: ' + ref + '\n' +
      mobile + ' | 🖥 ' + screen + '\n' +
      '🌐 Langue: ' + lang + ' | ' + platform + '\n' +
      '🕐 ' + date + ' a ' + time
    );
  }

  // ── Notification d'inscription ──
  window.ztsNotifySignup = function(user) {
    var name = user.displayName || 'Inconnu';
    var email = user.email || 'N/A';
    var method = user.providerData && user.providerData[0] ? user.providerData[0].providerId : 'email';
    var methodLabel = method === 'google.com' ? 'Google' : 'Courriel';

    sendTelegram(
      '🎉 <b>Nouveau membre!</b>\n' +
      '👤 Nom: ' + name + '\n' +
      '📧 Courriel: ' + email + '\n' +
      '🔑 Méthode: ' + methodLabel + '\n' +
      '🕐 ' + new Date().toLocaleString('fr-CA')
    );
  };

  // ── Notification de connexion ──
  window.ztsNotifyLogin = function(user) {
    var name = user.displayName || 'Inconnu';
    var email = user.email || 'N/A';
    var mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? '📱 Mobile' : '💻 Desktop';
    var now = new Date();
    var time = now.toLocaleString('fr-CA');

    // Enrichir avec géolocalisation
    fetch('https://ipapi.co/json/')
      .then(function(r) { return r.json(); })
      .then(function(geo) {
        sendTelegram(
          '🔑 <b>Connexion!</b>\n' +
          '👤 ' + name + '\n' +
          '📧 ' + email + '\n' +
          mobile + '\n' +
          '📍 ' + (geo.city || '?') + ', ' + (geo.region || '?') + ', ' + (geo.country_name || '?') + '\n' +
          '🕐 ' + time
        );
      })
      .catch(function() {
        sendTelegram(
          '🔑 <b>Connexion!</b>\n' +
          '👤 ' + name + '\n' +
          '📧 ' + email + '\n' +
          mobile + '\n' +
          '🕐 ' + time
        );
      });
  };

  // ── Notification d'avis ──
  window.ztsNotifyReview = function(data) {
    var stars = '';
    for (var i = 0; i < data.rating; i++) stars += '⭐';

    sendTelegram(
      '📝 <b>Nouvel avis soumis!</b>\n' +
      '👤 ' + data.name + ' (' + data.role + ', ' + data.city + ')\n' +
      stars + '\n' +
      '💬 "' + data.message.substring(0, 200) + '"\n' +
      '⏳ En attente de modération'
    );
  };

  // ── Enrichir avec géolocalisation (IP) ──
  function notifyVisitWithGeo() {
    if (sessionStorage.getItem('zts_visit_notif')) return;

    fetch('https://ipapi.co/json/')
      .then(function(r) { return r.json(); })
      .then(function(geo) {
        sessionStorage.setItem('zts_visit_notif', '1');

        var page = window.location.pathname || '/';
        var ref = document.referrer || 'Direct';
        var now = new Date();
        var time = now.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' });
        var date = now.toLocaleDateString('fr-CA');
        var lang = navigator.language || 'inconnu';
        var screen = window.screen ? window.screen.width + 'x' + window.screen.height : 'inconnu';
        var mobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? '📱 Mobile' : '💻 Desktop';

        // Vérifier si l'utilisateur est connecté (Firebase Auth)
        var user = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
        var userLine = user
          ? '👤 ' + (user.displayName || 'Membre') + ' | 📧 ' + (user.email || '?')
          : '👤 Visiteur anonyme';

        sendTelegram(
          '📊 <b>Nouveau visiteur!</b>\n' +
          userLine + '\n' +
          '📄 Page: <code>' + page + '</code>\n' +
          '🔗 Source: ' + ref + '\n' +
          mobile + ' | 🖥 ' + screen + '\n' +
          '🌐 Langue: ' + lang + '\n' +
          '📍 ' + (geo.city || '?') + ', ' + (geo.region || '?') + ', ' + (geo.country_name || '?') + '\n' +
          '🏢 FAI: ' + (geo.org || '?') + '\n' +
          '🕐 ' + date + ' a ' + time
        );
      })
      .catch(function() {
        // Fallback sans géo
        notifyVisit();
      });
  }

  // Envoyer la notification de visite au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', notifyVisitWithGeo);
  } else {
    notifyVisitWithGeo();
  }

  // ============================================================
  // SESSION TRACKER — pour comprendre pourquoi ça ne s'inscrit pas
  // ============================================================
  var session = {
    start: Date.now(),
    pages: [window.location.pathname],
    scrollMax: 0,
    appClicks: [],
    popupsShown: [],
    popupsConverted: [],
    signedUp: false,
    city: '(?)',
    summarySent: false
  };

  // Géoloc en cache pour le summary
  fetch('https://ipapi.co/json/')
    .then(function(r) { return r.json(); })
    .then(function(g) { session.city = (g.city || '?') + ', ' + (g.country_name || '?'); })
    .catch(function() {});

  // Track scroll max
  window.addEventListener('scroll', function() {
    var pct = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
    if (pct > session.scrollMax) session.scrollMax = pct;
  }, { passive: true });

  // Track clics sur apps (meme si anonyme)
  document.addEventListener('click', function(e) {
    var target = e.target.closest('[onclick*="ztsOpenApp"], [data-protected="true"], .app-card');
    if (!target) return;
    var name = (target.textContent || target.getAttribute('alt') || '').trim().slice(0, 40);
    if (!name) return;
    // Dedup: ne pas logger 2x la meme app
    if (session.appClicks.indexOf(name) === -1) session.appClicks.push(name);

    // Notif immediate si clic sans etre connecte
    var user = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
    if (!user && !sessionStorage.getItem('zts_click_notif_' + name)) {
      sessionStorage.setItem('zts_click_notif_' + name, '1');
      sendTelegram('🖱️ <b>Clic app sans compte</b>\n🎯 ' + name + '\n📍 ' + session.city + '\n⏳ Popup affiche — lead chaud');
    }
  }, { passive: true, capture: true });

  // Hook popup shown
  var _origShown = window.ztsTrackPopupShown || function(){};
  window.ztsTrackPopupShown = function(name) {
    if (session.popupsShown.indexOf(name) === -1) session.popupsShown.push(name);
    return _origShown.apply(this, arguments);
  };

  // Hook popup converted
  var _origConv = window.ztsTrackPopupConverted || function(){};
  window.ztsTrackPopupConverted = function(name) {
    if (session.popupsConverted.indexOf(name) === -1) session.popupsConverted.push(name);
    return _origConv.apply(this, arguments);
  };

  // Hook signup -> marque la session
  var _origSignup = window.ztsNotifySignup;
  window.ztsNotifySignup = function(user) {
    session.signedUp = true;
    if (_origSignup) _origSignup.apply(this, arguments);
  };

  // ============================================================
  // SUMMARY a la fermeture / navigation
  // ============================================================
  function sendSummary() {
    if (session.summarySent) return;
    if (session.signedUp) return; // pas de summary si inscrit (deja notif separee)
    // Evite les summaries trop courts (bot ou rebond <5s)
    var durMs = Date.now() - session.start;
    if (durMs < 5000) return;

    session.summarySent = true;

    var min = Math.floor(durMs / 60000);
    var sec = Math.floor((durMs % 60000) / 1000);
    var dur = (min > 0 ? min + 'min ' : '') + sec + 's';

    var user = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth().currentUser : null;
    var userLine = user ? '✅ ' + (user.email || 'Membre') + ' (deja membre)' : '🚫 <b>Non inscrit</b>';

    var text = '👋 <b>Visiteur parti</b>\n' +
      userLine + '\n' +
      '📍 ' + session.city + '\n' +
      '⏱️ Session: ' + dur + ' | 📜 Scroll: ' + session.scrollMax + '%\n' +
      '🎯 Apps cliquees: ' + (session.appClicks.length ? session.appClicks.join(', ') : 'aucune') + '\n' +
      '👁️ Popup vu: ' + (session.popupsShown.length ? 'oui (' + session.popupsShown.join(', ') + ')' : 'non') + '\n' +
      '✅ Popup converti: ' + (session.popupsConverted.length ? 'oui' : 'non');

    // sendBeacon pour garantir l'envoi avant unload
    try {
      var blob = new Blob([JSON.stringify({ chat_id: CHAT_ID, text: text, parse_mode: 'HTML' })],
                         { type: 'application/json' });
      navigator.sendBeacon(API_URL, blob);
    } catch (e) {
      sendTelegram(text);
    }
  }

  window.addEventListener('pagehide', sendSummary);
  window.addEventListener('beforeunload', sendSummary);
  // Aussi sur changement de visibilite mobile (onglet en arriere-plan)
  document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') sendSummary();
  });

})();
