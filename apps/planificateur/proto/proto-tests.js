/* ==========================================================================
   LES TESTS — un groupe à la fois, et deux tests distincts.
   Joey, 28 août : « le test Léger-Boucher et le test navette, peux-tu les
   séparer ? Si j'ai 3 groupes, est-ce que les 3 fonctionnent indépendamment ? »

   ⚠ CE QUI N'ALLAIT PAS. Les résultats étaient bien rangés par groupe, mais
   sur `ctxGroupe` — l'index de l'ancien sélecteur 5A/5B/6A de la barre jaune,
   pas les groupes 101/102/201/202 posés dans l'agenda. Et l'écran affichait
   les 18 élèves du bassin au lieu des 6 du groupe. Corrigé : on choisit un
   VRAI groupe, on ne voit que SES élèves, et la clé porte son identifiant.

   Deux tests, deux mesures qui n'ont rien à voir :
   · Léger-Boucher — endurance, paliers de vitesse croissante, table du Carnet ;
   · course navette — vitesse, le plus d'allers-retours dans un temps donné.
   ========================================================================== */
'use strict';

let tsGroupe = lire('tsGroupe', null);
function tsGr(){ return grpDe(tsGroupe) || GRP()[0] || null; }
function tsDate(){ const n=$('#tsDate'); return (n && n.value) || aujourdhuiISO(); }
function cleTest(nom){ const g=tsGr(); return 'test:'+(g?g.id:'?')+':'+tsDate()+':'+nom; }
function resTest(nom){ return lire(cleTest(nom), {}); }
function poserTest(nom, o){ ecrire(cleTest(nom), o); }

/* ── le choix du groupe ── */
function peindreChoixGroupe(){
  const h=$('#tsGroupes'); if(!h) return;
  if (!tsGroupe && GRP()[0]) tsGroupe=GRP()[0].id;
  h.innerHTML='';
  GRP().forEach(g=>{
    const b=el('button','grp-puce'); b.type='button';
    b.style.background=g.coul; b.style.color=encreSur(g.coul);
    b.setAttribute('aria-current', String(g.id===tsGroupe));
    if (g.img){ const im=document.createElement('img'); im.className='img'; im.src=g.img; im.alt='';
                im.style.cssText='width:22px;height:22px;border-radius:5px;border:2px solid var(--noir);object-fit:cover';
                b.appendChild(im); }
    else b.appendChild(el('span',null,g.emo));
    b.appendChild(el('span',null,g.nom));
    b.title=g.nom+' — '+g.eleves.length+' élèves';
    if (g.id!==tsGroupe) b.style.opacity='.62';
    b.addEventListener('click',()=>{ tsGroupe=g.id; ecrire('tsGroupe',g.id);
      peindreChoixGroupe(); peindreLegerCorps(); peindreNavetteCorps(); });
    h.appendChild(b);
  });
}

/* ═════════ chronomètre ═════════ */
(function chrono(){
  if (!$('#chLect')) return;
  let dep=0, fige=0, tic=null;
  const lect=$('#chLect'), go=$('#chGo');
  const dixiemes=()=> fige + (dep ? Math.floor((Date.now()-dep)/100) : 0);
  const peindre=()=> lect.textContent = cs(dixiemes());
  go.addEventListener('click',()=>{
    if (dep){ fige=dixiemes(); dep=0; clearInterval(tic); tic=null;
              go.textContent='▶ REPARTIR'; go.classList.remove('gros-bouton--stop'); }
    else { dep=Date.now(); if(!tic) tic=setInterval(peindre,100);
           go.textContent='⏸ ARRÊTER'; go.classList.add('gros-bouton--stop'); }
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
})();
/* `cs` est déjà déclaré dans proto-fusion.js — deux `const` du même nom au
   niveau global font échouer TOUT le script. On réutilise celui-là. */

/* ═════════ 1. LÉGER-BOUCHER — l'endurance ═════════ */
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
let lgDep=0, lgTic=null;
function lgSecondes(){ return lgDep ? (Date.now()-lgDep)/1000 : 0; }
function peindreLegerEtat(){
  if (!$('#lgPalier')) return;
  const e=etatLeger(lgSecondes());
  $('#lgPalier').textContent=e.palier; $('#lgNavette').textContent=e.navette;
  $('#lgDist').textContent=e.distance+' m';
  $('#lgVit').textContent=String(e.vitesse).replace('.',',');
  const s=Math.floor(lgSecondes());
  $('#lgTemps').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
}
function peindreLegerCorps(){
  const h=$('#lgCorps'); if(!h) return;
  const g=tsGr(); h.innerHTML='';
  if (!g){ h.appendChild(el('tr',null,'Aucun groupe.')); return; }
  const r=resTest('leger');
  g.eleves.forEach(i=>{
    const tr=el('tr'); tr.appendChild(el('td','nom', ELEVES[i]));
    const d=r[i];
    tr.appendChild(el('td',null, d? String(d.palier) : '—'));
    tr.appendChild(el('td',null, d? String(d.navette) : '—'));
    tr.appendChild(el('td',null, d? d.distance+' m' : '—'));
    tr.appendChild(el('td',null, d? String(d.vitesse).replace('.',',') : '—'));
    const td=el('td');
    const b=el('button','mini', d?'↺':'⏹ IL ARRÊTE'); b.type='button';
    b.title = d ? 'Effacer le résultat de '+ELEVES[i] : ELEVES[i]+' vient de s’arrêter';
    b.addEventListener('click',()=>{
      const q=resTest('leger');
      if (q[i]) delete q[i]; else q[i]=etatLeger(lgSecondes());
      poserTest('leger',q); peindreLegerCorps();
    });
    td.appendChild(b); tr.appendChild(td); h.appendChild(tr);
  });
}
(function leger(){
  if (!$('#lgGo')) return;
  $('#lgGo').addEventListener('click',()=>{
    if (lgDep){ lgDep=0; clearInterval(lgTic); lgTic=null;
      $('#lgGo').textContent='▶ PARTIR LE TEST'; $('#lgGo').classList.remove('gros-bouton--stop'); }
    else { lgDep=Date.now(); if(!lgTic) lgTic=setInterval(peindreLegerEtat,200);
      $('#lgGo').textContent='■ ARRÊTER LE TEST'; $('#lgGo').classList.add('gros-bouton--stop'); }
    peindreLegerEtat();
  });
  $('#lgRaz').addEventListener('click',()=>{
    const g=tsGr(); if(!g) return;
    if(!confirm('Effacer les résultats Léger-Boucher du groupe '+g.nom+' pour cette date ?')) return;
    lgDep=0; if(lgTic){clearInterval(lgTic);lgTic=null;}
    poserTest('leger',{}); $('#lgGo').textContent='▶ PARTIR LE TEST';
    $('#lgGo').classList.remove('gros-bouton--stop'); peindreLegerEtat(); peindreLegerCorps();
  });
})();

/* ═════════ 2. COURSE NAVETTE — la vitesse ═════════ */
let nvFin=0, nvTic=null;
function nvDureeSec(){
  const t=$('#nvDuree'); if(!t) return 30;
  const v=String(t.value).trim().toLowerCase();
  let m;
  if ((m=/^(\d+)\s*[:h]\s*(\d{1,2})$/.exec(v))) return (+m[1])*60+(+m[2]);
  if ((m=/^(\d+)\s*(s|sec)?$/.exec(v)))          return +m[1];
  if ((m=/^(\d+)\s*min$/.exec(v)))               return (+m[1])*60;
  return 30;
}
function peindreNavetteEtat(){
  const l=$('#nvLect'); if(!l) return;
  const reste = nvFin ? Math.max(0, Math.round((nvFin-Date.now())/1000)) : nvDureeSec();
  l.textContent = Math.floor(reste/60)+':'+String(reste%60).padStart(2,'0');
  l.classList.toggle('court', nvFin && reste<=5);
  if (nvFin && reste===0){
    nvFin=0; clearInterval(nvTic); nvTic=null;
    $('#nvGo').textContent='▶ PARTIR'; $('#nvGo').classList.remove('gros-bouton--stop');
    sonner();
  }
}
function peindreNavetteCorps(){
  const h=$('#nvCorps'); if(!h) return;
  const g=tsGr(); h.innerHTML='';
  if (!g) return;
  const r=resTest('navette');
  const dist=parseInt(($('#nvDist')||{}).value,10)||20;
  g.eleves.forEach(i=>{
    const n=r[i]||0;
    const tr=el('tr'); tr.appendChild(el('td','nom', ELEVES[i]));
    tr.appendChild(el('td',null, n? String(n) : '—'));
    tr.appendChild(el('td',null, n? (n*dist)+' m' : '—'));
    const td=el('td');
    const plus=el('button','mini mini--lime','+1'); plus.type='button';
    plus.title='Un aller-retour de plus pour '+ELEVES[i];
    plus.addEventListener('click',()=>{ const q=resTest('navette'); q[i]=(q[i]||0)+1;
      poserTest('navette',q); peindreNavetteCorps(); });
    const moins=el('button','mini','−1'); moins.type='button'; moins.style.marginLeft='4px';
    moins.addEventListener('click',()=>{ const q=resTest('navette');
      q[i]=Math.max(0,(q[i]||0)-1); if(!q[i]) delete q[i];
      poserTest('navette',q); peindreNavetteCorps(); });
    td.appendChild(plus); td.appendChild(moins); tr.appendChild(td);
    h.appendChild(tr);
  });
}
(function navette(){
  if (!$('#nvGo')) return;
  $('#nvGo').addEventListener('click',()=>{
    if (nvFin){ nvFin=0; clearInterval(nvTic); nvTic=null;
      $('#nvGo').textContent='▶ PARTIR'; $('#nvGo').classList.remove('gros-bouton--stop'); }
    else { nvFin=Date.now()+nvDureeSec()*1000;
      if(!nvTic) nvTic=setInterval(peindreNavetteEtat,200);
      $('#nvGo').textContent='■ ARRÊTER'; $('#nvGo').classList.add('gros-bouton--stop'); }
    peindreNavetteEtat();
  });
  $('#nvRaz').addEventListener('click',()=>{
    const g=tsGr(); if(!g) return;
    if(!confirm('Effacer la course navette du groupe '+g.nom+' pour cette date ?')) return;
    poserTest('navette',{}); peindreNavetteCorps();
  });
  ['#nvDuree','#nvDist'].forEach(k=> $(k).addEventListener('change',()=>{
    peindreNavetteEtat(); peindreNavetteCorps(); }));
})();

/* ═════════ départ ═════════ */
(function testsDepart(){
  const d=$('#tsDate'); if(!d) return;
  d.value=aujourdhuiISO();
  d.addEventListener('change',()=>{ peindreLegerCorps(); peindreNavetteCorps(); });
  peindreChoixGroupe(); peindreLegerEtat(); peindreLegerCorps();
  peindreNavetteEtat(); peindreNavetteCorps();
  const base=window.allerA;
  window.allerA=function(id){ base(id);
    if (id==='e-tests'){ peindreChoixGroupe(); peindreLegerCorps(); peindreNavetteCorps(); } };
})();
