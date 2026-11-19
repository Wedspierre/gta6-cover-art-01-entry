// Vice Coast Cover Studio — the cover renderer. One function, renderCover,
// draws the whole poster at any size from a plain state object, so the live
// preview and the exported PNG are the same drawing at different sizes.
// No Rockstar logo, artwork or font anywhere: the lettering is Anton (bold
// condensed caps) with a Pacifico neon script subtitle, both SIL OFL.

export const GRADES = [
  { id: 'sunset', label: 'Vice Sunset', swatch: ['#ffd166', '#ff5e78', '#b537f2'],
    filter: 'saturate(1.35) contrast(1.08) brightness(1.02)',
    overlayTop: 'rgba(255,120,60,0.16)', overlayBottom: 'rgba(255,40,140,0.34)', blend: 'overlay',
    title: ['#ffd166', '#ff5e78', '#b537f2'], sub: '#2ee6c8' },
  { id: 'neon', label: 'Neon Nights', swatch: ['#ff2ea6', '#7b2ff7', '#00e5ff'],
    filter: 'saturate(1.5) contrast(1.15)',
    overlayTop: 'rgba(255,46,166,0.28)', overlayBottom: 'rgba(0,229,255,0.30)', blend: 'soft-light',
    title: ['#ff2ea6', '#ff8ad8', '#00e5ff'], sub: '#ffe66d' },
  { id: 'golden', label: 'Golden Hour', swatch: ['#fff3b0', '#ffb703', '#fb8500'],
    filter: 'sepia(0.25) saturate(1.3) contrast(1.05)',
    overlayTop: 'rgba(255,190,60,0.20)', overlayBottom: 'rgba(251,133,0,0.30)', blend: 'overlay',
    title: ['#fff3b0', '#ffb703', '#fb8500'], sub: '#ff5e78' },
  { id: 'teal', label: 'Teal Dawn', swatch: ['#caf0f8', '#48cae4', '#0077b6'],
    filter: 'saturate(1.15) contrast(1.1) hue-rotate(-8deg)',
    overlayTop: 'rgba(72,202,228,0.22)', overlayBottom: 'rgba(0,119,182,0.32)', blend: 'soft-light',
    title: ['#caf0f8', '#90e0ef', '#0077b6'], sub: '#ffb703' },
  { id: 'pink', label: 'Hot Pink', swatch: ['#ffc2d1', '#ff4d6d', '#c9184a'],
    filter: 'saturate(1.6) contrast(1.1)',
    overlayTop: 'rgba(255,77,109,0.26)', overlayBottom: 'rgba(201,24,74,0.34)', blend: 'soft-light',
    title: ['#ffc2d1', '#ff4d6d', '#c9184a'], sub: '#2ee6c8' },
  { id: 'noir', label: 'Noir', swatch: ['#ffffff', '#d9d9d9', '#4a4e69'],
    filter: 'grayscale(1) contrast(1.25)',
    overlayTop: 'rgba(255,255,255,0.06)', overlayBottom: 'rgba(0,0,0,0.30)', blend: 'overlay',
    title: ['#ffffff', '#e5e5e5', '#8d99ae'], sub: '#ff5e78' },
];

export const LAYOUTS = [
  { id: 'quad', label: 'Quad · 2 × 2', panels: 4 },
  { id: 'hero', label: 'Hero + 3', panels: 4 },
  { id: 'fullbleed', label: 'Full Bleed', panels: 1 },
  { id: 'nine', label: 'Nine · 3 × 3', panels: 9 },
  { id: 'tilted', label: 'Tilted Snapshots', panels: 3 },
];

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

/** Panel rectangles (and the title band) for a layout at cover size w×h. */
export function layoutPanels(layoutId, w, h) {
  const g = Math.max(5, Math.round(w * 0.008));
  const bandH = Math.round(h * (layoutId === 'tilted' ? 0.22 : 0.24));
  const band = { x: 0, y: h - bandH, w, h: bandH };
  const areaH = h - bandH;
  const grid = (cols, rows, x0, y0, aw, ah) => {
    const out = [];
    const cw = (aw - g * (cols - 1)) / cols;
    const ch = (ah - g * (rows - 1)) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        out.push({ x: x0 + c * (cw + g), y: y0 + r * (ch + g), w: cw, h: ch, rot: 0 });
      }
    }
    return out;
  };
  switch (layoutId) {
    case 'hero': {
      const heroW = w * 0.6 - g / 2;
      const sideX = w * 0.6 + g / 2;
      const sideW = w - sideX;
      const panels = [{ x: 0, y: 0, w: heroW, h: areaH, rot: 0 }];
      const ch = (areaH - 2 * g) / 3;
      for (let i = 0; i < 3; i++) {
        panels.push({ x: sideX, y: i * (ch + g), w: sideW, h: ch, rot: 0 });
      }
      return { panels, band };
    }
    case 'fullbleed':
      return { panels: [{ x: 0, y: 0, w, h, rot: 0 }], band: null };
    case 'nine':
      return { panels: grid(3, 3, 0, 0, w, areaH), band };
    case 'tilted': {
      const b = Math.round(w * 0.012);
      return {
        panels: [
          { x: w * 0.06, y: h * 0.05, w: w * 0.52, h: areaH * 0.60, rot: -3, border: b },
          { x: w * 0.55, y: h * 0.03, w: w * 0.38, h: areaH * 0.44, rot: 4, border: b },
          { x: w * 0.42, y: h * 0.50, w: w * 0.50, h: areaH * 0.40, rot: -2, border: b },
        ],
        band,
      };
    }
    case 'quad':
    default:
      return { panels: grid(2, 2, 0, 0, w, areaH), band };
  }
}

/** A fresh per-panel photo assignment: photos deal round-robin across panels. */
export function defaultPanels(layoutId, photoCount) {
  const n = layoutById(layoutId).panels;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ photo: photoCount ? i % photoCount : -1, zoom: 1, dx: 0, dy: 0 });
  }
  return out;
}

let noiseCanvas = null;
function grainPattern(ctx) {
  if (!noiseCanvas) {
    noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 128;
    noiseCanvas.height = 128;
    const nctx = noiseCanvas.getContext('2d');
    const data = nctx.createImageData(128, 128);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = Math.floor(Math.random() * 256);
      data.data[i] = v; data.data[i + 1] = v; data.data[i + 2] = v; data.data[i + 3] = 255;
    }
    nctx.putImageData(data, 0, 0);
  }
  return ctx.createPattern(noiseCanvas, 'repeat');
}

function fitFont(ctx, text, font, startSize, maxWidth) {
  let size = startSize;
  ctx.font = font(size);
  while (size > 10 && ctx.measureText(text).width > maxWidth) {
    size -= Math.max(1, Math.round(size * 0.04));
    ctx.font = font(size);
  }
  return size;
}

/** Pan for a photo in a panel so the face zone (top fifth of the photo) lands
 * near the top third of the panel, when the panel crops the photo vertically.
 * Returns the dy (fraction of panel height) to use; 0 when no crop happens. */
export function smartDy(img, rect) {
  const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const dh = img.naturalHeight * scale;
  if (dh <= rect.h) return 0;
  const top0 = (rect.h - dh) / 2;
  const dy = (rect.h * 0.30 - img.naturalHeight * 0.20 * scale - top0) / rect.h;
  return Math.min(Math.max(dy, 0), (dh - rect.h) / rect.h);
}

/** Draws one photo into one panel rect, honouring its zoom and pan. */
export function drawPhotoPanel(ctx, img, rect, panel, grade) {
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  if (rect.rot) ctx.rotate((rect.rot * Math.PI) / 180);
  ctx.translate(-rect.w / 2, -rect.h / 2);
  const border = rect.border ?? 0;
  if (border) {
    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(-border, -border, rect.w + 2 * border, rect.h + 2 * border);
    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(-border, rect.h, rect.w + 2 * border, border * 3.2);
  }
  ctx.beginPath();
  ctx.rect(0, 0, rect.w, rect.h);
  ctx.clip();
  if (img) {
    const scale = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight) * panel.zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.filter = grade.filter;
    ctx.drawImage(img, (rect.w - dw) / 2 + panel.dx * rect.w, (rect.h - dh) / 2 + panel.dy * rect.h, dw, dh);
    ctx.filter = 'none';
  } else {
    const ph = ctx.createLinearGradient(0, 0, rect.w, rect.h);
    ph.addColorStop(0, '#3d2350');
    ph.addColorStop(1, '#1c0f2a');
    ctx.fillStyle = ph;
    ctx.fillRect(0, 0, rect.w, rect.h);
    ctx.fillStyle = 'rgba(245,238,247,0.55)';
    ctx.font = `600 ${Math.round(rect.h * 0.055)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', rect.w / 2, rect.h / 2);
  }
  const over = ctx.createLinearGradient(0, 0, 0, rect.h);
  over.addColorStop(0, grade.overlayTop);
  over.addColorStop(1, grade.overlayBottom);
  ctx.globalCompositeOperation = grade.blend;
  ctx.fillStyle = over;
  ctx.fillRect(0, 0, rect.w, rect.h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  if (!border) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(2, rect.w * 0.004);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }
}

/** Draws the title band (or the bottom scrim for full bleed). */
export function drawTitleBlock(ctx, state, grade, w, h, band) {
  const bandY = band ? band.y : h * 0.62;
  const bandH = band ? band.h : h * 0.38;
  if (band) {
    const bg = ctx.createLinearGradient(0, bandY, 0, h);
    bg.addColorStop(0, '#200d31');
    bg.addColorStop(1, '#12081c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, bandY, w, bandH);
    const edge = ctx.createLinearGradient(0, 0, w, 0);
    edge.addColorStop(0, '#ffd166');
    edge.addColorStop(0.45, '#ff5e78');
    edge.addColorStop(0.8, '#b537f2');
    edge.addColorStop(1, '#2ee6c8');
    ctx.fillStyle = edge;
    ctx.fillRect(0, bandY, w, Math.max(3, h * 0.004));
  } else {
    const scrim = ctx.createLinearGradient(0, bandY, 0, h);
    scrim.addColorStop(0, 'rgba(18,8,28,0)');
    scrim.addColorStop(1, 'rgba(18,8,28,0.88)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, bandY, w, h - bandY);
  }

  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const tagline = (state.tagline || '').trim().toUpperCase();
  const cx = w * 0.045;

  if (subtitle) {
    // The script subtitle sits inside the title band, above the title, so it
    // never collides with the title or with a photo.
    ctx.save();
    ctx.translate(w * 0.955, bandY + bandH * 0.22);
    ctx.rotate((-2 * Math.PI) / 180);
    const subSize = fitFont(ctx, subtitle, (s) => `${s}px Pacifico, cursive`, bandH * 0.24, w * 0.5);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.textAlign = 'right';
    ctx.fillStyle = grade.sub;
    ctx.shadowColor = grade.sub;
    ctx.shadowBlur = subSize * 0.45;
    ctx.fillText(subtitle, 0, 0);
    ctx.restore();
  }

  if (title) {
    ctx.save();
    ctx.translate(cx, bandY + bandH * 0.82);
    ctx.rotate((-1.2 * Math.PI) / 180);
    const size = fitFont(ctx, title, (s) => `${s}px Anton, sans-serif`, bandH * 0.50, w * 0.92);
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.textAlign = 'left';
    try { ctx.letterSpacing = `${Math.round(size * 0.02)}px`; } catch { /* older canvas */ }
    const grad = ctx.createLinearGradient(0, -size * 0.8, 0, size * 0.15);
    grad.addColorStop(0, grade.title[0]);
    grad.addColorStop(0.55, grade.title[1]);
    grad.addColorStop(1, grade.title[2]);
    ctx.lineWidth = Math.max(2, size * 0.055);
    ctx.strokeStyle = 'rgba(24,6,36,0.9)';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.12;
    ctx.shadowOffsetY = size * 0.03;
    ctx.strokeText(title, 0, 0);
    ctx.fillStyle = grad;
    ctx.fillText(title, 0, 0);
    ctx.restore();
  }

  if (tagline) {
    ctx.save();
    ctx.font = `600 ${Math.max(11, Math.round(bandH * 0.11))}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.max(2, Math.round(bandH * 0.03))}px`; } catch { /* older canvas */ }
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(245,238,247,0.75)';
    ctx.fillText(tagline, w * 0.955, bandY + bandH * 0.93);
    ctx.restore();
  }
}

/** Draws the whole cover onto `canvas` at its own size. Returns the canvas. */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = gradeById(state.grade);
  const { panels, band } = layoutPanels(state.layout, w, h);

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#2b1838');
  bg.addColorStop(1, '#12081c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  panels.forEach((rect, i) => {
    const panel = state.panels[i] ?? { photo: -1, zoom: 1, dx: 0, dy: 0 };
    const img = panel.photo >= 0 ? state.photos[panel.photo] : null;
    drawPhotoPanel(ctx, img, rect, panel, grade);
  });

  drawTitleBlock(ctx, state, grade, w, h, band);

  if (state.vignette) {
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.42, w / 2, h / 2, Math.max(w, h) * 0.75);
    vg.addColorStop(0, 'rgba(10,0,20,0)');
    vg.addColorStop(1, 'rgba(10,0,20,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = grainPattern(ctx);
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
  return canvas;
}

/** Renders the cover at an export size and returns a fresh canvas. */
export function renderCover(state, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return drawCover(canvas, state);
}

/** Which panel (index) sits under cover pixel (px, py), or -1. Rotation ignored. */
export function panelAt(state, px, py, w, h) {
  const { panels } = layoutPanels(state.layout, w, h);
  for (let i = panels.length - 1; i >= 0; i--) {
    const r = panels[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}
