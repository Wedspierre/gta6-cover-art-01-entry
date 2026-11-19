// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample
// photo loaded; ?shot=cover shows the exported cover alone, drawn by the
// app itself at the requested post size. Query params: layout, grade, size,
// photo (sample name), caption, subtitle, tagline. window.__shotReady is set
// once the scene has painted.
import { SIZES, defaultPanels, layoutPanels, smartDy } from './cover.js';

export async function runShot(shot, query, state, helpers) {
  const { loadImage, redraw, fitPreviewToSize } = helpers;
  const layout = query.get('layout') ?? 'quad';
  const grade = query.get('grade') ?? 'neon';
  const size = query.get('size') ?? '1920x1080';
  const photo = query.get('photo') ?? 'boulevard';
  const caption = query.get('caption') ?? 'NEON SHORE';
  const subtitle = query.get('subtitle') ?? 'vice city nights';
  const tagline = query.get('tagline') ?? 'VICE COAST';

  state.layout = layout;
  state.grade = grade;
  state.title = caption;
  state.subtitle = subtitle;
  state.tagline = tagline;

  const img = await loadImage(`samples/${photo}.jpg`);
  state.photos[0] = img;
  state.photoNames[0] = photo;
  const other = photo === 'boulevard' ? 'pier' : 'boulevard';
  state.photos[1] = await loadImage(`samples/${other}.jpg`);
  state.photoNames[1] = other;
  state.panels = defaultPanels(layout, 2);
  state.selected = 0;

  // Smart framing: a photo cropped vertically by its panel defaults to
  // showing its face zone (cover.js smartDy), unless ?dy= overrides it.
  const dyOverride = query.get('dy');
  const [sw, sh] = SIZES[size] ?? SIZES['1920x1080'];
  const { panels } = layoutPanels(layout, sw, sh);
  state.panels.forEach((panel, i) => {
    const img = panel.photo >= 0 ? state.photos[panel.photo] : null;
    if (!img) return;
    panel.dy = dyOverride !== null ? Number(dyOverride) : smartDy(img, panels[i]);
  });

  // Keep the editor chrome in sync with the scene, so ?shot=editor shows the
  // loaded photos in their slots and the pressed layout / grade buttons.
  const { renderSlots, syncPickers, syncPanelControls } = helpers;
  if (renderSlots) renderSlots();
  if (syncPickers) syncPickers();
  if (syncPanelControls) syncPanelControls();

  document.getElementById('title').value = caption;
  document.getElementById('subtitle').value = subtitle;
  document.getElementById('tagline').value = tagline;
  document.getElementById('size').value = size;

  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const [w, h] = SIZES[size] ?? SIZES['1920x1080'];
    const cover = document.getElementById('cover');
    cover.width = w;
    cover.height = h;
  } else {
    fitPreviewToSize();
  }
  redraw();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
