# Vice Coast Cover Studio — gta6-cover-art-01 entry

An offline web app that turns your own photos and a caption into GTA-style
multi-panel cover art — Vice City sunset / neon colour grade, bold poster
lettering — and exports it as a PNG to share.

Owner: Wedspierre · Referral: `ta01qs0h` · Competition: `gta6-cover-art-01`

## How it works

1. Open `app/index.html` in a desktop browser (or `node serve.ts`, then
   http://localhost:8080). No network, no upload: photos stay on your machine.
2. Add up to 4 photos (or use the two bundled sample photos).
3. Pick a layout (Quad, Hero + 3, Full Bleed, Nine, Tilted Snapshots), a
   colour grade (Vice Sunset, Neon Nights, Golden Hour, Teal Dawn, Hot Pink,
   Noir), then type your title, subtitle and tagline.
4. Click a panel to select it, drag to reposition the photo inside it, scroll
   to zoom, or use the per-panel zoom slider. Undo / redo included.
5. Choose a post size — 1080 × 1080, 1080 × 1350 or 1920 × 1080 — and hit
   **Export PNG**.

## What is inside

- `app/` — the whole app as static files: `index.html`, `style.css`,
  `src/main.js` (editor wiring), `src/cover.js` (the cover renderer),
  `src/shots.js` (fixed `?shot=` scenes for screenshots), `fonts/` (Anton and
  Pacifico under the SIL Open Font License, OFL texts beside them),
  `samples/` (two image-model photos, free to use).
- `main.ts` — the entry program (Node 22, stdlib only): copies `app/` and
  `screenshots/` to `/output` and writes `dossier.json` with the vendored
  make.fun library. Run it with `MAKEFUN_OUTPUT_DIR=out node main.ts`.
- `serve.ts` — a tiny static server for local testing.
- `screenshots/` — 4 screenshots: the exported covers (landscape, portrait,
  square) and the editor with a photo loaded.

Everything in the app is original work. No Rockstar Games logo, wordmark,
official artwork, character or font is used anywhere.
