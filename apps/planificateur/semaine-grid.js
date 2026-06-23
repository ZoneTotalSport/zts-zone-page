/* ════════════════════════════════════════════════════════════════════
   SemaineGrid — grille hebdo riche (périodes×jours, activités, banque
   ÉP/Camp/SDG, minuterie, médias). Module autonome réutilisé par :
   - semaine.html      (persistance localStorage)
   - le moteur app.js  (persistance Firestore + miroir localStorage)
   Contrat : SemaineGrid.mount(rootEl, opts)
     opts.scope        namespace localStorage (déf. 'semaine')
     opts.metier       métier initial ep|camp|sdg
     opts.lang         'fr'|'en'
     opts.weekStart    lundi ISO initial
     opts.dataPath     chemin des JSON banque (déf. '../planification/data/')
     opts.imgPath      chemin des mascottes  (déf. 'img/')
     opts.load(ws)     async → {structure, cells} | null   (sinon localStorage)
     opts.save(ws,doc) async                                (sinon localStorage)
     opts.onWeekChange(ws)  callback optionnel
   ════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

const CSS = `
@font-face{font-family:'Luckiest Guy';src:url('/fonts/LuckiestGuy-Regular.ttf') format('truetype');font-display:swap}
.sem-root{font-family:'Fredoka',system-ui,sans-serif;font-weight:600;color:var(--ink);
  --jaune:#F2FF00;--jaune-d:#D9E600;--cyan:#19C3FF;--vert:#4ED11A;--orange:#FF7A00;--rose:#FF2D7E;
  --gris:#E2E6EC;--gris-d:#AEB7C2;--gris-dd:#8A95A3;--ink:#0a0a0a;--bord:5px solid var(--ink);
  --bg-base:var(--cyan);--bg-stripe:var(--jaune);
  display:block;padding:24px;border-radius:24px;
  background:var(--bg-base);
  background-image:repeating-conic-gradient(from 0deg at 88% 96%,var(--bg-stripe) 0deg 7deg,transparent 7deg 14deg)}
.sem-root *{box-sizing:border-box}
/* Fond unifié bleu+jaune pour les 3 métiers (le métier ne change que perso + banque) */
.sem-root .sheet{max-width:1500px;margin:0 auto;background:#fff;border:var(--bord);border-radius:38px;box-shadow:14px 14px 0 rgba(0,0,0,.85);padding:clamp(16px,2.5vw,34px);position:relative}
/* Perso EN AVANT + interactif : survol = anime + bulle de salutation par métier */
.sem-root .sheet-mascotte{position:absolute;top:-14px;left:6px;width:clamp(96px,10vw,160px);aspect-ratio:3/4;background-size:contain;background-repeat:no-repeat;background-position:top center;cursor:pointer;z-index:30;filter:drop-shadow(4px 5px 0 rgba(0,0,0,.55));transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
.sem-root .sheet-mascotte:hover{transform:translateY(-8px) rotate(-5deg) scale(1.07);animation:sem-wiggle .5s ease-in-out .25s 1}
@keyframes sem-wiggle{0%,100%{transform:translateY(-8px) rotate(-5deg) scale(1.07)}25%{transform:translateY(-8px) rotate(4deg) scale(1.07)}75%{transform:translateY(-8px) rotate(-7deg) scale(1.07)}}
.sem-root .sheet-mascotte::after{content:'';position:absolute;left:96%;top:6px;opacity:0;transform:translateX(-10px) scale(.85);transform-origin:left center;transition:opacity .2s,transform .2s;pointer-events:none;white-space:nowrap;
  font-family:'Fredoka',system-ui,sans-serif;font-weight:700;font-size:1.05rem;color:var(--ink);background:#fff;border:4px solid var(--ink);border-radius:16px;padding:9px 14px;box-shadow:5px 5px 0 var(--ink)}
.sem-root .sheet-mascotte:hover::after{opacity:1;transform:translateX(0) scale(1)}
.sem-root[data-metier="ep"]   .sheet-mascotte{background-image:url('img/mascotte-ep.png')}
.sem-root[data-metier="camp"] .sheet-mascotte{background-image:url('img/mascotte-camp.png')}
.sem-root[data-metier="sdg"]  .sheet-mascotte{background-image:url('img/mascotte-sdg.png')}
.sem-root[data-metier="ep"]   .sheet-mascotte::after{content:'Salut à toi, le prof ! 🏀'}
.sem-root[data-metier="camp"] .sheet-mascotte::after{content:'Allô à toi, l’animateur ! ⛺'}
.sem-root[data-metier="sdg"]  .sheet-mascotte::after{content:'Coucou à toi ! 🧸'}
@media(max-width:900px){.sem-root .sheet-mascotte{display:none}}
.sem-root .sheet__title{font-family:'Luckiest Guy',cursive;text-align:center;font-size:clamp(2.4rem,5.5vw,4rem);color:var(--jaune);-webkit-text-stroke:2px var(--ink);letter-spacing:1px;margin:0 0 4px}
.sem-root .sheet__week{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.sem-root .sheet__week label{font-family:'Bangers',cursive;color:var(--cyan);-webkit-text-stroke:1px var(--ink);font-size:clamp(1.1rem,2.5vw,1.7rem)}
.sem-root .sheet__week input{font-family:'Fredoka';font-weight:700;font-size:1.1rem;padding:8px 14px;border:var(--bord);border-radius:14px;box-shadow:4px 4px 0 var(--ink)}
.sem-root .toolbar{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;align-items:center;margin-bottom:14px}
.sem-root .metier-sw{display:flex;border:var(--bord);border-radius:16px;box-shadow:5px 5px 0 var(--ink);overflow:hidden}
.sem-root .metier-sw button{font-family:'Luckiest Guy','Bangers',cursive;cursor:pointer;font-size:1.15rem;letter-spacing:.5px;color:var(--ink);border:none;border-right:3px solid var(--ink);background:#fff;padding:13px 20px}
.sem-root .metier-sw button:last-child{border-right:none}
.sem-root .metier-sw button.on{background:var(--jaune)}
.sem-root .btn{font-family:'Luckiest Guy','Bangers',cursive;font-size:1.05rem;letter-spacing:.5px;cursor:pointer;color:var(--ink);padding:13px 24px;border:var(--bord);border-radius:16px;box-shadow:5px 5px 0 var(--ink);background:var(--gris);transition:transform .1s,box-shadow .1s}
.sem-root .btn:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--ink);background:#eef1f5}
.sem-root .btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 var(--ink)}
.sem-root .btn--print{background:var(--gris-dd);color:#fff}
.sem-root .btn--big{background:var(--vert);color:#fff;font-size:1.2rem;padding:14px 28px}
.sem-root .stepper{display:flex;align-items:center;gap:8px;font-family:'Luckiest Guy','Bangers',cursive;font-size:1.05rem;letter-spacing:.5px;background:var(--gris);border:var(--bord);border-radius:16px;box-shadow:5px 5px 0 var(--ink);padding:8px 14px}
.sem-root .stepper b{min-width:28px;text-align:center;font-size:1.6rem;color:var(--cyan);-webkit-text-stroke:.5px var(--ink)}
.sem-root .stepper button{font-family:'Luckiest Guy','Bangers',cursive;cursor:pointer;width:42px;height:42px;border:3px solid var(--ink);border-radius:10px;background:#fff;box-shadow:2px 2px 0 var(--ink);font-size:1.5rem}
.sem-root .stepper button:hover{background:var(--jaune)}
.sem-root .grid{display:grid;gap:10px;align-items:stretch}
.sem-root .rail{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:4px;border:var(--bord);border-radius:18px;box-shadow:5px 5px 0 var(--ink);padding:8px 6px;background:#fff}
.sem-root .rail__lbl{font-family:'Luckiest Guy','Bangers',cursive;font-size:clamp(1rem,1.6vw,1.4rem);color:var(--cyan);-webkit-text-stroke:.4px var(--ink);text-shadow:2px 2px 0 var(--ink);border:none;text-align:center;width:100%;background:transparent}
.sem-root .rail.alt .rail__lbl{color:var(--jaune-d)}
.sem-root .rail__hrs{display:flex;align-items:center;gap:3px;font-family:'Fredoka';font-weight:700;font-size:1rem;color:#555}
.sem-root .rail__hrs input{width:56px;text-align:center;border:2px dashed #bbb;border-radius:8px;font-family:'Fredoka';font-weight:700;font-size:1rem;padding:4px}
.sem-root .rail__ctrl{display:flex;gap:3px;margin-top:3px}
.sem-root .rail__ctrl button{cursor:pointer;width:26px;height:26px;border:2px solid var(--ink);border-radius:8px;background:#fff;box-shadow:1px 1px 0 var(--ink);font-size:.8rem;display:flex;align-items:center;justify-content:center;padding:0}
.sem-root .rail__ctrl button:hover{background:var(--jaune)}.sem-root .rail__ctrl .del:hover{background:var(--rose);color:#fff}
.sem-root .rail--break{grid-column:1 / -1;background:var(--jaune);border-radius:14px;flex-direction:row;gap:10px;flex-wrap:wrap}
.sem-root .rail--break .rail__lbl{color:var(--ink);-webkit-text-stroke:0;text-shadow:none;font-size:clamp(1.4rem,2.4vw,2rem);width:auto}
.sem-root .addbar{grid-column:1 / -1;display:flex;gap:12px;justify-content:center;padding:4px}
.sem-root .addbar button{font-family:'Luckiest Guy','Bangers',cursive;cursor:pointer;font-size:.9rem;border:var(--bord);border-radius:14px;box-shadow:4px 4px 0 var(--ink);padding:8px 16px;background:#fff}
.sem-root .addbar button:hover{background:var(--jaune);transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--ink)}
.sem-root .day-hd{border:var(--bord);border-radius:20px;box-shadow:6px 6px 0 var(--ink);overflow:hidden;background:#fff}
.sem-root .day-hd__name{font-family:'Luckiest Guy',cursive;text-align:center;font-size:clamp(1.5rem,2.8vw,2.2rem);letter-spacing:.5px;padding:10px;display:flex;align-items:center;justify-content:center;gap:8px;
  background:linear-gradient(135deg,#5fd6ff 0%,var(--cyan) 45%,#0a96d8 100%);color:#fff;text-shadow:2px 2px 0 var(--ink)}
.sem-root .day-hd__name input[type=checkbox]{width:22px;height:22px}
.sem-root .day-hd__date{width:100%;text-align:center;font-family:'Bangers',cursive;font-size:clamp(1.4rem,2.8vw,2.2rem);letter-spacing:.5px;border:none;border-top:4px solid var(--ink);padding:10px 6px;background:#fff;color:var(--orange)}
.sem-root .slot{border:var(--bord);border-radius:18px;box-shadow:5px 5px 0 var(--ink);background:#fff;padding:8px;display:flex;flex-direction:column;gap:6px;min-height:120px;transition:transform .12s,box-shadow .12s,border-color .12s}
.sem-root .slot:hover{transform:translate(-3px,-3px);box-shadow:9px 9px 0 var(--ink);border-color:var(--cyan)}
.sem-root .slot--off{background:#f1f5f9;border-style:dashed}
.sem-root .slot--off:hover{border-color:var(--gris-dd)}
.sem-root .slot__row{display:flex;flex-direction:column;gap:2px}
.sem-root .slot__lbl{font-family:'Luckiest Guy','Bangers',cursive;color:var(--cyan);-webkit-text-stroke:.4px var(--ink);text-shadow:2px 2px 0 var(--ink);font-size:1.15rem;letter-spacing:.5px;white-space:nowrap}
.sem-root .slot input.g{font-family:'Fredoka';font-weight:600;border:none;border-bottom:2px dashed #bbb;padding:3px 4px;font-size:1.3rem;width:100%}
.sem-root .slot input:focus,.sem-root .rail__lbl:focus,.sem-root .rail__hrs input:focus{outline:2px solid var(--cyan);border-radius:6px;background:#fbfeff}
.sem-root .acts__hd{display:flex;align-items:center;justify-content:space-between;gap:6px}
.sem-root .act-pm{display:flex;gap:4px}
.sem-root .act-pm button{font-family:'Bangers',cursive;cursor:pointer;width:34px;height:34px;border:3px solid var(--ink);border-radius:9px;background:var(--vert);color:#fff;box-shadow:2px 2px 0 var(--ink);font-size:1.3rem}
.sem-root .act-pm button.minus{background:#fff;color:var(--ink)}
.sem-root .act-pm button:hover{transform:translate(-1px,-1px)}
.sem-root .acts__list{display:flex;flex-direction:column;gap:5px;margin-top:4px}
.sem-root .act-chip{display:flex;align-items:center;gap:6px;width:100%;text-align:left;cursor:pointer;font-family:'Fredoka';font-weight:700;font-size:1.18rem;background:#FFFCE0;border:3px solid var(--ink);border-radius:11px;box-shadow:3px 3px 0 var(--ink);padding:6px 9px;transition:transform .1s}
.sem-root .act-chip:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--ink);background:#fff7c2}
.sem-root .act-chip .t{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sem-root .act-chip .dur{font-family:'Bangers',cursive;font-size:.95rem;color:var(--orange);background:#fff;border:2px solid var(--ink);border-radius:8px;padding:1px 6px}
.sem-root .act-chip.is-done{filter:grayscale(1);opacity:.7;background:#e9e9e9}
.sem-root .act-chip .chk{flex:none;width:30px;height:30px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:'Bangers',cursive;font-size:1.25rem;color:#fff;border:2.5px solid var(--ink);border-radius:8px;background:#fff;box-shadow:1px 1px 0 var(--ink);transition:background .12s,transform .12s}
.sem-root .act-chip .chk:hover{background:var(--vert);transform:scale(1.18)}
.sem-root .act-chip.is-done .chk{background:var(--vert)}
.sem-root .act-chip .fait{font-family:'Bangers',cursive;font-size:.95rem;color:#fff;background:var(--vert);border:2px solid var(--ink);border-radius:8px;padding:1px 7px}
.sem-root .act-chip .rm{cursor:pointer;color:var(--rose);font-weight:900}
.sem-root .act-chip .lien{flex:none;font-size:.85rem}
.sem-root .act-empty{font-family:'Fredoka';font-weight:600;font-size:1.05rem;opacity:.5}
.sem-modal{position:fixed;inset:0;z-index:100000;background:rgba(10,10,30,.82);display:none;align-items:center;justify-content:center;padding:18px;font-family:'Fredoka',system-ui,sans-serif;color:#0a0a0a;
  --jaune:#F2FF00;--cyan:#19C3FF;--vert:#4ED11A;--orange:#FF7A00;--rose:#FF2D7E;--gris:#E2E6EC;--gris-dd:#8A95A3;--ink:#0a0a0a;--bord:5px solid var(--ink)}
.sem-modal[data-metier="camp"]{--cyan:#ff6a00;--jaune:#c026ff}
.sem-modal[data-metier="sdg"]{--cyan:#39ff14;--jaune:#ff2dac}
.sem-modal.open{display:flex}
.sem-modal *{box-sizing:border-box}
.sem-modal .modal__box{background:#fff;border:var(--bord);border-radius:26px;box-shadow:12px 12px 0 rgba(0,0,0,.6);max-width:920px;width:100%;max-height:92vh;overflow:auto;padding:20px;position:relative}
.sem-modal .modal__x{position:absolute;top:12px;right:12px;font-family:'Bangers',cursive;font-size:1.1rem;cursor:pointer;background:var(--rose);color:#fff;border:3px solid var(--ink);border-radius:50%;width:46px;height:46px;box-shadow:3px 3px 0 var(--ink)}
.sem-modal .f-lbl{font-family:'Luckiest Guy','Bangers',cursive;color:var(--cyan);-webkit-text-stroke:.4px var(--ink);text-shadow:2px 2px 0 var(--ink);font-size:1rem;margin:12px 0 4px;display:block}
.sem-modal .f-in,.sem-modal .f-ta{width:100%;font-family:'Fredoka';font-weight:600;font-size:1rem;border:3px solid var(--ink);border-radius:12px;padding:10px 12px;box-shadow:3px 3px 0 var(--ink)}
.sem-modal .f-ta{min-height:80px;resize:vertical}
.sem-modal .f-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.sem-modal .medias{display:flex;flex-direction:column;gap:6px;margin-top:8px}
.sem-modal .media-it{display:flex;align-items:center;gap:8px;background:#FFFCE0;border:2px solid var(--ink);border-radius:10px;padding:5px 9px;font-weight:700}
.sem-modal .media-it .rm{cursor:pointer;color:var(--rose);font-weight:900;margin-left:auto}
.sem-modal .modal__title{font-family:'Bangers',cursive;font-size:clamp(1.5rem,4vw,2.4rem);color:var(--cyan);-webkit-text-stroke:1px var(--ink);margin:6px 60px 10px 6px}
.sem-modal .v-desc{font-family:'Fredoka';font-weight:500;font-size:1.4rem;line-height:1.5;margin:0 0 14px;white-space:pre-wrap}
.sem-modal .v-media{display:flex;flex-direction:column;gap:14px;margin-top:12px}
.sem-modal .v-media img{width:100%;border:4px solid var(--ink);border-radius:16px}
.sem-modal .v-media iframe,.sem-modal .v-media video{width:100%;border:4px solid var(--ink);border-radius:16px;background:#000}
.sem-modal .v-media iframe{height:min(64vh,560px)}
.sem-modal .v-media .lnk{font-family:'Bangers',cursive;font-size:1.1rem;background:var(--jaune);border:3px solid var(--ink);border-radius:14px;padding:12px 18px;box-shadow:4px 4px 0 var(--ink);text-decoration:none;color:var(--ink);display:inline-block}
.sem-modal .timer{display:flex;align-items:center;gap:14px;flex-wrap:wrap;background:#fff;border:4px solid var(--ink);border-radius:18px;box-shadow:5px 5px 0 var(--ink);padding:12px 18px;margin:8px 0 4px}
.sem-modal .timer__num{font-family:'Bangers',cursive;font-size:clamp(2.4rem,8vw,4rem);color:var(--ink);letter-spacing:2px;min-width:160px;text-align:center}
.sem-modal .timer.done .timer__num{color:var(--rose)}
.sem-modal .timer button{font-family:'Bangers',cursive;cursor:pointer;font-size:1rem;border:3px solid var(--ink);border-radius:12px;padding:10px 16px;box-shadow:3px 3px 0 var(--ink);background:var(--vert);color:#fff}
.sem-modal .timer button.sec{background:#fff;color:var(--ink)}
.sem-modal .timer__done{font-family:'Bangers',cursive;font-size:1.4rem;color:var(--rose);-webkit-text-stroke:.5px var(--ink)}
.sem-modal .btn{font-family:'Luckiest Guy','Bangers',cursive;font-size:1.05rem;letter-spacing:.5px;cursor:pointer;color:var(--ink);padding:13px 24px;border:var(--bord);border-radius:16px;box-shadow:5px 5px 0 var(--ink);background:var(--gris);transition:transform .1s,box-shadow .1s}
.sem-modal .btn:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 var(--ink);background:#eef1f5}
.sem-modal .btn--big{background:var(--vert);color:#fff}
.sem-modal .bq-filters{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px}
.sem-modal .bq-grp{font-family:'Bangers',cursive;color:var(--cyan);-webkit-text-stroke:.3px var(--ink);font-size:.85rem;margin-left:6px}
.sem-modal .bq-grp:first-child{margin-left:0}
.sem-modal .bq-chip{font-family:'Fredoka';font-weight:700;font-size:.85rem;cursor:pointer;border:2.5px solid var(--ink);border-radius:11px;background:#fff;box-shadow:2px 2px 0 var(--ink);padding:4px 10px;transition:transform .1s,background .1s}
.sem-modal .bq-chip:hover{transform:translate(-1px,-1px);background:#FFFCE0}
.sem-modal .bq-chip.on{background:var(--jaune)}
.sem-modal .bq-count{font-family:'Bangers',cursive;color:var(--orange);font-size:.95rem;margin:6px 0}
.sem-modal .bq-list{display:flex;flex-direction:column;gap:8px;max-height:52vh;overflow:auto;padding:2px}
.sem-modal .bq-it{display:flex;flex-direction:column;gap:3px;text-align:left;cursor:pointer;background:#FFFCE0;border:3px solid var(--ink);border-radius:14px;box-shadow:3px 3px 0 var(--ink);padding:9px 12px;transition:transform .1s,box-shadow .1s}
.sem-modal .bq-it:hover{transform:translate(-2px,-2px);box-shadow:5px 5px 0 var(--ink);background:#fff7c2}
.sem-modal .bq-it__top{display:flex;align-items:center;gap:8px}
.sem-modal .bq-it__t{flex:1;font-family:'Bangers',cursive;font-size:1rem;color:var(--ink)}
.sem-modal .bq-it__desc{font-family:'Fredoka';font-weight:500;font-size:.9rem;color:#333;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.sem-modal .bq-it__tags{font-family:'Fredoka';font-weight:600;font-size:.78rem;color:var(--gris-dd)}
.sem-modal .bq-it .dur{font-family:'Bangers',cursive;font-size:.95rem;color:var(--orange);background:#fff;border:2px solid var(--ink);border-radius:8px;padding:1px 6px}
.sem-modal .bq-back{font-family:'Bangers',cursive;cursor:pointer;font-size:.9rem;border:3px solid var(--ink);border-radius:12px;box-shadow:3px 3px 0 var(--ink);padding:7px 14px;background:var(--gris)}
.sem-modal .act-empty{font-family:'Fredoka';font-weight:600;font-size:1.05rem;opacity:.5}
@media print{
  @page{size:landscape;margin:7mm}
  .sem-modal{display:none!important}
  .sem-root{background:#fff!important;padding:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .sem-root .toolbar,.sem-root .rail__ctrl,.sem-root .addbar,.sem-root .act-pm,.sem-root .act-chip .rm,.sem-root .act-chip .chk,.sem-root .sheet-mascotte,.sem-root .act-empty{display:none!important}
  .sem-root .sheet{box-shadow:none;border-width:3px;border-radius:16px;padding:6px;max-width:100%}
  .sem-root .sheet__title{font-size:1.7rem;margin:0 0 2px}
  .sem-root .grid{gap:5px}
  .sem-root .slot{box-shadow:2px 2px 0 var(--ink)!important;min-height:0;padding:5px;gap:3px}
  .sem-root .act-chip{font-size:.85rem;box-shadow:1px 1px 0 var(--ink)!important;padding:4px 7px}
  .sem-root .act-chip.is-done{filter:none;opacity:1;background:#eee}
}`;

function injectOnce(){
  if(document.getElementById('sem-grid-css')) return;
  if(!document.getElementById('sem-grid-fonts')){
    // Luckiest Guy = auto-hébergé (version accentuée, /fonts/) ; Bangers+Fredoka via Google.
    const l=document.createElement('link'); l.id='sem-grid-fonts'; l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?family=Bangers&family=Fredoka:wght@500;600;700&display=swap';
    document.head.appendChild(l);
  }
  const s=document.createElement('style'); s.id='sem-grid-css'; s.textContent=CSS; document.head.appendChild(s);
}

function mount(root, opts){
  opts = opts || {};
  injectOnce();

  const scope     = opts.scope || 'semaine';
  const dataPath  = opts.dataPath || '../planification/data/';
  const MAX_FILE  = 2.6*1024*1024;
  const ns = k => scope+'::'+k;

  let LANG   = opts.lang   || localStorage.getItem(ns('lang'))   || 'fr';
  let metier = opts.metier || localStorage.getItem(ns('metier')) || 'ep';
  let nbJours= parseInt(localStorage.getItem(ns('nbjours'))||'5',10)||5;

  // ── i18n ──
  const DAYS={fr:['Lundi','Mardi','Mercredi','Jeudi','Vendredi'],en:['Monday','Tuesday','Wednesday','Thursday','Friday']};
  const MONTHS={fr:['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],en:['January','February','March','April','May','June','July','August','September','October','November','December']};
  const I18N={
   fr:{title:'Planification de la semaine',weekOf:'Semaine du :',periods:'Périodes',toggleDays:'5 ↔ 3 jours',savePdf:'🖨️ Enregistrer PDF',clearWeek:'↺ Vider la semaine',
    ep:'ÉP',camp:'Camp',sdg:'SDG',period:'Période',recess:'Récréation',lunch:'Dîner',pause:'Pause',
    group:'Groupe :',activities:'Activités :',noGame:'Aucun jeu — touche ＋',togglePB:'période↔pause',markTodo:'Marquer à faire',markDone:'Marquer comme fait',linkedTip:'Lié à la banque',done:'FAIT !',min:'min',game:'Jeu',
    memFull:'⚠️ Mémoire pleine — fichier trop lourd.',tooHeavyA:'⚠️ ',tooHeavyB:' trop lourd (max ~2,5 Mo).',
    confRemoveLast:'Retirer le dernier jeu ?',confDelRow:'Supprimer cette ligne ?',confClear:'Vider la planification de cette semaine ?',addPeriod:'＋ Période',addPause:'＋ Pause',
    chooseLib:'📚 Choisir dans la banque',linkedLib:'📚 Lié à la banque',fTitle:'🎯 Titre du jeu',fTitlePh:'Ex : Capture du drapeau',fDesc:"📝 Description de l'activité",fDescPh:'Règles, but, matériel…',
    fDur:'⏱ Durée du jeu (minutes)',fDurPh:'Ex : 15',fMedia:'📎 Médias (image / PDF / mp3 / mp4)',importFile:'📂 Importer un fichier',fLink:'🔗 Lien YouTube / vidéo / chanson',addLink:'＋ lien',addBtn:'✅ Ajouter',
    loadingLib:'Chargement de la banque…',campLib:'📚 Banque Camp',epLib:'📚 Banque ÉP',sdgLib:'📚 Banque SDG',searchPh:'🔎 Chercher un jeu, un thème…',age:'Âge :',energy:'Énergie :',place:'Lieu :',yrs:'ans',wk:'Sem.',games:'jeu(x)',noResult:'Aucun résultat — ajuste les filtres.',
    cycle:'Cycle :',mat:'Maternelle',c1:'1er cycle',c2:'2e cycle',c3:'3e cycle',typeLbl:'Type :',moment:'Moment :',morning:'Matin',afternoon:'Après-midi',gym:'🤸 Gym',tAccueil:'Accueil',tCalme:'Jeu calme',tActif:'Jeu actif',tPluie:'Plan pluie',tRetour:'Retour',warmup:'Mise en train',act1:'Activité 1',act2:'Activité 2',cool:'Retour au calme',capped:'Affine la recherche pour voir plus…',
    calm:'😌 Calme',medium:'🙂 Moyen',high:'🔥 Défoulement',outdoor:'🌳 Cour',indoor:'🏠 Local',goal:'🎯 But : ',steps:'📋 Déroulement :',equip:'🎒 Matériel : ',tip:'💡 Astuce : ',
    start:'▶ Démarrer',pauseBtn:'⏸ Pause',resume:'▶ Reprendre',gameOver:'🏀 JEU TERMINÉ !',openLink:'🔗 Ouvrir le lien'},
   en:{title:'Weekly Plan',weekOf:'Week of:',periods:'Periods',toggleDays:'5 ↔ 3 days',savePdf:'🖨️ Save PDF',clearWeek:'↺ Clear week',
    ep:'PE',camp:'Camp',sdg:'Daycare',period:'Period',recess:'Recess',lunch:'Lunch',pause:'Break',
    group:'Group:',activities:'Activities:',noGame:'No game — tap ＋',togglePB:'period↔break',markTodo:'Mark as to-do',markDone:'Mark as done',linkedTip:'Linked to library',done:'DONE!',min:'min',game:'Game',
    memFull:'⚠️ Memory full — file too large.',tooHeavyA:'⚠️ ',tooHeavyB:' too large (max ~2.5 MB).',
    confRemoveLast:'Remove the last game?',confDelRow:'Delete this row?',confClear:"Clear this week's plan?",addPeriod:'＋ Period',addPause:'＋ Break',
    chooseLib:'📚 Choose from the library',linkedLib:'📚 Linked to library',fTitle:'🎯 Game title',fTitlePh:'Ex: Capture the flag',fDesc:'📝 Activity description',fDescPh:'Rules, goal, equipment…',
    fDur:'⏱ Game length (minutes)',fDurPh:'Ex: 15',fMedia:'📎 Media (image / PDF / mp3 / mp4)',importFile:'📂 Import a file',fLink:'🔗 YouTube / video / song link',addLink:'＋ link',addBtn:'✅ Add',
    loadingLib:'Loading the library…',campLib:'📚 Camp Library',epLib:'📚 PE Library',sdgLib:'📚 Daycare Library',searchPh:'🔎 Search a game, a theme…',age:'Age:',energy:'Energy:',place:'Place:',yrs:'yrs',wk:'Wk',games:'game(s)',noResult:'No result — adjust the filters.',
    cycle:'Cycle:',mat:'Kindergarten',c1:'Cycle 1',c2:'Cycle 2',c3:'Cycle 3',typeLbl:'Type:',moment:'Time:',morning:'Morning',afternoon:'Afternoon',gym:'🤸 Gym',tAccueil:'Welcome',tCalme:'Quiet game',tActif:'Active game',tPluie:'Rainy day',tRetour:'Wrap-up',warmup:'Warm-up',act1:'Activity 1',act2:'Activity 2',cool:'Cool-down',capped:'Refine search to see more…',
    calm:'😌 Calm',medium:'🙂 Medium',high:'🔥 High-energy',outdoor:'🌳 Outdoor',indoor:'🏠 Indoor',goal:'🎯 Goal: ',steps:'📋 Steps:',equip:'🎒 Equipment: ',tip:'💡 Tip: ',
    start:'▶ Start',pauseBtn:'⏸ Pause',resume:'▶ Resume',gameOver:'🏀 GAME OVER!',openLink:'🔗 Open link'}
  };
  const t = k => (I18N[LANG]||I18N.fr)[k];
  const dayNames = () => DAYS[LANG]||DAYS.fr;
  const ENERGIES=['calme','moyen','defoulement'], LIEUX=['cour','local'];
  const energyLbl = k => ({calme:t('calm'),moyen:t('medium'),defoulement:t('high')}[k]||'');
  const lieuLbl   = k => ({cour:t('outdoor'),local:t('indoor'),gym:t('gym')}[k]||'');
  const sdgTypeLbl= k => ({accueil:t('tAccueil'),jeu_calme:t('tCalme'),jeu_actif:t('tActif'),plan_pluie:t('tPluie'),retour:t('tRetour')}[k]||'');
  function dispLabel(ln){ const L=ln.label||'';
    const mp=L.match(/^(?:Période|Period)\s+(\d+)$/); if(mp) return t('period')+' '+mp[1];
    if(L==='Récréation'||L==='Recess') return t('recess');
    if(L==='Dîner'||L==='Lunch') return t('lunch');
    if(L==='Pause'||L==='Break') return t('pause');
    return L; }
  function moisFR(n){ return (MONTHS[LANG]||MONTHS.fr)[n]; }

  // ── DOM ──
  root.classList.add('sem-root'); root.dataset.metier=metier;
  root.innerHTML = `
    <div class="sheet">
      <div class="sheet-mascotte" aria-hidden="true"></div>
      <h1 class="sheet__title"></h1>
      <div class="sheet__week"><label></label><input type="date" class="sg-week"></div>
      <div class="toolbar">
        <div class="metier-sw"><button data-metier="ep"><span>🏫</span> <span class="m-lbl">ÉP</span></button><button data-metier="camp"><span>⛺</span> <span class="m-lbl">Camp</span></button><button data-metier="sdg"><span>🧸</span> <span class="m-lbl">SDG</span></button></div>
        <button class="btn sg-lang">EN</button>
        <div class="stepper"><span class="sg-periods">Périodes</span> <button data-step="-1">−</button><b class="sg-pcount">6</b><button data-step="1">＋</button></div>
        <button class="btn sg-toggledays">5 ↔ 3 jours</button>
        <button class="btn btn--print sg-print">🖨️ Enregistrer PDF</button>
        <button class="btn sg-reset">↺ Vider la semaine</button>
      </div>
      <div class="grid"></div>
    </div>`;
  const modal=document.createElement('div'); modal.className='sem-modal'; modal.dataset.metier=metier;
  modal.innerHTML=`<div class="modal__box"><button class="modal__x">✕</button><div class="sg-modalbody"></div></div>`;
  document.body.appendChild(modal);

  const $ = sel => root.querySelector(sel);
  const gridEl=$('.grid'), weekStartEl=$('.sg-week');
  const modalBody=modal.querySelector('.sg-modalbody');

  // ── état + persistance ──
  const DEFAUT=[
   {id:'p1',label:'Période 1',type:'period',h1:'',h2:''},{id:'p2',label:'Période 2',type:'period',h1:'',h2:''},
   {id:'r1',label:'Récréation',type:'break',h1:'',h2:''},{id:'p3',label:'Période 3',type:'period',h1:'',h2:''},
   {id:'p4',label:'Période 4',type:'period',h1:'',h2:''},{id:'din',label:'Dîner',type:'break',h1:'',h2:''},
   {id:'p5',label:'Période 5',type:'period',h1:'',h2:''},{id:'r2',label:'Récréation',type:'break',h1:'',h2:''},
   {id:'p6',label:'Période 6',type:'period',h1:'',h2:''}];
  let structure = DEFAUT.slice();
  let data = {};
  let curWeek = '';
  let saveTimer = null;
  function newId(){ return 'x'+Date.now().toString(36)+Math.floor(Math.random()*1000); }
  function nbPeriodes(){ return structure.filter(x=>x.type==='period').length; }
  function acts(id,di){ return data[id+'_acts_'+di]||[]; }
  function lsKey(ws){ return ns('w_'+ws); }

  async function loadWeek(ws){
    let doc=null;
    try{ doc = opts.load ? await opts.load(ws) : JSON.parse(localStorage.getItem(lsKey(ws))||'null'); }catch(e){ console.warn('[SemaineGrid] load',e); }
    if(!doc){ try{ doc = JSON.parse(localStorage.getItem(lsKey(ws))||'null'); }catch(e){} } // miroir local de secours
    if(doc){
      if(Array.isArray(doc.structure)&&doc.structure.length) structure=doc.structure;
      else { const tpl=loadTpl(); structure = tpl||structure; }
      data = doc.cells||{};
    } else {
      const tpl=loadTpl(); structure = tpl || DEFAUT.slice(); data={};
    }
    migrate();
  }
  function loadTpl(){ try{ const t=JSON.parse(localStorage.getItem(ns('struct'))||'null'); return (Array.isArray(t)&&t.length)?t:null; }catch(e){ return null; } }
  function persist(){
    localStorage.setItem(ns('struct'), JSON.stringify(structure));
    const payload={structure, cells:data};
    try{ localStorage.setItem(lsKey(curWeek), JSON.stringify(payload)); }catch(e){ alert(t('memFull')); }
    if(opts.save){ clearTimeout(saveTimer); saveTimer=setTimeout(()=>{ Promise.resolve(opts.save(curWeek,payload)).catch(e=>console.warn('[SemaineGrid] save',e)); }, 600); }
  }
  const save = persist;       // sauvegarde cellules
  const saveStruct = persist; // sauvegarde structure
  function migrate(){
    structure.forEach(ln=>{ if(ln.type!=='period')return; [0,1,2,3,4].forEach(di=>{
      const ak=ln.id+'_acts_'+di; if(data[ak])return;
      const ti=data[ln.id+'_a_'+di], lk=data[ln.id+'_lk_'+di], at=data[ln.id+'_att_'+di];
      if(ti||lk||(at&&at.length)){ const m=[]; (at||[]).forEach(a=>m.push({kind:mediaKindOf(a.type),name:a.name,data:a.data}));
        if(lk) m.push({kind:'link',url:lk}); data[ak]=[{id:newId(),titre:ti||t('game'),desc:'',duree:'',medias:m}]; }
    });});
  }

  function esc(s){ const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML.replace(/"/g,'&quot;'); }
  function mediaKindOf(mime){ if(!mime)return'link'; if(mime.startsWith('image/'))return'img'; if(mime==='application/pdf')return'pdf'; if(mime.startsWith('audio/'))return'audio'; if(mime.startsWith('video/'))return'video'; return'link'; }
  function dayDate(i){ const v=weekStartEl.value; if(!v)return''; const d=new Date(v+'T12:00:00'); d.setDate(d.getDate()+i); return d.getDate()+' '+moisFR(d.getMonth())+' '+d.getFullYear(); }

  // ── i18n statique ──
  function applyI18n(){
    $('.sheet__title').textContent=t('title');
    $('.sheet__week label').textContent=t('weekOf');
    $('.sg-periods').textContent=t('periods');
    $('.sg-toggledays').textContent=t('toggleDays');
    $('.sg-print').textContent=t('savePdf');
    $('.sg-reset').textContent=t('clearWeek');
    $('[data-metier="ep"] .m-lbl').textContent=t('ep');
    $('[data-metier="camp"] .m-lbl').textContent=t('camp');
    $('[data-metier="sdg"] .m-lbl').textContent=t('sdg');
    $('.sg-lang').textContent = LANG==='fr'?'EN':'FR';
  }

  function railCtrl(ln){ return `<div class="rail__ctrl"><button data-up="${ln.id}">↑</button><button data-down="${ln.id}">↓</button><button data-tog="${ln.id}" title="${t('togglePB')}">⇄</button><button class="del" data-del="${ln.id}">🗑️</button></div>`; }
  function render(){
    const days=dayNames().slice(0,nbJours);
    gridEl.style.gridTemplateColumns=`minmax(120px,150px) repeat(${days.length}, 1fr)`;
    let html='<div></div>';
    days.forEach((j,di)=>{ html+=`<div class="day-hd j${di}"><div class="day-hd__name">${j} <input type="checkbox" data-off="${di}" ${data['off_'+di]?'checked':''}></div><input class="day-hd__date" data-date="${di}" value="${esc(data['date_'+di]||dayDate(di))}"></div>`; });
    structure.forEach((ln,ri)=>{
      const hrs=`<div class="rail__hrs"><input data-h="h1" data-row="${ln.id}" value="${esc(ln.h1)}" placeholder="‑‑">–<input data-h="h2" data-row="${ln.id}" value="${esc(ln.h2)}" placeholder="‑‑"></div>`;
      if(ln.type==='break'){ html+=`<div class="rail rail--break"><input class="rail__lbl" data-lbl="${ln.id}" value="${esc(dispLabel(ln))}">${hrs}${railCtrl(ln)}</div>`; return; }
      html+=`<div class="rail ${ri%2?'alt':''}"><input class="rail__lbl" data-lbl="${ln.id}" value="${esc(dispLabel(ln))}">${hrs}${railCtrl(ln)}</div>`;
      days.forEach((j,di)=>{
        const off=data['off_'+di]; const A=acts(ln.id,di);
        const list=A.length? A.map(a=>`<button class="act-chip ${a.done?'is-done':''}" data-open="${ln.id}|${di}|${a.id}"><span class="chk" data-done="${ln.id}|${di}|${a.id}" title="${a.done?t('markTodo'):t('markDone')}">${a.done?'✓':''}</span><span class="t">${a.ref?`<span class="lien" title="${t('linkedTip')}">📚</span> `:''}${esc(a.titre)}</span>${a.done?`<span class="fait">${t('done')}</span>`:(a.duree?`<span class="dur">${esc(a.duree)} ${t('min')}</span>`:'')}<span class="rm" data-delact="${ln.id}|${di}|${a.id}">✕</span></button>`).join('') : `<div class="act-empty">${t('noGame')}</div>`;
        html+=`<div class="slot ${off?'slot--off':''}">
          <div class="slot__row"><span class="slot__lbl">${t('group')}</span><input class="g" data-k="${ln.id}_g_${di}" value="${esc(data[ln.id+'_g_'+di])}"></div>
          <div class="acts__hd"><span class="slot__lbl">${t('activities')}</span><div class="act-pm"><button class="minus" data-less="${ln.id}|${di}">−</button><button data-more="${ln.id}|${di}">＋</button></div></div>
          <div class="acts__list">${list}</div>
        </div>`;
      });
    });
    html+=`<div class="addbar"><button data-add="period">${t('addPeriod')}</button><button data-add="pause">${t('addPause')}</button></div>`;
    gridEl.innerHTML=html;
    const pc=$('.sg-pcount'); if(pc) pc.textContent=nbPeriodes();
  }

  // ── Banque (config-driven, ÉP/Camp/SDG) ──
  const BANK_LIMIT=120, BANK_CACHE={};
  let BANQUE=null;
  const banqueState={q:''};
  function dureeFromPlage(p){ if(!p)return''; const a=[...p.matchAll(/(\d+)\s*h\s*(\d+)?/g)].map(m=>(+m[1])*60+(+(m[2]||0))); if(a.length<2)return''; const d=a[1]-a[0]; return d>0?String(d):''; }
  const BANK_DEFS={
    camp:{ titleKey:'campLib',
      async load(){ const weeks=await (await fetch(dataPath+'camp.json')).json(); const out=[];
        weeks.forEach(w=>Object.entries(w.groupes||{}).forEach(([g,gd])=>(gd.blocs||[]).forEach((b,i)=>{
          out.push({ id:'camp-w'+w.semaine+'-'+g+'-'+i, src:'camp', titre:b.nom||'Activité', desc:b.desc||'', but:b.but||'',
            deroulement:b.deroulement||[], variantes:b.variantes||[], astuce:b.astuce||'', materiel:b.materiel||[],
            lieu:b.lieu||'', energie:b.energie||'', groupe:g, semaine:w.semaine, theme:w.theme||'', duree:dureeFromPlage(b.plage) });
        }))); return out; },
      facets(){ return [
        {key:'groupe', lbl:t('age'),    chips:['5-7','8-10','11-12'].map(g=>[g,g+' '+t('yrs')])},
        {key:'energie',lbl:t('energy'), chips:ENERGIES.map(k=>[k,energyLbl(k)])},
        {key:'lieu',   lbl:t('place'),  chips:LIEUX.map(k=>[k,lieuLbl(k)])} ]; },
      tag(f){ return [energyLbl(f.energie),lieuLbl(f.lieu),f.groupe+' '+t('yrs'),t('wk')+' '+f.semaine+' — '+esc(f.theme)].filter(Boolean).join(' · '); } },
    ep:{ titleKey:'epLib',
      async load(){ const cy=[['mat','ep-maternelle.json'],['1er','ep-1er.json'],['2e','ep-2e.json'],['3e','ep-3e.json']]; const out=[];
        for(const [code,file] of cy){ const arr=await (await fetch(dataPath+file)).json();
          arr.forEach(fi=>out.push({ id:'ep-'+code+'-'+fi.id, src:'ep', titre:fi.titre||'Cours', desc:fi.intention||'', but:'',
            cycle:code, niveau:fi.niveau||'', espace:fi.espace||'', materiel:fi.materiel||[], astuce:fi.astuce||'',
            theme:fi.niveau||'', duree:(String(fi.duree).match(/\d+/)||[''])[0],
            sections:[['warmup','🔥',fi.mise_en_train],['act1','1️⃣',fi.activite_1],['act2','2️⃣',fi.activite_2],['cool','😌',fi.retour]].filter(x=>x[2]) })); }
        return out; },
      facets(){ return [ {key:'cycle', lbl:t('cycle'), chips:[['mat',t('mat')],['1er',t('c1')],['2e',t('c2')],['3e',t('c3')]]} ]; },
      tag(f){ return [esc(f.niveau),esc(f.espace)].filter(Boolean).join(' · '); } },
    sdg:{ titleKey:'sdgLib',
      async load(){ const days=await (await fetch(dataPath+'sdg.json')).json(); const out=[];
        days.forEach(d=>Object.entries(d.blocs||{}).forEach(([moment,bloc])=>(bloc.items||[]).forEach((it,i)=>{
          out.push({ id:'sdg-d'+d.jour+'-'+moment+'-'+i, src:'sdg', titre:it.nom||'Activité', desc:it.desc||'', but:it.but||'',
            deroulement:it.deroulement||[], variantes:it.variantes||[], astuce:it.astuce||'', materiel:it.materiel||[],
            lieu:it.lieu||'', type:it.type||'', moment, semaine:d.semaine, jour:d.jour, theme:d.theme||'', duree:'' });
        }))); return out; },
      facets(){ return [
        {key:'type',  lbl:t('typeLbl'),chips:[['accueil',t('tAccueil')],['jeu_calme',t('tCalme')],['jeu_actif',t('tActif')],['plan_pluie',t('tPluie')],['retour',t('tRetour')]]},
        {key:'moment',lbl:t('moment'), chips:[['matin',t('morning')],['aprem',t('afternoon')]]},
        {key:'lieu',  lbl:t('place'),  chips:[['local',t('indoor')],['gym',t('gym')],['cour',t('outdoor')]]} ]; },
      tag(f){ const ml={matin:t('morning'),aprem:t('afternoon')}[f.moment]||''; return [sdgTypeLbl(f.type),lieuLbl(f.lieu),ml,t('wk')+' '+f.semaine+' — '+esc(f.theme)].filter(Boolean).join(' · '); } }
  };
  function curDef(){ return BANK_DEFS[metier]||BANK_DEFS.camp; }
  async function loadBanque(){
    if(!BANK_CACHE[metier]){ try{ const out=await curDef().load(); out.forEach(f=>f._s=(f.titre+' '+f.desc+' '+(f.theme||'')+' '+(f.niveau||'')).toLowerCase()); BANK_CACHE[metier]=out; }catch(e){ BANK_CACHE[metier]=[]; } }
    BANQUE=BANK_CACHE[metier]; return BANQUE;
  }
  function banqueFiltered(){ const q=banqueState.q.toLowerCase().trim(); const fs=curDef().facets();
    return (BANQUE||[]).filter(f=>{ for(const fc of fs){ if(banqueState[fc.key]&&f[fc.key]!==banqueState[fc.key]) return false; } return !q||f._s.includes(q); }); }
  function bqItemHTML(f){ return `<button class="bq-it" data-pick="${f.id}"><span class="bq-it__top"><span class="bq-it__t">${esc(f.titre)}</span>${f.duree?`<span class="dur">${f.duree} ${t('min')}</span>`:''}</span><span class="bq-it__desc">${esc(f.desc)}</span><span class="bq-it__tags">${curDef().tag(f)}</span></button>`; }
  function bqChip(group,val,lbl){ return `<button class="bq-chip ${banqueState[group]===val?'on':''}" data-bq="${group}" data-val="${val}">${lbl}</button>`; }
  function bqListHTML(list){ if(!list.length) return `<div class="act-empty" style="padding:20px">${t('noResult')}</div>`;
    let h=list.slice(0,BANK_LIMIT).map(bqItemHTML).join(''); if(list.length>BANK_LIMIT) h+=`<div class="act-empty" style="padding:14px">${t('capped')}</div>`; return h; }
  function refreshBqList(){ const list=banqueFiltered(); const c=modalBody.querySelector('.bq-count'); const l=modalBody.querySelector('.bq-list');
    if(c)c.textContent=list.length+' '+t('games'); if(l)l.innerHTML=bqListHTML(list); }
  function renderBanque(){ const list=banqueFiltered(); const fs=curDef().facets();
    const filters=fs.map(fc=>`<span class="bq-grp">${fc.lbl}</span>${fc.chips.map(([v,l])=>bqChip(fc.key,v,l)).join('')}`).join(' ');
    modalBody.innerHTML=`<div style="display:flex;align-items:center;gap:10px;margin:6px 60px 12px 6px"><button class="bq-back" data-bqback="1">←</button><h2 class="modal__title" style="margin:0;font-size:clamp(1.3rem,3.5vw,2rem)">${t(curDef().titleKey)}</h2></div>
      <input class="f-in" id="bqQ" placeholder="${t('searchPh')}" value="${esc(banqueState.q)}" style="margin-bottom:10px">
      <div class="bq-filters">${filters}</div>
      <div class="bq-count">${list.length} ${t('games')}</div>
      <div class="bq-list">${bqListHTML(list)}</div>`;
    const q=modalBody.querySelector('#bqQ'); q.addEventListener('input',e=>{ banqueState.q=e.target.value; refreshBqList(); });
  }
  async function openBanque(){ openModal(); modalBody.innerHTML=`<div class="act-empty" style="padding:24px">${t('loadingLib')}</div>`; await loadBanque(); renderBanque(); }
  function epDesc(f){ const L={warmup:t('warmup'),act1:t('act1'),act2:t('act2'),cool:t('cool')}; let d=f.desc||'';
    (f.sections||[]).forEach(([kind,icon,s])=>{ d+='\n\n'+icon+' '+L[kind]+(s.duree?' ('+s.duree+')':'')+(s.nom?' — '+s.nom:'');
      if(s.but) d+='\n'+t('goal')+s.but;
      if(s.deroulement&&s.deroulement.length) d+='\n• '+s.deroulement.join('\n• '); });
    if(f.materiel&&f.materiel.length) d+='\n\n'+t('equip')+f.materiel.join(', ');
    if(f.astuce) d+='\n\n'+t('tip')+f.astuce; return d;
  }
  function pickFiche(id){ const f=(BANQUE||[]).find(x=>x.id===id); if(!f)return; let desc;
    if(f.src==='ep'){ desc=epDesc(f); }
    else{ desc=f.desc||'';
      if(f.but&&f.but!==f.desc) desc+=(desc?'\n\n':'')+t('goal')+f.but;
      if(f.deroulement&&f.deroulement.length) desc+='\n\n'+t('steps')+'\n• '+f.deroulement.join('\n• ');
      if(f.materiel&&f.materiel.length) desc+='\n\n'+t('equip')+f.materiel.join(', ');
      if(f.astuce) desc+='\n\n'+t('tip')+f.astuce; }
    openEdit(editCtx.id,editCtx.di,{titre:f.titre,desc,duree:f.duree,ref:{source:f.src,id:f.id}});
  }

  // ── Modal : ajout / vue ──
  let editMedias=[], editCtx=null, timerInt=null, editRef=null;
  function openModal(){ modal.dataset.metier=metier; modal.classList.add('open'); }
  function closeModal(){ modal.classList.remove('open'); modalBody.innerHTML=''; if(timerInt){clearInterval(timerInt);timerInt=null;} }
  modal.querySelector('.modal__x').addEventListener('click',closeModal);
  modal.addEventListener('click',e=>{ if(e.target===modal) closeModal(); });
  function onKey(e){ if(e.key==='Escape'&&modal.classList.contains('open')) closeModal(); }
  document.addEventListener('keydown',onKey);

  modalBody.addEventListener('click',e=>{
    const bq=e.target.closest('[data-bq]'); if(bq){ const g=bq.dataset.bq; banqueState[g]=banqueState[g]===bq.dataset.val?'':bq.dataset.val; renderBanque(); return; }
    const pk=e.target.closest('[data-pick]'); if(pk){ pickFiche(pk.dataset.pick); return; }
    const bk=e.target.closest('[data-bqback]'); if(bk&&editCtx){ openEdit(editCtx.id,editCtx.di); return; }
  });

  function openEdit(id,di,prefill){
    editCtx={id,di}; editMedias=[]; editRef=prefill?.ref||null;
    modalBody.innerHTML=`
      <button class="btn sg-banque" style="background:var(--cyan);color:#fff;width:100%;margin:2px 0 4px;font-size:1.05rem">${t('chooseLib')}</button>
      ${editRef?`<div class="media-it" style="background:#e6f7ff">${t('linkedLib')} <span class="rm sg-unref">✕</span></div>`:''}
      <label class="f-lbl">${t('fTitle')}</label><input class="f-in" id="fTitre" placeholder="${t('fTitlePh')}">
      <label class="f-lbl">${t('fDesc')}</label><textarea class="f-ta" id="fDesc" placeholder="${t('fDescPh')}"></textarea>
      <label class="f-lbl">${t('fDur')}</label><input class="f-in" id="fDuree" type="number" min="1" placeholder="${t('fDurPh')}" style="max-width:160px">
      <label class="f-lbl">${t('fMedia')}</label>
      <div class="f-row"><label class="btn"><input type="file" id="fFile" accept="image/png,image/jpeg,application/pdf,audio/mpeg,audio/mp3,video/mp4" multiple hidden>${t('importFile')}</label></div>
      <label class="f-lbl">${t('fLink')}</label>
      <div class="f-row"><input class="f-in" id="fLink" placeholder="https://youtube.com/…" style="flex:1"><button class="btn" id="fAddLink">${t('addLink')}</button></div>
      <div class="medias" id="fMedias"></div>
      <div style="text-align:center;margin-top:18px"><button class="btn btn--big" id="fAdd">${t('addBtn')}</button></div>`;
    modalBody.querySelector('#fFile').addEventListener('change',e=>{ for(const f of e.target.files){ if(f.size>MAX_FILE){alert(t('tooHeavyA')+f.name+t('tooHeavyB'));continue;} const rd=new FileReader(); rd.onload=()=>{ editMedias.push({kind:mediaKindOf(f.type),name:f.name,data:rd.result}); renderMedias(); }; rd.readAsDataURL(f); } e.target.value=''; });
    modalBody.querySelector('#fAddLink').addEventListener('click',()=>{ const v=modalBody.querySelector('#fLink').value.trim(); if(v){ editMedias.push({kind:'link',url:v}); modalBody.querySelector('#fLink').value=''; renderMedias(); } });
    modalBody.querySelector('#fAdd').addEventListener('click',saveAct);
    modalBody.querySelector('.sg-banque').addEventListener('click',openBanque);
    const unref=modalBody.querySelector('.sg-unref'); if(unref) unref.addEventListener('click',()=>{ editRef=null; openEdit(id,di,{titre:modalBody.querySelector('#fTitre').value,desc:modalBody.querySelector('#fDesc').value,duree:modalBody.querySelector('#fDuree').value}); });
    if(prefill){ modalBody.querySelector('#fTitre').value=prefill.titre||''; modalBody.querySelector('#fDesc').value=prefill.desc||''; modalBody.querySelector('#fDuree').value=prefill.duree||''; }
    renderMedias(); openModal(); setTimeout(()=>modalBody.querySelector('#fTitre')?.focus(),50);
  }
  function renderMedias(){ const box=modalBody.querySelector('#fMedias'); if(!box)return;
    box.innerHTML=editMedias.map((m,i)=>`<div class="media-it">${m.kind==='link'?'🔗':m.kind==='pdf'?'📄':m.kind==='audio'?'🎵':m.kind==='video'?'🎬':'🖼️'} ${esc(m.name||m.url)} <span class="rm" data-mrm="${i}">✕</span></div>`).join('');
    box.querySelectorAll('[data-mrm]').forEach(x=>x.addEventListener('click',()=>{ editMedias.splice(+x.dataset.mrm,1); renderMedias(); }));
  }
  function saveAct(){
    const titre=modalBody.querySelector('#fTitre').value.trim()||t('game');
    const a={id:newId(),titre,desc:modalBody.querySelector('#fDesc').value.trim(),duree:modalBody.querySelector('#fDuree').value.trim(),medias:editMedias.slice(),ref:editRef};
    const k=editCtx.id+'_acts_'+editCtx.di; (data[k]=data[k]||[]).push(a); save(); render(); closeModal();
  }
  function ytEmbed(u){ const m=u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{6,})/); return m?'https://www.youtube.com/embed/'+m[1]:null; }
  function mediaView(m){
    if(m.kind==='img') return `<img src="${m.data}" alt="${esc(m.name)}">`;
    if(m.kind==='pdf') return `<iframe src="${m.data}"></iframe>`;
    if(m.kind==='audio') return `<audio src="${m.data}" controls style="width:100%"></audio>`;
    if(m.kind==='video') return `<video src="${m.data}" controls></video>`;
    const yt=ytEmbed(m.url||''); if(yt) return `<iframe src="${yt}" allowfullscreen></iframe>`;
    if(/\.(mp4|webm)$/i.test(m.url)) return `<video src="${esc(m.url)}" controls></video>`;
    if(/\.(mp3|wav|m4a)$/i.test(m.url)) return `<audio src="${esc(m.url)}" controls style="width:100%"></audio>`;
    return `<a class="lnk" href="${esc(m.url)}" target="_blank" rel="noopener">${t('openLink')}</a>`;
  }
  function buzzer(){ try{ const c=new(window.AudioContext||window.webkitAudioContext)(); const D=1.8;
    [110,165].forEach(f=>{ const o=c.createOscillator(),g=c.createGain(); o.type='square'; o.frequency.value=f; o.connect(g); g.connect(c.destination);
      g.gain.setValueAtTime(.0001,c.currentTime); g.gain.exponentialRampToValueAtTime(.4,c.currentTime+.03); g.gain.setValueAtTime(.4,c.currentTime+D-.15); g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+D);
      o.start(); o.stop(c.currentTime+D); }); }catch(e){} }
  function openView(id,di,actId){
    const a=acts(id,di).find(x=>x.id===actId); if(!a)return;
    const dur=parseInt(a.duree)||0;
    let html=`<h2 class="modal__title">${esc(a.titre)}</h2>`;
    if(a.desc) html+=`<p class="v-desc">${esc(a.desc)}</p>`;
    if(dur>0) html+=`<div class="timer" id="vTimer"><div class="timer__num" id="vNum">${String(dur).padStart(2,'0')}:00</div>
      <button id="vStart">${t('start')}</button><button class="sec" id="vReset">↺</button><span class="timer__done" id="vDone" style="display:none">${t('gameOver')}</span></div>`;
    if(a.medias&&a.medias.length) html+=`<div class="v-media">${a.medias.map(mediaView).join('')}</div>`;
    modalBody.innerHTML=html; openModal();
    if(dur>0){ let rem=dur*60, running=false;
      const num=modalBody.querySelector('#vNum'), done=modalBody.querySelector('#vDone'), tm=modalBody.querySelector('#vTimer'), st=modalBody.querySelector('#vStart');
      const fmt=()=>{ num.textContent=String(Math.floor(rem/60)).padStart(2,'0')+':'+String(rem%60).padStart(2,'0'); };
      st.addEventListener('click',()=>{ if(running){ clearInterval(timerInt); running=false; st.textContent=t('resume'); return; }
        running=true; st.textContent=t('pauseBtn'); timerInt=setInterval(()=>{ rem--; fmt(); if(rem<=0){ clearInterval(timerInt); timerInt=null; running=false; tm.classList.add('done'); done.style.display='inline'; st.style.display='none'; buzzer(); a.done=true; save(); render(); } },1000); });
      modalBody.querySelector('#vReset').addEventListener('click',()=>{ if(timerInt){clearInterval(timerInt);timerInt=null;} rem=dur*60; running=false; tm.classList.remove('done'); done.style.display='none'; st.style.display='inline'; st.textContent=t('start'); fmt(); });
    }
  }

  // ── Events grille ──
  gridEl.addEventListener('input',e=>{ const el=e.target;
    if(el.dataset.k){ data[el.dataset.k]=el.value; save(); }
    else if(el.dataset.date!=null){ data['date_'+el.dataset.date]=el.value; save(); }
    else if(el.dataset.lbl){ const r=structure.find(x=>x.id===el.dataset.lbl); if(r){r.label=el.value;saveStruct();} }
    else if(el.dataset.h){ const r=structure.find(x=>x.id===el.dataset.row); if(r){r[el.dataset.h]=el.value;saveStruct();} }
  });
  gridEl.addEventListener('change',e=>{ if(e.target.dataset.off!=null){ data['off_'+e.target.dataset.off]=e.target.checked; save(); render(); } });
  gridEl.addEventListener('click',e=>{
    const dn=e.target.closest('[data-done]'); if(dn){ e.stopPropagation(); const [id,di,aid]=dn.dataset.done.split('|'); const a=(data[id+'_acts_'+di]||[]).find(x=>x.id===aid); if(a){ a.done=!a.done; save(); render(); } return; }
    const rm=e.target.closest('[data-delact]'); if(rm){ e.stopPropagation(); const [id,di,aid]=rm.dataset.delact.split('|'); const k=id+'_acts_'+di; data[k]=(data[k]||[]).filter(a=>a.id!==aid); save(); render(); return; }
    const op=e.target.closest('[data-open]'); if(op){ const [id,di,aid]=op.dataset.open.split('|'); openView(id,di,aid); return; }
    const b=e.target.closest('button'); if(!b)return;
    if(b.dataset.more){ const [id,di]=b.dataset.more.split('|'); openEdit(id,di); }
    else if(b.dataset.less){ const [id,di]=b.dataset.less.split('|'); const k=id+'_acts_'+di; const arr=data[k]||[]; if(arr.length&&confirm(t('confRemoveLast'))){ arr.pop(); save(); render(); } }
    else if(b.dataset.up){ moveRow(b.dataset.up,-1); }
    else if(b.dataset.down){ moveRow(b.dataset.down,1); }
    else if(b.dataset.tog){ const r=structure.find(x=>x.id===b.dataset.tog); if(r){ r.type=r.type==='period'?'break':'period'; commit(); } }
    else if(b.dataset.del){ if(confirm(t('confDelRow'))){ structure=structure.filter(x=>x.id!==b.dataset.del); commit(); } }
    else if(b.dataset.add==='period'){ structure.push({id:newId(),label:'Période '+(nbPeriodes()+1),type:'period',h1:'',h2:''}); commit(); }
    else if(b.dataset.add==='pause'){ structure.push({id:newId(),label:'Pause',type:'break',h1:'',h2:''}); commit(); }
  });
  function moveRow(id,dir){ const i=structure.findIndex(x=>x.id===id),j=i+dir; if(i<0||j<0||j>=structure.length)return; [structure[i],structure[j]]=[structure[j],structure[i]]; commit(); }
  function commit(){ saveStruct(); render(); }

  // ── Toolbar ──
  $('.stepper').addEventListener('click',e=>{ const b=e.target.closest('button'); if(!b)return;
    if(+b.dataset.step>0){ structure.push({id:newId(),label:'Période '+(nbPeriodes()+1),type:'period',h1:'',h2:''}); commit(); }
    else { for(let i=structure.length-1;i>=0;i--){ if(structure[i].type==='period'){ structure.splice(i,1); break; } } commit(); } });
  $('.sg-toggledays').addEventListener('click',()=>{ nbJours=nbJours===5?3:5; localStorage.setItem(ns('nbjours'),nbJours); render(); });
  $('.sg-print').addEventListener('click',()=>window.print());
  $('.sg-reset').addEventListener('click',()=>{ if(confirm(t('confClear'))){ data={}; save(); render(); } });
  $('.sg-lang').addEventListener('click',()=>setLang(LANG==='fr'?'en':'fr'));
  weekStartEl.addEventListener('change',async()=>{ curWeek=weekStartEl.value; await loadWeek(curWeek); render(); if(opts.onWeekChange) opts.onWeekChange(curWeek); });
  function setLang(l){ LANG=l; localStorage.setItem(ns('lang'),l); applyI18n(); render(); }
  function setMetier(m){ metier=m; root.dataset.metier=m; modal.dataset.metier=m; localStorage.setItem(ns('metier'),m);
    root.querySelectorAll('.metier-sw button').forEach(b=>b.classList.toggle('on',b.dataset.metier===m));
    banqueState.q=''; ['groupe','energie','lieu','cycle','type','moment'].forEach(k=>banqueState[k]=''); BANQUE=BANK_CACHE[m]||null; }
  $('.metier-sw').addEventListener('click',e=>{ const b=e.target.closest('button'); if(b) setMetier(b.dataset.metier); });

  // ── Init ──
  function mondayOf(d){ const wd=(d.getDay()+6)%7; d.setDate(d.getDate()-wd); return d; }
  (async function start(){
    let ws=opts.weekStart;
    if(!ws){ const d=mondayOf(new Date()); ws=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
    weekStartEl.value=ws; curWeek=ws;
    setMetier(metier); applyI18n();
    await loadWeek(ws); render();
  })();

  // API instance (pour le moteur : recharger une semaine externe, détruire)
  return {
    reloadWeek: async (ws)=>{ if(ws){ weekStartEl.value=ws; curWeek=ws; } await loadWeek(curWeek); render(); },
    destroy: ()=>{ document.removeEventListener('keydown',onKey); modal.remove(); root.innerHTML=''; root.classList.remove('sem-root'); }
  };
}

window.SemaineGrid = { mount };
})();
