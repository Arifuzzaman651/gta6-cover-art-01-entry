// Fixed scenes for screenshots: ?shot=editor shows the page with sample photos loaded;
// ?shot=cover shows the cover alone at 1080 x 1080, ?shot=cover1350 at 1080 x 1350 and
// ?shot=wide at 1920 x 1080. `photo` picks the hero sample, `photo2` the smaller panels,
// `caption` the title, `layout` and `grade` the look. window.__shotReady is set once painted.
export async function runShot(shot, query, state, helpers) {
  const canvas = document.getElementById('cover');
  state.layout = query.get('layout') ?? 'hero3';
  state.grade = query.get('grade') ?? 'sunset';
  state.title = query.get('caption') ?? 'Sunset Heist';
  state.subtitle = query.get('subtitle') ?? 'A neon coast story';
  state.badge = query.get('badge') ?? 'Sunset Edition';

  // Keep the visible controls in step with the scene, so the editor shot reads true.
  document.getElementById('layout').value = state.layout;
  document.getElementById('title').value = state.title;
  document.getElementById('subtitle').value = state.subtitle;
  document.getElementById('badge').value = state.badge;
  for (const b of document.querySelectorAll('#grades .swatch')) {
    b.setAttribute('aria-pressed', String(b.dataset.grade === state.grade));
  }

  const hero = await helpers.loadImage(`samples/${query.get('photo') ?? 'pier'}.jpg`);
  const small = await helpers.loadImage(`samples/${query.get('photo2') ?? 'boulevard'}.jpg`);
  helpers.setPanelPhoto(0, hero);
  for (let i = 1; i < 4; i++) helpers.setPanelPhoto(i, small);

  if (shot === 'cover1350') { canvas.width = 1080; canvas.height = 1350; }
  if (shot === 'wide') { canvas.width = 1920; canvas.height = 1080; }
  if (shot === 'cover' || shot === 'cover1350' || shot === 'wide') {
    document.body.classList.add('shot-cover');
  }
  // The editor shot keeps the controls visible, with the hero photo zoomed in a touch.
  if (shot === 'editor') state.panels[0].zoom = 1.15;
  // The wide hero is a short, wide band: pan the square hero photo down so the face shows.
  if (shot === 'wide') state.panels[0].oy = 0.2;

  helpers.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
