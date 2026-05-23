/**
 * telegram.js — Telegram WebApp & Login Widget utilities
 *
 * Two authentication scenarios:
 *
 * 1. Telegram Mini App (opened inside Telegram bot)
 *    - window.Telegram.WebApp is available
 *    - initDataUnsafe.user contains the current user
 *    - initData (raw string) must be verified server-side with HMAC-SHA256
 *
 * 2. Telegram Login Widget (external website)
 *    - A <script> tag renders a "Log in with Telegram" button
 *    - After login, a callback receives user object + hash
 *    - Hash must be verified server-side with HMAC-SHA256
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
 * Loads the Telegram Login Widget script into a container element.
 *
 * @param {HTMLElement} container   – DOM element to inject the widget into
 * @param {string}      botUsername – Your bot's username (without @)
 * @param {string}      callbackFn  – Global function name called after login
 *
 * Usage:
 *   window.onTelegramAuth = (user) => { ... }
 *   loadLoginWidget(el, 'MyBot', 'onTelegramAuth')
 */
export function loadLoginWidget(container, botUsername, callbackFn = 'onTelegramAuth') {
  if (!container || !botUsername) return

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.setAttribute('data-telegram-login', botUsername)
  script.setAttribute('data-size', 'large')
  script.setAttribute('data-radius', '12')
  script.setAttribute('data-onauth', `${callbackFn}(user)`)
  script.setAttribute('data-request-access', 'write')

  container.appendChild(script)
}
