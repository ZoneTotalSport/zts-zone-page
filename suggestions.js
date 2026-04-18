/**
 * ZTS Suggestions — Bouton flottant + popup
 * Reçoit les suggestions des internautes, sauve dans Firestore + notif Telegram
 * Drop-in: <script src="suggestions.js"></script>
 */
(function() {
  'use strict';

  // ── Inject CSS ──
  const css = `
    .zts-sugg-btn{position:fixed;right:20px;bottom:90px;z-index:9998;width:60px;height:60px;border-radius:50%;
      background:linear-gradient(135deg,#FF2A7A,#8B5CF6);color:#fff;border:3px solid #fff;cursor:pointer;
      box-shadow:0 6px 20px rgba(255,42,122,0.4);display:flex;align-items:center;justify-content:center;
      font-size:28px;transition:transform 0.2s;animation:zts-sugg-pulse 2.5s infinite;}
    .zts-sugg-btn:hover{transform:scale(1.1) rotate(10deg);}
    @keyframes zts-sugg-pulse{0%,100%{box-shadow:0 6px 20px rgba(255,42,122,0.4);}50%{box-shadow:0 6px 30px rgba(255,42,122,0.7);}}
    .zts-sugg-tooltip{position:fixed;right:90px;bottom:100px;background:#18181b;color:#FFD700;padding:8px 14px;
      border-radius:10px;font-family:'Bangers',Impact,sans-serif;letter-spacing:1px;font-size:14px;z-index:9998;
      pointer-events:none;opacity:0;transition:opacity 0.2s;white-space:nowrap;}
    .zts-sugg-btn:hover + .zts-sugg-tooltip{opacity:1;}

    .zts-sugg-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:none;
      align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);}
    .zts-sugg-overlay.show{display:flex;}
    .zts-sugg-modal{background:#fff;border-radius:20px;max-width:520px;width:100%;max-height:90vh;overflow-y:auto;
      box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:zts-sugg-in 0.3s ease-out;}
    @keyframes zts-sugg-in{from{transform:scale(0.9);opacity:0;}to{transform:scale(1);opacity:1;}}
    .zts-sugg-header{background:linear-gradient(135deg,#FF2A7A,#8B5CF6);color:#fff;padding:24px;text-align:center;
      border-radius:20px 20px 0 0;position:relative;}
    .zts-sugg-header h2{font-family:'Luckiest Guy',Impact,sans-serif;font-size:28px;letter-spacing:2px;margin:0;
      text-shadow:2px 2px 0 rgba(0,0,0,0.2);}
    .zts-sugg-header p{font-family:'Bangers',Impact,sans-serif;font-size:15px;letter-spacing:1px;margin-top:6px;opacity:0.95;}
    .zts-sugg-close{position:absolute;top:14px;right:14px;background:rgba(255,255,255,0.2);border:none;color:#fff;
      width:36px;height:36px;border-radius:50%;font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
    .zts-sugg-close:hover{background:rgba(255,255,255,0.35);}

    .zts-sugg-body{padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#18181b;}
    .zts-sugg-intro{background:#FFF7D6;border-left:4px solid #FFD700;padding:12px 14px;border-radius:8px;margin-bottom:18px;
      font-size:14px;color:#374151;line-height:1.5;}
    .zts-sugg-body label{display:block;font-weight:700;margin-bottom:6px;font-size:14px;color:#18181b;}
    .zts-sugg-body input,.zts-sugg-body textarea,.zts-sugg-body select{width:100%;padding:12px 14px;
      border:2px solid #e5e7eb;border-radius:10px;font-size:15px;font-family:inherit;margin-bottom:14px;
      transition:border-color 0.15s;}
    .zts-sugg-body input:focus,.zts-sugg-body textarea:focus,.zts-sugg-body select:focus{outline:none;border-color:#FFD700;}
    .zts-sugg-body textarea{min-height:120px;resize:vertical;}
    .zts-sugg-row{display:flex;gap:10px;}
    .zts-sugg-row > div{flex:1;}
    .zts-sugg-submit{width:100%;background:linear-gradient(135deg,#FFD700,#FF8C00);color:#18181b;border:3px solid #fff;
      padding:14px;border-radius:14px;font-family:'Luckiest Guy',Impact,sans-serif;font-size:18px;letter-spacing:2px;
      cursor:pointer;box-shadow:0 6px 16px rgba(255,215,0,0.4);transition:transform 0.15s;}
    .zts-sugg-submit:hover{transform:translateY(-2px);}
    .zts-sugg-submit:disabled{opacity:0.6;cursor:not-allowed;transform:none;}
    .zts-sugg-msg{padding:12px 14px;border-radius:10px;margin-bottom:14px;font-size:14px;display:none;}
    .zts-sugg-msg.show{display:block;}
    .zts-sugg-msg.err{background:#FEE;border-left:4px solid #EF4444;color:#991B1B;}
    .zts-sugg-msg.ok{background:#D1FAE5;border-left:4px solid #10B981;color:#065F46;}
    .zts-sugg-char{font-size:12px;color:#6b7280;text-align:right;margin-top:-8px;margin-bottom:12px;}

    @media(max-width:600px){
      .zts-sugg-btn{width:54px;height:54px;font-size:24px;bottom:80px;right:16px;}
      .zts-sugg-header h2{font-size:22px;}
      .zts-sugg-row{flex-direction:column;gap:0;}
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── Inject button + tooltip ──
  const btn = document.createElement('button');
  btn.className = 'zts-sugg-btn';
  btn.innerHTML = '💡';
  btn.setAttribute('aria-label','Suggérer une idée');
  btn.onclick = openModal;
  document.body.appendChild(btn);

  const tip = document.createElement('div');
  tip.className = 'zts-sugg-tooltip';
  tip.textContent = '💡 SUGGÈRE UNE IDÉE';
  document.body.appendChild(tip);

  // ── Inject modal ──
  const overlay = document.createElement('div');
  overlay.className = 'zts-sugg-overlay';
  overlay.innerHTML = `
    <div class="zts-sugg-modal" role="dialog" aria-labelledby="ztsSuggTitle">
      <div class="zts-sugg-header">
        <button class="zts-sugg-close" aria-label="Fermer">✕</button>
        <h2 id="ztsSuggTitle">💡 SUGGÈRE UNE IDÉE</h2>
        <p>AIDE-MOI À FAIRE GRANDIR LA ZONE 🪓</p>
      </div>
      <div class="zts-sugg-body">
        <div class="zts-sugg-intro">
          <strong>Ta voix compte!</strong> Un jeu manquant? Une app à rajouter? Un bug? Une idée de contenu?
          Écris-moi ici, je lis tout personnellement. — Joey 💛
        </div>

        <div class="zts-sugg-msg err" id="ztsSuggErr"></div>
        <div class="zts-sugg-msg ok" id="ztsSuggOk"></div>

        <label>Type de suggestion</label>
        <select id="ztsSuggType">
          <option value="idee_app">🚀 Nouvelle app / outil</option>
          <option value="contenu">📚 Contenu à ajouter (jeu, SAÉ, article…)</option>
          <option value="amelioration">✨ Amélioration d'une fonction existante</option>
          <option value="bug">🐛 Bug / problème</option>
          <option value="autre">💬 Autre</option>
        </select>

        <label>Ta suggestion <span style="color:#EF4444;">*</span></label>
        <textarea id="ztsSuggText" maxlength="1500" placeholder="Décris ton idée le plus clairement possible... Plus c'est précis, mieux c'est!"></textarea>
        <div class="zts-sugg-char"><span id="ztsSuggCount">0</span>/1500</div>

        <div class="zts-sugg-row">
          <div>
            <label>Ton prénom (optionnel)</label>
            <input type="text" id="ztsSuggName" maxlength="50" placeholder="Joey">
          </div>
          <div>
            <label>Ton courriel (optionnel, pour te répondre)</label>
            <input type="email" id="ztsSuggEmail" maxlength="100" placeholder="toi@exemple.com">
          </div>
        </div>

        <button class="zts-sugg-submit" id="ztsSuggSubmit">🚀 ENVOYER MA SUGGESTION</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const $ = id => document.getElementById(id);
  overlay.querySelector('.zts-sugg-close').onclick = closeModal;
  overlay.onclick = e => { if (e.target === overlay) closeModal(); };
  $('ztsSuggText').addEventListener('input', e => $('ztsSuggCount').textContent = e.target.value.length);
  $('ztsSuggSubmit').onclick = submit;

  function openModal() {
    // Prefill si connecté via firebase
    try {
      if (window.firebase && firebase.auth && firebase.auth().currentUser) {
        const u = firebase.auth().currentUser;
        if (!$('ztsSuggEmail').value) $('ztsSuggEmail').value = u.email || '';
        if (!$('ztsSuggName').value) $('ztsSuggName').value = (u.displayName || '').split(' ')[0] || '';
      }
    } catch(_) {}
    overlay.classList.add('show');
    if (typeof gtag === 'function') gtag('event','suggestion_opened',{event_category:'engagement'});
  }

  function closeModal() { overlay.classList.remove('show'); hideMsg('err'); hideMsg('ok'); }

  function showMsg(kind, text) {
    const el = $('ztsSugg' + (kind === 'err' ? 'Err' : 'Ok'));
    el.textContent = text;
    el.classList.add('show');
  }
  function hideMsg(kind) {
    const el = $('ztsSugg' + (kind === 'err' ? 'Err' : 'Ok'));
    el.classList.remove('show');
  }

  async function submit() {
    hideMsg('err'); hideMsg('ok');
    const text = $('ztsSuggText').value.trim();
    const type = $('ztsSuggType').value;
    const name = $('ztsSuggName').value.trim();
    const email = $('ztsSuggEmail').value.trim();

    if (text.length < 10) { showMsg('err','Suggestion trop courte (minimum 10 caractères).'); return; }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { showMsg('err','Courriel invalide.'); return; }

    const btn = $('ztsSuggSubmit');
    btn.disabled = true;
    btn.textContent = '⏳ ENVOI EN COURS...';

    const data = {
      type, text, name: name || 'Anonyme', email: email || null,
      page: location.pathname,
      ua: navigator.userAgent.slice(0,200),
      timestamp: new Date().toISOString()
    };

    // Firestore
    let saved = false;
    try {
      if (window.firebase && firebase.firestore) {
        const u = firebase.auth && firebase.auth().currentUser;
        await firebase.firestore().collection('suggestions').add({
          ...data,
          user_uid: u ? u.uid : null,
          user_email_auth: u ? u.email : null,
          serverTime: firebase.firestore.FieldValue.serverTimestamp(),
          reviewed: false
        });
        saved = true;
      }
    } catch(e) { console.warn('Firestore save failed:', e); }

    // Telegram
    try {
      if (typeof ztsNotifyTelegram === 'function') {
        const labels = {idee_app:'🚀 App',contenu:'📚 Contenu',amelioration:'✨ Amélioration',bug:'🐛 Bug',autre:'💬 Autre'};
        const msg = `💡 *Nouvelle suggestion ZTS*\n\n*${labels[type]||type}*\n${text}\n\n👤 ${data.name}${email?` · ${email}`:''}\n📄 ${data.page}`;
        ztsNotifyTelegram(msg);
      }
    } catch(e) { console.warn('Telegram notif failed:', e); }

    // Analytics
    if (typeof gtag === 'function') gtag('event','suggestion_sent',{event_category:'engagement',suggestion_type:type});

    if (!saved) {
      showMsg('err','Erreur de sauvegarde. Réessaye dans quelques secondes ou écris-moi directement à zts@hotmail.ca 🙏');
      btn.disabled = false;
      btn.textContent = '🚀 ENVOYER MA SUGGESTION';
      return;
    }

    showMsg('ok','✅ Merci! Ta suggestion est reçue. Joey lit tout personnellement 💛');
    $('ztsSuggText').value = '';
    $('ztsSuggCount').textContent = '0';
    btn.disabled = false;
    btn.textContent = '🚀 ENVOYER MA SUGGESTION';
    setTimeout(closeModal, 2500);
  }
})();
