# F1 Web Game (3D) — Vite + Three.js

## Run locally
```bash
cd f1-game
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages (recommended)
This repo is `sibgatul630-hash.github.io`, so it serves pages automatically.

### Simple method (manual)
1. Build:
   ```bash
   npm run build
   ```
2. Copy everything in `f1-game/dist/` into `docs/f1-game/` (or configure Pages to serve from `dist` using an action).
3. In GitHub repo Settings → Pages:
   - Source: Deploy from a branch
   - Branch: `main`
   - Folder: `/docs`

### Alternate (easier): serve built files directly
If you can set GitHub Pages to serve from `/ (root)` on `main`, then copy `dist/*` into `/f1-game/` directly.
But note: you will overwrite source files unless you keep source somewhere else.

## Controls
- W: throttle
- S: brake / reverse
- A / D: steer
- Space: handbrake
- R: reset car
- C: change camera

## Notes
- Physics is a tuned arcade-sim hybrid: slip angle + grip + downforce.
- Next upgrades: AI cars, racing line, pits, multiple tracks, better collision.
