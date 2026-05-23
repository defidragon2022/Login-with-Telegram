
import { esc, initialsAvatar } from '../utils/helpers.js'


export function renderProfilePage(container, { user, id_token, initData, is_demo, onLogout }) {
  container.innerHTML = buildHTML(user, id_token, initData, is_demo)
  attachEvents(container, onLogout)
}


function displayName(user) {
  return user.name ||
    [user.first_name, user.last_name].filter(Boolean).map(esc).join(' ') ||
    'Unknown'
}

function displayUsername(user) {
  return user.preferred_username || user.username || null
}

function displayPhoto(user) {
  return user.picture || user.photo_url || null
}

function loginSource(user, id_token, initData, is_demo) {
  if (is_demo)   return { label: 'Demo Mode',                icon: 'ðŸŽ­' }
  if (id_token)  return { label: 'Telegram Login (OIDC)',   icon: 'ðŸ”' }
  if (initData)  return { label: 'Telegram Mini App',       icon: 'ðŸ“±' }
  return               { label: 'Telegram Login',           icon: 'ðŸ”—' }
}


function buildHTML(user, id_token, initData, is_demo) {
  const name  = displayName(user)
  const uname = displayUsername(user)
  const photo = displayPhoto(user)
  const src   = loginSource(user, id_token, initData, is_demo)

  const avatar = photo
    ? `<img src="${esc(photo)}" alt="${esc(name)}" class="w-full h-full object-cover" />`
    : initialsAvatar(user.first_name || (user.name?.split(' ')[0] ?? '?'),
                     user.last_name  || (user.name?.split(' ')[1] ?? ''))

  return  `
  <div class="min-h-screen bg-[#F0F2F5] page-enter">

    <!-- â”€â”€ Blue header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
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

      <h2 class="text-2xl font-extrabold mt-4 mb-1">${esc(name)}</h2>
      ${uname ? `<p class="text-blue-100 text-sm">@${esc(uname)}</p>` : ''}

      <!-- Source badge -->
      <div class="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur
                  px-3 py-1 rounded-full text-xs font-medium mt-3">
        ${src.icon} ${esc(src.label)}
      </div>
    </div>

    <!-- â”€â”€ Content (overlapping header) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ -->
    <div class="px-5 -mt-14 pb-10 max-w-[440px] mx-auto stagger">

      <!-- Account Details -->
      <div class="card">
        <p class="section-title">Account Details</p>
        ${infoRow('ðŸ‘¤', 'Full Name',    esc(name))}
        ${uname  ? infoRow('ðŸ”–', 'Username',   '@' + esc(uname)) : ''}
        ${infoRow('ðŸ†”', 'Telegram ID',  esc(String(user.id || user.sub || 'â€”')))}
        ${user.language_code ? infoRow('ðŸŒ', 'Language', esc(user.language_code.toUpperCase())) : ''}
        ${infoRow('â­', 'Account Type', user.is_premium ? 'Telegram Premium' : 'Standard')}
        ${(user.iat || user.auth_date) ? infoRow('ðŸ•', 'Auth Date', formatDate(user.iat || user.auth_date)) : ''}
        ${user.exp ? infoRow('â±ï¸', 'Token Expires', formatDate(user.exp)) : ''}
      </div>

      <!-- JWT ID Token card (new OIDC login) -->
      ${id_token ? jwtTokenCard(id_token) : ''}

      <!-- Raw initData (Mini App) -->
      ${initData ? rawDataCard(initData) : ''}

      <!-- Server verification -->
      ${id_token || (!initData && !is_demo) ? jwtVerificationCard() : hmacVerificationCard()}

      <!-- Available fields reference -->
      ${id_token || (!initData && !is_demo) ? oidcFieldsCard() : legacyFieldsCard()}

      <!-- Sign out -->
      <button id="logout-btn" class="btn-danger">
        ${logoutSVG()}
        Sign Out
      </button>

    </div>
  </div>
  `
}


function infoRow(icon, label, value) {
  return  `
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
  return`
    <div class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full
                bg-amber-400 border-2 border-white flex items-center justify-center">
      <span class="text-xs">â­</span>
    </div>
  `
}


function jwtTokenCard(id_token) {
  const preview = id_token.length > 80
    ? esc(id_token.slice(0, 80)) + 'â€¦'
    : esc(id_token)

  return `
    <div class="card">
      <p class="section-title">ID Token (JWT)</p>
      <p class="text-[12px] text-gray-500 mb-3 leading-relaxed">
        Telegram returned a signed JWT. Send this token to your server and verify
        it using Telegram's public JWKS endpoint before trusting the user data.
      </p>
      <div class="bg-gray-50 rounded-xl p-3 text-[11px] font-mono text-[#0088CC]
                  break-all leading-relaxed max-h-20 overflow-y-auto">
        ${preview}
      </div>
      <div class="flex items-start gap-2 mt-3 bg-blue-50 rounded-xl p-3">
        <span class="text-blue-400 text-sm flex-shrink-0">â„¹ï¸</span>
        <p class="text-[12px] text-blue-700 leading-relaxed">
          A JWT has three parts separated by <code class="bg-blue-100 px-0.5 rounded">.</code>:
          <strong>header</strong> Â· <strong>payload</strong> Â· <strong>signature</strong>.
          See the verification code below for how to validate it server-side.
        </p>
      </div>
    </div>
  `
}


function rawDataCard(initData) {
  return `
    <div class="card">
      <p class="section-title">Raw initData (Mini App)</p>
      <p class="text-[12px] text-gray-500 mb-3 leading-relaxed">
        This URL-encoded string is sent by Telegram when your Mini App opens.
        Verify the <code class="bg-gray-100 px-1 rounded text-[#0088CC]">hash</code>
        field with HMAC-SHA256 on your backend.
      </p>
      <div class="bg-gray-50 rounded-xl p-3 text-[11px] font-mono text-gray-600
                  break-all leading-relaxed max-h-28 overflow-y-auto">
        ${esc(initData)}
      </div>
    </div>
  `
}


function jwtVerificationCard() {
  const code = [
    '<span class="text-gray-400">// Node.js â€” verify Telegram Login id_token (JWT)</span>',
    '<span class="text-gray-400">// Docs: core.telegram.org/bots/telegram-login</span>',
    '<span class="text-gray-400">// Requires: npm install jose</span>',
    '',
    '<span class="text-blue-300">const</span> { createRemoteJWKSet, jwtVerify } = <span class="text-yellow-300">require</span>(<span class="text-green-400">\'jose\'</span>)',
    '',
    '<span class="text-gray-400">// Telegram public keys â€” fetched and cached automatically</span>',
    '<span class="text-blue-300">const</span> JWKS = <span class="text-yellow-300">createRemoteJWKSet</span>(',
    '  <span class="text-blue-300">new</span> <span class="text-yellow-300">URL</span>(<span class="text-green-400">\'https://oauth.telegram.org/.well-known/jwks.json\'</span>)',
    ')',
    '',
    '<span class="text-blue-300">async function</span> <span class="text-yellow-300">verifyIdToken</span>(idToken, clientId) {',
    '  <span class="text-blue-300">const</span> { payload } = <span class="text-blue-300">await</span> <span class="text-yellow-300">jwtVerify</span>(idToken, JWKS, {',
    '    issuer:   <span class="text-green-400">\'https://oauth.telegram.org\'</span>,',
    '    audience: <span class="text-yellow-300">String</span>(clientId),   <span class="text-gray-400">// your numeric Client ID</span>',
    '  })',
    '',
    '  <span class="text-gray-400">// payload contains: id, name, preferred_username, picture, â€¦</span>',
    '  <span class="text-blue-300">return</span> payload',
    '}',
  ].join('\n')

  return `
    <div class="card">
      <p class="section-title">Server Verification â€” JWT (Node.js)</p>
      <p class="text-[12px] text-gray-500 mb-3 leading-relaxed">
        Verify the <code class="bg-gray-100 px-1 rounded text-[#0088CC]">id_token</code>
        on your backend before trusting any user data.
        <strong class="text-red-500">Never</strong> skip this step.
      </p>
      <div class="code-block overflow-x-auto">
        <pre class="text-[11px] leading-relaxed">${code}</pre>
      </div>
      <div class="flex items-start gap-2 mt-3 bg-amber-50 rounded-xl p-3">
        <span class="text-amber-500 text-sm flex-shrink-0">âš ï¸</span>
        <p class="text-[12px] text-amber-700 leading-relaxed">
          Check <code class="bg-amber-100 px-1 rounded">exp</code> (expiry) and
          <code class="bg-amber-100 px-1 rounded">iss</code> (issuer) values.
          Also ensure your site does <strong>not</strong> send
          <code class="bg-amber-100 px-1 rounded">Cross-Origin-Opener-Policy: same-origin</code>
          â€” this breaks the Telegram login popup. Use
          <code class="bg-amber-100 px-1 rounded">same-origin-allow-popups</code> instead.
        </p>
      </div>
    </div>
  `
}


function hmacVerificationCard() {
  const code = [
    '<span class="text-gray-400">// Node.js â€” verify Telegram Mini App initData</span>',
    '<span class="text-gray-400">// Ref: core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app</span>',
    '<span class="text-blue-300">const</span> crypto = <span class="text-yellow-300">require</span>(<span class="text-green-400">\'crypto\'</span>)',
    '',
    '<span class="text-blue-300">function</span> <span class="text-yellow-300">verifyInitData</span>(initData, botToken) {',
    '  <span class="text-blue-300">const</span> params = <span class="text-blue-300">new</span> <span class="text-yellow-300">URLSearchParams</span>(initData)',
    '  <span class="text-blue-300">const</span> hash   = params.<span class="text-yellow-300">get</span>(<span class="text-green-400">\'hash\'</span>)',
    '  params.<span class="text-yellow-300">delete</span>(<span class="text-green-400">\'hash\'</span>)',
    '',
    '  <span class="text-blue-300">const</span> dataStr = [...params.<span class="text-yellow-300">entries</span>()]',
    '    .<span class="text-yellow-300">sort</span>(([a], [b]) => a.<span class="text-yellow-300">localeCompare</span>(b))',
    '    .<span class="text-yellow-300">map</span>(([k, v]) => <span class="text-green-400">`${k}=${v}`</span>)',
    '    .<span class="text-yellow-300">join</span>(<span class="text-green-400">\'\\n\'</span>)',
    '',
    '  <span class="text-blue-300">const</span> secret = crypto.<span class="text-yellow-300">createHmac</span>(<span class="text-green-400">\'sha256\'</span>, <span class="text-green-400">\'WebAppData\'</span>)',
    '    .<span class="text-yellow-300">update</span>(botToken).<span class="text-yellow-300">digest</span>()',
    '',
    '  <span class="text-blue-300">const</span> hmac = crypto.<span class="text-yellow-300">createHmac</span>(<span class="text-green-400">\'sha256\'</span>, secret)',
    '    .<span class="text-yellow-300">update</span>(dataStr).<span class="text-yellow-300">digest</span>(<span class="text-green-400">\'hex\'</span>)',
    '',
    '  <span class="text-blue-300">return</span> hmac === hash',
    '}',
  ].join('\n')

  return `
    <div class="card">
      <p class="section-title">Server Verification â€” HMAC (Node.js)</p>
      <p class="text-[12px] text-gray-500 mb-3 leading-relaxed">
        For Telegram Mini App <code class="bg-gray-100 px-1 rounded text-[#0088CC]">initData</code>.
        Run on your backend â€” <strong class="text-red-500">never</strong> expose your bot token client-side.
      </p>
      <div class="code-block overflow-x-auto">
        <pre class="text-[11px] leading-relaxed">${code}</pre>
      </div>
    </div>
  `
}


function oidcFieldsCard() {
  const fields = [
    { f: 'id',                 d: 'Telegram user ID (number)' },
    { f: 'name',               d: 'Full display name' },
    { f: 'preferred_username', d: 'Telegram @username' },
    { f: 'picture',            d: 'Profile photo URL' },
    { f: 'phone_number',       d: 'Phone (phone scope)' },
    { f: 'sub',                d: 'Unique subject identifier' },
    { f: 'iss',                d: 'Issuer: oauth.telegram.org' },
    { f: 'aud',                d: 'Audience: your Client ID' },
    { f: 'iat',                d: 'Issued-at (Unix timestamp)' },
    { f: 'exp',                d: 'Expiry (Unix timestamp)' },
  ]

  return  `
    <div class="card">
      <p class="section-title">JWT Claims (OIDC)</p>
      <div class="grid grid-cols-2 gap-2">
        ${fields.map(({ f, d }) => `
          <div class="bg-gray-50 rounded-xl p-2.5">
            <code class="text-[#2AABEE] text-[11px] font-bold">${f}</code>
            <p class="text-gray-400 text-[11px] mt-0.5 leading-snug">${d}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `
}

function legacyFieldsCard() {
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

  return  `
    <div class="card">
      <p class="section-title">Available Data Fields</p>
      <div class="grid grid-cols-2 gap-2">
        ${fields.map(({ f, d }) => `
          <div class="bg-gray-50 rounded-xl p-2.5">
            <code class="text-[#2AABEE] text-[11px] font-bold">${f}</code>
            <p class="text-gray-400 text-[11px] mt-0.5 leading-snug">${d}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `
}


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

function formatDate(unixTimestamp) {
  return new Date(unixTimestamp * 1000).toLocaleString()
}


function attachEvents(container, onLogout) {
  container.querySelector('#logout-btn')?.addEventListener('click', onLogout)
}
