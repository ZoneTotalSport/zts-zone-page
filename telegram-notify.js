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

    sendTelegram(
      '📊 <b>Nouveau visiteur!</b>\n' +
      '📄 Page: <code>' + page + '</code>\n' +
      '🔗 Source: ' + ref + '\n' +
      '🕐 ' + date + ' à ' + time
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

  // Envoyer la notification de visite au chargement
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', notifyVisit);
  } else {
    notifyVisit();
  }

})();
