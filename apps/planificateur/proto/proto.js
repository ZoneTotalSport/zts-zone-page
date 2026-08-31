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

/* ═════════ LE CONTEXTE — ce qui fait tenir l'app ensemble ═════════
   Un cahier de consignation range tout par JOUR et par GROUPE. Ici, la même
   idée : `ctxDate` et `ctxGroupe` forment la clé sous laquelle se consigne
   tout ce qui appartient à une séance — présences, cotes, tests, blocs.
   Changer de jour ou de groupe change la page du cahier ; rien ne se mélange,
   rien ne se perd. `kctx()` est le seul endroit où cette règle est écrite. */
let ctxDate = null;      // 'AAAA-MM-JJ' — posé au démarrage
let ctxGroupe = 0;       // index dans la liste des groupes
function kctx(cle){ return 'j:'+ctxDate+':g'+ctxGroupe+':'+cle; }
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
/* ⚠ LA TABLE `ECRANS` ET SA BARRE ONT ÉTÉ RETIRÉES — IL Y AVAIT DEUX
   NAVIGATIONS, ET LA PREMIÈRE ÉTAIT EFFACÉE PAR LA SECONDE.
   Elle fabriquait seize boutons dans `#nav` ; `barreEnMenus()`, dans
   proto-fusion.js, fait `n.innerHTML=''` juste après et repose les CINQ portes
   de `MENUS`. Les seize boutons n'ont donc jamais été vus par personne.
   Pire : HUIT de leurs seize cibles n'existent plus (e-journee, e-jeux,
   e-presences, e-planb, e-noter, e-cours, e-semaine, e-evaluation) — c'était
   une carte du proto d'avant la refonte en cinq portes.
   `MENUS` est désormais la seule source de la navigation. */
function allerA(id){
  /* garde : un écran mémorisé qui n'existe plus (e-plus, retiré) laisserait la
     page entièrement vide. */
  if (!document.getElementById(id)) id = 'e-aujourdhui';
  if (id === 'e-bulletin') peindreBulletin();
  $$('.ecran').forEach(s=> s.classList.toggle('on', s.id===id));
  $$('#nav button').forEach(b=> b.setAttribute('aria-current', String(b.dataset.va===id)));
  window.scrollTo({top:0,behavior:'instant'});
  ecrire('ecran', id);
}
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
/* ⚠ CE QUE LES TROIS MÉTIERS CHANGENT VRAIMENT : LE NOMBRE, ET RIEN D'AUTRE.
   Joey l'a vu tout de suite — « ÉPS et les deux autres corps de métiers sont
   pareils ». C'est exact. `poserMetier` visait aussi `#tuile3`, `#tuile3aide` et
   `#badgeJeux`, trois éléments des anciennes tuiles d'accueil, remplacées par
   l'agenda : ces trois lignes ne touchaient plus rien depuis des semaines et
   entretenaient l'illusion que le bouton faisait quelque chose.
   Elles sont retirées. Le sélecteur reste — il dit à qui l'app s'adresse et
   affiche le compte de fiches du métier — mais le code ne prétend plus en faire
   davantage. Si les trois métiers doivent VRAIMENT différer (vocabulaire,
   écrans, gabarits), c'est une décision de contenu, pas un correctif. */
function poserMetier(m){
  const d = METIERS[m] || METIERS.eps;
  const pose = (sel,val)=>{ const n=$(sel); if(n) n.textContent = val; };
  pose('#metierCompte', d.badge+' fiches pour ce métier');
  $$('#metiers .metier').forEach(b=> b.setAttribute('aria-pressed', String(b.dataset.metier===m)));
  ecrire('metier', m);
  if (typeof peindreAgenda === 'function') peindreAgenda();
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
    /* ⚠ LA MINUTERIE RESTAIT VERTE APRÈS AVOIR SONNÉ. `peindreMinuterie()` est
       appelée AVANT ce bloc : quand le décompte touche zéro, `tourne` passe à
       false mais plus personne ne repeint — `arreterHorlogeSiVide()` coupe
       l'intervalle juste après. L'anneau lime restait allumé et le bouton
       affichait encore « ⏸ PAUSE » sur une minuterie arrêtée. Défaut ANTÉRIEUR
       à ce chantier, trouvé en poussant un décompte jusqu'au buzzer. */
    if (reste === 0){ m.tourne = false; verrou(id,false); peindreMinuterie(id); sonner(); }
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
/* ⚠ « MARQUER FAIT » A ÉTÉ RETIRÉ AVEC LE DOCK, et il était déjà mort :
   `dernierFini` recevait un identifiant de MINUTERIE ('seance-2026-08-29-3'),
   jamais un id de bloc — et les blocs n'existent plus depuis longtemps.
   `document.getElementById()` rendait donc toujours null, le bouton
   n'apparaissait que pour ne rien faire. */

/* ═════════ buzzer ═════════
   ⚠ IL NE VIT PLUS DANS UNE BARRE GLOBALE. Joey : le buzzer se règle là où on
   s'en sert — dans la minuterie du tiroir JEUX — et nulle part ailleurs. Les
   commandes sont donc désignées par CLASSE, pas par identifiant : plusieurs
   panneaux peuvent coexister sans que l'un vole les écouteurs de l'autre. */
let sonChoisi = lire('son','nba'), muet = lire('muet',false), volume = lire('vol',70);
function appliquerSon(){
  $$('.buzz-choix .mini').forEach(b=> b.setAttribute('aria-pressed', String(b.dataset.son===sonChoisi)));
  $$('.buzz-muet').forEach(b=>{ b.textContent = muet ? '🔇' : '🔊';
                                b.setAttribute('aria-pressed', String(muet)); });
  $$('.buzz-vol').forEach(n=> n.value = volume);
  $$('.buzz-vol-lab').forEach(n=> n.innerHTML = volume+'&nbsp;%');
  [$('#sonNba'),$('#sonArena')].forEach(a=>{ if (a) a.volume = muet ? 0 : volume/100; });
}
function sonner(){
  if (muet || sonChoisi==='mute') return;
  const a = sonChoisi==='arena' ? $('#sonArena') : $('#sonNba');
  try { a.currentTime = 0; a.play().catch(()=>{}); } catch(e){}
}
$$('.buzz-choix .mini').forEach(b=> b.addEventListener('click',()=>{ sonChoisi=b.dataset.son; ecrire('son',sonChoisi); appliquerSon(); }));
$$('.buzz-muet').forEach(b=> b.addEventListener('click', ()=>{ muet=!muet; ecrire('muet',muet); appliquerSon(); }));
$$('.buzz-vol').forEach(n=> n.addEventListener('input', e=>{ volume=+e.target.value; ecrire('vol',volume); appliquerSon(); }));
$$('.buzz-essai').forEach(b=> b.addEventListener('click', sonner));
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
ctxDate = lire('ctxDate', null) || (function(){ const d=new Date();
  const D=n=>String(n).padStart(2,'0');
  return d.getFullYear()+'-'+D(d.getMonth()+1)+'-'+D(d.getDate()); })();
ctxGroupe = lire('ctxGroupe', 0);
let seqBloc = lire('seqBloc', 0);
function nouvelId(){ seqBloc++; ecrire('seqBloc', seqBloc); return 'b'+seqBloc; }

/* ══ LES BLOCS ONT ÉTÉ SUPPRIMÉS ══
   Joey, 28 août : « je ne veux pas ça » — les boutons IMAGE / VIDÉO / PDF /
   JEU / OPTIONS posés sous chaque bloc. « Je veux seulement un glisse-dépose
   pour image, le reste éditable. »
   MA JOURNÉE est devenue une liste de lignes qu'on écrit et qu'on glisse
   (proto-simple.js), et les images s'y déposent. Le code des blocs est retiré
   plutôt que laissé dormant : ce qui n'existe pas ne peut pas réapparaître. */
function sauverBlocs(){}
function monterBlocs(){}
function remonterJournee(){
  if (typeof peindreJournee === 'function') peindreJournee();
}
function enrichirTousLesBlocs(){}

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
      else if (typeof jrLire === 'function'){
        const l = jrLire(); l.push({titre:j.n, desc:j.d, duree:String(j.t)});
        jrEcrire(l); if (typeof peindreJournee==='function') peindreJournee();
      }
      fermerTiroir(); allerA('e-accueil');   /* 'e-journee' n'existe plus */
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
const ROM = ['I','II','III','IV','V','VI'];
const iso = (y,m,d)=> y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');

/* ═════ L'ANNÉE SCOLAIRE SUIT L'HORLOGE ═════
   ⚠ Le calendrier semé plus bas est le VRAI calendrier CSSDHR 2025-2026. Mais
   un proto ouvert en août 2026 tombait sur une semaine SITUÉE APRÈS la fin de
   cette année-là : aucun jour-cycle nulle part, et toute la mécanique avait
   l'air morte alors qu'elle marchait.
   On décale donc les marques d'un nombre entier de SEMAINES — 364 jours par
   année — pour retomber sur l'année scolaire en cours. Les jours de la semaine
   sont préservés (un lundi reste un lundi) ; les dates glissent d'un ou deux
   jours.
   ⚠ CE N'EST DONC PAS LE VRAI CALENDRIER DE L'ANNÉE EN COURS, et il ne faut pas
   le laisser croire : c'est de la donnée de démonstration. L'écran CALENDRIER
   est là pour la corriger, et il le dit lui-même quand le décalage est actif. */
const SEED_AN = 2025;
function anneeScolaireCourante(){
  const d = new Date();
  return (d.getMonth() >= 7) ? d.getFullYear() : d.getFullYear()-1;   // août = rentrée
}
const AN_SCOLAIRE  = anneeScolaireCourante();
const DECALAGE_ANS = AN_SCOLAIRE - SEED_AN;
function decalerIso(k){
  if (!DECALAGE_ANS) return k;
  const [y,m,j] = k.split('-').map(Number);
  const d = new Date(y, m-1, j);
  d.setDate(d.getDate() + DECALAGE_ANS*364);      /* 52 semaines pile */
  return iso(d.getFullYear(), d.getMonth(), d.getDate());
}
const ANNEE_MOIS = [[AN_SCOLAIRE,7],[AN_SCOLAIRE,8],[AN_SCOLAIRE,9],[AN_SCOLAIRE,10],[AN_SCOLAIRE,11],
                    [AN_SCOLAIRE+1,0],[AN_SCOLAIRE+1,1],[AN_SCOLAIRE+1,2],[AN_SCOLAIRE+1,3],
                    [AN_SCOLAIRE+1,4],[AN_SCOLAIRE+1,5]];
const DEBUT = decalerIso('2025-08-25'), FIN = decalerIso('2026-06-30');

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
const SEED_DECALE = (()=>{ const o={};
  Object.keys(SEED).forEach(k=> o[decalerIso(k)] = SEED[k]); return o; })();
let marques = lire('cal', null) || {...SEED_DECALE};
let catActive = 'conge';
let cycles  = {};                        // iso → le libellé affiché
let cyclesI = {};                        // iso → l'index 0-based, la vérité

/* ═════ LE JOUR-CYCLE — un seul endroit décide de son nom ═════
   ⚠ `recalculerCycles()` écrivait `ROM[i % 6]` en dur. Ni la LONGUEUR du cycle
   ni le STYLE réglés dans RÉGLAGES n'arrivaient jusqu'ici : un prof en cycle de
   9 jours, ou qui nomme ses journées, réglait dans le vide.
   ⚠ Et `cycles` ne se remplissait qu'au premier affichage du CALENDRIER —
   avant d'y être allé, l'agenda n'avait aucun jour-cycle à montrer. On calcule
   maintenant au démarrage, et à chaque fois qu'un réglage bouge. */
function longueurCycle(){ return Math.max(2, Math.min(10, lire('cycLen',6))); }
function libelleCycle(i){
  const perso = lire('ed:cycnom-'+i, '');
  if (perso && String(perso).trim()) return String(perso).trim();
  const st = lire('cycStyle','romains');
  /* STYLES_CYCLE vit dans proto-fusion.js, chargé après : au tout premier
     appel il n'existe pas encore, on retombe sur les chiffres romains. */
  const table = (typeof STYLES_CYCLE!=='undefined' && STYLES_CYCLE[st]) ? STYLES_CYCLE[st].v : ROM;
  return table[i] || String(i+1);
}
function recalculerCycles(){
  cycles = {}; cyclesI = {}; let i = 0;
  const n = longueurCycle();
  ANNEE_MOIS.forEach(([y,m])=>{
    const nb = new Date(y, m+1, 0).getDate();
    for (let d=1; d<=nb; d++){
      const k = iso(y,m,d), jour = new Date(y,m,d).getDay();
      if (jour===0 || jour===6) continue;
      if (k < DEBUT || k > FIN) continue;
      if (HORS_ECOLE.has(marques[k])) continue;
      cyclesI[k] = i % n; cycles[k] = libelleCycle(i % n); i++;
    }
  });
  return i;
}
/* Ce qu'on écrit à côté d'une date : son jour-cycle, ou pourquoi il n'y en a pas. */
function jourCycleLisible(k){
  if (cycles[k]) return 'JOUR '+cycles[k];
  if (marques[k]) return String((CATS.find(x=>x[0]===marques[k])||['',''])[1]).toUpperCase();
  const j = dateDeIso(k).getDay();
  if (j===0 || j===6) return 'FIN DE SEMAINE';
  return '';
}
/* Recalculer ET repeindre partout où un jour-cycle se montre. */
function rafraichirCycles(){
  recalculerCycles();
  if (typeof peindreCtxBarre==='function') peindreCtxBarre();
  if (typeof peindreAgenda==='function')   peindreAgenda();
  if (typeof peindreCalendrier==='function' && $('#calGrille')) peindreCalendrier();
  /* ⚠ LE GARDE VISAIT `#moisHote`, QUI N'EXISTE PAS — la grille s'appelle
     `#moisGrille`. MON MOIS n'a donc JAMAIS été rafraîchi quand on changeait la
     longueur ou le style du cycle : on y lisait des chiffres périmés. Et MON
     ANNÉE n'était pas rafraîchie du tout. Piège n° 17, encore : un garde qui
     ne se déclenche jamais ressemble à un garde qui protège. */
  if (typeof peindreMois==='function'  && $('#moisGrille')) peindreMois();
  if (typeof peindreAnnee==='function' && $('#anneeHote'))  peindreAnnee();
  if (typeof peindreAujourdhui==='function') peindreAujourdhui();
}
/* Dire ce que vaut la donnée affichée : décalée = à corriger. */
(function avisCalendrier(){
  const t=$('#calAnnee'); if(t) t.textContent = AN_SCOLAIRE+' – '+(AN_SCOLAIRE+1);
  const a=$('#calAvis'); if(!a || !DECALAGE_ANS) return;
  a.hidden=false;
  a.innerHTML='<span class="emo">⚠️</span>Ces marques sont le calendrier CSSDHR <b>'
    +SEED_AN+' – '+(SEED_AN+1)+'</b> décalé de '+DECALAGE_ANS+' an(s) pour tomber sur '
    +'l’année en cours. Les jours de la semaine sont justes, <b>les dates ne le sont pas</b> : '
    +'c’est de la donnée de démonstration. Corrige-les ici — ce sont elles qui placent les jours-cycle.';
})();

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
    /* ⚠ LA CASE PORTE SA DATE. Sans ça, tout ce qui veut s'y greffer — les
       groupes du jour, depuis le 31 août — doit refaire à l'envers le calcul
       des cases vides du début de mois et des fins de semaine sautées. Un
       attribut vaut mieux qu'une arithmétique à reproduire. */
    c.dataset.iso = k;
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
  /* ⚠ Ce décompte suivait ROM en dur : il affichait six lignes romaines même
     dans un cycle de neuf jours nommés à la main. Il suit maintenant le
     réglage, comme tout le reste. */
  for (let r=0; r<longueurCycle(); r++){
    let n2 = 0;
    Object.entries(cyclesI).forEach(([k,v])=>{ if (v===r && k.startsWith(y+'-'+String(m+1).padStart(2,'0'))) n2++; });
    const l = el('div',null,'– Jour '+libelleCycle(r)+' = '+n2);
    l.style.cssText='border:2px solid var(--noir);border-radius:6px;background:#fff;color:var(--ink);padding:2px 8px;margin-bottom:4px;font-weight:800';
    cpt.appendChild(l);
  }
}
$('#moisPrec').addEventListener('click',()=>{ moisIdx=(moisIdx+ANNEE_MOIS.length-1)%ANNEE_MOIS.length; peindreMois(); });
$('#moisSuiv').addEventListener('click',()=>{ moisIdx=(moisIdx+1)%ANNEE_MOIS.length; peindreMois(); });

/* ═════════ ANNÉE ═════════ */
function peindreAnnee(){
  const h = $('#anneeHote'); h.innerHTML='';
  ANNEE_MOIS.forEach(([y,m])=>{
    const pan = el('div','pan');
    const cal = el('div','mini-cal annee-cal');
    const cap = el('div','caption');
    cap.style.cssText='font-family:var(--f-titre);letter-spacing:.5px;padding:4px;background:var(--noir);color:var(--jaune);text-align:center';
    cap.textContent = MOIS_NOMS[m]+' '+y;
    cal.appendChild(cap);

    const t = el('table');
    t.innerHTML = '<thead><tr><th>L</th><th>M</th><th>M</th><th>J</th><th>V</th>'
      + '<th class="an-th an-th--fl"></th>'
      + '<th class="an-th an-th--c">Compétence</th>'
      + '<th class="an-th an-th--m">Moyen d\u2019action</th>'
      + '<th class="an-th an-th--a">Activité</th></tr></thead>';
    const tb = el('tbody'); const n = new Date(y,m+1,0).getDate();
    let tr = el('tr'), col=0; const dec=(new Date(y,m,1).getDay()+6)%7;
    for(let i=0;i<Math.min(dec,5);i++){ tr.appendChild(el('td')); col++; }
    for (let d=1; d<=n; d++){
      const jour=new Date(y,m,d).getDay(); if(jour===0||jour===6) continue;
      if (col===5){ tb.appendChild(tr); tr=el('tr'); col=0; }
      const k = iso(y,m,d); const td = el('td');
      td.innerHTML='<span class="r"></span>'+d;
      td.querySelector('.r').textContent = cycles[k]||'';
      if (marques[k]) td.classList.add('c-'+marques[k]);
      tr.appendChild(td); col++;
    }
    while(col<5&&col>0){ tr.appendChild(el('td')); col++; }
    tb.appendChild(tr);

    /* ⚠ LES TROIS CHAMPS SONT DANS LA MÊME RANGÉE QUE LES CINQ JOURS.
       C'est ce que montre le gabarit papier « Ma planification annuelle » : une
       ligne = une semaine, ses jours à gauche, ce qu'on y enseigne à droite.
       C'est aussi la SEULE façon d'être aligné pour de bon. Les deux blocs ont
       d'abord été côte à côte — un tableau et une pile de grilles — et il a
       fallu mesurer l'un pour étirer l'autre : ça tenait sur ma machine et pas
       sur celle de Joey, parce qu'une mesure dépend du moment où on la prend
       (polices chargées ou non, cran de taille, largeur utile). Une rangée de
       tableau n'a pas ce problème : elle est alignée par construction, sans une
       ligne de JavaScript. */
    [...tb.children].forEach((ligne,i)=>{
      const kk = y+'-'+m+'-s'+(i+1);
      const fl = el('td','an-fl'); fl.textContent='➜'; ligne.appendChild(fl);
      [['c',''],['m','ch--ma'],['a','ch--ac']].forEach(([lettre,mod])=>{
        const td = el('td','an-ch');
        td.innerHTML='<div class="ch '+mod+'" contenteditable data-k="an-'+lettre+'-'+kk+'" data-vide="…"></div>';
        ligne.appendChild(td);
      });
    });

    t.appendChild(tb); cal.appendChild(t);
    pan.appendChild(cal); h.appendChild(pan);
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
/* La grille SEMAINE a été retirée : l'agenda de l'accueil est la MÊME grille
   période × jour. Ses colonnes « Gr: » et « # cours » faisaient doublon avec
   le contexte — la barre jaune dit déjà dans quel groupe on écrit, et
   l'en-tête de chaque jour porte son jour-cycle. Rien n'est perdu. */


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
/* ═════════ PRÉSENCES ═════════
   Porté de apps/planificateur/app.js — la fonction existait déjà là-bas et le
   proto ne la montrait pas. Modèle repris tel quel : statut attendu/present/
   parti/absent, heure d'arrivée, JOUR + heure de départ, « porté par » à
   l'arrivée, « parti avec » au départ avec garde hors-liste, humeur de fin de
   journée, message au parent, particularités.
   ⚠ Parti ou absent = photo ET nom en NOIR ET BLANC (proto.css). */
const LIENS = ['mère','père','grand-mère','grand-père','gardien(ne)','autre'];
const PARTICULARITES = {
  tsa:'🧩 TSA', tdah:'⚡ TDAH', allergie:'🥜 Allergie', asthme:'💨 Asthme',
  anxiete:'💧 Anxiété', diabete:'🩸 Diabète', dys:'🔤 Dys', langage:'💬 Langage',
};
const HUMEURS = [
  {k:'belle',     emoji:'🌟', label:'Belle journée'},
  {k:'ordinaire', emoji:'🙂', label:'Ordinaire'},
  {k:'pepin',     emoji:'⚠️', label:'Pépin'},
];
const ENFANTS = [
  {p:'Alexis',  n:'Tremblay', part:['tdah'],            aut:[['Marie Tremblay','mère'],['Luc Tremblay','père']]},
  {p:'Béatrice',n:'Roy',      part:[],                  aut:[['Sophie Roy','mère'],['Jeanne Roy','grand-mère']]},
  {p:'Charlie', n:'Gagnon',   part:['tsa','langage'],   aut:[['Éric Gagnon','père']]},
  {p:'Dahlia',  n:'Nadeau',   part:['allergie'],        aut:[['Nadia Nadeau','mère'],['Paul Côté','gardien(ne)']]},
  {p:'Émile',   n:'Bouchard', part:[],                  aut:[['Julie Bouchard','mère']]},
  {p:'Farah',   n:'Haddad',   part:['asthme'],          aut:[['Amir Haddad','père'],['Leila Haddad','mère']]},
  {p:'Gabriel', n:'Fortin',   part:[],                  aut:[['Manon Fortin','mère']]},
  {p:'Hugo',    n:'Lavoie',   part:['anxiete'],         aut:[['Denis Lavoie','père'],['Rita Lavoie','grand-mère']]},
  {p:'Inès',    n:'Belanger', part:[],                  aut:[['Carla Belanger','mère']]},
  {p:'Jade',    n:'Pelletier',part:['diabete'],         aut:[['Yves Pelletier','père'],['Anne Simard','gardien(ne)']]},
  {p:'Kevin',   n:'Ouellet',  part:[],                  aut:[['Sylvie Ouellet','mère']]},
  {p:'Léa',     n:'Morin',    part:['dys'],             aut:[['Guy Morin','père']]},
  {p:'Malik',   n:'Diallo',   part:[],                  aut:[['Aminata Diallo','mère'],['Ousmane Diallo','père']]},
  {p:'Noémie',  n:'Caron',    part:[],                  aut:[['Chantal Caron','mère']]},
  {p:'Olivier', n:'Dubé',     part:['tdah','anxiete'],  aut:[['Steve Dubé','père'],['Lise Dubé','grand-mère']]},
  {p:'Priya',   n:'Sharma',   part:[],                  aut:[['Ravi Sharma','père']]},
  {p:'Quentin', n:'Girard',   part:[],                  aut:[['Nathalie Girard','mère']]},
  {p:'Rosalie', n:'Beaulieu', part:['allergie','tsa'],  aut:[['Marc Beaulieu','père'],['Ève Beaulieu','mère']]},
];
/* ÉVALUATION et BULLETIN lisent la même liste — une seule source de vérité. */
const ELEVES = ENFANTS.map(e=>e.p);

const TEINTES = ['#00C2E8','#FFA200','#A3FF00','#FF0061','#8B5CF6','#25D8C0'];
/* Avatar : la vraie photo si Joey en a déposé une, sinon une pastille à
   initiale. Il FAUT une image dans les deux cas — c'est elle qui se décolore. */
function photoDe(i){
  const perso = lire('pr-photo:'+i, null);
  if (perso) return perso;
  const e = ENFANTS[i], t = TEINTES[i % TEINTES.length];
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
    + '<rect width="64" height="64" fill="'+t+'"/>'
    + '<circle cx="32" cy="25" r="12" fill="rgba(255,255,255,.85)"/>'
    + '<path d="M8 64c0-14 11-22 24-22s24 8 24 22z" fill="rgba(255,255,255,.85)"/>'
    /* ⚠ CETTE PASTILLE NE PEUT PAS PORTER LES POLICES DE JOEY, et ce n'est pas
       un oubli : le SVG part en `data:` dans un <img>, donc dans un document
       ISOLÉ, qui n'a accès à aucune @font-face de la page. Y nommer Bangers ne
       ferait que la remplacer par ce que le système a sous la main.
       Embarquer le .ttf en base64 dans chaque pastille pèserait ~100 ko PAR
       ÉLÈVE. On laisse donc le générique — deux initiales dans une pastille de
       couleur, ce n'est pas du texte qu'on lit. Une vraie photo la remplace de
       toute façon dès qu'il y en a une. */
    + '<text x="32" y="30" font-family="sans-serif" font-size="15" font-weight="bold"'
    + ' text-anchor="middle" fill="'+t+'">'+e.p[0]+e.n[0]+'</text></svg>';
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(svg);
}
function presDe(i){
  return lire(kctx('pres2:'+i), {statut:'attendu', heureArrivee:'', dateDepart:'', heureDepart:'',
                           arriveAvec:'', partiAvec:'', lienParti:'', horsListe:false,
                           humeur:'', note:'', messageParent:''});
}
function poserPres(i,p){ ecrire(kctx('pres2:'+i), p); peindrePresences(); }
const D2 = n => String(n).padStart(2,'0');
function maintenantHM(){ const d=new Date(); return D2(d.getHours())+':'+D2(d.getMinutes()); }
function aujourdhuiISO(){ const d=new Date(); return d.getFullYear()+'-'+D2(d.getMonth()+1)+'-'+D2(d.getDate()); }
const JOURS_FR=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const MOIS_FR=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
function jourLisible(iso){
  if(!iso) return '';
  const [y,m,j]=iso.split('-').map(Number); const d=new Date(y,m-1,j);
  return JOURS_FR[d.getDay()]+' '+j+' '+MOIS_FR[m-1];
}

function peindrePresences(){
  const h=$('#prGrille'); if(!h) return;
  h.innerHTML='';
  const cpt={attendu:0,present:0,parti:0,absent:0};
  ENFANTS.forEach((e,i)=>{
    const p=presDe(i); cpt[p.statut]++;
    const c=el('div','pr-carte pr-carte--'+p.statut);
    const tap=el('button','pr-tap'); tap.type='button';
    tap.title = p.statut==='attendu' ? 'Marquer présent'
              : p.statut==='present' ? 'Noter le départ'
              : p.statut==='parti'   ? 'Revoir le départ' : 'Remettre en attente';
    const img=el('img','pr-photo'); img.src=photoDe(i); img.alt='';
    tap.appendChild(img);
    tap.appendChild(el('div','pr-nom', e.p));
    tap.appendChild(el('div','pr-sub', e.n));
    if (e.part.length){
      const pp=el('div','pr-partic');
      e.part.forEach(k=>{ const x=el('span',null,(PARTICULARITES[k]||k).split(' ')[0]); x.title=PARTICULARITES[k]||k; pp.appendChild(x); });
      tap.appendChild(pp);
    }
    if (p.statut==='present' && p.heureArrivee)
      tap.appendChild(el('div','pr-heure arrivee','↓ '+p.heureArrivee));
    if (p.statut==='parti'){
      tap.appendChild(el('div','pr-heure depart','↑ '+(p.heureDepart||'—')));
      if (p.dateDepart) tap.appendChild(el('div','pr-sub', jourLisible(p.dateDepart)));
      if (p.partiAvec)  tap.appendChild(el('div','pr-sub','avec '+p.partiAvec));
      const hu=HUMEURS.find(x=>x.k===p.humeur);
      if (hu) tap.appendChild(el('div','pr-sub', hu.emoji+' '+hu.label));
    }
    const badge=el('span','pr-badge pr-badge--'+p.statut);
    badge.textContent = p.statut==='present'?'✓':p.statut==='parti'?'↑':p.statut==='absent'?'✗':'';
    if (p.statut!=='attendu') c.appendChild(badge);
    if (p.statut==='parti' && p.horsListe){
      const f=el('span','pr-flag','⚠'); f.title='Départ hors liste des personnes autorisées'; c.appendChild(f);
    } else if (p.statut==='parti' && p.messageParent){
      const f=el('span','pr-flag','!'); f.title='Message à transmettre : '+p.messageParent; c.appendChild(f);
    }
    tap.addEventListener('click', ()=> tapPresence(i));
    /* appui long = absent, comme dans l'app */
    let minuteur=null;
    const partir=()=>{ minuteur=setTimeout(()=>{ minuteur=null; marquerAbsent(i); }, 550); };
    const finir =()=>{ if(minuteur){ clearTimeout(minuteur); minuteur=null; } };
    tap.addEventListener('mousedown',partir); tap.addEventListener('touchstart',partir,{passive:true});
    ['mouseup','mouseleave','touchend','touchcancel'].forEach(ev=>tap.addEventListener(ev,finir));
    c.appendChild(tap);

    if (p.statut==='present'){
      const b=el('button','pr-porte'); b.type='button';
      b.textContent = '👋 ' + (p.arriveAvec ? ('porté par '+p.arriveAvec) : 'porté par ?');
      b.addEventListener('click', e2=>{ e2.stopPropagation();
        const k=LIENS.indexOf(p.arriveAvec);
        const q={...p, arriveAvec: LIENS[(k+1) % LIENS.length]};
        poserPres(i,q);
      });
      c.appendChild(b);
    }
    if (p.statut==='attendu'){
      const b=el('button','pr-absent-btn','✗ ABSENT'); b.type='button';
      b.addEventListener('click', e2=>{ e2.stopPropagation(); marquerAbsent(i); });
      c.appendChild(b);
    }
    h.appendChild(c);
  });
  const r=$('#prResume'); r.innerHTML='';
  r.appendChild(el('span','present', cpt.present+' présent'+(cpt.present>1?'s':'')));
  r.appendChild(el('span',null,     cpt.attendu+' attendu'+(cpt.attendu>1?'s':'')));
  r.appendChild(el('span','parti',  cpt.parti+' parti'+(cpt.parti>1?'s':'')));
  if (cpt.absent) r.appendChild(el('span','absent', cpt.absent+' absent'+(cpt.absent>1?'s':'')));
  const d=$('#prDate'); if(d) d.textContent = jourLisible(aujourdhuiISO());
}
function marquerAbsent(i){
  const p=presDe(i);
  poserPres(i, p.statut==='absent' ? {...p,statut:'attendu'} : {...p, statut:'absent', heureArrivee:'', heureDepart:''});
}
function tapPresence(i){
  const p=presDe(i);
  if (p.statut==='attendu') poserPres(i,{...p,statut:'present',heureArrivee:maintenantHM()});
  else if (p.statut==='absent') poserPres(i,{...p,statut:'attendu'});
  else ouvrirDepart(i);
}

/* ── modale ── */
function ouvrirModale(titre){
  $('#modaleTitre').textContent=titre;
  $('#modale').hidden=false;
  return $('#modaleCorps');
}
function fermerModale(){ $('#modale').hidden=true; $('#modaleCorps').innerHTML=''; }
document.addEventListener('click', e=>{ if(e.target.closest('[data-fermer]')) fermerModale(); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape' && !$('#modale').hidden) fermerModale(); });

function ouvrirDepart(i){
  const e=ENFANTS[i], p=presDe(i);
  let choisie = p.partiAvec || '';
  let lien    = p.lienParti || '';
  let humeur  = p.humeur || '';
  const corps = ouvrirModale('Départ de '+e.p);
  corps.innerHTML = `
    <div class="m-tete">
      <img class="pr-photo" alt="" src="${photoDe(i)}">
      <div><div class="pr-nom">${e.p} ${e.n}</div>
        <div class="pr-sub">Arrivée : ${p.heureArrivee||'—'}${p.arriveAvec?' · porté par '+p.arriveAvec:''}</div></div>
    </div>
    <div class="m-champ"><label class="m-lab" for="dpJour">Jour du départ</label>
      <input class="m-saisie" type="date" id="dpJour" value="${p.dateDepart||aujourdhuiISO()}"></div>
    <div class="m-champ"><label class="m-lab" for="dpHeure">Heure du départ</label>
      <input class="m-saisie" type="time" id="dpHeure" value="${p.heureDepart||maintenantHM()}"></div>
    <div class="m-champ"><span class="m-lab">Parti avec — personnes autorisées</span>
      <div class="m-personnes" id="dpPersonnes"></div>
      <label class="m-lab" for="dpAutre">Ou une autre personne</label>
      <input class="m-saisie" id="dpAutre" placeholder="Nom de la personne" value="">
    </div>
    <div class="m-avert" id="dpAvert" hidden>
      ⚠ Cette personne n'est PAS dans la liste des personnes autorisées.
      <label><input type="checkbox" id="dpConfirme"> Je confirme ce départ hors liste</label>
    </div>
    <div class="m-champ"><span class="m-lab">📓 Comment s'est passée la journée ?</span>
      <div class="m-humeurs" id="dpHumeurs"></div></div>
    <div class="m-champ"><label class="m-lab" for="dpNote">Note de la journée</label>
      <input class="m-saisie" id="dpNote" value="${(p.note||'').replace(/"/g,'&quot;')}"></div>
    <div class="m-champ"><label class="m-lab" for="dpMsg">Message à transmettre au parent</label>
      <input class="m-saisie" id="dpMsg" value="${(p.messageParent||'').replace(/"/g,'&quot;')}"></div>
    <div class="m-pied">
      <button type="button" class="m-valider" id="dpOk">✔ CONFIRMER LE DÉPART</button>
      <button type="button" class="mini" data-fermer>ANNULER</button>
      ${p.statut==='parti'?'<button type="button" class="mini mini--rose" id="dpRetour">↩ IL EST ENCORE LÀ</button>':''}
    </div>`;

  const hp=$('#dpPersonnes');
  e.aut.forEach(([nom,l])=>{
    const b=el('button','m-personne'); b.type='button';
    b.innerHTML='<span></span> <span class="lien"></span>';
    b.children[0].textContent=nom; b.children[1].textContent='('+l+')';
    b.setAttribute('aria-pressed', String(choisie===nom));
    b.addEventListener('click',()=>{
      choisie = choisie===nom ? '' : nom; lien = choisie ? l : '';
      $('#dpAutre').value='';
      [...hp.children].forEach(x=>x.setAttribute('aria-pressed','false'));
      if (choisie) b.setAttribute('aria-pressed','true');
      majAvert();
    });
    hp.appendChild(b);
  });
  const hh=$('#dpHumeurs');
  HUMEURS.forEach(x=>{
    const b=el('button','m-humeur'); b.type='button';
    b.innerHTML='<span></span><span></span>';
    b.children[0].textContent=x.emoji; b.children[1].textContent=x.label;
    b.setAttribute('aria-pressed', String(humeur===x.k));
    b.addEventListener('click',()=>{ humeur = humeur===x.k ? '' : x.k;
      [...hh.children].forEach(y=>y.setAttribute('aria-pressed','false'));
      if(humeur) b.setAttribute('aria-pressed','true'); });
    hh.appendChild(b);
  });
  function nomAutre(){ return $('#dpAutre').value.trim(); }
  function horsListe(){
    const a=nomAutre();
    if (!a) return false;
    return !e.aut.some(([n])=> n.toLowerCase()===a.toLowerCase());
  }
  function majAvert(){
    const hl=horsListe();
    $('#dpAvert').hidden = !hl;
    const conf=$('#dpConfirme');
    $('#dpOk').disabled = hl && !(conf && conf.checked);
  }
  $('#dpAutre').addEventListener('input', ()=>{
    if (nomAutre()){ choisie=''; lien=''; [...hp.children].forEach(x=>x.setAttribute('aria-pressed','false')); }
    majAvert();
  });
  corps.addEventListener('change', ev=>{ if(ev.target.id==='dpConfirme') majAvert(); });
  majAvert();

  $('#dpOk').addEventListener('click', ()=>{
    const a=nomAutre();
    poserPres(i, {...p, statut:'parti',
      dateDepart:$('#dpJour').value, heureDepart:$('#dpHeure').value,
      partiAvec: a || choisie, lienParti: a ? 'autre' : lien,
      horsListe: horsListe(), humeur,
      note:$('#dpNote').value.trim(), messageParent:$('#dpMsg').value.trim()});
    fermerModale();
  });
  const retour=$('#dpRetour');
  if (retour) retour.addEventListener('click', ()=>{
    poserPres(i, {...p, statut:'present', heureDepart:'', dateDepart:'', partiAvec:'', horsListe:false});
    fermerModale();
  });
}

/* ── rapport ── */
function rapportPresences(){
  const l=[], gr=lire('ed:pr-gr','5A')||'5A';
  l.push('PRÉSENCES — groupe '+gr);
  l.push(jourLisible(aujourdhuiISO()));
  l.push('');
  const par={present:[],parti:[],absent:[],attendu:[]};
  ENFANTS.forEach((e,i)=>{
    const p=presDe(i); const nom=e.p+' '+e.n;
    if (p.statut==='present') par.present.push('  • '+nom+' — arrivé à '+(p.heureArrivee||'?')+(p.arriveAvec?' (porté par '+p.arriveAvec+')':''));
    else if (p.statut==='parti'){
      let t='  • '+nom+' — parti '+jourLisible(p.dateDepart)+' à '+(p.heureDepart||'?');
      if (p.partiAvec) t+=' avec '+p.partiAvec+(p.horsListe?' ⚠ HORS LISTE':'');
      const hu=HUMEURS.find(x=>x.k===p.humeur); if(hu) t+=' — '+hu.label;
      if (p.messageParent) t+='\n      ! message au parent : '+p.messageParent;
      par.parti.push(t);
    }
    else if (p.statut==='absent') par.absent.push('  • '+nom);
    else par.attendu.push('  • '+nom);
  });
  const bloc=(titre,arr)=>{ if(!arr.length) return; l.push(titre+' ('+arr.length+')'); l.push(...arr); l.push(''); };
  bloc('ABSENTS', par.absent);
  bloc('PAS ENCORE ARRIVÉS', par.attendu);
  bloc('PRÉSENTS', par.present);
  bloc('DÉJÀ PARTIS', par.parti);
  return l.join('\n');
}
const _env=$('#prEnvoyer'); if (_env) _env.addEventListener('click', async ()=>{
  const txt=rapportPresences();
  const zone=$('#prRapport'); zone.hidden=false; zone.textContent=txt;
  const b=$('#prEnvoyer');
  try { await navigator.clipboard.writeText(txt); b.textContent='📋 COPIÉ — colle-le où tu veux'; }
  catch(e){ b.textContent='📋 COPIE REFUSÉE — sélectionne le texte'; }
  setTimeout(()=>b.textContent='📤 ENVOYER LE RAPPORT', 2600);
});
const _raz=$('#prRaz'); if (_raz) _raz.addEventListener('click', ()=>{
  if(!confirm('Remettre tout le groupe en « attendu » ?')) return;
  ENFANTS.forEach((e,i)=>{ try{ localStorage.removeItem(P+kctx('pres2:'+i)); }catch(err){} });
  peindrePresences();
});

/* ⚠ LE SECOND ÉDITEUR D'HORAIRE A ÉTÉ RETIRÉ. Il remplissait
   `#reglagesHoraire` depuis la table figée `PERIODES` et écrivait sous
   `ed:hor-1…6` — des clés que RIEN ne relit. Deux « horaires » se suivaient
   dans les RÉGLAGES : celui-ci, sans effet, et « 🕐 Mon horaire »
   (proto-horaire.js), qui gouverne vraiment les lignes de MA SEMAINE.
   Le prof pouvait donc corriger ses heures dans le mauvais des deux.
   Piège n° 17 du journal — « un réglage qui existe n'agit pas forcément ». */


/* ═════════ ÉVALUATION — les 3 compétences du PFEQ en ÉPS ═════════ */
const COTES = ['A','B','C','D','E'];
const VALEUR = {A:5,B:4,C:3,D:2,E:1};
const COMPS = [
  {id:'c1', nom:'C1 · Agir'},
  {id:'c2', nom:'C2 · Interagir'},
  {id:'c3', nom:'C3 · Sain et actif'},
];
function coteDe(i,c){ return lire(kctx('ev:'+i+':'+c), null); }
(function evaluation(){
  const h = $('#evalCorps'); if(!h) return;
  ELEVES.forEach((nom,i)=>{
    const tr = el('tr');
    const td0 = el('td','nom',nom); tr.appendChild(td0);
    COMPS.forEach(cp=>{
      const td = el('td');
      const grp = el('div','cotes');
      COTES.forEach(c=>{
        const b = el('button','cote',c); b.type='button'; b.dataset.c=c;
        b.setAttribute('aria-pressed', String(coteDe(i,cp.id)===c));
        b.title = nom+' — '+cp.nom+' — cote '+c;
        b.addEventListener('click', ()=>{
          const actuel = coteDe(i,cp.id);
          const neuf = actuel===c ? null : c;          // reclic = on enlève
          if (neuf) ecrire(kctx('ev:'+i+':'+cp.id), neuf);
          else { try{ localStorage.removeItem(P+kctx('ev:'+i+':'+cp.id)); }catch(e){} }
          [...grp.children].forEach(x=> x.setAttribute('aria-pressed', String(x.dataset.c===neuf)));
          compterEval();
        });
        grp.appendChild(b);
      });
      td.appendChild(grp); tr.appendChild(td);
    });
    const tdo = el('td');
    tdo.innerHTML = '<div contenteditable data-k="'+kctx('ev-obs-'+i)+'" data-vide="…" style="font-size:13px"></div>';
    tr.appendChild(tdo);
    h.appendChild(tr);
  });
  brancherEditables(h);
  $('#evVider').addEventListener('click', ()=>{
    if (!confirm('Effacer toutes les cotes du groupe ?')) return;
    ELEVES.forEach((n,i)=> COMPS.forEach(cp=>{ try{ localStorage.removeItem(P+kctx('ev:'+i+':'+cp.id)); }catch(e){} }));
    $$('#evalCorps .cote').forEach(b=> b.setAttribute('aria-pressed','false'));
    compterEval();
  });
})();
function compterEval(){
  if (!$('#evPosees')) return;
  let n=0, somme=0;
  const total = ELEVES.length * COMPS.length;
  ELEVES.forEach((nom,i)=> COMPS.forEach(cp=>{
    const c = coteDe(i,cp.id); if(c){ n++; somme += VALEUR[c]; }
  }));
  $('#evPosees').textContent = n;
  $('#evTotal').textContent  = total;
  if (!n){ $('#evMoyenne').textContent = '—'; return; }
  const moy = somme/n;
  const lettre = COTES[Math.max(0, Math.min(4, 5 - Math.round(moy)))];
  $('#evMoyenne').textContent = lettre + ' (' + moy.toFixed(1) + '/5)';
}

/* ═════════ BULLETIN — se construit depuis l'ÉVALUATION ═════════ */
const MOTS = {
  A:"Dépasse les attentes. Constant, engagé, entraîne le groupe.",
  B:"Répond aux attentes avec aisance. Progrès nets cette étape.",
  C:"Répond aux attentes. Continue le travail amorcé.",
  D:"Répond partiellement aux attentes. Un soutien ciblé aiderait.",
  E:"Ne répond pas encore aux attentes. Rencontre à prévoir.",
};
function peindreBulletin(){
  const h = $('#bullHote'); h.innerHTML='';
  ELEVES.forEach((nom,i)=>{
    const carte = el('div','bull-carte');
    carte.appendChild(el('h3',null,nom));
    let somme=0, n=0, pire=null;
    COMPS.forEach(cp=>{
      const c = coteDe(i,cp.id);
      const li = el('div','bull-ligne');
      const v = c ? VALEUR[c] : 0;
      if (c){ somme+=v; n++; if(!pire || v<VALEUR[pire]) pire=c; }
      li.innerHTML = '<span class="lab"></span>'
        + '<span class="res"></span>'
        + '<span class="jauge"><i></i></span>';
      li.querySelector('.lab').textContent = cp.nom;
      const res = li.querySelector('.res');
      res.textContent = c || '—';
      /* classList.add('') lève — une cote C (valeur 3) n'a pas de classe. */
      const teinte = v>=4 ? 'bon' : v<=2 ? 'faible' : '';
      if (c && teinte) res.classList.add(teinte);
      li.querySelector('.jauge i').style.width = (v/5*100)+'%';
      carte.appendChild(li);
    });
    const com = el('div','bull-com');
    const suggere = n ? MOTS[pire] : 'Aucune cote posée pour cette étape.';
    com.innerHTML = '<span class="lab">COMMENTAIRE</span>'
      + '<div contenteditable data-k="bu-com-'+i+'" data-vide="…"></div>';
    carte.appendChild(com);
    h.appendChild(carte);
    const zone = com.querySelector('[contenteditable]');
    zone.dataset.vide = suggere;                     // proposition, pas imposition
    const bt = el('button','mini mini--lime','↩ REPRENDRE LA PROPOSITION'); bt.type='button';
    bt.style.marginTop='6px';
    bt.addEventListener('click', ()=>{ zone.textContent = suggere; zone.dispatchEvent(new Event('input')); });
    carte.appendChild(bt);
  });
  brancherEditables(h);
}
$('#buImprimer').addEventListener('click', ()=> window.print());

/* ═════════ PARTAGE ═════════ */
const PARTAGEABLE = [
  ['journee','📋 Ma journée'], ['cours','🏀 Fiche de cours'], ['semaine','🗓️ La semaine'],
  ['mois','📅 Le mois'], ['annee','📚 L’année'], ['calendrier','📆 Le calendrier'],
  ['evaluation','📝 L’évaluation'], ['bulletin','🎓 Les bulletins'],
];
let droit = lire('pa-droit','lire');
let graine = lire('pa-graine', 1);
(function partage(){
  const h = $('#partQuoi');
  PARTAGEABLE.forEach(([id,lab])=>{
    const l = el('label');
    l.innerHTML = '<input type="checkbox" data-k="pa-'+id+'"><span></span>';
    l.querySelector('span').textContent = lab;
    h.appendChild(l);
    l.querySelector('input').addEventListener('change', majPartage);
  });
  brancherEditables(h);
  $$('#partDroits .mini').forEach(b=> b.addEventListener('click', ()=>{
    droit = b.dataset.droit; ecrire('pa-droit', droit);
    $$('#partDroits .mini').forEach(x=> x.setAttribute('aria-pressed', String(x.dataset.droit===droit)));
    majPartage();
  }));
  $$('#partDroits .mini').forEach(x=> x.setAttribute('aria-pressed', String(x.dataset.droit===droit)));
  $('#partNouveau').addEventListener('click', ()=>{ graine++; ecrire('pa-graine',graine); majPartage(); });
  $('#partCopier').addEventListener('click', async ()=>{
    const t = $('#partLien').textContent;
    try { await navigator.clipboard.writeText(t); $('#partCopier').textContent='COPIÉ ✓';
          setTimeout(()=>$('#partCopier').textContent='COPIER LE LIEN', 1400); }
    catch(e){ $('#partCopier').textContent='COPIE REFUSÉE'; }
  });
  majPartage();
})();
/* Code déterministe : pas de Math.random, pour que le code ne change pas
   à chaque repeinture — seul le bouton NOUVEAU CODE le fait bouger. */
function codeDepuis(n){
  const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // ni I ni O ni 0 ni 1
  /* Les bits BAS d'un LCG alternent presque sans entropie : `x % 32` sortait
     « TAAAA2AA ». On prend les bits hauts. */
  let x = (n*2654435761 + 0x9E3779B9) >>> 0, out='';
  for (let i=0;i<8;i++){
    x = (Math.imul(x,1103515245) + 12345) >>> 0;
    out += A[(x >>> 17) % A.length];
  }
  return out;
}
function majPartage(){
  /* On lit `checked` dans le DOM, PAS localStorage : le listener qui persiste
     la case est celui de brancherEditables, posé APRÈS celui-ci. Lire le
     stockage donnait le lien d'AVANT le clic — un cran de retard. */
  const choisis = PARTAGEABLE.filter(([id])=>{
    const n = $('#partQuoi input[data-k="pa-'+id+'"]');
    return n && n.checked;
  });
  const code = codeDepuis(graine);
  $('#partCode').textContent = code.slice(0,4)+' '+code.slice(4);
  const q = choisis.map(([id])=>id).join(',');
  $('#partLien').textContent = choisis.length
    ? 'https://planificateur.zonetotalsport.ca/p/'+code.toLowerCase()+'?d='+droit+'&q='+q
    : '— coche au moins une chose à partager —';
  peindreQr(code);
  const j = $('#partJournal'); j.innerHTML='';
  if (!choisis.length){ j.appendChild(el('li',null,'Rien de partagé pour l’instant.')); return; }
  const motDroit = {lire:'peut regarder', copier:'peut copier', modifier:'peut modifier'}[droit];
  choisis.forEach(([id,lab])=>{
    j.appendChild(el('li',null, lab.replace(/^\S+\s/,'') + ' — le collègue ' + motDroit + '.'));
  });
}
/* Aperçu de code QR : motif DÉTERMINISTE dérivé du code, avec les trois
   marqueurs d'angle. Ce n'est PAS un vrai QR lisible — c'est la place qu'il
   prendra. La génération réelle se fera à l'implémentation. */
function peindreQr(code){
  const N=21, hote=$('#partQrHote');
  let x=0; for (let i=0;i<code.length;i++) x = ((x*31) + code.charCodeAt(i)) >>> 0;
  let d='';
  const marqueur=(cx,cy)=>{
    for(let a=0;a<7;a++) for(let b=0;b<7;b++){
      const bord = a===0||a===6||b===0||b===6;
      const coeur = a>=2&&a<=4&&b>=2&&b<=4;
      if (bord||coeur) d += 'M'+(cx+a)+' '+(cy+b)+'h1v1h-1z';
    }
  };
  for (let a=0;a<N;a++) for (let b=0;b<N;b++){
    const dansCoin = (a<8&&b<8)||(a>N-9&&b<8)||(a<8&&b>N-9);
    if (dansCoin) continue;
    x = (x*1103515245 + 12345) >>> 0;
    if ((x>>>16) & 1) d += 'M'+a+' '+b+'h1v1h-1z';
  }
  marqueur(0,0); marqueur(N-7,0); marqueur(0,N-7);
  hote.innerHTML = '<svg class="part-qr" viewBox="0 0 '+N+' '+N+'" role="img" '
    + 'aria-label="Aperçu de code QR — non lisible, maquette"><path d="'+d+'" fill="#08131E"/></svg>'
    + '<p style="text-align:center;font-size:11px;margin:6px 0 0;color:var(--sur-fond-doux)">'
    + 'aperçu — le vrai QR viendra à l’implémentation</p>';
}

/* ═════════ départ ═════════ */
/* La tuile IMPRIMER a quitté l'accueil (devenu l'agenda) : elle vit maintenant
   dans le menu OUTILS. On ne s'accroche que si elle est là. */
const _imp = $('#btnImprimer'); if (_imp) _imp.addEventListener('click', ()=> window.print());
/* ⚠ IL A QUITTÉ LE BANDEAU. Un bouton qui efface tout n'a rien à faire à côté
   de l'horloge, visible sur chaque écran : il vit dans RÉGLAGES › MES DONNÉES.
   ⚠ ET IL DEMANDE DEUX FOIS. Le premier geste arme, le second efface — un
   `confirm()` seul se clique par réflexe. Dix secondes plus tard, il se
   désarme tout seul. */
(function viderEnDeuxTemps(){
  const b = $('#btnVider'); if (!b) return;
  const etat = $('#viderEtat');
  let arme = null;
  const desarmer = ()=>{ clearTimeout(arme); arme = null;
    b.textContent = 'VIDER MA SAISIE';
    if (etat) etat.textContent = ''; };
  b.addEventListener('click', ()=>{
    if (!arme){
      b.textContent = '⚠ CONFIRMER : TOUT EFFACER';
      if (etat) etat.textContent = 'Touche une deuxième fois pour effacer. Sinon, ça s’annule seul.';
      arme = setTimeout(desarmer, 10000);
      return;
    }
    desarmer();
    Object.keys(localStorage).filter(k=>k.startsWith(P)).forEach(k=>localStorage.removeItem(k));
    location.reload();
  });
})();
brancherEditables();
calculerTemps();
peindrePresences();
compterEval();
peindreBulletin();
poserMetier(lire('metier','eps'));
peindreCalendrier();
peindreMois();
peindreAnnee();
allerA(lire('ecran','e-aujourdhui'));
