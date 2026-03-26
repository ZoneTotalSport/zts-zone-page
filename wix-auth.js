/**
 * ZTS Zone - Wix Headless OAuth Authentication System
 * For zone.zonetotalsport.ca (static GitHub Pages site)
 *
 * Uses Wix OAuth2 redirect flow with authorization code grant.
 * Self-contained: injects its own CSS, popup markup, and toast notifications.
 */

(function (root, factory) {
  var module = factory();
  // CommonJS export support
  if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
    exports.showAuthPopup = module.showAuthPopup;
    exports.checkAuthState = module.checkAuthState;
    exports.logout = module.logout;
  }
  // Attach to window for script-tag usage
  root.ZTSAuth = module;
})(typeof self !== 'undefined' ? self : this, function () {

  // ── Configuration ──────────────────────────────────────────────────────────
  var CONFIG = {
    clientId: 'd6e226b9-1557-4267-89ba-120b62e1ac57',
    redirectUri: 'https://zone.zonetotalsport.ca/',
    authorizeUrl: 'https://www.wix.com/oauth/authorize',
    tokenUrl: 'https://www.wixapis.com/oauth2/token',
    memberInfoUrl: 'https://www.wixapis.com/members/v1/members/my',
    proxyPrefix: 'https://corsproxy.io/?',
    storageKeys: {
      accessToken: 'zts_access_token',
      refreshToken: 'zts_refresh_token',
      memberName: 'zts_member_name',
      memberEmail: 'zts_member_email',
      oauthState: 'zts_oauth_state',
    },
  };

  // ── Utility helpers ────────────────────────────────────────────────────────

  function generateState() {
    var array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (_) { /* quota */ }
  }

  function load(key) {
    try { return localStorage.getItem(key); } catch (_) { return null; }
  }

  function remove(key) {
    try { localStorage.removeItem(key); } catch (_) { /* noop */ }
  }

  function isLoggedIn() {
    return !!load(CONFIG.storageKeys.accessToken);
  }

  function getMemberName() {
    return load(CONFIG.storageKeys.memberName) || '';
  }

  // ── CSS injection ──────────────────────────────────────────────────────────

  function injectStyles() {
    if (document.getElementById('zts-auth-styles')) return;

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Patrick+Hand&family=Fredoka+One&display=swap';
    document.head.appendChild(link);

    var style = document.createElement('style');
    style.id = 'zts-auth-styles';
    style.textContent = [
      '/* ── Overlay ── */',
      '.zts-auth-overlay {',
      '  position: fixed; inset: 0; z-index: 99999;',
      '  display: flex; align-items: center; justify-content: center;',
      '  background: rgba(15, 15, 46, 0.75);',
      '  backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);',
      '  opacity: 0; visibility: hidden;',
      '  transition: opacity 0.35s ease, visibility 0.35s ease;',
      '}',
      '.zts-auth-overlay.zts-visible { opacity: 1; visibility: visible; }',

      '/* ── Modal ── */',
      '.zts-auth-modal {',
      '  position: relative; width: 94%; max-width: 500px;',
      '  background: #0F0F2E; border-radius: 24px; overflow: hidden;',
      '  box-shadow: 0 12px 60px rgba(0,229,255,0.25), 0 0 0 2px rgba(0,229,255,0.15);',
      '  transform: translateY(40px) scale(0.95);',
      '  transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);',
      '}',
      '.zts-auth-overlay.zts-visible .zts-auth-modal { transform: translateY(0) scale(1); }',

      '/* ── Header ── */',
      '.zts-auth-header {',
      '  background: linear-gradient(135deg, #00E5FF 0%, #00FF88 50%, #FF6B00 100%);',
      '  padding: 36px 28px 30px; text-align: center; position: relative;',
      '}',
      '.zts-auth-header .zts-emoji-row { font-size: 2.2rem; margin-bottom: 10px; letter-spacing: 8px; }',
      '.zts-auth-header h2 {',
      '  font-family: "Luckiest Guy", cursive; font-size: 2.8rem; color: #0F0F2E;',
      '  margin: 0 0 8px; text-shadow: 2px 2px 0 rgba(255,255,255,0.25); letter-spacing: 3px;',
      '}',
      '.zts-auth-header p {',
      '  font-family: "Patrick Hand", cursive; font-size: 1.3rem;',
      '  color: #0F0F2E; margin: 0; opacity: 0.85;',
      '}',

      '/* ── Close button ── */',
      '.zts-auth-close {',
      '  position: absolute; top: 14px; right: 16px; width: 38px; height: 38px;',
      '  border: none; background: rgba(15,15,46,0.25); color: #0F0F2E;',
      '  font-size: 1.5rem; font-weight: 700; border-radius: 50%;',
      '  cursor: pointer; display: flex; align-items: center; justify-content: center;',
      '  transition: background 0.2s; line-height: 1;',
      '}',
      '.zts-auth-close:hover { background: rgba(15,15,46,0.45); }',

      '/* ── Body ── */',
      '.zts-auth-body { padding: 36px 32px 20px; display: flex; flex-direction: column; gap: 18px; }',

      '/* ── Buttons ── */',
      '.zts-auth-btn {',
      '  display: flex; align-items: center; justify-content: center; gap: 14px;',
      '  padding: 20px 28px; border: none; border-radius: 16px;',
      '  font-family: "Fredoka One", cursive; font-size: 1.4rem; color: #0F0F2E;',
      '  cursor: pointer; text-decoration: none;',
      '  box-shadow: 0 4px 20px rgba(0,0,0,0.25);',
      '  transition: transform 0.2s, box-shadow 0.2s;',
      '}',
      '.zts-auth-btn:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.35); }',
      '.zts-auth-btn:active { transform: translateY(0); }',
      '.zts-auth-btn--login { background: linear-gradient(135deg, #00E5FF, #00FF88); }',
      '.zts-auth-btn--register { background: linear-gradient(135deg, #FF6B00, #FFD700); }',
      '.zts-auth-btn .zts-btn-icon { font-size: 1.6rem; }',

      '/* ── Footer ── */',
      '.zts-auth-footer { text-align: center; padding: 8px 28px 28px; }',
      '.zts-auth-footer p { font-family: "Patrick Hand", cursive; font-size: 1rem; color: rgba(255,255,255,0.4); margin: 0; }',

      '/* ── Toast ── */',
      '.zts-toast {',
      '  position: fixed; top: 24px; right: 24px; z-index: 100000;',
      '  background: linear-gradient(135deg, #00E5FF, #00FF88);',
      '  color: #0F0F2E; font-family: "Fredoka One", cursive; font-size: 1.15rem;',
      '  padding: 18px 30px; border-radius: 14px;',
      '  box-shadow: 0 6px 30px rgba(0,229,255,0.35);',
      '  transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.34,1.56,0.64,1);',
      '}',
      '.zts-toast.zts-toast-visible { transform: translateX(0); }',

      '/* ── Nav user menu ── */',
      '.zts-user-menu { position: relative; display: inline-block; }',
      '.zts-user-btn {',
      '  background: linear-gradient(135deg, #00E5FF, #00FF88);',
      '  border: none; color: #0F0F2E; font-family: "Fredoka One", cursive;',
      '  font-size: 1rem; padding: 10px 20px; border-radius: 12px;',
      '  cursor: pointer; box-shadow: 0 3px 12px rgba(0,229,255,0.25);',
      '  transition: transform 0.2s, box-shadow 0.2s; white-space: nowrap;',
      '}',
      '.zts-user-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,229,255,0.35); }',
      '.zts-user-dropdown {',
      '  position: absolute; top: calc(100% + 8px); right: 0; min-width: 210px;',
      '  background: #1a1a3e; border-radius: 14px;',
      '  box-shadow: 0 8px 30px rgba(0,0,0,0.4); border: 1px solid rgba(0,229,255,0.15);',
      '  overflow: hidden; opacity: 0; visibility: hidden; transform: translateY(-8px);',
      '  transition: opacity 0.25s, visibility 0.25s, transform 0.25s;',
      '}',
      '.zts-user-dropdown.zts-dropdown-open { opacity: 1; visibility: visible; transform: translateY(0); }',
      '.zts-user-dropdown a, .zts-user-dropdown button {',
      '  display: block; width: 100%; padding: 14px 20px; border: none; background: none;',
      '  color: #fff; font-family: "Patrick Hand", cursive; font-size: 1.15rem;',
      '  text-align: left; text-decoration: none; cursor: pointer; transition: background 0.15s;',
      '}',
      '.zts-user-dropdown a:hover, .zts-user-dropdown button:hover { background: rgba(0,229,255,0.1); }',
      '.zts-user-dropdown button.zts-logout-link { color: #FF6B00; border-top: 1px solid rgba(255,255,255,0.06); }',

      '/* ── Mobile ── */',
      '@media (max-width: 520px) {',
      '  .zts-auth-modal { width: 100%; max-width: 100%; height: 100dvh; border-radius: 0; display: flex; flex-direction: column; justify-content: center; }',
      '  .zts-auth-header h2 { font-size: 2.3rem; }',
      '  .zts-auth-body { padding: 28px 20px 24px; }',
      '  .zts-toast { left: 16px; right: 16px; text-align: center; }',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  // ── Popup markup ───────────────────────────────────────────────────────────

  var overlayEl = null;

  function createPopup() {
    if (overlayEl) return overlayEl;

    var div = document.createElement('div');
    div.className = 'zts-auth-overlay';
    div.id = 'zts-auth-overlay';
    div.innerHTML = [
      '<div class="zts-auth-modal" role="dialog" aria-modal="true" aria-label="Connexion ZTS Zone">',
      '  <div class="zts-auth-header">',
      '    <button class="zts-auth-close" aria-label="Fermer" id="zts-auth-close-btn">&times;</button>',
      '    <div class="zts-emoji-row">\u26BD \uD83C\uDFC0 \uD83C\uDFBE \uD83C\uDFC8 \uD83E\uDD4D</div>',
      '    <h2>ZTS ZONE</h2>',
      '    <p>Rejoins la communaut\u00E9 des enseignants en \u00C9PS!</p>',
      '  </div>',
      '  <div class="zts-auth-body">',
      '    <button class="zts-auth-btn zts-auth-btn--login" id="zts-btn-login">',
      '      <span class="zts-btn-icon">\uD83D\uDD12</span>',
      '      Se connecter',
      '    </button>',
      '    <button class="zts-auth-btn zts-auth-btn--register" id="zts-btn-register">',
      '      <span class="zts-btn-icon">\uD83D\uDC64</span>',
      '      Cr\u00E9er un compte',
      '    </button>',
      '  </div>',
      '  <div class="zts-auth-footer">',
      '    <p>Propuls\u00E9 par Zone Total Sport \u00A9 ' + new Date().getFullYear() + '</p>',
      '  </div>',
      '</div>',
    ].join('\n');

    document.body.appendChild(div);
    overlayEl = div;

    // Close handlers
    div.querySelector('#zts-auth-close-btn').addEventListener('click', hideAuthPopup);
    div.addEventListener('click', function (e) {
      if (e.target === div) hideAuthPopup();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && div.classList.contains('zts-visible')) hideAuthPopup();
    });

    // Auth buttons
    div.querySelector('#zts-btn-login').addEventListener('click', function () {
      redirectToWixAuth('login');
    });
    div.querySelector('#zts-btn-register').addEventListener('click', function () {
      redirectToWixAuth('register');
    });

    return div;
  }

  // ── PKCE helpers ────────────────────────────────────────────────────────────

  function generateCodeVerifier() {
    var array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function sha256(plain) {
    var encoder = new TextEncoder();
    return crypto.subtle.digest('SHA-256', encoder.encode(plain));
  }

  function base64urlencode(buf) {
    var str = '';
    var bytes = new Uint8Array(buf);
    for (var i = 0; i < bytes.byteLength; i++) {
      str += String.fromCharCode(bytes[i]);
    }
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  // ── OAuth redirect (Wix Headless PKCE flow) ──────────────────────────────

  async function redirectToWixAuth(mode) {
    try {
      // Show loading state on buttons
      var btns = document.querySelectorAll('#zts-btn-login, #zts-btn-register');
      btns.forEach(function(b) { b.style.opacity = '0.6'; b.style.pointerEvents = 'none'; });

      // Step 1: Generate PKCE code verifier & challenge
      var codeVerifier = generateCodeVerifier();
      store('zts_code_verifier', codeVerifier);
      var hashed = await sha256(codeVerifier);
      var codeChallenge = base64urlencode(hashed);

      var state = generateState();
      store(CONFIG.storageKeys.oauthState, state);

      // Step 2: Get anonymous visitor tokens
      var anonResponse = await fetch(CONFIG.proxyPrefix + encodeURIComponent(CONFIG.tokenUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: CONFIG.clientId,
          grantType: 'anonymous'
        })
      });
      var anonTokens = await anonResponse.json();
      var visitorToken = anonTokens.access_token;

      // Step 3: Create redirect session to get login URL
      var sessionBody = {
        auth: {
          authRequest: {
            redirectUri: CONFIG.redirectUri,
            clientId: CONFIG.clientId,
            codeChallenge: codeChallenge,
            codeChallengeMethod: 'S256',
            responseMode: 'query',
            responseType: 'code',
            scope: 'offline_access',
            state: state
          }
        }
      };

      // Add login/signup preference
      if (mode === 'register') {
        sessionBody.auth.prompt = 'signup';
      }

      var sessionResponse = await fetch(CONFIG.proxyPrefix + encodeURIComponent('https://www.wixapis.com/_api/redirects-api/v1/redirect-session'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': visitorToken
        },
        body: JSON.stringify(sessionBody)
      });

      var sessionData = await sessionResponse.json();

      if (sessionData && sessionData.redirectSession && sessionData.redirectSession.fullUrl) {
        window.location.href = sessionData.redirectSession.fullUrl;
      } else {
        console.error('[ZTS Auth] Redirect session failed:', sessionData);
        // Fallback: redirect to Wix login page directly
        window.location.href = 'https://www.zonetotalsport.ca/account/login';
      }
    } catch (err) {
      console.error('[ZTS Auth] OAuth redirect error:', err);
      // Fallback
      window.location.href = 'https://www.zonetotalsport.ca/account/login';
    }
  }

  // ── Show / hide popup ──────────────────────────────────────────────────────

  function showAuthPopup() {
    if (isLoggedIn()) return;
    injectStyles();
    var popup = createPopup();
    // Force reflow so the transition plays
    void popup.offsetHeight;
    popup.classList.add('zts-visible');
    document.body.style.overflow = 'hidden';
  }

  function hideAuthPopup() {
    if (!overlayEl) return;
    overlayEl.classList.remove('zts-visible');
    document.body.style.overflow = '';
  }

  // ── Toast notification ─────────────────────────────────────────────────────

  function showToast(message, durationMs) {
    injectStyles();
    var toast = document.createElement('div');
    toast.className = 'zts-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toast.classList.add('zts-toast-visible');
      });
    });

    var duration = durationMs || 4000;
    setTimeout(function () {
      toast.classList.remove('zts-toast-visible');
      setTimeout(function () { toast.remove(); }, 500);
    }, duration);
  }

  // ── Token exchange ─────────────────────────────────────────────────────────

  function exchangeCodeForTokens(code) {
    // Retrieve PKCE code verifier
    var codeVerifier = load('zts_code_verifier') || '';

    var body = JSON.stringify({
      clientId: CONFIG.clientId,
      grantType: 'authorization_code',
      redirectUri: CONFIG.redirectUri,
      code: code,
      codeVerifier: codeVerifier
    });

    // Try direct fetch first, fall back to CORS proxy
    return fetch(CONFIG.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    }).catch(function () {
      // CORS blocked - use proxy
      return fetch(CONFIG.proxyPrefix + encodeURIComponent(CONFIG.tokenUrl), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
      });
    }).then(function (response) {
      if (!response.ok) {
        return response.text().then(function (errText) {
          throw new Error('Token exchange failed (' + response.status + '): ' + errText);
        });
      }
      return response.json();
    });
  }

  // ── Fetch member info ──────────────────────────────────────────────────────

  function fetchMemberInfo(accessToken) {
    var headers = {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    };

    return fetch(CONFIG.memberInfoUrl, { headers: headers })
      .catch(function () {
        return fetch(CONFIG.proxyPrefix + encodeURIComponent(CONFIG.memberInfoUrl), {
          headers: headers,
        });
      })
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (data) {
        if (!data) return null;
        return data.member || data;
      });
  }

  // ── OAuth callback handler ─────────────────────────────────────────────────

  function handleOAuthCallback() {
    var params = new URLSearchParams(window.location.search);
    var code = params.get('code');
    var state = params.get('state');

    if (!code) return Promise.resolve(false);

    // Verify state to prevent CSRF
    var savedState = load(CONFIG.storageKeys.oauthState);
    if (savedState && state !== savedState) {
      console.warn('[ZTS Auth] OAuth state mismatch - possible CSRF attempt.');
      cleanUrl();
      return Promise.resolve(false);
    }
    remove(CONFIG.storageKeys.oauthState);

    return exchangeCodeForTokens(code)
      .then(function (tokens) {
        store(CONFIG.storageKeys.accessToken, tokens.access_token);
        if (tokens.refresh_token) {
          store(CONFIG.storageKeys.refreshToken, tokens.refresh_token);
        }

        // Fetch member details
        return fetchMemberInfo(tokens.access_token)
          .then(function (member) {
            var displayName = '';
            if (member) {
              displayName =
                (member.contact && member.contact.firstName) ||
                (member.profile && member.profile.nickname) ||
                '';
              if (member.contact && member.contact.firstName) {
                store(CONFIG.storageKeys.memberName, member.contact.firstName);
              }
              if (member.loginEmail) {
                store(CONFIG.storageKeys.memberEmail, member.loginEmail);
              }
            }
            cleanUrl();
            showToast('Bienvenue ' + (displayName || 'chez ZTS') + '! \uD83C\uDF89');
            updateNavUI();
            return true;
          })
          .catch(function (memberErr) {
            console.warn('[ZTS Auth] Could not fetch member info:', memberErr);
            cleanUrl();
            showToast('Connect\u00E9! \uD83C\uDF89');
            updateNavUI();
            return true;
          });
      })
      .catch(function (err) {
        console.error('[ZTS Auth] OAuth callback error:', err);
        cleanUrl();
        showToast('Erreur de connexion. R\u00E9essayez.', 5000);
        return false;
      });
  }

  function cleanUrl() {
    var url = new URL(window.location.href);
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    window.history.replaceState({}, document.title, url.pathname + url.hash);
  }

  // ── Nav UI update ──────────────────────────────────────────────────────────

  function updateNavUI() {
    injectStyles();

    // Remove any previous user menus
    var prevMenus = document.querySelectorAll('.zts-user-menu');
    for (var i = 0; i < prevMenus.length; i++) prevMenus[i].remove();

    if (!isLoggedIn()) {
      // Restore any hidden connexion buttons
      var hidden = document.querySelectorAll('[data-zts-original-login]');
      for (var j = 0; j < hidden.length; j++) {
        hidden[j].style.display = '';
        hidden[j].removeAttribute('data-zts-original-login');
      }
      return;
    }

    var name = getMemberName() || 'Membre';

    // Find the connexion / login buttons to replace
    var targets = findLoginElements();
    if (targets.length === 0) return;

    for (var k = 0; k < targets.length; k++) {
      replaceWithUserMenu(targets[k], name);
    }
  }

  function replaceWithUserMenu(target, name) {
    // Hide original
    target.style.display = 'none';
    target.setAttribute('data-zts-original-login', '1');

    // Build dropdown
    var menu = document.createElement('div');
    menu.className = 'zts-user-menu';

    var btn = document.createElement('button');
    btn.className = 'zts-user-btn';
    btn.textContent = 'Salut, ' + name + '! \u25BC';

    var dropdown = document.createElement('div');
    dropdown.className = 'zts-user-dropdown';

    var profileLink = document.createElement('a');
    profileLink.href = 'https://zonetotalsport.ca/account/my-account';
    profileLink.target = '_blank';
    profileLink.textContent = '\uD83D\uDC64 Mon profil';

    var logoutBtn = document.createElement('button');
    logoutBtn.className = 'zts-logout-link';
    logoutBtn.textContent = '\uD83D\uDEAA D\u00E9connexion';

    dropdown.appendChild(profileLink);
    dropdown.appendChild(logoutBtn);
    menu.appendChild(btn);
    menu.appendChild(dropdown);

    // Insert after the hidden element
    target.parentNode.insertBefore(menu, target.nextSibling);

    // Toggle dropdown
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      dropdown.classList.toggle('zts-dropdown-open');
    });

    // Close on outside click
    document.addEventListener('click', function () {
      dropdown.classList.remove('zts-dropdown-open');
    });

    // Logout
    logoutBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      logout();
    });
  }

  // ── Logout ─────────────────────────────────────────────────────────────────

  function logout() {
    var keys = CONFIG.storageKeys;
    remove(keys.accessToken);
    remove(keys.refreshToken);
    remove(keys.memberName);
    remove(keys.memberEmail);
    remove(keys.oauthState);

    // Remove user menus
    var menus = document.querySelectorAll('.zts-user-menu');
    for (var i = 0; i < menus.length; i++) menus[i].remove();

    // Restore hidden buttons
    var hidden = document.querySelectorAll('[data-zts-original-login]');
    for (var j = 0; j < hidden.length; j++) {
      hidden[j].style.display = '';
      hidden[j].removeAttribute('data-zts-original-login');
    }

    showToast('\u00C0 bient\u00F4t! \uD83D\uDC4B');
  }

  // ── Check auth state ──────────────────────────────────────────────────────

  function checkAuthState() {
    if (isLoggedIn()) {
      updateNavUI();
      return true;
    }
    return false;
  }

  // ── Find login elements ────────────────────────────────────────────────────

  function findLoginElements() {
    var results = [];
    var selectors = [
      'a[href*="action=login"]',
      'a[href*="connexion"]',
      '[onclick*="login"]',
      '[onclick*="connexion"]',
      '[data-action="login"]',
    ];

    for (var s = 0; s < selectors.length; s++) {
      try {
        var els = document.querySelectorAll(selectors[s]);
        for (var i = 0; i < els.length; i++) {
          if (results.indexOf(els[i]) === -1) results.push(els[i]);
        }
      } catch (_) { /* invalid selector in edge cases */ }
    }

    // Also look for buttons/links whose text says "Connexion" or "Se connecter"
    var allLinks = document.querySelectorAll('a, button');
    for (var j = 0; j < allLinks.length; j++) {
      var text = (allLinks[j].textContent || '').trim().toLowerCase();
      if (
        (text === 'connexion' || text === 'se connecter' || text === 'login') &&
        results.indexOf(allLinks[j]) === -1
      ) {
        results.push(allLinks[j]);
      }
    }

    return results;
  }

  // ── Bind login elements ────────────────────────────────────────────────────

  function bindLoginElements() {
    if (isLoggedIn()) return;

    var elements = findLoginElements();
    for (var i = 0; i < elements.length; i++) {
      bindSingleElement(elements[i]);
    }
  }

  function bindSingleElement(el) {
    if (el.hasAttribute('data-zts-bound')) return;
    el.setAttribute('data-zts-bound', '1');

    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      showAuthPopup();
    });
  }

  // ── Initialization ─────────────────────────────────────────────────────────

  function init() {
    // 1. Handle OAuth callback if code is present in URL
    handleOAuthCallback().then(function (handled) {
      // 2. Check existing auth state and update UI
      if (!handled) {
        checkAuthState();
      }
      // 3. Bind login/connexion elements to open popup
      bindLoginElements();
    });
  }

  // Auto-init on DOMContentLoaded (or immediately if DOM is already ready)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  return {
    showAuthPopup: showAuthPopup,
    checkAuthState: checkAuthState,
    logout: logout,
  };
});
