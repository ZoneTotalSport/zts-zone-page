/* ==========================================================================
   PROTO G2 — Planificateur « simplicité ».
   Maquette de validation. Aucune écriture serveur : tout vit en localStorage
   sous le préfixe `protog2:`. Se jette d'un clic (bouton « Vider ma saisie »).

   Trois pièges payés dans la version perdue, tenus ici :
   #1  contraste — traité dans proto.css : chaque panneau clair déclare `color`.
   #2  minuteries empilées — un SEUL intervalle global (`horloge`), et une
       minuterie déjà partie refuse de repartir. Le décompte se calcule depuis
       un instant d'arrivée absolu (`finA`), donc il ne dérive pas.
   #3  saisie pendant le décompte — `verrou()` gèle préréglages et champ tant
       que ça tourne. Sans ça, éditer le temps fige le compte.
   ========================================================================== */
'use strict';

const P = 'protog2:';
const lire  = (k, d) => { try { const v = localStorage.getItem(P+k); return v===null?d:JSON.parse(v); } catch(e){ return d; } };
const ecrire= (k, v) => { try { localStorage.setItem(P+k, JSON.stringify(v)); } catch(e){ prevenirQuota(); } };
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const el = (t,c,x)=>{ const n=document.createElement(t); if(c)n.className=c; if(x!=null)n.textContent=x; return n; };

let quotaDit = false;
function prevenirQuota(){
  if (quotaDit) return; quotaDit = true;
  alert("La mémoire du navigateur est pleine — les dernières pièces jointes ne seront pas conservées.\n\n(C'est exactement la faiblesse relevée dans le contrat fonctionnel : les médias vivent en localStorage et ne suivent pas l'utilisateur.)");
}

/* ═════════ champs éditables — liaison automatique ═════════ */
function brancherEditables(racine=document){
  $$('[contenteditable][data-k]', racine).forEach(n=>{
    if (n.dataset.branche) return; n.dataset.branche = '1';
    const v = lire('ed:'+n.dataset.k, null);
    if (v !== null) n.textContent = v;
    n.addEventListener('input', ()=> ecrire('ed:'+n.dataset.k, n.textContent));
    n.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey && n.dataset.court!=='0'){ e.preventDefault(); n.blur(); } });
  });
  $$('input[type=checkbox][data-k]', racine).forEach(n=>{
    if (n.dataset.branche) return; n.dataset.branche = '1';
    n.checked = !!lire('ck:'+n.dataset.k, false);
    n.addEventListener('change', ()=> ecrire('ck:'+n.dataset.k, n.checked));
  });
}

/* ═════════ navigation ═════════ */
const ECRANS = [
  ['e-accueil','🏠 ACCUEIL'], ['e-journee','📋 MA JOURNÉE'], ['e-jeux','🎲 JEUX'],
  ['e-semaine','🗓️ SEMAINE'], ['e-mois','📅 MOIS'], ['e-annee','📚 ANNÉE'],
  ['e-cours','🏀 MON COURS'], ['e-calendrier','📆 CALENDRIER'],
  ['e-temps','⏱️ MON TEMPS'], ['e-plus','⋯ PLUS'],
];
function allerA(id){
  $$('.ecran').forEach(s=> s.classList.toggle('on', s.id===id));
  $$('#nav button').forEach(b=> b.setAttribute('aria-current', String(b.dataset.va===id)));
  window.scrollTo({top:0,behavior:'instant'});
  ecrire('ecran', id);
}
(function nav(){
  const n = $('#nav');
  ECRANS.forEach(([id,lab])=>{
    const b = el('button',null,lab); b.type='button'; b.dataset.va=id;
    b.addEventListener('click',()=>allerA(id)); n.appendChild(b);
  });
})();
document.addEventListener('click', e=>{
  const t = e.target.closest('[data-va]'); if(!t) return;
  allerA(t.dataset.va);
});

/* ═════════ métier ═════════ */
const METIERS = {
  eps : {tuile3:'MES COURS',   aide:'Le plan du cours, bloc par bloc', badge:1274},
  camp: {tuile3:'MA JOURNÉE',  aide:'Le déroulement de la journée',    badge:970},
  sdg : {tuile3:'MA PÉRIODE',  aide:'Le bloc du service de garde',     badge:177},
};
function poserMetier(m){
  const d = METIERS[m] || METIERS.eps;
  $('#tuile3').textContent = d.tuile3;
  $('#tuile3aide').textContent = d.aide;
  $('#badgeJeux').textContent = d.badge;
  $$('#metiers .metier').forEach(b=> b.setAttribute('aria-pressed', String(b.dataset.metier===m)));
  ecrire('metier', m);
}
$$('#metiers .metier').forEach(b=> b.addEventListener('click',()=>poserMetier(b.dataset.metier)));

/* ═════════ horloge unique — piège #2 ═════════ */
const minuteries = new Map();          // id → {finA, reste, tourne, noeud}
let horloge = null;
function demarrerHorloge(){
  if (horloge !== null) return;        // ← garde : jamais deux intervalles
  horloge = setInterval(tic, 250);
}
function arreterHorlogeSiVide(){
  if ([...minuteries.values()].some(m=>m.tourne)) return;
  if (horloge !== null){ clearInterval(horloge); horloge = null; }
}
function tic(){
  const t = Date.now();
  minuteries.forEach((m,id)=>{
    if (!m.tourne) return;
    const reste = Math.max(0, Math.round((m.finA - t)/1000));
    m.reste = reste;
    peindreMinuterie(id);
    if (reste === 0){ m.tourne = false; verrou(id,false); sonner(); proposerFait(id); }
  });
  arreterHorlogeSiVide();
}
const mmss = s => Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function peindreMinuterie(id){
  const m = minuteries.get(id); if(!m) return;
  const c = m.noeud.querySelector('.chrono');
  c.textContent = mmss(m.reste);
  c.classList.toggle('court', m.tourne && m.reste<=10);
  m.noeud.classList.toggle('tourne', m.tourne);
  m.noeud.querySelector('[data-go]').textContent = m.tourne ? '⏸ PAUSE' : '▶ PARTIR';
}
function verrou(id, on){                 // ← piège #3
  const m = minuteries.get(id); if(!m) return;
  m.noeud.dataset.verrou = on ? '1' : '0';
  const s = m.noeud.querySelector('.saisie');
  s.readOnly = on;
  if (!on) s.value = mmss(m.reste);
}
function poserTemps(id, secondes){
  const m = minuteries.get(id); if(!m || m.tourne) return;   // refuse pendant le décompte
  m.reste = Math.max(0, Math.min(99*60+59, Math.round(secondes)));
  m.noeud.querySelector('.saisie').value = mmss(m.reste);
  peindreMinuterie(id);
}
/* accepte « 7 », « 2:30 », « 1h30 », « 90s » */
function lireDuree(txt){
  const t = String(txt).trim().toLowerCase().replace(',','.');
  if (!t) return null;
  let mm;
  if ((mm = t.match(/^(\d+)\s*[:h]\s*(\d{1,2})$/))) return (+mm[1])*60 + (+mm[2]);
  if ((mm = t.match(/^(\d+)\s*s$/)))                return +mm[1];
  if ((mm = t.match(/^(\d+(?:\.\d+)?)\s*(?:min|m)?$/))) return Math.round(parseFloat(mm[1])*60);
  return null;
}
let dernierFini = null;
function proposerFait(id){ dernierFini = id; $('#btnMarquer').hidden = false; }
$('#btnMarquer').addEventListener('click', ()=>{
  if (dernierFini){
    const b = document.getElementById(dernierFini);
    if (b){ const c = b.querySelector('.chk input'); c.checked = true; c.dispatchEvent(new Event('change',{bubbles:true})); }
  }
  $('#btnMarquer').hidden = true; dernierFini = null;
});

/* ═════════ buzzer ═════════ */
let sonChoisi = lire('son','nba'), muet = lire('muet',false), volume = lire('vol',70);
function appliquerSon(){
  $$('#buzzChoix .mini').forEach(b=> b.setAttribute('aria-pressed', String(b.dataset.son===sonChoisi)));
  $('#btnMuet').textContent = muet ? '🔇' : '🔊';
  $('#btnMuet').setAttribute('aria-pressed', String(muet));
  $('#vol').value = volume; $('#volLab').innerHTML = volume+'&nbsp;%';
  [$('#sonNba'),$('#sonArena')].forEach(a=> a.volume = muet ? 0 : volume/100);
}
function sonner(){
  if (muet || sonChoisi==='mute') return;
  const a = sonChoisi==='arena' ? $('#sonArena') : $('#sonNba');
  try { a.currentTime = 0; a.play().catch(()=>{}); } catch(e){}
}
$$('#buzzChoix .mini').forEach(b=> b.addEventListener('click',()=>{ sonChoisi=b.dataset.son; ecrire('son',sonChoisi); appliquerSon(); }));
$('#btnMuet').addEventListener('click', ()=>{ muet=!muet; ecrire('muet',muet); appliquerSon(); });
$('#vol').addEventListener('input', e=>{ volume=+e.target.value; ecrire('vol',volume); appliquerSon(); });
$('#btnEssai').addEventListener('click', sonner);
appliquerSon();

/* ═════════ médias ═════════ */
function mediasDe(id){ return lire('med:'+id, []); }
function peindreMedias(bloc){
  const hote = bloc.querySelector('.media-liste'); hote.innerHTML='';
  mediasDe(bloc.id).forEach((m,i)=>{
    const v = el('div','media-vign');
    if (m.type==='image' && m.data)      v.innerHTML = '<img alt="" src="'+m.data+'">';
    else if (m.type==='video' && m.data) v.innerHTML = '<video src="'+m.data+'" muted></video>';
    else if (m.type==='jeu')             v.innerHTML = '<div class="doc">🎲</div>';
    else if (m.type==='pdf')             v.innerHTML = '<div class="doc">📄</div>';
    else                                 v.innerHTML = '<div class="doc">'+(m.type==='video'?'🎬':'🖼️')+'</div>';
    v.appendChild(Object.assign(el('span','lab',m.nom),{}));
    const x = el('span','x','✕'); x.title='Retirer';
    x.addEventListener('click',()=>{ const l=mediasDe(bloc.id); l.splice(i,1); ecrire('med:'+bloc.id,l); peindreMedias(bloc); });
    v.appendChild(x); hote.appendChild(v);
  });
}
function ajouterMedia(bloc, m){
  const l = mediasDe(bloc.id); l.push(m); ecrire('med:'+bloc.id, l); peindreMedias(bloc);
}
function choisirFichier(bloc, type){
  const i = document.createElement('input'); i.type='file';
  i.accept = type==='image' ? 'image/*' : type==='video' ? 'video/*' : 'application/pdf';
  i.addEventListener('change', ()=>{
    const f = i.files[0]; if(!f) return;
    if (f.size > 700*1024 || type==='pdf'){          // trop lourd pour localStorage
      ajouterMedia(bloc, {type, nom:f.name, data:null});
      return;
    }
    const r = new FileReader();
    r.onload = ()=> ajouterMedia(bloc, {type, nom:f.name, data:r.result});
    r.readAsDataURL(f);
  });
  i.click();
}

/* ═════════ blocs ═════════ */
let seqBloc = lire('seqBloc', 0);
function nouvelId(){ seqBloc++; ecrire('seqBloc', seqBloc); return 'b'+seqBloc; }

function faireBloc(o){
  const b = el('div','bloc'); b.id = o.id; b.draggable = false;
  b.innerHTML = `
    <div class="bloc-tete">
      <span class="poignee" draggable="true" title="Glisser pour replacer">⠿</span>
      <span class="bloc-titre" contenteditable data-k="${o.id}-t" data-vide="Titre du bloc"></span>
      <label class="chk"><input type="checkbox" data-k="${o.id}-f"> FAIT</label>
      <button type="button" class="mini mini--rose" data-sup title="Retirer ce bloc">✕</button>
    </div>
    <div class="bloc-desc" contenteditable data-k="${o.id}-d" data-vide="Descriptif — matériel, consignes, variantes…"></div>
    <div class="medias">
      <button type="button" class="mini" data-med="image">🖼️ IMAGE</button>
      <button type="button" class="mini" data-med="video">🎬 VIDÉO</button>
      <button type="button" class="mini" data-med="pdf">📄 PDF</button>
      <button type="button" class="mini mini--jaune" data-med="jeu">🎲 JEU</button>
    </div>
    <div class="illu-lab"></div>
    <div class="media-liste"></div>
    <div class="minuterie" data-verrou="0">
      <span class="chrono">0:00</span>
      <button type="button" class="mini mini--lime" data-go>▶ PARTIR</button>
      <button type="button" class="mini" data-raz>↺</button>
      <span class="presets">
        <button type="button" class="mini" data-set="60">1 min</button>
        <button type="button" class="mini" data-set="120">2 min</button>
        <button type="button" class="mini" data-set="300">5 min</button>
        <button type="button" class="mini" data-set="600">10 min</button>
        <button type="button" class="mini" data-pas="-300">−5</button>
        <button type="button" class="mini" data-pas="-60">−1</button>
        <button type="button" class="mini" data-pas="60">+1</button>
        <button type="button" class="mini" data-pas="300">+5</button>
      </span>
      <input class="saisie" value="0:00" aria-label="Durée — « 7 » ou « 2:30 »">
    </div>`;
  if (o.titre) { const t=b.querySelector('.bloc-titre'); if(lire('ed:'+o.id+'-t',null)===null){ t.textContent=o.titre; ecrire('ed:'+o.id+'-t',o.titre); } }
  if (o.desc)  { const d=b.querySelector('.bloc-desc');  if(lire('ed:'+o.id+'-d',null)===null){ d.textContent=o.desc;  ecrire('ed:'+o.id+'-d',o.desc);  } }

  if (o.illu) b.querySelector('.illu-lab').textContent = 'Illustration :';
  brancherEditables(b);
  const chk = b.querySelector('.chk input');
  const majFait = ()=> b.classList.toggle('fait', chk.checked);
  chk.addEventListener('change', majFait); majFait();

  minuteries.set(o.id, {finA:0, reste:lire('min:'+o.id, o.duree||0), tourne:false, noeud:b.querySelector('.minuterie')});
  peindreMinuterie(o.id); verrou(o.id,false);
  peindreMedias(b);

  b.addEventListener('click', e=>{
    const t = e.target.closest('button'); if(!t) return;
    const m = minuteries.get(o.id);
    if (t.dataset.med !== undefined){
      if (t.dataset.med==='jeu') ouvrirTiroir(b); else choisirFichier(b, t.dataset.med);
    } else if (t.dataset.go !== undefined){
      if (m.tourne){ m.tourne=false; verrou(o.id,false); peindreMinuterie(o.id); }
      else if (m.reste>0){ m.finA = Date.now() + m.reste*1000; m.tourne=true; verrou(o.id,true); demarrerHorloge(); peindreMinuterie(o.id); }
    } else if (t.dataset.raz !== undefined){
      if (m.tourne){ m.tourne=false; verrou(o.id,false); }
      poserTemps(o.id, 0); ecrire('min:'+o.id, 0);
    } else if (t.dataset.set !== undefined){
      poserTemps(o.id, +t.dataset.set); ecrire('min:'+o.id, minuteries.get(o.id).reste);
    } else if (t.dataset.pas !== undefined){
      poserTemps(o.id, m.reste + (+t.dataset.pas)); ecrire('min:'+o.id, minuteries.get(o.id).reste);
    } else if (t.dataset.sup !== undefined){
      if (confirm('Retirer ce bloc ?')) { minuteries.delete(o.id); b.remove(); sauverBlocs(); }
    }
  });
  const saisie = b.querySelector('.saisie');
  const appliquerSaisie = ()=>{
    const s = lireDuree(saisie.value);
    if (s === null){ saisie.value = mmss(minuteries.get(o.id).reste); return; }
    poserTemps(o.id, s); ecrire('min:'+o.id, minuteries.get(o.id).reste);
  };
  saisie.addEventListener('change', appliquerSaisie);
  saisie.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); appliquerSaisie(); saisie.blur(); }});
  saisie.value = mmss(minuteries.get(o.id).reste);

  /* glisser-déposer */
  const poignee = b.querySelector('.poignee');
  poignee.addEventListener('dragstart', e=>{ b.classList.add('drag'); e.dataTransfer.setData('text/plain', b.id); e.dataTransfer.effectAllowed='move'; });
  poignee.addEventListener('dragend',   ()=> b.classList.remove('drag'));
  b.addEventListener('dragover', e=>{ e.preventDefault(); b.classList.add('over'); });
  b.addEventListener('dragleave',()=> b.classList.remove('over'));
  b.addEventListener('drop', e=>{
    e.preventDefault(); b.classList.remove('over');
    const src = document.getElementById(e.dataTransfer.getData('text/plain'));
    if (!src || src===b || src.parentNode!==b.parentNode) return;
    const apres = [...b.parentNode.children].indexOf(src) < [...b.parentNode.children].indexOf(b);
    b.parentNode.insertBefore(src, apres ? b.nextSibling : b);
    sauverBlocs();
  });
  return b;
}
/* N'enregistre QUE les hôtes déjà montés. Sans le drapeau `pret`, monter le
   premier hôte écrivait un ordre VIDE pour le second, qui se retrouvait ensuite
   sans aucun bloc au chargement suivant. */
function sauverBlocs(){
  ['blocsJournee','blocsCours'].forEach(h=>{
    const n = document.getElementById(h); if(!n || !n.dataset.pret) return;
    ecrire('ord:'+h, $$('.bloc', n).map(b=>b.id));
  });
}
function monterBlocs(hoteId, defauts, opts){
  const hote = document.getElementById(hoteId);
  const ordre = lire('ord:'+hoteId, null) || [];
  const neuf = !ordre.length;
  const src = neuf ? defauts.map(d=>({...d, id:nouvelId()})) : ordre.map(id=>({id}));
  if (neuf) src.forEach(o=> ecrire('min:'+o.id, o.duree||0));  // la durée de départ survit au rechargement
  src.forEach(o=> hote.appendChild(faireBloc({...o, ...(opts||{})})));
  hote.dataset.pret = '1';
  if (neuf) sauverBlocs();
}
monterBlocs('blocsJournee', [
  {titre:'Échauffement — le miroir', desc:'2 par 2, un mène, l’autre suit. On change au signal.', duree:180},
  {titre:'Ballon chasseur — 4 coins', desc:'4 équipes, 6 ballons. Éliminé = tour de gym puis retour.', duree:600},
  {titre:'Retour au calme', desc:'Étirements, on nomme un bon coup du cours.', duree:180},
]);
monterBlocs('blocsCours', [
  {titre:'Mise en train',  desc:'', duree:300},
  {titre:'Corps du cours', desc:'', duree:1800},
  {titre:'Retour',         desc:'', duree:300},
], {illu:true});
$('#addBloc').addEventListener('click', ()=>{
  const b = faireBloc({id:nouvelId(), titre:'', desc:'', duree:0});
  $('#blocsJournee').appendChild(b); sauverBlocs(); b.querySelector('.bloc-titre').focus();
});

/* ═════════ tiroir jeux ═════════ */
const JEUX = [
  {n:'Ballon chasseur — 4 coins', d:'4 équipes, 6 ballons, rotation continue.', e:['Ballon','2e cycle','Gym'], t:10},
  {n:'Le miroir',                 d:'2 par 2, un mène, l’autre suit.',           e:['Échauffement','Sans matériel'], t:3},
  {n:'La tempête',                d:'Course-poursuite avec zones refuges.',      e:['Course','1er cycle','Extérieur'], t:8},
  {n:'Poule, renard, vipère',     d:'Trois camps, chacun chasse et fuit.',       e:['Grand jeu','Extérieur'], t:20},
  {n:'Le nœud humain',            d:'Démêler le groupe sans lâcher les mains.',  e:['Coopération','Sans matériel'], t:10},
  {n:'Parcours cônes et cerceaux',d:'5 stations, chrono par équipe.',            e:['Matériel','Gym','3e cycle'], t:15},
  {n:'Statues musicales',         d:'La musique arrête, tout le monde fige.',    e:['Musique','1er cycle'], t:5},
  {n:'Drapeau',                   d:'Deux camps, un drapeau, une prison.',       e:['Grand jeu','Extérieur','3e cycle'], t:25},
  {n:'Jeu du foulard',            d:'Deux équipes, un numéro appelé.',           e:['Course','2e cycle'], t:12},
  {n:'Relais des serviettes',     d:'Transporter un ballon sans les mains.',     e:['Coopération','Matériel'], t:10},
  {n:'Coin calme — dessine ton cours', d:'Sur papier, quand le gym est pris.',   e:['Plan B','En classe'], t:15},
  {n:'Course aux devinettes',     d:'Indices cachés dans le gym.',               e:['Plan B','Gym','1er cycle'], t:20},
];
const FILTRES = ['1er cycle','2e cycle','3e cycle','Gym','Extérieur','En classe','Sans matériel','Matériel','Coopération','Course','Grand jeu','Plan B'];
let blocCible = null, actifs = new Set();

function ouvrirTiroir(bloc){
  blocCible = bloc || null;
  $('#tiroir').classList.add('on'); $('#tiroir').setAttribute('aria-hidden','false');
  $('#rech').focus();
}
function fermerTiroir(){ $('#tiroir').classList.remove('on'); $('#tiroir').setAttribute('aria-hidden','true'); blocCible=null; }
$('#fermerTiroir').addEventListener('click', fermerTiroir);
document.addEventListener('keydown', e=>{ if(e.key==='Escape') fermerTiroir(); });
document.addEventListener('click', e=>{ if(e.target.closest('[data-tiroir]')) ouvrirTiroir(null); });

(function filtres(){
  const h = $('#filtres');
  FILTRES.forEach(f=>{
    const b = el('button','mini',f); b.type='button'; b.setAttribute('aria-pressed','false');
    b.addEventListener('click',()=>{
      if (actifs.has(f)) actifs.delete(f); else actifs.add(f);
      b.setAttribute('aria-pressed', String(actifs.has(f))); peindreJeux();
    });
    h.appendChild(b);
  });
})();
$('#filtresTete').addEventListener('click', ()=>{
  const o = $('#filtres').classList.toggle('on');
  $('#filtresTete').setAttribute('aria-expanded', String(o));
  $('#filtresTete').textContent = (o?'▾ ':'▸ ')+'FILTRES';
});
$('#rech').addEventListener('input', peindreJeux);
function peindreJeux(){
  const q = $('#rech').value.trim().toLowerCase();
  const h = $('#listeJeux'); h.innerHTML='';
  const vus = JEUX.filter(j=>
    (!q || (j.n+' '+j.d).toLowerCase().includes(q)) &&
    (!actifs.size || [...actifs].every(f=> j.e.includes(f))));
  if (!vus.length){ h.appendChild(el('p',null,'Aucun jeu ne répond aux filtres.')); return; }
  vus.forEach(j=>{
    const c = el('div','carte-jeu');
    c.innerHTML = '<h3></h3><p></p><div></div>';
    c.querySelector('h3').textContent = j.n;
    c.querySelector('p').textContent  = j.d;
    const bas = c.querySelector('div');
    j.e.forEach(x=> bas.appendChild(el('span','etiq',x)));
    const add = el('button','mini mini--lime','＋ AJOUTER'); add.type='button';
    add.style.marginTop='6px';
    add.addEventListener('click', ()=>{
      if (blocCible){ ajouterMedia(blocCible, {type:'jeu', nom:j.n}); }
      else {
        const b = faireBloc({id:nouvelId(), titre:j.n, desc:j.d, duree:j.t*60});
        $('#blocsJournee').appendChild(b); sauverBlocs();
        ecrire('min:'+b.id, j.t*60);
      }
      fermerTiroir(); allerA('e-journee');
    });
    c.appendChild(add); h.appendChild(c);
  });
}
peindreJeux();

/* ═════════ calendrier scolaire — source unique des jours-cycle ═════════ */
const CATS = [
  ['conge',   'Congé scolaire',                  '#BFEFFB'],
  ['pedago',  'Journée pédagogique',             '#FFFAB8'],
  ['cssdhr',  'Journée pédagogique CSSDHR',      '#BFEFFB'],
  ['congres', 'Congrès pédagogique SREJ-SCAS',   '#C9F5B5'],
  ['force',   'Force majeure',                   '#FF9C8F'],
  ['premiere','Première journée scolaire',       '#FF7BE8'],
  ['derniere','Dernière journée scolaire',       '#FF2FA8'],
];
const HORS_ECOLE = new Set(['conge','pedago','cssdhr','congres','force']);
const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const ANNEE_MOIS = [[2025,7],[2025,8],[2025,9],[2025,10],[2025,11],[2026,0],[2026,1],[2026,2],[2026,3],[2026,4],[2026,5]];
const DEBUT = '2025-08-25', FIN = '2026-06-30';
const ROM = ['I','II','III','IV','V','VI'];
const iso = (y,m,d)=> y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');

const SEED = {
  '2025-08-25':'pedago','2025-08-26':'pedago','2025-08-27':'pedago','2025-08-28':'pedago','2025-08-29':'premiere',
  '2025-09-01':'conge','2025-09-19':'pedago',
  '2025-10-10':'cssdhr','2025-10-13':'conge',
  '2025-11-07':'cssdhr','2025-11-21':'pedago',
  '2025-12-05':'pedago','2025-12-22':'conge','2025-12-23':'conge','2025-12-24':'conge','2025-12-25':'conge',
  '2025-12-26':'conge','2025-12-29':'conge','2025-12-30':'conge','2025-12-31':'conge',
  '2026-01-01':'conge','2026-01-02':'conge','2026-01-05':'pedago',
  '2026-02-20':'pedago',
  '2026-03-02':'conge','2026-03-03':'conge','2026-03-04':'conge','2026-03-05':'conge','2026-03-06':'conge','2026-03-20':'pedago',
  '2026-04-02':'pedago','2026-04-03':'conge','2026-04-06':'conge','2026-04-17':'force',
  '2026-05-01':'force','2026-05-18':'conge',
  '2026-06-05':'force','2026-06-23':'derniere','2026-06-24':'conge',
  '2026-06-25':'pedago','2026-06-26':'pedago','2026-06-29':'pedago','2026-06-30':'pedago',
};
let marques = lire('cal', null) || {...SEED};
let catActive = 'conge';
let cycles = {};                         // iso → 'I'..'VI'

function recalculerCycles(){
  cycles = {}; let i = 0;
  ANNEE_MOIS.forEach(([y,m])=>{
    const n = new Date(y, m+1, 0).getDate();
    for (let d=1; d<=n; d++){
      const k = iso(y,m,d), jour = new Date(y,m,d).getDay();
      if (jour===0 || jour===6) continue;
      if (k < DEBUT || k > FIN) continue;
      if (HORS_ECOLE.has(marques[k])) continue;
      cycles[k] = ROM[i % 6]; i++;
    }
  });
  return i;
}
function peindreCalendrier(){
  const total = recalculerCycles();
  $('#calCompte').textContent = total + ' jours-cycle';
  const h = $('#calGrille'); h.innerHTML='';
  ANNEE_MOIS.forEach(([y,m])=>{
    const box = el('div','cal-mois');
    box.appendChild(el('h3',null, MOIS_NOMS[m]+' '+y));
    const t = el('table');
    t.innerHTML = '<thead><tr><th>Lundi</th><th>Mardi</th><th>Mercredi</th><th>Jeudi</th><th>Vendredi</th></tr></thead>';
    const tb = el('tbody');
    const n = new Date(y,m+1,0).getDate();
    let tr = el('tr'), col = 0;
    const dec = (new Date(y,m,1).getDay()+6)%7;   // lundi = 0
    for (let i=0;i<Math.min(dec,5);i++){ tr.appendChild(el('td','hors')); col++; }
    for (let d=1; d<=n; d++){
      const jour = new Date(y,m,d).getDay();
      if (jour===0||jour===6) continue;
      if (col===5){ tb.appendChild(tr); tr = el('tr'); col=0; }
      const k = iso(y,m,d);
      const td = el('td');
      const dedans = k>=DEBUT && k<=FIN;
      td.innerHTML = '<span class="r"></span>'+d;
      if (marques[k]) td.classList.add('c-'+marques[k]);
      if (!dedans) td.classList.add('hors');
      td.querySelector('.r').textContent = cycles[k] || '';
      td.title = (marques[k] ? (CATS.find(c=>c[0]===marques[k])||[])[1] : (cycles[k] ? 'Jour '+cycles[k] : ''));
      if (dedans) td.addEventListener('click', ()=>{
        marques[k] = (marques[k]===catActive) ? undefined : catActive;
        if (!marques[k]) delete marques[k];
        ecrire('cal', marques); peindreCalendrier(); peindreMois(); peindreAnnee();
      });
      tr.appendChild(td); col++;
    }
    while (col<5 && col>0){ tr.appendChild(el('td','hors')); col++; }
    tb.appendChild(tr); t.appendChild(tb);
    let jours = 0; Object.keys(cycles).forEach(k=>{ if(k.startsWith(y+'-'+String(m+1).padStart(2,'0'))) jours++; });
    const tf = el('tfoot'); const ftr = el('tr'); const ftd = el('td', null, jours+' jour'+(jours>1?'s':'')+' école');
    ftd.colSpan = 5; ftr.appendChild(ftd); tf.appendChild(ftr); t.appendChild(tf);
    box.appendChild(t); h.appendChild(box);
  });
}
(function legende(){
  const h = $('#calLegende');
  CATS.forEach(([id,lab,coul])=>{
    const b = el('button'); b.type='button'; b.setAttribute('aria-pressed', String(id===catActive));
    const p = el('span','pastille'); p.style.background = coul;
    b.appendChild(p); b.appendChild(el('span',null,lab));
    b.addEventListener('click',()=>{ catActive=id; $$('#calLegende button').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); });
    h.appendChild(b);
  });
})();

/* ═════════ MOIS ═════════ */
let moisIdx = 1;
function peindreMois(){
  const [y,m] = ANNEE_MOIS[moisIdx];
  $('#moisTitre').textContent = MOIS_NOMS[m]+' '+y;
  const h = $('#moisGrille'); h.innerHTML='';
  const coul = ['#FFFC00','#3ADCFA','#FFFC00','#3ADCFA','#FFFC00'];
  ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'].forEach((j,i)=>{
    const t = el('div','mois-jt',j); t.style.background = coul[i]; h.appendChild(t);
  });
  const n = new Date(y,m+1,0).getDate();
  const dec = (new Date(y,m,1).getDay()+6)%7;
  for (let i=0;i<Math.min(dec,5);i++) h.appendChild(el('div','mois-case vide'));
  for (let d=1; d<=n; d++){
    const jour = new Date(y,m,d).getDay(); if (jour===0||jour===6) continue;
    const k = iso(y,m,d);
    const c = el('div','mois-case');
    if (marques[k]==='conge') c.classList.add('conge');
    if (marques[k]==='pedago'||marques[k]==='cssdhr') c.classList.add('pedago');
    c.innerHTML = '<span class="n"></span><span class="rom"></span><span class="spec"></span>'
      + '<div class="note" contenteditable data-k="mn-'+k+'" data-vide="…"></div>';
    c.querySelector('.n').textContent = d;
    c.querySelector('.rom').textContent = cycles[k] || '';
    c.querySelector('.spec').textContent = marques[k] ? (CATS.find(x=>x[0]===marques[k])||['',''])[1] : '';
    h.appendChild(c);
  }
  brancherEditables(h);
  const cpt = $('#moisCompte'); cpt.innerHTML='';
  ROM.forEach(r=>{
    let n2 = 0;
    Object.entries(cycles).forEach(([k,v])=>{ if (v===r && k.startsWith(y+'-'+String(m+1).padStart(2,'0'))) n2++; });
    const l = el('div',null,'– Jour '+r+' = '+n2);
    l.style.cssText='border:2px solid var(--noir);border-radius:6px;background:#fff;color:var(--ink);padding:2px 8px;margin-bottom:4px;font-weight:800';
    cpt.appendChild(l);
  });
}
$('#moisPrec').addEventListener('click',()=>{ moisIdx=(moisIdx+ANNEE_MOIS.length-1)%ANNEE_MOIS.length; peindreMois(); });
$('#moisSuiv').addEventListener('click',()=>{ moisIdx=(moisIdx+1)%ANNEE_MOIS.length; peindreMois(); });

/* ═════════ ANNÉE ═════════ */
function peindreAnnee(){
  const h = $('#anneeHote'); h.innerHTML='';
  ANNEE_MOIS.forEach(([y,m])=>{
    const pan = el('div','pan');
    const ligne = el('div','annee-ligne');

    const cal = el('div','mini-cal');
    cal.appendChild(el('div','',''));
    cal.firstChild.className='caption';
    cal.firstChild.style.cssText='font-family:var(--f-titre);letter-spacing:.5px;padding:4px;background:var(--noir);color:var(--jaune);text-align:center';
    cal.firstChild.textContent = MOIS_NOMS[m]+' '+y;
    const t = el('table');
    t.innerHTML = '<thead><tr><th>L</th><th>M</th><th>M</th><th>J</th><th>V</th></tr></thead>';
    const tb = el('tbody'); const n = new Date(y,m+1,0).getDate();
    let tr = el('tr'), col=0; const dec=(new Date(y,m,1).getDay()+6)%7;
    for(let i=0;i<Math.min(dec,5);i++){ tr.appendChild(el('td')); col++; }
    let semaines = 1;
    for (let d=1; d<=n; d++){
      const jour=new Date(y,m,d).getDay(); if(jour===0||jour===6) continue;
      if (col===5){ tb.appendChild(tr); tr=el('tr'); col=0; semaines++; }
      const k = iso(y,m,d); const td = el('td');
      td.innerHTML='<span class="r"></span>'+d;
      td.querySelector('.r').textContent = cycles[k]||'';
      if (marques[k]) td.classList.add('c-'+marques[k]);
      tr.appendChild(td); col++;
    }
    while(col<5&&col>0){ tr.appendChild(el('td')); col++; }
    tb.appendChild(tr); t.appendChild(tb); cal.appendChild(t);
    ligne.appendChild(cal);

    const rows = el('div','annee-rows');
    const tete = el('div','annee-row');
    tete.innerHTML = '<span></span><b style="color:#8FE84B">Compétence</b><b style="color:var(--orange)">Moyen d’action</b><b style="color:#4BE8D6">Activité</b>';
    rows.appendChild(tete);
    for (let s=1; s<=semaines; s++){
      const r = el('div','annee-row');
      const kk = y+'-'+m+'-s'+s;
      r.innerHTML = '<span class="fl">➜</span>'
        + '<div class="ch"       contenteditable data-k="an-c-'+kk+'" data-vide="…"></div>'
        + '<div class="ch ch--ma" contenteditable data-k="an-m-'+kk+'" data-vide="…"></div>'
        + '<div class="ch ch--ac" contenteditable data-k="an-a-'+kk+'" data-vide="…"></div>';
      rows.appendChild(r);
    }
    ligne.appendChild(rows);
    pan.appendChild(ligne); h.appendChild(pan);
  });
  brancherEditables(h);
}

/* ═════════ SEMAINE ═════════ */
const PERIODES = [
  ['p',1,'8:00 à 8:50'], ['p',2,'8:50 à 9:40'], ['r',0,'Récréation'],
  ['p',3,'10:00 à 10:50'], ['p',4,'10:50 à 11:40'], ['r',0,'Dîner'],
  ['p',5,'13:05 à 13:55'], ['r',0,'Récréation'], ['p',6,'14:15 à 15:05'],
];
const JOURS = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi'];
(function semaine(){
  const t = el('table','tbl');
  const th = el('tr'); th.appendChild(el('th'));
  JOURS.forEach(j=>{ const c=el('th'); const d=el('div','jour-tete',j); c.appendChild(d); th.appendChild(c); });
  const tb = el('tbody'); tb.appendChild(th);
  PERIODES.forEach((per,i)=>{
    const tr = el('tr');
    if (per[0]==='r'){
      const td = el('td'); td.appendChild(el('div','pause',per[2])); tr.appendChild(td);
      JOURS.forEach(()=>{ const c=el('td'); c.appendChild(el('div','pause','—')); tr.appendChild(c); });
    } else {
      const td = el('td');
      const p = el('div','per','Période '+per[1]);
      p.appendChild(el('small',null,per[2])); td.appendChild(p); tr.appendChild(td);
      JOURS.forEach(j=>{
        const c = el('td'); const b = el('div','case');
        const k = 'sem-'+j+'-'+per[1];
        b.innerHTML = '<div class="gr">'
          + '<span>Gr: <span contenteditable data-k="'+k+'-g" data-vide="—"></span></span>'
          + '<span># cycle <span contenteditable data-k="'+k+'-c" data-vide="—"></span></span></div>'
          + '<span class="act-lab">Activité :</span>'
          + '<div class="act" contenteditable data-k="'+k+'-a" data-vide="…"></div>';
        c.appendChild(b); tr.appendChild(c);
      });
    }
    tb.appendChild(tr);
  });
  t.appendChild(tb); $('#semaineHote').appendChild(t); brancherEditables(t);
})();

/* ═════════ MON TEMPS ═════════ */
function ligneTemps(i){
  const tr = el('tr');
  tr.innerHTML = '<td><div contenteditable data-k="tp-'+i+'-d" data-vide="12 sept."></div></td>'
    + '<td><div contenteditable data-k="tp-'+i+'-a" data-vide="Entraînement mini-basket"></div></td>'
    + '<td><div contenteditable data-k="tp-'+i+'-t" data-vide="1:30" class="tps"></div></td>';
  return tr;
}
let nTemps = lire('nTemps', 9);
(function temps(){
  const h = $('#tempsCorps');
  for (let i=0;i<nTemps;i++) h.appendChild(ligneTemps(i));
  brancherEditables(h);
  h.addEventListener('input', calculerTemps);
  $('#tReconnu').addEventListener('input', calculerTemps);
  $('#addTemps').addEventListener('click', ()=>{
    h.appendChild(ligneTemps(nTemps)); nTemps++; ecrire('nTemps', nTemps);
    brancherEditables(h); calculerTemps();
  });
  /* le premier calcul attend le bas du fichier : `#tReconnu` vit dans le HTML
     statique et n'est branché — donc restauré — que par le brancherEditables()
     global. Le lancer ici lirait un champ encore vide. */
})();
/* MON TEMPS compte en HEURES:MINUTES, pas en minutes:secondes. « 1:30 » y vaut
   une heure et demie alors que la même chaîne vaut 90 s dans une minuterie —
   deux lectures, deux fonctions, sinon le total part en vrille. */
function lireMinutes(txt){
  const t = String(txt).trim().toLowerCase().replace(',','.');
  if (!t) return 0;
  let m;
  if ((m = t.match(/^(\d+)\s*[:h]\s*(\d{1,2})$/)))       return (+m[1])*60 + (+m[2]);
  if ((m = t.match(/^(\d+)\s*h$/)))                        return (+m[1])*60;
  if ((m = t.match(/^(\d+(?:\.\d+)?)\s*(?:min|m)?$/)))    return Math.round(parseFloat(m[1]));
  return 0;
}
function hhmm(m){ return Math.floor(m/60)+':'+String(m%60).padStart(2,'0'); }
function calculerTemps(){
  let tot = 0;
  $$('#tempsCorps .tps').forEach(n=> tot += lireMinutes(n.textContent));
  const rec = lireMinutes($('#tReconnu').textContent);
  $('#tTotal').textContent  = hhmm(tot);
  $('#tDePlus').textContent = hhmm(Math.max(0, tot-rec));
}

/* ═════════ présences / réglages ═════════ */
(function presences(){
  const noms = ['Alexis','Béatrice','Charlie','Dahlia','Émile','Farah','Gabriel','Hugo','Inès','Jade','Kevin','Léa','Malik','Noémie','Olivier','Priya','Quentin','Rosalie'];
  const h = $('#presencesHote');
  noms.forEach((nom,i)=>{
    const b = el('button','tuile',nom); b.type='button';
    b.style.cssText='font-family:var(--f-corps);font-weight:800;font-size:15px;padding:10px;text-align:center';
    const maj = ()=>{ const p = lire('pres:'+i, true); b.style.background = p ? '#DFFCA8' : '#FFD9D2'; b.textContent = (p?'✔ ':'✕ ')+nom; };
    b.addEventListener('click', ()=>{ ecrire('pres:'+i, !lire('pres:'+i,true)); maj(); });
    maj(); h.appendChild(b);
  });
})();
(function reglages(){
  const h = $('#reglagesHoraire');
  PERIODES.filter(p=>p[0]==='p').forEach(p=>{
    const r = el('div'); r.style.cssText='display:flex;gap:10px;align-items:center;margin-bottom:6px';
    r.innerHTML = '<b style="width:100px">Période '+p[1]+'</b><div contenteditable data-k="hor-'+p[1]+'" data-vide="'+p[2]+'" style="flex:1"></div>';
    h.appendChild(r);
  });
  brancherEditables(h);
})();

/* ═════════ départ ═════════ */
$('#btnImprimer').addEventListener('click', ()=> window.print());
$('#btnVider').addEventListener('click', ()=>{
  if (!confirm('Effacer toute la saisie du proto ? (rien d’autre n’est touché)')) return;
  Object.keys(localStorage).filter(k=>k.startsWith(P)).forEach(k=>localStorage.removeItem(k));
  location.reload();
});
brancherEditables();
calculerTemps();
poserMetier(lire('metier','eps'));
peindreCalendrier();
peindreMois();
peindreAnnee();
allerA(lire('ecran','e-accueil'));
