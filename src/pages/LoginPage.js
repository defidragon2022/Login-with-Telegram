

import { loadTelegramLoginSDK, triggerTelegramLogin } from '../utils/telegram.js'

const CLIENT_ID = Number(import.meta.env.VITE_TELEGRAM_CLIENT_ID ?? 0)

const IS_CONFIGURED = CLIENT_ID !== 0


export function renderLoginPage(container, { onDemoLogin, onTelegramLogin }) {
  container.innerHTML = buildHTML()

  // Pre-load the Telegram Login SDK so it is ready when the user clicks
  if (IS_CONFIGURED) loadTelegramLoginSDK(CLIENT_ID)

  attachEvents(container, { onDemoLogin, onTelegramLogin })
}

// ─── HTML ──────────────────────────────────────────────────────────────────

function buildHTML() {
  return `
  <div class="min-h-screen flex flex-col items-center justify-center
              bg-gradient-to-b from-[#E8F4FE] to-[#F0F2F5] px-5 py-12 page-enter">

    <!-- Animated Telegram icon -->
    <div class="inline-flex items-center justify-center w-[88px] h-[88px] rounded-[24px]
                gradient-bg shadow-[0_12px_32px_rgba(42,171,238,0.35)] mb-7 float-anim">
      ${telegramSVG(48)}
    </div>

    <!-- Heading -->
    <h1 class="text-[1.75rem] font-extrabold text-gray-900 text-center leading-tight mb-2">
      Log in with <span class="gradient-text">Telegram</span>
    </h1>
    <p class="text-gray-500 text-[15px] text-center leading-relaxed mb-10 max-w-[280px]">
      Sign in securely using your Telegram account in seconds
    </p>

    <!-- Auth card -->
    <div class="w-full max-w-[340px] bg-white rounded-3xl
                shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-6">

      <!-- Primary CTA -->
      <button id="tg-login-btn"
              class="w-full flex items-center justify-center gap-3
                     bg-[#2AABEE] hover:bg-[#0088CC] active:scale-[0.97]
                     text-white font-semibold text-[15px] py-4 rounded-2xl
                     transition-all duration-150 shadow-[0_4px_16px_rgba(42,171,238,0.35)]
                     select-none cursor-pointer">
        ${telegramSVG(22)}
        Login with Telegram
      </button>

      <!-- Setup hint — only shown when CLIENT_ID is not yet configured -->
      ${!IS_CONFIGURED ? setupHint() : ''}

      <!-- Inline error message (hidden by default) -->
      <p id="tg-error"
         class="hidden mt-3 text-[12px] text-red-500 text-center bg-red-50 rounded-xl px-3 py-2">
      </p>

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

    <!-- Privacy note -->
    <p class="mt-6 text-[12px] text-gray-400 text-center max-w-[260px] leading-relaxed">
      By continuing you agree to Telegram's
      <a href="https://telegram.org/privacy" target="_blank" rel="noopener"
         class="underline hover:text-gray-600">Privacy Policy</a>.
    </p>

  </div>
  `
}

// ─── Setup hint ────────────────────────────────────────────────────────────

function setupHint() {
  return  `
    <div class="mt-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
      <p class="text-[12px] font-bold text-amber-700 mb-2">⚙️ Bot not configured yet</p>
      <ol class="text-[11px] text-amber-600 space-y-1 list-decimal list-inside leading-relaxed">
        <li>Create a bot: <strong>@BotFather</strong> → <code class="bg-amber-100 px-1 rounded">/newbot</code></li>
        <li>Open <strong>@BotFather</strong> mini app → <strong>Bot Settings → Web Login</strong></li>
        <li>Add your site origin as a <strong>Trusted Origin</strong> (e.g. <code class="bg-amber-100 px-1 rounded">https://login-with-telegram.onrender.com</code>)</li>
        <li>Paste the <strong>numeric Client ID</strong> into <code class="bg-amber-100 px-1 rounded">CLIENT_ID</code> in <strong>LoginPage.js</strong></li>
      </ol>
    </div>
  `
}

// ─── SVG ──────────────────────────────────────────────────────────────────

function telegramSVG(size = 32) {
  return  `
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

// ─── Events ────────────────────────────────────────────────────────────────

function attachEvents(container, { onDemoLogin, onTelegramLogin }) {
  const loginBtn = container.querySelector('#tg-login-btn')
  const demoBtn  = container.querySelector('#demo-btn')
  const errorEl  = container.querySelector('#tg-error')

  function showError(msg) {
    if (!errorEl) return
    errorEl.textContent = msg
    errorEl.classList.remove('hidden')
    setTimeout(() => errorEl.classList.add('hidden'), 6000)
  }

  loginBtn?.addEventListener('click', () => {
    if (!IS_CONFIGURED) {
      onDemoLogin(mockData())
      return
    }

    triggerTelegramLogin(CLIENT_ID, (result) => {
      if (result.error) {
        console.error('[Telegram Login]', result.error)
        showError(result.error)
        return
      }
      // result = { id_token: string, user: { id, name, preferred_username, picture, … } }
      console.log('[Telegram Login] Success — user:', result.user)
      onTelegramLogin(result)
    })
  })

  demoBtn?.addEventListener('click', () => onDemoLogin(mockData()))
}

// ─── Mock data — matches the new SDK result shape ─────────────────────────

function mockData() {
  return {
    id_token: null,  // No real JWT in demo mode
    user: {
      id: 987654321,
      name: 'Alex Johnson',
      preferred_username: 'alexj',
      picture: null,
      sub: '987654321',
      iss: 'https://oauth.telegram.org',
      aud: String(CLIENT_ID || 0),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    },
    is_demo: true,
  }
}
