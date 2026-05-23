import { esc, initialsAvatar } from '../utils/helpers.js'

export function renderProfilePage(container, { user, id_token, initData, is_demo, onLogout }) {
  container.innerHTML = buildHTML(user, is_demo)
  attachEvents(container, onLogout)
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function displayName(user) {
  return user.name ||
    [user.first_name, user.last_name].filter(Boolean).join(' ') ||
    'Unknown'
}

function displayUsername(user) {
  return user.preferred_username || user.username || null
}

function displayPhoto(user) {
  return user.picture || user.photo_url || null
}

// ─── HTML ──────────────────────────────────────────────────────────────────

function buildHTML(user, is_demo) {
  const name  = displayName(user)
  const uname = displayUsername(user)
  const photo = displayPhoto(user)

  const avatar = photo
    ? `<img src="${esc(photo)}" alt="${esc(name)}" class="w-full h-full object-cover" />`
    : initialsAvatar(
        user.first_name || (user.name?.split(' ')[0] ?? '?'),
        user.last_name  || (user.name?.split(' ')[1] ?? ''),
      )

  return `
  <div class="min-h-screen bg-[#F0F2F5] page-enter">

    <!-- Header -->
    <div class="gradient-bg pt-12 pb-24 px-6 text-white text-center">
      <p class="text-sm font-medium opacity-75 mb-8">
        ${is_demo ? '🎭 Demo Mode' : '✅ Logged in with Telegram'}
      </p>

      <!-- Avatar -->
      <div class="relative inline-block">
        <div class="w-24 h-24 rounded-full border-[3px] border-white
                    shadow-[0_4px_20px_rgba(0,0,0,0.2)] overflow-hidden mx-auto">
          ${avatar}
        </div>
        ${user.is_premium ? `
          <div class="absolute -bottom-1 -right-1 w-7 h-7 rounded-full
                      bg-amber-400 border-2 border-white flex items-center justify-center">
            <span class="text-xs">⭐</span>
          </div>` : ''}
      </div>

      <h1 class="text-2xl font-extrabold mt-4 mb-1">${esc(name)}</h1>
      ${uname ? `<p class="text-blue-100 text-sm">@${esc(uname)}</p>` : ''}
    </div>

    <!-- Content -->
    <div class="px-5 -mt-14 pb-10 max-w-[400px] mx-auto">

      <div class="card">
        ${row('👤', 'Full Name',   esc(name))}
        ${uname ? row('🔖', 'Username', '@' + esc(uname)) : ''}
        ${row('🆔', 'Telegram ID', esc(String(user.id || user.sub || '—')))}
        ${user.language_code ? row('🌐', 'Language', esc(user.language_code.toUpperCase())) : ''}
        ${row('⭐', 'Account',     user.is_premium ? 'Telegram Premium' : 'Standard')}
        ${(user.iat || user.auth_date) ? row('🕐', 'Logged in', formatDate(user.iat || user.auth_date)) : ''}
      </div>

      <button id="logout-btn" class="btn-danger mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Sign Out
      </button>

    </div>
  </div>
  `
}

function row(icon, label, value) {
  return `
    <div class="info-row">
      <div class="info-icon">${icon}</div>
      <div class="flex-1 min-w-0">
        <p class="info-label">${label}</p>
        <p class="info-value truncate">${value}</p>
      </div>
    </div>
  `
}

function formatDate(unix) {
  return new Date(unix * 1000).toLocaleString()
}

function attachEvents(container, onLogout) {
  container.querySelector('#logout-btn')?.addEventListener('click', onLogout)
}

