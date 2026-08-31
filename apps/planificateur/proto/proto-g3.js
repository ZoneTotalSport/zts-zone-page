/* ==========================================================================
   G3 — LA SIMPLIFICATION. Trois onglets, une barre, un cours en deux touches.

   Joey : « qu'un enfant de 10 ans l'utilise sans aide. »

   Le proto savait tout faire et le montrait tout en même temps : cinq onglets,
   deux navigations temporelles superposées, deux sélecteurs de groupe, deux
   réglages de taille, une barre de buzzer visible sur chaque écran de l'app.
   Rien n'est retiré ici — tout est DÉPLACÉ, et ce qui existait en double est
   ramené à un seul exemplaire.

   La règle qui décide : à quelle FRÉQUENCE se sert-on de ceci ?
   · six fois par jour  → 📋 AUJOURD'HUI
   · une fois par semaine → 🗓️ MA SEMAINE
   · trois fois par année → ⋯ PLUS

   Ce fichier se charge EN DERNIER : il voit toutes les fonctions des autres et
   peut donc les envelopper sans se soucier de l'ordre.
   ========================================================================== */
'use strict';

/* ═════════ 1. LE PLAN DE SESSION CHANGE DE CLÉ, SANS RIEN PERDRE ═════════
   Les anciennes lignes vivaient sous `ed:sq-<i>`, i étant un numéro sans date.
   Elles passent sous `ed:sqw-<lundi>`, ancrées sur la semaine EN COURS au
   moment de la reprise : « Semaine 1 » devient la semaine où l'on ouvre l'app,
   « Semaine 2 » la suivante, et ainsi de suite. C'est la seule lecture possible
   d'un numéro qui n'a jamais porté de date.
   ⚠ La migration ne se fait qu'une fois et n'écrase jamais une ligne déjà
   écrite sous la nouvelle clé. */
function migrerPlanDeSession(){
  if (lire('sqMigre', false)) return;
  const depart = lundiDe(aujourdhuiISO());
  let repris = 0;
  for (let i=0; i<40; i++){
    const vieux = lire('ed:sq-'+i, null);
    if (vieux===null || String(vieux).trim()==='') continue;
    const iso = isoDe(new Date(dateDeIso(depart).getTime() + i*7*UN_JOUR));
    if (lire('ed:sqw-'+iso, null)===null){ ecrire('ed:sqw-'+iso, vieux); repris++; }
  }
  ecrire('sqMigre', true);
  if (repris) console.info('[proto] plan de session : '+repris+' ligne(s) reprise(s) sous leur vraie semaine.');
}
migrerPlanDeSession();

/* ═════════ 2. LA BARRE CONTEXTUELLE — UNE SEULE, ET ELLE SUIT L'ÉCRAN ═════════
   ⚠ IL Y EN AVAIT DEUX À L'ÉCRAN EN MÊME TEMPS : la barre jaune (◀ jour ▶),
   collée sous la navigation, et les trois boutons de semaine posés DANS la
   grille. Deux paires de flèches à trente pixels l'une de l'autre, qui ne
   déplacent pas la même chose. Une seule barre demeure, et elle parle de ce
   qu'on regarde :
     · 📋 AUJOURD'HUI → ◀ jour ▶ · AUJOURD'HUI
     · 🗓️ MA SEMAINE  → ◀ semaine ▶ · CETTE SEMAINE
     · partout ailleurs → elle disparaît. Sur RÉGLAGES ou MON TEMPS, une date
       qu'on peut changer ne veut rien dire ; la montrer, c'est mentir. */
let ctxMode = 'jour';

function majBarreContexte(){
  const barre=$('#ctxBarre'); if(!barre) return;
  const ecran = lire('ecran','e-aujourdhui');
  ctxMode = ecran==='e-accueil' ? 'semaine' : ecran==='e-aujourdhui' ? 'jour' : 'rien';
  barre.hidden = (ctxMode==='rien');
  if (ctxMode==='rien') return;

  const prec=$('#ctxPrec'), suiv=$('#ctxSuiv'), auj=$('#ctxAuj'),
        jour=$('#ctxJour'), cyc=$('#ctxCycle');
  if (ctxMode==='semaine'){
    if (typeof agLundi!=='undefined' && !agLundi) agLundi = lundiDe(ctxDate);
    prec.setAttribute('aria-label','Semaine précédente'); prec.title='Semaine précédente';
    suiv.setAttribute('aria-label','Semaine suivante');   suiv.title='Semaine suivante';
    auj.textContent='CETTE SEMAINE';
    jour.textContent='Semaine du '+jourLisible(agLundi);
    if (cyc) cyc.hidden=true;                 /* un jour-cycle n'existe pas pour une semaine */
  } else {
    prec.setAttribute('aria-label','Jour précédent'); prec.title='Jour précédent';
    suiv.setAttribute('aria-label','Jour suivant');   suiv.title='Jour suivant';
    auj.textContent='AUJOURD’HUI';
    jour.textContent=jourLisible(ctxDate);
    if (cyc){
      const txt=(typeof jourCycleLisible==='function') ? jourCycleLisible(ctxDate) : '';
      cyc.textContent=txt; cyc.hidden=!txt;
      cyc.className='ctx-cyc'+(cycles[ctxDate] ? '' : ' ctx-cyc--hors');
    }
  }
}

/* ⚠ ON REMPLACE LES TROIS BOUTONS PAR DES CLONES. `barreContexte()`, dans
   proto-fusion.js, leur a déjà posé des écouteurs « jour » qu'on ne peut pas
   retirer — un `addEventListener` anonyme ne se décroche pas. Rebrancher
   par-dessus empilerait les deux comportements : un clic sur ◀ reculerait
   d'un jour ET d'une semaine. Un clone sans écouteur repart de zéro.
   C'est le piège n° 12 du journal, rencontré une deuxième fois. */
(function barreContextuelle(){
  const barre=$('#ctxBarre'); if(!barre) return;
  ['#ctxPrec','#ctxSuiv','#ctxAuj'].forEach(sel=>{
    const v=$(sel); if(!v) return;
    const n=v.cloneNode(true); v.replaceWith(n);
  });
  const glisserSemaine = jours=>{
    agLundi = isoDe(new Date(dateDeIso(agLundi).getTime()+jours*UN_JOUR));
    peindreAgenda(); majBarreContexte();
  };
  const glisserJour = jours=>
    poserContexte(isoDe(new Date(dateDeIso(ctxDate).getTime()+jours*UN_JOUR)));

  $('#ctxPrec').addEventListener('click',()=> ctxMode==='semaine' ? glisserSemaine(-7) : glisserJour(-1));
  $('#ctxSuiv').addEventListener('click',()=> ctxMode==='semaine' ? glisserSemaine(+7) : glisserJour(+1));
  $('#ctxAuj').addEventListener('click',()=>{
    if (ctxMode==='semaine'){ agLundi=lundiDe(aujourdhuiISO()); peindreAgenda(); majBarreContexte(); }
    else poserContexte(aujourdhuiISO());
  });
})();

/* ═════════ 2 bis. LA BARRE SE COLLE SOUS LA NAV, PAS À 96 px ═════════
   ⚠ DÉFAUT ANTÉRIEUR, RENDU CRIANT PAR LES TROIS ONGLETS. `.ctx-barre` était
   collée à `top:96px` — la hauteur qu'avait le bandeau du temps où il était
   lui-même collant. Il ne l'est plus (`.zts-tete{position:relative}`) : la nav
   se colle à 0, et la barre jaune flottait 56 px plus bas, laissant une bande
   de fond entre les deux et RECOUVRANT le titre de l'écran dès qu'on défilait.
   La hauteur de la nav dépend de la taille choisie (100 % → 260 %) : elle se
   mesure, elle ne se devine pas. */
/* ⚠ LA DATE ET SA PASTILLE SONT UNE SEULE CHOSE. Enfants directs d'un
   `flex-wrap`, elles se séparaient dès que la largeur manquait : sur un
   téléphone, la barre se lisait « jeudi 27 août » / « JOURNÉE PÉDAGOGIQUE ◀ » /
   « ▶ AUJOURD'HUI » — les deux flèches sur deux rangées différentes. Un
   conteneur les tient ensemble, et la barre n'a plus que quatre enfants à
   répartir. */
(function grouperLaDate(){
  const j=$('#ctxJour'), c=$('#ctxCycle');
  if (!j || !c || j.parentNode.classList.contains('ctx-quand')) return;
  const box=el('span','ctx-quand');
  j.parentNode.insertBefore(box, j);
  box.appendChild(j); box.appendChild(c);
})();

/* ⚠ ET LA LARGEUR UTILE N'EST PAS `innerWidth`. C'est le piège n° 18 du
   journal, payé une deuxième fois : `zoom` sur `<html>` divise la place réelle,
   mais les `@media` continuent de lire la largeur de la FENÊTRE. Sur un iPad
   de 768 px en mode 🏀 GYMNASE (200 %), le contenu n'a que 384 px et le CSS
   croit en avoir 768 : la barre à trois onglets passait en défilement
   horizontal et ⋯ PLUS sortait de l'écran, sur une tablette.
   On calcule donc la largeur EFFECTIVE et on la publie sur `<html>` ;
   `html[data-etroit="1"]` remplace la media query pour tout ce qui doit
   réagir à la place réellement disponible. */
function calerLaBarre(){
  const n=$('#nav'); if(!n) return;
  document.documentElement.style.setProperty('--h-nav', n.offsetHeight+'px');
  const z=(parseInt(lire('zoom','200'),10)||100)/100;
  const utile = window.innerWidth / z;
  /* ⚠ `innerWidth` vaut 0 pendant une réémulation de fenêtre, et parfois au
     tout premier cadre : sans ce garde, l'app se croyait sur un téléphone.
     Et sans le rappel au cadre suivant, elle restait sur la mauvaise mise en
     page tant que personne ne redimensionnait la fenêtre. */
  if (window.innerWidth > 0)
    document.documentElement.dataset.etroit = utile < 760 ? '1' : '0';
  else requestAnimationFrame(calerLaBarre);
}
calerLaBarre();
window.addEventListener('resize', calerLaBarre);
(function calerApresLaTaille(){
  const base = poserTaille;
  window.poserTaille = poserTaille = function(v){ base(v); calerLaBarre(); };
})();

/* ═════════ 3. 📋 AUJOURD'HUI — L'ÉCRAN D'OUVERTURE ═════════
   Ce qu'un prof d'ÉPS regarde en arrivant le matin : sa journée, période par
   période, avec le groupe qui l'attend. Une touche ouvre le cours.
   Les deux gestes du début de cours — démarrer la séance, basculer le tableau
   blanc — sont posés ici (ils dormaient dans les RÉGLAGES), et le tiroir des
   jeux, qui porte maintenant la minuterie et le buzzer, s'ouvre d'un bouton.

   ⚠ RÈGLE DES TROIS TOUCHES, vérifiée sur les trois gestes quotidiens :
     écrire un cours   → AUJOURD'HUI · la période · (la planification s'ouvre) = 2
     piger un jeu      → AUJOURD'HUI · 🎲 JEUX · AJOUTER                        = 3
     partir la minuterie → AUJOURD'HUI · 🎲 JEUX · ▶ PARTIR                     = 3 */
/* Le prochain jour qui porte un jour-cycle, dans les six semaines qui suivent.
   ⚠ Borné : sans borne, une année scolaire non renseignée ferait tourner la
   boucle jusqu'à la fin des temps sur un `while (true)`. */
function prochainJourDeClasse(iso){
  for (let k=1; k<=42; k++){
    const j=isoDe(new Date(dateDeIso(iso).getTime()+k*UN_JOUR));
    if (cycles[j]) return j;
  }
  return null;
}
function peindreAujourdhui(){
  const h=$('#aujHote'); if(!h) return;
  if (typeof GRP!=='function' || typeof periodesAgenda!=='function') return;
  h.innerHTML='';

  const t=$('#aujTitre');
  if (t){
    const est = ctxDate===aujourdhuiISO();
    t.textContent = (est ? 'Aujourd’hui — ' : '') + jourLisible(ctxDate);
  }
  const sous=$('#aujSous');
  const cy = (typeof jourCycleLisible==='function') ? jourCycleLisible(ctxDate) : '';
  if (sous) sous.textContent = (cy ? cy+' · ' : '')
    + 'Tes périodes de la journée. Touche-en une pour ouvrir le cours.';

  /* ⚠ UNE JOURNÉE HORS CLASSE NE DOIT PAS RESSEMBLER À UN MARDI. Ouvert un
     samedi, l'écran alignait Période 1 · Période 2 · … · Période 6 comme
     n'importe quel jour d'école : six cases vides à remplir, un jour où il n'y
     a pas d'école. Même chose sur une journée pédagogique et sur un congé.
     On dit POURQUOI, et on offre le geste qui suit : aller au prochain jour de
     classe. Les périodes restent affichées dessous — on a le droit de préparer
     un cours un dimanche soir, et une séance déjà posée doit rester visible. */
  if (!cycles[ctxDate]){
    const cat = marques[ctxDate]
      ? (CATS.find(x=>x[0]===marques[ctxDate])||['',''])[1]
      : 'Fin de semaine';
    const c=el('div','auj-hors');
    c.appendChild(el('b',null, cat));
    c.appendChild(el('span',null,'Pas de jour-cycle : il n’y a pas d’école. '
      +'Tu peux quand même écrire un cours plus bas.'));
    const suite=prochainJourDeClasse(ctxDate);
    if (suite){
      const b=el('button','mini mini--lime','▶ PROCHAIN JOUR DE CLASSE'); b.type='button';
      b.title='Aller au '+jourLisible(suite);
      b.addEventListener('click',()=> poserContexte(suite));
      c.appendChild(b);
    }
    h.appendChild(c);
  }

  const liste=el('div','auj-liste');
  let cours=0;

  periodesAgenda().forEach(p=>{
    if (p.pause){
      const r=el('div','auj-pause', p.pause);
      liste.appendChild(r); return;
    }
    const s=seanceDe(ctxDate, p.n);
    const r=el('div','auj-per'+(s?' auj-per--plein':''));

    const quand=el('div','quand');
    quand.appendChild(el('b',null, p.nom || ('Période '+p.n)));
    if (p.h) quand.appendChild(el('span','h', p.h));
    r.appendChild(quand);

    if (s){
      cours++;
      r.classList.add('auj-per--plein');
      const g=grpDe(s.gr)||{nom:'Groupe retiré',coul:'#9E9E9E',emo:'❓',img:'',eleves:[]};
      const b=el('button','auj-cours'); b.type='button';
      b.style.background=g.coul; b.style.color=encreSur(g.coul);
      const tete=el('div','gr');
      if (g.img){ const im=document.createElement('img'); im.className='img'; im.src=g.img; im.alt=''; tete.appendChild(im); }
      else tete.appendChild(el('span','img', g.emo));
      tete.appendChild(el('span',null, g.nom));
      tete.appendChild(el('span','nb', (g.eleves||[]).length+' élèves'));
      b.appendChild(tete);

      const et=(s.etapes||[]).filter(e=>e.phase==='pendant'&&e.titre).map(e=>e.titre);
      b.appendChild(el('span','quoi', et.length ? et.join(' · ')
                                    : ((s.plan||'').trim() || 'rien d’écrit — touche pour planifier')));
      const pu=el('div','puces');
      const faits=(s.etapes||[]).filter(e=>e.fait).length, tot=(s.etapes||[]).length;
      if (tot) pu.appendChild(el('span',null,'✔ '+faits+'/'+tot));
      const np=Object.values(s.pres||{}).length;
      if (np) pu.appendChild(el('span',null,'✅ '+np));
      if ((s.evalCrits||[]).length) pu.appendChild(el('span',null,'📝 '+Object.keys(s.notes||{}).length));
      if (s.minuterie) pu.appendChild(el('span',null,'⏱️ '+mmss(s.minuterie)));
      if (pu.children.length) b.appendChild(pu);

      b.title='Ouvrir le cours du groupe '+g.nom;
      /* la planification est ce qu'on vient chercher : on force le volet */
      b.addEventListener('click',()=>{ ecrire('seVolet','cours'); ouvrirSeance(ctxDate, p.n); });
      r.appendChild(b);
      r.appendChild(illustrationsDuCours(ctxDate, p.n));
    } else {
      const v=el('button','auj-vide'); v.type='button';
      v.innerHTML='<span class="plus">＋</span><span>poser un groupe ici</span>'
        +'<small>Ça se glisse dans MA SEMAINE</small>';
      v.title='Ouvre MA SEMAINE : on y glisse un groupe dans la case';
      v.addEventListener('click',()=>{
        agLundi=lundiDe(ctxDate); allerA('e-accueil');
      });
      r.appendChild(v);
    }
    liste.appendChild(r);
  });

  h.appendChild(liste);

  if (!cours){
    const v=el('div','aide-un-mot');
    v.innerHTML='<span class="emo">👆</span>Aucun cours ce jour-là. Va dans '
      +'<b>🗓️ MA SEMAINE</b> et glisse un groupe dans une case : il apparaîtra ici.';
    h.appendChild(v);
  }
}

/* ═════ LES IMAGES DU COURS, DANS LA CARTE DE LA JOURNÉE ═════
   Joey : « au lieu que ce soit un rectangle mince, mets de la place pour
   pouvoir afficher les images ».
   Les illustrations ne sont pas une nouvelle donnée : ce sont les `medias` des
   étapes de la séance, ceux-là mêmes qu'on dépose dans la fiche de cours. La
   journée les montre, gros, sans qu'on ait à ouvrir quoi que ce soit — c'est
   ce qu'un prof regarde en entrant dans son gymnase.
   ⚠ La bande n'est PAS dans le bouton du cours : un `<button>` dans un
   `<button>` ne survit pas au navigateur (piège n° 13). C'est un frère, avec
   ses propres gestes. */
const ILLUS_MAX = 4;
function imagesDeLaSeance(s){
  const out=[];
  (s.etapes||[]).forEach(e=> (e.medias||[]).forEach(m=>{
    if (out.length<ILLUS_MAX) out.push({m, titre:e.titre||'', id:e.id});
  }));
  return out;
}
/* L'étape qui accueille une image lâchée sur la bande : la première du
   « pendant ». S'il n'y en a aucune, on en fait naître une — sinon le geste
   n'aurait nulle part où aller. */
function etapeDAccueil(iso, per){
  const s=seanceDe(iso,per); if(!s) return null;
  const e=(s.etapes||[]).find(x=>x.phase==='pendant');
  if (e) return e.id;
  const nid=Math.max(0,...(s.etapes||[]).map(z=>z.id))+1;
  s.etapes.push({id:nid,phase:'pendant',piece:'libre',titre:'',desc:'',
                 duree:0,medias:[],fait:false});
  ecrire(cleSeance(iso,per), s);
  return nid;
}
function illustrationsDuCours(iso, per){
  const s=seanceDe(iso,per);
  const z=el('div','auj-illus');
  const vues=imagesDeLaSeance(s);

  vues.forEach(({m,titre})=>{
    const f=document.createElement('figure');
    if (m.type==='image' && m.data){
      const im=document.createElement('img'); im.src=m.data;
      im.alt=titre || m.nom || ''; f.appendChild(im);
    } else {
      f.appendChild(el('div','doc', m.type==='pdf'?'📄':m.type==='video'?'🎬':'🖼️'));
    }
    if (titre) f.appendChild(el('figcaption',null,titre));
    f.title=(titre?titre+' — ':'')+(m.nom||'');
    z.appendChild(f);
  });

  if (!vues.length){
    z.classList.add('auj-illus--vide');
    z.appendChild(el('span','emo','🖼️'));
    z.appendChild(el('span','mot','Glisse une image de ton cours ici'));
  }

  /* déposer, ou toucher pour choisir — la même grammaire que partout ailleurs */
  const avale=fs=>{
    if (!fs.length) return;
    const id=etapeDAccueil(iso,per); if (id===null) return;
    let reste=fs.length;
    fs.forEach(f=> avaleFichierEtape(id, f, ()=>{ if(!--reste) peindreAujourdhui(); }));
  };
  z.addEventListener('dragover', ev=>{
    if ([...(ev.dataTransfer.types||[])].indexOf('Files')<0) return;
    ev.preventDefault(); ev.stopPropagation(); z.classList.add('survol'); });
  z.addEventListener('dragleave', ()=> z.classList.remove('survol'));
  z.addEventListener('drop', ev=>{
    ev.preventDefault(); ev.stopPropagation(); z.classList.remove('survol');
    avale([...(ev.dataTransfer.files||[])]); });
  z.addEventListener('click', ()=>{
    const i=document.createElement('input'); i.type='file';
    i.accept='image/*,video/*,application/pdf'; i.multiple=true;
    i.addEventListener('change',()=> avale([...i.files]));
    i.click(); });
  z.title='Les illustrations de ce cours — glisse-en une, ou touche pour la choisir';
  return z;
}

/* le bouton qui ouvre le tiroir des jeux, à côté de LIVE et du TABLEAU BLANC.
   ⚠ Il est posé APRÈS `liveEtTbi()` (proto-fusion.js), qui a déjà rempli
   `#aujActions` : on ajoute à la même barre plutôt que d'en créer une seconde. */
(function boutonJeux(){
  const h=$('#aujActions'); if(!h) return;
  const barre=h.querySelector('div') || h;
  const b=el('button','mini mini--jaune','🎲 JEUX, MINUTERIE ET BUZZER'); b.type='button';
  b.title='La banque de jeux, la minuterie et le buzzer — tout dans le même tiroir';
  b.addEventListener('click',()=> ouvrirTiroir(null));
  barre.appendChild(b);
})();

/* ═════════ 4. LA MINUTERIE DU TIROIR ═════════
   ⚠ LE BUZZER VIVAIT DANS UNE BARRE COLLÉE AU BAS DE CHAQUE ÉCRAN. Trois
   boutons de son, un volume, un essai — visibles en prenant les présences, en
   remplissant le bulletin, en réglant l'horaire. Il ne sert qu'à une chose :
   annoncer la fin d'un temps. Il vit donc DANS la minuterie, et la minuterie
   vit dans le tiroir des jeux, qu'on ouvre d'une touche depuis AUJOURD'HUI.
   La minuterie d'une SÉANCE reste où elle est : elle est consignée pour ce
   groupe-là, c'est une donnée du cours. Celle-ci est un chronomètre de gymnase,
   qui ne s'enregistre nulle part. */
(function minuterieDuTiroir(){
  const n=$('#minTiroir'); if(!n) return;
  const id='tiroir';
  minuteries.set(id, {finA:0, reste:0, tourne:false, noeud:n});
  peindreMinuterie(id); verrou(id,false);
  n.addEventListener('click', e=>{
    const t=e.target.closest('button'); if(!t) return;
    const m=minuteries.get(id);
    if (t.dataset.go!==undefined){
      if (m.tourne){ m.tourne=false; verrou(id,false); }
      else if (m.reste>0){ m.finA=Date.now()+m.reste*1000; m.tourne=true; verrou(id,true); demarrerHorloge(); }
      peindreMinuterie(id);
    } else if (t.dataset.set!==undefined){
      poserTemps(id, +t.dataset.set);
    }
  });
  const sai=n.querySelector('.saisie');
  sai.addEventListener('change',()=>{
    const v=lireDuree(sai.value);
    if (v===null){ sai.value=mmss(minuteries.get(id).reste); return; }
    poserTemps(id, v);
  });
})();

/* ═════════ 5. UN SEUL SÉLECTEUR DE GROUPE : LES JETONS ═════════
   ⚠ IL Y EN AVAIT DEUX, ET ILS S'IGNORAIENT. Le menu « J'ÉCRIS DANS » de la
   barre jaune posait `ctxGroupe` — la clé sous laquelle le carnet de notes et
   les relevés du jour sont rangés ; les jetons colorés au-dessus de l'agenda
   ne servaient qu'à glisser un groupe dans une case. On pouvait donc avoir
   « 101 » en main et « 202 » dans le menu, sans qu'un pixel le dise.
   Le menu est retiré. Toucher un jeton fait les deux : il prend le groupe en
   main POUR le poser, et il devient le groupe courant. */
(function jetonsPosentLeContexte(){
  const base = peindrePalette;
  window.peindrePalette = peindrePalette = function(){
    base();
    const h=$('#palette'); if(!h) return;
    GRP().forEach((g,i)=>{
      const b=h.querySelector('.pastille-gr[data-gr="'+g.id+'"]');
      if (b && i===ctxGroupe) b.dataset.courant='1';
    });
    /* ⚠ EN PHASE DE CAPTURE, ET SUR LE CONTENEUR. Le jeton porte déjà un
       écouteur (proto-seance.js) qui, lui, REPEINT toute la palette : posé sur
       le jeton, notre écouteur s'exécuterait après, sur un noeud déjà détaché,
       et la marque « groupe courant » resterait un tour en retard. Le
       conteneur en capture voit le clic AVANT le jeton. */
    if (h.dataset.g3) return; h.dataset.g3='1';
    h.addEventListener('click', e=>{
      const b=e.target.closest('.pastille-gr'); if(!b) return;
      if (e.target.closest('.modif')) return;      /* le ✎ ouvre la fiche, pas le contexte */
      const i=GRP().findIndex(g=>g.id===b.dataset.gr);
      if (i<0 || i===ctxGroupe) return;
      ctxGroupe=i; ecrire('ctxGroupe', i);
      if (typeof peindreCarnet==='function') peindreCarnet();
    }, true);
  };
})();

/* Le carnet de notes lit `ctxGroupe`. Sans le menu déroulant, il lui faut sa
   propre rangée de jetons — les mêmes, au même endroit dans le regard. */
function jetonsGroupe(hote, apres){
  hote.innerHTML='';
  GRP().forEach((g,i)=>{
    const b=el('button','grp-puce'); b.type='button';
    b.style.background=g.coul; b.style.color=encreSur(g.coul);
    b.setAttribute('aria-current', String(i===ctxGroupe));
    if (i!==ctxGroupe) b.style.opacity='.55';
    b.textContent=(g.img?'':g.emo+' ')+g.nom;
    b.addEventListener('click',()=>{ ctxGroupe=i; ecrire('ctxGroupe',i);
      jetonsGroupe(hote, apres); if (apres) apres(); });
    hote.appendChild(b);
  });
}
(function jetonsDuCarnet(){
  const ec=$('#e-carnet'); if(!ec) return;
  const pan=ec.querySelector('.pan'); if(!pan) return;
  const box=el('div','pan pan--cyan');
  box.innerHTML='<h2>Quel groupe ?</h2><div class="grp-liste" id="carJetons"></div>';
  ec.insertBefore(box, pan);
  const maj=()=>{ if (typeof peindreCarnet==='function') peindreCarnet(); };
  jetonsGroupe($('#carJetons'), maj);
})();

/* ═════════ 6. LA LIGNE DE SESSION, SUR LA SEMAINE ═════════
   La même case que MES GROUPES › Mon plan de session — pas une copie : la
   MÊME clé `ed:sqw-<lundi>`. Écrire ici, c'est écrire là-bas. */
function ligneDeSessionSurLaSemaine(){
  const hote=$('#agendaHote .agenda'); if(!hote) return;
  if (hote.querySelector('.plan-sem')) return;
  const cle='sqw-'+agLundi;
  const d=el('div','plan-sem pap-cadre');
  d.innerHTML='<h4>📈 Cette semaine, j’enseigne…</h4>'
    +'<div class="plan-sem-corps"><div contenteditable data-k="'+cle+'" '
    +'data-vide="Ex. : basketball — le dribble, puis la passe"></div>'
    +'<button type="button" class="mini" data-va="e-groupes">VOIR TOUTE LA SESSION</button></div>';
  const tete=hote.querySelector('.agenda-tete');
  hote.insertBefore(d, tete ? tete.nextSibling : hote.firstChild);
  brancherEditables(d);
  /* écrit ici, relu là-bas : on repeint le plan de session à la sortie */
  d.querySelector('[contenteditable]').addEventListener('blur',()=>{
    if (typeof peindrePlanSession==='function') peindrePlanSession();
  });
}

/* ═════════ 7. TOUT SE REPEINT AU BON MOMENT ═════════ */
const _g3Agenda = peindreAgenda;
peindreAgenda = window.peindreAgenda = function(){
  _g3Agenda();
  ligneDeSessionSurLaSemaine();
};

(function suivreLeContexte(){
  const basePoser = window.poserContexte;
  window.poserContexte = poserContexte = function(iso, gr){
    basePoser(iso, gr);
    peindreAujourdhui();
    majBarreContexte();
  };
  const baseAller = window.allerA;
  window.allerA = allerA = function(id){
    baseAller(id);
    if (id==='e-aujourdhui') peindreAujourdhui();
    if (id==='e-groupes' && typeof peindrePlanSession==='function') peindrePlanSession();
    if (id==='e-carnet'){ const h=$('#carJetons'); if (h) jetonsGroupe(h, peindreCarnet); }
    /* ⚠ MOIS et ANNÉE n'étaient peints QU'UNE FOIS, au démarrage. Tant qu'ils
       vivaient au fond du calendrier on y arrivait juste après l'avoir réglé ;
       maintenant qu'ils ont leur porte, on peut y aller à tout moment et
       lire des jours-cycle périmés. */
    if (id==='e-mois'  && typeof peindreMois ==='function') peindreMois();
    if (id==='e-annee' && typeof peindreAnnee==='function') peindreAnnee();
    majBarreContexte();
  };
})();

/* ═════════ 8. LE DÉPART ═════════ */
/* ⚠ ET SUR LA VRAIE JOURNÉE. `ctxDate` était relu de la dernière session : on
   ouvrait « AUJOURD'HUI » sur le jeudi d'avant, sans que rien ne l'explique.
   La date reprend sa valeur du jour à chaque ouverture ; les flèches et le
   bouton AUJOURD'HUI restent là pour aller préparer un autre jour. */
if (ctxDate !== aujourdhuiISO()){ ctxDate = aujourdhuiISO(); ecrire('ctxDate', ctxDate); }
agLundi = lundiDe(ctxDate);
if (typeof peindrePlanSession==='function') peindrePlanSession();
peindrePalette();
peindreAgenda();
peindreAujourdhui();
/* ⚠ ON OUVRE TOUJOURS SUR AUJOURD'HUI, on ne rouvre PAS le dernier écran.
   Un prof ouvre l'app le matin, dans son gymnase : ce qu'il veut voir, c'est sa
   journée — pas les réglages d'horaire qu'il a fermés vendredi soir. */
allerA('e-aujourdhui');

/* ═════════ 8 bis. LA PORTE DE RETOUR PASSE EN PREMIER ═════════
   ⚠ `barreLiens()` insère à `children[1]` — juste après le titre — mais
   d'autres fichiers insèrent APRÈS lui, chacun au même endroit. Résultat :
   dans RÉGLAGES, « ← PLUS » se retrouvait au MILIEU de l'écran, sous le bloc
   de l'horaire. Une porte de sortie qu'il faut chercher n'est pas une porte de
   sortie. On la remet en tête, une fois tout le monde passé. */
(function retoursEnTete(){
  $$('button[data-va="e-plus"]').forEach(b=>{
    const barre=b.parentNode, ecran=barre.closest('.ecran');
    if (!ecran || barre===ecran) return;
    const titre=ecran.querySelector('h1.titre');
    if (titre && titre.nextSibling!==barre) ecran.insertBefore(barre, titre.nextSibling);
  });
})();

/* ═════════ 9. CONTRÔLE D'ACCÈS — EN DERNIER, CETTE FOIS ═════════
   ⚠ Les deux contrôles précédents tournaient AVANT que la barre à trois
   onglets et les tuiles de ⋯ PLUS aient posé leurs `data-va` : ils criaient à
   l'orphelin sur des écrans parfaitement joignables, et on avait appris à ne
   plus les lire. Celui-ci tourne quand tout est en place. */
(function controleAcces(){
  const cibles=new Set([...document.querySelectorAll('[data-va]')].map(b=>b.dataset.va));
  cibles.add('e-tests');            /* par la séance */
  cibles.add('e-aujourdhui');       /* par un en-tête de jour de MA SEMAINE */
  const orphelins=[...document.querySelectorAll('.ecran')].map(s=>s.id).filter(id=>!cibles.has(id));
  if (orphelins.length) console.warn('[proto] écrans sans porte :', orphelins);
  else console.info('[proto] tous les écrans ont une porte.');
})();
