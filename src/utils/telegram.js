/**
 * telegram.js — Telegram utilities
 *
 * TWO separate authentication systems:
 *
 * ── NEW: Telegram Login (OIDC) ─────────────────────────────────────────────
 *   Docs: https://core.telegram.org/bots/telegram-login
 *   Script: https://oauth.telegram.org/js/telegram-login.js?3
 *   - Uses your numeric Client ID (from @BotFather → Bot Settings → Web Login)
 *   - Returns a signed JWT id_token (OpenID Connect)
 *   - Server verifies token against JWKS: https://oauth.telegram.org/.well-known/jwks.json
 *   - Supports scopes: openid, profile, phone, telegram:bot_access
 *
 * ── Telegram Mini App (WebApp) ─────────────────────────────────────────────
 *   - window.Telegram.WebApp available when opened inside a Telegram bot
 *   - initDataUnsafe.user contains the current user automatically
 *   - initData raw string must be verified server-side with HMAC-SHA256
 */

export const TelegramWebApp = {
  /**
   * Returns true when the app is running inside Telegram
   * (i.e., opened via a bot's menu button or inline keyboard).
   */
  isAvailable() {
    return !!(
      window.Telegram?.WebApp?.initData &&
      window.Telegram.WebApp.initData.length > 0
    )
  },

  /**
   * Initialise the Telegram WebApp SDK.
   * Call this once at app startup.
   */
  init() {
    const twa = window.Telegram?.WebApp
    if (!twa) return null

    twa.ready()    // Signal app is mounted
    twa.expand()   // Expand to full viewport height

    // Attempt to set header colour (API v6.1+)
    try { twa.setHeaderColor('#2AABEE') } catch (_) { /* ignore */ }
    try { twa.setBackgroundColor('#F0F2F5') } catch (_) { /* ignore */ }

    return twa
  },

  /**
   * Returns the Telegram user object from the WebApp context, or null.
   *
   * Available fields:
   *   id, first_name, last_name?, username?, language_code?, is_premium?
   */
  getUser() {
    return window.Telegram?.WebApp?.initDataUnsafe?.user ?? null
  },

  /**
   * Returns the raw initData string for server-side verification.
   * This is what you send to your backend to verify authenticity.
   */
  getInitData() {
    return window.Telegram?.WebApp?.initData ?? ''
  },

  /**
   * Returns the colour scheme the user has set in Telegram ('light' | 'dark').
   */
  getTheme() {
    return window.Telegram?.WebApp?.colorScheme ?? 'light'
  },

  /**
   * Show a native Telegram alert dialog (falls back to window.alert).
   */
  showAlert(message, callback) {
    if (window.Telegram?.WebApp?.showAlert) {
      window.Telegram.WebApp.showAlert(message, callback)
    } else {
      alert(message)
      callback?.()
    }
  },

  /**
   * Trigger haptic feedback (only works inside Telegram).
   * @param {'light'|'medium'|'heavy'|'rigid'|'soft'} style
   */
  haptic(style = 'light') {
    try {
      window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style)
    } catch (_) { /* not available in all Telegram versions */ }
  },

  /**
   * Close the Mini App (only works inside Telegram).
   */
  close() {
    window.Telegram?.WebApp?.close()
  },
}

/**
 * Loads the NEW Telegram Login SDK (telegram-login.js?3) into <head>.
 *
 * Call once at app startup. The library exposes window.Telegram.Login
 * once loaded. Use triggerTelegramLogin() after that.
 *
 * Setup required in @BotFather:
 *   1. Open @BotFather mini app → Bot Settings → Web Login
 *   2. Add your website origin as an Allowed URL
 *   3. Copy the numeric Client ID shown there
 *
 * @param {number} clientId - Numeric Client ID from @BotFather
 */
export function loadTelegramLoginSDK(clientId) {
  if (!clientId) return
  if (document.querySelector('script[data-tg-login-sdk]')) return // already loaded

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://oauth.telegram.org/js/telegram-login.js?3'
  script.setAttribute('data-tg-login-sdk', '1')
  script.setAttribute('data-client-id', String(clientId))
  document.head.appendChild(script)
}

/**
 * Open the Telegram Login popup using the JS API.
 *
 * The callback receives ONE of:
 *   { id_token: string, user: TelegramUser }   — success
 *   { error: string }                           — failure / cancelled
 *
 * TelegramUser (decoded from id_token):
 *   { id, name, preferred_username, picture, sub, iss, aud, iat, exp,
 *     phone_number? }
 *
 * IMPORTANT: Verify id_token server-side before trusting user data.
 *   Fetch JWKS from https://oauth.telegram.org/.well-known/jwks.json
 *   and verify with a standard JWT library.
 *
 * @param {number}   clientId - Numeric Client ID from @BotFather
 * @param {Function} onResult - Callback receiving { id_token, user } | { error }
 * @param {Object}   [opts]   - Optional: { request_access, lang, nonce }
 */
export function triggerTelegramLogin(clientId, onResult, opts = {}) {
  if (!window.Telegram?.Login) {
    onResult({ error: 'Telegram Login SDK is not loaded yet. Please wait a moment and try again.' })
    return
  }

  window.Telegram.Login.auth(
    {
      client_id: clientId,
      request_access: opts.request_access ?? ['write'],
      lang: opts.lang,
      nonce: opts.nonce,
    },
    onResult,
  )
}
