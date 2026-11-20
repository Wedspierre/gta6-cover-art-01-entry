// Fixed scenes for screenshots, reached through the page URL's query string.
//
//   ?shot=cover&size=landscape&layout=hero&grade=sunset&title=VICE%20CITY
//   ?shot=editor&photos=boulevard,pier&layout=grid4&grade=neon
//
// `shot=cover` hides the controls and paints the poster alone at the export
// size; `shot=editor` shows the full studio with the named sample photos
// loaded. `photos` names files under samples/ (without the extension).
// window.__shotReady is set once the scene is painted, so a headless
// screenshot can wait on it instead of guessing a delay.

export function sceneFromQuery(query) {
  const names = (query.get('photos') || query.get('photo') || 'pier')
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, 4);
  return {
    shot: query.get('shot') || 'editor',
    size: query.get('size') || 'square',
    layout: query.get('layout') || 'grid4',
    grade: query.get('grade') || 'sunset',
    title: query.get('title') ?? 'VICE CITY',
    subtitle: query.get('subtitle') ?? 'Welcome back',
    tagline: query.get('tagline') ?? 'TWO SIDES OF THE SAME SUNSET',
    photos: names,
  };
}

export async function runShot(scene, loadSample, applyState) {
  if (scene.shot === 'cover') document.body.classList.add('shot-cover');
  const loaded = [];
  for (const name of scene.photos) {
    try {
      loaded.push(await loadSample(`samples/${name}.jpg`));
    } catch {
      loaded.push(null);
    }
  }
  applyState(scene, loaded);
  await document.fonts.ready;
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
