// Vice Coast Cover Studio — editor wiring: photo slots, layout and grade
// pickers, caption inputs, panel drag / zoom, undo-redo, PNG export.
// A `?shot=` query instead sets up a fixed scene for a screenshot (shots.js).
import { GRADES, LAYOUTS, SIZES, defaultPanels, drawCover, gradeById, layoutById, layoutPanels, panelAt, renderCover, smartDy } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const taglineInput = document.getElementById('tagline');
const sizeSelect = document.getElementById('size');
const panelPhotoSelect = document.getElementById('panelPhoto');
const panelZoom = document.getElementById('panelZoom');
const panelHint = document.getElementById('panelHint');

const SAMPLES = [
  { name: 'Boulevard', url: 'samples/boulevard.jpg' },
  { name: 'Pier', url: 'samples/pier.jpg' },
];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

const state = {
  photos: [null, null, null, null],
  photoNames: ['', '', '', ''],
  panels: defaultPanels('quad', 0),
  layout: 'quad',
  grade: 'neon',
  title: 'NEON SHORE',
  subtitle: 'vice city nights',
  tagline: 'LEONIDA · 2026',
  grain: true,
  vignette: true,
  selected: 0,
};

let undoStack = [];
let redoStack = [];
let fontsReady = false;

function snapshot() {
  return JSON.stringify({
    panels: state.panels, layout: state.layout, grade: state.grade,
    title: state.title, subtitle: state.subtitle, tagline: state.tagline,
    grain: state.grain, vignette: state.vignette,
    photoSlots: state.panels.map((p) => p.photo),
  });
}

function pushHistory() {
  undoStack.push(snapshot());
  if (undoStack.length > 60) undoStack.shift();
  redoStack = [];
  syncUndoButtons();
}

function applySnapshot(json) {
  const s = JSON.parse(json);
  state.panels = s.panels;
  state.layout = s.layout;
  state.grade = s.grade;
  state.title = s.title; state.subtitle = s.subtitle; state.tagline = s.tagline;
  state.grain = s.grain; state.vignette = s.vignette;
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  taglineInput.value = state.tagline;
  document.getElementById('grain').checked = state.grain;
  document.getElementById('vignette').checked = state.vignette;
  syncPickers();
  syncPanelControls();
  redraw();
}

function syncUndoButtons() {
  document.getElementById('undoBtn').disabled = undoStack.length === 0;
  document.getElementById('redoBtn').disabled = redoStack.length === 0;
}

function redraw() {
  if (!fontsReady) return;
  drawCover(canvas, state);
}

function fitPreviewToSize() {
  const [w, h] = SIZES[sizeSelect.value];
  canvas.width = w;
  canvas.height = h;
  canvas.classList.toggle('square', w === h);
  canvas.classList.toggle('portrait', h > w);
  redraw();
}

/** Rebuilds the four photo slots (thumbnails + file inputs). */
function renderSlots() {
  const slots = document.getElementById('slots');
  slots.innerHTML = '';
  state.photos.forEach((img, i) => {
    const slot = document.createElement('label');
    slot.className = `slot${img ? '' : ' empty'}`;
    if (img) {
      const thumb = document.createElement('img');
      thumb.src = img.src;
      thumb.alt = state.photoNames[i] || `Photo ${i + 1}`;
      slot.appendChild(thumb);
      const name = document.createElement('span');
      name.className = 'slot-name';
      name.textContent = state.photoNames[i] || `Photo ${i + 1}`;
      slot.appendChild(name);
    } else {
      slot.textContent = `+ Photo ${i + 1}`;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await setPhoto(i, URL.createObjectURL(file), file.name);
    });
    slot.appendChild(input);
    slots.appendChild(slot);
  });
}

/** Smart framing: a photo in a panel that crops it vertically starts panned
 * so its face zone shows, via cover.js smartDy. */
function smartFrame(img, panelIndex) {
  const { panels } = layoutPanels(state.layout, canvas.width, canvas.height);
  const rect = panels[panelIndex];
  const panel = state.panels[panelIndex];
  panel.dy = rect ? smartDy(img, rect) : 0;
  panel.dx = 0;
  panel.zoom = 1;
}

async function setPhoto(i, url, name) {
  const img = await loadImage(url);
  state.photos[i] = img;
  state.photoNames[i] = name;
  if (!state.panels.some((p) => p.photo === i)) {
    state.panels[state.selected].photo = i;
    smartFrame(img, state.selected);
  }
  pushHistory();
  renderSlots();
  syncPanelControls();
  redraw();
}

async function loadSamples() {
  for (let i = 0; i < SAMPLES.length; i++) {
    state.photos[i] = await loadImage(SAMPLES[i].url);
    state.photoNames[i] = SAMPLES[i].name;
  }
  state.panels = defaultPanels(state.layout, 2);
  state.panels.forEach((panel, i) => {
    const img = panel.photo >= 0 ? state.photos[panel.photo] : null;
    if (img) smartFrame(img, i);
  });
  pushHistory();
  renderSlots();
  syncPanelControls();
  redraw();
}

function fillAllWithFirst() {
  const first = state.panels.find((p) => p.photo >= 0);
  if (!first) { status.textContent = 'Add a photo first.'; return; }
  state.panels.forEach((p) => { p.photo = first.photo; p.zoom = 1; p.dx = 0; p.dy = 0; });
  pushHistory();
  syncPanelControls();
  redraw();
  status.textContent = 'Every panel now uses the same photo.';
}

function syncPickers() {
  document.querySelectorAll('#layoutPick .btn').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.value === state.layout));
  });
  document.querySelectorAll('#gradePick .btn').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.value === state.grade));
  });
}

function buildPickers() {
  const layoutPick = document.getElementById('layoutPick');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.dataset.value = l.id;
    b.textContent = l.label;
    b.addEventListener('click', () => {
      state.layout = l.id;
      state.panels = defaultPanels(l.id, state.photos.filter(Boolean).length);
      state.selected = 0;
      pushHistory();
      syncPickers();
      syncPanelControls();
      redraw();
    });
    layoutPick.appendChild(b);
  });
  const gradePick = document.getElementById('gradePick');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.dataset.value = g.id;
    const dot = document.createElement('span');
    dot.className = 'dot';
    dot.style.background = `linear-gradient(135deg, ${g.swatch.join(', ')})`;
    b.appendChild(dot);
    b.appendChild(document.createTextNode(g.label));
    b.addEventListener('click', () => {
      state.grade = g.id;
      pushHistory();
      syncPickers();
      redraw();
    });
    gradePick.appendChild(b);
  });
  syncPickers();
}

function syncPanelControls() {
  const n = layoutById(state.layout).panels;
  if (state.selected >= n) state.selected = 0;
  const panel = state.panels[state.selected];
  panelHint.textContent = `Panel ${state.selected + 1} of ${n} — drag on the cover to move its photo.`;
  panelPhotoSelect.innerHTML = '';
  const none = document.createElement('option');
  none.value = '-1';
  none.textContent = 'Empty';
  panelPhotoSelect.appendChild(none);
  state.photos.forEach((img, i) => {
    if (!img) return;
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = state.photoNames[i] || `Photo ${i + 1}`;
    panelPhotoSelect.appendChild(opt);
  });
  panelPhotoSelect.value = String(panel.photo);
  panelZoom.value = String(panel.zoom);
}

panelPhotoSelect.addEventListener('change', () => {
  state.panels[state.selected].photo = Number(panelPhotoSelect.value);
  pushHistory();
  redraw();
});
panelZoom.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(panelZoom.value);
  redraw();
});
panelZoom.addEventListener('change', pushHistory);
document.getElementById('panelReset').addEventListener('click', () => {
  const p = state.panels[state.selected];
  p.zoom = 1; p.dx = 0; p.dy = 0;
  pushHistory();
  syncPanelControls();
  redraw();
});
document.getElementById('undoBtn').addEventListener('click', () => {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  applySnapshot(undoStack.pop());
  syncUndoButtons();
});
document.getElementById('redoBtn').addEventListener('click', () => {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  applySnapshot(redoStack.pop());
  syncUndoButtons();
});

let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const idx = panelAt(state, p.x, p.y, canvas.width, canvas.height);
  if (idx < 0) return;
  state.selected = idx;
  syncPanelControls();
  canvas.setPointerCapture(e.pointerId);
  drag = { x: p.x, y: p.y, panel: { ...state.panels[idx] } };
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const panel = state.panels[state.selected];
  const rectW = canvas.width;
  const rectH = canvas.height;
  panel.dx = drag.panel.dx + (p.x - drag.x) / rectW;
  panel.dy = drag.panel.dy + (p.y - drag.y) / rectH;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (drag) { pushHistory(); drag = null; }
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  const next = Math.min(3, Math.max(1, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.93)));
  panel.zoom = next;
  panelZoom.value = String(next);
  redraw();
}, { passive: false });

titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; redraw(); });
titleInput.addEventListener('change', pushHistory);
subtitleInput.addEventListener('change', pushHistory);
taglineInput.addEventListener('change', pushHistory);
document.getElementById('grain').addEventListener('change', (e) => {
  state.grain = e.target.checked; pushHistory(); redraw();
});
document.getElementById('vignette').addEventListener('change', (e) => {
  state.vignette = e.target.checked; pushHistory(); redraw();
});
sizeSelect.addEventListener('change', () => { fitPreviewToSize(); status.textContent = ''; });
document.getElementById('samplePhotos').addEventListener('click', loadSamples);
document.getElementById('fillAll').addEventListener('click', fillAllWithFirst);

document.getElementById('export').addEventListener('click', () => {
  const [w, h] = SIZES[sizeSelect.value];
  const out = renderCover(state, w, h);
  out.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved vice-coast-${w}x${h}.png`;
  }, 'image/png');
});

async function init() {
  buildPickers();
  renderSlots();
  syncPanelControls();
  syncUndoButtons();
  fitPreviewToSize();
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('20px Pacifico'),
      document.fonts.ready,
    ]);
  } catch { /* fall back to system fonts */ }
  fontsReady = true;
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), state, { loadImage, loadSamples, redraw, fitPreviewToSize, renderSlots, syncPickers, syncPanelControls });
  } else {
    redraw();
  }
}

init();
