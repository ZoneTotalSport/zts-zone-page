// ═══════════ AUTH ═══════════
const LOCK_KEY='zts_cours_mat_token';
const VALID_TOKENS=['DEMO2026','ZTS-MAT-90','JOEY-PROFS'];
function checkAccess(){
  const url=new URL(location);const t=url.searchParams.get('token');
  if(t&&VALID_TOKENS.includes(t.toUpperCase())){
    localStorage.setItem(LOCK_KEY,t.toUpperCase());
    url.searchParams.delete('token');history.replaceState(null,'',url);
    unlock();return true;
  }
  if(VALID_TOKENS.includes(localStorage.getItem(LOCK_KEY))){unlock();return true;}
  return false;
}
const WELCOME_KEY='zts_mat_welcome';
function unlock(){
  document.getElementById('lock-screen').style.display='none';
  renderAll();
  if(!localStorage.getItem(WELCOME_KEY))showWelcome();
}
function showWelcome(){
  document.getElementById('view-welcome').style.display='flex';
}
function finishWelcome(){
  localStorage.setItem(WELCOME_KEY,'1');
  document.getElementById('view-welcome').style.display='none';
}
function logout(){localStorage.removeItem(LOCK_KEY);location.reload();}
function testAccess(){localStorage.setItem(LOCK_KEY,'DEMO2026');unlock();}
async function submitEmail(e){
  e.preventDefault();const email=document.getElementById('lock-email').value.trim();
  const msg=document.getElementById('lock-msg');
  if(!email.includes('@')){msg.className='mt-4 font-bold text-brandRed';msg.textContent='Courriel invalide.';return false;}
  msg.className='mt-4 font-bold text-slate-400';msg.textContent='⏳ Envoi en cours…';
  await new Promise(r=>setTimeout(r,800));
  msg.className='mt-4 font-bold text-brandGreen';
  msg.innerHTML='✅ <b>Lien envoyé !</b><br>Vérifie ta boîte courriel.';
  return false;
}

// ═══════════ STATE ═══════════
const DONE_KEY='zts_mat_done',FAV_KEY='zts_mat_fav',STEPS_KEY='zts_mat_steps',TBI_KEY='zts_mat_tbi';
const getDone=()=>JSON.parse(localStorage.getItem(DONE_KEY)||'[]');
const getFav=()=>JSON.parse(localStorage.getItem(FAV_KEY)||'[]');
const getStepsState=()=>JSON.parse(localStorage.getItem(STEPS_KEY)||'{}');
let currentTrim='1-30',selectedCourseId=null,currentSection='mise_en_train';

// ═══════════ ICÔNES par groupe / activité ═══════════
const ICON_BY_KIND={mise_en_train:'fa-fire',activite_1:'fa-person-running',activite_2:'fa-person-walking',retour:'fa-moon'};
function iconForCourse(c){
  const t=(c.titre||'').toLowerCase();
  if(t.includes('ninja')||t.includes('parcours'))return'fa-user-ninja';
  if(t.includes('ballon'))return'fa-volleyball';
  if(t.includes('cerceau'))return'fa-circle-dot';
  if(t.includes('animal')||t.includes('animau'))return'fa-paw';
  if(t.includes('saint-jean')||t.includes('québec')||t.includes('quebec'))return'fa-flag';
  if(t.includes('équilibre')||t.includes('equilibre'))return'fa-yin-yang';
  if(t.includes('danse'))return'fa-music';
  if(t.includes('relais')||t.includes('course'))return'fa-person-running';
  if(t.includes('saut'))return'fa-arrow-up';
  if(t.includes('jeu'))return'fa-puzzle-piece';
  return'fa-star';
}

// ═══════════ NAVIGATION VUES ═══════════
function switchView(view){
  ['main','tbi','course','surprise'].forEach(v=>{
    const el=document.getElementById('view-'+v);
    el.classList.remove('active-view');el.classList.add('hidden-view');
  });
  const el=document.getElementById('view-'+view);
  el.classList.remove('hidden-view');el.classList.add('active-view');
  if(view==='main')renderAll();
  if(view==='tbi')renderTBIGrid();
  if(view==='surprise'){
    document.getElementById('surprise-text').innerText='Tirage au sort…';
    document.getElementById('surprise-icon').className='fa-solid fa-dice';
    document.getElementById('surprise-btn').classList.remove('hidden');
  }
  window.scrollTo(0,0);
}

// ═══════════ MAIN RENDER ═══════════
function renderAll(){renderBento();renderGrid();}
function renderBento(){
  const total=COURS.length,done=getDone();
  const prochain=COURS.find(c=>!done.includes(c.id))||COURS[0];
  document.getElementById('bento-today-title').innerText=prochain.titre;
  document.getElementById('bento-today-desc').innerText=(prochain.intention||'').slice(0,180)+'…';
  document.getElementById('arsenal-num').innerText=String(total).padStart(2,'0');
  const pct=Math.round(done.length/total*100);
  document.getElementById('progress-bar').style.width=pct+'%';
  document.getElementById('progress-msg').innerHTML=`<i class="fa-solid fa-bullseye text-xs"></i> ${done.length} / ${total} cours faits · ${pct}%`;
  document.getElementById('bento-today').dataset.id=prochain.id;
}
function bentoTodayClick(){
  const id=parseInt(document.getElementById('bento-today').dataset.id);
  if(id)openCourseModal(id);
}

function renderGrid(){
  const grid=document.getElementById('course-grid');
  const q=(document.getElementById('searchInput').value||'').toLowerCase().trim();
  const done=getDone(),fav=getFav();
  let list=COURS.filter(c=>c.groupe===currentTrim);
  if(q.length>=2)list=COURS.filter(c=>c.titre.toLowerCase().includes(q)||(c.intention||'').toLowerCase().includes(q));
  grid.innerHTML='';
  if(!list.length){grid.innerHTML='<div class="col-span-full text-center text-slate-500 font-bold py-12">Aucun cours trouvé.</div>';return;}
  const PALETTE=['#00C4FF','#FFF000','#FF8C00','#4ADE80','#A855F7','#ec4899'];
  list.forEach((c,idx)=>{
    const isDone=done.includes(c.id),isFav=fav.includes(c.id);
    const color=PALETTE[idx%PALETTE.length];
    const dark=color==='#FFF000'||color==='#4ADE80';
    const fg=dark?'#0B1120':'#fff';
    const rot=(idx%3===0)?-1.5:(idx%3===1)?1.5:-.5;
    const card=document.createElement('div');
    card.className='rounded-2xl p-5 md:p-6 flex flex-col h-52 md:h-64 cursor-pointer relative zts-sticker-card';
    card.style.cssText=`background:${isDone?'#4ADE80':color};color:${isDone?'#0B1120':fg};border:3px solid #0B1120;border-bottom-width:12px;border-right-width:12px;transform:rotate(${rot}deg);transition:all .15s cubic-bezier(.4,0,.2,1);`;
    card.onmouseenter=()=>{card.style.transform=`rotate(0deg) translate(2px,2px)`;card.style.borderBottomWidth='6px';card.style.borderRightWidth='6px';};
    card.onmouseleave=()=>{card.style.transform=`rotate(${rot}deg)`;card.style.borderBottomWidth='12px';card.style.borderRightWidth='12px';};
    card.onclick=()=>openCourseModal(c.id);
    card.innerHTML=`
      <div class="flex justify-between items-start mb-auto">
        <span class="font-bangers text-5xl" style="color:${fg};text-shadow:2px 2px 0 rgba(0,0,0,.15)">${String(c.id).padStart(2,'0')}</span>
        <i class="fa-solid ${isDone?'fa-circle-check':iconForCourse(c)} text-3xl md:text-4xl" style="color:${fg}"></i>
      </div>
      <h4 class="font-bangers text-xl md:text-2xl leading-tight mb-2 mt-4" style="color:${fg}">${c.titre}</h4>
      <div class="flex justify-between items-center">
        <span class="font-love text-sm uppercase tracking-widest" style="color:${fg};opacity:.8">${c.periode||''}</span>
        ${isFav?`<i class="fa-solid fa-star text-base" style="color:${dark?'#A855F7':'#FFF000'}"></i>`:''}
      </div>`;
    grid.appendChild(card);
  });
}

function filterCourses(trim,btn){
  currentTrim=trim;
  document.querySelectorAll('.trim-btn').forEach(b=>{
    b.classList.remove('text-brandCyan','border-brandCyan','border-b-4');
    b.classList.add('text-slate-500');
  });
  btn.classList.remove('text-slate-500');
  btn.classList.add('text-brandCyan','border-brandCyan','border-b-4');
  renderGrid();
}

// ═══════════ TBI GRID ═══════════
function renderTBIGrid(){
  const grid=document.getElementById('tbi-grid');
  const trim=document.getElementById('tbi-trim').value;
  const list=COURS.filter(c=>c.groupe===trim);
  const done=getDone();
  grid.innerHTML='';
  list.forEach(c=>{
    const isDone=done.includes(c.id);
    const card=document.createElement('div');
    card.className=`bg-card p-6 md:p-10 rounded-3xl md:rounded-[3rem] border-4 flex flex-col items-center justify-center gap-4 md:gap-6 bento-transition active:scale-95 cursor-pointer shadow-2xl ${isDone?'border-brandGreen':'border-slate-200'}`;
    card.onclick=()=>{openPlayer(c.id);};
    card.innerHTML=`
      <div class="w-28 h-28 md:w-40 md:h-40 rounded-full bg-brandCyan flex items-center justify-center text-5xl md:text-7xl text-white shadow-lg">
        <i class="fa-solid ${iconForCourse(c)}"></i>
      </div>
      <h3 class="font-bangers text-2xl md:text-4xl text-center text-dark">${c.titre}</h3>
      <span class="${isDone?'bg-brandGreen':'bg-dark'} text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-black text-base md:text-xl uppercase tracking-widest">${isDone?'Fini ✓':'Jouer'}</span>
      <span class="text-xs text-slate-500">Cours #${c.id} · ${c.duree||'60 min'}</span>`;
    grid.appendChild(card);
  });
}

// ═══════════ MODAL ═══════════
function openCourseModal(id){
  const c=COURS.find(x=>x.id===id);if(!c)return;
  selectedCourseId=id;
  const fav=getFav(),done=getDone();
  document.getElementById('modal-title').innerText=c.titre;
  document.getElementById('modal-id').innerText='#'+String(c.id).padStart(2,'0');
  document.getElementById('modal-desc').innerText=c.intention||'';
  document.getElementById('modal-icon').className=`fa-solid ${iconForCourse(c)} text-white text-6xl md:text-7xl relative z-10`;
  const pfeq=document.getElementById('modal-pfeq');
  pfeq.innerHTML=(c.pfeq||[]).map(p=>`<span class="bg-brandCyan/20 text-brandCyan px-3 py-1 rounded-full text-xs font-bold">${p}</span>`).join('');
  document.getElementById('modal-launch-btn').onclick=()=>{closeModal();openPlayer(id);};
  document.getElementById('modal-fav-btn').classList.toggle('bg-brandYellow',fav.includes(id));
  document.getElementById('modal-fav-btn').classList.toggle('text-dark',fav.includes(id));
  document.getElementById('modal-done-btn').classList.toggle('bg-brandGreen',done.includes(id));
  const modal=document.getElementById('course-modal');
  modal.style.display='flex';
  setTimeout(()=>modal.classList.add('opacity-100'),10);
}
function closeModal(){
  const modal=document.getElementById('course-modal');
  modal.classList.remove('opacity-100');
  setTimeout(()=>modal.style.display='none',300);
}
function modalToggleFav(){
  const f=getFav();const i=f.indexOf(selectedCourseId);
  if(i>-1)f.splice(i,1);else f.push(selectedCourseId);
  localStorage.setItem(FAV_KEY,JSON.stringify(f));openCourseModal(selectedCourseId);renderGrid();
}
function modalToggleDone(){
  const d=getDone();const i=d.indexOf(selectedCourseId);
  if(i>-1)d.splice(i,1);else d.push(selectedCourseId);
  localStorage.setItem(DONE_KEY,JSON.stringify(d));openCourseModal(selectedCourseId);renderAll();
}

// ═══════════ PLAYER ═══════════
function openPlayer(id){
  const c=COURS.find(x=>x.id===id);if(!c)return;
  selectedCourseId=id;
  document.getElementById('player-title').innerText=c.titre;
  document.getElementById('player-id-tiny').innerText='#'+String(c.id).padStart(2,'0');
  document.getElementById('player-id-badge').innerText='#'+String(c.id).padStart(2,'0');
  document.getElementById('player-niveau').innerText=(c.niveau||'4-5 ans').replace('Maternelle ','');
  document.getElementById('player-duree').innerText=(c.duree||'60 min');
  document.getElementById('player-eleves').innerText=(c.eleves||'15-25');
  document.getElementById('player-astuce').innerText=c.astuce||'L\'imaginaire fait tout. Si tu y crois, ils y croient.';

  // Intention
  const intW=document.getElementById('player-intention-wrap');
  if(c.intention){intW.classList.remove('hidden');document.getElementById('player-intention').innerText=c.intention;}
  else intW.classList.add('hidden');

  // PFEQ
  const pfeqW=document.getElementById('player-pfeq-wrap');
  if(c.pfeq_principale||c.pfeq_secondaire){
    pfeqW.classList.remove('hidden');
    document.getElementById('player-pfeq-principale').innerHTML=c.pfeq_principale?`<b class="text-brandPink">Principale :</b><br><span class="text-slate-200">${c.pfeq_principale}</span>`:'';
    document.getElementById('player-pfeq-secondaire').innerHTML=c.pfeq_secondaire?`<b class="text-brandCyan">Secondaire(s) :</b><br><span class="text-slate-200">${c.pfeq_secondaire}</span>`:'';
  }else pfeqW.classList.add('hidden');

  // Préparation
  const prepW=document.getElementById('player-prep-wrap');
  if(c.preparation&&c.preparation.length){prepW.classList.remove('hidden');document.getElementById('player-prep').innerHTML=c.preparation.map(p=>`<li>${p}</li>`).join('');}
  else prepW.classList.add('hidden');

  // Évaluation
  const evalW=document.getElementById('player-eval-wrap');
  if(c.evaluation){evalW.classList.remove('hidden');document.getElementById('player-eval').innerHTML=(c.evaluation+'').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>');}
  else evalW.classList.add('hidden');

  // Liens transversaux
  const liensW=document.getElementById('player-liens-wrap');
  if(c.liens&&c.liens.length){liensW.classList.remove('hidden');document.getElementById('player-liens').innerHTML=c.liens.map(l=>`<li><b class="text-brandGreen">${l.discipline} :</b> ${l.lien}</li>`).join('');}
  else liensW.classList.add('hidden');

  // Prolongement
  const prolongW=document.getElementById('player-prolong-wrap');
  if(c.prolongement){prolongW.classList.remove('hidden');document.getElementById('player-prolong').innerText=c.prolongement;}
  else prolongW.classList.add('hidden');

  // Matériel global
  const matList=document.getElementById('player-material-list');
  matList.innerHTML=(c.materiel||[]).map(m=>`<li class="flex items-start gap-3 text-slate-200 font-medium text-base md:text-xl p-4 bg-slate-800/40 rounded-xl border border-slate-700/50"><i class="fa-solid fa-check text-brandCyan mt-1"></i><span>${m}</span></li>`).join('');

  // Tabs
  const isDone=getDone().includes(c.id);
  const finishBtn=document.getElementById('finish-btn');
  finishBtn.innerHTML=isDone?'<i class="fa-solid fa-rotate-left"></i> <span class="hidden md:inline">REFAIRE</span>':'<i class="fa-solid fa-check"></i> <span class="hidden md:inline">TERMINER</span>';
  finishBtn.className=isDone?'bg-slate-600 text-white px-4 md:px-8 py-2 md:py-3 rounded-2xl font-black text-sm md:text-lg hover:scale-105 bento-transition whitespace-nowrap':'bg-brandGreen text-white px-4 md:px-8 py-2 md:py-3 rounded-2xl font-black text-sm md:text-lg hover:scale-105 bento-transition shadow-lg shadow-brandGreen/20 whitespace-nowrap';

  switchView('course');
  loadSection('mise_en_train');
}

function loadSection(sec){
  currentSection=sec;
  const c=COURS.find(x=>x.id===selectedCourseId);if(!c)return;
  const a=c[sec];if(!a){document.getElementById('player-explanations').innerHTML='<p class="text-slate-500 italic">Section non disponible pour ce cours.</p>';return;}

  // Tab active state
  document.querySelectorAll('.player-tab').forEach(t=>{
    const isActive=t.dataset.section===sec;
    t.className=`player-tab flex-1 min-w-[140px] py-4 px-5 rounded-xl font-bangers tracking-wider text-2xl md:text-3xl bento-transition whitespace-nowrap ${isActive?'bg-brandCyan text-dark':'text-slate-400 hover:bg-slate-700'}`;
  });

  document.getElementById('player-activity-name').innerText=a.nom||'';
  document.getElementById('player-activity-duree').innerText=a.duree?('⏱ '+a.duree):'';
  document.getElementById('player-activity-but').innerText=a.but?('🎯 '+a.but):'';
  document.getElementById('player-main-icon').className=`fa-solid ${ICON_BY_KIND[sec]||'fa-star'} text-[60px] md:text-[100px] text-brandYellow animate-float`;

  const showHide=(wrapId,arr,populate)=>{
    const w=document.getElementById(wrapId);
    if(arr&&(Array.isArray(arr)?arr.length:arr)){w.classList.remove('hidden');populate();}
    else w.classList.add('hidden');
  };

  // DÉMO ENSEIGNANT
  showHide('player-demo-wrap',a.demo,()=>{document.getElementById('player-demo').innerHTML=enrichStep(a.demo);});

  // DÉROULEMENT cochables
  const stepsState=getStepsState();
  document.getElementById('player-explanations').innerHTML=(a.deroulement||[]).map((step,i)=>{
    const k=`${c.id}_${sec}_${i}`;const done=stepsState[k];
    return `<div class="flex gap-3 items-start cursor-pointer step-item p-3 rounded-xl hover:bg-slate-700/30 ${done?'step-done':''}" onclick="toggleStep('${k}',this)">
      <span class="w-9 h-9 md:w-10 md:h-10 rounded-full bg-brandCyan text-dark flex items-center justify-center font-black shrink-0 text-base">${i+1}</span>
      <p class="text-lg md:text-2xl font-medium leading-relaxed">${enrichStep(step)}</p>
    </div>`;
  }).join('');

  // CONSIGNES VERBATIM
  showHide('player-consignes-wrap',a.consignes,()=>{
    document.getElementById('player-consignes').innerHTML=a.consignes.map(q=>`<div class="bg-dark/40 rounded-xl p-4 border-l-4 border-brandCyan text-slate-100 text-xl md:text-2xl italic font-bold">📣 «&nbsp;${q}&nbsp;»</div>`).join('');
  });

  // VARIANTES
  showHide('player-variantes-wrap',a.variantes,()=>{
    document.getElementById('player-variantes').innerHTML=a.variantes.map(v=>`<li class="text-slate-200 text-base md:text-xl flex gap-3 leading-relaxed"><i class="fa-solid fa-shuffle text-brandPurple mt-1 shrink-0"></i><span>${v}</span></li>`).join('');
  });

  // SÉCURITÉ
  showHide('player-securite-wrap',a.securite,()=>{
    document.getElementById('player-securite').innerHTML=a.securite.map(s=>`<li class="text-slate-200 text-base md:text-xl flex gap-3 leading-relaxed"><i class="fa-solid fa-triangle-exclamation text-brandRed mt-1 shrink-0"></i><span>${s}</span></li>`).join('');
  });

  // ERREURS
  showHide('player-erreurs-wrap',a.erreurs,()=>{
    document.getElementById('player-erreurs').innerHTML=a.erreurs.map(e=>`<li class="text-slate-200 text-base md:text-xl flex gap-3 leading-relaxed"><i class="fa-solid fa-xmark text-orange-400 mt-1 shrink-0"></i><span>${e}</span></li>`).join('');
  });

  // QUESTIONS ÉLÈVES
  showHide('player-questions-wrap',a.questions_eleves,()=>{
    document.getElementById('player-questions').innerHTML=a.questions_eleves.map(q=>`<li class="text-slate-200 text-base md:text-xl flex gap-3 leading-relaxed"><i class="fa-solid fa-hand text-blue-400 mt-1 shrink-0"></i><span>${q}</span></li>`).join('');
  });

  // FAQ ENSEIGNANT
  showHide('player-faq-wrap',a.faq_enseignant,()=>{
    document.getElementById('player-faq').innerHTML=a.faq_enseignant.map(f=>`<li class="text-slate-200 text-base md:text-xl flex gap-3 leading-relaxed"><i class="fa-solid fa-chalkboard-user text-brandGreen mt-1 shrink-0"></i><span>${f}</span></li>`).join('');
  });

  // ADAPTATIONS
  showHide('player-adapt-wrap',a.adaptations,()=>{
    document.getElementById('player-adapt').innerHTML=a.adaptations.map(ad=>`<li class="text-slate-200 text-base md:text-xl flex gap-3 leading-relaxed"><i class="fa-solid fa-universal-access text-brandPink mt-1 shrink-0"></i><span>${ad}</span></li>`).join('');
  });

  document.getElementById('player-poster').scrollTo(0,0);
}

function enrichStep(txt){
  return txt.replace(/«\s?([^»]+?)\s?»/g,'<span class="bg-brandCyan/20 text-brandCyan font-bold px-2 py-1 rounded">📣 «&nbsp;$1&nbsp;»</span>');
}
function toggleStep(k,el){
  const s=getStepsState();s[k]=!s[k];
  localStorage.setItem(STEPS_KEY,JSON.stringify(s));
  el.classList.toggle('step-done',s[k]);
}

document.querySelectorAll('.player-tab').forEach(t=>{
  t.addEventListener('click',()=>loadSection(t.dataset.section));
});

function toggleDoneCourse(){
  const d=getDone();const i=d.indexOf(selectedCourseId);
  const justFinished=i===-1;
  if(i>-1)d.splice(i,1);else d.push(selectedCourseId);
  localStorage.setItem(DONE_KEY,JSON.stringify(d));
  if(justFinished)ztsConfetti();
  switchView('main');
}

// ═══════════ CONFETTIS ═══════════
function ztsConfetti(){
  if(typeof confetti!=='function')return;
  const colors=['#00C4FF','#FFF000','#FF8C00','#4ADE80','#A855F7'];
  confetti({particleCount:120,spread:80,origin:{y:.6},colors});
  setTimeout(()=>confetti({particleCount:60,angle:60,spread:55,origin:{x:0},colors}),200);
  setTimeout(()=>confetti({particleCount:60,angle:120,spread:55,origin:{x:1},colors}),200);
}

// ═══════════ TIMER + GONG ═══════════
let timerSec=600,timerInt=null,audioCtx=null;
function playGong(){
  try{
    audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();
    const ctx=audioCtx,now=ctx.currentTime;
    // 3 coups de gong : fondamentale + harmoniques
    [0,0.6,1.2].forEach((t,i)=>{
      const freqs=[110,220,330,440];// gong = mélange harmonique
      freqs.forEach(f=>{
        const o=ctx.createOscillator(),g=ctx.createGain();
        o.type='sine';o.frequency.value=f*(1+Math.random()*.02);
        g.gain.setValueAtTime(0,now+t);
        g.gain.linearRampToValueAtTime(.18/(freqs.indexOf(f)+1),now+t+.02);
        g.gain.exponentialRampToValueAtTime(.001,now+t+2.2);
        o.connect(g).connect(ctx.destination);
        o.start(now+t);o.stop(now+t+2.5);
      });
    });
  }catch(e){console.warn('Audio non supporté',e);}
}
function setTimerMinutes(m){
  if(timerInt){clearInterval(timerInt);timerInt=null;
    const btn=document.getElementById('timer-btn');
    btn.innerHTML='<i class="fa-solid fa-play"></i>';
    btn.classList.replace('bg-brandRed','bg-brandCyan');
  }
  timerSec=m*60;updateTimerDisplay();
}
function setTimerCustom(){
  const v=parseInt(document.getElementById('timer-custom').value);
  if(v>0&&v<=120){setTimerMinutes(v);document.getElementById('timer-custom').value='';}
}
function toggleTimer(){
  const btn=document.getElementById('timer-btn');
  if(timerInt){
    clearInterval(timerInt);timerInt=null;
    btn.innerHTML='<i class="fa-solid fa-play"></i>';
    btn.classList.replace('bg-brandRed','bg-brandCyan');
  }else{
    btn.innerHTML='<i class="fa-solid fa-pause"></i>';
    btn.classList.replace('bg-brandCyan','bg-brandRed');
    timerInt=setInterval(()=>{
      if(timerSec>0){timerSec--;updateTimerDisplay();}
      else{clearInterval(timerInt);timerInt=null;document.getElementById('timer-display').innerText='⏰ FIN';playGong();
        const btn=document.getElementById('timer-btn');btn.innerHTML='<i class="fa-solid fa-play"></i>';btn.classList.replace('bg-brandRed','bg-brandCyan');}
    },1000);
  }
}
function resetTimer(){
  clearInterval(timerInt);timerInt=null;timerSec=600;updateTimerDisplay();
  const btn=document.getElementById('timer-btn');
  btn.innerHTML='<i class="fa-solid fa-play"></i>';
  btn.classList.replace('bg-brandRed','bg-brandCyan');
}
function updateTimerDisplay(){
  const m=Math.floor(timerSec/60),s=timerSec%60;
  document.getElementById('timer-display').innerText=`${m}:${s<10?'0':''}${s}`;
}

// ═══════════ SURPRISE ═══════════
function rollSurprise(){
  const btn=document.getElementById('surprise-btn');
  const text=document.getElementById('surprise-text');
  const ic=document.getElementById('surprise-icon');
  btn.classList.add('hidden');
  text.innerText='SÉLECTION…';
  ic.className='fa-solid fa-sync fa-spin';
  setTimeout(()=>{
    const c=COURS[Math.floor(Math.random()*COURS.length)];
    text.innerText=c.titre.toUpperCase();
    ic.className=`fa-solid ${iconForCourse(c)}`;
    setTimeout(()=>openPlayer(c.id),1400);
  },1800);
}

// ═══════════ TBI MODE ═══════════
function toggleTBI(){
  document.body.classList.toggle('tbi');
  const on=document.body.classList.contains('tbi');
  if(on)localStorage.setItem(TBI_KEY,'1');else localStorage.removeItem(TBI_KEY);
  document.getElementById('tbi-btn').classList.toggle('bg-brandYellow',on);
  document.getElementById('tbi-btn').classList.toggle('text-dark',on);
}
if(localStorage.getItem(TBI_KEY))document.body.classList.add('tbi');

// ═══════════ EXPORT / IMPORT / PRINT ═══════════
function exportData(){
  const data={
    exported_at:new Date().toISOString(),
    version:1,
    done:getDone(),
    favoris:getFav(),
    steps:getStepsState(),
    tbi:!!localStorage.getItem(TBI_KEY)
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const date=new Date().toISOString().slice(0,10);
  a.href=url;a.download=`ZTS-Maternelle-${date}.json`;
  document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},100);
  alert('✅ Sauvegarde téléchargée !\n\nGarde le fichier en lieu sûr — tu pourras le réimporter plus tard ou sur un autre appareil.');
}
function importData(ev){
  const file=ev.target.files[0];if(!file)return;
  const r=new FileReader();
  r.onload=e=>{
    try{
      const d=JSON.parse(e.target.result);
      if(!confirm(`Importer cette sauvegarde ?\n\n• ${(d.done||[]).length} cours faits\n• ${(d.favoris||[]).length} favoris\n• Sauvegardé le ${(d.exported_at||'?').slice(0,10)}\n\n⚠️ Cela remplace tes données actuelles.`))return;
      if(d.done)localStorage.setItem(DONE_KEY,JSON.stringify(d.done));
      if(d.favoris)localStorage.setItem(FAV_KEY,JSON.stringify(d.favoris));
      if(d.steps)localStorage.setItem(STEPS_KEY,JSON.stringify(d.steps));
      if(d.tbi)localStorage.setItem(TBI_KEY,'1');
      alert('✅ Sauvegarde importée !');
      location.reload();
    }catch(err){alert('❌ Fichier invalide : '+err.message);}
  };
  r.readAsText(file);
  ev.target.value='';
}
function printCourse(){
  if(!selectedCourseId){alert('Ouvre un cours avant d\'imprimer.');return;}
  const c=COURS.find(x=>x.id===selectedCourseId);if(!c)return;
  const w=window.open('','_blank','width=900,height=1100');
  const sec=(a,label,emoji)=>{
    if(!a||!a.deroulement)return'';
    return `<div class="section">
      <h2>${emoji} ${label}${a.duree?' · '+a.duree:''} — ${a.nom||''}</h2>
      ${a.but?`<p class="but"><b>🎯 But :</b> ${a.but}</p>`:''}
      ${a.demo?`<p><b>🎬 Démonstration :</b> ${a.demo}</p>`:''}
      <h3>Déroulement :</h3>
      <ol>${a.deroulement.map(s=>`<li>${s}</li>`).join('')}</ol>
      ${a.consignes&&a.consignes.length?`<h3>Ce que tu dis (verbatim) :</h3><ul class="quotes">${a.consignes.map(q=>`<li>«&nbsp;${q}&nbsp;»</li>`).join('')}</ul>`:''}
      ${a.variantes&&a.variantes.length?`<h3>Variantes :</h3><ul>${a.variantes.map(v=>`<li>${v}</li>`).join('')}</ul>`:''}
      ${a.securite&&a.securite.length?`<h3>⚠️ Sécurité :</h3><ul>${a.securite.map(s=>`<li>${s}</li>`).join('')}</ul>`:''}
      ${a.erreurs&&a.erreurs.length?`<h3>❌ Erreurs fréquentes :</h3><ul>${a.erreurs.map(e=>`<li>${e}</li>`).join('')}</ul>`:''}
      ${a.adaptations&&a.adaptations.length?`<h3>♿ Adaptations :</h3><ul>${a.adaptations.map(ad=>`<li>${ad}</li>`).join('')}</ul>`:''}
    </div>`;
  };
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${c.titre} — ZTS Maternelle</title>
  <style>
    body{font-family:Georgia,serif;color:#000;max-width:780px;margin:0 auto;padding:24px;line-height:1.5;}
    h1{font-family:'Arial Black',sans-serif;font-size:28px;border-bottom:3px solid #06b6d4;padding-bottom:8px;color:#06b6d4;}
    h2{font-family:'Arial Black',sans-serif;font-size:20px;background:#06b6d4;color:#fff;padding:6px 12px;border-radius:6px;margin-top:24px;}
    h3{font-size:14px;text-transform:uppercase;letter-spacing:1px;color:#444;margin-top:16px;margin-bottom:6px;}
    .section{page-break-inside:avoid;margin-bottom:20px;}
    ol,ul{padding-left:22px;}
    li{margin-bottom:6px;}
    .but{background:#fef3c7;padding:8px 12px;border-left:4px solid #facc15;border-radius:4px;}
    .quotes li{background:#dbeafe;padding:6px 10px;border-left:3px solid #3b82f6;border-radius:4px;font-style:italic;list-style:none;margin-left:-22px;margin-bottom:4px;}
    .meta{display:flex;gap:20px;font-size:12px;color:#666;margin:8px 0 16px;text-transform:uppercase;letter-spacing:1px;}
    .meta b{color:#000;}
    .intention{background:#f3e8ff;padding:12px;border-radius:6px;border-left:4px solid #a855f7;font-size:14px;}
    .materiel{background:#f0fdf4;padding:12px;border-radius:6px;border-left:4px solid #22c55e;}
    .footer{margin-top:30px;padding-top:12px;border-top:1px solid #ccc;font-size:11px;color:#888;text-align:center;}
    @media print{body{max-width:none;padding:0;}}
  </style></head><body>
    <h1>Cours #${c.id} — ${c.titre}</h1>
    <div class="meta"><span><b>Niveau :</b> ${c.niveau||'Maternelle'}</span><span><b>Durée :</b> ${c.duree||'60 min'}</span><span><b>Élèves :</b> ${c.eleves||'15-25'}</span></div>
    ${c.intention?`<div class="intention"><b>🎯 Intention pédagogique :</b><br>${c.intention}</div>`:''}
    ${c.pfeq_principale?`<p><b>PFEQ principale :</b> ${c.pfeq_principale}</p>`:''}
    ${c.pfeq_secondaire?`<p><b>PFEQ secondaire(s) :</b> ${c.pfeq_secondaire}</p>`:''}
    ${c.materiel&&c.materiel.length?`<div class="materiel"><b>📦 Matériel :</b><ul>${c.materiel.map(m=>`<li>${m}</li>`).join('')}</ul></div>`:''}
    ${c.preparation&&c.preparation.length?`<div class="section"><h2>🔧 Préparation du gymnase</h2><ol>${c.preparation.map(p=>`<li>${p}</li>`).join('')}</ol></div>`:''}
    ${sec(c.mise_en_train,'1. Mise en train','🔥')}
    ${sec(c.activite_1,'2. Activité 1','▶️')}
    ${sec(c.activite_2,'3. Activité 2','▶️')}
    ${sec(c.retour,'4. Retour au calme','🌙')}
    ${c.astuce?`<div class="section"><h2>💡 Astuce du maître du jeu</h2><p style="font-style:italic;">${c.astuce}</p></div>`:''}
    ${c.evaluation?`<div class="section"><h2>📋 Évaluation</h2><p>${(c.evaluation+'').replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\n/g,'<br>')}</p></div>`:''}
    ${c.liens&&c.liens.length?`<div class="section"><h2>🔗 Liens transversaux</h2><ul>${c.liens.map(l=>`<li><b>${l.discipline} :</b> ${l.lien}</li>`).join('')}</ul></div>`:''}
    ${c.prolongement?`<div class="section"><h2>🏫 Prolongement en classe</h2><p>${c.prolongement}</p></div>`:''}
    <div class="footer">Zone Total Sport · 90 Cours Maternelle · zonetotalsport.ca</div>
  </body></html>`);
  w.document.close();
  setTimeout(()=>{w.print();},400);
}

// ═══════════ AIDE ═══════════
function afficherAide(){showWelcome();}

// ═══════════ INIT ═══════════
if(!checkAccess()){/* lock screen visible */}
