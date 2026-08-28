/* ==========================================================================
   SIMPLIFICATION — 28 août.
   1. MA JOURNÉE : zéro bouton. On écrit, on glisse, on vide pour effacer.
   2. PRÉSENCES : tout le monde a son linge par défaut ; on ne touche QUE les
      exceptions. C'est le sens du geste réel — un prof pointe les manquants,
      pas les présents.
   3. NOTATION : étoiles, lettres, chiffres ou couleurs, au choix. Et tout le
      monde part au MAXIMUM ; on descend ceux qui doivent l'être.
   4. MON CAHIER n'existe plus : les cases de MA SEMAINE s'écrivent directement.
   ========================================================================== */
'use strict';

/* ═════════ 1. MA JOURNÉE — écrire et glisser, rien d'autre ═════════ */
function jrCle(){ return kctx('jr'); }
function jrLire(){ return lire(jrCle(), null) || []; }
function jrEcrire(l){ ecrire(jrCle(), l); }

function peindreJournee(){
  const h=$('#jrListe'); if(!h) return;
  const d=$('#jrDate'); if(d) d.textContent=jourLisible(ctxDate);
  const l=jrLire();
  h.innerHTML='';
  l.forEach((b,i)=> h.appendChild(ligneJournee(b,i)));
  h.appendChild(ligneJournee({titre:'',desc:'',duree:''}, -1));   // la ligne neuve, toujours au bout
}
function ligneJournee(b, i){
  const neuve = i<0;
  const n=el('div','jr-ligne'+(neuve?' jr-ligne--neuve':''));
  n.innerHTML='<span class="prise" draggable="true" title="Glisser pour replacer">⠿</span>'
    +'<div><div class="ti" contenteditable data-vide="'+(neuve?'Écris ici pour ajouter…':'Titre')+'"></div>'
    +'<div class="de" contenteditable data-vide="Ce qu’on fait…"></div>'
    +'<div class="jr-images"></div></div>'
    +'<div class="du" contenteditable data-vide="à toi"></div>';
  const ti=n.querySelector('.ti'), de=n.querySelector('.de'), du=n.querySelector('.du');
  ti.textContent=b.titre||''; de.textContent=b.desc||''; du.textContent=b.duree||'';
  peindreImagesLigne(n, b, i);
  if (!neuve) brancherDepotImages(n, i);

  const enregistre=()=>{
    const t=ti.textContent.trim(), s=de.textContent.trim(), u=du.textContent.trim();
    const l=jrLire();
    if (neuve){
      if (!t && !s) return;                       // rien écrit : on ne crée rien
      l.push({titre:t,desc:s,duree:u,medias:[]}); jrEcrire(l); peindreJournee();
      const lignes=$$('#jrListe .jr-ligne');
      const cible=lignes[lignes.length-2];
      if (cible) placerCurseurFin(cible.querySelector(t?'.de':'.ti'));
      return;
    }
    const med=(l[i]&&l[i].medias)||[];
    if (!t && !s && !u && !med.length){ l.splice(i,1); jrEcrire(l); peindreJournee(); return; }  // vidée = effacée
    l[i]={titre:t,desc:s,duree:u,medias:med}; jrEcrire(l);
  };
  [ti,de,du].forEach(x=>{
    x.addEventListener('blur', enregistre);
    x.addEventListener('keydown', e=>{
      if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); x.blur();
        if (x===ti) { const f=n.querySelector('.de'); if(f) placerCurseurFin(f); } }
    });
  });

  const prise=n.querySelector('.prise');
  prise.addEventListener('dragstart', e=>{ n.classList.add('drag');
    e.dataTransfer.setData('text/zts-jr', String(i)); e.dataTransfer.effectAllowed='move'; });
  prise.addEventListener('dragend', ()=> n.classList.remove('drag'));
  if (!neuve){
    n.addEventListener('dragover', e=>{
      if (![...(e.dataTransfer.types||[])].includes('text/zts-jr')) return;
      e.preventDefault(); n.classList.add('over'); });
    n.addEventListener('dragleave', ()=> n.classList.remove('over'));
    n.addEventListener('drop', e=>{
      const k=parseInt(e.dataTransfer.getData('text/zts-jr'),10);
      if (isNaN(k) || k===i) return;
      e.preventDefault(); n.classList.remove('over');
      const l=jrLire(); const [x]=l.splice(k,1); l.splice(i,0,x); jrEcrire(l); peindreJournee();
    });
  }
  return n;
}
function placerCurseurFin(n){
  if(!n) return; n.focus();
  const r=document.createRange(); r.selectNodeContents(n); r.collapse(false);
  const s=window.getSelection(); s.removeAllRanges(); s.addRange(r);
}

/* ═════════ 2 & 3. LA FAÇON DE NOTER ═════════
   Quatre langages pour la même échelle sur 100. Le choix est global, il
   s'applique aux étoiles des présences comme aux grilles d'évaluation. */
/* ⚠ TROIS colonnes par palier : [symbole, ce que ça veut dire, valeur/100].
   La grille d'évaluation déstructure `[sym, lab, val]` — avec deux colonnes,
   la valeur arrivait `undefined` et aucune case ne se marquait. */
/* ═════════ COMMENT JE NOTE — la façon ET le nombre de niveaux ═════════
   Joey : « permets de choisir le nombre — étoiles, lettres, chiffres ou
   couleurs — selon ce que veut l'internaute ». Les paliers ne sont donc plus
   figés : on choisit combien, de 2 à 6, et les symboles se fabriquent.
   La valeur reste sur 100 : le meilleur vaut 100, le dernier 100/n. */
const NIVEAUX_MIN = 2, NIVEAUX_MAX = 6;
const LETTRES_ECH  = ['A','B','C','D','E','F'];
const COULEURS_ECH = ['🟢','🔵','🟡','🟠','🔴','⚫'];
/* Les symboles du Carnet ÉPS : ++ · + · +/- · - · -- */
const SYMBOLES_ECH = ['++','+','+/-','-','--','∅'];
const MOTS_ECH     = ['très bien','bien','correct','à travailler','difficile','pas fait'];

function nbNiveaux(){
  return Math.max(NIVEAUX_MIN, Math.min(NIVEAUX_MAX, lire('nbNiveaux', 3)));
}
function faconNom(){ return lire('facon','etoiles'); }
/* Les paliers se fabriquent : [symbole, ce que ça veut dire, valeur sur 100] */
function paliers(){
  const n=nbNiveaux(), k=faconNom(), out=[];
  for (let i=0;i<n;i++){
    const val=Math.round(100*(n-i)/n);
    let sym;
    if (k==='etoiles')       sym='⭐'.repeat(n-i);
    else if (k==='lettres')  sym=LETTRES_ECH[i];
    else if (k==='chiffres') sym=String(n-i);
    else if (k==='symboles'){ const haut=(n>=6?5:4); sym=SYMBOLES_ECH[Math.round(i*haut/(n-1))]; }
    else {
      /* vert → rouge ; le noir n'entre qu'à six niveaux, sinon un barème à
         trois crans finissait sur ⚫, ce qui ne veut rien dire. */
      const haut = (n>=6 ? 5 : 4);
      sym = COULEURS_ECH[Math.round(i*haut/(n-1))];
    }
    const mot = MOTS_ECH[Math.round(i*(MOTS_ECH.length-1)/(n-1))];
    out.push([sym, mot, val]);
  }
  return out;
}
const FACONS_META = {
  etoiles: {lab:'⭐ Étoiles',  quoi:'des étoiles, comme au primaire'},
  lettres: {lab:'🔤 Lettres',  quoi:'A · B · C…'},
  chiffres:{lab:'🔢 Chiffres', quoi:'du plus grand au plus petit'},
  symboles:{lab:'➕ Symboles', quoi:'++ · + · +/- · - · --'},
  couleurs:{lab:'🎨 Couleurs', quoi:'vert · bleu · jaune · orange · rouge'},
};
function facon(){ return {lab:FACONS_META[faconNom()].lab, v:paliers()}; }
function maxFacon(){ return paliers()[0][2]; }
function symboleDe(val){
  const v=paliers(); let best=v[0];
  v.forEach(x=>{ if (Math.abs(x[2]-val) < Math.abs(best[2]-val)) best=x; });
  return best[0];
}

/* ═════════ 2. PRÉSENCES — tout le monde a son linge, sauf exception ═════════ */
(function presencesParDefaut(){
  if (typeof volet !== 'function') return;
  /* `pres` ne contient plus que les EXCEPTIONS : absent de la table = a son
     linge. On ne pointe donc que ceux qui manquent quelque chose. */
  window.etatPresence = function(s, i){ return (s.pres||{})[i] || 'linge'; };
})();

/* ═════════ 4. LES CASES DE MA SEMAINE S'ÉCRIVENT ═════════ */

/* ═════════ le réglage de la façon de noter ═════════ */
(function reglageFacon(){
  const ecran=$('#e-reglages'); if(!ecran) return;
  const box=el('div','reg-section');
  box.innerHTML='<h3>⭐ Comment je note</h3>'
    +'<p style="margin:0 0 10px;font-family:var(--f-note);font-size:17px">'
    +'Choisis la façon <b>et</b> le nombre de niveaux. <b>Tout le monde part au maximum</b> — '
    +'tu ne descends que ceux qui doivent l’être.</p>'
    +'<div class="reg-ligne"><b>Combien de niveaux ?</b>'
    +'<button type="button" class="mini" data-niv="-">−</button>'
    +'<span id="nivCompte" style="font-family:var(--f-titre);font-size:22px"></span>'
    +'<button type="button" class="mini" data-niv="+">+</button></div>'
    +'<div class="note-choix" id="faconChoix"></div>';
  ecran.appendChild(box);
  function peindre(){
    $('#nivCompte').textContent=nbNiveaux();
    const h=$('#faconChoix'); h.innerHTML='';
    Object.entries(FACONS_META).forEach(([k,f])=>{
      const b=el('button'); b.type='button';
      b.innerHTML='<span></span><small></small><span class="note-apercu"></span>';
      b.children[0].textContent=f.lab; b.children[1].textContent=f.quoi;
      const avant=faconNom();
      ecrire('facon',k);
      paliers().forEach(([sym,mot,val])=>{
        const x=el('span',null,sym); x.title=mot+' — '+val+'/100';
        b.children[2].appendChild(x);
      });
      ecrire('facon',avant);
      b.setAttribute('aria-pressed', String(k===faconNom()));
      b.addEventListener('click',()=>{ ecrire('facon',k); peindre(); repercuter(); });
      h.appendChild(b);
    });
  }
  function repercuter(){
    if (typeof seanceOuverte!=='undefined' && seanceOuverte && !$('#modale').hidden) volet('evaluation');
    if (typeof peindreAgenda==='function') peindreAgenda();
  }
  box.addEventListener('click',e=>{
    const t=e.target.closest('[data-niv]'); if(!t) return;
    let n=nbNiveaux()+(t.dataset.niv==='+'?1:-1);
    ecrire('nbNiveaux', Math.max(NIVEAUX_MIN, Math.min(NIVEAUX_MAX, n)));
    peindre(); repercuter();
  });
  peindre();
})();

/* ═════════ brancher MA JOURNÉE sur le contexte ═════════ */
(function journeeVivante(){
  const basePoser = window.poserContexte;
  window.poserContexte = function(iso, gr){ basePoser(iso, gr); peindreJournee(); };
  const baseAller = window.allerA;
  window.allerA = function(id){ baseAller(id); if (id==='e-journee') peindreJournee(); };
  peindreJournee();
})();


/* ═════════ GLISSER-DÉPOSER D'IMAGES ═════════
   Joey : « je veux seulement un glisse-dépose pour image, le reste éditable. »
   Aucun bouton : on lâche le fichier sur la ligne. Un clic sur la vignette la
   retire. Le sélecteur de fichier reste accessible en touchant la zone vide,
   pour les tablettes où il n'y a rien à glisser. */
function peindreImagesLigne(n, b, i){
  const h=n.querySelector('.jr-images'); if(!h) return;
  h.innerHTML='';
  const med=(b&&b.medias)||[];
  med.forEach((m,k)=>{
    const f=el('figure','jr-vig');
    if (m.type==='image'&&m.data) f.innerHTML='<img alt="" src="'+m.data+'">';
    else if (m.type==='video'&&m.data) f.innerHTML='<video src="'+m.data+'" muted></video>';
    else f.innerHTML='<div class="doc">'+(m.type==='pdf'?'📄':m.type==='video'?'🎬':'🖼️')+'</div>';
    f.title=m.nom+' — touche pour retirer';
    f.addEventListener('click',()=>{
      const l=jrLire(); (l[i].medias||[]).splice(k,1); jrEcrire(l); peindreJournee(); });
    h.appendChild(f);
  });
  if (i>=0 && !med.length){
    const z=el('div','jr-depot','＋ glisse une image ici');
    z.addEventListener('click',()=>choisirFichierLigne(i));
    h.appendChild(z);
  }
}
function ajouteMediaLigne(i, m){
  const l=jrLire(); if(!l[i]) return;
  l[i].medias=l[i].medias||[]; l[i].medias.push(m); jrEcrire(l); peindreJournee();
}
function avaleFichierLigne(i, f){
  const type = f.type.startsWith('image/') ? 'image'
             : f.type.startsWith('video/') ? 'video'
             : f.type.startsWith('audio/') ? 'audio' : 'pdf';
  if (type==='image'){
    reduireImage(f,1400,.82).then(d=>ajouteMediaLigne(i,{type,nom:f.name,data:d}))
      .catch(()=>ajouteMediaLigne(i,{type,nom:f.name,data:null}));
    return;
  }
  if (f.size > 2.5*1024*1024){ ajouteMediaLigne(i,{type,nom:f.name,data:null}); return; }
  const r=new FileReader(); r.onload=()=>ajouteMediaLigne(i,{type,nom:f.name,data:r.result});
  r.readAsDataURL(f);
}
function choisirFichierLigne(i){
  const inp=document.createElement('input'); inp.type='file'; inp.accept='image/*,video/*,application/pdf';
  inp.addEventListener('change',()=>{ [...inp.files].forEach(f=>avaleFichierLigne(i,f)); });
  inp.click();
}
function brancherDepotImages(n, i){
  n.addEventListener('dragover', e=>{
    if (![...(e.dataTransfer.types||[])].includes('Files')) return;
    e.preventDefault(); e.stopPropagation(); n.classList.add('jr-recoit'); }, true);
  n.addEventListener('dragleave', ()=> n.classList.remove('jr-recoit'), true);
  n.addEventListener('drop', e=>{
    const f=[...(e.dataTransfer.files||[])]; if(!f.length) return;
    e.preventDefault(); e.stopPropagation(); n.classList.remove('jr-recoit');
    f.forEach(x=>avaleFichierLigne(i,x));
  }, true);
}
