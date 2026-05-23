/**
 * LoginPage.js — Clean login screen with a single "Login with Telegram" button.
 *
 * Flow:
 *   • Button click → opens Telegram auth popup (via the Login Widget)
 *   • On success   → onWidgetLogin(user) is called
 *   • Demo link    → onDemoLogin(mockUser) for local testing
 *
 * Setup (required before the button works):
 *   1. Set BOT_USERNAME below to your bot's username (without @)
 *   2. Send /setdomain to @BotFather to whitelist this page's domain
 */

import { loadLoginWidget } from '../utils/telegram.js'

// ─── Bot configuration ─────────────────────────────────────────────────────
// Replace with your actual bot username (without @).
const BOT_USERNAME = 'testmode_dev_bot'
// ───────────────────────────────────────────────────────────────────────────

const IS_CONFIGURED = BOT_USERNAME !== 'testmode_dev_bot'

/**
 * @param {HTMLElement} container
 * @param {{ onDemoLogin: Function, onWidgetLogin: Function }} callbacks
 */
export function renderLoginPage(container, { onDemoLogin, onWidgetLogin }) {
  container.innerHTML = buildHTML()
  attachEvents(container, { onDemoLogin, onWidgetLogin })
  initWidget(onWidgetLogin)
}

// ─── HTML ──────────────────────────────────────────────────────────────────

function buildHTML() {
  return /* html */ `
  <div class="min-h-screen flex flex-col items-center justify-center
              bg-gradient-to-b from-[#E8F4FE] to-[#F0F2F5] px-5 py-12 page-enter">

    <!-- Icon -->
    <div class="inline-flex items-center justify-center w-[88px] h-[88px] rounded-[24px]
                gradient-bg shadow-[0_12px_32px_rgba(42,171,238,0.35)] mb-7 float-anim">
      ${telegramSVG(48)}
    </div>

    <!-- Heading -->
    <h1 class="text-[1.75rem] font-extrabold text-gray-900 text-center leading-tight mb-2">
      Connect with <span class="gradient-text">Telegram</span>
    </h1>
    <p class="text-gray-500 text-[15px] text-center leading-relaxed mb-10 max-w-[280px]">
      Sign in securely using your Telegram account
    </p>

    <!-- Auth card -->
    <div class="w-full max-w-[340px] bg-white rounded-3xl
                shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6">

      ${IS_CONFIGURED ? configuredWidget() : notConfiguredButton()}

      <!-- Divider -->
      <div class="flex items-center gap-3 my-4">
        <div class="flex-1 h-px bg-gray-100"></div>
        <span class="text-[12px] text-gray-400 font-medium">or</span>
        <div class="flex-1 h-px bg-gray-100"></div>
      </div>

      <!-- Demo link -->
      <button id="demo-btn"
              class="w-full text-[13px] text-[#2AABEE] font-semibold py-2.5 rounded-xl
                     hover:bg-[#E8F4FE] transition-colors duration-150 active:scale-[0.98]">
        Try Demo Mode
      </button>
    </div>

    <!-- Footer note -->
    <p class="mt-6 text-[12px] text-gray-400 text-center max-w-[260px] leading-relaxed">
      By continuing you agree to Telegram's
      <a href="https://telegram.org/privacy" target="_blank" rel="noopener"
         class="underline hover:text-gray-600">Privacy Policy</a>.
    </p>

  </div>

  <!-- Modal overlay (shown when button clicked in configured mode) -->
  <div id="tg-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-5">
    <!-- Backdrop -->
    <div id="tg-modal-backdrop"
         class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

    <!-- Modal card -->
    <div class="relative bg-white rounded-3xl shadow-2xl p-7 w-full max-w-[320px] text-center
                animate-[fadeUp_0.25s_ease-out_both]">

      <!-- Close button -->
      <button id="tg-modal-close"
              class="absolute top-4 right-4 w-7 h-7 rounded-full bg-gray-100
                     hover:bg-gray-200 flex items-center justify-center transition-colors">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
             xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1l10 10M11 1L1 11" stroke="#6B7280" stroke-width="1.8"
                stroke-linecap="round"/>
        </svg>
      </button>

      <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl
                  gradient-bg shadow-[0_6px_16px_rgba(42,171,238,0.3)] mb-4">
        ${telegramSVG(28)}
      </div>

      <h2 class="text-base font-bold text-gray-900 mb-1">Connect with Telegram</h2>
      <p class="text-[13px] text-gray-500 mb-5">
        Click the button below to authorise with your Telegram account.
      </p>

      <!-- Telegram widget renders here -->
      <div id="tg-widget-target" class="flex justify-center min-h-[44px]"></div>

    </div>
  </div>
  `
}

// ─── Button variants ───────────────────────────────────────────────────────

function configuredWidget() {
  // Custom button — click opens the modal which contains the real Telegram widget
  return /* html */ `
    <button id="tg-login-btn"
            class="w-full flex items-center justify-center gap-3
                   bg-[#2AABEE] hover:bg-[#0088CC] active:scale-[0.97]
                   text-white font-semibold text-[15px] py-4 rounded-2xl
                   transition-all duration-150 shadow-[0_4px_16px_rgba(42,171,238,0.4)]
                   select-none cursor-pointer">
      ${telegramSVG(22)}
      Login with Telegram
    </button>
  `
}

function notConfiguredButton() {
  // Bot not yet set up — show the button disabled with a setup hint
  return /* html */ `
    <button id="tg-login-btn"
            class="w-full flex items-center justify-center gap-3
                   bg-[#2AABEE] hover:bg-[#0088CC] active:scale-[0.97]
                   text-white font-semibold text-[15px] py-4 rounded-2xl
                   transition-all duration-150 shadow-[0_4px_16px_rgba(42,171,238,0.4)]
                   select-none cursor-pointer">
      ${telegramSVG(22)}
      Login with Telegram
    </button>
    <p class="mt-3 text-[11px] text-amber-600 text-center leading-relaxed">
      ⚙️ Set <code class="bg-amber-50 px-1 rounded font-mono">BOT_USERNAME</code> in
      <strong>LoginPage.js</strong> and run
      <code class="bg-amber-50 px-1 rounded font-mono">/setdomain</code> in @BotFather
      to connect a real account.
    </p>
  `
}

// ─── SVG ──────────────────────────────────────────────────────────────────

function telegramSVG(size = 32) {
  return /* html */ `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"
         width="${size}" height="${size}" fill="white">
      <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20
               20-8.95 20-20S35.05 4 24 4zm9.72 13.67
               -3.35 15.79c-.25 1.11-.91 1.38-1.85.86
               l-5.1-3.76-2.46 2.37c-.27.27-.5.5-1.03.5
               l.37-5.21 9.49-8.57c.41-.37-.09-.57-.64-.2
               L14.25 30.97l-5.05-1.58c-1.1-.34-1.12-1.1.23-1.63
               l19.75-7.61c.91-.34 1.71.22 1.54 1.52z"/>
    </svg>
  `
}

// ─── Widget initialisation ─────────────────────────────────────────────────

function initWidget(onWidgetLogin) {
  // Register global callback before the script tag is injected
  window.onTelegramAuth = (user) => {
    console.log('[Telegram] Auth callback:', user)
    closeModal()
    onWidgetLogin(user)
  }

  if (!IS_CONFIGURED) return

  // Inject the Telegram widget script into the modal target
  const target = document.getElementById('tg-widget-target')
  if (target) loadLoginWidget(target, BOT_USERNAME, 'onTelegramAuth')
}

// ─── Modal helpers ─────────────────────────────────────────────────────────

function openModal() {
  const modal = document.getElementById('tg-modal')
  if (modal) modal.classList.remove('hidden')
}

function closeModal() {
  const modal = document.getElementById('tg-modal')
  if (modal) modal.classList.add('hidden')
}

// ─── Event binding ─────────────────────────────────────────────────────────

function attachEvents(container, { onDemoLogin, onWidgetLogin }) {
  // "Login with Telegram" button
  container.querySelector('#tg-login-btn')?.addEventListener('click', () => {
    if (IS_CONFIGURED) {
      openModal()
    } else {
      // Not configured — fall back to demo so the UI is still explorable
      onDemoLogin(mockUser())
    }
  })

  // Modal close button
  container.querySelector('#tg-modal-close')?.addEventListener('click', closeModal)

  // Close on backdrop click
  container.querySelector('#tg-modal-backdrop')?.addEventListener('click', closeModal)

  // Demo button
  container.querySelector('#demo-btn')?.addEventListener('click', () => {
    onDemoLogin(mockUser())
  })
}

// ─── Mock data for demo mode ───────────────────────────────────────────────

function mockUser() {
  return {
    id: 987654321,
    first_name: 'Alex',
    last_name: 'Johnson',
    username: 'alexj',
    photo_url: null,
    language_code: 'en',
    is_premium: true,
    auth_date: Math.floor(Date.now() / 1000),
    is_demo: true,
  }
}
