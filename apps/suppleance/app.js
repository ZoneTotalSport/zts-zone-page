// ==========================================
// MA SUPPLÉANCE EPS — Zone Total Sport
// ==========================================

// --- i18n ---
var T = {
  fr: {
    appTitle:"MA SUPPLÉANCE", lblLevel:"Niveau scolaire", lblDays:"Nombre de jours",
    lblPeriods:"Périodes / jour", lvlPresc:"Préscolaire / Maternelle", lvlC1:"1er Cycle (1re-2e)",
    lvlC2:"2e Cycle (3e-4e)", lvlC3:"3e Cycle (5e-6e)",
    bankTitle:"BANQUE DE JEUX", bankSub:"Clique sur un jeu pour le copier dans une période!",
    allCat:"Tous", insertBtn:"INSÉRER DANS LA PÉRIODE",
    period:"Période", day:"Jour",
    dayNames:["Lundi","Mardi","Mercredi","Jeudi","Vendredi"],
    notesPlaceholder:"Notes / consignes...",
    timePlaceholder:"ex: 9h00",
    survLabel:"SURVEILLANCE", survPlaceholder:"Lieu / détails...", survTimePh:"ex: 10h15",
    recess:"RÉCRÉATION", lunch:"DÎNER",
    recessPh:"Notes récré...", lunchPh:"Notes dîner...",
    addBreak:"Ajouter", removeBreak:"Retirer", breakAfterLabel:"Après quelle période?",
    breakRecessAM:"Récré AM", breakLunch:"Dîner", breakRecessPM:"Récré PM",
    duration:"Durée", material:"Matériel", intensity:"Intensité",
    confirmReset:"Effacer toute la planification?",
    selectPeriod:"Sélectionne d'abord une période dans l'agenda (clique sur la case)!",
    inserted:"Jeu inséré!",
    promoTitle:"TON OUTIL #1 POUR LA SUPPLÉANCE EN ÉPS!",
    promoSub:"Fini le stress de la planification de dernière minute!",
    promoF1t:"800+ JEUX PRÊTS À L'EMPLOI",
    promoF1d:"Classés par niveau scolaire (préscolaire au 3e cycle), par catégorie et par intensité. Un clic = c'est planifié!",
    promoF2t:"PLANIFICATEUR MULTI-JOURS",
    promoF2d:"Organise ta journée ou ta semaine entière. Ajoute tes périodes, récréations et dîners exactement comme ton horaire.",
    promoF3t:"HEURES & PAUSES PERSONNALISABLES",
    promoF3d:"Indique les heures de chaque période, place les récréations AM/PM et le dîner où tu veux dans l'horaire.",
    promoF4t:"NOTES & CONSIGNES",
    promoF4d:"Ajoute tes notes personnelles pour chaque période. Tout est sauvegardé automatiquement dans ton navigateur.",
    promoF5t:"IMPRIME & EMPORTE",
    promoF5d:"Imprime ton plan en un clic. Arrive à l'école avec ta feuille prête — confiance garantie!",
    promoF6t:"4 LANGUES",
    promoF6d:"Français, English, 中文 et Español. Utilise l'outil dans la langue de ton choix!",
    promoBottom:"Créé par des enseignants d'ÉPS, pour des enseignants d'ÉPS.",
    guideTitle:"COMMENT UTILISER CETTE APP?",
    guideS1t:"CHOISIS TON NIVEAU", guideS1d:"Sélectionne le niveau scolaire du groupe que tu remplaces (préscolaire, 1er, 2e ou 3e cycle). La banque de jeux s'adapte automatiquement!",
    guideS2t:"CONFIGURE TON HORAIRE", guideS2d:"Indique le nombre de jours et de périodes par jour. Clique sur « Ajouter » pour placer les récréations AM/PM et le dîner entre les périodes.",
    guideS3t:"INSCRIS TES HEURES", guideS3d:"Dans la colonne de gauche, entre l'heure de début de chaque période et de chaque pause (ex: 9h00, 10h15, 11h30).",
    guideS4t:"CLIQUE SUR UNE PÉRIODE", guideS4d:"Sélectionne la case de la période où tu veux ajouter un jeu. Elle devient surlignée en bleu pour confirmer ta sélection.",
    guideS5t:"EXPLORE LA BANQUE DE JEUX", guideS5d:"Descends jusqu'à la banque de 800+ jeux. Filtre par catégorie, clique sur un jeu pour voir les détails, puis clique « Insérer » pour l'ajouter à ta période.",
    guideS6t:"IMPRIME ET C'EST PARTI!", guideS6d:"Ajoute tes notes personnelles, puis clique l'icône imprimante 🖨️ pour imprimer ton plan. Arrive à l'école confiant et organisé!"
  },
  en: {
    appTitle:"MY SUBSTITUTE PLAN", lblLevel:"School level", lblDays:"Number of days",
    lblPeriods:"Periods / day", lvlPresc:"Preschool / Kindergarten", lvlC1:"Cycle 1 (Gr. 1-2)",
    lvlC2:"Cycle 2 (Gr. 3-4)", lvlC3:"Cycle 3 (Gr. 5-6)",
    bankTitle:"GAME BANK", bankSub:"Click a game to copy it into a period!",
    allCat:"All", insertBtn:"INSERT INTO PERIOD",
    period:"Period", day:"Day",
    dayNames:["Monday","Tuesday","Wednesday","Thursday","Friday"],
    notesPlaceholder:"Notes / instructions...",
    timePlaceholder:"e.g. 9:00",
    survLabel:"SUPERVISION", survPlaceholder:"Location / details...", survTimePh:"e.g. 10:15",
    recess:"RECESS", lunch:"LUNCH",
    recessPh:"Recess notes...", lunchPh:"Lunch notes...",
    addBreak:"Add", removeBreak:"Remove", breakAfterLabel:"After which period?",
    breakRecessAM:"AM Recess", breakLunch:"Lunch", breakRecessPM:"PM Recess",
    duration:"Duration", material:"Material", intensity:"Intensity",
    confirmReset:"Clear all planning?",
    selectPeriod:"Select a period in the agenda first (click a cell)!",
    inserted:"Game inserted!",
    promoTitle:"YOUR #1 TOOL FOR PE SUBSTITUTE TEACHING!",
    promoSub:"No more last-minute planning stress!",
    promoF1t:"800+ READY-TO-USE GAMES",
    promoF1d:"Sorted by school level (preschool to cycle 3), category and intensity. One click = planned!",
    promoF2t:"MULTI-DAY PLANNER",
    promoF2d:"Organize your day or your entire week. Add your periods, recesses and lunches exactly like your schedule.",
    promoF3t:"CUSTOM TIMES & BREAKS",
    promoF3d:"Enter the time for each period, place AM/PM recesses and lunch wherever you need in the schedule.",
    promoF4t:"NOTES & INSTRUCTIONS",
    promoF4d:"Add your personal notes for each period. Everything is saved automatically in your browser.",
    promoF5t:"PRINT & GO",
    promoF5d:"Print your plan in one click. Arrive at school with your sheet ready — confidence guaranteed!",
    promoF6t:"4 LANGUAGES",
    promoF6d:"Français, English, 中文 and Español. Use the tool in your preferred language!",
    promoBottom:"Created by PE teachers, for PE teachers.",
    guideTitle:"HOW TO USE THIS APP?",
    guideS1t:"CHOOSE YOUR LEVEL", guideS1d:"Select the school level of the group you're replacing (preschool, cycle 1, 2 or 3). The game bank adapts automatically!",
    guideS2t:"SET UP YOUR SCHEDULE", guideS2d:"Enter the number of days and periods per day. Click 'Add' to place AM/PM recesses and lunch between periods.",
    guideS3t:"ENTER YOUR TIMES", guideS3d:"In the left column, enter the start time for each period and break (e.g. 9:00, 10:15, 11:30).",
    guideS4t:"CLICK A PERIOD", guideS4d:"Select the period cell where you want to add a game. It highlights in blue to confirm your selection.",
    guideS5t:"EXPLORE THE GAME BANK", guideS5d:"Scroll down to the 800+ game bank. Filter by category, click a game to see details, then click 'Insert' to add it to your period.",
    guideS6t:"PRINT AND GO!", guideS6d:"Add your personal notes, then click the print icon 🖨️ to print your plan. Arrive at school confident and organized!"
  },
  zh: {
    appTitle:"我的代课计划", lblLevel:"学段", lblDays:"天数",
    lblPeriods:"每日课时", lvlPresc:"学前班", lvlC1:"第一学段 (1-2年级)",
    lvlC2:"第二学段 (3-4年级)", lvlC3:"第三学段 (5-6年级)",
    bankTitle:"游戏库", bankSub:"点击游戏将其复制到课时中！",
    allCat:"全部", insertBtn:"插入到课时",
    period:"课时", day:"天",
    dayNames:["周一","周二","周三","周四","周五"],
    notesPlaceholder:"备注/说明...",
    timePlaceholder:"如：9:00",
    survLabel:"监督", survPlaceholder:"地点/详情...", survTimePh:"如：10:15",
    recess:"课间休息", lunch:"午餐",
    recessPh:"课间备注...", lunchPh:"午餐备注...",
    addBreak:"添加", removeBreak:"删除", breakAfterLabel:"在哪个课时之后?",
    breakRecessAM:"上午课间", breakLunch:"午餐", breakRecessPM:"下午课间",
    duration:"时长", material:"器材", intensity:"强度",
    confirmReset:"清除所有计划？",
    selectPeriod:"请先点击一个课时格子！",
    inserted:"已插入游戏！",
    promoTitle:"你的体育代课第一工具！",
    promoSub:"告别临时计划的压力！",
    promoF1t:"800+即用游戏",
    promoF1d:"按学段（学前班到第三学段）、类别和强度分类。一键即可规划！",
    promoF2t:"多日规划器",
    promoF2d:"组织你的一天或整周。按照你的课表添加课时、课间休息和午餐。",
    promoF3t:"自定义时间和休息",
    promoF3d:"输入每节课的时间，在课表中随意放置上午/下午课间和午餐。",
    promoF4t:"备注和说明",
    promoF4d:"为每节课添加个人备注。所有内容自动保存在浏览器中。",
    promoF5t:"打印即走",
    promoF5d:"一键打印你的计划。带着准备好的课表到校——信心满满！",
    promoF6t:"4种语言",
    promoF6d:"Français、English、中文和Español。用你喜欢的语言使用工具！",
    promoBottom:"由体育教师为体育教师创建。",
    guideTitle:"如何使用这个应用？",
    guideS1t:"选择学段", guideS1d:"选择你代课班级的学段（学前班、第一、第二或第三学段）。游戏库会自动调整！",
    guideS2t:"设置课表", guideS2d:"输入天数和每天课时数。点击「添加」在课时之间放置上午/下午课间和午餐。",
    guideS3t:"填写时间", guideS3d:"在左侧栏中，输入每节课和每次休息的开始时间（如：9:00、10:15、11:30）。",
    guideS4t:"点击课时", guideS4d:"选择你想添加游戏的课时格子。它会以蓝色高亮确认你的选择。",
    guideS5t:"浏览游戏库", guideS5d:"向下滚动到800+游戏库。按类别筛选，点击游戏查看详情，然后点击「插入」将其添加到你的课时。",
    guideS6t:"打印出发！", guideS6d:"添加你的个人备注，然后点击打印图标🖨️打印你的计划。满怀信心、井然有序地到达学校！"
  },
  es: {
    appTitle:"MI SUPLENCIA", lblLevel:"Nivel escolar", lblDays:"Número de días",
    lblPeriods:"Períodos / día", lvlPresc:"Preescolar", lvlC1:"1er Ciclo (1°-2°)",
    lvlC2:"2° Ciclo (3°-4°)", lvlC3:"3er Ciclo (5°-6°)",
    bankTitle:"BANCO DE JUEGOS", bankSub:"¡Haz clic en un juego para copiarlo en un período!",
    allCat:"Todos", insertBtn:"INSERTAR EN EL PERÍODO",
    period:"Período", day:"Día",
    dayNames:["Lunes","Martes","Miércoles","Jueves","Viernes"],
    notesPlaceholder:"Notas / instrucciones...",
    timePlaceholder:"ej: 9:00",
    survLabel:"VIGILANCIA", survPlaceholder:"Lugar / detalles...", survTimePh:"ej: 10:15",
    recess:"RECREO", lunch:"ALMUERZO",
    recessPh:"Notas recreo...", lunchPh:"Notas almuerzo...",
    addBreak:"Agregar", removeBreak:"Quitar", breakAfterLabel:"¿Después de qué período?",
    breakRecessAM:"Recreo AM", breakLunch:"Almuerzo", breakRecessPM:"Recreo PM",
    duration:"Duración", material:"Material", intensity:"Intensidad",
    confirmReset:"¿Borrar toda la planificación?",
    selectPeriod:"¡Selecciona primero un período (clic en la celda)!",
    inserted:"¡Juego insertado!",
    promoTitle:"¡TU HERRAMIENTA #1 PARA LA SUPLENCIA EN EF!",
    promoSub:"¡Se acabó el estrés de la planificación de último minuto!",
    promoF1t:"800+ JUEGOS LISTOS PARA USAR",
    promoF1d:"Clasificados por nivel escolar (preescolar al 3er ciclo), categoría e intensidad. ¡Un clic = planificado!",
    promoF2t:"PLANIFICADOR MULTI-DÍA",
    promoF2d:"Organiza tu día o tu semana entera. Agrega tus períodos, recreos y almuerzos exactamente como tu horario.",
    promoF3t:"HORARIOS Y PAUSAS PERSONALIZABLES",
    promoF3d:"Indica la hora de cada período, coloca los recreos AM/PM y el almuerzo donde quieras en el horario.",
    promoF4t:"NOTAS E INSTRUCCIONES",
    promoF4d:"Agrega tus notas personales para cada período. Todo se guarda automáticamente en tu navegador.",
    promoF5t:"IMPRIME Y LISTO",
    promoF5d:"Imprime tu plan en un clic. ¡Llega a la escuela con tu hoja lista — confianza garantizada!",
    promoF6t:"4 IDIOMAS",
    promoF6d:"Français, English, 中文 y Español. ¡Usa la herramienta en el idioma que prefieras!",
    promoBottom:"Creado por profesores de EF, para profesores de EF.",
    guideTitle:"¿CÓMO USAR ESTA APP?",
    guideS1t:"ELIGE TU NIVEL", guideS1d:"Selecciona el nivel escolar del grupo que reemplazas (preescolar, 1er, 2° o 3er ciclo). ¡El banco de juegos se adapta automáticamente!",
    guideS2t:"CONFIGURA TU HORARIO", guideS2d:"Indica el número de días y períodos por día. Haz clic en 'Agregar' para colocar los recreos AM/PM y el almuerzo entre los períodos.",
    guideS3t:"ESCRIBE TUS HORAS", guideS3d:"En la columna izquierda, ingresa la hora de inicio de cada período y pausa (ej: 9:00, 10:15, 11:30).",
    guideS4t:"HAZ CLIC EN UN PERÍODO", guideS4d:"Selecciona la celda del período donde quieres agregar un juego. Se resalta en azul para confirmar tu selección.",
    guideS5t:"EXPLORA EL BANCO DE JUEGOS", guideS5d:"Desplázate hasta el banco de 800+ juegos. Filtra por categoría, haz clic en un juego para ver detalles, luego haz clic en 'Insertar' para agregarlo a tu período.",
    guideS6t:"¡IMPRIME Y LISTO!", guideS6d:"Agrega tus notas personales, luego haz clic en el icono de impresora 🖨️ para imprimir tu plan. ¡Llega a la escuela con confianza y organizado!"
  }
};

var currentLang = localStorage.getItem('suppl_lang') || 'fr';
function t(k){ return (T[currentLang]||T.fr)[k] || T.fr[k] || k; }

function setLang(lang){
  currentLang = lang;
  localStorage.setItem('suppl_lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    var k = el.getAttribute('data-i18n');
    if(T[lang][k] !== undefined) el.textContent = T[lang][k];
  });
  document.querySelectorAll('.lang-btn').forEach(function(b){
    b.classList.toggle('lang-active', b.textContent.trim() === ({fr:'FR',en:'EN',zh:'中文',es:'ES'})[lang]);
  });
  refreshAll();
}

// --- STATE ---
var selectedCell = null;
var agendaData = JSON.parse(localStorage.getItem('suppl_agenda') || '{}');
// breaks: array of {after: periodNumber, type: 'recess'|'lunch'|'surv'}
var breaksData = JSON.parse(localStorage.getItem('suppl_breaks') || '[]');
var currentGameForInsert = null;

function saveAgenda(){ localStorage.setItem('suppl_agenda', JSON.stringify(agendaData)); }
function saveBreaks(){ localStorage.setItem('suppl_breaks', JSON.stringify(breaksData)); }

function getKey(d,p){ return d+'-'+p; }

// --- BUILD AGENDA ---
function refreshAll(){
  buildAgenda();
  buildBank();
}

// Build the ordered list of slots for a day
function buildSlotList(nPeriods){
  var slots = [];
  for(var p=1; p<=nPeriods; p++){
    slots.push({type:'period', period:p});
    // Check for breaks after this period
    breaksData.forEach(function(b){
      if(b.after === p) slots.push({type:b.type, after:p, id:b.id});
    });
  }
  return slots;
}

function buildAgenda(){
  var nDays = parseInt(document.getElementById('sel-days').value) || 1;
  var nPeriods = parseInt(document.getElementById('sel-periods').value) || 1;
  if(nDays<1) nDays=1; if(nDays>10) nDays=10;
  if(nPeriods<1) nPeriods=1; if(nPeriods>10) nPeriods=10;
  var container = document.getElementById('agenda-container');
  var dayNames = t('dayNames');
  var dayColors = ['day-color-0','day-color-1','day-color-2','day-color-3','day-color-4'];

  var slots = buildSlotList(nPeriods);

  // Build break tags for config bar
  buildBreakTags();

  // CSS Grid: 1 time col + nDays day cols
  var colTemplate = '90px ' + Array(nDays).fill('1fr').join(' ');
  var html = '<div class="agenda-grid" style="grid-template-columns:'+colTemplate+'">';

  // === HEADER ROW ===
  html += '<div class="time-col-header">⏰</div>';
  for(var d=0; d<nDays; d++){
    html += '<div class="agenda-day-header '+dayColors[d%5]+'">';
    html += '<h3>'+dayNames[d%5]+'</h3>';
    html += '<span>'+t('day')+' '+(d+1)+'</span>';
    html += '</div>';
  }

  // === SLOT ROWS ===
  slots.forEach(function(slot){
    if(slot.type === 'period'){
      // Time cell
      var timeKey = 'time-'+slot.period;
      var timeVal = agendaData[timeKey] || '';
      html += '<div class="time-slot time-slot-period">';
      html += '<input type="text" class="time-input" placeholder="'+t('timePlaceholder')+'" value="'+escAttr(timeVal)+'" onchange="saveTimeSlot('+slot.period+',this.value)" />';
      html += '</div>';

      // Day cells
      for(var d=0; d<nDays; d++){
        var p = slot.period;
        var key = getKey(d,p);
        var data = agendaData[key] || {};
        var isSelected = selectedCell && selectedCell.day===d && selectedCell.period===p;

        html += '<div class="period-card'+(isSelected?' selected':'')+'" id="pc-'+d+'-'+p+'">';
        html += '<div class="period-card-header">';
        html += '<span class="period-badge">P'+p+'</span>';
        html += '</div>';
        html += '<div class="period-card-body" onclick="selectCell('+d+','+p+')" style="position:relative">';
        if(data.game){
          html += '<div class="cell-cat">'+escHtml(data.cat||'')+'</div>';
          html += '<div class="cell-game">'+escHtml(data.game)+'</div>';
          html += '<div class="cell-desc">'+escHtml(data.desc||'')+'</div>';
          html += '<button class="cell-clear visible" onclick="event.stopPropagation();clearCell('+d+','+p+')">&times;</button>';
        }
        html += '<textarea class="cell-notes" placeholder="'+t('notesPlaceholder')+'" oninput="saveNotes('+d+','+p+',this.value)" onclick="event.stopPropagation()">'+(data.notes||'')+'</textarea>';
        html += '</div></div>';
      }

    } else {
      // Break time cell
      var bTimeKey = 'btime-'+slot.id;
      var bTimeVal = agendaData[bTimeKey] || '';
      html += '<div class="time-slot time-slot-break">';
      html += '<input type="text" class="time-input time-input-break" placeholder="'+t('survTimePh')+'" value="'+escAttr(bTimeVal)+'" onchange="saveBreakTime(\''+slot.id+'\',this.value)" />';
      html += '<button class="break-remove-time" onclick="removeBreak(\''+slot.id+'\')" title="'+t('removeBreak')+'">&times;</button>';
      html += '</div>';

      // Break day cells
      for(var d=0; d<nDays; d++){
        var bKey = 'brk-'+d+'-'+slot.id;
        var bData = agendaData[bKey] || {};
        var icon = slot.type==='lunch'?'🍎':'⚽';
        var label = slot.type==='lunch'?t('lunch'):t('recess');
        var cssClass = slot.type==='lunch'?'break-lunch':'break-recess';
        var ph = slot.type==='lunch'?t('lunchPh'):t('recessPh');

        html += '<div class="break-card '+cssClass+'">';
        html += '<div class="break-top">';
        html += '<span class="break-icon">'+icon+'</span>';
        html += '<span class="break-label">'+label+'</span>';
        html += '<button class="break-remove" onclick="removeBreak(\''+slot.id+'\')" title="'+t('removeBreak')+'">&times;</button>';
        html += '</div>';
        html += '<input type="text" class="break-notes" placeholder="'+ph+'" value="'+escAttr(bData.text||'')+'" onchange="saveBreakData(\''+bKey+'\',this.value)" />';
        html += '</div>';
      }
    }
  });

  html += '</div>';
  container.innerHTML = html;
}

function buildBreakTags(){
  var target = document.getElementById('break-tags-zone');
  if(!target) return;
  var html = '';
  breaksData.forEach(function(b){
    var lbl = b.type==='lunch'?'🍎 '+t('breakLunch'):'⚽ '+(b.subtype==='pm'?t('breakRecessPM'):t('breakRecessAM'));
    html += '<span class="break-tag">'+lbl+' (P'+b.after+') <button onclick="removeBreak(\''+b.id+'\')">&times;</button></span>';
  });
  target.innerHTML = html;
}

function saveTimeSlot(p,val){
  agendaData['time-'+p] = val;
  saveAgenda();
}

function saveBreakTime(id,val){
  agendaData['btime-'+id] = val;
  saveAgenda();
}

function saveBreakData(key,val){
  if(!agendaData[key]) agendaData[key] = {};
  agendaData[key] = {text:val};
  saveAgenda();
}

function selectCell(d,p){
  selectedCell = {day:d, period:p};
  document.querySelectorAll('.period-card').forEach(function(el){ el.classList.remove('selected'); });
  var card = document.getElementById('pc-'+d+'-'+p);
  if(card) card.classList.add('selected');
}

function clearCell(d,p){
  var key = getKey(d,p);
  if(agendaData[key]){
    var notes = agendaData[key].notes || '';
    if(!notes) delete agendaData[key]; else agendaData[key] = {notes:notes};
    saveAgenda();
    buildAgenda();
  }
}

function saveNotes(d,p,val){
  var key = getKey(d,p);
  if(!agendaData[key]) agendaData[key] = {};
  agendaData[key].notes = val;
  saveAgenda();
}

// --- BREAKS MANAGEMENT ---
function openBreakMenu(){
  var nPeriods = parseInt(document.getElementById('sel-periods').value) || 4;
  var opts = '';
  for(var i=1; i<nPeriods; i++) opts += '<option value="'+i+'">P'+i+'</option>';

  var html = '<div class="break-menu-content">';
  html += '<label>'+t('breakAfterLabel')+'</label>';
  html += '<select id="break-after">'+opts+'</select>';
  html += '<div class="break-type-buttons">';
  html += '<button class="break-type-btn break-type-recess" onclick="confirmAddBreak(\'recess\',\'am\')">⚽ '+t('breakRecessAM')+'</button>';
  html += '<button class="break-type-btn break-type-lunch" onclick="confirmAddBreak(\'lunch\',\'\')">🍎 '+t('breakLunch')+'</button>';
  html += '<button class="break-type-btn break-type-recess" onclick="confirmAddBreak(\'recess\',\'pm\')">⚽ '+t('breakRecessPM')+'</button>';
  html += '</div>';
  html += '</div>';

  document.getElementById('modal-game-title').textContent = t('addBreak');
  document.getElementById('modal-game-meta').innerHTML = '';
  document.getElementById('modal-game-desc').innerHTML = html;
  document.getElementById('btn-insert').style.display = 'none';
  document.getElementById('gameModal').classList.add('open');
}

function confirmAddBreak(type, subtype){
  var after = parseInt(document.getElementById('break-after').value);
  var id = type+'-'+subtype+'-'+after+'-'+Date.now();
  breaksData.push({after:after, type:type, subtype:subtype, id:id});
  saveBreaks();
  closeModal();
  buildAgenda();
}

function removeBreak(id){
  breaksData = breaksData.filter(function(b){ return b.id !== id; });
  saveBreaks();
  buildAgenda();
}

// --- GAME BANK ---
function getGamesForLevel(){
  var level = document.getElementById('sel-level').value;
  return JEUX_BANK[level] ? JEUX_BANK[level].jeux : [];
}

function getCategories(games){
  var cats = {};
  games.forEach(function(g){ cats[g.cat] = true; });
  return Object.keys(cats);
}

var currentFilter = 'all';

function buildBank(){
  var games = getGamesForLevel();
  var cats = getCategories(games);

  var filterHTML = '<button class="bank-filter-btn'+(currentFilter==='all'?' active':'')+'" onclick="filterBank(\'all\')">'+t('allCat')+'</button>';
  cats.forEach(function(c){
    filterHTML += '<button class="bank-filter-btn'+(currentFilter===c?' active':'')+'" onclick="filterBank(\''+escAttr(c)+'\')">'+escHtml(c)+'</button>';
  });
  document.querySelector('.bank-filters').innerHTML = filterHTML;

  var filtered = currentFilter==='all' ? games : games.filter(function(g){ return g.cat === currentFilter; });
  var html = '';
  filtered.forEach(function(g, i){
    html += '<div class="bank-card" data-cat="'+escAttr(g.cat)+'" onclick="showGame('+i+')">';
    html += '<div class="card-cat">'+escHtml(g.cat)+'</div>';
    html += '<div class="card-title">'+escHtml(g.titre)+'</div>';
    html += '<div class="card-desc">'+escHtml(g.desc)+'</div>';
    html += '<div class="card-tags">';
    html += '<span class="card-tag">⏱ '+g.duree+'</span>';
    html += '<span class="card-tag">🔥 '+g.intensite+'</span>';
    if(g.materiel && g.materiel !== 'Aucun') html += '<span class="card-tag">🎒 '+escHtml(g.materiel)+'</span>';
    html += '</div></div>';
  });
  document.getElementById('bank-grid').innerHTML = html;
}

function filterBank(cat){ currentFilter = cat; buildBank(); }

// --- GAME MODAL ---
function showGame(idx){
  var games = currentFilter==='all' ? getGamesForLevel() : getGamesForLevel().filter(function(g){ return g.cat===currentFilter; });
  var g = games[idx]; if(!g) return;
  currentGameForInsert = g;

  document.getElementById('modal-game-title').textContent = g.titre;
  document.getElementById('modal-game-meta').innerHTML =
    '<span>📂 '+escHtml(g.cat)+'</span><span>⏱ '+escHtml(g.duree)+'</span><span>🔥 '+escHtml(g.intensite)+'</span>'+
    (g.materiel!=='Aucun'?'<span>🎒 '+escHtml(g.materiel)+'</span>':'');
  document.getElementById('modal-game-desc').innerHTML = '<p>'+escHtml(g.desc)+'</p>';
  var btn = document.getElementById('btn-insert');
  btn.style.display = 'block'; btn.textContent = t('insertBtn');
  document.getElementById('gameModal').classList.add('open');
}

function closeModal(){
  document.getElementById('gameModal').classList.remove('open');
  currentGameForInsert = null;
}

function insertGameToPeriod(){
  if(!selectedCell){ alert(t('selectPeriod')); return; }
  if(!currentGameForInsert) return;
  var key = getKey(selectedCell.day, selectedCell.period);
  var existing = agendaData[key] || {};
  agendaData[key] = { game:currentGameForInsert.titre, cat:currentGameForInsert.cat, desc:currentGameForInsert.desc, notes:existing.notes||'' };
  saveAgenda(); closeModal(); buildAgenda();
}

// --- RESET ---
function resetAll(){
  if(confirm(t('confirmReset'))){
    agendaData = {}; breaksData = [];
    localStorage.removeItem('suppl_agenda'); localStorage.removeItem('suppl_breaks');
    selectedCell = null; buildAgenda();
  }
}

// --- UTILS ---
function escHtml(s){ if(!s) return ''; var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function escAttr(s){ return s?s.replace(/"/g,'&quot;').replace(/'/g,'&#39;'):''; }

// --- INIT ---
setLang(currentLang);
