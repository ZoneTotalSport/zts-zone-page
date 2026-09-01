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

/* ═════════ 2 ter. LE TITRE EST LA COMMANDE ═════════
   ⚠ LA BANDE JAUNE A ÉTÉ RETIRÉE. Elle disait, en petit et sur fond jaune, la
   date que le titre de l'écran annonçait déjà en gros trente pixels plus bas ;
   sa pastille de jour-cycle répétait la ligne d'explication ; et son bouton
   AUJOURD'HUI restait allumé même quand on ÉTAIT sur aujourd'hui, c'est-à-dire
   la plupart du temps.
   Le titre porte donc ses deux flèches, et le retour n'apparaît QUE lorsqu'on
   s'est éloigné — un bouton qui ne sert à rien neuf fois sur dix apprend à
   être ignoré. */
function majTitresNavigables(){
  const t=$('#aujTitre');
  if (t){
    const est = ctxDate===aujourdhuiISO();
    t.textContent = (est ? 'Aujourd’hui — ' : '') + jourLisible(ctxDate);
    const r=$('#aujRetour'); if (r) r.hidden = est;
  }
  const s2=$('#semTitre');
  if (s2){
    if (typeof agLundi!=='undefined' && !agLundi) agLundi = lundiDe(ctxDate);
    const est = agLundi===lundiDe(aujourdhuiISO());
    s2.textContent = 'Semaine du '+jourLisible(agLundi);
    const r=$('#semRetour'); if (r) r.hidden = est;
  }
}
(function fllechesDesTitres(){
  const jour = n => poserContexte(isoDe(new Date(dateDeIso(ctxDate).getTime()+n*UN_JOUR)));
  const semaine = n => {
    agLundi = isoDe(new Date(dateDeIso(agLundi).getTime()+n*UN_JOUR));
    peindreAgenda(); majTitresNavigables();
  };
  const brancher=(sel,f)=>{ const b=$(sel); if (b) b.addEventListener('click', f); };
  brancher('#aujPrec', ()=> jour(-1));
  brancher('#aujSuiv', ()=> jour(+1));
  brancher('#aujRetour', ()=> poserContexte(aujourdhuiISO()));
  brancher('#semPrec', ()=> semaine(-7));
  brancher('#semSuiv', ()=> semaine(+7));
  brancher('#semRetour', ()=>{ agLundi=lundiDe(aujourdhuiISO()); peindreAgenda(); majTitresNavigables(); });
})();

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
  /* ⚠ PASSE PAR `zoomActuel()`, JAMAIS PAR `lire('zoom')` EN DIRECT : c'est
     cette division qui transformait une clé aberrante en « téléphone » sur un
     écran de 1700 px. La validation vit dans proto-fusion.js. */
  const z=(typeof zoomActuel==='function' ? zoomActuel() : 200)/100;
  const utile = window.innerWidth / z;
  /* ⚠ LE P0 DU 31 AOÛT ÉTAIT ICI, ET C'ÉTAIT `utile < 760`.
     Le zoom par défaut du proto est 200 % (« lisible du gymnase »). La place
     utile valait donc innerWidth / 2 : sur une fenêtre de 1300 px, 650 — sous
     le seuil. Résultat : TOUTE fenêtre de moins de 1520 px basculait en mise en
     page téléphone, contenu comprimé dans une colonne étroite et fond vide à
     droite. Constaté par Joey deux fois dans son Chrome, entre 1200 et 1450 px.
     Le scroll n'était pas la cause : `data-etroit` valait déjà 1 au chargement.
     Il déclenchait seulement un `resize` — l'apparition de la barre de
     défilement — qui recalait la mise en page et rendait l'effondrement visible.

     Le seuil se compare maintenant à la LARGEUR RÉELLE DE LA FENÊTRE : un grand
     écran reste un grand écran, quel que soit le grossissement du texte.
     ⚠ Le second terme n'est pas décoratif — il garde le piège n° 18 fermé :
     une vraie tablette étroite doit rester en mise en page étroite même si le
     navigateur annonce une largeur confortable, et un zoom extrême (300 % sur
     1200 px = 400 px de place réelle) mérite aussi la colonne unique. */
  if (window.innerWidth > 0)
    document.documentElement.dataset.etroit = (window.innerWidth < 760 || utile < 420) ? '1' : '0';
  /* ⚠ `innerWidth` vaut 0 pendant une réémulation de fenêtre, et parfois au
     tout premier cadre : sans ce garde, l'app se croyait sur un téléphone.
     Et sans le rappel au cadre suivant, elle restait sur la mauvaise mise en
     page tant que personne ne redimensionnait la fenêtre. */
  else requestAnimationFrame(calerLaBarre);
}
calerLaBarre();
/* les deux boutons de taille naissent avec la barre : on leur dit tout de
   suite où ils en sont, sinon le − reste actif au premier cran. */
if (typeof majBoutonsTaille==='function') majBoutonsTaille();
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

  majTitresNavigables();
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
      /* même raison qu'en semaine : on vient voir SES ÉLÈVES */
      b.addEventListener('click',()=>{ ecrire('seVolet','presences'); ouvrirSeance(ctxDate, p.n); });
      r.appendChild(b);
      /* ⚠ LA ZONE D'ILLUSTRATIONS A CÉDÉ LA PLACE (31 août, capture 3 de Joey).
         Le grand carré « glisse une image ici » occupait la moitié de la case
         pour un geste qu'on fait en préparant, pas en enseignant. Les images
         vivent maintenant dans les blocs de la feuille « Planification
         journalière », chacune à côté de son activité. À sa place : les
         fonctions du cours, en petit, chacune ouvrant sa fenêtre. */
      r.appendChild(fonctionsDuCours(ctxDate, p.n, s, g));
    } else {
      const v=el('button','auj-vide'); v.type='button';
      v.innerHTML='<span class="plus">＋</span><span>poser un groupe ici</span>'
        +'<small>Juste pour cette date — l’année se règle dans '
        +'<b class="vers-horaire" role="link" tabindex="0">🕐 MON HORAIRE</b></small>';
      /* ⚠ le lien ouvre la porte d'un tap : il la NOMMAIT sans y mener */
      v.querySelector('.vers-horaire').addEventListener('click', ev=>{
        ev.stopPropagation(); allerA('e-horaire'); });
      v.title='Poser une exception pour cette date seulement';
      v.addEventListener('click',()=>{
        if (typeof choisirGroupePourCase==='function')
          choisirGroupePourCase(ctxDate, p.n, ()=> peindreAujourdhui());
        else { agLundi=lundiDe(ctxDate); allerA('e-accueil'); }
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

/* ═════════ LA BOÎTE À OUTILS, À L'HORIZONTALE ═════════
   Joey, 31 août : « enlève ça et mets à la place les apps qui sont flottantes
   sur le côté de la page d'accueil, ici, à l'horizontal ».

   Ce sont les sept outils du rail de zonetotalsport.ca — mêmes icônes, mêmes
   noms, même ordre : 🎲 Dé · 🎡 Roue · ⏱️ Chrono · ⏲️ Minuteur · 👥 Équipes ·
   📝 Message · 🏫 Mon école. Ils remplacent ▶ DÉMARRER LA SÉANCE, 📺 MODE
   TABLEAU BLANC et 🎲 JEUX, qui n'ont pas disparu : les deux premiers vivent
   maintenant DANS la séance, et le tiroir des jeux s'ouvre par ⏲️ MINUTEUR.

   ⚠ DEUX DES SEPT NE SONT PAS RÉÉCRITS, ILS OUVRENT CE QUI EXISTE DÉJÀ :
   · ⏱️ CHRONO   → l'écran TESTS, qui a le chronomètre à tours depuis toujours ;
   · ⏲️ MINUTEUR → le tiroir, qui porte la minuterie ET le buzzer.
   Écrire un deuxième chronomètre et un troisième compte à rebours aurait été
   exactement la redondance que tout ce chantier retire.

   ⚠ Roue et Équipes se PRÉREMPLISSENT avec les élèves du groupe courant. Sur
   le site, la liste est vide et il faut la taper : ici l'app connaît déjà le
   groupe, ce serait absurde de le redemander. */
function elevesDuGroupeCourant(){
  const g=(typeof GRP==='function') ? GRP()[ctxGroupe] : null;
  if (!g || !Array.isArray(g.eleves)) return [];
  return g.eleves.map(i=>ELEVES[i]).filter(Boolean);
}
function nomGroupeCourant(){
  const g=(typeof GRP==='function') ? GRP()[ctxGroupe] : null;
  return g ? g.nom : '';
}

/* ── 🎲 le dé ── */
function outilDe(){
  const c=ouvrirModale('🎲 Dé');
  c.innerHTML=`
    <div class="m-champ"><span class="m-lab">Combien de faces&nbsp;?</span>
      <div class="note-choix" id="deFaces"></div></div>
    <div class="outil-affiche" id="deVal">–</div>
    <div class="m-pied"><button type="button" class="m-valider" id="deGo">🎲 LANCER</button>
      <button type="button" class="mini" data-fermer>FERMER</button></div>`;
  let faces=lire('deFaces',6);
  const hf=$('#deFaces');
  [4,6,10,12,20].forEach(n=>{
    const b=el('button'); b.type='button';
    b.innerHTML='<span></span>'; b.firstChild.textContent=n+' faces';
    b.setAttribute('aria-pressed', String(n===faces));
    b.addEventListener('click',()=>{ faces=n; ecrire('deFaces',n);
      $$('#deFaces button').forEach(x=>x.setAttribute('aria-pressed','false'));
      b.setAttribute('aria-pressed','true'); });
    hf.appendChild(b);
  });
  let iv=null;
  $('#deGo').addEventListener('click',()=>{
    if (iv) return;                       /* ⚠ sans ce garde, deux clics = deux
                                             intervalles, et le dé s'emballe */
    const d=$('#deVal'); d.classList.add('roule');
    let n=0;
    iv=setInterval(()=>{
      d.textContent=Math.floor(Math.random()*faces)+1;
      if (++n>12){ clearInterval(iv); iv=null; d.classList.remove('roule'); }
    },80);
  });
  surFermetureModale(()=>{ if(iv) clearInterval(iv); iv=null; });
}

/* ── 🎡 la roue ── */
function outilRoue(){
  const c=ouvrirModale('🎡 Roue');
  const noms=elevesDuGroupeCourant();
  c.innerHTML=`
    <div class="aide-un-mot"><span class="emo">🎡</span>
      Les noms du groupe <b>${nomGroupeCourant()||'?'}</b> sont déjà là. Tu peux en ajouter ou en retirer.</div>
    <div class="m-champ"><label class="m-lab" for="roueNoms">Un nom par ligne</label>
      <textarea class="m-saisie" id="roueNoms" rows="6"></textarea></div>
    <div class="outil-affiche" id="roueVal">–</div>
    <div class="m-pied"><button type="button" class="m-valider" id="roueGo">🎡 TOURNER</button>
      <button type="button" class="mini" data-fermer>FERMER</button></div>`;
  $('#roueNoms').value = noms.join('\n');
  let iv=null;
  $('#roueGo').addEventListener('click',()=>{
    if (iv) return;
    const l=$('#roueNoms').value.split('\n').map(x=>x.trim()).filter(Boolean);
    if (!l.length){ $('#roueVal').textContent='Écris au moins un nom.'; return; }
    const d=$('#roueVal'); d.classList.add('roule');
    let n=0;
    iv=setInterval(()=>{
      d.textContent=l[Math.floor(Math.random()*l.length)];
      if (++n>18){ clearInterval(iv); iv=null; d.classList.remove('roule'); }
    },90);
  });
  surFermetureModale(()=>{ if(iv) clearInterval(iv); iv=null; });
}

/* ── 👥 les équipes ── */
function outilEquipes(){
  const c=ouvrirModale('👥 Équipes');
  c.innerHTML=`
    <div class="aide-un-mot"><span class="emo">👥</span>
      Les élèves du groupe <b>${nomGroupeCourant()||'?'}</b> sont déjà là.</div>
    <div class="m-champ"><label class="m-lab" for="eqNoms">Un nom par ligne</label>
      <textarea class="m-saisie" id="eqNoms" rows="6"></textarea></div>
    <div class="reg-ligne"><b>Combien d’équipes&nbsp;?</b>
      <input class="m-saisie" id="eqNb" type="number" min="2" max="8" value="2" style="width:90px"></div>
    <div class="m-pied"><button type="button" class="m-valider" id="eqGo">👥 FORMER LES ÉQUIPES</button>
      <button type="button" class="mini" data-fermer>FERMER</button></div>
    <div class="eq-res" id="eqRes"></div>`;
  $('#eqNoms').value = elevesDuGroupeCourant().join('\n');
  $('#eqGo').addEventListener('click',()=>{
    const noms=$('#eqNoms').value.split('\n').map(x=>x.trim()).filter(Boolean);
    const n=Math.max(2, Math.min(8, parseInt($('#eqNb').value,10)||2));
    const h=$('#eqRes'); h.innerHTML='';
    if (!noms.length){ h.textContent='Écris au moins un nom.'; return; }
    /* Fisher-Yates, comme sur le site */
    for (let i=noms.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1));
      [noms[i],noms[j]]=[noms[j],noms[i]]; }
    const eq=Array.from({length:n},()=>[]);
    noms.forEach((x,i)=> eq[i%n].push(x));
    eq.forEach((liste,i)=>{
      const b=el('div','eq-bloc');
      b.appendChild(el('h4',null,'Équipe '+(i+1)+' — '+liste.length));
      const ul=document.createElement('ul');
      liste.forEach(x=> ul.appendChild(el('li',null,x)));
      b.appendChild(ul); h.appendChild(b);
    });
  });
}

/* ── 📝 le message ── */
function outilMessage(){
  const c=ouvrirModale('📝 Message');
  c.innerHTML=`
    <div class="aide-un-mot"><span class="emo">📝</span>
      Ce qui doit se lire de loin — une consigne, un rappel, le nom d’une équipe.</div>
    <div class="m-champ"><label class="m-lab" for="msgTxt">Le message</label>
      <textarea class="m-saisie" id="msgTxt" rows="3"></textarea></div>
    <div class="reg-ligne"><b>Sa couleur</b><span class="grp" id="msgCouls"></span></div>
    <div class="outil-message" id="msgVue"></div>
    <div class="m-pied"><button type="button" class="mini" data-fermer>FERMER</button></div>`;
  const z=$('#msgTxt'); z.value=lire('outilMsg','');
  const v=$('#msgVue');
  let coul=lire('outilMsgCoul','#FFFC00');
  const maj=()=>{ v.textContent=z.value||'…'; v.style.color=coul; };
  z.addEventListener('input',()=>{ ecrire('outilMsg', z.value); maj(); });
  [['#FFFC00','Jaune'],['#00C2E8','Cyan'],['#A3FF00','Lime'],['#FF0061','Rose'],['#FFFFFF','Blanc']]
    .forEach(([hx,nom])=>{
      const b=el('button','mini',nom); b.type='button';
      b.style.background=hx; b.style.color=encreSur(hx);
      b.setAttribute('aria-pressed', String(hx===coul));
      b.addEventListener('click',()=>{ coul=hx; ecrire('outilMsgCoul',hx);
        $$('#msgCouls .mini').forEach(x=>x.setAttribute('aria-pressed','false'));
        b.setAttribute('aria-pressed','true'); maj(); });
      $('#msgCouls').appendChild(b);
    });
  maj();
}

/* ⚠ Les outils qui tournent (le dé, la roue) doivent s'arrêter quand on ferme
   la fenêtre — sinon l'intervalle continue de battre sur un noeud détaché. */
let _apresFermeture=null;
function surFermetureModale(f){ _apresFermeture=f; }
(function couperLesOutils(){
  const base=fermerModale;
  window.fermerModale = fermerModale = function(){
    if (_apresFermeture){ try{ _apresFermeture(); }catch(e){} _apresFermeture=null; }
    base();
  };
})();

const OUTILS = [
  ['🎲','Dé',        outilDe,      'Un dé de 4 à 20 faces'],
  ['🎡','Roue',      outilRoue,    'Pige un nom au hasard dans le groupe'],
  ['⏱️','Chrono',    ()=>allerA('e-tests'), 'Le chronomètre à tours, dans TESTS'],
  ['⏲️','Minuteur',  ()=>ouvrirTiroir(null), 'La minuterie et le buzzer, dans le tiroir'],
  ['👥','Équipes',   outilEquipes, 'Partage le groupe en équipes, au hasard'],
  ['📝','Message',   outilMessage, 'Un mot qui se lit de loin'],
  ['🏫','Mon école', ()=>allerA('e-reglages'), 'L’horaire, les jours-cycle, les étapes'],
];
/* ══════════════════════════════════════════════════════════════════════════
   LES FONCTIONS DU COURS, DANS LA CASE DU GROUPE (31 août, capture 3)
   Six petits boutons sous le cours : présences, linge, mot, évaluation, la
   feuille, et démarrer la séance. Chacun ouvre SA fenêtre — on ne traverse plus
   la fiche pour prendre les présences.
   ⚠ Un crochet ✓ s'allume dès qu'une fonction a servi pour ce cours-là : d'un
   coup d'œil sur sa journée, le prof voit ce qu'il a déjà fait.
   ⚠ La case elle-même est un <button> : ces boutons ne peuvent pas vivre
   DEDANS (un bouton dans un bouton n'est pas du HTML valide et le clic
   remonterait au mauvais). Ils sont donc posés à côté, dans la ligne de la
   période. */
function fonctionsDuCours(iso, per, s, g){
  const z=el('div','auj-fonc');
  const pres=Object.values(s.pres||{});
  const ouvrir=(volet)=>{ ecrire('seVolet', volet); ouvrirSeance(iso, per); };

  const bouton=(cls, emo, lab, fait, quoi, action)=>{
    const b=el('button','fonc'+(fait?' fonc--fait':'')+(cls?' '+cls:'')); b.type='button';
    b.innerHTML='<span class="e"></span><span class="l"></span>';
    b.querySelector('.e').textContent=emo;
    b.querySelector('.l').textContent=lab;
    if (fait) b.appendChild(el('span','fonc-ok','✔'));
    b.title=quoi+(fait?' — déjà fait pour ce cours':'');
    b.addEventListener('click', ev=>{ ev.stopPropagation(); action(); });
    z.appendChild(b); return b;
  };

  bouton('', '✅', 'Présences', pres.length>0,
         'Qui est là', ()=>ouvrir('presences'));
  bouton('', '👕', 'Linge', pres.some(x=>x==='sans'),
         'Qui a son linge', ()=>ouvrir('presences'));
  bouton('', '💬', 'Mot', !!(s.message||'').trim(),
         'Un mot sur ce cours', ()=>ouvrir('message'));

  /* ⚠ ÉVALUATION EST UN MENU, PAS UNE PORTE : Joey veut choisir son gabarit et
     se mettre à noter, sans écran intermédiaire. */
  const ev=bouton('fonc--menu', '📝', 'Évaluation', (s.evalCrits||[]).length>0,
                  'Choisir un gabarit et noter', ()=>{});
  const menu=el('div','fonc-menu'); menu.hidden=true;
  (typeof GABARITS!=='undefined' ? GABARITS : []).forEach(x=>{
    const b=el('button'); b.type='button';
    b.innerHTML='<span></span><small></small>';
    b.firstChild.textContent=x.nom; b.lastChild.textContent=x.quoi;
    b.addEventListener('click', e2=>{ e2.stopPropagation();
      ecrire('seVolet','evaluation'); ouvrirSeance(iso, per);
      if (typeof majSeance==='function') majSeance(y=>y.evalCrits=[...x.crits]);
    });
    menu.appendChild(b);
  });
  const perso=el('button','fonc-menu-perso','✎ Mes propres critères'); perso.type='button';
  perso.addEventListener('click', e2=>{ e2.stopPropagation(); ouvrir('evaluation'); });
  menu.appendChild(perso);
  ev.addEventListener('click', e2=>{ e2.stopPropagation();
    menu.hidden=!menu.hidden; ev.setAttribute('aria-expanded', String(!menu.hidden)); });
  ev.setAttribute('aria-expanded','false');
  z.appendChild(menu);

  bouton('fonc--large', '📋', 'Voir la planification',
         (s.etapes||[]).some(e=>e.titre||e.desc),
         'La feuille de planification journalière', ()=>ouvrir('cours'));

  /* ▶ DÉMARRER LA SÉANCE vit ici depuis le 31 août : il a quitté le haut de
     MA JOURNÉE, et c'est lui qui fait basculer la fiche en mode « suivre ». */
  const ici=(lire('liveOu','')===iso+'|'+per);
  const enCours=!!lire('live',null) && ici;
  const live=bouton('fonc--live'+(enCours?' fonc--live-on':''), enCours?'■':'▶',
                    enCours?'Arrêter la séance':'Démarrer la séance', false,
                    enCours?'Arrêter le cours en cours':'Commencer ce cours', ()=>{
    if (enCours){ ecrire('live', null); ecrire('liveOu',''); }
    else { ecrire('live', Date.now()); ecrire('liveOu', iso+'|'+per); }
    if (typeof majModeSeance==='function') majModeSeance();
    peindreAujourdhui();
  });
  if (enCours) live.classList.add('fonc--fait');
  return z;
}

/* ⚠ LE RAIL D'OUTILS A QUITTÉ MA JOURNÉE (31 août, demande de Joey). Les sept
   outils — Dé, Roue, Chrono, Minuteur, Équipes, Message, Mon école — vivent
   maintenant dans le menu déroulant 🔗 MES AUTRES APPS de la barre du haut, à
   côté des apps du site. MA JOURNÉE ne montre plus que la journée elle-même.
   `OUTILS` reste défini ci-dessus : c'est proto-fusion.js qui le lit pour
   garnir le menu. Aucun outil n'est perdu. */

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
/* ═════════ TOUCHER UN GROUPE ═════════
   ⚠ « QUAND JE PÈSE UN GROUPE IL N'Y A RIEN QUI SE PASSE. » Il se passait
   quelque chose — le groupe devenait courant et se retrouvait « en main » —
   mais l'indice disait « touche une case pour y poser 202 », et **il n'y a de
   cases que sur MA SEMAINE**. Sur MA JOURNÉE, MON MOIS, MON ANNÉE, le geste
   armait un dépôt impossible : un liseré, une phrase, et un cul-de-sac.

   Le même geste fait donc la seule chose utile là où l'on est :
   · sur 🗓️ MA SEMAINE → on prend le groupe EN MAIN pour le poser dans une
     case (c'est le geste tactile, sans souris, qu'il faut garder) ;
   · PARTOUT AILLEURS → on OUVRE le groupe : ses élèves, et son cours du jour
     s'il en a un. C'est ce que Joey a décrit — « les groupes servent à
     afficher les élèves, prendre les présences, évaluer, prendre des notes ». */
function ouvrirGroupe(id){
  const g=grpDe(id); if(!g) return;
  mgGroupe=id; ecrire('mgGroupe', id);      /* le dossier d'élève lit cette clé */

  const corps=ouvrirModale('Groupe '+g.nom);
  corps.innerHTML='<div class="se-tete" id="grTete"></div>'
    +'<div id="grCours"></div>'
    +'<div class="pres-grille" id="grEleves"></div>'
    +'<div class="m-pied" id="grPied"></div>';

  const tete=$('#grTete');
  tete.style.background=g.coul; tete.style.color=encreSur(g.coul);
  const ph=el('div','se-photo');
  if (g.img){ const im=document.createElement('img'); im.src=g.img; im.alt=''; ph.appendChild(im); }
  else ph.appendChild(el('span','emo', g.emo));
  tete.appendChild(ph);
  const qui=el('div','se-qui');
  qui.appendChild(el('h3',null,'Groupe '+g.nom));
  qui.appendChild(el('div','quand',(g.eleves||[]).length+' élève'
    +((g.eleves||[]).length>1?'s':'')+' · '+jourLisible(ctxDate)));
  tete.appendChild(qui);

  /* ── son cours du jour affiché, s'il y en a un ── */
  const hc=$('#grCours');
  const duJour=seancesDuJour(ctxDate).filter(x=> x.s && x.s.gr===id);
  if (duJour.length){
    const aide=el('div','aide-un-mot');
    aide.innerHTML='<span class="emo">✅</span>Ce groupe a '
      +(duJour.length>1 ? duJour.length+' cours' : 'un cours')+' ce jour-là. '
      +'Ouvre-le pour les présences, l’évaluation et les notes.';
    hc.appendChild(aide);
    const z=el('div','gr-cours-liste');
    duJour.forEach(({per})=>{
      const b=el('button','m-valider','✅ OUVRIR LE COURS — PÉRIODE '+per); b.type='button';
      b.addEventListener('click',()=>{ fermerModale();
        ecrire('seVolet','presences'); ouvrirSeance(ctxDate, per); });
      z.appendChild(b);
    });
    hc.appendChild(z);
  } else {
    const v=el('div','aide-un-mot');
    v.innerHTML='<span class="emo">📅</span>Aucun cours de ce groupe le '
      +jourLisible(ctxDate)+'. Ses élèves sont quand même là — touche un visage '
      +'pour voir son année.';
    hc.appendChild(v);
  }

  /* ── ses élèves, comme dans MES GROUPES ── */
  const he=$('#grEleves');
  if (!(g.eleves||[]).length){
    he.appendChild(el('div','aide-un-mot',
      '👆 Ce groupe n’a pas encore d’élèves. Le ✎ de son onglet permet d’en ajouter.'));
  }
  (g.eleves||[]).forEach(i=>{
    const d=(typeof dossierEleve==='function') ? dossierEleve(i) : {absences:[],oublis:[],notes:[]};
    const b=el('button','pres-el'); b.type='button';
    const im=document.createElement('img'); im.src=visageDe(i); im.alt=''; b.appendChild(im);
    b.appendChild(el('div','nom', ELEVES[i]));
    const e=el('div','etat');
    const bouts=[];
    if (d.absences.length) bouts.push('✗'+d.absences.length);
    if (d.oublis.length)   bouts.push('🚫'+d.oublis.length);
    if (d.notes.length)    bouts.push('📝'+d.notes.length);
    e.textContent = bouts.length ? bouts.join(' ') : '— rien à signaler';
    b.appendChild(e);
    b.title=ELEVES[i]+' — '+d.absences.length+' absence(s), '+d.oublis.length+' oubli(s) de linge';
    b.addEventListener('click',()=> ouvrirDossier(i));
    he.appendChild(b);
  });

  const pied=$('#grPied');
  const mod=el('button','mini','✎ PERSONNALISER LE GROUPE'); mod.type='button';
  mod.addEventListener('click',()=>{ fermerModale(); modifierGroupe(id); });
  const tout=el('button','mini','👥 MES GROUPES'); tout.type='button';
  tout.addEventListener('click',()=>{ fermerModale(); allerA('e-groupes'); });
  const fermer=el('button','mini mini--rose','FERMER'); fermer.type='button';
  fermer.addEventListener('click', fermerModale);
  pied.appendChild(mod); pied.appendChild(tout); pied.appendChild(fermer);
}

(function jetonsPosentLeContexte(){
  const base = peindrePalette;
  window.peindrePalette = peindrePalette = function(){
    base();
    const h=$('#horPalette') || $('#ongletsGr') || $('#palette'); if(!h) return;
    GRP().forEach((g,i)=>{
      const b=h.querySelector('.pastille-gr[data-gr="'+g.id+'"]');
      if (b && i===ctxGroupe) b.dataset.courant='1';
    });
    /* ⚠ EN PHASE DE CAPTURE, ET SUR LE CONTENEUR. Le jeton porte déjà un
       écouteur (proto-seance.js) qui, lui, REPEINT toute la palette : posé sur
       le jeton, notre écouteur s'exécuterait après, sur un noeud déjà détaché.
       Le conteneur en capture voit le clic AVANT le jeton — et peut donc aussi
       l'EMPÊCHER d'arriver, ce dont on a besoin hors de MA SEMAINE. */
    if (h.dataset.g3) return; h.dataset.g3='1';
    h.addEventListener('click', e=>{
      const b=e.target.closest('.pastille-gr'); if(!b) return;
      if (e.target.closest('.modif')) return;      /* le ✎ ouvre la fiche, pas le contexte */
      const i=GRP().findIndex(g=>g.id===b.dataset.gr);
      if (i<0) return;
      if (i!==ctxGroupe){
        ctxGroupe=i; ecrire('ctxGroupe', i);
        if (typeof peindreCarnet==='function') peindreCarnet();
      }
      /* MA SEMAINE et MON HORAIRE : on le prend en main pour le poser */
      const ec=lire('ecran','e-aujourdhui');
      if (ec==='e-accueil' || ec==='e-horaire') return;
      /* ailleurs, « prendre en main » n'a aucune case où aboutir */
      e.stopPropagation(); e.preventDefault();
      grpEnMain=null;
      peindrePalette();
      ouvrirGroupe(b.dataset.gr);
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

/* ═════════ 6 bis. LES GROUPES DANS MON MOIS ET MON ANNÉE ═════════
   Joey, 31 août : « les groupes une fois placés dans l'app servent à afficher
   les élèves, prendre les présences, évaluer, prendre des notes — et ça
   s'affiche comme un popup dans ma journée, ma semaine, mon mois. »

   ⚠ MON MOIS ET MON ANNÉE NE CONNAISSAIENT PAS LES GROUPES DU TOUT. Ces deux
   écrans ne lisaient que le calendrier scolaire — jours-cycle, congés,
   pédagogiques, la note du jour. Ils ignoraient les séances, donc l'essentiel
   de ce que le prof a saisi. On y pose maintenant les mêmes pastilles
   colorées, et elles ouvrent la MÊME fenêtre que dans MA JOURNÉE : une seule
   façon d'entrer dans un cours, quel que soit l'écran d'où l'on vient.

   ⚠ On lit les clés du stockage plutôt que de parcourir les périodes de
   l'horaire : une séance posée sur une période supprimée depuis resterait
   invisible autrement — et elle existe pourtant. */
function seancesDuJour(iso){
  /* ⚠ ON NE PEUT PLUS SCANNER LES CLÉS. Depuis que l'horaire est un patron
     (proto-g4.js), une séance peut exister sans avoir jamais été écrite : elle
     est tirée du patron au moment où on la demande. Un balayage de
     `localStorage` ne verrait que les journées déjà consignées — c'est-à-dire
     presque aucune, en début d'année. On passe donc par `seanceDe()`, qui sait
     rendre les deux. */
  const out=[];
  (typeof periodesAgenda==='function' ? periodesAgenda() : [])
    .filter(p=>!p.pause)
    .forEach(p=>{ const s=seanceDe(iso, p.n); if (s) out.push({per:p.n, s}); });
  return out.sort((a,b)=>a.per-b.per);
}
/* une pastille de groupe, la même partout */
function pastilleSeance(iso, per, s, avecPeriode){
  const g=grpDe(s && s.gr)||{nom:'?',coul:'#9E9E9E',emo:'❓',img:''};
  const b=el('button','gr-pastille'); b.type='button';
  b.style.background=g.coul; b.style.color=encreSur(g.coul);
  b.textContent=(avecPeriode? 'P'+per+' ' : '')+g.nom;
  b.title='Groupe '+g.nom+' — '+jourLisible(iso)+', période '+per
        +'. Ouvre les élèves, les présences et l’évaluation.';
  b.addEventListener('click', ev=>{
    ev.stopPropagation();
    poserContexte(iso);
    ecrire('seVolet','presences');
    ouvrirSeance(iso, per);
  });
  return b;
}

function groupesDansLeMois(){
  $$('#moisGrille .mois-case[data-iso]').forEach(c=>{
    const iso=c.dataset.iso;
    const l=seancesDuJour(iso); if (!l.length) return;
    const z=el('div','mois-grs');
    l.forEach(({per,s})=> z.appendChild(pastilleSeance(iso, per, s, false)));
    /* avant la note : ce qu'on a enseigné passe devant ce qu'on s'est écrit */
    const note=c.querySelector('.note');
    c.insertBefore(z, note || null);
  });
}

/* ⚠ PAS DE PASTILLES DE GROUPES DANS MON ANNÉE — décision de Joey, 31 août.
   Le gabarit papier « Ma planification annuelle » n'en porte pas : une ligne
   de calendrier, une rangée « Compétence · Moyen d'action · Activité », rien
   d'autre. La bande annonçait les groupes de la semaine ; elle cassait
   l'alignement qu'on venait de poser et n'était pas demandée.
   `groupesDansLeMois()` reste : MON MOIS garde ses pastilles, elles y sont
   posées dans la case du jour et n'y gênent rien. */

/* ⚠ Les deux écrans se repeignent entièrement à chaque visite : on se greffe
   APRÈS, sinon les pastilles seraient balayées au premier rafraîchissement. */
(function groupesDansLesDeuxVues(){
  if (typeof peindreMois==='function'){
    const base=peindreMois;
    window.peindreMois = peindreMois = function(){ base(); groupesDansLeMois(); };
  }
})();

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
    majTitresNavigables();
    majBarreContexte();
  };
  const baseAller = window.allerA;
  window.allerA = allerA = function(id){
    baseAller(id);
    /* l'écran courant est publié sur `body` : le CSS peut alors montrer la
       consigne de glisser-déposer sur MA SEMAINE et la taire ailleurs, sans
       qu'aucun JS n'ait à savoir de quoi le style a besoin. */
    document.body.dataset.ecran = id;
    if (id==='e-aujourdhui') peindreAujourdhui();
    if (id==='e-groupes' && typeof peindrePlanSession==='function') peindrePlanSession();
    if (id==='e-carnet'){ const h=$('#carJetons'); if (h) jetonsGroupe(h, peindreCarnet); }
    /* ⚠ MOIS et ANNÉE n'étaient peints QU'UNE FOIS, au démarrage. Tant qu'ils
       vivaient au fond du calendrier on y arrivait juste après l'avoir réglé ;
       maintenant qu'ils ont leur porte, on peut y aller à tout moment et
       lire des jours-cycle périmés. */
    if (id==='e-mois'  && typeof peindreMois ==='function') peindreMois();
    if (id==='e-annee' && typeof peindreAnnee==='function') peindreAnnee();
    majTitresNavigables();
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
majTitresNavigables();
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
