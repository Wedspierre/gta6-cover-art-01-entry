// Vice Cover Studio — the editor.
//
// Owns the poster state (size, layout, grade, lettering, up to four photos
// and one pan/zoom per panel), the undo stack, and every control on the page:
// picking photos, choosing a layout or grade, editing the words, clicking a
// panel to select it, dragging to pan the photo inside it, scrolling or
// sliding to zoom, and exporting the finished poster as a PNG.

import { drawCover, panelAt, panelGeometry, LAYOUTS, GRADES, SIZES, sizeById } from './cover.js';
import { runShot, sceneFromQuery } from './shots.js';

const canvas = document.getElementById('cover');
const statusEl = document.getElementById('status');
const titleInput = document.getElementById('titleText');
const subtitleInput = document.getElementById('subtitleText');
const taglineInput = document.getElementById('taglineText');
const zoomSlider = document.getElementById('zoomSlider');

const PANEL_COUNT = 9;

function freshPanels() {
  return Array.from({ length: PANEL_COUNT }, (_, i) => ({ photo: i % 2, ox: 0, oy: 0, zoom: 1 }));
}

const state = {
  size: 'square',
  layout: 'grid4',
  grade: 'sunset',
  title: 'VICE CITY',
  subtitle: 'Welcome back',
  tagline: 'TWO SIDES OF THE SAME SUNSET',
  photos: [null, null, null, null],
  panels: freshPanels(),
  selected: 0,
};

// --- undo / redo -----------------------------------------------------------

const past = [];
const future = [];

function snapshot() {
  return JSON.stringify({
    size: state.size, layout: state.layout, grade: state.grade,
    title: state.title, subtitle: state.subtitle, tagline: state.tagline,
    panels: state.panels, selected: state.selected,
  });
}

function restore(text) {
  const s = JSON.parse(text);
  state.size = s.size;
  state.layout = s.layout;
  state.grade = s.grade;
  state.title = s.title;
  state.subtitle = s.subtitle;
  state.tagline = s.tagline;
  state.panels = s.panels;
  state.selected = s.selected;
  syncInputs();
}

function commit() {
  past.push(snapshot());
  if (past.length > 60) past.shift();
  future.length = 0;
  syncUndoButtons();
}

function undo() {
  if (!past.length) return;
  future.push(snapshot());
  restore(past.pop());
  redraw();
  syncUndoButtons();
}

function redo() {
  if (!future.length) return;
  past.push(snapshot());
  restore(future.pop());
  redraw();
  syncUndoButtons();
}

function syncUndoButtons() {
  document.getElementById('undoBtn').disabled = past.length === 0;
  document.getElementById('redoBtn').disabled = future.length === 0;
}

// --- images ----------------------------------------------------------------

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function firstEmptySlot() {
  return state.photos.findIndex((p) => !p);
}

async function addPhoto(img) {
  const slot = firstEmptySlot();
  if (slot === -1) {
    statusEl.textContent = 'All four photo slots are full — clear one first.';
    return;
  }
  state.photos[slot] = img;
  renderSlots();
  redraw();
}

async function loadSample(name) {
  const img = await loadImage(`samples/${name}.jpg`);
  await addPhoto(img);
}

// --- drawing ---------------------------------------------------------------

function redraw() {
  const dims = sizeById(state.size);
  if (canvas.width !== dims.w || canvas.height !== dims.h) {
    canvas.width = dims.w;
    canvas.height = dims.h;
  }
  canvas.dataset.aspect = state.size;
  drawCover(canvas, state);
  drawSelection();
  zoomSlider.value = String(state.panels[state.selected].zoom);
}

function drawSelection() {
  if (document.body.classList.contains('shot-cover')) return;
  const rects = panelGeometry(state.layout, canvas.width, canvas.height);
  const rect = rects[state.selected];
  if (!rect) return;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  if (rect.rot) ctx.rotate((rect.rot * Math.PI) / 180);
  ctx.translate(-rect.w / 2, -rect.h / 2);
  ctx.strokeStyle = '#ffe259';
  ctx.lineWidth = Math.max(4, Math.round(Math.min(canvas.width, canvas.height) * 0.008));
  ctx.setLineDash([Math.round(ctx.lineWidth * 4), Math.round(ctx.lineWidth * 2)]);
  ctx.strokeRect(0, 0, rect.w, rect.h);
  ctx.restore();
}

// --- controls --------------------------------------------------------------

function choiceButtons(containerId, items, current, onPick) {
  const box = document.getElementById(containerId);
  box.innerHTML = '';
  items.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = item.label;
    btn.dataset.id = item.id;
    btn.classList.toggle('active', item.id === current);
    btn.addEventListener('click', () => {
      commit();
      onPick(item.id);
      box.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.id === item.id));
      redraw();
    });
    box.appendChild(btn);
  });
}

function buildChoices() {
  choiceButtons('layoutPick', LAYOUTS, state.layout, (id) => { state.layout = id; state.selected = 0; });
  choiceButtons('gradePick', GRADES, state.grade, (id) => { state.grade = id; });
  choiceButtons('sizePick', SIZES, state.size, (id) => { state.size = id; });
}

function renderSlots() {
  const box = document.getElementById('photoSlots');
  box.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'slot-chip';
    chip.textContent = photo ? `Photo ${i + 1}` : `Empty slot ${i + 1}`;
    chip.disabled = !photo;
    chip.addEventListener('click', () => {
      commit();
      state.panels[state.selected].photo = i;
      renderPanelPick();
      redraw();
    });
    box.appendChild(chip);
  });
  renderPanelPick();
}

function renderPanelPick() {
  const box = document.getElementById('panelPhotoPick');
  box.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = `Photo ${i + 1}`;
    btn.disabled = !photo;
    btn.classList.toggle('active', state.panels[state.selected].photo === i);
    btn.addEventListener('click', () => {
      commit();
      state.panels[state.selected].photo = i;
      renderPanelPick();
      redraw();
    });
    box.appendChild(btn);
  });
}

function syncInputs() {
  titleInput.value = state.title;
  subtitleInput.value = state.subtitle;
  taglineInput.value = state.tagline;
  buildChoices();
  renderSlots();
}

function bindText(input, key) {
  input.addEventListener('input', () => {
    state[key] = input.value;
    redraw();
  });
  input.addEventListener('change', () => commit());
}

bindText(titleInput, 'title');
bindText(subtitleInput, 'subtitle');
bindText(taglineInput, 'tagline');

document.getElementById('photoFiles').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    try {
      await addPhoto(await loadImage(URL.createObjectURL(file)));
    } catch {
      statusEl.textContent = 'That file could not be read as a photo.';
    }
  }
  e.target.value = '';
});

document.getElementById('sampleBoulevard').addEventListener('click', () => loadSample('boulevard'));
document.getElementById('samplePier').addEventListener('click', () => loadSample('pier'));
document.getElementById('clearPhotos').addEventListener('click', () => {
  commit();
  state.photos = [null, null, null, null];
  state.panels = freshPanels();
  renderSlots();
  redraw();
});

zoomSlider.addEventListener('input', () => {
  state.panels[state.selected].zoom = Number(zoomSlider.value);
  redraw();
});
zoomSlider.addEventListener('change', () => commit());

document.getElementById('fillPanel').addEventListener('click', () => {
  commit();
  const p = state.panels[state.selected];
  p.zoom = 1;
  p.ox = 0;
  p.oy = 0;
  redraw();
});
document.getElementById('centrePanel').addEventListener('click', () => {
  commit();
  const p = state.panels[state.selected];
  p.ox = 0;
  p.oy = 0;
  redraw();
});
document.getElementById('undoBtn').addEventListener('click', undo);
document.getElementById('redoBtn').addEventListener('click', redo);

// --- pointer editing on the preview ---------------------------------------

let dragging = false;
let dragSnapshot = null;
let lastX = 0;
let lastY = 0;
let wheelSnapshot = null;
let wheelTimer = 0;

function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) / r.width) * canvas.width,
    y: ((e.clientY - r.top) / r.height) * canvas.height,
  };
}

canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const hit = panelAt(state.layout, canvas.width, canvas.height, p.x, p.y);
  if (hit === -1) return;
  dragSnapshot = snapshot();
  state.selected = hit;
  dragging = true;
  lastX = p.x;
  lastY = p.y;
  canvas.setPointerCapture(e.pointerId);
  renderPanelPick();
  redraw();
});

canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const p = canvasPoint(e);
  const rects = panelGeometry(state.layout, canvas.width, canvas.height);
  const rect = rects[state.selected];
  const panel = state.panels[state.selected];
  panel.ox = Math.max(-0.6, Math.min(0.6, panel.ox + (p.x - lastX) / rect.w));
  panel.oy = Math.max(-0.6, Math.min(0.6, panel.oy + (p.y - lastY) / rect.h));
  lastX = p.x;
  lastY = p.y;
  redraw();
});

function endDrag() {
  if (!dragging) return;
  dragging = false;
  if (dragSnapshot) {
    past.push(dragSnapshot);
    if (past.length > 60) past.shift();
    future.length = 0;
    dragSnapshot = null;
    syncUndoButtons();
  }
}

canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (!wheelSnapshot) wheelSnapshot = snapshot();
  const panel = state.panels[state.selected];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * Math.exp(-e.deltaY * 0.0012)));
  redraw();
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => {
    if (wheelSnapshot) {
      past.push(wheelSnapshot);
      if (past.length > 60) past.shift();
      future.length = 0;
      wheelSnapshot = null;
      syncUndoButtons();
    }
  }, 350);
}, { passive: false });

// --- export ------------------------------------------------------------------

document.getElementById('exportBtn').addEventListener('click', () => {
  const dims = sizeById(state.size);
  const off = document.createElement('canvas');
  off.width = dims.w;
  off.height = dims.h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) {
      statusEl.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${dims.w}x${dims.h}.png`;
    a.click();
    statusEl.textContent = `Saved vice-cover-${dims.w}x${dims.h}.png`;
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, 'image/png');
});

// --- start -------------------------------------------------------------------

buildChoices();
renderSlots();
syncUndoButtons();

const query = new URLSearchParams(location.search);
if (query.get('shot')) {
  const scene = sceneFromQuery(query);
  runShot(scene, loadImage, (applied, loaded) => {
    state.size = applied.size;
    state.layout = applied.layout;
    state.grade = applied.grade;
    state.title = applied.title;
    state.subtitle = applied.subtitle;
    state.tagline = applied.tagline;
    state.photos = [null, null, null, null];
    loaded.forEach((img, i) => { state.photos[i] = img; });
    state.panels = freshPanels();
    state.panels.forEach((p, i) => { p.photo = i % Math.max(1, loaded.filter(Boolean).length); });
    state.selected = 0;
    syncInputs();
    redraw();
  });
} else {
  Promise.all([
    document.fonts.load('400 100px Anton'),
    document.fonts.load('400 100px Pacifico'),
  ]).catch(() => {}).finally(() => redraw());
  redraw();
}
