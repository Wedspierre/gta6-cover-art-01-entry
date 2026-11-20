# Vice Cover Studio

A GTA 6-style cover art maker that runs entirely offline in a desktop
browser. Load up to four of your own photos (or the two bundled samples),
pick one of five multi-panel layouts, wash it in one of six Vice City colour
grades, write the title, subtitle and tagline, then export a PNG in a common
post size.

## How to use

1. Serve `app/` with any static server — `node serve.ts` serves it on
   `http://127.0.0.1:8080` — and open `index.html`.
2. Add photos with the file picker, or load the bundled samples.
3. Pick a layout and a grade.
4. Type the title, the script subtitle and the tagline.
5. Click a panel to select it, drag to move its photo, scroll or use the
   zoom slider to zoom. Undo and redo are in step 5.
6. Pick a post size and click **Export PNG**.

## Layouts

- **Four panels** — a 2 × 2 grid.
- **Hero + three** — one large panel beside three stacked small ones.
- **One photo** — a single photo filling the whole cover.
- **Nine panels** — a 3 × 3 grid.
- **Tilted snapshots** — four overlapping, slightly rotated snapshots.

## Colour grades

Vice sunset, neon nights, golden hour, teal dawn, hot pink, and noir.

## Post sizes

Square 1080 × 1080, portrait 1080 × 1350, landscape 1920 × 1080.

## Lettering

The title is set in Anton and the subtitle in Pacifico, both under the SIL
Open Font License; the font files and their license texts live in
`app/fonts/`. No Rockstar Games logo, artwork or font is used anywhere.

## Privacy

Photos are read on your own machine and never uploaded. The app makes no
network requests: every script, style, image and font is a file under
`app/`.

## Files

- `app/index.html` — the editor page.
- `app/style.css` — the studio's look.
- `app/src/main.js` — the editor: state, undo/redo, panel editing, export.
- `app/src/cover.js` — the cover renderer: layouts, grades, lettering.
- `app/src/shots.js` — fixed scenes for screenshots, via the page URL.
- `app/samples/` — two sample photos, free to use.
- `app/fonts/` — Anton and Pacifico (SIL Open Font License).
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json`.
- `serve.ts` — a tiny static server for local testing.
- `shots.json` — the four screenshots and the scene each one shows.

## Screenshots

The four shots are driven by URL scenes (see `shots.json`):

1. `1-cover.jpg` — an exported-style landscape cover (1920 × 1080).
2. `2-editor.jpg` — the editor with a photo loaded (1280 × 720).
3. `3-cover.jpg` — an exported-style portrait cover (1080 × 1350).
4. `4-cover.jpg` — an exported-style square cover (1080 × 1080).
