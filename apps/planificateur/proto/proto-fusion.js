/* ==========================================================================
   FUSION — tout ce que le Planificateur et le Carnet ÉPS savaient faire.
   Contrat de référence : CONTRAT-FONCTIONNEL-FUSION-2026-08.md, tableau §3.

   Joey, 27 août : « toutes les fonctionnalités des 2 autres apps, je ne veux
   pas les perdre » ET « qu'un enfant de 10 ans comprenne ».

   La façon de tenir les deux :
   1. Une tuile = UNE INTENTION en un mot (ce qu'on veut faire), jamais un nom
      de fonction technique.
   2. Les options d'un objet vivent SUR l'objet : toucher un bloc ouvre ses
      options. Rien n'est enterré dans un menu générique.
   3. Chaque écran s'ouvre sur une phrase qui dit quoi faire, à l'impératif.
   4. Tout est pré-rempli d'un exemple : on comprend sans lire.

   Les données chiffrées ne sont PAS inventées : le référentiel PFEQ vient de
   apps/planificateur/app.js, la table Léger-Boucher et les barèmes du bundle
   du Carnet (apps/evaluation/assets/index-BqzDoR3c.js).
   ========================================================================== */
'use strict';

/* ═════════ la nav apprend les nouveaux écrans ═════════ */
(function nav2(){
  const n=$('#nav'); if(!n) return;
  [['e-tests','🏃 TESTS'],['e-groupes','👥 MES GROUPES'],
   ['e-messages','💬 MESSAGES'],['e-donnees','💾 MES DONNÉES']].forEach(([id,lab])=>{
    if (n.querySelector('[data-va="'+id+'"]')) return;
    const b=el('button',null,lab); b.type='button'; b.dataset.va=id;
    b.addEventListener('click',()=>allerA(id));
    n.insertBefore(b, n.querySelector('[data-va="e-reglages"]'));
  });
})();

/* ═════════ 1. BLOCS — les options vivent SUR le bloc ═════════ */
const BLOC_TYPES = {
  activite:  {lab:'Activité',   emo:'🎯', coul:'#FF6B00'},
  garde:     {lab:'Garde',      emo:'🛡️', coul:'#4CAF50'},
  sortie:    {lab:'Sortie',     emo:'🚌', coul:'#2196F3'},
  repas:     {lab:'Repas',      emo:'🍽️', coul:'#FFC107'},
  recre:     {lab:'Récréation', emo:'🏃', coul:'#8BC34A'},
  transition:{lab:'Transition', emo:'➡️', coul:'#9E9E9E'},
};
const BLOC_COULEURS = ['#FF6B00','#00C2E8','#A3FF00','#FF0061','#8B5CF6','#FFC107','#9E9E9E'];
const BLOC_POLICES = [
  ['default','Standard',''],
  ['titre',"Gros titre","'LuckiestGuy',sans-serif"],
  ['punch','Punch',"'Bangers',sans-serif"],
];
let pressePapierBloc = null;
let blocActif = null;

function optionsBloc(id){ return lire('opt:'+id, {type:'activite', coul:'', police:'default'}); }
function appliquerOptions(b){
  const o = optionsBloc(b.id), t = BLOC_TYPES[o.type] || BLOC_TYPES.activite;
  let barre = b.querySelector('.bloc-barre');
  if (!barre){ barre = el('div','bloc-barre'); b.insertBefore(barre, b.firstChild); }
  barre.style.background = o.coul || t.coul;
  let et = b.querySelector('.bloc-type');
  if (!et){ et = el('span','bloc-type'); b.querySelector('.bloc-tete').insertBefore(et, b.querySelector('.chk')); }
  et.textContent = t.emo+' '+t.lab;
  const p = BLOC_POLICES.find(x=>x[0]===o.police);
  b.querySelector('.bloc-titre').style.fontFamily = (p && p[2]) || '';
}

function enrichirBloc(b){
  if (b.dataset.enrichi) return; b.dataset.enrichi='1';
  const id = b.id;

  /* ── panneau d'options, replié ── */
  const pan = el('div','bloc-options');
  pan.innerHTML = `
    <span class="titre">C'EST QUOI ?</span>
    <span class="grp" data-types></span>
    <span class="titre">DE QUELLE COULEUR ?</span>
    <span class="grp" data-couls></span>
    <span class="titre">ET AVEC ÇA</span>
    <span class="grp">
      <button type="button" class="mini" data-up>↑ MONTER</button>
      <button type="button" class="mini" data-down>↓ DESCENDRE</button>
      <button type="button" class="mini" data-copier>⧉ COPIER</button>
      <button type="button" class="mini mini--lime" data-coller>📋 COLLER APRÈS</button>
      <button type="button" class="mini" data-police>🅰 POLICE</button>
    </span>`;
  const ht = pan.querySelector('[data-types]');
  Object.entries(BLOC_TYPES).forEach(([k,t])=>{
    const x = el('button','mini', t.emo+' '+t.lab); x.type='button'; x.dataset.t=k;
    x.addEventListener('click',()=>{
      const o=optionsBloc(id); o.type=k; ecrire('opt:'+id,o); appliquerOptions(b);
      [...ht.children].forEach(y=>y.setAttribute('aria-pressed',String(y.dataset.t===k)));
    });
    ht.appendChild(x);
  });
  const hc = pan.querySelector('[data-couls]');
  BLOC_COULEURS.forEach(c=>{
    const x = el('button','pastille-coul'); x.type='button'; x.style.background=c; x.dataset.c=c;
    x.title='Couleur '+c;
    x.addEventListener('click',()=>{
      const o=optionsBloc(id); o.coul = (o.coul===c) ? '' : c; ecrire('opt:'+id,o); appliquerOptions(b);
      [...hc.children].forEach(y=>y.setAttribute('aria-pressed',String(y.dataset.c===o.coul)));
    });
    hc.appendChild(x);
  });
  b.appendChild(pan);

  /* ── bouton qui ouvre les options, posé dans le pied du bloc ── */
  const ouvre = el('button','mini','⚙ OPTIONS'); ouvre.type='button';
  ouvre.setAttribute('aria-expanded','false');
  ouvre.addEventListener('click', ()=>{
    const on = pan.classList.toggle('on');
    ouvre.setAttribute('aria-expanded', String(on));
    ouvre.textContent = on ? '⚙ FERMER LES OPTIONS' : '⚙ OPTIONS';
    if (on){
      const o=optionsBloc(id);
      [...ht.children].forEach(y=>y.setAttribute('aria-pressed',String(y.dataset.t===o.type)));
      [...hc.children].forEach(y=>y.setAttribute('aria-pressed',String(y.dataset.c===o.coul)));
    }
  });
  b.querySelector('.medias').appendChild(ouvre);

  /* ── actions du panneau ── */
  pan.addEventListener('click', e=>{
    const t=e.target.closest('button'); if(!t) return;
    const parent=b.parentNode;
    if (t.hasAttribute('data-up')   && b.previousElementSibling){ parent.insertBefore(b,b.previousElementSibling); sauverBlocs(); }
    else if (t.hasAttribute('data-down') && b.nextElementSibling){ parent.insertBefore(b.nextElementSibling,b); sauverBlocs(); }
    else if (t.hasAttribute('data-copier')){
      pressePapierBloc = {titre:b.querySelector('.bloc-titre').textContent,
                          desc:b.querySelector('.bloc-desc').textContent,
                          duree:(minuteries.get(id)||{}).reste||0, opt:optionsBloc(id)};
      t.textContent='⧉ COPIÉ ✓'; setTimeout(()=>t.textContent='⧉ COPIER',1400);
    }
    else if (t.hasAttribute('data-coller')){
      if (!pressePapierBloc){ alert("Rien à coller : touche d'abord COPIER sur un bloc."); return; }
      const neuf = faireBloc({id:nouvelId(), titre:pressePapierBloc.titre, desc:pressePapierBloc.desc, duree:pressePapierBloc.duree});
      ecrire('min:'+neuf.id, pressePapierBloc.duree);
      ecrire('opt:'+neuf.id, {...pressePapierBloc.opt});
      parent.insertBefore(neuf, b.nextSibling);
      enrichirBloc(neuf); appliquerOptions(neuf); sauverBlocs();
    }
    else if (t.hasAttribute('data-police')){
      const o=optionsBloc(id);
      const i=BLOC_POLICES.findIndex(x=>x[0]===o.police);
      o.police = BLOC_POLICES[(i+1)%BLOC_POLICES.length][0];
      ecrire('opt:'+id,o); appliquerOptions(b);
      t.textContent='🅰 '+BLOC_POLICES.find(x=>x[0]===o.police)[1].toUpperCase();
    }
  });

  /* ── zone de dépôt : le bloc accepte les fichiers ET le texte lâchés ── */
  b.addEventListener('dragover', e=>{
    if (!e.dataTransfer) return;
    const t=[...(e.dataTransfer.types||[])];
    if (t.includes('Files')){ e.preventDefault(); e.stopPropagation(); b.classList.add('bloc--depot'); }
  }, true);
  b.addEventListener('dragleave', ()=> b.classList.remove('bloc--depot'), true);
  b.addEventListener('drop', e=>{
    if (!e.dataTransfer) return;
    const f=[...(e.dataTransfer.files||[])];
    if (f.length){
      e.preventDefault(); e.stopPropagation(); b.classList.remove('bloc--depot');
      f.forEach(x=>avalerFichier(b,x));
      return;
    }
    const txt=e.dataTransfer.getData('text/plain')||'';
    if (txt && !document.getElementById(txt)){          // pas un id de bloc → c'est du texte
      e.preventDefault(); e.stopPropagation(); b.classList.remove('bloc--depot');
      const d=b.querySelector('.bloc-desc');
      d.textContent = (d.textContent?d.textContent+'\n':'')+txt;
      d.dispatchEvent(new Event('input'));
    }
  }, true);
  b.addEventListener('click', ()=>{ blocActif = b; });

  appliquerOptions(b);
}

/* Réduction d'image : au-delà de 300 Ko, 1400 px et JPEG 0,82 — la règle de
   app-v2.js:619. Plafond 2,5 Mo pour le reste, comme l'app. */
const PLAFOND = 2.5*1024*1024;
function avalerFichier(bloc, f){
  const type = f.type.startsWith('image/') ? 'image'
             : f.type.startsWith('video/') ? 'video'
             : f.type.startsWith('audio/') ? 'audio' : 'pdf';
  if (type==='image' && f.size > 300*1024){
    reduireImage(f, 1400, .82).then(data => ajouterMedia(bloc,{type,nom:f.name,data}))
      .catch(()=> ajouterMedia(bloc,{type,nom:f.name,data:null}));
    return;
  }
  if (f.size > PLAFOND){
    alert('« '+f.name+' » pèse '+Math.round(f.size/1024/1024*10)/10+' Mo.\nLe maximum est 2,5 Mo — seul le nom sera gardé.');
    ajouterMedia(bloc,{type,nom:f.name,data:null}); return;
  }
  const r=new FileReader();
  r.onload=()=>ajouterMedia(bloc,{type,nom:f.name,data:r.result});
  r.readAsDataURL(f);
}
function reduireImage(f, max, q){
  return new Promise((ok,ko)=>{
    const img=new Image(), u=URL.createObjectURL(f);
    img.onload=()=>{
      const e=Math.min(1, max/Math.max(img.width,img.height));
      const c=document.createElement('canvas');
      c.width=Math.round(img.width*e); c.height=Math.round(img.height*e);
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg',q));
    };
    img.onerror=()=>{ URL.revokeObjectURL(u); ko(); };
    img.src=u;
  });
}
/* Coller (Ctrl+V) dans le dernier bloc touché — comme app-v2.js:1290 */
document.addEventListener('paste', e=>{
  if (!blocActif || !e.clipboardData) return;
  if (document.activeElement && document.activeElement.isContentEditable) return;
  const f=[...(e.clipboardData.files||[])];
  if (f.length){ e.preventDefault(); f.forEach(x=>avalerFichier(blocActif,x)); }
});

function enrichirTousLesBlocs(){ $$('.bloc').forEach(enrichirBloc); }
enrichirTousLesBlocs();
['blocsJournee','blocsCours'].forEach(id=>{
  const h=document.getElementById(id); if(!h) return;
  new MutationObserver(()=>enrichirTousLesBlocs()).observe(h,{childList:true});
});

/* ── Live et TBI, posés dans MA JOURNÉE ── */
(function liveEtTbi(){
  const hote=$('#e-journee .pan'); if(!hote) return;
  const barre=el('div'); barre.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px';
  const live=el('button','mini mini--rose','▶ DÉMARRER LA SÉANCE'); live.type='button';
  const etat=el('span'); etat.style.cssText='font-family:var(--f-punch);letter-spacing:1px;align-self:center';
  let debut=lire('live',null);
  let tic=null;
  function peindre(){
    if(!debut){ live.textContent='▶ DÉMARRER LA SÉANCE'; etat.textContent=''; return; }
    live.textContent='■ ARRÊTER LA SÉANCE';
    const s=Math.floor((Date.now()-debut)/1000);
    etat.textContent='🔴 EN COURS DEPUIS '+Math.floor(s/60)+' MIN '+String(s%60).padStart(2,'0');
  }
  live.addEventListener('click',()=>{
    if (debut){ debut=null; clearInterval(tic); tic=null; }
    else { debut=Date.now(); if(!tic) tic=setInterval(peindre,1000); }
    ecrire('live',debut); peindre();
  });
  if (debut && !tic) tic=setInterval(peindre,1000);
  const tbi=el('button','mini','📺 MODE TABLEAU BLANC'); tbi.type='button';
  const majTbi=()=>{ const on=lire('tbi',false); document.body.classList.toggle('tbi',on);
    tbi.setAttribute('aria-pressed',String(on)); tbi.textContent = on?'📺 QUITTER LE TABLEAU BLANC':'📺 MODE TABLEAU BLANC'; };
  tbi.addEventListener('click',()=>{ ecrire('tbi',!lire('tbi',false)); majTbi(); });
  majTbi();
  barre.appendChild(live); barre.appendChild(etat); barre.appendChild(tbi);
  hote.insertBefore(barre, hote.querySelector('.blocs'));
  peindre();
})();

/* ═════════ 2. ÉVALUATION — PFEQ complet et 4 échelles ═════════ */
/* Référentiel repris de apps/planificateur/app.js (27 · 22 · 18 = 67 critères).
   L'audit du Carnet annonçait 27/18/17 : c'est l'autre app, les deux diffèrent. */
const CRITERES = {
  agir:["Exécution d'actions motrices","Application de principes liés à l'exécution","Efficacité des actions motrices","Planification de sa démarche","Évaluation de sa démarche","Équilibre et coordination","Locomotion (courir, sauter, ramper)","Manipulation d'objets","Respect des règles de sécurité","Lancer (précision, force, trajectoire)","Attraper (réception, amortissement)","Frapper (pied, main, raquette, bâton)","Dribbler (ballon, rondelle)","Sauter (hauteur, longueur)","Rouler (roulade avant, arrière)","Grimper et suspension","Esquiver et feinter","Posture et alignement","Rythme et tempo","Enchaînement de mouvements","Précision du geste technique","Puissance et force","Souplesse et flexibilité","Endurance cardiovasculaire","Vitesse de réaction et d'exécution","Agilité et changements de direction","Latéralité (dominant / non-dominant)"],
  interagir:["Coopération avec les partenaires","Opposition face aux adversaires","Communication motrice","Synchronisation des actions","Respect des règles du jeu","Esprit sportif","Ajustement au partenaire","Ajustement à l'adversaire","Application de principes d'action","Rôles offensifs","Rôles défensifs","Occupation de l'espace de jeu","Passe et réception en mouvement","Démarquage","Feinte et diversion","Lecture du jeu","Prise de décision rapide","Leadership dans l'équipe","Gestion des conflits","Encouragement des pairs","Acceptation de la défaite","Célébration respectueuse"],
  sante:["Condition physique","Habitudes de vie saines","Hygiène et propreté","Gestion du stress","Régularité de la pratique","Échauffement adéquat","Retour au calme","Hydratation","Alimentation avant l'effort","Sommeil et récupération","Sécurité personnelle","Sécurité des autres","Persévérance à l'effort","Connaissance de ses limites","Autonomie dans la pratique","Choix d'activités variées","Plaisir de bouger","Engagement hors du cours"],
};
const COMPS_META = {agir:{lab:'🏃 AGIR',cls:'c1'}, interagir:{lab:'🤝 INTERAGIR',cls:'c2'}, sante:{lab:'❤️ SANTÉ',cls:'c3'}};
const MAX_CRITERES = 5;   // contrainte dure du Carnet
/* Barèmes extraits du bundle : A/5/++ = 100, puis −20 par cran. */
const ECHELLES = {
  couleurs:{lab:'🎨 Couleurs', v:[['🟢','Excellent',100],['🔵','Très bien',80],['🟡','Bien',60],['🟠','À travailler',40],['🔴','Difficile',20]]},
  lettres: {lab:'🔤 Lettres',  v:[['A','',100],['B','',80],['C','',60],['D','',40],['E','',20]]},
  chiffres:{lab:'🔢 Chiffres', v:[['5','',100],['4','',80],['3','',60],['2','',40],['1','',20]]},
  symboles:{lab:'➕ Symboles', v:[['++','',100],['+','',80],['+/-','',60],['-','',40],['--','',20]]},
};
let echelle = lire('ev-echelle','lettres');

function critsChoisis(){ return lire('ev-crits', ['agir|0','interagir|0','sante|0']); }
function peindreCriteres(){
  const hote=$('#evCriteres'); if(!hote) return;
  const choisis=new Set(critsChoisis());
  hote.innerHTML='';
  Object.entries(CRITERES).forEach(([k,liste])=>{
    const col=el('div','crit-col '+COMPS_META[k].cls);
    col.appendChild(el('h3',null,COMPS_META[k].lab+' ('+liste.length+')'));
    const box=el('div','crit-liste');
    liste.forEach((txt,i)=>{
      const cle=k+'|'+i;
      const l=el('label');
      const c=document.createElement('input'); c.type='checkbox'; c.checked=choisis.has(cle);
      if (!c.checked && choisis.size>=MAX_CRITERES){ l.classList.add('crit-plein'); c.disabled=true; }
      c.addEventListener('change',()=>{
        const s=new Set(critsChoisis());
        if (c.checked){ if(s.size>=MAX_CRITERES){ c.checked=false; return; } s.add(cle); } else s.delete(cle);
        ecrire('ev-crits',[...s]); peindreCriteres(); peindreGrilleCrit();
      });
      l.appendChild(c); l.appendChild(el('span',null,txt));
      box.appendChild(l);
    });
    col.appendChild(box); hote.appendChild(col);
  });
  const cpt=$('#evCompte');
  if (cpt) cpt.textContent = choisis.size+' / '+MAX_CRITERES+' choisis';
}
function libelleCrit(cle){
  const [k,i]=cle.split('|'); return (CRITERES[k]||[])[+i] || cle;
}
function coteCrit(i,cle){ return lire('evc:'+i+':'+cle, null); }
function peindreGrilleCrit(){
  const hote=$('#evGrille'); if(!hote) return;
  const crits=critsChoisis();
  const ech=ECHELLES[echelle];
  hote.innerHTML='';
  if (!crits.length){ hote.appendChild(el('p',null,'Choisis au moins un critère ci-dessus.')); return; }
  const t=el('table','eval-tbl');
  const th=el('tr'); th.appendChild(Object.assign(el('th',null,'Élève'),{style:'width:22%'}));
  crits.forEach(c=>{ const x=el('th',null,libelleCrit(c)); th.appendChild(x); });
  const tb=el('tbody'); tb.appendChild(th);
  ELEVES.forEach((nom,i)=>{
    const tr=el('tr'); tr.appendChild(el('td','nom',nom));
    crits.forEach(cle=>{
      const td=el('td'); const grp=el('div','cotes');
      ech.v.forEach(([sym,lab,val])=>{
        const b=el('button','ech-case',sym); b.type='button';
        b.title=nom+' — '+libelleCrit(cle)+(lab?' — '+lab:'')+' ('+val+'/100)';
        b.setAttribute('aria-pressed', String(coteCrit(i,cle)===val));
        if (coteCrit(i,cle)===val) b.style.background = teinteVal(val);
        b.addEventListener('click',()=>{
          const actuel=coteCrit(i,cle);
          if (actuel===val){ try{localStorage.removeItem(P+'evc:'+i+':'+cle);}catch(e){} }
          else ecrire('evc:'+i+':'+cle,val);
          peindreGrilleCrit();
        });
        grp.appendChild(b);
      });
      td.appendChild(grp); tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
  t.appendChild(tb); hote.appendChild(t);
}
function teinteVal(v){ return v>=100?'#8CE05F':v>=80?'#B9F09A':v>=60?'#FFF07A':v>=40?'#FFC98A':'#FF9C8F'; }

(function monterEvaluationPlus(){
  const ecran=$('#e-evaluation'); if(!ecran) return;
  const pan=el('div','pan');
  pan.innerHTML=`
    <h2>Évaluer par critères précis <span class="crit-compte" id="evCompte"></span></h2>
    <div class="aide-un-mot" style="margin-bottom:12px"><span class="emo">✋</span>
      Coche au plus <b>5 critères</b> — au-delà, la grille devient illisible en classe.
      C'est la même limite que dans le Carnet.</div>
    <div class="crit-cols" id="evCriteres"></div>
    <h2 style="margin-top:16px">Avec quelle échelle ?</h2>
    <div class="ev-modes" id="evEchelles"></div>
    <div id="evGrille" style="overflow-x:auto"></div>`;
  ecran.appendChild(pan);
  const he=$('#evEchelles');
  Object.entries(ECHELLES).forEach(([k,e])=>{
    const b=el('button','ech-btn',e.lab); b.type='button';
    b.setAttribute('aria-pressed',String(k===echelle));
    b.addEventListener('click',()=>{ echelle=k; ecrire('ev-echelle',k);
      $$('#evEchelles .ech-btn').forEach(x=>x.setAttribute('aria-pressed','false'));
      b.setAttribute('aria-pressed','true'); peindreGrilleCrit(); });
    he.appendChild(b);
  });
  peindreCriteres(); peindreGrilleCrit();
})();

/* ═════════ 3. TESTS — chrono, laps, Léger-Boucher ═════════ */
/* Table extraite du bundle du Carnet : 22 paliers (0 à 21). */
const LEGER=[{n:0,nav:7,v:8,t:9},{n:1,nav:8,v:8.5,t:8.471},{n:2,nav:8,v:9,t:8},{n:3,nav:8,v:9.5,t:7.579},{n:4,nav:8,v:10,t:7.2},{n:5,nav:9,v:10.5,t:6.857},{n:6,nav:9,v:11,t:6.545},{n:7,nav:10,v:11.5,t:6.261},{n:8,nav:10,v:12,t:6},{n:9,nav:10,v:12.5,t:5.76},{n:10,nav:11,v:13,t:5.538},{n:11,nav:11,v:13.5,t:5.333},{n:12,nav:11,v:14,t:5.143},{n:13,nav:12,v:14.5,t:4.966},{n:14,nav:12,v:15,t:4.8},{n:15,nav:13,v:15.5,t:4.645},{n:16,nav:13,v:16,t:4.5},{n:17,nav:13,v:16.5,t:4.364},{n:18,nav:13,v:17,t:4.235},{n:19,nav:14,v:17.5,t:4.114},{n:20,nav:14,v:18,t:4},{n:21,nav:15,v:18.5,t:3.892}];
function etatLeger(sec){
  let t=0,d=0;
  for (const p of LEGER){
    for (let i=1;i<=p.nav;i++){
      if (t+p.t > sec) return {palier:p.n, navette:i, distance:d, vitesse:p.v};
      t+=p.t; d+=20;
    }
  }
  return {palier:21, navette:16, distance:5060, vitesse:18.5};
}
const cs = n => Math.floor(n/600)+':'+String(Math.floor(n/10)%60).padStart(2,'0')+','+(n%10);

(function tests(){
  if (!$('#chLect')) return;
  /* ── chronomètre — un seul intervalle, même garde que les minuteries ── */
  let dep=0, fige=0, tic=null;
  const lect=$('#chLect'), go=$('#chGo');
  const dixiemes = ()=> fige + (dep ? Math.floor((Date.now()-dep)/100) : 0);
  function peindre(){ lect.textContent = cs(dixiemes()); }
  function demarrer(){ if(tic) return; tic=setInterval(peindre,100); }
  go.addEventListener('click',()=>{
    if (dep){ fige=dixiemes(); dep=0; clearInterval(tic); tic=null; go.textContent='▶ REPARTIR';
              go.classList.remove('gros-bouton--stop'); }
    else { dep=Date.now(); demarrer(); go.textContent='⏸ ARRÊTER'; go.classList.add('gros-bouton--stop'); }
    peindre();
  });
  $('#chRaz').addEventListener('click',()=>{
    dep=0; fige=0; if(tic){clearInterval(tic);tic=null;}
    go.textContent='▶ PARTIR'; go.classList.remove('gros-bouton--stop');
    $('#chLaps').innerHTML=''; peindre();
  });
  $('#chTour').addEventListener('click',()=>{
    const n=$('#chLaps').children.length+1;
    $('#chLaps').appendChild(el('li',null,'Tour '+n+' · '+cs(dixiemes())));
  });
  peindre();

  /* ── Léger-Boucher ── */
  let lDep=0, lTic=null;
  const resultats = ()=> lire('leger', {});
  function secondes(){ return lDep ? (Date.now()-lDep)/1000 : 0; }
  function peindreLeger(){
    const e=etatLeger(secondes());
    $('#lgPalier').textContent=e.palier; $('#lgNavette').textContent=e.navette;
    $('#lgDist').textContent=e.distance+' m'; $('#lgVit').textContent=String(e.vitesse).replace('.',',');
    const s=Math.floor(secondes());
    $('#lgTemps').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
  }
  $('#lgGo').addEventListener('click',()=>{
    if (lDep){ lDep=0; clearInterval(lTic); lTic=null; $('#lgGo').textContent='▶ PARTIR LE TEST';
               $('#lgGo').classList.remove('gros-bouton--stop'); }
    else { lDep=Date.now(); if(!lTic) lTic=setInterval(peindreLeger,200);
           $('#lgGo').textContent='■ ARRÊTER LE TEST'; $('#lgGo').classList.add('gros-bouton--stop'); }
    peindreLeger();
  });
  $('#lgRaz').addEventListener('click',()=>{
    if(!confirm('Effacer les résultats du test ?')) return;
    lDep=0; if(lTic){clearInterval(lTic);lTic=null;}
    ecrire('leger',{}); $('#lgGo').textContent='▶ PARTIR LE TEST';
    $('#lgGo').classList.remove('gros-bouton--stop'); peindreLeger(); peindreCorpsLeger();
  });
  function peindreCorpsLeger(){
    const h=$('#lgCorps'); h.innerHTML=''; const r=resultats();
    ELEVES.forEach((nom,i)=>{
      const tr=el('tr'); tr.appendChild(el('td','nom',nom));
      const d=r[i];
      ['palier','navette','distance','vitesse'].forEach(k=>{
        const v=d ? (k==='distance'? d[k]+' m' : k==='vitesse' ? String(d[k]).replace('.',',') : d[k]) : '—';
        tr.appendChild(el('td',null,String(v)));
      });
      const td=el('td');
      const b=el('button','mini', d?'↺':'⏹ IL ARRÊTE'); b.type='button';
      b.title = d ? 'Effacer le résultat de '+nom : nom+' vient de s’arrêter';
      b.addEventListener('click',()=>{
        const q=resultats();
        if (q[i]) delete q[i]; else q[i]=etatLeger(secondes());
        ecrire('leger',q); peindreCorpsLeger();
      });
      td.appendChild(b); tr.appendChild(td);
      h.appendChild(tr);
    });
  }
  peindreLeger(); peindreCorpsLeger();
})();

/* ═════════ 4. MES GROUPES ═════════ */
function groupes(){ return lire('groupes', [{nom:'5A',arch:false},{nom:'5B',arch:false},{nom:'6A',arch:false}]); }
function groupeActif(){ return lire('groupeActif', 0); }
(function mesGroupes(){
  if (!$('#grpListe')) return;
  let voirArchives=false;
  function peindre(){
    const h=$('#grpListe'); h.innerHTML='';
    groupes().forEach((g,i)=>{
      if (g.arch && !voirArchives) return;
      const p=el('div','grp-puce'+(g.arch?' archive':''));
      p.setAttribute('aria-current', String(i===groupeActif()));
      const nom=el('span',null,g.nom);
      nom.style.cursor='pointer';
      nom.addEventListener('click',()=>{ ecrire('groupeActif',i); peindre(); peindreJournal(); peindreHistorique(); });
      p.appendChild(nom);
      const ren=el('button',null,'✎'); ren.type='button'; ren.title='Renommer';
      ren.addEventListener('click',()=>{ const n=prompt('Nouveau nom du groupe :',g.nom); if(!n) return;
        const l=groupes(); l[i].nom=n.trim(); ecrire('groupes',l); peindre(); });
      const arc=el('button',null,g.arch?'↩':'📦'); arc.type='button'; arc.title=g.arch?'Remettre en service':'Ranger sans effacer';
      arc.addEventListener('click',()=>{ const l=groupes(); l[i].arch=!l[i].arch; ecrire('groupes',l); peindre(); });
      p.appendChild(ren); p.appendChild(arc);
      h.appendChild(p);
    });
  }
  $('#grpAdd').addEventListener('click',()=>{
    const n=prompt('Nom du nouveau groupe :','6B'); if(!n) return;
    const l=groupes(); l.push({nom:n.trim(),arch:false}); ecrire('groupes',l); peindre();
  });
  $('#grpArchives').addEventListener('click',()=>{
    voirArchives=!voirArchives;
    $('#grpArchives').setAttribute('aria-pressed',String(voirArchives));
    $('#grpArchives').textContent = voirArchives?'📦 CACHER LES RANGÉS':'📦 VOIR LES RANGÉS';
    peindre();
  });
  peindre();

  /* journal de bord, par groupe */
  window.peindreJournal=function(){
    const h=$('#jbListe'); if(!h) return; h.innerHTML='';
    const l=lire('journal:'+groupeActif(), []);
    if (!l.length){ h.appendChild(el('p',null,'Rien de noté pour ce groupe.')); return; }
    l.slice().reverse().forEach((e,idx)=>{
      const d=el('div','journal-entree');
      d.appendChild(el('div','quand', e.quand));
      d.appendChild(el('div',null, e.txt));
      const x=el('button','mini mini--rose','✕'); x.type='button'; x.style.marginTop='6px';
      x.addEventListener('click',()=>{ const q=lire('journal:'+groupeActif(),[]);
        q.splice(l.length-1-idx,1); ecrire('journal:'+groupeActif(),q); peindreJournal(); });
      d.appendChild(x); h.appendChild(d);
    });
  };
  $('#jbAdd').addEventListener('click',()=>{
    const t=$('#jbTexte').value.trim(); if(!t) return;
    const l=lire('journal:'+groupeActif(),[]);
    l.push({quand:jourLisible(aujourdhuiISO())+' · '+maintenantHM(), txt:t});
    ecrire('journal:'+groupeActif(),l); $('#jbTexte').value=''; peindreJournal();
  });
  peindreJournal();

  /* historique : construit à partir de ce que l'app sait déjà */
  window.peindreHistorique=function(){
    const h=$('#histListe'); if(!h) return; h.innerHTML='';
    const lignes=[];
    $$('#blocsJournee .bloc').forEach(b=>{
      const t=b.querySelector('.bloc-titre').textContent.trim();
      if (t) lignes.push([jourLisible(aujourdhuiISO()), (b.classList.contains('fait')?'✔ ':'· ')+t]);
    });
    Object.keys(lire('leger',{})).length && lignes.push([jourLisible(aujourdhuiISO()),'🏃 Test Léger-Boucher — '+Object.keys(lire('leger',{})).length+' résultats']);
    const parti=ENFANTS.filter((e,i)=>presDe(i).statut==='parti').length;
    if (parti) lignes.push([jourLisible(aujourdhuiISO()), '✅ Présences — '+parti+' départ(s) notés']);
    if (!lignes.length){ h.appendChild(el('p',null,'Rien encore. L’historique se remplit tout seul.')); return; }
    lignes.forEach(([q,t])=>{ const d=el('div','hist-ligne');
      d.appendChild(el('b',null,q)); d.appendChild(el('span',null,t)); h.appendChild(d); });
  };
  peindreHistorique();

  /* gabarits : recopier une semaine */
  $('#gabGo').addEventListener('click',()=>{
    const de=$('#gabDe').value, vers=$('#gabVers').value;
    const r=$('#gabResultat');
    if (!de || !vers){ r.innerHTML='<div class="m-avert" style="display:block">Choisis les deux semaines.</div>'; return; }
    const cases=$$('#semaineHote .case [contenteditable]').filter(n=>n.textContent.trim()).length;
    r.innerHTML='<div class="aide-un-mot" style="margin:0"><span class="emo">✅</span>'
      + 'La semaine du <b>'+jourLisible(de)+'</b> serait recopiée vers le <b>'+jourLisible(vers)+'</b> — '
      + cases+' case(s) remplie(s). <b>Rien n’est écrasé dans le proto</b> : la vraie copie se fera à l’implémentation.</div>';
  });
})();

/* ═════════ 5. MESSAGES et validation de semaine ═════════ */
(function messages(){
  if (!$('#msgFil')) return;
  function fil(){ return lire('msgs', [{qui:'Coordo',txt:'Bonjour ! N’oublie pas de valider ta semaine avant vendredi.'}]); }
  function peindre(){
    const h=$('#msgFil'); h.innerHTML='';
    fil().forEach(m=>{
      const d=el('div','msg'+(m.qui==='Moi'?' moi':''));
      d.appendChild(el('span','qui',m.qui));
      d.appendChild(el('span',null,m.txt));
      h.appendChild(d);
    });
    h.scrollTop=h.scrollHeight;
  }
  $('#msgGo').addEventListener('click',()=>{
    const t=$('#msgTexte').value.trim(); if(!t) return;
    const l=fil(); l.push({qui:'Moi',txt:t}); ecrire('msgs',l); $('#msgTexte').value=''; peindre();
  });
  $('#msgTexte').addEventListener('keydown',e=>{ if(e.key==='Enter') $('#msgGo').click(); });
  const majVal=()=>{
    const v=lire('semaineValidee',null);
    $('#valEtat').textContent = v ? '✅ Validée le '+v+' — le coordo a été prévenu.' : '';
    $('#valSemaine').disabled = !!v;
  };
  $('#valSemaine').addEventListener('click',()=>{
    ecrire('semaineValidee', jourLisible(aujourdhuiISO())+' à '+maintenantHM());
    const l=fil(); l.push({qui:'Moi',txt:'✅ Ma semaine est prête.'}); ecrire('msgs',l);
    peindre(); majVal();
  });
  peindre(); majVal();
})();

/* ═════════ 6. MES DONNÉES ═════════ */
function toutLeProto(){
  const o={};
  Object.keys(localStorage).filter(k=>k.startsWith(P)).forEach(k=>{ o[k.slice(P.length)]=localStorage.getItem(k); });
  return o;
}
function telecharger(nom, contenu, type){
  const b=new Blob([contenu],{type:type||'application/json'});
  const u=URL.createObjectURL(b), a=document.createElement('a');
  a.href=u; a.download=nom; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(u); a.remove(); }, 400);
}
function journalDon(txt){
  const z=$('#donJournal'); z.hidden=false;
  z.textContent = (z.textContent?z.textContent+'\n':'')+txt;
}
/* Analyse d'un .ics — fonction nommée pour être vérifiable sans dialogue de
   fichier. Même classement par mots-clés que app-v2.js:259-291. */
function analyserIcs(txt){
  const evs=[...txt.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)].map(m=>m[1]);
  const trouves=[]; let hors=0, sansCat=0;
  evs.forEach(ev=>{
    const d=/DTSTART[^:]*:(\d{8})/.exec(ev); const s=/SUMMARY:(.*)/.exec(ev);
    if(!d) return;
    const iso=d[1].slice(0,4)+'-'+d[1].slice(4,6)+'-'+d[1].slice(6,8);
    const titre=(s?s[1]:'').toLowerCase();
    let cat=null;
    if (/p[ée]dago/.test(titre)) cat='pedago';
    else if (/cong[ée]|f[ée]ri|rel[âa]che|vacance/.test(titre)) cat='conge';
    else if (/temp[êe]te|force majeure|ferm/.test(titre)) cat='force';
    if (!cat){ sansCat++; return; }
    if (iso < DEBUT || iso > FIN){ hors++; return; }
    trouves.push([iso,cat]);
  });
  return {lus:evs.length, trouves, hors, sansCat};
}
function appliquerIcs(txt, nom){
  const a=analyserIcs(txt);
  /* ⚠ On écrit dans la variable GLOBALE `marques` de proto.js, pas dans une
     copie locale : `peindreCalendrier()` relit cette variable, pas le stockage.
     Une copie locale sauvegardait bien, et l'écran ne bougeait pas. */
  a.trouves.forEach(([iso,cat])=>{ marques[iso]=cat; });
  ecrire('cal',marques);
  if (typeof peindreCalendrier==='function'){ peindreCalendrier(); peindreMois(); peindreAnnee(); }
  journalDon('📆 '+nom+' — '+a.lus+' événements lus, '+a.trouves.length+' posés au calendrier'
    + (a.hors?', '+a.hors+' hors année scolaire ignorés':'')
    + (a.sansCat?', '+a.sansCat+' sans catégorie reconnue':'')+'.');
  if (!a.trouves.length) journalDon('   ⚠ Aucun n’a été reconnu comme congé, pédagogique ou force majeure.');
  return a;
}
(function donnees(){
  if (!$('#donSauver')) return;
  $('#donSauver').addEventListener('click',()=>{
    const d={version:'proto-g2', quand:aujourdhuiISO(), donnees:toutLeProto()};
    telecharger('planificateur-sauvegarde-'+aujourdhuiISO()+'.json', JSON.stringify(d,null,1));
    journalDon('💾 Sauvegarde produite — '+Object.keys(d.donnees).length+' entrées.');
  });
  $('#donRestaurer').addEventListener('click',()=>{
    const i=document.createElement('input'); i.type='file'; i.accept='application/json,.json';
    i.addEventListener('change',()=>{
      const f=i.files[0]; if(!f) return;
      const r=new FileReader();
      r.onload=()=>{
        let d;
        try { d=JSON.parse(r.result); } catch(e){ alert('Ce fichier n’est pas une sauvegarde lisible.'); return; }
        if (!d || !d.donnees){ alert('Ce fichier n’est pas une sauvegarde du Planificateur.'); return; }
        const n=Object.keys(d.donnees).length;
        if (!confirm('Restaurer '+n+' entrées du '+(d.quand||'?')+' ?\n\nTOUT ce qui est à l’écran sera remplacé.')) return;
        Object.keys(localStorage).filter(k=>k.startsWith(P)).forEach(k=>localStorage.removeItem(k));
        Object.entries(d.donnees).forEach(([k,v])=>{ try{ localStorage.setItem(P+k,v); }catch(e){} });
        location.reload();
      };
      r.readAsText(f);
    });
    i.click();
  });
  const csvEchap = v => '"'+String(v).replace(/"/g,'""')+'"';
  $('#donCsvPres').addEventListener('click',()=>{
    const l=[['Prénom','Nom','Statut','Arrivée','Jour du départ','Heure du départ','Parti avec','Hors liste','Humeur','Message au parent']];
    ENFANTS.forEach((e,i)=>{ const p=presDe(i);
      l.push([e.p,e.n,p.statut,p.heureArrivee,p.dateDepart,p.heureDepart,p.partiAvec,p.horsListe?'OUI':'',p.humeur,p.messageParent]); });
    telecharger('presences-'+aujourdhuiISO()+'.csv','﻿'+l.map(r=>r.map(csvEchap).join(';')).join('\n'),'text/csv');
    journalDon('📊 Présences exportées — '+(l.length-1)+' élèves.');
  });
  $('#donCsvEval').addEventListener('click',()=>{
    const crits=critsChoisis();
    const l=[['Élève','C1 Agir','C2 Interagir','C3 Santé'].concat(crits.map(libelleCrit))];
    ELEVES.forEach((nom,i)=>{
      const r=[nom];
      ['c1','c2','c3'].forEach(c=> r.push(coteDe(i,c)||''));
      crits.forEach(c=> r.push(coteCrit(i,c)!==null?coteCrit(i,c):''));
      l.push(r);
    });
    telecharger('evaluation-'+aujourdhuiISO()+'.csv','﻿'+l.map(r=>r.map(csvEchap).join(';')).join('\n'),'text/csv');
    journalDon('📊 Évaluation exportée — '+ELEVES.length+' élèves, '+crits.length+' critère(s) fin(s).');
  });
  /* Import .ics — même classement par mots-clés que app-v2.js:259-291 */
  $('#donIcs').addEventListener('click',()=>{
    const i=document.createElement('input'); i.type='file'; i.accept='.ics,text/calendar';
    i.addEventListener('change',()=>{
      const f=i.files[0]; if(!f) return;
      const r=new FileReader();
      r.onload=()=>{ appliquerIcs(String(r.result), f.name); };
      r.readAsText(f);
    });
    i.click();
  });
})();

/* ═════════ 7. PRÉSENCES + : émulation, tenue, banc de retrait ═════════ */
const TENUE=[['tshirt','👕','T-shirt'],['short','🩳','Short'],['souliers','👟','Souliers']];
function etoilesDe(i){ return lire('etoile:'+i,0); }
function tenueDe(i){ return lire('tenue:'+i,{}); }
function bancDe(){ return lire('banc',{}); }

const _peindrePresencesBase = peindrePresences;
peindrePresences = function(){
  _peindrePresencesBase();
  $$('#prGrille .pr-carte').forEach((c,i)=>{
    /* émulation : 3 étoiles */
    const et=el('div','pr-etoiles');
    for (let k=1;k<=3;k++){
      const b=el('button',null,'⭐'); b.type='button';
      b.className = etoilesDe(i)>=k ? 'on':'';
      b.title = k+' étoile'+(k>1?'s':'')+' pour '+ENFANTS[i].p;
      b.addEventListener('click',ev=>{ ev.stopPropagation();
        ecrire('etoile:'+i, etoilesDe(i)===k ? k-1 : k); peindrePresences(); });
      et.appendChild(b);
    }
    c.appendChild(et);
    /* tenue sportive */
    const tn=el('div','pr-tenue'); const t=tenueDe(i);
    TENUE.forEach(([k,emo,lab])=>{
      const b=el('button',null,emo); b.type='button';
      b.className = t[k]?'on':''; b.title=lab+(t[k]?' ✓':' — non');
      b.addEventListener('click',ev=>{ ev.stopPropagation();
        const q=tenueDe(i); q[k]=!q[k]; ecrire('tenue:'+i,q); peindrePresences(); });
      tn.appendChild(b);
    });
    c.appendChild(tn);
    /* banc de retrait */
    const bc=el('button','pr-absent-btn', bancDe()[i] ? '🪑 SUR LE BANC' : '🪑 BANC'); bc.type='button';
    bc.addEventListener('click',ev=>{ ev.stopPropagation();
      const q=bancDe();
      if (q[i]) delete q[i];
      else { const m=parseInt(prompt('Combien de minutes sur le banc ?','5'),10); if(!m||m<=0) return;
             q[i]={fin: Date.now()+m*60000}; }
      ecrire('banc',q); peindrePresences(); peindreBanc();
    });
    c.appendChild(bc);
  });
  peindreBanc();
};
function peindreBanc(){
  let h=$('#prBanc');
  if (!h){
    const pan=$('#e-presences .pan'); if(!pan) return;
    const boite=el('div','pan pan--jaune'); boite.style.marginTop='16px';
    boite.innerHTML='<h2>🪑 Banc de retrait</h2><p style="margin:0 0 8px;font-weight:700">'
      +'Touche 🪑 sur une carte pour y mettre un élève. Il en sort tout seul quand le temps est fini.</p>'
      +'<div class="banc" id="prBanc"></div>';
    pan.parentNode.insertBefore(boite, pan.nextSibling);
    h=$('#prBanc');
  }
  const q=bancDe(); h.innerHTML='';
  const cles=Object.keys(q);
  if (!cles.length){ h.appendChild(el('p',null,'Personne sur le banc. Tant mieux.')); return; }
  cles.forEach(i=>{
    const reste=Math.max(0, Math.round((q[i].fin-Date.now())/1000));
    const d=el('div','banc-place');
    const img=document.createElement('img'); img.src=photoDe(+i); img.alt='';
    d.appendChild(img);
    d.appendChild(el('b',null,ENFANTS[+i].p));
    d.appendChild(el('span','cpt', Math.floor(reste/60)+':'+String(reste%60).padStart(2,'0')));
    const x=el('button','mini','↩ IL REVIENT'); x.type='button';
    x.addEventListener('click',()=>{ const w=bancDe(); delete w[i]; ecrire('banc',w); peindrePresences(); });
    d.appendChild(x); h.appendChild(d);
  });
}
setInterval(()=>{
  const q=bancDe(); let change=false;
  Object.keys(q).forEach(i=>{ if (q[i].fin<=Date.now()){ delete q[i]; change=true; } });
  if (change){ ecrire('banc',q); peindrePresences(); }
  else if ($('#prBanc') && Object.keys(q).length) peindreBanc();
}, 1000);
peindrePresences();

/* ═════════ 8. RÉGLAGES — cycle, étapes, zoom, langue ═════════ */
const STYLES_CYCLE = {
  romains:{lab:'Chiffres romains',   v:['I','II','III','IV','V','VI','VII','VIII','IX','X']},
  chiffres:{lab:'Chiffres',          v:['1','2','3','4','5','6','7','8','9','10']},
  lettres:{lab:'Lettres',            v:['A','B','C','D','E','F','G','H','I','J']},
  noms:{lab:'Noms que je choisis',   v:[]},
};
(function reglagesPlus(){
  const ecran=$('#e-reglages'); if(!ecran) return;
  const bloc=el('div'); bloc.innerHTML=`
    <div class="aide-un-mot"><span class="emo">⚙️</span>
      Tout ce qui se règle une fois par année est ici. Le reste se règle là où tu t'en sers.</div>
    <div class="reg-section">
      <h3>📆 Mes jours-cycle</h3>
      <div class="reg-ligne"><b>Combien de jours ?</b>
        <button type="button" class="mini" data-cyc="-">−</button>
        <span id="cycLen" style="font-family:var(--f-titre);font-size:22px">6</span>
        <button type="button" class="mini" data-cyc="+">+</button></div>
      <div class="reg-ligne"><b>Affichés comment ?</b><span class="grp" id="cycStyles"></span></div>
      <div class="cyc-noms" id="cycNoms"></div>
    </div>
    <div class="reg-section">
      <h3>🗓️ Les 4 étapes de l'année</h3>
      <div id="etapes"></div>
    </div>
    <div class="reg-section">
      <h3>🔍 Taille de l'écriture</h3>
      <div class="reg-ligne" id="zoomBtns"></div>
    </div>
    <div class="reg-section">
      <h3>🌍 Langue</h3>
      <div class="reg-ligne" id="langBtns"></div>
      <p style="margin:6px 0 0;font-size:13px;color:var(--ink-soft);font-weight:700">
        Le Carnet en servait cinq. La fusion en garde deux, décision consignée au contrat.</p>
    </div>
    <div class="reg-section">
      <h3>🖥️ Mode intégré</h3>
      <p style="margin:0 0 8px;font-size:14px;font-weight:700">Pour poser l'app dans une autre page :
        ajoute <code>?embed=1</code> à l'adresse. Le bandeau et la barre du bas disparaissent.</p>
      <button type="button" class="mini" id="essaiEmbed">VOIR CE QUE ÇA DONNE</button>
    </div>`;
  ecran.appendChild(bloc);

  /* longueur du cycle */
  const majLen=()=>{ $('#cycLen').textContent=lire('cycLen',6); peindreNoms(); };
  ecran.addEventListener('click',e=>{
    const t=e.target.closest('[data-cyc]'); if(!t) return;
    let n=lire('cycLen',6) + (t.dataset.cyc==='+'?1:-1);
    n=Math.max(2,Math.min(10,n)); ecrire('cycLen',n); majLen();
  });
  /* style d'affichage */
  const hs=$('#cycStyles');
  Object.entries(STYLES_CYCLE).forEach(([k,s])=>{
    const b=el('button','mini',s.lab); b.type='button';
    b.setAttribute('aria-pressed',String(k===lire('cycStyle','romains')));
    b.addEventListener('click',()=>{ ecrire('cycStyle',k);
      $$('#cycStyles .mini').forEach(x=>x.setAttribute('aria-pressed','false'));
      b.setAttribute('aria-pressed','true'); peindreNoms(); });
    hs.appendChild(b);
  });
  function peindreNoms(){
    const h=$('#cycNoms'); h.innerHTML='';
    const n=lire('cycLen',6), st=lire('cycStyle','romains');
    for (let i=0;i<n;i++){
      const d=el('div','cyc-nom');
      d.innerHTML='<b>JOUR '+(i+1)+'</b><div contenteditable data-k="cycnom-'+i+'"></div>';
      const z=d.querySelector('[contenteditable]');
      z.dataset.vide = st==='noms' ? 'Écris un nom' : (STYLES_CYCLE[st].v[i]||String(i+1));
      h.appendChild(d);
    }
    brancherEditables(h);
  }
  majLen();

  /* 4 étapes */
  const he=$('#etapes');
  [1,2,3,4].forEach(i=>{
    const d=el('div','reg-ligne');
    d.innerHTML='<b>Étape '+i+'</b><span>du</span><input class="m-saisie" type="date" data-k="etape'+i+'a" style="width:auto">'
      +'<span>au</span><input class="m-saisie" type="date" data-k="etape'+i+'b" style="width:auto">';
    he.appendChild(d);
  });
  $$('#etapes input').forEach(n=>{
    n.value = lire('dt:'+n.dataset.k,'') || '';
    n.addEventListener('change',()=>ecrire('dt:'+n.dataset.k, n.value));
  });

  /* zoom */
  const hz=$('#zoomBtns');
  [['90','Petit'],['100','Normal'],['110','Grand'],['125','Très grand']].forEach(([v,lab])=>{
    const b=el('button','mini',lab); b.type='button';
    b.addEventListener('click',()=>{ ecrire('zoom',v); appliquerZoom();
      $$('#zoomBtns .mini').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); });
    b.setAttribute('aria-pressed', String(v===lire('zoom','100')));
    hz.appendChild(b);
  });
  /* langue */
  const hl=$('#langBtns');
  [['fr','🇨🇦 Français'],['en','🇬🇧 English']].forEach(([v,lab])=>{
    const b=el('button','mini',lab); b.type='button';
    b.setAttribute('aria-pressed', String(v===lire('lang','fr')));
    b.addEventListener('click',()=>{ ecrire('lang',v);
      $$('#langBtns .mini').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true');
      alert(v==='fr' ? 'Interface en français.' : 'The proto stays in French: the English strings are not written yet. The switch is here so you can see where it lives.');
    });
    hl.appendChild(b);
  });
  $('#essaiEmbed').addEventListener('click',()=>{
    const u=new URL(location.href); u.searchParams.set('embed','1'); location.href=u.toString();
  });
})();
function appliquerZoom(){ document.body.dataset.zoom = lire('zoom','100'); }
appliquerZoom();

/* mode intégré : ?embed=1 masque le chrome, comme dans l'app */
if (new URLSearchParams(location.search).get('embed')==='1'){
  document.querySelector('.proto-bar').style.display='none';
  document.querySelector('.dock').style.display='none';
  document.body.style.paddingBottom='0';
}

/* ═════════ raccourcis clavier ═════════ */
document.addEventListener('keydown', e=>{
  if (e.key==='Escape'){ $$('.bloc-options.on').forEach(p=>p.classList.remove('on')); }
});

/* ═════════ 9. LES QUATRE DERNIÈRES LIGNES DU CONTRAT ═════════ */

/* ── a) Banque de jeux perso : le prof ajoute SES jeux au tiroir ── */
(function jeuxPerso(){
  const tete=$('#filtresTete'); if(!tete) return;
  const b=el('button','filtres-tete','➕ AJOUTER MON PROPRE JEU'); b.type='button';
  b.style.background='#1E5C36';
  b.addEventListener('click',()=>{
    const n=prompt('Nom de ton jeu :'); if(!n) return;
    const d=prompt('En une phrase, ça se joue comment ?','') || '';
    const t=parseInt(prompt('Combien de minutes ?','15'),10) || 15;
    const l=lire('jeuxPerso',[]);
    l.push({n:n.trim(), d:d.trim(), e:['⭐ Mon jeu'], t});
    ecrire('jeuxPerso',l);
    JEUX.push(l[l.length-1]);
    if (!FILTRES.includes('⭐ Mon jeu')){
      FILTRES.push('⭐ Mon jeu');
      const x=el('button','mini','⭐ Mon jeu'); x.type='button'; x.setAttribute('aria-pressed','false');
      x.addEventListener('click',()=>{ if(actifs.has('⭐ Mon jeu'))actifs.delete('⭐ Mon jeu');else actifs.add('⭐ Mon jeu');
        x.setAttribute('aria-pressed',String(actifs.has('⭐ Mon jeu'))); peindreJeux(); });
      $('#filtres').appendChild(x);
    }
    peindreJeux();
  });
  tete.parentNode.insertBefore(b, tete.nextSibling);
  lire('jeuxPerso',[]).forEach(j=>{ if(!JEUX.some(x=>x.n===j.n)) JEUX.push(j); });
  if (lire('jeuxPerso',[]).length && !FILTRES.includes('⭐ Mon jeu')) FILTRES.push('⭐ Mon jeu');
  peindreJeux();
})();

/* ── b) Vue séquentielle : le plan de session, semaine par semaine ── */
(function sequentielle(){
  const ecran=$('#e-groupes'); if(!ecran) return;
  const pan=el('div','pan pan--cyan');
  pan.innerHTML='<h2>📈 Mon plan de session</h2>'
    +'<p style="margin:0 0 10px;font-weight:700">Ce que tu enseignes, dans l’ordre, du début à la fin de l’étape. '
    +'Une ligne par semaine.</p><div id="sqListe"></div>'
    +'<button type="button" class="mini mini--lime" id="sqAdd" style="margin-top:8px">+ AJOUTER UNE SEMAINE</button>';
  ecran.appendChild(pan);
  function peindre(){
    const h=$('#sqListe'); h.innerHTML='';
    const n=lire('sqN',6);
    for (let i=0;i<n;i++){
      const d=el('div','hist-ligne');
      d.innerHTML='<b>Semaine '+(i+1)+'</b>'
        +'<div contenteditable data-k="sq-'+i+'" data-vide="Ex. : basketball — le dribble, puis la passe"></div>';
      h.appendChild(d);
    }
    brancherEditables(h);
  }
  $('#sqAdd').addEventListener('click',()=>{ ecrire('sqN', lire('sqN',6)+1); peindre(); });
  peindre();
})();

/* ── c) Rôle coordonnateur : la même app, vue d'en haut ── */
(function coordo(){
  const ecran=$('#e-messages'); if(!ecran) return;
  const pan=el('div','pan');
  pan.innerHTML='<h2>👑 Je suis coordonnateur</h2>'
    +'<p style="margin:0 0 10px;font-weight:700">Bascule pour voir où en sont les équipes. '
    +'Rien ne change pour elles.</p>'
    +'<button type="button" class="mini" id="coordoGo"></button>'
    +'<div id="coordoVue" style="margin-top:12px"></div>';
  ecran.appendChild(pan);
  function peindre(){
    const on=lire('coordo',false);
    $('#coordoGo').textContent = on ? '↩ REVENIR À MA VUE' : '👑 PASSER EN VUE COORDONNATEUR';
    $('#coordoGo').setAttribute('aria-pressed',String(on));
    const v=$('#coordoVue'); v.innerHTML='';
    if (!on) return;
    const equipes=[['Joey — 5A', lire('semaineValidee',null)],
                   ['Sophie — 4B','jeudi 27 août à 09:12'],
                   ['Marc — 6A',null], ['Ana — 3A',null]];
    equipes.forEach(([nom,quand])=>{
      const d=el('div','hist-ligne');
      d.appendChild(el('b',null,nom));
      d.appendChild(el('span',null, quand ? '✅ semaine validée le '+quand : '⏳ semaine pas encore validée'));
      v.appendChild(d);
    });
    const reste=equipes.filter(e=>!e[1]).length;
    v.appendChild(el('div','aide-un-mot','⏳ '+reste+' équipe(s) n’ont pas encore validé leur semaine.'));
  }
  $('#coordoGo').addEventListener('click',()=>{ ecrire('coordo', !lire('coordo',false)); peindre(); });
  peindre();
  const vs=$('#valSemaine'); if (vs) vs.addEventListener('click', peindre);
})();

/* ── d) Les autres outils du site, à portée de main ── */
(function autresOutils(){
  const ecran=$('#e-accueil'); if(!ecran) return;
  const pan=el('div','pan pan--cyan'); pan.style.marginTop='18px';
  pan.innerHTML='<h2>🔗 Mes autres outils Zone Total Sport</h2>'
    +'<p style="margin:0 0 10px;font-weight:700">Ils vivent dans leur propre app. Le lien les ouvre.</p>'
    +'<div class="grp-liste" id="autresListe"></div>';
  ecran.appendChild(pan);
  const h=pan.querySelector('#autresListe');
  [['🎵 Musique','https://musique.zonetotalsport.ca'],
   ['🎨 Coloriage','https://zonetotalsport.ca/apps/colorier/'],
   ['📚 Banque de SAÉ','https://sae.zonetotalsport.ca'],
   ['🏃 Éducatifs','https://educatifs.zonetotalsport.ca']].forEach(([lab,url])=>{
    const a=document.createElement('a');
    a.className='grp-puce'; a.href=url; a.target='_blank'; a.rel='noopener';
    a.textContent=lab; a.style.textDecoration='none';
    h.appendChild(a);
  });
})();
