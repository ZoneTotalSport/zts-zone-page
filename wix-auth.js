/**
 * ZTS Zone Total Sport — Wix Headless Authentication Module
 * Self-contained ES module for login/register/logout with Wix OAuth.
 * Uses @wix/sdk + @wix/members via CDN ESM, with OAuth redirect fallback.
 */

const WIX_CLIENT_ID = 'd6e226b9-1557-4267-89ba-120b62e1ac57';
const WIX_LOGIN_URL = 'https://www.zonetotalsport.ca/account/login';
const WIX_SIGNUP_URL = 'https://www.zonetotalsport.ca/account/sign-up';
const TOKEN_KEY = 'zts_wix_tokens';
const MEMBER_KEY = 'zts_wix_member';

let wixClient = null;
let sdkAvailable = false;

// ---------------------------------------------------------------------------
// 1. SDK Loader
// ---------------------------------------------------------------------------
async function loadWixSDK() {
    try {
        const [sdkMod, membersMod] = await Promise.all([
            import('https://cdn.jsdelivr.net/npm/@wix/sdk/+esm'),
            import('https://cdn.jsdelivr.net/npm/@wix/members/+esm')
        ]);

        const { createClient, OAuthStrategy } = sdkMod;
        const { members } = membersMod;

        wixClient = createClient({
            modules: { members },
            auth: OAuthStrategy({ clientId: WIX_CLIENT_ID })
        });

        // Restore tokens if available
        const saved = localStorage.getItem(TOKEN_KEY);
        if (saved) {
            try {
                wixClient.auth.setTokens(JSON.parse(saved));
            } catch (_) { /* ignore bad data */ }
        }

        sdkAvailable = true;
        return true;
    } catch (err) {
        console.warn('[ZTS Auth] SDK load failed, using redirect fallback:', err);
        sdkAvailable = false;
        return false;
    }
}

// ---------------------------------------------------------------------------
// 2. Token helpers
// ---------------------------------------------------------------------------
function saveTokens(tokens) {
    localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
}

function clearTokens() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(MEMBER_KEY);
}

function getSavedMember() {
    try { return JSON.parse(localStorage.getItem(MEMBER_KEY)); } catch { return null; }
}

function saveMember(m) {
    localStorage.setItem(MEMBER_KEY, JSON.stringify(m));
}

// ---------------------------------------------------------------------------
// 3. Auth actions
// ---------------------------------------------------------------------------
async function doLogin(email, password) {
    if (!sdkAvailable) {
        // SDK unavailable — use Wix OAuth redirect flow
        await startOAuthFlow('login');
        return;
    }
    const response = await wixClient.auth.login({ loginId: email, password });
    if (response.loginState === 'SUCCESS') {
        saveTokens(wixClient.auth.getTokens());
        await fetchAndSaveMember();
        closePopup();
        renderAuthUI();
    } else if (response.loginState === 'FAILURE' && response.errorCode === 'resetPassword') {
        throw new Error('Vous devez reinitialiser votre mot de passe.');
    } else {
        throw new Error(response.error || 'Identifiants incorrects.');
    }
}

async function doRegister(email, password, firstName, lastName) {
    if (!sdkAvailable) {
        // SDK unavailable — use Wix OAuth redirect flow
        await startOAuthFlow('signup');
        return;
    }
    const response = await wixClient.auth.register({
        loginId: email,
        password,
        profile: { firstName, lastName }
    });
    if (response.loginState === 'SUCCESS') {
        saveTokens(wixClient.auth.getTokens());
        await fetchAndSaveMember();
        closePopup();
        renderAuthUI();
    } else if (response.loginState === 'EMAIL_VERIFICATION_REQUIRED') {
        throw new Error('Un courriel de verification a ete envoye. Verifiez votre boite de reception.');
    } else if (response.loginState === 'OWNER_APPROVAL_REQUIRED') {
        throw new Error('Votre inscription est en attente d\'approbation.');
    } else {
        throw new Error(response.error || 'Erreur lors de l\'inscription.');
    }
}

/**
 * Start Wix OAuth redirect flow when SDK is unavailable.
 * Redirects user to Wix's managed login/signup page, then back to our site.
 */
async function startOAuthFlow(mode) {
    const redirectUri = window.location.origin + '/';
    const authUrl = `https://www.wix.com/oauth/authorize?client_id=${WIX_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=offline_access&prompt=${mode === 'signup' ? 'signup' : 'login'}`;
    window.location.href = authUrl;
}

async function doPasswordReset(email) {
    if (!sdkAvailable) {
        throw new Error('La reinitialisation par courriel n\'est pas disponible pour le moment. Contactez-nous a info@zonetotalsport.ca');
    }
    await wixClient.auth.sendPasswordResetEmail(email, window.location.href);
}

async function fetchAndSaveMember() {
    try {
        const member = await wixClient.members.getCurrentMember({ fieldsets: ['FULL'] });
        if (member?.member) {
            saveMember({
                id: member.member._id,
                firstName: member.member.contact?.firstName || '',
                lastName: member.member.contact?.lastName || '',
                email: member.member.loginEmail || ''
            });
        }
    } catch (_) { /* member fetch may fail on some plans */ }
}

async function logout() {
    clearTokens();
    if (sdkAvailable && wixClient) {
        try { await wixClient.auth.logout(window.location.href); } catch (_) {}
    }
    renderAuthUI();
}

// ---------------------------------------------------------------------------
// 4. UI State
// ---------------------------------------------------------------------------
function isLoggedIn() {
    return !!localStorage.getItem(TOKEN_KEY);
}

function renderAuthUI() {
    const member = getSavedMember();
    const logged = isLoggedIn();

    document.querySelectorAll('[data-auth="login"]').forEach(el => {
        if (logged && member) {
            const name = member.firstName || member.email || 'Membre';
            el.innerHTML = `<i data-lucide="user-check" class="w-3.5 h-3.5"></i> <span>Salut, ${name}!</span>`;
            el.removeAttribute('data-auth');
            el.setAttribute('data-auth', 'user-menu');
            el.onclick = (e) => { e.preventDefault(); toggleUserMenu(el); };
        } else {
            el.innerHTML = `<i data-lucide="user" class="w-3.5 h-3.5"></i> <span>Connexion</span>`;
            el.setAttribute('data-auth', 'login');
            el.onclick = (e) => { e.preventDefault(); showLoginPopup(); };
        }
    });

    document.querySelectorAll('[data-auth="user-menu"]').forEach(el => {
        if (!logged) {
            el.innerHTML = `<i data-lucide="user" class="w-3.5 h-3.5"></i> <span>Connexion</span>`;
            el.setAttribute('data-auth', 'login');
            el.onclick = (e) => { e.preventDefault(); showLoginPopup(); };
        }
    });

    // Re-init lucide icons
    if (window.lucide) lucide.createIcons();
}

function toggleUserMenu(anchor) {
    const existing = document.getElementById('zts-user-dropdown');
    if (existing) { existing.remove(); return; }

    const dd = document.createElement('div');
    dd.id = 'zts-user-dropdown';
    dd.innerHTML = `
        <div style="position:absolute;top:100%;right:0;margin-top:8px;background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.18);padding:8px 0;min-width:180px;z-index:100001;border:2px solid #e0e0e0;">
            <button id="zts-logout-btn" style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 20px;background:none;border:none;font-family:'Patrick Hand',cursive;font-size:1rem;color:#FF2A7A;cursor:pointer;transition:background 0.2s;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Deconnexion
            </button>
        </div>`;
    anchor.style.position = 'relative';
    anchor.appendChild(dd);
    dd.querySelector('#zts-logout-btn').onclick = (e) => { e.stopPropagation(); logout(); dd.remove(); };

    setTimeout(() => {
        const handler = (e) => { if (!dd.contains(e.target) && e.target !== anchor) { dd.remove(); document.removeEventListener('click', handler); } };
        document.addEventListener('click', handler);
    }, 10);
}

// ---------------------------------------------------------------------------
// 5. Popup Modal
// ---------------------------------------------------------------------------
let popupEl = null;

function injectStyles() {
    if (document.getElementById('zts-auth-styles')) return;
    const style = document.createElement('style');
    style.id = 'zts-auth-styles';
    style.textContent = `
        @keyframes ztsSlideIn { from { opacity:0; transform:translateY(30px) scale(0.95); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes ztsOverlayIn { from { opacity:0; } to { opacity:1; } }
        @keyframes ztsShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }

        .zts-overlay {
            position:fixed;inset:0;z-index:100000;
            background:rgba(15,15,46,0.55);
            backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);
            display:flex;align-items:center;justify-content:center;
            animation:ztsOverlayIn 0.25s ease-out;
            padding:20px;
        }

        .zts-popup {
            background:#fff;border-radius:24px;
            width:100%;max-width:420px;
            box-shadow:0 20px 60px rgba(0,0,0,0.25),0 0 0 2px rgba(0,229,255,0.15);
            animation:ztsSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
            overflow:hidden;position:relative;
        }

        .zts-popup-header {
            background:linear-gradient(135deg,#0F0F2E 0%,#1a1a3e 100%);
            padding:28px 28px 18px;text-align:center;position:relative;
            border-bottom:3px solid #00E5FF;
        }
        .zts-popup-header h2 {
            font-family:'Luckiest Guy',cursive;font-size:1.6rem;color:#fff;margin:0 0 4px;
            text-shadow:0 2px 8px rgba(0,229,255,0.3);
        }
        .zts-popup-header p { font-family:'Patrick Hand',cursive;color:rgba(255,255,255,0.6);font-size:0.95rem;margin:0; }

        .zts-close-btn {
            position:absolute;top:14px;right:14px;width:32px;height:32px;border-radius:50%;
            background:rgba(255,255,255,0.1);border:none;color:#fff;font-size:1.2rem;
            cursor:pointer;display:flex;align-items:center;justify-content:center;
            transition:all 0.2s;
        }
        .zts-close-btn:hover { background:#FF2A7A;transform:rotate(90deg); }

        .zts-tabs {
            display:flex;border-bottom:2px solid #f0f0f0;
        }
        .zts-tab {
            flex:1;padding:14px;text-align:center;font-family:'Luckiest Guy',cursive;
            font-size:1rem;background:none;border:none;cursor:pointer;
            color:#aaa;position:relative;transition:color 0.2s;
        }
        .zts-tab.active { color:#0F0F2E; }
        .zts-tab.active::after {
            content:'';position:absolute;bottom:-2px;left:20%;right:20%;height:3px;
            border-radius:3px;
            background:linear-gradient(90deg,#00E5FF,#8B5CF6);
        }
        .zts-tab:hover:not(.active) { color:#8B5CF6; }

        .zts-form { padding:24px 28px 28px;display:none; }
        .zts-form.active { display:block; }

        .zts-input-group { margin-bottom:14px;position:relative; }
        .zts-input-group label {
            display:block;font-family:'Patrick Hand',cursive;font-size:0.9rem;
            color:#666;margin-bottom:4px;
        }
        .zts-input-group input {
            width:100%;padding:12px 16px;border:2px solid #e8e8e8;border-radius:14px;
            font-family:'Patrick Hand',cursive;font-size:1.05rem;color:#1a1a2e;
            background:#fafafa;transition:all 0.25s;outline:none;
        }
        .zts-input-group input:focus {
            border-color:#00E5FF;background:#fff;
            box-shadow:0 0 0 3px rgba(0,229,255,0.15);
        }
        .zts-input-group input.error {
            border-color:#FF2A7A;box-shadow:0 0 0 3px rgba(255,42,122,0.15);
            animation:ztsShake 0.4s ease;
        }

        .zts-row { display:flex;gap:12px; }
        .zts-row .zts-input-group { flex:1; }

        .zts-pw-toggle {
            position:absolute;right:14px;top:34px;background:none;border:none;
            color:#aaa;cursor:pointer;font-size:0.85rem;font-family:'Patrick Hand',cursive;
            transition:color 0.2s;
        }
        .zts-pw-toggle:hover { color:#8B5CF6; }

        .zts-submit-btn {
            width:100%;padding:14px;border:none;border-radius:16px;
            font-family:'Luckiest Guy',cursive;font-size:1.15rem;color:#fff;
            cursor:pointer;transition:all 0.25s;margin-top:6px;
            position:relative;overflow:hidden;
        }
        .zts-submit-btn.login-btn { background:linear-gradient(135deg,#00E5FF,#8B5CF6); }
        .zts-submit-btn.register-btn { background:linear-gradient(135deg,#FF2A7A,#FF6B9D); }
        .zts-submit-btn:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.2); }
        .zts-submit-btn:active { transform:translateY(0); }
        .zts-submit-btn:disabled { opacity:0.6;cursor:not-allowed;transform:none; }

        .zts-submit-btn .zts-spinner {
            display:inline-block;width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);
            border-top-color:#fff;border-radius:50%;animation:ztsSpin 0.6s linear infinite;
            vertical-align:middle;margin-right:8px;
        }
        @keyframes ztsSpin { to { transform:rotate(360deg); } }

        .zts-link {
            display:block;text-align:center;margin-top:14px;font-family:'Patrick Hand',cursive;
            font-size:0.95rem;color:#8B5CF6;cursor:pointer;border:none;background:none;
            transition:color 0.2s;text-decoration:none;width:100%;
        }
        .zts-link:hover { color:#FF2A7A;text-decoration:underline; }

        .zts-forgot {
            display:block;text-align:right;font-family:'Patrick Hand',cursive;font-size:0.85rem;
            color:#aaa;cursor:pointer;background:none;border:none;margin:-4px 0 10px;
            transition:color 0.2s;
        }
        .zts-forgot:hover { color:#00E5FF; }

        .zts-error-msg {
            background:#FFF0F3;border:1px solid #FF2A7A;border-radius:10px;padding:10px 14px;
            font-family:'Patrick Hand',cursive;font-size:0.9rem;color:#FF2A7A;
            margin-bottom:14px;display:none;text-align:center;
        }
        .zts-success-msg {
            background:#F0FFF4;border:1px solid #34D399;border-radius:10px;padding:10px 14px;
            font-family:'Patrick Hand',cursive;font-size:0.9rem;color:#059669;
            margin-bottom:14px;display:none;text-align:center;
        }

        .zts-popup-decor {
            position:absolute;width:60px;height:60px;border-radius:50%;opacity:0.08;pointer-events:none;
        }
        .zts-popup-decor.d1 { top:-20px;left:-20px;background:#FFD700; }
        .zts-popup-decor.d2 { bottom:-15px;right:-15px;background:#FF2A7A;width:45px;height:45px; }

        /* Reset password sub-view */
        .zts-reset-view { display:none;padding:24px 28px 28px; }
        .zts-reset-view.active { display:block; }
    `;
    document.head.appendChild(style);
}

function buildPopupHTML() {
    return `
    <div class="zts-overlay" id="zts-auth-overlay">
        <div class="zts-popup">
            <div class="zts-popup-decor d1"></div>
            <div class="zts-popup-decor d2"></div>

            <div class="zts-popup-header">
                <button class="zts-close-btn" id="zts-close" aria-label="Fermer">&times;</button>
                <h2 id="zts-popup-title">Bienvenue!</h2>
                <p>Zone Total Sport</p>
            </div>

            <div class="zts-tabs" id="zts-tabs">
                <button class="zts-tab active" data-tab="login">Se connecter</button>
                <button class="zts-tab" data-tab="register">S'inscrire</button>
            </div>

            <!-- LOGIN FORM -->
            <form class="zts-form active" id="zts-login-form" autocomplete="on">
                <div class="zts-error-msg" id="zts-login-error"></div>
                <div class="zts-success-msg" id="zts-login-success"></div>

                <div class="zts-input-group">
                    <label for="zts-login-email">Courriel</label>
                    <input type="email" id="zts-login-email" placeholder="votre@courriel.com" required autocomplete="email">
                </div>
                <div class="zts-input-group">
                    <label for="zts-login-pw">Mot de passe</label>
                    <input type="password" id="zts-login-pw" placeholder="Votre mot de passe" required autocomplete="current-password">
                    <button type="button" class="zts-pw-toggle" data-target="zts-login-pw">Voir</button>
                </div>
                <button type="button" class="zts-forgot" id="zts-forgot-link">Mot de passe oublie?</button>
                <button type="submit" class="zts-submit-btn login-btn">Se connecter</button>
                <button type="button" class="zts-link" id="zts-goto-register">Pas encore membre? <strong>S'inscrire</strong></button>
            </form>

            <!-- REGISTER FORM -->
            <form class="zts-form" id="zts-register-form" autocomplete="on">
                <div class="zts-error-msg" id="zts-register-error"></div>

                <div class="zts-row">
                    <div class="zts-input-group">
                        <label for="zts-reg-fname">Prenom</label>
                        <input type="text" id="zts-reg-fname" placeholder="Prenom" required autocomplete="given-name">
                    </div>
                    <div class="zts-input-group">
                        <label for="zts-reg-lname">Nom</label>
                        <input type="text" id="zts-reg-lname" placeholder="Nom" required autocomplete="family-name">
                    </div>
                </div>
                <div class="zts-input-group">
                    <label for="zts-reg-email">Courriel</label>
                    <input type="email" id="zts-reg-email" placeholder="votre@courriel.com" required autocomplete="email">
                </div>
                <div class="zts-input-group">
                    <label for="zts-reg-pw">Mot de passe</label>
                    <input type="password" id="zts-reg-pw" placeholder="Minimum 8 caracteres" required minlength="8" autocomplete="new-password">
                    <button type="button" class="zts-pw-toggle" data-target="zts-reg-pw">Voir</button>
                </div>
                <div class="zts-input-group">
                    <label for="zts-reg-pw2">Confirmer le mot de passe</label>
                    <input type="password" id="zts-reg-pw2" placeholder="Retapez votre mot de passe" required minlength="8" autocomplete="new-password">
                </div>
                <button type="submit" class="zts-submit-btn register-btn">S'inscrire</button>
                <button type="button" class="zts-link" id="zts-goto-login">Deja membre? <strong>Se connecter</strong></button>
            </form>

            <!-- PASSWORD RESET VIEW -->
            <div class="zts-reset-view" id="zts-reset-view">
                <div class="zts-error-msg" id="zts-reset-error"></div>
                <div class="zts-success-msg" id="zts-reset-success"></div>
                <div class="zts-input-group">
                    <label for="zts-reset-email">Entrez votre courriel</label>
                    <input type="email" id="zts-reset-email" placeholder="votre@courriel.com" required>
                </div>
                <button type="button" class="zts-submit-btn login-btn" id="zts-reset-btn">Envoyer le lien</button>
                <button type="button" class="zts-link" id="zts-back-login">Retour a la connexion</button>
            </div>
        </div>
    </div>`;
}

function showTab(tab) {
    const tabs = document.querySelectorAll('#zts-tabs .zts-tab');
    tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.getElementById('zts-login-form').classList.toggle('active', tab === 'login');
    document.getElementById('zts-register-form').classList.toggle('active', tab === 'register');
    document.getElementById('zts-reset-view').classList.remove('active');
    document.getElementById('zts-tabs').style.display = 'flex';

    const title = document.getElementById('zts-popup-title');
    title.textContent = tab === 'login' ? 'Content de te revoir!' : 'Rejoins la Zone!';

    // Clear errors
    document.querySelectorAll('.zts-error-msg, .zts-success-msg').forEach(el => { el.style.display = 'none'; el.textContent = ''; });
    document.querySelectorAll('.zts-popup input.error').forEach(el => el.classList.remove('error'));
}

function showResetView() {
    document.getElementById('zts-login-form').classList.remove('active');
    document.getElementById('zts-register-form').classList.remove('active');
    document.getElementById('zts-reset-view').classList.add('active');
    document.getElementById('zts-tabs').style.display = 'none';
    document.getElementById('zts-popup-title').textContent = 'Mot de passe oublie?';
}

function showLoginPopup() {
    openPopup('login');
}

function showRegisterPopup() {
    openPopup('register');
}

function openPopup(tab = 'login') {
    if (popupEl) popupEl.remove();
    injectStyles();

    const container = document.createElement('div');
    container.innerHTML = buildPopupHTML();
    popupEl = container.firstElementChild;
    document.body.appendChild(popupEl);

    // Bind events
    document.getElementById('zts-close').onclick = closePopup;
    popupEl.addEventListener('click', (e) => { if (e.target === popupEl) closePopup(); });
    document.addEventListener('keydown', onEscKey);

    // Tab switching
    document.querySelectorAll('#zts-tabs .zts-tab').forEach(t => {
        t.onclick = () => showTab(t.dataset.tab);
    });
    document.getElementById('zts-goto-register').onclick = () => showTab('register');
    document.getElementById('zts-goto-login').onclick = () => showTab('login');
    document.getElementById('zts-forgot-link').onclick = () => showResetView();
    document.getElementById('zts-back-login').onclick = () => showTab('login');

    // Password toggles
    document.querySelectorAll('.zts-pw-toggle').forEach(btn => {
        btn.onclick = () => {
            const inp = document.getElementById(btn.dataset.target);
            const show = inp.type === 'password';
            inp.type = show ? 'text' : 'password';
            btn.textContent = show ? 'Cacher' : 'Voir';
        };
    });

    // Login submit
    document.getElementById('zts-login-form').onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('zts-login-email').value.trim();
        const pw = document.getElementById('zts-login-pw').value;
        const errEl = document.getElementById('zts-login-error');
        const btn = e.target.querySelector('.zts-submit-btn');

        errEl.style.display = 'none';
        btn.disabled = true;
        btn.innerHTML = '<span class="zts-spinner"></span>Connexion...';

        try {
            await doLogin(email, pw);
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Se connecter';
        }
    };

    // Register submit
    document.getElementById('zts-register-form').onsubmit = async (e) => {
        e.preventDefault();
        const fname = document.getElementById('zts-reg-fname').value.trim();
        const lname = document.getElementById('zts-reg-lname').value.trim();
        const email = document.getElementById('zts-reg-email').value.trim();
        const pw = document.getElementById('zts-reg-pw').value;
        const pw2 = document.getElementById('zts-reg-pw2').value;
        const errEl = document.getElementById('zts-register-error');
        const btn = e.target.querySelector('.zts-submit-btn');

        errEl.style.display = 'none';

        if (pw !== pw2) {
            errEl.textContent = 'Les mots de passe ne correspondent pas.';
            errEl.style.display = 'block';
            document.getElementById('zts-reg-pw2').classList.add('error');
            return;
        }
        if (pw.length < 8) {
            errEl.textContent = 'Le mot de passe doit contenir au moins 8 caracteres.';
            errEl.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="zts-spinner"></span>Inscription...';

        try {
            await doRegister(email, pw, fname, lname);
        } catch (err) {
            errEl.textContent = err.message;
            errEl.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = "S'inscrire";
        }
    };

    // Reset password
    document.getElementById('zts-reset-btn').onclick = async () => {
        const email = document.getElementById('zts-reset-email').value.trim();
        const errEl = document.getElementById('zts-reset-error');
        const succEl = document.getElementById('zts-reset-success');
        const btn = document.getElementById('zts-reset-btn');

        errEl.style.display = 'none';
        succEl.style.display = 'none';

        if (!email) {
            errEl.textContent = 'Veuillez entrer votre courriel.';
            errEl.style.display = 'block';
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<span class="zts-spinner"></span>Envoi...';

        try {
            await doPasswordReset(email);
            succEl.textContent = 'Un lien de reinitialisation a ete envoye a votre courriel.';
            succEl.style.display = 'block';
        } catch (err) {
            errEl.textContent = err.message || 'Erreur lors de l\'envoi.';
            errEl.style.display = 'block';
        } finally {
            btn.disabled = false;
            btn.textContent = 'Envoyer le lien';
        }
    };

    showTab(tab);
}

function closePopup() {
    if (popupEl) {
        popupEl.style.animation = 'ztsOverlayIn 0.2s ease-out reverse';
        setTimeout(() => { popupEl?.remove(); popupEl = null; }, 180);
    }
    document.removeEventListener('keydown', onEscKey);
}

function onEscKey(e) {
    if (e.key === 'Escape') closePopup();
}

// ---------------------------------------------------------------------------
// 6. Check auth state on load
// ---------------------------------------------------------------------------
async function checkAuthState() {
    if (isLoggedIn() && sdkAvailable && wixClient) {
        try {
            const loggedIn = wixClient.auth.loggedIn();
            if (!loggedIn) {
                clearTokens();
            }
        } catch (_) { /* token validation may fail silently */ }
    }
    renderAuthUI();
}

// ---------------------------------------------------------------------------
// 7. Auto-init
// ---------------------------------------------------------------------------
async function init() {
    // Handle OAuth callback (user returning from Wix login)
    await handleOAuthCallback();

    // Bind click handlers to data-auth elements
    document.querySelectorAll('[data-auth="login"]').forEach(el => {
        el.addEventListener('click', (e) => { e.preventDefault(); showLoginPopup(); });
    });
    document.querySelectorAll('[data-auth="register"]').forEach(el => {
        el.addEventListener('click', (e) => { e.preventDefault(); showRegisterPopup(); });
    });

    // Load SDK in background
    await loadWixSDK();

    // Check auth state
    await checkAuthState();
}

/**
 * Handle OAuth callback when user returns from Wix login.
 * Looks for ?code= in the URL and exchanges it for tokens.
 */
async function handleOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;

    try {
        // Exchange code for tokens via Wix OAuth
        const redirectUri = window.location.origin + '/';
        const resp = await fetch('https://www.wixapis.com/oauth/access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: WIX_CLIENT_ID,
                code: code,
                redirect_uri: redirectUri,
            })
        });

        if (resp.ok) {
            const tokens = await resp.json();
            saveTokens(tokens);
            saveMember({ firstName: 'Membre', email: '' });
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
            console.log('[ZTS Auth] OAuth login successful.');
        }
    } catch (err) {
        console.warn('[ZTS Auth] OAuth callback error:', err);
    }
    // Clean URL params regardless
    if (window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
    }
}

// Run init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ---------------------------------------------------------------------------
// 8. Exports
// ---------------------------------------------------------------------------
export { showLoginPopup, showRegisterPopup, checkAuthState, logout };
