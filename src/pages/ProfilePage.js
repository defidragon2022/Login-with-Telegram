/**
 * ProfilePage.js
 *
 * Displays the authenticated Telegram user's profile along with
 * educational content about the data received and how to verify
 * it on the server.
 */

import { esc, initialsAvatar } from '../utils/helpers.js'

/**
 * @typedef {Object} TelegramUser
 * @property {number}  id
 * @property {string}  first_name
 * @property {string}  [last_name]
 * @property {string}  [username]
 * @property {string}  [photo_url]
 * @property {string}  [language_code]
 * @property {boolean} [is_premium]
 * @property {number}  [auth_date]
 * @property {string}  [hash]
 * @property {boolean} [is_demo]
 */

/**
 * Render the profile page into `container`.
 *
 * @param {HTMLElement} container
 * @param {{ user: TelegramUser, initData: string|null, onLogout: Function }} opts
 */
export function renderProfilePage(container, { user, initData, onLogout }) {
  container.innerHTML = buildHTML(user, initData)
  attachEvents(container, onLogout)
}

// ─── HTML builder ──────────────────────────────────────────────────────────

function buildHTML(user, initData) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).map(esc).join(' ')
  const avatar   = user.photo_url
    ? `<img src="${esc(user.photo_url)}" alt="${esc(user.first_name)}"
            class="w-full h-full object-cover" />`
    : initialsAvatar(user.first_name, user.last_name)

  const source = user.is_demo
    ? 'Demo Mode'
    : initData
      ? 'Telegram Mini App'
      : 'Telegram Login Widget'

  return /* html */ `
  <div class="min-h-screen bg-[#F0F2F5] page-enter">

    <!-- ── Blue header ─────────────────────────────────────── -->
    <div class="gradient-bg pt-12 pb-24 px-6 text-white text-center relative">
      <h1 class="text-base font-semibold opacity-80 mb-8">Your Telegram Profile</h1>

      <!-- Avatar -->
      <div class="relative inline-block">
        <div class="w-24 h-24 rounded-full border-[3px] border-white
                    shadow-[0_4px_20px_rgba(0,0,0,0.2)] overflow-hidden mx-auto">
          ${avatar}
        </div>
        ${user.is_premium ? premiumBadge() : ''}
      </div>

      <h2 class="text-2xl font-extrabold mt-4 mb-1">${fullName}</h2>
      ${user.username ? `<p class="text-blue-100 text-sm">@${esc(user.username)}</p>` : ''}

      <!-- Source badge -->
      <div class="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur
                  px-3 py-1 rounded-full text-xs font-medium mt-3">
        ${sourceBadgeIcon(user)} ${esc(source)}
      </div>
    </div>

    <!-- ── Content (overlapping header) ─────────────────────── -->
    <div class="px-5 -mt-14 pb-10 max-w-[440px] mx-auto stagger">

      <!-- Account Details -->
      <div class="card">
        <p class="section-title">Account Details</p>
        ${infoRow('👤', 'Full Name',     fullName || '—')}
        ${user.username    ? infoRow('🔖', 'Username',    '@' + esc(user.username)) : ''}
        ${infoRow('🆔', 'Telegram ID',   esc(String(user.id)))}
        ${user.language_code ? infoRow('🌐', 'Language',  esc(user.language_code.toUpperCase())) : ''}
        ${infoRow('⭐', 'Account Type',  user.is_premium ? 'Telegram Premium' : 'Standard')}
        ${user.auth_date   ? infoRow('🕐', 'Auth Date',   formatDate(user.auth_date)) : ''}
      </div>

      <!-- Raw auth data (Widget / Mini App only) -->
      ${initData ? rawDataCard(initData) : ''}
      ${user.hash ? widgetDataCard(user) : ''}

      <!-- Server verification guide -->
      ${verificationCard()}

      <!-- Available fields reference -->
      ${fieldsReferenceCard()}

      <!-- Sign out -->
      <button id="logout-btn" class="btn-danger">
        ${logoutSVG()}
        Sign Out
      </button>

    </div>
  </div>
  `
}

// ─── Section helpers ───────────────────────────────────────────────────────

function infoRow(icon, label, value) {
  return /* html */ `
    <div class="info-row">
      <div class="info-icon">${icon}</div>
      <div class="flex-1 min-w-0">
        <p class="info-label">${label}</p>
        <p class="info-value truncate">${value}</p>
      </div>
    </div>
  `
}

function premiumBadge() {
  return /* html */ `
    <div class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full
                bg-amber-400 border-2 border-white flex items-center justify-center">
      <span class="text-xs">⭐</span>
    </div>
  `
}

function sourceBadgeIcon(user) {
  if (user.is_demo)  return '🎭'
  if (user.hash)     return '🔗'  // Widget
  return '📱'                     // Mini App
}

function rawDataCard(initData) {
  return /* html */ `
    <div class="card">
      <p class="section-title">Raw initData (Mini App)</p>
      <p class="text-[12px] text-gray-500 mb-3 leading-relaxed">
        This URL-encoded string is sent by Telegram when your Mini App opens.
        Send it to your server and verify the
        <code class="bg-gray-100 px-1 rounded text-[#0088CC]">hash</code>
        field with HMAC-SHA256.
      </p>
      <div class="bg-gray-50 rounded-xl p-3 text-[11px] font-mono text-gray-600
                  break-all leading-relaxed max-h-28 overflow-y-auto">
        ${esc(initData)}
      </div>
    </div>
  `
}

function widgetDataCard(user) {
  const fields = ['id', 'first_name', 'last_name', 'username', 'auth_date', 'hash']
  const lines  = fields
    .filter(k => user[k] != null)
    .map(k => `<span class="text-yellow-400">${k}</span>: <span class="text-green-400">"${esc(String(user[k]))}"</span>`)

  return /* html */ `
    <div class="card">
      <p class="section-title">Received Widget Data</p>
      <p class="text-[12px] text-gray-500 mb-3">
        The Login Widget callback provides these fields. Always verify
        <code class="bg-gray-100 px-1 rounded text-[#0088CC]">hash</code> server-side.
      </p>
      <div class="code-block">
        <pre class="text-[11px] leading-relaxed">{
  ${lines.join(',\n  ')}
}</pre>
      </div>
    </div>
  `
}

function verificationCard() {
  // Per https://core.telegram.org/widgets/login#checking-authorization
  const code = [
    '<span class="text-gray-400">// Node.js — verify Telegram Login Widget data</span>',
    '<span class="text-gray-400">// Ref: core.telegram.org/widgets/login#checking-authorization</span>',
    '<span class="text-blue-300">const</span> crypto = <span class="text-yellow-300">require</span>(<span class="text-green-400">\'crypto\'</span>)',
    '',
    '<span class="text-blue-300">function</span> <span class="text-yellow-300">verifyTelegramAuth</span>(authData, botToken) {',
    '  <span class="text-blue-300">const</span> { hash, ...data } = authData',
    '',
    '  <span class="text-gray-400">// 1. Check auth_date is recent (prevent replay attacks)</span>',
    '  <span class="text-blue-300">const</span> MAX_AGE_SECONDS = <span class="text-orange-300">86400</span> <span class="text-gray-400">// 24 hours</span>',
    '  <span class="text-blue-300">if</span> (Date.now() / <span class="text-orange-300">1000</span> - data.auth_date > MAX_AGE_SECONDS) {',
    '    <span class="text-blue-300">return false</span> <span class="text-gray-400">// data is too old</span>',
    '  }',
    '',
    '  <span class="text-gray-400">// 2. Build the data-check-string (sorted, key=value, \\n separated)</span>',
    '  <span class="text-blue-300">const</span> dataStr = Object.<span class="text-yellow-300">keys</span>(data)',
    '    .<span class="text-yellow-300">sort</span>()',
    '    .<span class="text-yellow-300">map</span>(k => <span class="text-green-400">`${k}=${data[k]}`</span>)',
    '    .<span class="text-yellow-300">join</span>(<span class="text-green-400">\'\\n\'</span>)',
    '',
    '  <span class="text-gray-400">// 3. secret_key = SHA256(bot_token)</span>',
    '  <span class="text-blue-300">const</span> secret = crypto',
    '    .<span class="text-yellow-300">createHash</span>(<span class="text-green-400">\'sha256\'</span>)',
    '    .<span class="text-yellow-300">update</span>(botToken)',
    '    .<span class="text-yellow-300">digest</span>()',
    '',
    '  <span class="text-gray-400">// 4. HMAC-SHA256(data_check_string, secret_key) must equal hash</span>',
    '  <span class="text-blue-300">const</span> hmac = crypto',
    '    .<span class="text-yellow-300">createHmac</span>(<span class="text-green-400">\'sha256\'</span>, secret)',
    '    .<span class="text-yellow-300">update</span>(dataStr)',
    '    .<span class="text-yellow-300">digest</span>(<span class="text-green-400">\'hex\'</span>)',
    '',
    '  <span class="text-blue-300">return</span> hmac === hash',
    '}',
  ].join('\n')

  return /* html */ `
    <div class="card">
      <p class="section-title">Server Verification (Node.js)</p>
      <p class="text-[12px] text-gray-500 mb-3 leading-relaxed">
        Run this on your backend. <strong class="text-red-500">Never</strong> expose
        your bot token in client-side code.
      </p>
      <div class="code-block overflow-x-auto">
        <pre class="text-[11px] leading-relaxed">${code}</pre>
      </div>
      <div class="flex items-start gap-2 mt-3 bg-amber-50 rounded-xl p-3">
        <span class="text-amber-500 text-sm flex-shrink-0">⚠️</span>
        <p class="text-[12px] text-amber-700 leading-relaxed">
          Never expose your bot token in client-side code.
          The <code class="bg-amber-100 px-1 rounded">auth_date</code> staleness check
          (step 1 above) is required by Telegram to prevent replay attacks.
        </p>
      </div>
    </div>
  `
}

function fieldsReferenceCard() {
  const fields = [
    { f: 'id',            d: 'Unique user ID' },
    { f: 'first_name',    d: 'First name' },
    { f: 'last_name',     d: 'Last name (optional)' },
    { f: 'username',      d: 'Username (optional)' },
    { f: 'photo_url',     d: 'Profile photo URL' },
    { f: 'language_code', d: 'IETF language tag' },
    { f: 'auth_date',     d: 'Unix timestamp' },
    { f: 'hash',          d: 'HMAC-SHA256 hash' },
    { f: 'is_premium',    d: 'Telegram Premium?' },
  ]

  return /* html */ `
    <div class="card">
      <p class="section-title">Available Data Fields</p>
      <div class="grid grid-cols-2 gap-2">
        ${fields.map(({ f, d }) => /* html */ `
          <div class="bg-gray-50 rounded-xl p-2.5">
            <code class="text-[#2AABEE] text-[11px] font-bold">${f}</code>
            <p class="text-gray-400 text-[11px] mt-0.5 leading-snug">${d}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

// ─── SVG helpers ───────────────────────────────────────────────────────────

function logoutSVG() {
  return /* html */ `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  `
}

// ─── Utilities ─────────────────────────────────────────────────────────────

function formatDate(unixTimestamp) {
  return new Date(unixTimestamp * 1000).toLocaleString()
}

// ─── Event binding ─────────────────────────────────────────────────────────

function attachEvents(container, onLogout) {
  container.querySelector('#logout-btn')?.addEventListener('click', onLogout)
}
