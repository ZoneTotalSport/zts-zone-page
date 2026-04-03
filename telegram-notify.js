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

  // Anti-spam: max 1 notif visite par session
  var _visitNotified = sessionStorage.getItem('zts_visit_notif');

  function sendTelegram(text) {
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    }).catch(function(err) {
      console.log('[ZTS Telegram] Erreur:', err);
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

})();
