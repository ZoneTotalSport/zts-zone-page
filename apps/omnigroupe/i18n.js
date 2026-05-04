// ============================================================
// i18n.js — Internationalization for Intervention Groupe
// Supports: FR (default inline), EN
// ============================================================
(function(){
'use strict';

let currentLang = localStorage.getItem('og-lang') || 'fr';

// ── Deep-copy original FR data for restore ──
const _frSos = JSON.parse(JSON.stringify(sosData));
const _frJeux = JSON.parse(JSON.stringify(jeuxData));
const _frTrans = JSON.parse(JSON.stringify(transData));
const _frSeqDefaults = JSON.parse(JSON.stringify(seqDefaults));
const _frIconsList = JSON.parse(JSON.stringify(iconsList));
const _frTasks = JSON.parse(JSON.stringify(tasks));
const _frOutilsDef = JSON.parse(JSON.stringify(outilsDef));

// ============================================================
// UI TEXT TRANSLATIONS — EN
// Key = exact French text (trimmed), value = English translation
// ============================================================
const TR = {
// ── Nav ──
'Accueil':'Home','SOS':'SOS','Séance':'Session','Outils':'Tools',
// ── Header ──
'Intervention Groupe':'Group Intervention',
// ── Hero ──
'ASSISTANT TERRAIN EPS':'PE FIELD ASSISTANT',
'INTERVENTION':'INTERVENTION','GROUPE':'GROUP',
"Le couteau suisse des outils d'interventions en enseignement et animation. SOS, jeux, transitions, outils TSA.":
  "The Swiss army knife of teaching and coaching intervention tools. SOS, games, transitions, ASD tools.",
'SOS CRISE':'SOS CRISIS','100 solutions':'100 solutions','TERRAIN':'FIELD',
"SOS \u2022 Jeux \u2022 Outils TSA":"SOS \u2022 Games \u2022 ASD Tools",
// ── Home cards ──
'100 Solutions':'100 Solutions','Jeux Inclusifs':'Inclusive Games','60 Jeux':'60 Games',
'Transitions':'Transitions','30 Astuces':'30 Tips','Outils TSA':'ASD Tools','10 Outils':'10 Tools',
// ── Sections ──
'Outils Pro':'Pro Tools','Gestion de groupe':'Group Management',
'Ma Séance':'My Session','Séquence, jeux, journal':'Sequence, games, journal',
'Détecteur de Bruit':'Noise Detector','Feu sonore automatique par micro':'Auto sound traffic light via mic',
'Équipes':'Teams','Anti-Chicane':'No-Fight','Table Gone':'Table Gone','Tournois':'Tournaments',
'Tabata':'Tabata','Intervalles':'Intervals','Émulation':'Rewards','Badges':'Badges',
// ── SOS view ──
'Interventions SOS':'SOS Interventions',
"10 situations \u00b7 100 solutions terrain":"10 situations \u00b7 100 field solutions",
'CODE BLANC':'CODE WHITE',
'Rechercher une situation...':'Search for a situation...',
// ── Jeux view ──
'60 Jeux Inclusifs':'60 Inclusive Games',
"6 catégories \u00b7 3 niveaux \u00b7 rôles inclusifs":"6 categories \u00b7 3 levels \u00b7 inclusive roles",
'Tous':'All','Tagues':'Tag','Ballons':'Balls','Parachute':'Parachute',
'Coop':'Coop','Relais':'Relay','Stratégie':'Strategy',
// ── Transitions view ──
'30 Transitions':'30 Transitions',
"Déplacements \u00b7 Rassemblements \u00b7 Retour au calme":"Movements \u00b7 Gathering \u00b7 Cool Down",
// ── Outils view ──
"Timer \u00b7 Respiration \u00b7 Humeur \u00b7 Tâches \u00b7 Focus":
  "Timer \u00b7 Breathing \u00b7 Mood \u00b7 Tasks \u00b7 Focus",
// ── Ma Séance ──
"Séquence \u00b7 Jeux \u00b7 Journal d'interventions":"Sequence \u00b7 Games \u00b7 Intervention Log",
'Effacer':'Clear',
"📋 Séquence":"📋 Sequence","🎮 Choix":"🎮 Pick","📝 Tâches":"📝 Tasks",
'Ajouter à la séquence :':'Add to sequence:',
"🏫 Arrivée":"🏫 Arrival","🚪 Entrée":"🚪 Entry","🔄 Routine":"🔄 Routine",
"⚽ Activité":"⚽ Activity","🌬️ Retour au calme":"🌬️ Cool Down","🔔 Fin":"🔔 End",
// ── Journal ──
"Journal d'interventions":"Intervention Log",'Exporter':'Export',
"Nom/initiales de l'élève":"Student name/initials",
"Type d'incident...":"Incident type...",
'Bruit excessif':'Excessive noise','Opposition/TDAH':'Opposition/ADHD',
'Surcharge TSA':'ASD Overload','Bagarre/Conflit':'Fight/Conflict',
'Désintérêt':'Disinterest','Blessure':'Injury','Triche/Injustice':'Cheating/Unfairness','Autre':'Other',
'Solution utilisée...':'Solution used...',
'Retrait volontaire':'Voluntary withdrawal','Respiration':'Breathing',
'Redirection de tâche':'Task redirection','Casque/isolation sensorielle':'Headphones/sensory isolation',
'Médiation verbale':'Verbal mediation','Zone calme':'Calm zone',
'Délégation de rôle':'Role delegation','Contrat visuel':'Visual contract',
"Efficacité?":"Effectiveness?",
"⭐ Très efficace":"⭐ Very effective","👍 Efficace":"👍 Effective",
"🤷 Moyen":"🤷 Average","👎 Inefficace":"👎 Ineffective",
'Notes supplémentaires...':'Additional notes...',
'Enregistrer':'Save',
// ── Draw modal ──
"✏️ Dessiner":"✏️ Draw","✨ Lisser":"✨ Smooth",
"✅ Sauvegarder le dessin":"✅ Save Drawing",
// ── Bruit ──
'Feu de Bruit':'Noise Light','Détecteur sonore automatique par micro':'Auto sound detector via microphone',
'VERT':'GREEN','JAUNE':'YELLOW','ROUGE':'RED',
'Activer le micro':'Activate Mic','Arrêter':'Stop',
// ── Équipes ──
"Générateur d'Équipes":"Team Generator",
"Anti-Chicane \u00b7 Mémoire des conflits":"No-Fight \u00b7 Conflict Memory",
'Noms des élèves (un par ligne)':'Student names (one per line)',
"Nombre d'équipes":"Number of teams",'Conflits exclus':'Excluded conflicts',
'paire(s)':'pair(s)',
"+ Ajouter un conflit (2 noms séparés par virgule)":"+ Add conflict (2 names separated by comma)",
"GÉNÉRER LES ÉQUIPES":"GENERATE TEAMS",
// ── Tournoi ──
"Tournois rapides \u00b7 Élimination & Rotation":"Quick Tournaments \u00b7 Elimination & Rotation",
"Équipes / Joueurs (un par ligne)":"Teams / Players (one per line)",
'Élimination':'Elimination','Rotation':'Rotation',
'LANCER LE TOURNOI':'START TOURNAMENT',
// ── Tabata ──
'Tabata / Ateliers':'Tabata / Workshops',
"Intervalles \u00b7 Stations \u00b7 Signaux sonores":"Intervals \u00b7 Stations \u00b7 Sound signals",
'Effort (s)':'Work (s)','Repos (s)':'Rest (s)','Rondes':'Rounds',
'Stations (optionnel, une par ligne)':'Stations (optional, one per line)',
'DÉMARRER':'START','PAUSE':'PAUSE','ARRÊTER':'STOP','REPRENDRE':'RESUME',
// ── Émulation ──
"Badges \u00b7 Récompenses \u00b7 Projetable TNI":"Badges \u00b7 Rewards \u00b7 IWB Ready",
'+ Groupe':'+ Group','Réinitialiser':'Reset','Supprimer':'Delete',
// ── Code Blanc ──
'Alerte envoyée':'Alert sent',
"Vibration activée \u00b7 Restez calme":"Vibration active \u00b7 Stay calm",
"ANNULER L'ALERTE":"CANCEL ALERT",
// ── JS render strings ──
'10 Situations & Solutions':'10 Situations & Solutions',
'Voir la solution':'See Solution','Masquer':'Hide',
"📝 Noter cette intervention":"📝 Log this intervention",
'Role inclusif':'Inclusive Role',
"📋 Ajouter a ma seance":"📋 Add to my session",
'Régulateur Sonore':'Sound Regulator','Time Timer':'Time Timer',
'En cours':'Running','Prêt':'Ready',
"Séquence du cours":"Lesson Sequence","D'abord":"First",'Ensuite':'Then',
'Je me calme':'I calm down',
"Inspire quand ça gonfle...":"Breathe in as it grows...",
"Expire quand ça dégonfle.":"Breathe out as it shrinks.",
"Mon énergie":"My Energy",
'Zen / Calme':'Zen / Calm','Bien / Prêt':'Good / Ready',
'Excité / Agité':'Excited / Restless','Frustré / Colère':'Frustrated / Angry',
'CRISE / BESOIN PAUSE':'CRISIS / NEED BREAK',
'Je choisis':'I choose','Réussite':'Success',
"J'ai besoin de...":"I need...",
"🎧 Casque":"🎧 Headphones","🧱 Pousser mur":"🧱 Push wall",
"⛺ Tente":"⛺ Tent","💧 Eau":"💧 Water",
'Comment faire ?':'How to?',
"✋ Demander":"✋ Ask","Est-ce que je peux jouer?":"Can I play?",
"⏳ Attendre":"⏳ Wait","J'attends que mon ami finisse.":"I wait for my friend to finish.",
"🤝 Partager":"🤝 Share","On y va chacun notre tour.":"We take turns.",
"🗣️ Dire comment je me sens":"🗣️ Say how I feel",
"Je suis fâché parce que...":"I am upset because...",
'Mon Focus':'My Focus',
"Oreilles écoutent ?":"Ears listening?","Yeux regardent ?":"Eyes watching?",
"OUI ✅":"YES ✅","PAS ENCORE":"NOT YET",
'Séance vide':'Empty session',
'Cliquez sur un bouton ci-dessus pour construire votre séquence':
  'Click a button above to build your sequence',
"⏱️ Durée totale":"⏱️ Total duration",'min':'min',
'Consignes, déroulement, variantes...':'Instructions, steps, variations...',
"Taille émoji":"Emoji size",'Taille':'Size',
'Aucun incident enregistré':'No incidents recorded','Noted!':'Noted!',
"Journal d'Incidents — Intervention Groupe":"Incident Log — Group Intervention",
'Date':'Date','Élève':'Student','Type':'Type','Solution':'Solution',
'Efficacité':'Effectiveness','Notes':'Notes',
'Exporté le':'Exported on',
'Généré par Intervention Groupe — zonetotalsport.ca':'Generated by Group Intervention — zonetotalsport.ca',
'+ Séquence':'+ Sequence','EFFORT':'WORK','REPOS':'REST',
'Ronde':'Round',
"🏀 Basket":"🏀 Basketball","⚽ Soccer":"⚽ Soccer","🏃 Parcours":"🏃 Course","🧩 Calme":"🧩 Calm",
'Aucun groupe. Appuyez sur + Groupe.':'No groups. Press + Group.',
'Equipe':'Team',
'Bleu':'Blue','Jaune':'Yellow','Rouge':'Red','Violet':'Purple',
'Vert':'Green','Orange':'Orange','Rose':'Pink','Indigo':'Indigo',
'1er tour':'1st Round','Quarts':'Quarters','Demis':'Semis','Finale':'Final','Super Finale':'Super Final',
'matchs (rotation complete)':'matches (full rotation)',
"— BYE —":"— BYE —",
'Revoir plus tard':'Review later',"C'est parti !":"Let's go!",'Retour':'Back',
'niveaux':'levels','Rôle inclusif':'Inclusive Role',
// ── Seq defaults ──
'Arrivée au gymnase':'Gym Arrival','Entrée':'Entry','Routine':'Routine',
'Activité':'Activity','Retour au calme':'Cool Down','Période terminée':'Period Over',
// ── Icon labels ──
'Linge normal':'Regular clothes',"Linge d'éduc":"Gym clothes",'Espadrilles':'Sneakers',
'Consignes':'Instructions','Échauffement':'Warm-up','Courir':'Run',
'Sauter':'Jump','Dribbler':'Dribble','Lancer':'Throw','Attraper':'Catch',
'Kicker':'Kick','Jeu / Activité':'Game / Activity','Fin du jeu':'Game over',
"Boire de l'eau":"Drink water",'Toilette':'Bathroom','Départ':'Departure',
// ── Checklist defaults ──
'Changer de linge':'Change clothes','Atelier 1':'Workshop 1','Rangement':'Clean up',
// ── Tool tab labels ──
"⏱️ Timer":"⏱️ Timer","🌬️ Respire":"🌬️ Breathe","🌡️ Humeur":"🌡️ Mood",
"✅ Tâches":"✅ Tasks","🧘 Pause":"🧘 Break","🤝 Social":"🤝 Social","👂 Focus":"👂 Focus",
// ── Prompt / confirm texts ──
'Entrez 2 noms separees par une virgule :':'Enter 2 names separated by a comma:',
'Entrez exactement 2 noms separes par une virgule.':'Enter exactly 2 names separated by a comma.',
'Entrez des noms.':'Enter names.',
"Il faut au moins autant de noms que d'equipes.":"You need at least as many names as teams.",
'Il faut au moins 2 participants.':'You need at least 2 participants.',
'Nom du groupe :':'Group name:','Groupe':'Group',
'Reinitialiser tous les groupes ?':'Reset all groups?',
// ── Welcome modal ──
"Le couteau suisse des outils d'interventions":"The Swiss army knife of intervention tools",
'Bienvenue ! Voici tout ce que cette app peut faire pour toi :':'Welcome! Here is everything this app can do for you:',
'10 Scenarios':'10 Scenarios','Effacer':'Clear',
'Gomme':'Eraser'
};

// ============================================================
// WELCOME MODAL — ENGLISH
// ============================================================
const WELCOME_EN = `
<p class="font-luckiest text-2xl text-center uppercase" style="color:#004A61">Welcome! Here is everything this app can do for you:</p>
<div class="border-2 rounded-lg p-6 border-b-4 border-r-4" style="border-color:#ef444440;background:#ef444408">
<h3 class="font-luckiest text-2xl uppercase mb-3" style="color:#ef4444">🚨 SOS Crisis — 100 field solutions</h3>
<p><span class="font-luckiest" style="color:#ef4444">10 common situations</span> (noise, opposition, panic, conflict, refusal, missing equipment, injury, waiting, cheating, heat). Each contains <span class="font-luckiest" style="color:#ef4444">10 concrete scenarios</span> with a step-by-step solution. Use the <span class="font-luckiest" style="color:#ef4444">search bar</span> to quickly find your situation.</p>
<p class="mt-2 text-base text-slate-500">💡 The <span class="font-luckiest text-lg" style="color:#ef4444">CODE WHITE</span> button triggers a vibration + sound alert for emergencies.</p>
</div>
<div class="border-2 rounded-lg p-6 border-b-4 border-r-4" style="border-color:#00C4FF40;background:#00C4FF08">
<h3 class="font-luckiest text-2xl uppercase mb-3" style="color:#0086AD">🎮 60 Inclusive Games — 6 categories</h3>
<p><span class="font-luckiest" style="color:#0086AD">Tag, Balls, Parachute, Cooperative, Relay and Strategy.</span> Each game shows the <span class="font-luckiest" style="color:#0086AD">complexity level</span> (C1 = simple, C2 = medium, C3 = advanced), possible <span class="font-luckiest" style="color:#0086AD">inclusive roles</span> and a complete description.</p>
<p class="mt-2 text-base text-slate-500">💡 Filter by category with the <span class="font-luckiest" style="color:#0086AD">colored tabs</span> at the top.</p>
</div>
<div class="border-2 rounded-lg p-6 border-b-4 border-r-4" style="border-color:#AAFF0040;background:#AAFF0008">
<h3 class="font-luckiest text-2xl uppercase mb-3" style="color:#4d7a00">🔀 30 Transitions — Movements & Gathering</h3>
<p>Tips organized by category to <span class="font-luckiest" style="color:#4d7a00">move your group</span>, <span class="font-luckiest" style="color:#4d7a00">gather students</span> and <span class="font-luckiest" style="color:#4d7a00">manage cool down</span>. No more repeated whistles!</p>
</div>
<div class="border-2 rounded-lg p-6 border-b-4 border-r-4" style="border-color:#0086AD40;background:#0086AD08">
<h3 class="font-luckiest text-2xl uppercase mb-3" style="color:#004A61">🧰 ASD Tools — 7 sensory tools</h3>
<ul class="space-y-3 ml-5 list-none">
<li><span class="font-luckiest text-lg" style="color:#004A61">⏱️ Visual Timer</span> — Countdown with animated SVG circle. Perfect for IWB display.</li>
<li><span class="font-luckiest text-lg" style="color:#004A61">🌬️ Breathe</span> — Guided breathing animation. Ideal for cool down.</li>
<li><span class="font-luckiest text-lg" style="color:#004A61">🌡️ Mood</span> — 5-level visual thermometer for students to express their state.</li>
<li><span class="font-luckiest text-lg" style="color:#004A61">✅ Tasks</span> — Checkable verification list (equipment, instructions, etc.).</li>
<li><span class="font-luckiest text-lg" style="color:#004A61">🧘 Sensory Break</span> — Self-regulation activities (headphones, push wall, tent, water).</li>
<li><span class="font-luckiest text-lg" style="color:#004A61">🤝 Social</span> — Social scenarios with YES/NOT YET to teach social skills.</li>
<li><span class="font-luckiest text-lg" style="color:#004A61">👂 Focus</span> — Visual steps to learn to listen.</li>
</ul></div>
<div class="border-2 rounded-lg p-6 border-b-4 border-r-4" style="border-color:#FFA62540;background:#FFA62508">
<h3 class="font-luckiest text-2xl uppercase mb-3" style="color:#cc8400">📋 My Session — Plan your period</h3>
<p>Build your lesson sequence by adding blocks: <span class="font-luckiest" style="color:#cc8400">Arrival, Entry, Routine, Activity, Cool Down, End</span>. Each block is customizable:</p>
<ul class="space-y-2 ml-5 list-none mt-2">
<li><span class="font-luckiest text-lg" style="color:#cc8400">😀 Sport emojis</span> — Pick from 32 pictograms</li>
<li><span class="font-luckiest text-lg" style="color:#cc8400">✏️ Text area</span> — Write instructions and steps</li>
<li><span class="font-luckiest text-lg" style="color:#cc8400">🎨 Drawing</span> — Draw a court, placement or diagram + auto-smoothing</li>
<li><span class="font-luckiest text-lg" style="color:#cc8400">↕️ Drag & drop</span> — Reorder blocks</li>
</ul>
<p class="mt-3">The <span class="font-luckiest" style="color:#cc8400">Pick</span> tab shows 60 games to add directly. The <span class="font-luckiest" style="color:#cc8400">Tasks</span> tab is an incident log.</p>
</div>
<div class="border-2 rounded-lg p-6 border-b-4 border-r-4" style="border-color:#00FF9240;background:#00FF9208">
<h3 class="font-luckiest text-2xl uppercase mb-3" style="color:#00995a">📢 Noise Detector — Auto sound traffic light</h3>
<p>Uses your device's <span class="font-luckiest" style="color:#00995a">microphone</span> to detect noise level. The light automatically goes from <span class="font-luckiest" style="color:#22c55e">green</span> (quiet) to <span class="font-luckiest" style="color:#f59e0b">yellow</span> (caution) to <span class="font-luckiest" style="color:#ef4444">red</span> (too loud). Project on IWB so students can see in real time!</p>
</div>
<div class="border-2 rounded-lg p-6 border-b-4 border-r-4" style="border-color:#FFFA0040;background:#FFFA0008">
<h3 class="font-luckiest text-2xl uppercase mb-3" style="color:#998500">⚡ Pro Tools — Group Management</h3>
<ul class="space-y-3 ml-5 list-none">
<li><span class="font-luckiest text-lg" style="color:#998500">👥 No-Fight Teams</span> — Enter names, add known conflicts, and the app generates teams avoiding problem pairs.</li>
<li><span class="font-luckiest text-lg" style="color:#998500">🏆 Table Gone (Tournaments)</span> — Generate elimination or rotation brackets.</li>
<li><span class="font-luckiest text-lg" style="color:#998500">⏱️ Tabata / Workshops</span> — Interval timer with sound signals. Configure work, rest, rounds and stations.</li>
<li><span class="font-luckiest text-lg" style="color:#998500">⭐ Rewards</span> — Points and badges by group. Project on IWB to motivate students!</li>
</ul>
</div>
<div class="bg-slate-50 rounded-lg p-6 border border-slate-200">
<h3 class="font-luckiest text-xl uppercase mb-3" style="color:#004A61">📱 Tips</h3>
<ul class="space-y-2 text-base text-slate-600 list-none">
<li>🖥️ Use <span class="font-luckiest" style="color:#004A61">Web/IWB mode</span> (top right) for enlarged display on interactive whiteboard</li>
<li>📲 Install on your phone: Safari Menu → <span class="font-luckiest" style="color:#004A61">"Add to Home Screen"</span></li>
<li>📴 The app works <span class="font-luckiest" style="color:#004A61">offline</span> once installed — perfect for gyms without WiFi</li>
<li>💾 All your data is <span class="font-luckiest" style="color:#004A61">saved locally</span></li>
</ul></div>`;

// ============================================================
// MISC DATA TRANSLATIONS — EN
// ============================================================
const MISC_EN = {
  seqDefaults: {
    arrivee:{titre:'Gym Arrival'},entree:{titre:'Entry'},routine:{titre:'Routine'},
    activite:{titre:'Activity'},retour:{titre:'Cool Down'},fin:{titre:'Period Over'}
  },
  iconLabels: ['Regular clothes','Gym clothes','Sneakers','Instructions','Warm-up','Run','Jump','Dribble','Throw','Catch','Kick','Game / Activity','Game over','Drink water','Bathroom','Cool down','Departure'],
  tasks: [{id:1,text:'Change clothes',done:false},{id:2,text:'Warm-up',done:false},{id:3,text:'Workshop 1',done:false},{id:4,text:'Clean up',done:false}],
  outilsDef: [
    {id:'timer',label:'⏱️ Timer',hex:'#0086AD'},
    {id:'respire',label:'🌬️ Breathe',hex:'#00FF92'},
    {id:'thermo',label:'🌡️ Mood',hex:'#FFA625'},
    {id:'checklist',label:'✅ Tasks',hex:'#00C4FF'},
    {id:'sensoriel',label:'🧘 Break',hex:'#a855f7'},
    {id:'social',label:'🤝 Social',hex:'#FFFA00'},
    {id:'ecoute',label:'👂 Focus',hex:'#AAFF00'}
  ],
  teamNames: ['Blue','Yellow','Red','Purple','Green','Orange','Pink','Indigo'],
  roundNames: ['1st Round','Quarters','Semis','Final','Super Final'],
  moodLabels: ['','Zen / Calm','Good / Ready','Excited / Restless','Frustrated / Angry','CRISIS / NEED BREAK']
};

// ============================================================
// TRANSLATION ENGINE
// ============================================================
// Reverse map EN→FR
const TR_REV = {};
Object.keys(TR).forEach(k => { TR_REV[TR[k]] = k; });

function translateElement(el, lang) {
  if (!el) return;
  const targetLang = lang || currentLang;
  const map = targetLang === 'en' ? TR : TR_REV;

  // Text nodes
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent.trim();
    if (text && map[text]) {
      node.textContent = node.textContent.replace(text, map[text]);
    }
  }

  // Placeholders
  el.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(inp => {
    const ph = inp.placeholder;
    if (map[ph]) inp.placeholder = map[ph];
  });

  // Select options
  el.querySelectorAll('select option').forEach(opt => {
    const text = opt.textContent.trim();
    if (map[text]) opt.textContent = map[text];
  });

  // Title attributes
  el.querySelectorAll('[title]').forEach(e => {
    const t = e.getAttribute('title');
    if (map[t]) e.setAttribute('title', map[t]);
  });
}

// ============================================================
// DATA SWAPPING
// ============================================================
function swapData(lang) {
  const I18N = window.I18N_DATA || {};
  if (lang === 'en' && I18N.en) {
    if (I18N.en.sosData) sosData.splice(0, sosData.length, ...I18N.en.sosData);
    if (I18N.en.jeuxData) jeuxData.splice(0, jeuxData.length, ...I18N.en.jeuxData);
    if (I18N.en.transData) transData.splice(0, transData.length, ...I18N.en.transData);
  } else {
    sosData.splice(0, sosData.length, ..._frSos);
    jeuxData.splice(0, jeuxData.length, ..._frJeux);
    transData.splice(0, transData.length, ..._frTrans);
  }

  const misc = (lang === 'en') ? MISC_EN : null;
  if (misc) {
    Object.keys(misc.seqDefaults).forEach(k => {
      if (seqDefaults[k]) seqDefaults[k].titre = misc.seqDefaults[k].titre;
    });
    misc.iconLabels.forEach((l, i) => { if (iconsList[i]) iconsList[i].l = l; });
    misc.tasks.forEach((t, i) => { if (tasks[i]) tasks[i].text = t.text; });
    misc.outilsDef.forEach((o, i) => { if (outilsDef[i]) outilsDef[i].label = o.label; });
  } else {
    Object.keys(_frSeqDefaults).forEach(k => {
      if (seqDefaults[k]) seqDefaults[k].titre = _frSeqDefaults[k].titre;
    });
    _frIconsList.forEach((item, i) => { if (iconsList[i]) iconsList[i].l = item.l; });
    _frTasks.forEach((t, i) => { if (tasks[i]) tasks[i].text = t.text; });
    _frOutilsDef.forEach((o, i) => { if (outilsDef[i]) outilsDef[i].label = o.label; });
  }
}

// ============================================================
// WELCOME MODAL TRANSLATION
// ============================================================
let _frWelcomeBody = null;

function translateWelcome(lang) {
  const modal = document.getElementById('welcome-modal');
  if (!modal) return;
  const bodyContainer = modal.querySelector('.space-y-6');
  if (!bodyContainer) return;
  if (!_frWelcomeBody) _frWelcomeBody = bodyContainer.innerHTML;

  if (lang === 'en') {
    bodyContainer.innerHTML = WELCOME_EN;
  } else {
    bodyContainer.innerHTML = _frWelcomeBody;
  }

  const btns = modal.querySelectorAll('.p-6.pt-0 button');
  if (btns.length >= 2) {
    if (lang === 'en') { btns[0].textContent = 'Review later'; btns[1].textContent = "Let's go!"; }
    else { btns[0].textContent = 'Revoir plus tard'; btns[1].textContent = "C'est parti !"; }
  }

  const h2 = modal.querySelector('h2');
  if (h2) h2.textContent = lang === 'en' ? 'Group Intervention' : 'Intervention Groupe';
  const subtitle = modal.querySelector('.text-white\\/80');
  if (subtitle) subtitle.textContent = lang === 'en'
    ? 'The Swiss army knife of intervention tools'
    : "Le couteau suisse des outils d'interventions";
}

// ============================================================
// RE-RENDER ALL VIEWS
// ============================================================
function rerenderAll() {
  if (typeof renderSOS === 'function') renderSOS();
  if (typeof renderJeux === 'function') renderJeux();
  if (typeof renderTransitions === 'function') renderTransitions();
  if (typeof renderOutils === 'function') renderOutils();
  if (typeof renderPlanif === 'function') renderPlanif();
  if (typeof renderJournal === 'function') renderJournal();
  if (typeof renderEmuBoard === 'function') renderEmuBoard();
  if (typeof renderConflicts === 'function') renderConflicts();
  if (typeof renderJeuxInline === 'function') renderJeuxInline();
}

// ============================================================
// LANGUAGE SWITCHING
// ============================================================
function setLang(lang) {
  const prevLang = currentLang;
  currentLang = lang;
  localStorage.setItem('og-lang', lang);
  document.documentElement.lang = lang;

  swapData(lang);
  rerenderAll();
  // If switching back to FR, first reverse EN→FR on static DOM text
  if (lang === 'fr' && prevLang !== 'fr') {
    translateElement(document.getElementById('app'), 'fr');
  } else if (lang !== 'fr') {
    translateElement(document.getElementById('app'), lang);
  }
  translateWelcome(lang);

  const picker = document.getElementById('lang-picker');
  if (picker) picker.value = lang;

  document.title = lang === 'en'
    ? 'Group Intervention — The Swiss army knife of intervention tools'
    : "Intervention Groupe — Le couteau suisse des outils d'interventions";
}

window.setLang = setLang;

// ============================================================
// WRAP RENDER FUNCTIONS (auto-translate after render)
// ============================================================
function wrapRender(fnName) {
  const orig = window[fnName];
  if (!orig) return;
  window[fnName] = function() {
    const result = orig.apply(this, arguments);
    if (currentLang !== 'fr') {
      requestAnimationFrame(() => translateElement(document.getElementById('app'), currentLang));
    }
    return result;
  };
}

['renderSOS','renderJeux','renderTransitions','renderOutils','renderOutilContent',
 'renderPlanif','renderJournal','renderEmuBoard','renderConflicts','renderJeuxInline',
 'filterJeux','filterJeuxInline','switchSeanceTab','setOutil','toggleSol',
 'quickLogIdx','openSOS','filterSOS','generateTeams','generateTournament',
 'updateTabataDisplay','pauseTabata','startTabata','stopTabata',
 'openJeu','openTransition'].forEach(wrapRender);

// ============================================================
// LANGUAGE PICKER UI
// ============================================================
function addLangPicker() {
  const subbar = document.querySelector('header .px-4.pb-2.flex');
  if (!subbar) return;

  const picker = document.createElement('select');
  picker.id = 'lang-picker';
  picker.className = 'px-2 py-1 rounded-lg text-xs font-bold bg-white/30 text-white border-0 outline-none press cursor-pointer';
  picker.style.cssText = 'appearance:none;-webkit-appearance:none;padding-right:1.5rem;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' fill=\'white\' viewBox=\'0 0 16 16\'%3E%3Cpath d=\'M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z\'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 0.4rem center;';
  picker.innerHTML = '<option value="fr">FR</option><option value="en">EN</option>';
  picker.value = currentLang;
  picker.addEventListener('change', function() { setLang(this.value); });

  subbar.insertBefore(picker, subbar.firstChild);
}

// ============================================================
// INIT
// ============================================================
addLangPicker();
if (currentLang !== 'fr') {
  requestAnimationFrame(() => setLang(currentLang));
}

})();
