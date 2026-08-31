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

/* ═════════ la nav apprend les nouveaux écrans — RETIRÉ ═════════
   ⚠ `nav2()` posait quatre boutons de plus dans `#nav`, puis `barreEnMenus()`
   faisait `n.innerHTML=''` : ils n'ont JAMAIS été vus, exactement comme les
   seize de `ECRANS` avant eux. Deux de leurs quatre cibles n'existent d'ailleurs
   plus (`e-messages` retiré, `e-donnees` fondu dans RÉGLAGES).
   La barre à trois onglets est la seule source de navigation ; TESTS et
   MES GROUPES gardent leurs portes — la séance pour l'un, ⋯ PLUS pour l'autre. */

/* ══ Ce qui reste de l'ancien système de blocs ══
   Seules trois choses servent encore : les types (l'agenda colore ses cases
   avec), la réduction d'images et le plafond de taille. Le reste — options,
   copier/coller, boutons de médias — a été retiré à la demande de Joey. */
const BLOC_TYPES = {
  activite:  {lab:'Activité',   emo:'🎯', coul:'#FF6B00'},
  garde:     {lab:'Garde',      emo:'🛡️', coul:'#4CAF50'},
  sortie:    {lab:'Sortie',     emo:'🚌', coul:'#2196F3'},
  repas:     {lab:'Repas',      emo:'🍽️', coul:'#FFC107'},
  recre:     {lab:'Récréation', emo:'🏃', coul:'#8BC34A'},
  transition:{lab:'Transition', emo:'➡️', coul:'#9E9E9E'},
};
const PLAFOND = 2.5*1024*1024;
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

/* ── Live et TBI, sur AUJOURD'HUI ── */
/* ⚠ ILS ÉTAIENT DANS LES RÉGLAGES. Démarrer sa séance et basculer le tableau
   blanc sont les deux gestes du DÉBUT DU COURS : les chercher dans un écran de
   configuration, une fois par cours, six fois par jour, n'a aucun sens.
   Ils vivent maintenant sur l'écran d'ouverture, à portée immédiate. */
(function liveEtTbi(){
  const hote=$('#aujActions'); if(!hote) return;
  const barre=el('div'); barre.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px';
  const live=el('button','mini mini--rose','▶ DÉMARRER LA SÉANCE'); live.type='button';
  const etat=el('span'); etat.style.cssText='font-family:var(--f-titre);letter-spacing:1px;align-self:center';
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
  barre.style.margin='0';
  barre.appendChild(live); barre.appendChild(etat); barre.appendChild(tbi);
  hote.appendChild(barre);
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
/* ⚠ `libelleCrit()` ÉTAIT DÉFINI ICI AUSSI, et ne servait à rien : proto-pfeq.js
   en donne une version qui sait lire les TROIS formats de clé (`moi|texte`,
   l'ancien `agir|12` des gabarits, et la clé PFEQ à trois parties) et se charge
   après ce fichier. Celle-ci était systématiquement écrasée — et elle aurait
   rendu « moi » pour tout critère écrit à la main. Retirée. */
function coteCrit(i,cle){ return lire(kctx('evc:'+i+':'+cle), null); }
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
          if (actuel===val){ try{localStorage.removeItem(P+kctx('evc:'+i+':'+cle));}catch(e){} }
          else ecrire(kctx('evc:'+i+':'+cle),val);
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
/* La table Léger-Boucher et son calcul vivent dans proto-tests.js — une
   seule déclaration, sinon les deux scripts s'annulent. */
const cs = n => Math.floor(n/600)+':'+String(Math.floor(n/10)%60).padStart(2,'0')+','+(n%10);

/* Les tests sont réécrits dans proto-tests.js : un groupe à la fois, et
   Léger-Boucher séparé de la course navette. */

/* ══ MES GROUPES a été refait ══
   Joey : « le bouton mes groupes, je ne le trouve pas clair. Mettons : on voit
   tous les groupes en haut, je clique sur un groupe, là on voit les élèves ; si
   je clique sur l'image d'un élève, on voit ses absences avec les dates, ses
   oublis de linge avec les dates, ce qui lui est arrivé au gymnase. »
   L'écran portait deux listes de groupes concurrentes — les vrais (101, 102…)
   et une ancienne (5A, 5B, 6A) — plus un journal, un historique, des gabarits
   et un plan de session. Trois de ces quatre faisaient doublon avec la séance.
   Tout est réécrit dans proto-dossiers.js. */

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
/* ═════════ LE CALENDRIER SCOLAIRE S'IMPORTE — ET TOUT SUIT ═════════
   Joey, 31 août : « mon calendrier est le calendrier scolaire, donc on peut
   importer les dates importantes ; ça se place automatiquement avec les
   journées pédagogiques, les jours-cycle s'il y en a, les dates scolaires
   importantes. »

   ⚠ TROIS DÉFAUTS EMPÊCHAIENT QUE ÇA MARCHE VRAIMENT :

   1. **Une semaine de relâche ne posait qu'un lundi.** Un `.ics` écrit la
      semaine en UN événement, `DTSTART` au lundi et `DTEND` au samedi ; on ne
      lisait que `DTSTART`. Les cinq jours sont maintenant dépliés.
      ⚠ Pour un événement « journée entière », `DTEND` est EXCLUSIF (RFC 5545) :
      la relâche du 2 au 6 s'écrit DTEND=20260307. Une journée de trop sinon.
   2. **Tout ce qui n'était ni congé, ni pédago, ni force majeure était JETÉ.**
      La rentrée, la remise des bulletins, la rencontre de parents, la photo
      scolaire, les sorties — comptées dans « sans catégorie » et perdues.
      Elles deviennent la NOTE de leur journée : elles s'affichent dans MON
      CALENDRIER et dans MON MOIS, à leur date, sans rien ressaisir.
   3. **Les jours-cycle n'étaient PAS recalculés après l'import.** On posait
      douze journées pédagogiques et la numérotation ne bougeait pas jusqu'au
      prochain rechargement de la page. C'est pourtant l'effet principal
      attendu — une pédagogique décale tout ce qui suit.

   ⚠ Les lignes d'un `.ics` se REPLIENT à 75 octets, la suite commençant par
   une espace. Sans dépliage, un `SUMMARY` long est tronqué au milieu d'un mot. */
function deplierIcs(txt){ return String(txt).replace(/\r\n[ \t]/g,'').replace(/\n[ \t]/g,''); }
function isoDIcs(s){ return s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8); }

function categorieIcs(titre){
  const t=String(titre||'').toLowerCase();
  if (/congr[èe]s/.test(t))                                   return 'congres';
  if (/p[ée]dago/.test(t))                                    return 'pedago';
  if (/cong[ée]|f[ée]ri|rel[âa]che|vacance|no[ëe]l|p[âa]ques/.test(t)) return 'conge';
  if (/temp[êe]te|force majeure|ferm/.test(t))                return 'force';
  if (/(premi[èe]re|rentr[ée]e).*(journ[ée]e|scolaire|classe)|rentr[ée]e scolaire/.test(t)) return 'premiere';
  if (/derni[èe]re.*(journ[ée]e|jour).*(scolaire|classe|cours)/.test(t)) return 'derniere';
  return null;
}
function analyserIcs(txt){
  const plat=deplierIcs(txt);
  const evs=[...plat.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)].map(m=>m[1]);
  const trouves=[], notes=[]; let hors=0, sansCat=0;
  evs.forEach(ev=>{
    const d=/DTSTART[^:]*:(\d{8})/.exec(ev); if(!d) return;
    const s=/SUMMARY:(.*)/.exec(ev);
    const titre=(s?s[1]:'').trim().replace(/\\([,;n])/g,(m,c)=> c==='n'?' ':c);
    const debut=isoDIcs(d[1]);
    /* la plage de jours que couvre l'événement */
    const f=/DTEND[^:]*:(\d{8})/.exec(ev);
    const jours=[debut];
    if (f){
      const finExcl=isoDIcs(f[1]);
      let k=isoDe(new Date(dateDeIso(debut).getTime()+UN_JOUR));
      let garde=0;
      while (k < finExcl && garde++ < 400){       /* garde-fou : un .ics peut mentir */
        jours.push(k);
        k=isoDe(new Date(dateDeIso(k).getTime()+UN_JOUR));
      }
    }
    const cat=categorieIcs(titre);
    let posee=false;
    jours.forEach(iso=>{
      if (iso < DEBUT || iso > FIN){ hors++; return; }
      const j=dateDeIso(iso).getDay();
      if (j===0 || j===6) return;                /* un congé de fin de semaine ne dit rien */
      if (cat) trouves.push([iso,cat]);
      else if (titre) notes.push([iso,titre]);
      posee=true;
    });
    if (!cat && !titre && !posee) sansCat++;
    else if (!cat) sansCat++;                    /* comptée, mais gardée en note */
  });
  return {lus:evs.length, trouves, notes, hors, sansCat};
}
function appliquerIcs(txt, nom){
  const a=analyserIcs(txt);
  /* ⚠ On écrit dans la variable GLOBALE `marques` de proto.js, pas dans une
     copie locale : `peindreCalendrier()` relit cette variable, pas le stockage.
     Une copie locale sauvegardait bien, et l'écran ne bougeait pas. */
  a.trouves.forEach(([iso,cat])=>{ marques[iso]=cat; });
  ecrire('cal',marques);

  /* ⚠ ON N'ÉCRASE PAS UNE NOTE ÉCRITE À LA MAIN. Le prof a pu noter « apporter
     les dossards » ; l'import ajoute à la suite au lieu de le remplacer. */
  let neuves=0;
  a.notes.forEach(([iso,titre])=>{
    const avant=noteJour(iso);
    if (avant.includes(titre)) return;
    poserNoteJour(iso, avant ? avant+' · '+titre : titre);
    neuves++;
  });

  /* ⚠ LE CŒUR DE L'AFFAIRE : une pédagogique décale TOUS les jours-cycle qui
     suivent. Sans ce recalcul, l'import n'avait aucun effet visible ailleurs
     qu'au calendrier jusqu'au rechargement de la page. */
  const nbCycles = (typeof recalculerCycles==='function') ? recalculerCycles() : 0;
  if (typeof peindreCalendrier==='function') peindreCalendrier();
  if (typeof peindreMois==='function')       peindreMois();
  if (typeof peindreAnnee==='function')      peindreAnnee();
  if (typeof peindreAgenda==='function')     peindreAgenda();
  if (typeof peindreCtxBarre==='function')   peindreCtxBarre();
  if (typeof peindreAujourdhui==='function') peindreAujourdhui();

  a.neuves=neuves; a.cycles=nbCycles;
  journalDon('📆 '+nom+' — '+a.lus+' événement(s) lu(s) · '+a.trouves.length
    +' journée(s) posée(s) au calendrier · '+neuves+' date(s) importante(s) notée(s) · '
    +nbCycles+' jour(s)-cycle recalculé(s)'
    + (a.hors?' · '+a.hors+' hors année scolaire':'')+'.');
  if (!a.trouves.length && !neuves)
    journalDon('   ⚠ Rien n’a été reconnu. Ce fichier contient-il bien des journées entières ?');
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
  /* ⚠ Le bouton a quitté MES DONNÉES pour l'écran du calendrier, où l'on voit
     le résultat se poser. Le garde évite de tuer le fichier s'il revient. */
  const _ics=$('#donIcs'); if (_ics) _ics.addEventListener('click',()=>{
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
function etoilesDe(i){ return lire(kctx('etoile:'+i),0); }
function tenueDe(i){ return lire(kctx('tenue:'+i),{}); }
function bancDe(){ return lire(kctx('banc'),{}); }

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
        ecrire(kctx('etoile:'+i), etoilesDe(i)===k ? k-1 : k); peindrePresences(); });
      et.appendChild(b);
    }
    c.appendChild(et);
    /* tenue sportive */
    const tn=el('div','pr-tenue'); const t=tenueDe(i);
    TENUE.forEach(([k,emo,lab])=>{
      const b=el('button',null,emo); b.type='button';
      b.className = t[k]?'on':''; b.title=lab+(t[k]?' ✓':' — non');
      b.addEventListener('click',ev=>{ ev.stopPropagation();
        const q=tenueDe(i); q[k]=!q[k]; ecrire(kctx('tenue:'+i),q); peindrePresences(); });
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
      ecrire(kctx('banc'),q); peindrePresences(); peindreBanc();
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
    x.addEventListener('click',()=>{ const w=bancDe(); delete w[i]; ecrire(kctx('banc'),w); peindrePresences(); });
    d.appendChild(x); h.appendChild(d);
  });
}
setInterval(()=>{
  const q=bancDe(); let change=false;
  Object.keys(q).forEach(i=>{ if (q[i].fin<=Date.now()){ delete q[i]; change=true; } });
  if (change){ ecrire(kctx('banc'),q); peindrePresences(); }
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
      <h3>👤 Pour qui est cette app</h3>
      <div id="reglagesMetiers"></div>
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
    if (typeof rafraichirCycles==='function') rafraichirCycles();
  });
  /* style d'affichage */
  const hs=$('#cycStyles');
  Object.entries(STYLES_CYCLE).forEach(([k,s])=>{
    const b=el('button','mini',s.lab); b.type='button';
    b.setAttribute('aria-pressed',String(k===lire('cycStyle','romains')));
    b.addEventListener('click',()=>{ ecrire('cycStyle',k);
      $$('#cycStyles .mini').forEach(x=>x.setAttribute('aria-pressed','false'));
      b.setAttribute('aria-pressed','true'); peindreNoms();
      if (typeof rafraichirCycles==='function') rafraichirCycles(); });
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
    /* un nom écrit à la main doit se voir tout de suite dans la barre du haut
       et dans l'agenda — un seul écouteur délégué suffit. */
    if (!h.dataset.branche2){ h.dataset.branche2='1';
      h.addEventListener('input',()=>{ if (typeof rafraichirCycles==='function') rafraichirCycles(); }); }
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

  /* le sélecteur de métier a quitté MA SEMAINE : il se règle une fois, pas
     tous les lundis. Le noeud est DÉPLACÉ, pas recopié — les écouteurs de
     proto.js le suivent. */
  const hm=$('#reglagesMetiers'), met=$('#metiers'), cpt=$('#metierCompte');
  if (hm && met){ hm.appendChild(met); if (cpt) hm.appendChild(cpt); }
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
/* ⚠ LE RÉGLAGE PART À 120, PAS À 100. Joey lit son plan de loin, un ballon à
   la main : la taille « de près » est l'exception, pas la règle. */
/* ═════ LA TAILLE — UN SEUL SYSTÈME, QUATRE DISTANCES ═════
   ⚠ IL Y EN AVAIT DEUX, ET ILS NE DISAIENT PAS LA MÊME CHOSE. Sur la semaine,
   un − / 200 % / + parcourait huit paliers ; dans RÉGLAGES, quatre boutons
   nommés par la distance en visaient quatre. Régler par l'un déplaçait
   l'autre sans le dire, et « 230 % » ne répond à aucune question qu'un prof
   se pose. Il ne reste que les quatre distances, POSÉES SUR LA GRILLE — là où
   l'on voit ce qu'on grossit.
   ⚠ Les paliers intermédiaires (120, 170, 230, 300) gardent leur règle CSS :
   une saisie déjà enregistrée sur l'un d'eux continue de s'afficher. */
const TAILLES = [['100','De près'],['145','En classe'],
                 ['200','🏀 GYMNASE'],['260','🏀 FOND DU GYMNASE']];
function zoomActuel(){ return parseInt(lire('zoom','200'),10) || 200; }
function poserTaille(v){
  ecrire('zoom', String(v));
  appliquerZoom();
  if (typeof peindreAgenda==='function') peindreAgenda();
}
function appliquerZoom(){
  const z = lire('zoom','200');
  /* ⚠ LE ZOOM SE POSE SUR <html>, PAS SUR <body> : une mise à l'échelle du
     document entier appartient à la racine. Sur `body`, tout ce qui est
     `sticky` ou `fixed` — le bandeau, la nav, la barre de contexte, les
     fenêtres — se raccroche à un conteneur qui n'est plus à la même échelle
     que la fenêtre, et le calcul devient fragile.
     ⚠ À 200 % et plus, l'outil de capture d'écran du navigateur intégré ne
     rend PAS la même chose que la fenêtre réelle une fois la page défilée :
     ne pas conclure d'une capture noire qu'il y a un trou dans la page.
     Le seul juge fiable à ces paliers, c'est l'écran de Joey. */
  document.documentElement.dataset.zoom = z;
  document.body.dataset.zoom = z;
}
appliquerZoom();

/* mode intégré : ?embed=1 masque le chrome, comme dans l'app */
if (new URLSearchParams(location.search).get('embed')==='1'){
  /* ⚠ `.proto-bar` et `.dock` n'existent plus : sans le garde, cette ligne
     levait et tuait la fin du fichier. */
  ['.proto-bar','.dock','.zts-tete'].forEach(sel=>{
    const n=document.querySelector(sel); if (n) n.style.display='none'; });
  document.body.style.paddingBottom='0';
}

/* ═════════ raccourcis clavier ═════════ */
document.addEventListener('keydown', e=>{
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

/* ── b) Le plan de session — LA SOURCE UNIQUE de « ce que j'enseigne cette
   semaine » ──
   ⚠ IL Y AVAIT DEUX ENDROITS POUR LA MÊME PHRASE. Ici, « Semaine 1…6 », des
   numéros sans date, dans MES GROUPES ; et là-bas, la semaine affichée de MA
   SEMAINE, qui n'en savait rien. Deux textes, jamais le même, aucun lien.
   La ligne est désormais rangée sous le LUNDI de sa semaine (`sqw-<iso>`) :
   MES GROUPES en montre la suite, MA SEMAINE en montre UNE — la semaine
   affichée — et les deux écrivent dans la même case.
   ⚠ Le contenu des anciennes clés `sq-<i>` est REPRIS, pas jeté : voir
   `migrerPlanDeSession()` dans proto-g3.js. */
/* ⚠ ANCRÉ SUR LA SEMAINE RÉELLE, PAS SUR CELLE QU'ON REGARDE. Ancré sur
   `agLundi`, le plan de session se décalait tout entier dès qu'on feuilletait
   MA SEMAINE : « Semaine 1 » changeait de sens sans qu'on y touche. La liste
   part de la semaine courante et avance ; MA SEMAINE, elle, écrit dans la
   semaine affichée, quelle qu'elle soit — c'est la même clé de chaque côté. */
function lundiPlan(i){
  return isoDe(new Date(dateDeIso(lundiDe(aujourdhuiISO())).getTime()+i*7*UN_JOUR));
}
function clePlanSemaine(iso){ return 'sqw-'+iso; }
function semaineLisible(iso){
  const d=dateDeIso(iso), f=new Date(d.getTime()+4*UN_JOUR);
  return d.getDate()+' '+MOIS_FR[d.getMonth()].slice(0,4)+' → '+f.getDate()+' '+MOIS_FR[f.getMonth()].slice(0,4);
}
(function sequentielle(){
  const ecran=$('#e-groupes'); if(!ecran) return;
  const pan=el('div','pan pan--cyan');
  pan.innerHTML='<h2>📈 Mon plan de session</h2>'
    +'<p style="margin:0 0 10px;font-weight:700">Ce que tu enseignes, dans l’ordre, semaine après semaine. '
    +'C’est le MÊME texte que celui de <b>MA SEMAINE</b> — écris-le d’un côté, il apparaît de l’autre.</p>'
    +'<div id="sqListe"></div>'
    +'<button type="button" class="mini mini--lime" id="sqAdd" style="margin-top:8px">+ AJOUTER UNE SEMAINE</button>';
  ecran.appendChild(pan);
  window.peindrePlanSession = function(){
    const h=$('#sqListe'); if(!h) return; h.innerHTML='';
    const n=lire('sqN',6);
    for (let i=0;i<n;i++){
      const iso=lundiPlan(i);
      const d=el('div','hist-ligne');
      if (iso===lundiPlan(0)) d.dataset.ici='1';
      d.innerHTML='<b></b><div contenteditable data-k="'+clePlanSemaine(iso)+'" '
        +'data-vide="Ex. : basketball — le dribble, puis la passe"></div>';
      d.querySelector('b').textContent='Semaine du '+semaineLisible(iso);
      h.appendChild(d);
    }
    brancherEditables(h);
  };
  $('#sqAdd').addEventListener('click',()=>{ ecrire('sqN', lire('sqN',6)+1); peindrePlanSession(); });
  /* ⚠ ON NE PEINT PAS ICI. `lundiPlan()` lit `agLundi`, `UN_JOUR`, `isoDe` —
     tous déclarés PLUS BAS dans ce fichier. Un `let`/`const` pas encore
     initialisé n'est pas « undefined » : le lire LÈVE, et `typeof` lève aussi.
     C'est proto-g3.js qui appelle `peindrePlanSession()`, une fois tout en
     place. Piège de la même famille que le n° 4 du journal. */
})();

/* ── c) Rôle coordonnateur : la même app, vue d'en haut ── */
/* ⚠ CE BLOC VISAIT `#e-messages`, UN ÉCRAN RETIRÉ : il n'a jamais rien peint.
   La vue coordonnateur avait donc été refaite en double, en plus court, sur
   l'accueil (proto-annee.js). C'est cette version-ci qu'on garde — elle est la
   plus complète — et elle a maintenant son écran, ouvert depuis ⋯ PLUS. */
(function coordo(){
  const ecran=$('#e-coordo'); if(!ecran) return;
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
  /* ⚠ `#valSemaine` n'existe pas — le bouton s'appelle `#valSem`. Le rafraîchi
     ne s'est donc jamais fait après une validation. */
  const vs=$('#valSem'); if (vs) vs.addEventListener('click', peindre);
})();

/* ── d) Les autres outils du site, à portée de main ── */
/* ⚠ `autresOutils()` A ÉTÉ RETIRÉ. Il fabriquait un écran entier pour quatre
   liens externes. Ces liens sont désormais `AUTRES_APPS`, servis par le menu
   déroulant 🔗 MES AUTRES APPS de la barre du haut — un clic, la liste, l'une
   sous l'autre. La liste est écrite UNE fois, plus deux. */

/* ═════════ 10. CAHIER DE CONSIGNATION — ce qui relie tout ═════════
   Joey : « comme un cahier de consignation / un agenda pédagogique, le tout
   interconnecté — si j'évalue un groupe, ça le garde à la bonne place ».

   Le mécanisme tient en une ligne : TOUT ce qui appartient à une séance est
   rangé sous `kctx()` = jour + groupe. Les présences, les cotes, les tests,
   les blocs de la journée. Le cahier ne recopie rien : il RELIT cette clé.
   Changer de jour dans la barre du haut change la page — et l'app entière
   suit, parce qu'elle lit la même clé. */

const UN_JOUR = 86400000;
function isoDe(d){ const D=n=>String(n).padStart(2,'0');
  return d.getFullYear()+'-'+D(d.getMonth()+1)+'-'+D(d.getDate()); }
function dateDeIso(iso){ const [y,m,j]=iso.split('-').map(Number); return new Date(y,m-1,j); }
/* ⚠ `groupes()` était l'ANCIENNE liste (5A, 5B, 6A), supprimée avec la refonte
   de MES GROUPES. La barre de contexte l'appelait encore : ReferenceError au
   chargement, qui tuait proto-fusion.js — donc `agLundi` jamais déclaré, donc
   les deux scripts suivants morts, donc la barre de navigation restait celle
   d'avant. Une seule liste désormais : GRP(). */
function nomGroupe(i){ if (typeof GRP!=='function') return '—';
  const g=GRP()[i]; return g?g.nom:'—'; }

function poserContexte(iso, gr){
  if (iso) ctxDate = iso;
  if (gr!==undefined) ctxGroupe = gr;
  ecrire('ctxDate', ctxDate); ecrire('ctxGroupe', ctxGroupe);
  peindreCtxBarre();
  remonterJournee();                 // la journée du nouveau jour
  enrichirTousLesBlocs();
  peindrePresences();
  if (typeof compterEval==='function') compterEval();
  if (typeof peindreCriteres==='function'){ peindreCriteres(); peindreGrilleCrit(); }
  if (typeof peindreBulletin==='function') peindreBulletin();
  if (typeof peindreJournal==='function') peindreJournal();
  if (typeof peindreHistorique==='function') peindreHistorique();
  peindreCahier();
}
function peindreCtxBarre(){
  const j=$('#ctxJour'); if(!j) return;
  /* GRP() vit dans proto-seance.js, chargé APRÈS ce fichier : au premier
     passage il n'existe pas encore. On sort sans bruit ; proto-seance.js
     rappelle cette fonction une fois en place. */
  if (typeof GRP !== 'function') return;
  j.textContent = jourLisible(ctxDate);
  /* Joey, 28 août : « où je peux mettre jour cycle en haut ? à côté de la
     date ? » — ici. C'est la seule barre qui suit l'utilisateur d'un écran à
     l'autre, et le jour-cycle est ce qu'un prof cherche en premier le matin. */
  const cy=$('#ctxCycle');
  if (cy){
    const txt = (typeof jourCycleLisible==='function') ? jourCycleLisible(ctxDate) : '';
    cy.textContent = txt;
    cy.hidden = !txt;
    cy.className = 'ctx-cyc' + (cycles[ctxDate] ? '' : ' ctx-cyc--hors');
    cy.title = cycles[ctxDate] ? 'Jour-cycle, calculé depuis le calendrier scolaire'
                               : 'Pas de jour-cycle : cette journée est hors classe';
  }
  /* ⚠ LE MENU « J'ÉCRIS DANS » A ÉTÉ RETIRÉ. Il y avait DEUX sélecteurs de
     groupe qui ne se parlaient pas : ce menu déroulant, et les jetons colorés
     au-dessus de l'agenda. On garde les jetons — on reconnaît son groupe à sa
     couleur, pas à une ligne de liste — et ce sont eux qui posent `ctxGroupe`
     (voir `jetonsPosentLeContexte()`, proto-g3.js). */
}
(function barreContexte(){
  if (!$('#ctxBarre')) return;
  $('#ctxPrec').addEventListener('click',()=> poserContexte(isoDe(new Date(dateDeIso(ctxDate).getTime()-UN_JOUR))));
  $('#ctxSuiv').addEventListener('click',()=> poserContexte(isoDe(new Date(dateDeIso(ctxDate).getTime()+UN_JOUR))));
  $('#ctxAuj').addEventListener('click',()=> poserContexte(aujourdhuiISO()));
  peindreCtxBarre();
})();

/* ── ce que le cahier va relire, jour par jour ── */
function releveDuJour(iso, gr){
  const memeD=ctxDate, memeG=ctxGroupe;
  ctxDate=iso; ctxGroupe=gr;                     // on se place sur la page…
  const r={blocs:[], presences:{present:0,parti:0,absent:0,attendu:0}, departs:[],
           cotes:0, crits:0, leger:0, etoiles:0, bancs:0, obs:[]};
  (lire(kctx('jr'), null)||[]).forEach(b=>{
    if (b && b.titre) r.blocs.push({titre:b.titre, fait:false, type:'activite'});
  });
  ENFANTS.forEach((e,i)=>{
    /* ⚠ Le comptage des cotes était DANS la branche « a une présence » : un
       `return` plus haut le sautait. Évaluer sans avoir pris les présences —
       le cas courant — ne comptait donc rien. Les deux relevés sont séparés. */
    const p=lire(kctx('pres2:'+i), null);
    if (!p) r.presences.attendu++;
    else {
      r.presences[p.statut]=(r.presences[p.statut]||0)+1;
      if (p.statut==='parti') r.departs.push({qui:e.p, h:p.heureDepart, avec:p.partiAvec, hors:p.horsListe, msg:p.messageParent});
    }
    COMPS.forEach(c=>{ if (lire(kctx('ev:'+i+':'+c.id),null)) r.cotes++; });
    critsChoisis().forEach(c=>{ if (lire(kctx('evc:'+i+':'+c),null)!==null) r.crits++; });
    if (lire(kctx('etoile:'+i),0)) r.etoiles+=lire(kctx('etoile:'+i),0);
    const o=lire('ed:'+kctx('ev-obs-'+i),''); if(o) r.obs.push(e.p+' — '+o);
  });
  r.leger=Object.keys(lire(kctx('leger'),{})).length;
  r.bancs=Object.keys(lire(kctx('banc'),{})).length;
  ctxDate=memeD; ctxGroupe=memeG;                // …et on remet où on était
  return r;
}
function rienDeRien(r){
  return !r.blocs.length && !r.cotes && !r.crits && !r.leger && !r.departs.length
      && r.presences.present===0 && r.presences.parti===0 && r.presences.absent===0;
}

/* MON CAHIER a été retiré : il vit dans MA SEMAINE, dont les cases
   s'écrivent directement. La fonction reste sans effet. */
function peindreCahier(){
  const h=$('#cahHote'); if(!h) return;
  h.innerHTML='';
  /* La vue semaine du cahier a été retirée : l'accueil EST l'agenda de la
     semaine. Deux écrans pour la même chose, c'était une redondance. */
  const r=releveDuJour(ctxDate, ctxGroupe);
  const page=el('div','cahier');
  const tete=el('div','cahier-tete');
  tete.appendChild(el('h2',null, jourLisible(ctxDate)));
  tete.appendChild(el('span','gr','GROUPE '+nomGroupe(ctxGroupe)));
  page.appendChild(tete);
  const corps=el('div','cahier-corps'); page.appendChild(corps);

  const sect=(titre, remplir, versEcran)=>{
    const s=el('div','cahier-sect'); s.dataset.titre=titre;
    remplir(s);
    if (versEcran){
      const b=el('button','cahier-lien','↗ OUVRIR'); b.type='button';
      b.style.marginTop='6px';
      b.addEventListener('click',()=>allerA(versEcran));
      s.appendChild(b);
    }
    corps.appendChild(s);
  };

  sect('CE QUE\nJ\'AI FAIT', s=>{
    if (!r.blocs.length){ s.appendChild(el('div','cahier-vide','Rien de planifié pour ce jour.')); return; }
    r.blocs.forEach(b=>{
      const d=el('div','cahier-item '+(b.fait?'fait':'pas'));
      d.appendChild(el('span','p', b.fait?'✔':'○'));
      d.appendChild(el('span',null, (BLOC_TYPES[b.type]||BLOC_TYPES.activite).emo+' '+b.titre));
      s.appendChild(d);
    });
  }, 'e-accueil');   /* était 'e-journee', un écran retiré */

  sect('QUI\nÉTAIT LÀ', s=>{
    const p=r.presences;
    if (!p.present && !p.parti && !p.absent){ s.appendChild(el('div','cahier-vide','Présences pas encore prises.')); return; }
    const puces=el('div','cahier-puces');
    puces.appendChild(el('span','cahier-puce vert', p.present+' présent'+(p.present>1?'s':'')));
    puces.appendChild(el('span','cahier-puce gris', p.parti+' parti'+(p.parti>1?'s':'')));
    if (p.absent) puces.appendChild(el('span','cahier-puce rose', p.absent+' absent'+(p.absent>1?'s':'')));
    if (r.bancs) puces.appendChild(el('span','cahier-puce', '🪑 '+r.bancs+' au banc'));
    if (r.etoiles) puces.appendChild(el('span','cahier-puce', '⭐ '+r.etoiles+' étoiles données'));
    s.appendChild(puces);
    r.departs.forEach(d=>{
      const x=el('div','cahier-item');
      x.appendChild(el('span','p','↑'));
      x.appendChild(el('span',null, d.qui+' est parti à '+(d.h||'?')+(d.avec?' avec '+d.avec:'')
        +(d.hors?' ⚠ hors liste':'')+(d.msg?' — message au parent : '+d.msg:'')));
      s.appendChild(x);
    });
  }, 'e-presences');

  sect('CE QUE\nJ\'AI NOTÉ', s=>{
    if (!r.cotes && !r.crits && !r.obs.length){ s.appendChild(el('div','cahier-vide','Aucune évaluation ce jour-là.')); return; }
    const puces=el('div','cahier-puces');
    if (r.cotes) puces.appendChild(el('span','cahier-puce vert', r.cotes+' cote'+(r.cotes>1?'s':'')+' par compétence'));
    if (r.crits) puces.appendChild(el('span','cahier-puce vert', r.crits+' cote'+(r.crits>1?'s':'')+' par critère'));
    s.appendChild(puces);
    r.obs.forEach(o=>{
      const x=el('div','cahier-item'); x.appendChild(el('span','p','✎')); x.appendChild(el('span',null,o)); s.appendChild(x);
    });
  }, 'e-evaluation');

  sect('LES\nTESTS', s=>{
    if (!r.leger){ s.appendChild(el('div','cahier-vide','Aucun test passé ce jour-là.')); return; }
    const d=el('div','cahier-item'); d.appendChild(el('span','p','🏃'));
    d.appendChild(el('span',null,'Navette Léger-Boucher — '+r.leger+' élève(s) mesuré(s)'));
    s.appendChild(d);
  }, 'e-tests');

  sect('MON MOT\nDU JOUR', s=>{
    const l=lire('journal:'+ctxGroupe, []).filter(e=> e.quand.startsWith(jourLisible(ctxDate)));
    if (!l.length){ s.appendChild(el('div','cahier-vide','Rien écrit au journal pour ce jour.')); return; }
    l.forEach(e=>{ const x=el('div','cahier-item'); x.appendChild(el('span','p','📝'));
      x.appendChild(el('span',null,e.txt)); s.appendChild(x); });
  }, 'e-groupes');

  if (rienDeRien(r)){
    const v=el('div','aide-un-mot'); v.style.marginTop='14px';
    v.innerHTML='<span class="emo">👆</span>Cette page est vide. Va prendre les présences ou '
      +'planifier ta journée : tout reviendra s\'écrire ici tout seul.';
    h.appendChild(page); h.appendChild(v); return;
  }
  h.appendChild(page);
}

(function cahierBoutons(){
  const i=$('#cahImprimer'); if (i) i.addEventListener('click',()=>window.print());
  peindreCahier();
})();

/* Le cahier se rafraîchit dès qu'on revient dessus — il relit, il ne stocke pas. */
(function cahierVivant(){
  const base = allerA;
  window.allerA = function(id){ base(id); };
})();
peindreCtxBarre();
peindreCahier();

/* ═════════ 11. LA BARRE DU HAUT — 6 portes, pas 21 boutons ═════════
   Joey : « quelques boutons avec menu déroulant, on classe les fonctionnalités
   qui semblent semblables ». Ce n'est pas le retour du bouton PLUS : l'accueil
   montre toujours toutes les tuiles. C'est la barre qui se resserre.
   Chaque menu est nommé par CE QU'ON Y CHERCHE, pas par une catégorie floue. */
/* CINQ PORTES. Joey, 28 août : « en haut je veux seulement ma semaine,
   calendrier, mes groupes, mon temps — et partage / réglages / mes données
   ensemble. » Tout le reste — la journée, les présences, l'évaluation, les
   jeux, les messages — vit DANS la séance, qu'on ouvre depuis la semaine. */
/* ⚠ TROIS ONGLETS, PAS CINQ. Les cinq portes mélangeaient deux rythmes : ce
   qu'on touche six fois par jour (sa journée, sa semaine) et ce qu'on règle
   trois fois par année (le calendrier, les groupes, le temps, les réglages).
   Le quotidien passe devant — AUJOURD'HUI d'abord, MA SEMAINE ensuite — et
   tout le reste entre derrière ⋯ PLUS, une liste de grosses tuiles. Rien n'est
   perdu : ⋯ PLUS mène aux sept écrans, et chacun garde son chemin de retour. */
/* ⚠ MON MOIS ET MON ANNÉE ÉTAIENT ENTERRÉS À TROIS TOUCHES — ⋯ PLUS ›
   CALENDRIER › VOIR PAR MOIS. Joey : « je veux les voir ». Ce sont deux des
   QUATRE horizons de temps du métier ; les cacher derrière le calendrier
   scolaire, qui n'est qu'un réglage d'année, était une erreur de rangement.
   La barre porte donc les quatre horizons dans l'ordre — jour, semaine, mois,
   année — puis ⋯ PLUS pour tout ce qui n'est pas une durée.
   Chaque porte est un GROS bouton : une icône par-dessus son nom. */
/* Les autres apps du site. Elles vivent chacune dans leur propre domaine :
   ce sont des LIENS, pas des écrans — d'où le menu déroulant plutôt qu'une
   page de plus. */
const AUTRES_APPS = [
  ['🎵','Musique',       'https://musique.zonetotalsport.ca'],
  ['🎨','Coloriage',     'https://zonetotalsport.ca/apps/colorier/'],
  ['📚','Banque de SAÉ', 'https://sae.zonetotalsport.ca'],
  ['🏃','Éducatifs',     'https://educatifs.zonetotalsport.ca'],
];
const MENUS = [
  {direct:'e-aujourdhui', ico:'📋', lab:'MA JOURNÉE'},
  {direct:'e-accueil',    ico:'🗓️', lab:'MA SEMAINE'},
  {direct:'e-mois',       ico:'📅', lab:'MON MOIS'},
  {direct:'e-annee',      ico:'📚', lab:'MON ANNÉE'},
  {direct:'e-calendrier', ico:'📆', lab:'MON CALENDRIER'},
  {direct:'e-temps',      ico:'🏅', lab:'MON PARASCOLAIRE'},
  {apps:true,             ico:'🔗', lab:'MES AUTRES APPS'},
  {direct:'e-plus',       ico:'⋯',  lab:'PLUS'},
  /* ⚠ « La petite roue dentelée réglage dans une petite case complètement à
     droite de l'écran. » Elle est donc la dernière, sans libellé, poussée par
     un `margin-left:auto` — ce qui exige que la barre reste en `flex` : en
     `grid`, `auto` ne pousse rien. */
  {direct:'e-reglages',   ico:'⚙️', lab:'', roue:true},
];
(function barreEnMenus(){
  const n=$('#nav'); if(!n) return;
  n.innerHTML='';
  const fermerTous = sauf => $$('.menu', n).forEach(m=>{ if(m!==sauf) m.dataset.ouvert='0'; });

  MENUS.forEach(m=>{
    if (m.apps){
      /* le menu déroulant des autres apps : une par ligne, l'une sous l'autre */
      const box=el('div','menu menu--apps'); box.dataset.ouvert='0';
      const t=el('button'); t.type='button';
      t.appendChild(el('span','ico', m.ico));
      t.appendChild(el('span','lab', m.lab));
      t.appendChild(el('span','fleche','▾'));
      t.setAttribute('aria-expanded','false');
      t.addEventListener('click',e=>{
        e.stopPropagation();
        const on = box.dataset.ouvert!=='1';
        fermerTous(box); box.dataset.ouvert = on?'1':'0';
        t.setAttribute('aria-expanded', String(on));
        if (on) placerMenu(box);
      });
      const liste=el('div','menu-liste');
      AUTRES_APPS.forEach(([emo,nom,url])=>{
        const a=document.createElement('a');
        a.href=url; a.target='_blank'; a.rel='noopener';
        a.innerHTML='<span></span><span class="quoi"></span>';
        a.firstChild.textContent=emo+' '+nom;
        a.lastChild.textContent='s’ouvre dans un autre onglet';
        a.addEventListener('click',()=>{ fermerTous(); box.dataset.ouvert='0';
          t.setAttribute('aria-expanded','false'); });
        liste.appendChild(a);
      });
      box.appendChild(t); box.appendChild(liste); n.appendChild(box); return;
    }
    if (m.direct){
      const b=el('button'); b.type='button'; b.dataset.va=m.direct;
      if (m.roue){ b.classList.add('nav-roue'); b.title='Réglages'; b.setAttribute('aria-label','Réglages'); }
      b.appendChild(el('span','ico', m.ico));
      if (m.lab) b.appendChild(el('span','lab', m.lab));
      b.addEventListener('click',()=>{ fermerTous(); allerA(m.direct); });
      n.appendChild(b); return;
    }
    const box=el('div','menu'); box.dataset.ouvert='0';
    const t=el('button'); t.type='button';
    t.innerHTML='<span></span><span class="fleche">▼</span>';
    t.firstChild.textContent=m.lab;
    t.setAttribute('aria-expanded','false');
    t.addEventListener('click',e=>{
      e.stopPropagation();
      const on = box.dataset.ouvert!=='1';
      fermerTous(box); box.dataset.ouvert = on?'1':'0';
      t.setAttribute('aria-expanded', String(on));
      if (on) placerMenu(box);
    });
    const liste=el('div','menu-liste');
    m.quoi.forEach(([id,lab,quoi])=>{
      const b=el('button'); b.type='button'; b.dataset.va=id;
      b.innerHTML='<span></span><span class="quoi"></span>';
      b.firstChild.textContent=lab; b.lastChild.textContent=quoi;
      b.addEventListener('click',e=>{ e.stopPropagation(); fermerTous(); box.dataset.ouvert='0';
        t.setAttribute('aria-expanded','false'); allerA(id); });
      liste.appendChild(b);
    });
    box.appendChild(t); box.appendChild(liste); n.appendChild(box);
  });
  document.addEventListener('click', e=>{ if(!e.target.closest('.menu')) fermerTous(); });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape') fermerTous(); });
  /* La barre défile à l'horizontale : un `overflow-x` coupe tout enfant en
     position absolue. Le panneau est donc en `fixed`, placé à l'ouverture. */
  window.addEventListener('resize', ()=>fermerTous());
  window.addEventListener('scroll', ()=>fermerTous(), true);
  n.addEventListener('scroll', ()=>fermerTous());
})();
function placerMenu(box){
  const t=box.querySelector('button').getBoundingClientRect();
  const l=box.querySelector('.menu-liste');
  /* ⚠ `zoom` sur <body> (le mode GYMNASE) piège ce calcul : le rectangle rendu
     est déjà en pixels zoomés, et la liste, descendante du même body, les
     remultiplierait. On divise donc par le facteur avant d'écrire.
     Aujourd'hui aucun menu déroulant n'existe — les cinq portes sont des liens
     directs — mais le jour où l'un revient, il tomberait à côté sans ça. */
  const z=parseFloat(getComputedStyle(document.body).zoom)||1;
  const vw=window.innerWidth/z;
  const large=Math.min(280, vw-26);
  l.style.width=large+'px';
  l.style.top=((t.bottom+7)/z)+'px';
  l.style.left=Math.max(12, Math.min(t.left/z, vw-large-12))+'px';
}

/* `allerA` marque l'écran courant : on reporte la marque sur la porte du menu
   qui le contient, sinon on ne sait plus où on est. */
(function marquerLaPorte(){
  const base = window.allerA;
  window.allerA = function(id){
    base(id);
    $$('#nav [data-va]').forEach(b=> b.setAttribute('aria-current', String(b.dataset.va===id)));
    $$('#nav .menu').forEach(m=>{
      const dedans = !!m.querySelector('[data-va="'+id+'"]');
      m.querySelector('button').setAttribute('aria-current', String(dedans));
      if (dedans) m.querySelector('button').style.boxShadow='3px 3px 0 var(--noir), 0 0 0 3px var(--orange)';
      else m.querySelector('button').style.boxShadow='';
    });
  };
  window.allerA(lire('ecran','e-aujourdhui'));
})();

/* ═════════ 12. CARNET DE NOTES — la grille dense ═════════
   Joey : « la mise en page comme iDoceo, un cahier de notes, un agenda ? »
   Voici la pièce qui manquait : la GRILLE. Élèves en lignes, une colonne par
   jour évalué. Les colonnes ne se créent pas à la main — elles sortent des
   clés `kctx()` déjà écrites. Évaluer un jour fait apparaître sa colonne. */
function joursEvalues(gr){
  const pref = P+'j:', jours=new Set();
  Object.keys(localStorage).forEach(k=>{
    if (!k.startsWith(pref)) return;
    const m=/^protog2:j:(\d{4}-\d{2}-\d{2}):g(\d+):(ev|evc):/.exec(k);
    if (m && +m[2]===gr) jours.add(m[1]);
  });
  return [...jours].sort();
}
function notesDuJour(iso, gr, i){
  const md=ctxDate, mg=ctxGroupe; ctxDate=iso; ctxGroupe=gr;
  const par={};
  /* ⚠ DEUX BARÈMES DANS LA MÊME APP. `VALEUR` (proto.js) note sur 5 — A=5 —
     tandis que les critères fins sont sur 100. Sans le ×20, tout le carnet
     s'affichait « E » : un A valait 5, donc la note la plus basse. */
  COMPS.forEach(c=>{ const v=lire(kctx('ev:'+i+':'+c.id),null); if(v) par[c.id]=VALEUR[v]*20; });
  const fins=[];
  critsChoisis().forEach(cle=>{ const v=lire(kctx('evc:'+i+':'+cle),null); if(v!==null) fins.push(v); });
  ctxDate=md; ctxGroupe=mg;
  const tout=[...Object.values(par), ...fins];
  return {par, fins, moy: tout.length ? Math.round(tout.reduce((a,b)=>a+b,0)/tout.length) : null};
}
const classeNote = v => v==null?'vide':(v>=90?'n100':v>=70?'n80':v>=50?'n60':v>=30?'n40':'n20');
const lettreNote = v => v==null?'—':(v>=90?'A':v>=70?'B':v>=50?'C':v>=30?'D':'E');
const jourCourt = iso => { const d=dateDeIso(iso); return d.getDate()+' '+MOIS_FR[d.getMonth()].slice(0,4); };

function peindreCarnet(){
  const h=$('#carHote'); if(!h) return;
  const gr=ctxGroupe, jours=joursEvalues(gr);
  $('#carGroupe').textContent=nomGroupe(gr);
  $('#carPeriode').textContent = jours.length
    ? jours.length+' journée'+(jours.length>1?'s':'')+' évaluée'+(jours.length>1?'s':'')
    : 'aucune évaluation encore';
  h.innerHTML='';
  if (!jours.length){
    h.appendChild(el('div','aide-un-mot','📊 Dès que tu poses une cote dans ÉVALUER, sa colonne apparaît ici.'));
    return;
  }
  const parComp = lire('carVue','comp')==='comp';
  const t=el('table','carnet');
  const thead=el('thead');
  const r1=el('tr'); r1.appendChild(Object.assign(el('th',null,'Élève'),{rowSpan:parComp?2:1}));
  jours.forEach(j=>{ const th=el('th',null,jourCourt(j)); if(parComp) th.colSpan=3; r1.appendChild(th); });
  r1.appendChild(Object.assign(el('th',null,'MOYENNE'),{rowSpan:parComp?2:1}));
  thead.appendChild(r1);
  if (parComp){
    const r2=el('tr');
    jours.forEach(()=> ['C1','C2','C3'].forEach(c=> r2.appendChild(el('th','sous',c))));
    thead.appendChild(r2);
  }
  t.appendChild(thead);
  const tb=el('tbody');
  ELEVES.forEach((nom,i)=>{
    const tr=el('tr'); tr.appendChild(el('th',null,nom));
    const tout=[];
    jours.forEach(j=>{
      const n=notesDuJour(j,gr,i);
      if (parComp){
        COMPS.forEach(c=>{
          const v=n.par[c.id]!==undefined?n.par[c.id]:null;
          const td=el('td', classeNote(v), lettreNote(v));
          td.title=nom+' — '+jourLisible(j)+' — '+c.nom+(v!=null?' — '+v+'/100':' — pas de cote');
          tr.appendChild(td);
        });
      } else {
        const td=el('td', classeNote(n.moy), n.moy!=null?String(n.moy):'—');
        td.title=nom+' — '+jourLisible(j)+(n.moy!=null?' — moyenne '+n.moy+'/100':' — rien noté');
        tr.appendChild(td);
      }
      if (n.moy!=null) tout.push(n.moy);
    });
    const moy = tout.length ? Math.round(tout.reduce((a,b)=>a+b,0)/tout.length) : null;
    const tdm=el('td','moy '+classeNote(moy), moy!=null?(lettreNote(moy)+' '+moy):'—');
    tdm.title = moy!=null ? nom+' — moyenne sur '+tout.length+' journée(s)' : nom+' — pas encore évalué';
    tr.appendChild(tdm);
    tb.appendChild(tr);
  });
  t.appendChild(tb); h.appendChild(t);
  const lg=el('div','carnet-legende');
  [['n100','A · 90-100'],['n80','B · 70-89'],['n60','C · 50-69'],['n40','D · 30-49'],['n20','E · 0-29']]
    .forEach(([c,l])=>{ const x=el('span',c,l); lg.appendChild(x); });
  h.appendChild(lg);
}
(function carnetBoutons(){
  if (!$('#carComp')) return;
  const maj=()=>{
    const v=lire('carVue','comp');
    $('#carComp').setAttribute('aria-pressed',String(v==='comp'));
    $('#carJour').setAttribute('aria-pressed',String(v!=='comp'));
    peindreCarnet();
  };
  $('#carComp').addEventListener('click',()=>{ ecrire('carVue','comp'); maj(); });
  $('#carJour').addEventListener('click',()=>{ ecrire('carVue','jour'); maj(); });
  $('#carCsv').addEventListener('click',()=>{
    const gr=ctxGroupe, jours=joursEvalues(gr);
    const ech=v=>'"'+String(v).replace(/"/g,'""')+'"';
    const l=[['Élève'].concat(jours.map(jourLisible)).concat(['Moyenne'])];
    ELEVES.forEach((nom,i)=>{
      const r=[nom]; const tout=[];
      jours.forEach(j=>{ const n=notesDuJour(j,gr,i); r.push(n.moy!=null?n.moy:''); if(n.moy!=null)tout.push(n.moy); });
      r.push(tout.length?Math.round(tout.reduce((a,b)=>a+b,0)/tout.length):'');
      l.push(r);
    });
    telecharger('carnet-'+nomGroupe(gr)+'-'+aujourdhuiISO()+'.csv','﻿'+l.map(r=>r.map(ech).join(';')).join('\n'),'text/csv');
  });
  maj();
})();
/* Le carnet et le cahier se rafraîchissent quand on arrive dessus. */
(function carnetVivant(){
  const base=window.allerA;
  window.allerA=function(id){ base(id); if(id==='e-carnet') peindreCarnet(); };
})();
/* Le menu ÉVALUER accueille le carnet. */


/* ═════════ 13. L'AGENDA — l'écran d'ouverture ═════════
   Joey : « à la place [des tuiles], l'affichage de base comme un agenda, les
   modèles que je t'ai donnés ». Les 22 tuiles faisaient doublon avec la barre
   du haut. L'accueil devient donc la SEMAINE, transposée du gabarit papier :
   la colonne des périodes avec leurs heures, cinq jours en colonnes, la bande
   samedi / dimanche / commentaires.
   Différence avec le papier : les cases ne sont pas vides. Elles montrent ce
   qui est consigné sous `kctx()` — donc l'agenda se remplit tout seul. */
/* ⚠ L'horaire est une DONNÉE, plus une liste figée. Une fonction, pas une
   `const` : un `const` au niveau global n'est pas une propriété de window, on
   ne peut donc pas l'intercepter — ma première tentative n'avait aucun effet
   et l'agenda gardait ses six périodes. */
function periodesAgenda(){
  if (typeof horaire === 'function'){
    const l = horaire();
    return l.map((x,i)=> x.t==='r'
      ? {pause: x.nom + (x.h ? ' · '+x.h : '')}
      : {n: numPeriode(l,i), h: x.h || '—', nom: x.nom, libre: !!x.libre});
  }
  return [{n:1,h:'8:00 à 8:50'},{n:2,h:'8:50 à 9:40'},{pause:'Récréation'},
          {n:3,h:'10:00 à 10:50'},{n:4,h:'10:50 à 11:40'},{pause:'Dîner'},
          {n:5,h:'13:05 à 13:55'},{pause:'Récréation'},{n:6,h:'14:15 à 15:05'}];
}
let agLundi = null;

function lundiDe(iso){
  const d=dateDeIso(iso); d.setDate(d.getDate()-((d.getDay()+6)%7)); return isoDe(d);
}
function blocsDuJour(iso){
  const md=ctxDate; ctxDate=iso;
  const out=(lire(kctx('jr'), null)||[]).filter(b=>b&&b.titre)
    .map(b=>({titre:b.titre, fait:false, type:'activite', coul:''}));
  ctxDate=md; return out;
}
function peindreAgenda(){
  const h=$('#agendaHote'); if(!h) return;
  /* Même raison que peindreCtxBarre : GRP() arrive avec proto-seance.js. */
  if (typeof GRP !== 'function') return;
  if (!agLundi) agLundi = lundiDe(ctxDate);
  h.innerHTML='';
  const boite=el('div','agenda');

  /* ⚠ IL Y AVAIT DEUX NAVIGATIONS TEMPORELLES À L'ÉCRAN EN MÊME TEMPS : la
     barre jaune (◀ jour ▶) collée en haut, et ces trois boutons de semaine
     posés dans la grille. Deux paires de flèches qui ne font pas la même
     chose, à trente pixels l'une de l'autre. Les flèches de semaine sont
     remontées DANS la barre jaune, qui devient contextuelle : elle parle du
     jour sur AUJOURD'HUI, de la semaine sur MA SEMAINE, et disparaît ailleurs.
     Voir `majBarreContexte()`, proto-g3.js. */
  const tete=el('div','agenda-tete');
  tete.appendChild(el('h2',null,'Semaine du '+jourLisible(agLundi)));
  boite.appendChild(tete);

  const jours=[];
  for (let i=0;i<5;i++) jours.push(isoDe(new Date(dateDeIso(agLundi).getTime()+i*UN_JOUR)));

  const g=el('div','agenda-grille');
  g.appendChild(el('div','ag-coin'));
  jours.forEach(iso=>{
    const d=dateDeIso(iso);
    const c=el('div','ag-jour');
    c.setAttribute('aria-current', String(iso===ctxDate));
    c.innerHTML='<b></b><span class="d"></span>';
    c.querySelector('b').textContent=JOURS_FR[d.getDay()].toUpperCase();
    c.querySelector('.d').textContent=d.getDate()+' '+MOIS_FR[d.getMonth()].slice(0,4);
    const cy=cycles[iso];
    if (cy){ const s=el('span','cyc','Jour '+cy); c.appendChild(s); }
    else if (marques[iso]){
      const cat=(CATS.find(x=>x[0]===marques[iso])||['',''])[1];
      const s=el('span','cyc',cat.slice(0,14)); s.style.background='#FFE9A8'; c.appendChild(s);
    }
    /* ⚠ LE BUG LE PLUS VISIBLE DU PROTO. « Touche une journée pour l'ouvrir »
       est écrit en toutes lettres sous le titre, et toucher un en-tête de jour
       ne faisait RIEN : le geste visait `e-journee`, un écran retiré, et le
       garde d'`allerA()` renvoyait à l'accueil en remontant la page. Le
       correctif d'étape suivant s'était contenté de poser le contexte —
       toujours rien à l'écran. Il existe maintenant un écran de journée :
       AUJOURD'HUI. Toucher un jour l'ouvre SUR CE JOUR. */
    c.title='Ouvrir '+jourLisible(iso);
    c.addEventListener('click',()=>{ poserContexte(iso); allerA('e-aujourdhui'); });
    g.appendChild(c);
  });

  periodesAgenda().forEach(p=>{
    if (p.pause){ g.appendChild(Object.assign(el('div','ag-pause',p.pause),{})); return; }
    /* ⚠ LE RAIL DISAIT TOUJOURS « Période N », même quand le prof avait renommé
       sa ligne dans RÉGLAGES : son nom ne se rendait pas jusqu'à l'agenda. */
    const per=el('div','ag-per'+(p.libre?' ag-per--libre':''), p.nom || ('Période '+p.n));
    per.appendChild(el('small',null,p.h)); g.appendChild(per);
    jours.forEach(iso=>{
      const c=el('div','ag-case');
      if (iso===aujourdhuiISO()) c.dataset.auj='1';
      const bl=blocsDuJour(iso);
      const b=bl[p.n-1];                       // le n-ième bloc consigné tient la n-ième période
      if (b){
        const bar=el('div','bar');
        bar.style.background = b.coul || (BLOC_TYPES[b.type]||BLOC_TYPES.activite).coul;
        c.appendChild(bar);
        const s=el('span','t',(b.fait?'✔ ':'')+b.titre);
        c.appendChild(s);
      } else {
        c.appendChild(el('span','rien','—'));
      }
      /* ⚠ MÊME PIÈGE, ET IL SE VOYAIT : cliquer une case VIDE de la semaine
         renvoyait à l'accueil et remontait la page. Pire, proto-seance.js pose
         SON propre gestionnaire sur la même case — les deux partaient ensemble.
         Ici on ne fait plus que poser le contexte ; c'est proto-seance.js qui
         décide ce qu'une case fait, et lui seul. */
      c.title = jourLisible(iso)+' · période '+p.n+(b?' — '+b.titre:' — rien de consigné');
      c.addEventListener('click',()=> poserContexte(iso));
      g.appendChild(c);
    });
  });
  boite.appendChild(g);

  /* la bande du bas, comme sur le gabarit papier */
  const bas=el('div','agenda-bas');
  const sam=isoDe(new Date(dateDeIso(agLundi).getTime()+5*UN_JOUR));
  const dim=isoDe(new Date(dateDeIso(agLundi).getTime()+6*UN_JOUR));
  [['Samedi','ag-sam-'+sam,'we'],['Dimanche','ag-dim-'+dim,'we'],['Commentaires','ag-com-'+agLundi,'']]
    .forEach(([lab,cle,cls])=>{
      const d=el('div',cls);
      d.innerHTML='<b></b><div contenteditable data-k="'+cle+'" data-vide="…" style="min-height:34px"></div>';
      d.querySelector('b').textContent=lab;
      bas.appendChild(d);
    });
  boite.appendChild(bas);
  brancherEditables(bas);

  /* ce que la semaine contient déjà */
  const res=el('div','ag-resume');
  let nb=0, pres=0, cotes=0;
  jours.forEach(iso=>{
    const r=releveDuJour(iso, ctxGroupe);
    nb+=r.blocs.length; pres+=r.presences.present+r.presences.parti; cotes+=r.cotes+r.crits;
  });
  res.appendChild(el('span',null,'📋 '+nb+' bloc'+(nb>1?'s':'')+' planifié'+(nb>1?'s':'')));
  res.appendChild(el('span',null,'✅ '+pres+' présence'+(pres>1?'s':'')+' prise'+(pres>1?'s':'')));
  res.appendChild(el('span',null,'⭐ '+cotes+' cote'+(cotes>1?'s':'')+' posée'+(cotes>1?'s':'')));
  const v=lire('semaineValidee',null);
  if (v) res.appendChild(el('span',null,'✔ semaine validée'));
  boite.appendChild(res);

  h.appendChild(boite);
}

/* L'agenda suit le contexte et se rafraîchit quand on revient à l'accueil. */
(function agendaVivant(){
  const basePoser = poserContexte;
  window.poserContexte = function(iso, gr){
    basePoser(iso, gr);
    if (iso) agLundi = lundiDe(ctxDate);
    peindreAgenda();
  };
  const baseAller = window.allerA;
  window.allerA = function(id){ baseAller(id); if (id==='e-accueil') peindreAgenda(); };
})();
peindreAgenda();

/* IMPRIMER n'était qu'une tuile : il rejoint le menu OUTILS. */


/* ── PLAN B rejoint le tiroir des jeux ──
   L'écran PLAN B n'était que trois boutons ouvrant ce même tiroir avec un
   filtre. Un bouton dans le tiroir fait la même chose, sans un écran de plus. */
(function planBDansTiroir(){
  const b=$('#tiroirPlanB'); if(!b) return;
  b.addEventListener('click',()=>{
    const f='Plan B';
    if (actifs.has(f)) actifs.delete(f); else actifs.add(f);
    const on=actifs.has(f);
    b.setAttribute('aria-pressed',String(on));
    b.textContent = on ? '🌧️ PLAN B — filtre actif, touche pour tout revoir'
                       : '🌧️ PLAN B — il pleut, le gym est pris';
    $$('#filtres .mini').forEach(x=>{ if(x.textContent===f) x.setAttribute('aria-pressed',String(on)); });
    peindreJeux();
  });
})();

/* ── ÉVALUATION : une seule grille à la fois ──
   L'écran empilait la grille des 3 compétences ET celle des critères fins :
   deux tableaux d'affilée sur les mêmes élèves, personne ne savait lequel
   remplir. Une bascule, une grille. */
(function evaluationUneGrille(){
  const ecran=$('#e-evaluation'); if(!ecran) return;
  const pans=$$('.pan', ecran); if (pans.length<2) return;
  const simple=pans[0], fin=pans[1];
  const barre=el('div'); barre.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px';
  const b1=el('button','mini','⭐ LES 3 COMPÉTENCES'); b1.type='button';
  const b2=el('button','mini','🔬 DES CRITÈRES PRÉCIS'); b2.type='button';
  const aide=el('div','aide-un-mot');
  const maj=()=>{
    const v=lire('evMode','simple');
    simple.style.display = v==='simple' ? '' : 'none';
    fin.style.display    = v==='simple' ? 'none' : '';
    b1.setAttribute('aria-pressed', String(v==='simple'));
    b2.setAttribute('aria-pressed', String(v!=='simple'));
    aide.innerHTML = v==='simple'
      ? '<span class="emo">👆</span>Une touche par compétence, pour tout le groupe. C’est le plus rapide.'
      : '<span class="emo">🔬</span>Quand tu veux entrer dans le détail : choisis jusqu’à 5 critères, puis cote-les.';
  };
  b1.addEventListener('click',()=>{ ecrire('evMode','simple'); maj(); });
  b2.addEventListener('click',()=>{ ecrire('evMode','fin'); maj(); peindreCriteres(); peindreGrilleCrit(); });
  barre.appendChild(b1); barre.appendChild(b2);
  ecran.insertBefore(aide, simple); ecran.insertBefore(barre, aide);
  maj();
})();
