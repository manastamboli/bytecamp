# SitePilot - Mobile App (Capacitor)

This is the **Capacitor wrapper** for the SitePilot web application. It converts the Next.js web app into a native Android/iOS mobile app.

## Architecture

```
DevAlly/
├── sitepilot-frontend/   ← Next.js web app (the source)
└── siteplot-app/         ← This folder (Capacitor mobile shell)
    ├── android/          ← Android native project (open in Android Studio)
    ├── www/              ← Fallback HTML (loading screen)
    └── capacitor.config.json
```

## How It Works

The app uses **Capacitor's server URL mode** — instead of bundling static files, the mobile app loads the web app directly from:
- **Android Emulator**: `http://10.0.2.2:3000` (emulator alias for host `localhost`)
- **Real Device (LAN)**: Change the `server.url` in `capacitor.config.json` to your machine's **local IP** (e.g., `http://192.168.1.100:3000`)
- **Production**: Change `server.url` to your deployed URL (e.g., `https://app.sitepilot.io`)

> This approach avoids the static export limitation — all API routes, server actions, and auth continue to work.

---

## Development Workflow

### 1. Start the Next.js server
```bash
cd ../sitepilot-frontend
npm run dev
# Server running on http://localhost:3000
```

### 2. Find your local IP (for real device testing)
```powershell
ipconfig
# Look for IPv4 Address under your active network adapter (e.g., 192.168.1.100)
```
Then update `capacitor.config.json`:
```json
"server": {
  "url": "http://192.168.1.100:3000",
  ...
}
```

### 3. Sync and open in Android Studio
```bash
cd siteplot-app
npm run sync:android
npm run open:android
```
Then in Android Studio: **Run → Run 'app'** (either on emulator or connected device).

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run sync` | Sync web assets to all platforms |
| `npm run sync:android` | Sync to Android only |
| `npm run sync:ios` | Sync to iOS only |
| `npm run open:android` | Open Android project in Android Studio |
| `npm run open:ios` | Open iOS project in Xcode |
| `npm run add:android` | Add Android platform (already done) |
| `npm run add:ios` | Add iOS platform |

---

## Server URL Reference

| Scenario | Server URL |
|----------|------------|
| Android Emulator | `http://10.0.2.2:3000` |
| iOS Simulator | `http://localhost:3000` |
| Real Android/iOS Device | `http://<your-LAN-IP>:3000` |
| Production | `https://your-deployed-domain.com` |

---

## Production Build (Deploy to App Stores)

For production, point to your deployed web app:
1. Deploy `sitepilot-frontend` to Vercel / AWS / etc.
2. Update `capacitor.config.json`:
   ```json
   "server": {
     "url": "https://app.sitepilot.io",
     "androidScheme": "https",
     "cleartext": false
   }
   ```
3. Remove `"android": { "allowMixedContent": true }` (not needed for HTTPS)
4. Run `npm run sync:android`
5. Open Android Studio → **Build → Generate Signed APK/Bundle**

---

## Prerequisites

- **Android Studio** (for Android builds)
- **JDK 17+**
- **Android SDK** (API 22+) installed via Android Studio SDK Manager
- **Xcode** (for iOS, macOS only)
