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
    this._idToken  = null
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
        this._login({ user, initData: TelegramWebApp.getInitData() })
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

  /**
   * @param {{ user, id_token?, initData?, is_demo? }} data
   */
  _login({ user, id_token = null, initData = null, is_demo = false }) {
    this._user    = user
    this._idToken = id_token
    this._initData = initData
    this.router.navigate('profile', { user, id_token, initData, is_demo })
  }

  _showLogin() {
    renderLoginPage(this.root, {
      onDemoLogin:      (data) => this._login(data),
      onTelegramLogin:  (data) => this._login(data),
    })
  }

  _showProfile({ user, id_token, initData, is_demo }) {
    renderProfilePage(this.root, {
      user,
      id_token,
      initData,
      is_demo,
      onLogout: () => {
        this._user    = null
        this._idToken = null
        this._initData = null
        TelegramWebApp.haptic('light')
        this.router.navigate('login')
      },
    })
  }
}
