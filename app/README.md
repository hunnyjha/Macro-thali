# Macro Katori — App (PWA)

Track Food the Indian Way. *Har Katori Ka Hisaab.*

React + TypeScript + Vite + Tailwind, installable PWA with offline support.
The food database lives at the repo root; `scripts/sync-data.js` copies it into
`public/data/` automatically before `dev` and `build`.

## Run locally
```bash
cd app
npm install      # first time only
npm run dev      # opens http://localhost:5173
```

## Build for production
```bash
npm run build    # output in app/dist
npm run preview  # preview the production build
```

## Test the engines (no browser)
```bash
node --experimental-strip-types scripts/smoke-test.ts
```

## Architecture
- `src/types/` — TypeScript interfaces for every food/thali/log record.
- `src/data/` — Dexie (IndexedDB) cache + data service (lazy, scales to 20k+ foods).
- `src/search/` — Fuse.js fuzzy search with Hindi/alias/synonym + intent detection.
- `src/lib/nutrition.ts` — oil + portion macro math (mirrors the DB tooling).
- `src/store/` — Zustand daily-log store, persisted offline.
- `src/components/`, `src/screens/` — UI (Food Logger built first).

## Deploy (Netlify)
Repo root has `netlify.toml` pre-configured (base `app`, publish `app/dist`).
Connect the repo in Netlify and deploy — no manual settings needed.
