/**
 * =============================================================================
 * ZTS Zone - Wix Headless Authentication System
 * =============================================================================
 * Complete auth module for a static GitHub Pages site.
 * Handles login, registration, session management, and UI via injected popup.
 *
 * Wix OAuth Client ID: d6e226b9-1557-4267-89ba-120b62e1ac57
 * Site: https://zone.zonetotalsport.ca
 *
 * Usage:
 *   <script type="module" src="wix-auth.js"></script>
 *   Or: import { showLoginPopup, showRegisterPopup, checkAuthState, logout } from './wix-auth.js';
 *
 * Auto-binds elements with data-auth="login" or data-auth="register".
 * =============================================================================
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const CONFIG = {
  clientId: 'd6e226b9-1557-4267-89ba-120b62e1ac57',
  siteUrl: 'https://zone.zonetotalsport.ca',
  tokensKey: 'zts_wix_tokens',
  memberKey: 'zts_wix_member',
  oauthStateKey: 'zts_oauth_state',
  oauthCodeVerifierKey: 'zts_oauth_verifier',
};

// ---------------------------------------------------------------------------
// Module-level state
// ---------------------------------------------------------------------------
let wixClient = null;
let sdkReady = false;
let sdkLoadPromise = null;
let currentMember = null;
let popupRoot = null;

// ---------------------------------------------------------------------------
// 1. Wix SDK Initialization
// ---------------------------------------------------------------------------

/**
 * Dynamically import the Wix SDK from the CDN and create the client.
 * Returns the wixClient instance.
 */
async function initWixSDK() {
  if (wixClient) return wixClient;

  try {
    const [{ createClient, OAuthStrategy }, membersModule] = await Promise.all([
      import('https://cdn.jsdelivr.net/npm/@wix/sdk@1/+esm'),
      import('https://cdn.jsdelivr.net/npm/@wix/members@1/+esm'),
    ]);

    const tokens = loadTokens();

    wixClient = createClient({
      modules: { members: membersModule.members },
      auth: OAuthStrategy({
        clientId: CONFIG.clientId,
        tokens: tokens || undefined,
      }),
    });

    // If no tokens saved, generate visitor tokens
    if (!tokens) {
      const visitorTokens = await wixClient.auth.generateVisitorTokens();
      wixClient.auth.setTokens(visitorTokens);
      saveTokens(visitorTokens);
    }

    sdkReady = true;
    return wixClient;
  } catch (err) {
    console.warn('[ZTS Auth] SDK CDN import failed, OAuth redirect fallback available.', err);
    sdkReady = false;
    throw err;
  }
}

// Start loading the SDK immediately in background
sdkLoadPromise = initWixSDK().catch(() => null);

// ---------------------------------------------------------------------------
// 2. Token / Member persistence helpers
// ---------------------------------------------------------------------------

function loadTokens() {
  try {
    const raw = localStorage.getItem(CONFIG.tokensKey);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveTokens(tokens) {
  try {
    localStorage.setItem(CONFIG.tokensKey, JSON.stringify(tokens));
  } catch (e) {
    console.error('[ZTS Auth] Could not save tokens', e);
  }
}

function clearTokens() {
  localStorage.removeItem(CONFIG.tokensKey);
  localStorage.removeItem(CONFIG.memberKey);
  currentMember = null;
}

function loadMember() {
  try {
    const raw = localStorage.getItem(CONFIG.memberKey);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveMember(member) {
  try {
    localStorage.setItem(CONFIG.memberKey, JSON.stringify(member));
  } catch (e) {
    console.error('[ZTS Auth] Could not save member', e);
  }
}

// ---------------------------------------------------------------------------
// 3. Fetch current member info from Wix
// ---------------------------------------------------------------------------

async function fetchCurrentMember() {
  if (!wixClient) return null;
  try {
    const { member } = await wixClient.members.getCurrentMember({ fieldsets: ['FULL'] });
    if (member) {
      const info = {
        id: member._id,
        firstName: member.contact?.firstName || '',
        lastName: member.contact?.lastName || '',
        email: member.loginEmail || '',
        nickname: member.profile?.nickname || '',
        slug: member.profile?.slug || '',
      };
      saveMember(info);
      currentMember = info;
      return info;
    }
  } catch (e) {
    console.warn('[ZTS Auth] Could not fetch member info', e);
  }
  return null;
}

// ---------------------------------------------------------------------------
// 4. Auth Actions: Login, Register, Logout
// ---------------------------------------------------------------------------

/**
 * Login with email + password via Wix SDK.
 * Returns { success, member?, error? }
 */
async function loginWithEmail(email, password) {
  await sdkLoadPromise;
  if (!wixClient) throw new Error('SDK non disponible');

  const response = await wixClient.auth.login({ email, password });

  if (response.loginState === 'SUCCESS') {
    const tokens = await wixClient.auth.getMemberTokensForDirectLogin(
      response.data.sessionToken
    );
    wixClient.auth.setTokens(tokens);
    saveTokens(tokens);
    const member = await fetchCurrentMember();
    return { success: true, member };
  }

  // Handle other states
  if (response.loginState === 'FAILURE') {
    const reason = response.errorCode || 'UNKNOWN';
    const messages = {
      invalidEmail: 'Adresse courriel invalide.',
      invalidPassword: 'Mot de passe incorrect.',
      emailAlreadyExists: 'Un compte avec ce courriel existe deja.',
      resetPassword: 'Vous devez reinitialiser votre mot de passe.',
    };
    return { success: false, error: messages[reason] || 'Connexion echouee. Verifiez vos identifiants.' };
  }

  if (response.loginState === 'EMAIL_VERIFICATION_REQUIRED') {
    return { success: false, error: 'Verifiez votre courriel pour confirmer votre compte.' };
  }

  if (response.loginState === 'OWNER_APPROVAL_REQUIRED') {
    return { success: false, error: 'Votre compte doit etre approuve par un administrateur.' };
  }

  return { success: false, error: 'Etat de connexion inconnu.' };
}

/**
 * Register a new member.
 * Returns { success, status?, member?, error? }
 */
async function registerWithEmail(email, password, firstName, lastName) {
  await sdkLoadPromise;
  if (!wixClient) throw new Error('SDK non disponible');

  const response = await wixClient.auth.register({
    email,
    password,
    profile: { nickname: firstName + ' ' + lastName },
  });

  const state = response.loginState;

  if (state === 'SUCCESS') {
    const tokens = await wixClient.auth.getMemberTokensForDirectLogin(
      response.data.sessionToken
    );
    wixClient.auth.setTokens(tokens);
    saveTokens(tokens);
    const member = await fetchCurrentMember();
    return { success: true, status: 'ACTIVE', member };
  }

  if (state === 'EMAIL_VERIFICATION_REQUIRED') {
    return {
      success: true,
      status: 'EMAIL_VERIFICATION',
      error: 'Un courriel de verification vous a ete envoye. Verifiez votre boite de reception!',
    };
  }

  if (state === 'OWNER_APPROVAL_REQUIRED') {
    return {
      success: true,
      status: 'PENDING',
      error: 'Votre inscription est en attente d\'approbation par un administrateur.',
    };
  }

  if (state === 'FAILURE') {
    const reason = response.errorCode || '';
    if (reason === 'emailAlreadyExists') {
      return { success: false, error: 'Un compte avec ce courriel existe deja.' };
    }
    return { success: false, error: 'L\'inscription a echoue. Reessayez.' };
  }

  return { success: false, error: 'Etat d\'inscription inconnu.' };
}

/**
 * Logout the current member and reload.
 */
async function logout() {
  try {
    if (wixClient) {
      const { logoutUrl } = await wixClient.auth.logout(window.location.href);
      clearTokens();
      updateNavUI(null);
      window.location.href = logoutUrl || window.location.href;
      return;
    }
  } catch (e) {
    console.warn('[ZTS Auth] Logout error', e);
  }
  clearTokens();
  updateNavUI(null);
  window.location.reload();
}

// ---------------------------------------------------------------------------
// 5. OAuth Redirect Fallback (if CDN fails)
// ---------------------------------------------------------------------------

async function startOAuthRedirect() {
  if (!wixClient) {
    // Minimal fallback: redirect to Wix OAuth manually
    const redirectUri = CONFIG.siteUrl;
    const url = `https://www.wix.com/oauth/authorize?client_id=${CONFIG.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=offline_access`;
    window.location.href = url;
    return;
  }

  try {
    const data = wixClient.auth.generateOAuthData(CONFIG.siteUrl);
    localStorage.setItem(CONFIG.oauthStateKey, JSON.stringify(data));
    const { authUrl } = await wixClient.auth.getAuthUrl(data);
    window.location.href = authUrl;
  } catch (e) {
    console.error('[ZTS Auth] OAuth redirect failed', e);
  }
}

async function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');

  if (!code || !state) return false;

  try {
    await sdkLoadPromise;
    if (!wixClient) return false;

    const savedData = JSON.parse(localStorage.getItem(CONFIG.oauthStateKey) || 'null');
    if (!savedData) return false;

    const tokens = await wixClient.auth.getMemberTokens(code, state, savedData);
    wixClient.auth.setTokens(tokens);
    saveTokens(tokens);
    localStorage.removeItem(CONFIG.oauthStateKey);

    await fetchCurrentMember();

    // Clean URL params
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);

    return true;
  } catch (e) {
    console.error('[ZTS Auth] OAuth callback error', e);
    return false;
  }
}

// ---------------------------------------------------------------------------
// 6. Inject Styles
// ---------------------------------------------------------------------------

function injectStyles() {
  if (document.getElementById('zts-auth-styles')) return;

  const style = document.createElement('style');
  style.id = 'zts-auth-styles';
  style.textContent = `
    /* ===== Overlay ===== */
    .zts-auth-overlay {
      position: fixed;
      inset: 0;
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 15, 46, 0.7);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      padding: 16px;
    }
    .zts-auth-overlay.active {
      opacity: 1;
      visibility: visible;
    }

    /* ===== Modal Card ===== */
    .zts-auth-modal {
      position: relative;
      width: 100%;
      max-width: 440px;
      background: #fff;
      border-radius: 1.25rem;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 229, 255, 0.15);
      overflow: hidden;
      transform: translateY(30px) scale(0.96);
      transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .zts-auth-overlay.active .zts-auth-modal {
      transform: translateY(0) scale(1);
    }

    /* ===== Top Banner ===== */
    .zts-auth-banner {
      background: linear-gradient(135deg, #00E5FF 0%, #00FF85 50%, #FF6B00 100%);
      padding: 24px 24px 20px;
      text-align: center;
      position: relative;
    }
    .zts-auth-banner-logo {
      font-family: 'Luckiest Guy', cursive;
      font-size: 1.75rem;
      color: #0F0F2E;
      text-shadow: 0 2px 4px rgba(0,0,0,0.12);
      margin: 0;
      letter-spacing: 1px;
    }
    .zts-auth-banner-sub {
      font-family: 'Patrick Hand', cursive;
      font-size: 0.95rem;
      color: #0F0F2E;
      margin: 4px 0 0;
      opacity: 0.8;
    }

    /* ===== Close Button ===== */
    .zts-auth-close {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255,255,255,0.25);
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      color: #0F0F2E;
      transition: background 0.2s;
      z-index: 2;
    }
    .zts-auth-close:hover,
    .zts-auth-close:focus-visible {
      background: rgba(255,255,255,0.5);
    }

    /* ===== Tabs ===== */
    .zts-auth-tabs {
      display: flex;
      border-bottom: 2px solid #f0f0f0;
    }
    .zts-auth-tab {
      flex: 1;
      padding: 14px 8px;
      text-align: center;
      font-family: 'Fredoka One', cursive;
      font-size: 0.95rem;
      color: #999;
      background: none;
      border: none;
      cursor: pointer;
      position: relative;
      transition: color 0.25s;
    }
    .zts-auth-tab.active {
      color: #0F0F2E;
    }
    .zts-auth-tab.active::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 20%;
      right: 20%;
      height: 3px;
      border-radius: 3px;
      background: linear-gradient(90deg, #00E5FF, #00FF85);
    }
    .zts-auth-tab:hover:not(.active) {
      color: #555;
    }

    /* ===== Form Body ===== */
    .zts-auth-body {
      padding: 24px;
    }
    .zts-auth-panel {
      display: none;
    }
    .zts-auth-panel.active {
      display: block;
      animation: ztsSlideIn 0.3s ease;
    }
    @keyframes ztsSlideIn {
      from { opacity: 0; transform: translateX(12px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* ===== Input Groups ===== */
    .zts-auth-field {
      margin-bottom: 16px;
    }
    .zts-auth-row {
      display: flex;
      gap: 12px;
    }
    .zts-auth-row .zts-auth-field {
      flex: 1;
    }
    .zts-auth-label {
      display: block;
      font-family: 'Fredoka One', cursive;
      font-size: 0.8rem;
      color: #555;
      margin-bottom: 6px;
    }
    .zts-auth-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .zts-auth-input-icon {
      position: absolute;
      left: 12px;
      font-size: 1rem;
      color: #aaa;
      pointer-events: none;
      transition: color 0.2s;
    }
    .zts-auth-input {
      width: 100%;
      padding: 12px 12px 12px 40px;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      font-family: 'Patrick Hand', cursive;
      font-size: 1rem;
      color: #0F0F2E;
      background: #fafafa;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
      box-sizing: border-box;
    }
    .zts-auth-input:focus {
      border-color: #00E5FF;
      box-shadow: 0 0 0 3px rgba(0, 229, 255, 0.15);
      background: #fff;
    }
    .zts-auth-input:focus ~ .zts-auth-input-icon {
      color: #00E5FF;
    }
    .zts-auth-input::placeholder {
      color: #bbb;
    }

    /* ===== Password Toggle ===== */
    .zts-auth-pw-toggle {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      color: #aaa;
      padding: 4px;
      transition: color 0.2s;
    }
    .zts-auth-pw-toggle:hover {
      color: #555;
    }

    /* ===== Checkbox ===== */
    .zts-auth-checkbox-wrap {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin: 16px 0;
    }
    .zts-auth-checkbox {
      width: 20px;
      height: 20px;
      margin-top: 2px;
      accent-color: #00FF85;
      cursor: pointer;
      flex-shrink: 0;
    }
    .zts-auth-checkbox-label {
      font-family: 'Patrick Hand', cursive;
      font-size: 0.9rem;
      color: #555;
      cursor: pointer;
    }

    /* ===== Primary Buttons ===== */
    .zts-auth-btn {
      width: 100%;
      padding: 14px 20px;
      border: none;
      border-radius: 14px;
      font-family: 'Fredoka One', cursive;
      font-size: 1rem;
      color: #0F0F2E;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
      position: relative;
      overflow: hidden;
    }
    .zts-auth-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.18);
    }
    .zts-auth-btn:active:not(:disabled) {
      transform: translateY(0);
    }
    .zts-auth-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .zts-auth-btn-login {
      background: linear-gradient(135deg, #00E5FF, #00FF85);
    }
    .zts-auth-btn-register {
      background: linear-gradient(135deg, #00FF85, #FF6B00);
    }

    /* ===== Links ===== */
    .zts-auth-link {
      background: none;
      border: none;
      font-family: 'Patrick Hand', cursive;
      font-size: 0.9rem;
      color: #00E5FF;
      cursor: pointer;
      text-decoration: underline;
      padding: 0;
      transition: color 0.2s;
    }
    .zts-auth-link:hover {
      color: #00b8d4;
    }

    /* ===== Divider ===== */
    .zts-auth-divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 18px 0;
    }
    .zts-auth-divider::before,
    .zts-auth-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #e0e0e0;
    }
    .zts-auth-divider span {
      font-family: 'Patrick Hand', cursive;
      font-size: 0.85rem;
      color: #aaa;
    }

    /* ===== Forgot password ===== */
    .zts-auth-forgot {
      text-align: right;
      margin-top: -8px;
      margin-bottom: 16px;
    }

    /* ===== Messages ===== */
    .zts-auth-msg {
      padding: 10px 16px;
      border-radius: 50px;
      font-family: 'Patrick Hand', cursive;
      font-size: 0.9rem;
      text-align: center;
      margin-bottom: 16px;
      animation: ztsSlideIn 0.3s ease;
    }
    .zts-auth-msg.error {
      background: #ff3b3b;
      color: #fff;
    }
    .zts-auth-msg.success {
      background: #00FF85;
      color: #0F0F2E;
    }
    .zts-auth-msg.info {
      background: #00E5FF;
      color: #0F0F2E;
    }

    /* ===== Loading Spinner ===== */
    .zts-auth-spinner {
      display: none;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .zts-auth-spinner.active {
      display: flex;
    }
    .zts-auth-spinner-circle {
      width: 36px;
      height: 36px;
      border: 4px solid #e0e0e0;
      border-top-color: #00E5FF;
      border-right-color: #00FF85;
      border-radius: 50%;
      animation: ztsSpinnerRotate 0.8s linear infinite;
    }
    @keyframes ztsSpinnerRotate {
      to { transform: rotate(360deg); }
    }

    /* ===== Success Confetti ===== */
    .zts-auth-confetti-wrap {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      z-index: 3;
    }
    .zts-auth-confetti {
      position: absolute;
      width: 8px;
      height: 8px;
      border-radius: 2px;
      animation: ztsConfettiFall 1.2s ease-out forwards;
    }
    @keyframes ztsConfettiFall {
      0%   { transform: translateY(-20px) rotate(0deg) scale(1); opacity: 1; }
      100% { transform: translateY(350px) rotate(720deg) scale(0.3); opacity: 0; }
    }

    /* ===== Nav User Dropdown ===== */
    .zts-user-menu {
      position: relative;
      display: inline-block;
    }
    .zts-user-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(255,255,255,0.08);
      border: 1.5px solid rgba(0, 229, 255, 0.3);
      border-radius: 50px;
      font-family: 'Fredoka One', cursive;
      font-size: 0.9rem;
      color: #fff;
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
      white-space: nowrap;
    }
    .zts-user-btn:hover {
      background: rgba(0, 229, 255, 0.12);
      border-color: #00E5FF;
    }
    .zts-user-avatar {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #00E5FF, #00FF85);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Luckiest Guy', cursive;
      font-size: 0.85rem;
      color: #0F0F2E;
    }
    .zts-user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 180px;
      background: #1a1a3e;
      border: 1px solid rgba(0, 229, 255, 0.2);
      border-radius: 14px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.4);
      padding: 8px 0;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-6px);
      transition: opacity 0.2s, transform 0.2s, visibility 0.2s;
      z-index: 10000;
    }
    .zts-user-dropdown.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .zts-user-dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 18px;
      font-family: 'Patrick Hand', cursive;
      font-size: 0.95rem;
      color: #ddd;
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .zts-user-dropdown-item:hover {
      background: rgba(0, 229, 255, 0.1);
      color: #00E5FF;
    }
    .zts-user-dropdown-sep {
      height: 1px;
      background: rgba(255,255,255,0.08);
      margin: 4px 12px;
    }

    /* ===== Mobile Responsive ===== */
    @media (max-width: 500px) {
      .zts-auth-modal {
        max-width: 100%;
        border-radius: 1rem;
      }
      .zts-auth-body {
        padding: 18px;
      }
      .zts-auth-row {
        flex-direction: column;
        gap: 0;
      }
      .zts-auth-banner-logo {
        font-size: 1.4rem;
      }
      .zts-user-dropdown {
        right: -10px;
      }
    }
  `;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// 7. Popup HTML generation
// ---------------------------------------------------------------------------

function createPopupHTML() {
  return `
    <div class="zts-auth-overlay" id="ztsAuthOverlay" role="dialog" aria-modal="true" aria-label="Connexion ZTS Zone">

      <div class="zts-auth-modal">
        <!-- Banner -->
        <div class="zts-auth-banner">
          <button class="zts-auth-close" id="ztsAuthClose" aria-label="Fermer">&times;</button>
          <p class="zts-auth-banner-logo">ZTS Zone</p>
          <p class="zts-auth-banner-sub">Ta zone sport et education physique!</p>
        </div>

        <!-- Spinner (shared) -->
        <div class="zts-auth-spinner" id="ztsSpinner" aria-label="Chargement">
          <div class="zts-auth-spinner-circle"></div>
        </div>

        <!-- Simple Body — Direct redirect to Wix -->
        <div class="zts-auth-body">
          <div id="ztsLoginMsg"></div>
          <div id="ztsRegisterMsg"></div>

          <div style="text-align:center; padding: 8px 0 4px;">
            <p style="font-family:'Patrick Hand',cursive; font-size:1.15rem; color:#444; margin:0 0 6px;">
              Accede a toutes les ressources gratuites!
            </p>
            <p style="font-family:'Patrick Hand',cursive; font-size:0.95rem; color:#888; margin:0 0 20px;">
              &#127942; +500 outils, jeux, SAE et plus encore
            </p>
          </div>

          <button class="zts-auth-btn zts-auth-btn-login" id="ztsLoginBtn" type="button" style="margin-bottom:12px;">
            &#128274; Se connecter
          </button>

          <button class="zts-auth-btn zts-auth-btn-register" id="ztsRegisterBtn" type="button">
            &#9997; Creer un compte gratuit
          </button>

          <div class="zts-auth-divider"><span>ou</span></div>

          <p style="text-align:center; margin:0;">
            <a href="https://www.zonetotalsport.ca/account/login" style="font-family:'Fredoka One',cursive; font-size:0.85rem; color:#FF6B00; text-decoration:none;">
              Mot de passe oublie?
            </a>
          </p>
        </div><!-- .zts-auth-body -->

      </div><!-- .zts-auth-modal -->
    </div><!-- .zts-auth-overlay -->
  `;
}

// ---------------------------------------------------------------------------
// 8. Popup Management
// ---------------------------------------------------------------------------

/**
 * Ensure the popup DOM is in the page. Creates it once, reuses thereafter.
 */
function ensurePopup() {
  if (popupRoot) return popupRoot;

  injectStyles();

  const wrapper = document.createElement('div');
  wrapper.id = 'zts-auth-root';
  wrapper.innerHTML = createPopupHTML();
  document.body.appendChild(wrapper);
  popupRoot = wrapper;

  bindPopupEvents();
  return popupRoot;
}

/**
 * Open the popup on a specific tab ('login' or 'register').
 */
function openPopup(tab = 'login') {
  ensurePopup();
  const overlay = document.getElementById('ztsAuthOverlay');

  // Switch to correct tab
  switchTab(tab);

  // Clear previous messages
  clearMessages();

  // Show overlay with a slight delay so CSS transition fires
  requestAnimationFrame(() => {
    overlay.classList.add('active');
  });

  // Focus login button after animation
  setTimeout(() => {
    const loginBtn = document.getElementById('ztsLoginBtn');
    if (loginBtn) loginBtn.focus();
  }, 350);
}

/**
 * Close the popup.
 */
function closePopup() {
  const overlay = document.getElementById('ztsAuthOverlay');
  if (!overlay) return;
  overlay.classList.remove('active');
}

/**
 * Switch between login and register tabs.
 */
function switchTab(tab) {
  // Simplified — no tabs in the new popup layout
}

/**
 * Show a message in the given container.
 */
function showMessage(containerId, text, type = 'error') {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="zts-auth-msg ${type}">${escapeHtml(text)}</div>`;
}

/**
 * Clear all message containers.
 */
function clearMessages() {
  const loginMsg = document.getElementById('ztsLoginMsg');
  const regMsg = document.getElementById('ztsRegisterMsg');
  if (loginMsg) loginMsg.innerHTML = '';
  if (regMsg) regMsg.innerHTML = '';
}

/**
 * Simple HTML escape to prevent XSS in user-displayed strings.
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Show or hide the loading spinner.
 */
function setSpinner(visible) {
  const spinner = document.getElementById('ztsSpinner');
  if (!spinner) return;
  if (visible) {
    spinner.classList.add('active');
  } else {
    spinner.classList.remove('active');
  }
}

/**
 * Spawn confetti particles inside the modal for success feedback.
 */
function showConfetti() {
  const modal = document.querySelector('.zts-auth-modal');
  if (!modal) return;

  const wrap = document.createElement('div');
  wrap.className = 'zts-auth-confetti-wrap';
  modal.appendChild(wrap);

  const colors = ['#00E5FF', '#FFD700', '#00FF85', '#FF6B00', '#ff3b9a'];

  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'zts-auth-confetti';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.top = '-10px';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    piece.style.animationDuration = (0.8 + Math.random() * 0.8) + 's';
    wrap.appendChild(piece);
  }

  // Clean up confetti elements after animation completes
  setTimeout(() => wrap.remove(), 2500);
}

// ---------------------------------------------------------------------------
// 9. Input Validation
// ---------------------------------------------------------------------------

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw) {
  return pw.length >= 8;
}

// ---------------------------------------------------------------------------
// 10. Bind Popup Events
// ---------------------------------------------------------------------------

function bindPopupEvents() {
  const overlay = document.getElementById('ztsAuthOverlay');
  const closeBtn = document.getElementById('ztsAuthClose');
  const loginBtn = document.getElementById('ztsLoginBtn');
  const registerBtn = document.getElementById('ztsRegisterBtn');

  // Close button
  closeBtn.addEventListener('click', closePopup);

  // Click on backdrop closes the popup
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closePopup();
  });

  // Escape key closes the popup
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      closePopup();
    }
  });

  // Login button → redirect to Wix login
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);

  // Register button → redirect to Wix signup
  if (registerBtn) registerBtn.addEventListener('click', handleRegister);
}

// ---------------------------------------------------------------------------
// 11. Login Handler
// ---------------------------------------------------------------------------

async function handleLogin() {
  // Redirect directly to Wix managed login page
  // The Wix SDK via CDN does not support direct auth.login() reliably,
  // so we use Wix's hosted login page which handles everything.
  setSpinner(true);
  showMessage('ztsLoginMsg', 'Redirection vers la connexion securisee...', 'info');
  setTimeout(() => {
    window.location.href = 'https://www.zonetotalsport.ca/account/login';
  }, 800);
  } finally {
    loginBtn.disabled = false;
  }
}

// ---------------------------------------------------------------------------
// 12. Register Handler
// ---------------------------------------------------------------------------

async function handleRegister() {
  // Redirect directly to Wix managed signup page
  setSpinner(true);
  showMessage('ztsRegisterMsg', 'Redirection vers l\'inscription securisee...', 'info');
  setTimeout(() => {
    window.location.href = 'https://www.zonetotalsport.ca/account/sign-up';
  }, 800);
}

// ---------------------------------------------------------------------------
// 13. Forgot Password Handler
// ---------------------------------------------------------------------------

async function handleForgotPassword() {
  const emailInput = document.getElementById('ztsLoginEmail');
  const email = emailInput.value.trim();

  if (!email) {
    showMessage('ztsLoginMsg', 'Entre ton courriel pour reinitialiser ton mot de passe.', 'info');
    emailInput.focus();
    return;
  }

  if (!validateEmail(email)) {
    showMessage('ztsLoginMsg', 'Adresse courriel invalide.', 'error');
    emailInput.focus();
    return;
  }

  setSpinner(true);
  clearMessages();

  try {
    await sdkLoadPromise;
    if (wixClient) {
      await wixClient.auth.sendPasswordResetEmail(email, CONFIG.siteUrl);
      setSpinner(false);
      showMessage('ztsLoginMsg', 'Courriel de reinitialisation envoye! Verifie ta boite de reception.', 'success');
    } else {
      setSpinner(false);
      showMessage('ztsLoginMsg', 'Service indisponible. Contacte-nous pour de l\'aide.', 'error');
    }
  } catch (err) {
    setSpinner(false);
    console.error('[ZTS Auth] Password reset error:', err);
    // Always show a neutral message (don't reveal whether email exists)
    showMessage('ztsLoginMsg', 'Si ce courriel existe, un lien de reinitialisation a ete envoye.', 'info');
  }
}

// ---------------------------------------------------------------------------
// 14. Nav UI Update (user menu / login button)
// ---------------------------------------------------------------------------

/**
 * Update the navigation bar to reflect the current auth state.
 * When logged in, replaces data-auth="login" elements with a user dropdown.
 * When logged out, restores the original login buttons.
 */
function updateNavUI(member) {
  const loginTriggers = document.querySelectorAll('[data-auth="login"]');

  if (member) {
    // --- Logged-in state ---
    currentMember = member;
    const firstName = member.firstName || member.nickname || 'Membre';
    const initial = firstName.charAt(0).toUpperCase();

    loginTriggers.forEach((trigger) => {
      // Avoid double-replacing
      if (trigger.closest('.zts-user-menu')) return;

      const menu = document.createElement('div');
      menu.className = 'zts-user-menu';
      menu.setAttribute('data-auth-replaced', 'true');
      menu.innerHTML = `
        <button class="zts-user-btn" aria-haspopup="true" aria-expanded="false" aria-label="Menu utilisateur">
          <span class="zts-user-avatar">${escapeHtml(initial)}</span>
          <span>Salut, ${escapeHtml(firstName)}!</span>
          <span style="font-size:0.7em;">&#9660;</span>
        </button>
        <div class="zts-user-dropdown" role="menu">
          <button class="zts-user-dropdown-item" role="menuitem" data-action="profile">
            <span>&#128100;</span> Mon profil
          </button>
          <div class="zts-user-dropdown-sep"></div>
          <button class="zts-user-dropdown-item" role="menuitem" data-action="logout">
            <span>&#128682;</span> Deconnexion
          </button>
        </div>
      `;

      trigger.replaceWith(menu);

      // Dropdown toggle
      const btn = menu.querySelector('.zts-user-btn');
      const dropdown = menu.querySelector('.zts-user-dropdown');

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        // Close any other open dropdowns first
        document.querySelectorAll('.zts-user-dropdown.open').forEach((d) => d.classList.remove('open'));
        if (!isOpen) {
          dropdown.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        } else {
          btn.setAttribute('aria-expanded', 'false');
        }
      });

      // Profile action
      menu.querySelector('[data-action="profile"]').addEventListener('click', () => {
        dropdown.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        window.location.href = '/profil.html';
      });

      // Logout action
      menu.querySelector('[data-action="logout"]').addEventListener('click', () => {
        dropdown.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        logout();
      });
    });

    // Close dropdown when clicking elsewhere on the page
    document.addEventListener('click', closeAllDropdowns);

  } else {
    // --- Logged-out state: restore login buttons ---
    document.removeEventListener('click', closeAllDropdowns);
    document.querySelectorAll('[data-auth-replaced]').forEach((menu) => {
      const btn = document.createElement('button');
      btn.setAttribute('data-auth', 'login');
      btn.className = 'nav-link';
      btn.textContent = 'Se connecter';
      btn.addEventListener('click', () => showLoginPopup());
      menu.replaceWith(btn);
    });
  }
}

/**
 * Helper to close all user dropdowns (used on document click).
 */
function closeAllDropdowns() {
  document.querySelectorAll('.zts-user-dropdown.open').forEach((d) => {
    d.classList.remove('open');
    const parentBtn = d.parentElement?.querySelector('.zts-user-btn');
    if (parentBtn) parentBtn.setAttribute('aria-expanded', 'false');
  });
}

// ---------------------------------------------------------------------------
// 15. Check Auth State
// ---------------------------------------------------------------------------

/**
 * Check if the user is logged in and update the UI accordingly.
 * Handles OAuth callback, saved tokens, and member fetch.
 * Called automatically on page load.
 */
async function checkAuthState() {
  injectStyles();

  // Step 1: Handle OAuth callback if URL has code+state params
  const wasCallback = await handleOAuthCallback();
  if (wasCallback) {
    const member = loadMember() || currentMember;
    updateNavUI(member);
    return member;
  }

  // Step 2: Check for saved tokens
  const tokens = loadTokens();
  if (!tokens) {
    updateNavUI(null);
    return null;
  }

  // Step 3: Use cached member info immediately (fast UI paint)
  const savedMember = loadMember();
  if (savedMember) {
    currentMember = savedMember;
    updateNavUI(savedMember);
  }

  // Step 4: Validate tokens by fetching member from Wix (background)
  try {
    await sdkLoadPromise;
    if (wixClient) {
      const member = await fetchCurrentMember();
      if (member) {
        updateNavUI(member);
        return member;
      } else {
        // Tokens are expired or invalid
        clearTokens();
        updateNavUI(null);
        return null;
      }
    }
  } catch (e) {
    console.warn('[ZTS Auth] Token validation failed', e);
    // Keep cached member if available (offline-tolerant)
    if (savedMember) return savedMember;
  }

  return savedMember || null;
}

// ---------------------------------------------------------------------------
// 16. Public API
// ---------------------------------------------------------------------------

/**
 * Show the login popup modal.
 */
function showLoginPopup() {
  openPopup('login');
}

/**
 * Show the register popup modal.
 */
function showRegisterPopup() {
  openPopup('register');
}

// ---------------------------------------------------------------------------
// 17. Auto-bind triggers and DOMContentLoaded initialization
// ---------------------------------------------------------------------------

/**
 * Find and bind all data-auth trigger elements on the page.
 */
function bindAuthTriggers() {
  // Bind data-auth="login" elements
  document.querySelectorAll('[data-auth="login"]').forEach((el) => {
    if (el.dataset.authBound) return; // avoid re-binding
    el.dataset.authBound = 'true';
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showLoginPopup();
    });
  });

  // Bind data-auth="register" elements
  document.querySelectorAll('[data-auth="register"]').forEach((el) => {
    if (el.dataset.authBound) return;
    el.dataset.authBound = 'true';
    el.addEventListener('click', (e) => {
      e.preventDefault();
      showRegisterPopup();
    });
  });
}

/**
 * Main initialization routine.
 * Binds triggers and checks authentication state.
 */
function init() {
  bindAuthTriggers();
  checkAuthState();
}

// Run init when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ---------------------------------------------------------------------------
// 18. Exports
// ---------------------------------------------------------------------------

export { showLoginPopup, showRegisterPopup, checkAuthState, logout };
