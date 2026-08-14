# Calorie Tracker

A simple calorie and macro tracker you install straight onto your iPhone home
screen — no App Store, no Mac, no build tools on your phone. Paste or upload a
JSON diet log and it turns into charts, day-to-day stats, and a browsable food
log, all stored locally on your device.

## Importing data

The app accepts JSON shaped like this (see `src/lib/sampleData.ts` for a full
example, also available via the "Load sample" button in the app):

```json
{
  "2026-08-13": {
    "items": [
      { "name": "Large White Peach", "calories": "70", "carbs": "17g", "protein": "1.5g" }
    ],
    "daily_totals": { "calories": "1268", "carbs": "117g", "protein": "103.5g" }
  }
}
```

- Works for a single day or many days in one object.
- Date keys can be ISO (`2026-08-13`) or informal labels like `august_11` —
  both are parsed into real calendar dates for the charts.
- `daily_totals` is optional per day; if it's missing or incomplete, it's
  computed from the item list instead.
- You can paste several JSON blocks back to back (e.g. a schema doc followed
  by two separate day-log objects) — they're merged automatically.
- Re-importing a date you've already logged overwrites that day.

All data is stored in the browser's IndexedDB, on-device only. Nothing is
uploaded anywhere; there is no backend.

## Installing on iPhone

1. Open the deployed site in **Safari** on your iPhone (Settings → deploy URL
   below, or run it locally and open it over your LAN — see below).
2. Tap the **Share** button, then **Add to Home Screen**.
3. It launches full-screen from your home screen like a native app, and keeps
   your imported data between launches (installing doesn't reset storage).

Once deployed via the included GitHub Actions workflow, the site is served at:

```
https://<your-github-username>.github.io/calorie-tracker/
```

## Local development

Requires Node 18.19+ (Node 20+ recommended).

```bash
npm install
npm run dev      # starts a dev server; open the printed URL
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

To try it on your iPhone during development without deploying, run
`npm run dev -- --host` and open `http://<your-computer's-LAN-IP>:5173/calorie-tracker/`
in Safari while your phone is on the same Wi-Fi network.

## Tech

React + TypeScript + Vite, IndexedDB (via `idb`) for on-device storage, and a
service worker (via `vite-plugin-pwa`) for installability and offline use. No
backend, no accounts, no analytics.
