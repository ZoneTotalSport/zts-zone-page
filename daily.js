/**
 * ZTS Zone - Section "Aujourd'hui"
 * Jeu du jour + Meteo + Ephemeride ÉPS
 * Rotation deterministe : meme date = meme contenu pour tous les visiteurs.
 */
(function(){
  'use strict';

  // ============================================
  // UTILS : date du jour + hash deterministe
  // ============================================
  function getToday() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return { iso: y + '-' + m + '-' + day, mmdd: m + '-' + day, year: y, month: +m, day: +day, full: d };
  }

  function getDayOfYear(d) {
    var start = new Date(d.getFullYear(), 0, 0);
    var diff = d - start;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  // ============================================
  // METEO : Open-Meteo API (gratuit, sans cle)
  // ============================================
  async function getWeather() {
    try {
      // Tente geolocation (non-bloquante, fallback Saint-Jean-sur-Richelieu QC)
      var coords = await new Promise(function(resolve) {
        if (!navigator.geolocation) return resolve({ lat: 45.31, lon: -73.26, city: 'Saint-Jean-sur-Richelieu' });
        var timed = setTimeout(function() { resolve({ lat: 45.31, lon: -73.26, city: 'Saint-Jean-sur-Richelieu' }); }, 3000);
        navigator.geolocation.getCurrentPosition(
          function(pos) { clearTimeout(timed); resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, city: 'Ta position' }); },
          function() { clearTimeout(timed); resolve({ lat: 45.31, lon: -73.26, city: 'Saint-Jean-sur-Richelieu' }); },
          { timeout: 3000, maximumAge: 3600000 }
        );
      });
      var url = 'https://api.open-meteo.com/v1/forecast?latitude=' + coords.lat + '&longitude=' + coords.lon +
                '&current=temperature_2m,precipitation,wind_speed_10m,weather_code&timezone=auto&forecast_days=1';
      var res = await fetch(url);
      var data = await res.json();
      var c = data.current || {};
      var temp = Math.round(c.temperature_2m);
      var wind = Math.round(c.wind_speed_10m);
      var rain = c.precipitation || 0;
      var code = c.weather_code;
      var emoji = weatherEmoji(code);
      var label = weatherLabel(code);
      // Decision gym vs exterieur
      var decision, reason;
      if (temp < -10) { decision = 'GYMNASE'; reason = 'Trop froid (' + temp + '°C)'; }
      else if (temp > 30) { decision = 'GYMNASE'; reason = 'Trop chaud (' + temp + '°C)'; }
      else if (rain > 1) { decision = 'GYMNASE'; reason = 'Pluie/neige active'; }
      else if (wind > 40) { decision = 'GYMNASE'; reason = 'Vent fort (' + wind + ' km/h)'; }
      else if (temp >= 5 && temp <= 25 && wind < 25) { decision = 'EXTERIEUR'; reason = 'Temps idéal dehors'; }
      else { decision = 'AU CHOIX'; reason = 'Temps correct'; }
      return { temp: temp, wind: wind, rain: rain, emoji: emoji, label: label, city: coords.city, decision: decision, reason: reason };
    } catch(e) {
      console.warn('[ZTS Daily] Weather failed:', e);
      return null;
    }
  }

  function weatherEmoji(code) {
    if (code === 0) return '☀️';
    if (code <= 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code <= 49) return '🌫️';
    if (code <= 59) return '🌧️';
    if (code <= 69) return '🌦️';
    if (code <= 79) return '❄️';
    if (code <= 99) return '⛈️';
    return '🌡️';
  }
  function weatherLabel(code) {
    if (code === 0) return 'Ensoleillé';
    if (code <= 2) return 'Peu nuageux';
    if (code === 3) return 'Nuageux';
    if (code <= 49) return 'Brumeux';
    if (code <= 59) return 'Bruine';
    if (code <= 69) return 'Pluie';
    if (code <= 79) return 'Neige';
    if (code <= 99) return 'Orage';
    return '';
  }

  // ============================================
  // JEU DU JOUR : pick deterministe dans la banque
  // ============================================
  function getDailyGame() {
    // La banque est dans window.gamesI18n (definie dans index.html)
    var games = window.gamesI18n && window.gamesI18n.fr;
    if (!games || !games.length) return null;
    var dayNum = getDayOfYear(new Date());
    // Seed base sur jour + annee pour que le jeu change chaque annee (optionnel)
    var idx = dayNum % games.length;
    var game = games[idx];
    return game;
  }

  // ============================================
  // EPHEMERIDE : pick exact dans JSON ou fallback
  // ============================================
  async function getEphemeride() {
    var today = getToday();
    try {
      // Chargement parallele
      var [ephRes, conRes] = await Promise.all([
        fetch('ephemerides.json?v=1'),
        fetch('conseils-eps.json?v=1')
      ]);
      var ephemerides = await ephRes.json();
      var conseils = await conRes.json();
      // Verifie si on a une ephemeride specifique
      if (ephemerides[today.mmdd]) {
        var e = ephemerides[today.mmdd];
        return { type: 'event', year: e.year, title: e.title, desc: e.desc, activity: e.activity };
      }
      // Sinon fallback : conseil EPS rotatif
      var dayNum = getDayOfYear(today.full);
      var conseil = conseils[dayNum % conseils.length];
      return { type: 'tip', title: conseil.title, desc: conseil.desc, activity: conseil.activity };
    } catch(e) {
      console.warn('[ZTS Daily] Ephemeride load failed:', e);
      return null;
    }
  }

  // ============================================
  // PAUSE EPS : citation/blague/fait + quiz
  // ============================================
  async function getFunPause() {
    var today = getToday();
    try {
      var [blagRes, quizRes] = await Promise.all([
        fetch('blagues-citations.json?v=1'),
        fetch('quiz-sportif.json?v=1')
      ]);
      var blagues = await blagRes.json();
      var quiz = await quizRes.json();
      var dayNum = getDayOfYear(today.full);
      return {
        blague: blagues[dayNum % blagues.length],
        quiz: quiz[dayNum % quiz.length]
      };
    } catch(e) {
      console.warn('[ZTS Daily] Pause load failed:', e);
      return null;
    }
  }

  // ============================================
  // RENDU PAUSE EPS : citation + quiz
  // ============================================
  async function renderPause() {
    var container = document.getElementById('ztsPauseGrid');
    if (!container) return;
    var data = await getFunPause();
    if (!data) { container.innerHTML = '<div style="color:#fff;text-align:center;padding:20px">Chargement...</div>'; return; }

    var html = '';
    // Carte Citation/Blague/Fait
    var b = data.blague;
    var typeEmoji = { citation: '💬', blague: '😂', fait: '🎯' }[b.type] || '✨';
    var typeLabel = { citation: 'CITATION DU JOUR', blague: 'BLAGUE DU JOUR', fait: 'LE SAVAIS-TU?' }[b.type] || 'AUJOURD\'HUI';
    var authorHtml = b.author ? '<div class="zts-pause-author">— ' + b.author + '</div>' : '';
    html += '<div class="zts-pause-card zts-pause-quote">' +
      '<div class="zts-pause-label">' + typeEmoji + ' ' + typeLabel + '</div>' +
      '<div class="zts-pause-quote-text">« ' + b.text + ' »</div>' +
      authorHtml +
      '</div>';

    // Carte Quiz interactif
    var q = data.quiz;
    var choicesHtml = q.choices.map(function(c, i){
      return '<button class="zts-pause-choice" data-idx="' + i + '">' + c + '</button>';
    }).join('');
    html += '<div class="zts-pause-card zts-pause-quiz" data-answer="' + q.answer + '" data-fact="' + (q.fact || '').replace(/"/g, '&quot;') + '">' +
      '<div class="zts-pause-label">🧠 QUIZ SPORTIF</div>' +
      '<div class="zts-pause-question">' + q.q + '</div>' +
      '<div class="zts-pause-choices">' + choicesHtml + '</div>' +
      '<div class="zts-pause-feedback" style="display:none"></div>' +
      '</div>';

    container.innerHTML = html;

    // Attache event click aux boutons choix
    var quizCard = container.querySelector('.zts-pause-quiz');
    if (quizCard) {
      var answerIdx = parseInt(quizCard.getAttribute('data-answer'), 10);
      var fact = quizCard.getAttribute('data-fact');
      var buttons = quizCard.querySelectorAll('.zts-pause-choice');
      var feedback = quizCard.querySelector('.zts-pause-feedback');
      buttons.forEach(function(btn) {
        btn.addEventListener('click', function() {
          var chosen = parseInt(btn.getAttribute('data-idx'), 10);
          buttons.forEach(function(b) { b.disabled = true; });
          buttons[answerIdx].classList.add('correct');
          if (chosen !== answerIdx) btn.classList.add('wrong');
          feedback.innerHTML = (chosen === answerIdx ? '✅ Bonne reponse! ' : '❌ La bonne reponse etait : <strong>' + q.choices[answerIdx] + '</strong>. ') + (fact ? '<br><em>' + fact + '</em>' : '');
          feedback.style.display = 'block';
        });
      });
    }
  }

  // ============================================
  // RENDU : injecte dans #ztsTodaySection
  // ============================================
  async function render() {
    var container = document.getElementById('ztsTodayGrid');
    if (!container) return;

    // Date formatee francais
    var today = new Date();
    var dateStr = today.toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });

    // Render squelette immediat
    container.innerHTML = '<div class="zts-today-card zts-today-weather"><div class="zts-today-label">🌤️ Météo & Plan</div><div class="zts-today-body">Chargement...</div></div>' +
      '<div class="zts-today-card zts-today-game"><div class="zts-today-label">🎮 Jeu du Jour</div><div class="zts-today-body">Chargement...</div></div>' +
      '<div class="zts-today-card zts-today-eph"><div class="zts-today-label">📅 Éphéméride ÉPS</div><div class="zts-today-body">Chargement...</div></div>';

    var dateEl = document.getElementById('ztsTodayDate');
    if (dateEl) dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    // Lance en parallele
    var [weather, ephemeride] = await Promise.all([getWeather(), getEphemeride()]);
    var game = getDailyGame();

    // Render cards
    var html = '';

    // Carte Meteo
    if (weather) {
      var badgeColor = weather.decision === 'EXTERIEUR' ? '#10B981' : weather.decision === 'GYMNASE' ? '#F59E0B' : '#6366F1';
      html += '<div class="zts-today-card zts-today-weather">' +
        '<div class="zts-today-label">🌤️ Météo & Plan</div>' +
        '<div class="zts-today-body">' +
          '<div class="zts-today-weather-big">' + weather.emoji + ' <strong>' + weather.temp + '°C</strong></div>' +
          '<div class="zts-today-weather-label">' + weather.label + ' • ' + weather.city + '</div>' +
          '<div class="zts-today-weather-details">💨 ' + weather.wind + ' km/h</div>' +
          '<div class="zts-today-decision" style="background:' + badgeColor + '"><strong>' + weather.decision + '</strong></div>' +
          '<div class="zts-today-reason">' + weather.reason + '</div>' +
        '</div></div>';
    } else {
      html += '<div class="zts-today-card zts-today-weather"><div class="zts-today-label">🌤️ Météo</div><div class="zts-today-body">Météo indisponible</div></div>';
    }

    // Carte Jeu du Jour
    if (game) {
      var tagsHtml = (game.tags || []).map(function(t){ return '<span class="zts-today-tag">' + t + '</span>'; }).join('');
      html += '<div class="zts-today-card zts-today-game">' +
        '<div class="zts-today-label">🎮 Jeu du Jour</div>' +
        '<div class="zts-today-body">' +
          '<div class="zts-today-game-title">' + game.name + '</div>' +
          '<div class="zts-today-game-desc">' + game.desc + '</div>' +
          '<div class="zts-today-tags">' + tagsHtml + '</div>' +
          '<button class="zts-today-cta" onclick="window.ztsOpenApp && window.ztsOpenApp(\'https://jeux.zonetotalsport.ca\')">Voir 150 autres jeux →</button>' +
        '</div></div>';
    }

    // Carte Ephemeride
    if (ephemeride) {
      var yearTxt = ephemeride.year ? '<span class="zts-today-year">' + ephemeride.year + '</span> ' : '';
      var typeIcon = ephemeride.type === 'event' ? '📜' : '💡';
      html += '<div class="zts-today-card zts-today-eph">' +
        '<div class="zts-today-label">' + typeIcon + ' ' + (ephemeride.type === 'event' ? 'Éphéméride ÉPS' : 'Conseil du Jour') + '</div>' +
        '<div class="zts-today-body">' +
          '<div class="zts-today-eph-title">' + yearTxt + ephemeride.title + '</div>' +
          '<div class="zts-today-eph-desc">' + ephemeride.desc + '</div>' +
          '<div class="zts-today-eph-activity"><strong>En classe :</strong> ' + ephemeride.activity + '</div>' +
        '</div></div>';
    }

    container.innerHTML = html;
  }

  // ============================================
  // INIT
  // ============================================
  function initAll() {
    render();
    renderPause();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
