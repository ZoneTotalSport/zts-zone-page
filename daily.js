/**
 * ZTS Zone - Section "Aujourd'hui"
 * Jeu du jour + Meteo + Ephemeride ÉPS + Suggestions par cycle
 * Rotation deterministe : meme date = meme contenu pour tous les visiteurs.
 * Trilingue : FR / EN / ZH (utilise window.currentLang)
 */
(function(){
  'use strict';

  // ============================================
  // LABELS : FR / EN / ZH
  // ============================================
  var LABELS = {
    fr: {
      meteo: 'Météo & Plan',
      jeu: 'Jeu du Jour',
      ephemeride: 'Éphéméride ÉPS',
      conseil: 'Conseil du Jour',
      loading: 'Chargement...',
      inClass: 'En classe :',
      GYMNASE: 'GYMNASE',
      EXTERIEUR: 'EXTÉRIEUR',
      'AU CHOIX': 'AU CHOIX',
      reason_cold: 'Trop froid',
      reason_hot: 'Trop chaud',
      reason_rain: 'Pluie/neige active',
      reason_wind: 'Vent fort',
      reason_ideal: 'Temps idéal dehors',
      reason_ok: 'Temps correct',
      w_sunny: 'Ensoleillé',
      w_partly: 'Peu nuageux',
      w_cloudy: 'Nuageux',
      w_fog: 'Brumeux',
      w_drizzle: 'Bruine',
      w_rain: 'Pluie',
      w_snow: 'Neige',
      w_storm: 'Orage',
      type_citation: 'CITATION DU JOUR',
      type_blague: 'BLAGUE DU JOUR',
      type_fait: 'LE SAVAIS-TU?',
      type_default: "AUJOURD'HUI",
      quiz: '🧠 QUIZ SPORTIF',
      quiz_good: '✅ Bonne réponse! ',
      quiz_bad: '❌ La bonne réponse était : ',
      cta_games: 'Voir 150 autres jeux →',
      weather_unavailable: 'Météo indisponible',
      your_position: 'Ta position',
      cycles_label: '🎯 SUGGESTIONS PAR CYCLE',
      c1: '1er',
      c2: '2e',
      c3: '3e',
      locale: 'fr-CA'
    },
    en: {
      meteo: 'Weather & Plan',
      jeu: 'Game of the Day',
      ephemeride: 'PE Almanac',
      conseil: 'Tip of the Day',
      loading: 'Loading...',
      inClass: 'In class:',
      GYMNASE: 'GYM',
      EXTERIEUR: 'OUTDOOR',
      'AU CHOIX': 'YOUR CHOICE',
      reason_cold: 'Too cold',
      reason_hot: 'Too hot',
      reason_rain: 'Active rain/snow',
      reason_wind: 'Strong wind',
      reason_ideal: 'Perfect outside',
      reason_ok: 'Decent weather',
      w_sunny: 'Sunny',
      w_partly: 'Partly cloudy',
      w_cloudy: 'Cloudy',
      w_fog: 'Foggy',
      w_drizzle: 'Drizzle',
      w_rain: 'Rain',
      w_snow: 'Snow',
      w_storm: 'Storm',
      type_citation: 'QUOTE OF THE DAY',
      type_blague: 'JOKE OF THE DAY',
      type_fait: 'DID YOU KNOW?',
      type_default: 'TODAY',
      quiz: '🧠 SPORTS QUIZ',
      quiz_good: '✅ Correct! ',
      quiz_bad: '❌ The right answer was: ',
      cta_games: 'See 150 more games →',
      weather_unavailable: 'Weather unavailable',
      your_position: 'Your location',
      cycles_label: '🎯 SUGGESTIONS BY CYCLE',
      c1: 'Gr 1-2',
      c2: 'Gr 3-4',
      c3: 'Gr 5-6',
      locale: 'en-CA'
    },
    zh: {
      meteo: '天气与计划',
      jeu: '每日游戏',
      ephemeride: '体育日历',
      conseil: '每日贴士',
      loading: '加载中...',
      inClass: '课堂上：',
      GYMNASE: '室内',
      EXTERIEUR: '户外',
      'AU CHOIX': '自由选择',
      reason_cold: '太冷',
      reason_hot: '太热',
      reason_rain: '雨雪天',
      reason_wind: '大风',
      reason_ideal: '户外理想',
      reason_ok: '天气还行',
      w_sunny: '晴天',
      w_partly: '少云',
      w_cloudy: '多云',
      w_fog: '雾',
      w_drizzle: '毛毛雨',
      w_rain: '雨',
      w_snow: '雪',
      w_storm: '暴风雨',
      type_citation: '今日名言',
      type_blague: '今日笑话',
      type_fait: '你知道吗？',
      type_default: '今天',
      quiz: '🧠 体育问答',
      quiz_good: '✅ 答对了！',
      quiz_bad: '❌ 正确答案是：',
      cta_games: '查看其他 150 款游戏 →',
      weather_unavailable: '天气信息不可用',
      your_position: '你的位置',
      cycles_label: '🎯 按学段推荐',
      c1: '低段',
      c2: '中段',
      c3: '高段',
      locale: 'zh-CN'
    }
  };

  function L(key) {
    var lang = window.currentLang || 'fr';
    var bag = LABELS[lang] || LABELS.fr;
    if (bag[key] !== undefined) return bag[key];
    return LABELS.fr[key] !== undefined ? LABELS.fr[key] : key;
  }

  function pickLangField(obj, base) {
    var lang = window.currentLang || 'fr';
    if (lang === 'fr') return obj[base];
    var k = base + '_' + lang;
    return obj[k] || obj[base];
  }

  // ============================================
  // ACTIVITES PAR CYCLE (trilingue)
  // ============================================
  var ACTIVITIES_BY_CYCLE = {
    EXTERIEUR: {
      c1: [
        { name: 'Parcours cônes fous', name_en: 'Crazy cone course', name_zh: '疯狂锥桶障碍',
          desc: 'Slalom, sauts, courses entre 8-10 cônes colorés.',
          desc_en: 'Slalom, jumps, runs between 8-10 colored cones.',
          desc_zh: '在 8-10 个彩色锥桶间进行绕行、跳跃、奔跑。' },
        { name: 'Chat perché géant', name_en: 'Giant tree tag', name_zh: '大型爬树抓人',
          desc: 'Tag classique où les arbres/bancs sauvent.',
          desc_en: 'Classic tag where trees/benches are safe zones.',
          desc_zh: '经典抓人游戏，树木或长椅为安全区。' },
        { name: 'Sautons les flaques', name_en: 'Jump the puddles', name_zh: '跳过水坑',
          desc: 'Parcours de cerceaux au sol à sauter à pieds joints.',
          desc_en: 'Hoop course on the ground, two-foot jumps only.',
          desc_zh: '地面呼啦圈障碍，双脚并跳通过。' },
        { name: '1-2-3 Soleil', name_en: 'Red light, green light', name_zh: '红灯绿灯',
          desc: 'Le classique : avancer quand le prof tourne le dos.',
          desc_en: 'The classic: move when the teacher turns away.',
          desc_zh: '经典游戏：老师转身时才能前进。' }
      ],
      c2: [
        { name: 'Drapeau-voleur', name_en: 'Capture the flag', name_zh: '夺旗',
          desc: '2 équipes, 2 drapeaux, zone neutre. Stratégie et vitesse.',
          desc_en: '2 teams, 2 flags, neutral zone. Strategy and speed.',
          desc_zh: '两队、两面旗、中立区。讲究策略与速度。' },
        { name: 'Chasse au trésor sportive', name_en: 'Sports treasure hunt', name_zh: '运动寻宝',
          desc: 'Indices qui mènent à des défis physiques à chaque station.',
          desc_en: 'Clues leading to physical challenges at each station.',
          desc_zh: '按线索抵达各关卡完成体能挑战。' },
        { name: 'Béret numéroté', name_en: 'Number steal', name_zh: '抢号令',
          desc: 'Deux équipes face à face, on crie un numéro, ils courent!',
          desc_en: 'Two teams facing off; a number is called, they run!',
          desc_zh: '两队面对面站立，喊号码则起跑争抢。' },
        { name: 'Tague avec zones', name_en: 'Zone tag', name_zh: '分区抓人',
          desc: 'Zones refuges limitées à 3 secondes. Force le mouvement.',
          desc_en: 'Safe zones capped at 3 seconds. Keeps everyone moving.',
          desc_zh: '安全区最多停留 3 秒，强制持续移动。' }
      ],
      c3: [
        { name: 'Ultimate frisbee', name_en: 'Ultimate frisbee', name_zh: '终极飞盘',
          desc: '5v5, passes seulement, pas de contact. Esprit fair-play.',
          desc_en: '5v5, passes only, no contact. Fair-play focus.',
          desc_zh: '五对五，只能传递不准接触，注重公平竞赛。' },
        { name: 'Soccer 3v3 multi-terrains', name_en: 'Multi-field 3v3 soccer', name_zh: '多场地 3v3 足球',
          desc: 'Plusieurs petits terrains, rotation rapide, tous touchent le ballon.',
          desc_en: 'Several small fields, quick rotations, everyone touches the ball.',
          desc_zh: '多个小场地轮换，人人都能触球。' },
        { name: 'Kin-ball modifié', name_en: 'Modified kin-ball', name_zh: '改良 Kin-ball',
          desc: '3 équipes, gros ballon, stratégie coopérative.',
          desc_en: '3 teams, big ball, cooperative strategy.',
          desc_zh: '三队对抗，大球合作策略。' },
        { name: 'Course d\'orientation', name_en: 'Orienteering', name_zh: '定向越野',
          desc: 'Carte de la cour, 8 balises à trouver en équipe.',
          desc_en: 'Schoolyard map, 8 markers to find in teams.',
          desc_zh: '校园地图，小组寻找 8 个标点。' }
      ]
    },
    GYMNASE: {
      c1: [
        { name: 'Circuit moteur 5 stations', name_en: '5-station motor circuit', name_zh: '五站运动回路',
          desc: 'Ramper, rouler, sauter, lancer, équilibre.',
          desc_en: 'Crawl, roll, jump, throw, balance.',
          desc_zh: '爬、滚、跳、抛、平衡。' },
        { name: 'Jacques a dit', name_en: 'Simon says', name_zh: '老师说',
          desc: 'Version motrice : sauter, tourner, toucher ses pieds.',
          desc_en: 'Motor version: jump, spin, touch your feet.',
          desc_zh: '动作版：跳跃、转身、摸脚。' },
        { name: 'Tempête de ballons', name_en: 'Ball storm', name_zh: '球球风暴',
          desc: 'Ballons mous partout, ramasser/lancer par-dessus la ligne.',
          desc_en: 'Soft balls everywhere, grab and throw across the line.',
          desc_zh: '软球满地，捡起并扔过中线。' },
        { name: 'Feux de circulation', name_en: 'Traffic lights', name_zh: '交通信号灯',
          desc: 'Vert = courir, Jaune = marcher, Rouge = statue.',
          desc_en: 'Green = run, Yellow = walk, Red = freeze.',
          desc_zh: '绿灯跑，黄灯走，红灯定住。' }
      ],
      c2: [
        { name: 'Poule-renard-vipère', name_en: 'Chicken-fox-viper', name_zh: '鸡狐蛇',
          desc: 'Équivalent roche-papier-ciseaux en équipe. Chaos contrôlé.',
          desc_en: 'Team rock-paper-scissors. Controlled chaos.',
          desc_zh: '团队版石头剪刀布，可控的混乱。' },
        { name: 'Ballon chasseur doux', name_en: 'Soft dodgeball', name_zh: '软球躲避',
          desc: 'Avec ballons mousse, viser sous la taille seulement.',
          desc_en: 'Foam balls, waist-down targets only.',
          desc_zh: '使用泡沫球，只能击打腰部以下。' },
        { name: 'Parcours gymnique', name_en: 'Gymnastics course', name_zh: '体操巡回赛',
          desc: 'Banc, tapis, mini-trampoline : roulade, saut, équilibre.',
          desc_en: 'Bench, mat, mini-tramp: roll, jump, balance.',
          desc_zh: '长凳、垫子、小蹦床：翻滚、跳跃、平衡。' },
        { name: 'Capitaine-équipage', name_en: 'Captain-crew', name_zh: '船长与船员',
          desc: 'Le capitaine crie : bâbord, tribord, à l\'eau, moussaillon!',
          desc_en: 'Captain shouts: port, starboard, overboard, swabbie!',
          desc_zh: '船长喊：左舷、右舷、落水、小水手！' }
      ],
      c3: [
        { name: 'Basket 3v3 demi-terrain', name_en: 'Half-court 3v3 basketball', name_zh: '半场 3v3 篮球',
          desc: 'Rotation rapide, règle : 3 passes avant de tirer.',
          desc_en: 'Fast rotation, rule: 3 passes before shooting.',
          desc_zh: '快速轮换，规则：投篮前必须传 3 次。' },
        { name: 'Volley ballon-mousse', name_en: 'Foam-ball volleyball', name_zh: '泡沫排球',
          desc: 'Filet bas, ballon léger. Parfait pour débuter le volley.',
          desc_en: 'Low net, light ball. Perfect volleyball intro.',
          desc_zh: '低网、轻球，排球入门好选择。' },
        { name: 'Hockey-balle', name_en: 'Floor hockey', name_zh: '地板曲棍球',
          desc: 'Bâtons mousse, balle légère. Règles simples, action continue.',
          desc_en: 'Foam sticks, light ball. Simple rules, non-stop action.',
          desc_zh: '泡沫球杆、轻球，规则简单，行动不停。' },
        { name: 'Ultimate gymnase', name_en: 'Indoor ultimate', name_zh: '室内终极飞盘',
          desc: 'Frisbee mousse, 5v5, pivot obligatoire avec le disque.',
          desc_en: 'Foam frisbee, 5v5, pivot required with the disc.',
          desc_zh: '泡沫飞盘，五对五，持盘必须中枢脚转动。' }
      ]
    },
    'AU CHOIX': {
      c1: [
        { name: 'Parcours modulable', name_en: 'Flexible course', name_zh: '灵活障碍赛',
          desc: 'Intérieur ou extérieur, adapte selon l\'espace dispo.',
          desc_en: 'Indoor or outdoor, adapt to the space you have.',
          desc_zh: '室内外皆可，按空间灵活调整。' },
        { name: 'Tague arc-en-ciel', name_en: 'Rainbow tag', name_zh: '彩虹抓人',
          desc: '5 couleurs = 5 défis moteurs quand on est touché.',
          desc_en: '5 colors = 5 motor challenges when tagged.',
          desc_zh: '五种颜色对应五个动作挑战。' },
        { name: 'Animaux en action', name_en: 'Animals in action', name_zh: '动物动起来',
          desc: 'Grenouille, ours, crabe, singe : déplacements créatifs.',
          desc_en: 'Frog, bear, crab, monkey: creative locomotion.',
          desc_zh: '青蛙、熊、螃蟹、猴子：创意移动。' },
        { name: 'Ballon-panier mini', name_en: 'Mini basket-ball', name_zh: '迷你投篮',
          desc: 'Viser cibles variées (panier, cerceau, seau).',
          desc_en: 'Aim at varied targets (hoop, basket, bucket).',
          desc_zh: '瞄准不同目标（筐、圈、桶）。' }
      ],
      c2: [
        { name: 'Thèque / kickball', name_en: 'Kickball', name_zh: '脚踢棒球',
          desc: 'Baseball au pied, règles simples, inclusif.',
          desc_en: 'Foot baseball, simple rules, inclusive.',
          desc_zh: '用脚踢的棒球，规则简单，人人能玩。' },
        { name: 'Mini-triathlon ÉPS', name_en: 'PE mini-triathlon', name_zh: '体育迷你铁人三项',
          desc: 'Course + saut + lancer. Chrono personnel.',
          desc_en: 'Run + jump + throw. Personal best challenge.',
          desc_zh: '跑 + 跳 + 投，挑战个人最佳。' },
        { name: 'Défi coopératif', name_en: 'Cooperative challenge', name_zh: '合作挑战',
          desc: 'Traverser le gym/la cour sans toucher le sol (matériel).',
          desc_en: 'Cross the gym/yard without touching the ground (using props).',
          desc_zh: '借助道具穿越场地，不能触地。' },
        { name: 'Tchoukball initiation', name_en: 'Tchoukball intro', name_zh: '天秋球入门',
          desc: 'Sport coop sans contact, cadre élastique ou mur.',
          desc_en: 'No-contact coop sport, elastic frame or wall.',
          desc_zh: '无接触合作运动，使用弹力框或墙面。' }
      ],
      c3: [
        { name: 'Sport collectif au choix', name_en: 'Team sport of their choice', name_zh: '自选团队运动',
          desc: 'Les élèves votent : soccer, basket, hockey, ultimate.',
          desc_en: 'Students vote: soccer, basketball, hockey, ultimate.',
          desc_zh: '学生投票：足球、篮球、曲棍球、终极飞盘。' },
        { name: 'Crossfit ÉPS', name_en: 'PE crossfit', name_zh: '体育全能训练',
          desc: 'AMRAP 10 min : burpees, squats, pompes, sauts.',
          desc_en: '10-min AMRAP: burpees, squats, push-ups, jumps.',
          desc_zh: '10 分钟 AMRAP：波比、深蹲、俯卧撑、跳跃。' },
        { name: 'Tournoi éclair', name_en: 'Flash tournament', name_zh: '闪电锦标赛',
          desc: '4 équipes, matchs de 6 min, classement en direct.',
          desc_en: '4 teams, 6-min games, live standings.',
          desc_zh: '四队轮赛，每场 6 分钟，即时排名。' },
        { name: 'Netball / handball', name_en: 'Netball / handball', name_zh: '英式篮球 / 手球',
          desc: 'Sport moins connu = tout le monde débute égal.',
          desc_en: 'Less-known sport = everyone starts equal.',
          desc_zh: '冷门项目，大家起点相同。' }
      ]
    }
  };

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
          function(pos) { clearTimeout(timed); resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, city: L('your_position') }); },
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
      if (temp < -10) { decision = 'GYMNASE'; reason = L('reason_cold') + ' (' + temp + '°C)'; }
      else if (temp > 30) { decision = 'GYMNASE'; reason = L('reason_hot') + ' (' + temp + '°C)'; }
      else if (rain > 1) { decision = 'GYMNASE'; reason = L('reason_rain'); }
      else if (wind > 40) { decision = 'GYMNASE'; reason = L('reason_wind') + ' (' + wind + ' km/h)'; }
      else if (temp >= 5 && temp <= 25 && wind < 25) { decision = 'EXTERIEUR'; reason = L('reason_ideal'); }
      else { decision = 'AU CHOIX'; reason = L('reason_ok'); }
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
    if (code === 0) return L('w_sunny');
    if (code <= 2) return L('w_partly');
    if (code === 3) return L('w_cloudy');
    if (code <= 49) return L('w_fog');
    if (code <= 59) return L('w_drizzle');
    if (code <= 69) return L('w_rain');
    if (code <= 79) return L('w_snow');
    if (code <= 99) return L('w_storm');
    return '';
  }

  // ============================================
  // JEU DU JOUR : pick deterministe dans la banque
  // ============================================
  function getDailyGame() {
    var lang = window.currentLang || 'fr';
    var games = (window.gamesI18n && window.gamesI18n[lang]) || (window.gamesI18n && window.gamesI18n.fr);
    if (!games || !games.length) return null;
    var dayNum = getDayOfYear(new Date());
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
      var [ephRes, conRes] = await Promise.all([
        fetch('ephemerides.json?v=1'),
        fetch('conseils-eps.json?v=1')
      ]);
      var ephemerides = await ephRes.json();
      var conseils = await conRes.json();
      if (ephemerides[today.mmdd]) {
        var e = ephemerides[today.mmdd];
        return { type: 'event', year: e.year, title: e.title, desc: e.desc, activity: e.activity };
      }
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
    var [data, eph] = await Promise.all([getFunPause(), getEphemeride()]);
    if (!data) { container.innerHTML = '<div style="color:#fff;text-align:center;padding:20px">' + L('loading') + '</div>'; return; }

    var html = '';
    // Carte Citation/Blague/Fait
    var b = data.blague;
    var typeEmoji = { citation: '💬', blague: '😂', fait: '🎯' }[b.type] || '✨';
    var typeLabel = { citation: L('type_citation'), blague: L('type_blague'), fait: L('type_fait') }[b.type] || L('type_default');
    var authorHtml = b.author ? '<div class="zts-pause-author">— ' + b.author + '</div>' : '';
    html += '<div class="zts-pause-card zts-pause-quote">' +
      '<div class="zts-pause-label">' + typeEmoji + ' ' + typeLabel + '</div>' +
      '<div class="zts-pause-quote-text">« ' + b.text + ' »</div>' +
      authorHtml +
      '</div>';

    // Carte Fait historique du jour (ephemeride OU conseil EPS fallback)
    if (eph) {
      var factEmoji = eph.type === 'event' ? '📜' : '💡';
      var factLabel = eph.type === 'event' ? 'FAIT HISTORIQUE' : 'CONSEIL EPS';
      var factDate = eph.year ? eph.year : '';
      html += '<div class="zts-pause-card zts-pause-fact">' +
        '<div class="zts-pause-label">' + factEmoji + ' ' + factLabel + '</div>' +
        '<div class="zts-pause-fact-text">' + (eph.title ? '<strong>' + eph.title + '</strong> — ' : '') + (eph.desc || '') + '</div>' +
        (factDate ? '<div class="zts-pause-fact-date">📅 ' + factDate + '</div>' : '') +
        '</div>';
    }

    // Carte Quiz interactif
    var q = data.quiz;
    var choicesHtml = q.choices.map(function(c, i){
      return '<button class="zts-pause-choice" data-idx="' + i + '">' + c + '</button>';
    }).join('');
    html += '<div class="zts-pause-card zts-pause-quiz" data-answer="' + q.answer + '" data-fact="' + (q.fact || '').replace(/"/g, '&quot;') + '">' +
      '<div class="zts-pause-label">' + L('quiz') + '</div>' +
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
          feedback.innerHTML = (chosen === answerIdx ? L('quiz_good') : L('quiz_bad') + '<strong>' + q.choices[answerIdx] + '</strong>. ') + (fact ? '<br><em>' + fact + '</em>' : '');
          feedback.style.display = 'block';
        });
      });
    }
  }

  // ============================================
  // CYCLES : pick deterministe d'activite par cycle
  // ============================================
  function pickCycleActivity(decisionKey, cycle) {
    var bucket = ACTIVITIES_BY_CYCLE[decisionKey];
    if (!bucket || !bucket[cycle]) return null;
    var list = bucket[cycle];
    var dayNum = getDayOfYear(new Date());
    // Offset different par cycle pour varier les 3 lignes
    var offset = cycle === 'c1' ? 0 : cycle === 'c2' ? 1 : 2;
    return list[(dayNum + offset) % list.length];
  }

  function renderCycleSuggestions(decisionKey) {
    var c1 = pickCycleActivity(decisionKey, 'c1');
    var c2 = pickCycleActivity(decisionKey, 'c2');
    var c3 = pickCycleActivity(decisionKey, 'c3');
    if (!c1 || !c2 || !c3) return '';
    function row(act, badgeClass, badgeLabel) {
      var name = pickLangField(act, 'name');
      var desc = pickLangField(act, 'desc');
      return '<div class="zts-today-cycle-item"><span class="zts-today-cycle-badge ' + badgeClass + '">' + badgeLabel + '</span> <strong>' + name + '</strong> — ' + desc + '</div>';
    }
    return '<div class="zts-today-cycles">' +
      '<div class="zts-today-cycle-label">' + L('cycles_label') + '</div>' +
      row(c1, 'c1', L('c1')) +
      row(c2, 'c2', L('c2')) +
      row(c3, 'c3', L('c3')) +
    '</div>';
  }

  // ============================================
  // DEFI DU JOUR : conseil EPS deterministe (1 par jour de l'annee)
  // ============================================
  async function getDefiDuJour() {
    try {
      var res = await fetch('conseils-eps.json?v=1');
      var conseils = await res.json();
      var dayNum = getDayOfYear(new Date());
      return conseils[dayNum % conseils.length];
    } catch(e) {
      console.warn('[ZTS Daily] Defi load failed:', e);
      return null;
    }
  }

  // ============================================
  // RENDU : injecte dans #ztsTodaySection
  // ============================================
  async function render() {
    var container = document.getElementById('ztsTodayGrid');
    if (!container) return;

    // Date formatee selon locale
    var today = new Date();
    var loc = L('locale');
    var dateStr = today.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });

    // Render squelette immediat
    container.innerHTML = '<div class="zts-today-card zts-today-weather"><div class="zts-today-label">🌤️ ' + L('meteo') + '</div><div class="zts-today-body">' + L('loading') + '</div></div>' +
      '<div class="zts-today-card zts-today-game"><div class="zts-today-label">🎮 ' + L('jeu') + '</div><div class="zts-today-body">' + L('loading') + '</div></div>' +
      '<div class="zts-today-card zts-today-eph"><div class="zts-today-label">💪 Défi du jour</div><div class="zts-today-body">' + L('loading') + '</div></div>';

    var dateEl = document.getElementById('ztsTodayDate');
    if (dateEl) dateEl.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

    // Lance en parallele
    var weather = await getWeather();
    var game = getDailyGame();

    // Render cards
    var html = '';

    // Carte Meteo
    if (weather) {
      var badgeColor = weather.decision === 'EXTERIEUR' ? '#10B981' : weather.decision === 'GYMNASE' ? '#F59E0B' : '#6366F1';
      var cycleHtml = renderCycleSuggestions(weather.decision);
      html += '<div class="zts-today-card zts-today-weather">' +
        '<div class="zts-today-label">🌤️ ' + L('meteo') + '</div>' +
        '<div class="zts-today-body">' +
          '<div class="zts-today-weather-big">' + weather.emoji + ' <strong>' + weather.temp + '°C</strong></div>' +
          '<div class="zts-today-weather-label">' + weather.label + ' • ' + weather.city + '</div>' +
          '<div class="zts-today-weather-details">💨 ' + weather.wind + ' km/h</div>' +
          '<div class="zts-today-decision" style="background:' + badgeColor + '"><strong>' + L(weather.decision) + '</strong></div>' +
          '<div class="zts-today-reason">' + weather.reason + '</div>' +
          cycleHtml +
        '</div></div>';
    } else {
      html += '<div class="zts-today-card zts-today-weather"><div class="zts-today-label">🌤️ ' + L('meteo') + '</div><div class="zts-today-body">' + L('weather_unavailable') + '</div></div>';
    }

    // Carte Jeu du Jour
    if (game) {
      var tagsHtml = (game.tags || []).map(function(t){ return '<span class="zts-today-tag">' + t + '</span>'; }).join('');
      html += '<div class="zts-today-card zts-today-game">' +
        '<div class="zts-today-label">🎮 ' + L('jeu') + '</div>' +
        '<div class="zts-today-body">' +
          '<div class="zts-today-game-title">' + game.name + '</div>' +
          '<div class="zts-today-game-desc">' + game.desc + '</div>' +
          '<div class="zts-today-tags">' + tagsHtml + '</div>' +
          '<button class="zts-today-cta" onclick="window.ztsOpenApp && window.ztsOpenApp(\'https://jeux.zonetotalsport.ca\')">' + L('cta_games') + '</button>' +
        '</div></div>';
    }

    // Carte Defi du jour (conseil EPS pratique, deterministe par jour)
    var defi = await getDefiDuJour();
    if (defi) {
      html += '<div class="zts-today-card zts-today-eph">' +
        '<div class="zts-today-label">💪 Défi du jour</div>' +
        '<div class="zts-today-body">' +
          '<div class="zts-today-eph-title">' + defi.title + '</div>' +
          '<div class="zts-today-eph-desc">' + defi.desc + '</div>' +
          '<div class="zts-today-eph-activity"><strong>🎯 ' + L('inClass') + '</strong> ' + defi.activity + '</div>' +
        '</div></div>';
    }

    container.innerHTML = html;
  }

  // ============================================
  // INIT + expose pour re-render au changement de langue
  // ============================================
  function initAll() {
    render();
    renderPause();
  }
  window.ztsDailyRerender = initAll;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
