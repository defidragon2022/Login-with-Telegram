# Connect with Telegram

## How it works

The app supports two authentication flows depending on where it is opened:

| Flow | When used | What you get |
|------|-----------|--------------|
| **Telegram Login (OIDC)** | Opened in a normal browser | Signed `id_token` JWT via OAuth popup |
| **Telegram Mini App** | Opened inside Telegram (bot menu / inline keyboard) | `initData` + `user` object from `window.Telegram.WebApp` |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- A **Telegram account** to create a bot via [@BotFather](https://t.me/BotFather)
- A publicly accessible HTTPS URL when configuring Trusted Origins (for local dev, `localhost` is also accepted by Telegram)

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/defidragon2022/Login-with-Telegram
cd "Connect with Telegram"

# 2. Install dependencies
npm install

# 3. Create the environment file
cp .env.example .env      # or create .env manually (see below)

# 4. Fill in your Client ID (see Configuration section)
# VITE_TELEGRAM_CLIENT_ID=123456789

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3300](http://localhost:3300) in your browser.

---

## Configuration

### Step 1 — Create a Telegram Bot

1. Open Telegram and start a chat with **[@BotFather](https://t.me/BotFather)**.
2. Send the command `/newbot`.
3. Follow the prompts — choose a display name and a username (must end in `bot`).
4. BotFather will reply with your bot token. **Keep it secret — never commit it.**

> You do **not** need the bot token in this front-end project. It is only needed on your back-end for server-side verification.

---

### Step 2 — Get your numeric Client ID

Your **Client ID** is the numeric part of your bot token — the digits **before** the colon.

```
Bot token:  123456789:AAFxxxxxxxxxxxxxxxxxxxxxxxx
Client ID:  123456789   ← this number only
```

---

### Step 3 — Set Trusted Origins

Telegram's Login SDK will only open the authentication popup from origins you have explicitly whitelisted. Without this step, the popup will be blocked or return an error.

**How to add a Trusted Origin:**

1. Open **[@BotFather](https://t.me/BotFather)** in Telegram.
2. Send `/mybots` and select your bot.
3. Tap **Bot Settings** → **Web Login** → **Domain** (or **Trusted Domains**).
4. Enter the **exact origin** of your app — the protocol + hostname + port (no trailing slash):

   | Environment | Example origin |
   |-------------|---------------|
   | Local development | `http://localhost:3300` |
   | Production (Render) | `https://your-app.onrender.com` |
   | Production (Vercel) | `https://your-app.vercel.app` |
   | Custom domain | `https://yourdomain.com` |

5. Confirm / save. Changes take effect within a few seconds.

> **Important:** The origin must match **exactly** what appears in the browser address bar. `http` vs `https`, and `www` vs non-`www`, are treated as different origins.

---

### Step 4 — Set the environment variable

Create a file named **`.env`** in the project root:

```env
# .env
VITE_TELEGRAM_CLIENT_ID=123456789
```

Replace `123456789` with your actual numeric Client ID from Step 2.

> Vite exposes only variables prefixed with `VITE_` to the browser bundle. Never put your bot **token** (the secret part after the colon) in this file.

You can also create a **`.env.example`** file (safe to commit) as a reference:

```env
# .env.example  — copy to .env and fill in your values
VITE_TELEGRAM_CLIENT_ID=
```

---

## Running the app

```bash
# Development server with hot reload (http://localhost:3300)
npm run dev

# Preview the production build locally
npm run preview
```

---

## Building for production

```bash
npm run build
```

Output is placed in the `dist/` folder. Deploy that folder to any static host (Vercel, Netlify, Render, GitHub Pages, etc.).

After deploying, remember to **add the production URL as a Trusted Origin** in BotFather (Step 3).

---

## Server-side token verification

> **Never trust the `id_token` without verifying it on your server.**

When the user logs in via the OIDC flow the front-end receives a signed JWT `id_token`. Send this token to your backend and verify it:

1. Fetch the public keys from Telegram's JWKS endpoint:
   ```
   https://oauth.telegram.org/.well-known/jwks.json
   ```
2. Verify the JWT signature, `iss`, `aud`, `exp`, and `iat` claims using any standard JWT library (e.g. `jose`, `jsonwebtoken`).
3. The decoded payload contains:
   ```json
   {
     "sub": "123456789",
     "name": "John Doe",
     "preferred_username": "johndoe",
     "picture": "https://...",
     "iat": 1716000000,
     "exp": 1716003600
   }
   ```

**Node.js example using `jose`:**

```js
import { createRemoteJWKSet, jwtVerify } from 'jose'

const JWKS = createRemoteJWKSet(
  new URL('https://oauth.telegram.org/.well-known/jwks.json')
)

async function verifyTelegramToken(idToken, clientId) {
  const { payload } = await jwtVerify(idToken, JWKS, {
    audience: String(clientId),   // your numeric Client ID
    issuer: 'https://oauth.telegram.org',
  })
  return payload   // safe to trust
}
```

---

## Telegram Mini App mode

When the app is opened **inside Telegram** (via a bot menu button or inline keyboard), `window.Telegram.WebApp` is injected automatically. The app detects this and skips the login page entirely, using the already-authenticated user data.

For server-side verification of Mini App sessions, validate the `initData` string using HMAC-SHA256 with your **bot token** as the key. See the [official docs](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app) for the exact algorithm.

---

## Project Structure

```
.
├── index.html                  # Entry HTML — loads Telegram WebApp SDK first
├── .env                        # Your secrets (not committed)
├── .env.example                # Template for .env
├── vite.config.js              # Vite config (port 3300)
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── src/
    ├── main.js                 # Entry point — mounts the App
    ├── app.js                  # App controller — routing + auth wiring
    ├── style.css               # Global Tailwind + custom styles
    ├── pages/
    │   ├── LoginPage.js        # Login UI — reads VITE_TELEGRAM_CLIENT_ID
    │   └── ProfilePage.js      # Profile UI — displays user data
    └── utils/
        ├── telegram.js         # TelegramWebApp + OIDC SDK helpers
        ├── router.js           # Minimal client-side router
        └── helpers.js          # Utility functions (escaping, avatars, etc.)
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Login button does nothing | `VITE_TELEGRAM_CLIENT_ID` is not set or is `0`. Check your `.env` file and restart the dev server. |
| Popup blocked / "Origin not allowed" | Add your exact origin as a Trusted Origin in BotFather → Bot Settings → Web Login → Domain. |
| `Telegram Login SDK is not loaded yet` | The OAuth script hasn't finished loading. Wait 1–2 seconds and try again, or check your network for blocked requests. |
| Works on `localhost` but not on production | Add the production HTTPS URL as a separate Trusted Origin in BotFather. |
| User data is `null` in Mini App mode | Ensure `https://telegram.org/js/telegram-web-app.js` is the **first** script in `index.html` (already done by default). |
| `id_token` verification fails | Double-check that you are using the numeric Client ID (not the full bot token) as the `audience` claim. |
