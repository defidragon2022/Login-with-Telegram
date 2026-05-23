/**
 * app.js — Application controller
 *
 * Wires together the router, Telegram detection, and page renders.
 */

import { TelegramWebApp } from './utils/telegram.js'
import { Router }         from './utils/router.js'
import { renderLoginPage }   from './pages/LoginPage.js'
import { renderProfilePage } from './pages/ProfilePage.js'

export class App {
  constructor() {
    this.root    = document.getElementById('app')
    this.router  = new Router()
    this._user   = null
    this._initData = null
  }

  /** Boot the application. */
  init() {
    this._setupRouter()

    // Remove the inline loader that was shown in index.html
    this.root.innerHTML = ''

    // ── Telegram Mini App detection ──────────────────────────
    TelegramWebApp.init()

    if (TelegramWebApp.isAvailable()) {
      const user = TelegramWebApp.getUser()

      if (user) {
        // Running inside Telegram — skip login entirely
        console.log('[App] Telegram Mini App detected. Auto-login.')
        this._login(user, TelegramWebApp.getInitData())
        return
      }
    }

    // ── Fall back to login page ──────────────────────────────
    this.router.navigate('login')
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  _setupRouter() {
    this.router
      .register('login',   ()     => this._showLogin())
      .register('profile', (data) => this._showProfile(data))
  }

  _login(user, initData = null) {
    this._user     = user
    this._initData = initData
    this.router.navigate('profile', { user, initData })
  }

  _showLogin() {
    renderLoginPage(this.root, {
      onDemoLogin:   (user)         => this._login(user, null),
      onWidgetLogin: (user)         => this._login(user, null),
    })
  }

  _showProfile({ user, initData }) {
    renderProfilePage(this.root, {
      user,
      initData,
      onLogout: () => {
        this._user     = null
        this._initData = null
        TelegramWebApp.haptic('light')
        this.router.navigate('login')
      },
    })
  }
}
