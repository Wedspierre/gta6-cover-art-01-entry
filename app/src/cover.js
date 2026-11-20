// Vice Cover Studio — cover renderer.
//
// drawCover(canvas, state) paints one poster: the chosen multi-panel layout,
// a colour grade washed over every panel, and the poster's lettering (a heavy
// gradient title, a script subtitle, a small tracked-out tagline). Panels are
// described by panelGeometry(layout, width, height); each panel carries the
// photo it shows plus a pan offset and a zoom, so the editor can move a photo
// inside its frame without touching the others.

export const LAYOUTS = [
  { id: 'grid4', label: 'Four panels', panels: 4 },
  { id: 'hero', label: 'Hero + three', panels: 4 },
  { id: 'full', label: 'One photo', panels: 1 },
  { id: 'grid9', label: 'Nine panels', panels: 9 },
  { id: 'snapshots', label: 'Tilted snapshots', panels: 4 },
];

export const GRADES = [
  { id: 'sunset', label: 'Vice sunset', filter: 'saturate(1.3) contrast(1.06)', wash: ['rgba(255, 176, 92, 0.16)', 'rgba(255, 64, 138, 0.30)'] },
  { id: 'neon', label: 'Neon nights', filter: 'saturate(1.65) contrast(1.12)', wash: ['rgba(0, 229, 255, 0.22)', 'rgba(255, 0, 168, 0.28)'] },
  { id: 'golden', label: 'Golden hour', filter: 'sepia(0.35) saturate(1.35) contrast(1.04)', wash: ['rgba(255, 214, 110, 0.22)', 'rgba(214, 120, 20, 0.26)'] },
  { id: 'teal', label: 'Teal dawn', filter: 'saturate(1.15) contrast(1.05)', wash: ['rgba(64, 224, 208, 0.20)', 'rgba(8, 64, 96, 0.30)'] },
  { id: 'pink', label: 'Hot pink', filter: 'saturate(1.55) contrast(1.08)', wash: ['rgba(255, 120, 200, 0.24)', 'rgba(190, 0, 120, 0.30)'] },
  { id: 'noir', label: 'Noir', filter: 'grayscale(1) contrast(1.22) brightness(1.04)', wash: ['rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.28)'] },
];

export const SIZES = [
  { id: 'square', label: 'Square 1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Portrait 1080 × 1350', w: 1080, h: 1350 },
  { id: 'landscape', label: 'Landscape 1920 × 1080', w: 1920, h: 1080 },
];

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

// Panel rectangles as fractions of the cover, plus an optional tilt in
// degrees for the snapshots layout. x/y/w/h are fractions of width/height.
export function panelGeometry(layout, w, h) {
  const gap = Math.max(4, Math.round(Math.min(w, h) * 0.008));
  const g = gap;
  const full = (x, y, pw, ph, rot = 0) => ({ x, y, w: pw, h: ph, rot });
  switch (layout) {
    case 'hero': {
      const bigW = Math.round(w * 0.62);
      const smallW = w - bigW - g;
      const smallH = Math.round((h - 2 * g) / 3);
      return [
        full(0, 0, bigW, h),
        full(bigW + g, 0, smallW, smallH),
        full(bigW + g, smallH + g, smallW, smallH),
        full(bigW + g, 2 * (smallH + g), smallW, h - 2 * (smallH + g)),
      ];
    }
    case 'full':
      return [full(0, 0, w, h)];
    case 'grid9': {
      const cw = Math.round((w - 2 * g) / 3);
      const ch = Math.round((h - 2 * g) / 3);
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push(full(c * (cw + g), r * (ch + g), cw, r === 2 ? h - 2 * (ch + g) : ch));
        }
      }
      return out;
    }
    case 'snapshots': {
      const pw = Math.round(w * 0.52);
      const ph = Math.round(h * 0.42);
      return [
        full(Math.round(w * 0.04), Math.round(h * 0.05), pw, ph, -7),
        full(Math.round(w * 0.44), Math.round(h * 0.03), pw, ph, 6),
        full(Math.round(w * 0.06), Math.round(h * 0.50), pw, ph, 5),
        full(Math.round(w * 0.42), Math.round(h * 0.53), pw, ph, -5),
      ];
    }
    case 'grid4':
    default: {
      const cw = Math.round((w - g) / 2);
      const ch = Math.round((h - g) / 2);
      return [
        full(0, 0, cw, ch),
        full(cw + g, 0, w - cw - g, ch),
        full(0, ch + g, cw, h - ch - g),
        full(cw + g, ch + g, w - cw - g, h - ch - g),
      ];
    }
  }
}

function drawPhotoInto(ctx, photo, rect, panel, grade) {
  if (!photo) return;
  const iw = photo.naturalWidth || photo.width;
  const ih = photo.naturalHeight || photo.height;
  const base = Math.max(rect.w / iw, rect.h / ih) * panel.zoom;
  const dw = iw * base;
  const dh = ih * base;
  const dx = rect.x + (rect.w - dw) / 2 + panel.ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + panel.oy * rect.h;
  ctx.save();
  ctx.filter = grade.filter;
  ctx.drawImage(photo, dx, dy, dw, dh);
  ctx.restore();
}

function washPanel(ctx, rect, grade) {
  const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(1, grade.wash[1]);
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const shade = ctx.createLinearGradient(rect.x, rect.y + rect.h * 0.55, rect.x, rect.y + rect.h);
  shade.addColorStop(0, 'rgba(10, 4, 24, 0)');
  shade.addColorStop(1, 'rgba(10, 4, 24, 0.28)');
  ctx.fillStyle = shade;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
}

// Fit a font size so `text` spans at most `maxWidth` at `family`/`weight`.
function fittedFont(ctx, text, startSize, maxWidth, family, weight) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 14 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

function drawLettering(ctx, w, h, state) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const tagline = (state.tagline || '').trim().toUpperCase();
  const pad = Math.round(w * 0.045);

  if (tagline) {
    const size = Math.round(Math.min(w, h) * 0.021);
    ctx.font = `400 ${size}px Anton, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(size * 0.35)}px`; } catch { /* older canvas */ }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = Math.round(size * 0.5);
    ctx.fillText(tagline, pad, Math.round(h * 0.055));
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }

  // A soft dark shelf behind the title so it reads over any photo.
  const shelfH = Math.round(h * 0.20);
  const shelf = ctx.createLinearGradient(0, h - shelfH, 0, h);
  shelf.addColorStop(0, 'rgba(12, 4, 26, 0)');
  shelf.addColorStop(1, 'rgba(12, 4, 26, 0.62)');
  ctx.fillStyle = shelf;
  ctx.fillRect(0, h - shelfH, w, shelfH);

  // Measure the title first so the script subtitle can sit just above it
  // instead of colliding with its cap height.
  const titleSize = title
    ? fittedFont(ctx, title, Math.round(Math.min(w, h) * 0.12), w * 0.92, 'Anton, sans-serif', '400')
    : 0;
  const titleY = h - Math.round(h * 0.045);

  if (subtitle) {
    const size = fittedFont(ctx, subtitle, Math.round(Math.min(w, h) * 0.062), w * 0.86, 'Pacifico, cursive', '400');
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffd9ec';
    ctx.shadowColor = 'rgba(20, 0, 30, 0.8)';
    ctx.shadowBlur = Math.round(size * 0.25);
    ctx.fillText(subtitle, pad, titleY - titleSize - Math.round(size * 0.35));
    ctx.shadowBlur = 0;
  }

  if (title) {
    const size = titleSize;
    const y = titleY;
    ctx.font = `400 ${size}px Anton, sans-serif`;
    const grad = ctx.createLinearGradient(pad, y - size, pad, y);
    grad.addColorStop(0, '#ffe259');
    grad.addColorStop(0.45, '#ff7e3d');
    grad.addColorStop(0.75, '#ff3d81');
    grad.addColorStop(1, '#c724b1');
    ctx.textAlign = 'left';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#160a24';
    ctx.lineWidth = Math.max(2, Math.round(size / 13));
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = Math.round(size * 0.14);
    ctx.shadowOffsetY = Math.round(size * 0.04);
    ctx.strokeText(title, pad, y);
    ctx.fillStyle = grad;
    ctx.fillText(title, pad, y);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
}

// Paints the whole poster onto `canvas` at its own pixel size.
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = gradeById(state.grade);
  const layout = LAYOUTS.find((l) => l.id === state.layout) ?? LAYOUTS[0];
  const rects = panelGeometry(state.layout, w, h);

  ctx.save();
  ctx.fillStyle = '#160a24';
  ctx.fillRect(0, 0, w, h);

  const frame = Math.max(3, Math.round(Math.min(w, h) * 0.007));
  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? { photo: 0, ox: 0, oy: 0, zoom: 1 };
    const photo = state.photos[panel.photo] ?? null;
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.rot * Math.PI) / 180);
      ctx.translate(-rect.w / 2, -rect.h / 2);
    } else {
      ctx.translate(rect.x, rect.y);
    }
    const local = { x: 0, y: 0, w: rect.w, h: rect.h };
    ctx.beginPath();
    ctx.rect(0, 0, rect.w, rect.h);
    ctx.clip();
    if (photo) {
      drawPhotoInto(ctx, photo, local, panel, grade);
    } else {
      const empty = ctx.createLinearGradient(0, 0, rect.w, rect.h);
      empty.addColorStop(0, '#3a1c5e');
      empty.addColorStop(1, '#12081f');
      ctx.fillStyle = empty;
      ctx.fillRect(0, 0, rect.w, rect.h);
    }
    washPanel(ctx, local, grade);
    ctx.restore();

    // White poster frame around each panel.
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
      ctx.rotate((rect.rot * Math.PI) / 180);
      ctx.translate(-rect.w / 2, -rect.h / 2);
    } else {
      ctx.translate(rect.x, rect.y);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = frame;
    ctx.strokeRect(0, 0, rect.w, rect.h);
    ctx.restore();
  });
  ctx.restore();

  drawLettering(ctx, w, h, state);
}

// Hit-test a point (canvas pixels) against the layout: returns the panel
// index whose (possibly tilted) rectangle holds it, or -1.
export function panelAt(layout, w, h, px, py) {
  const rects = panelGeometry(layout, w, h);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    let lx = px;
    let ly = py;
    if (r.rot) {
      const rad = (-r.rot * Math.PI) / 180;
      const cx = r.x + r.w / 2;
      const cy = r.y + r.h / 2;
      const dx = px - cx;
      const dy = py - cy;
      lx = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
      ly = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
    }
    if (lx >= r.x && lx <= r.x + r.w && ly >= r.y && ly <= r.y + r.h) return i;
  }
  return -1;
}
