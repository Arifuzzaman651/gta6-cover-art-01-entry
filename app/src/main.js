// Vice Press wiring: photos in, panels positioned, words edited live, PNG out in the
// three common post sizes. Click a panel to select it, drag it to move its photo.
import { drawCover, layoutPanels, LAYOUT_NAMES, GRADE_NAMES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const panelLabel = document.getElementById('panelLabel');
const zoomSlider = document.getElementById('zoom');
const zoomValue = document.getElementById('zoomValue');

const state = {
  layout: 'hero3',
  grade: 'sunset',
  title: 'Sunset Heist',
  subtitle: 'A neon coast story',
  badge: 'Sunset Edition',
  panels: [newPanel(), newPanel(), newPanel(), newPanel()],
  selected: 0,
};

/** One panel's photo state: the image, its zoom and its pan offsets. */
function newPanel() {
  return { photo: null, zoom: 1, ox: 0, oy: 0 };
}

/** How many panels the current layout shows. */
function panelCount() {
  return layoutPanels(state.layout, canvas.width, canvas.height).length;
}

let rects = [];

function redraw() {
  if (state.selected >= panelCount()) state.selected = panelCount() - 1;
  rects = drawCover(canvas, state, { highlight: !document.body.classList.contains('shot-cover') });
  const n = panelCount();
  panelLabel.textContent = `Panel ${state.selected + 1} of ${n} — drag on the cover to move its photo.`;
  const panel = state.panels[state.selected];
  zoomSlider.value = Math.round(panel.zoom * 100);
  zoomValue.textContent = `${Math.round(panel.zoom * 100)}%`;
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Puts `img` into panel `i`, resetting its crop. */
function setPanelPhoto(i, img) {
  state.panels[i] = { photo: img, zoom: 1, ox: 0, oy: 0 };
}

/** Adds files as photos: the first fills the selected panel, the rest fill empty panels. */
async function addFiles(files) {
  const images = [...files].filter((f) => f.type.startsWith('image/'));
  if (!images.length) return;
  let target = state.selected;
  for (const file of images) {
    const img = await loadImage(URL.createObjectURL(file));
    while (target < panelCount() && state.panels[target].photo && target !== state.selected) target++;
    if (target >= panelCount()) target = state.selected;
    setPanelPhoto(target, img);
    target++;
  }
  redraw();
  status.textContent = `${images.length} photo${images.length > 1 ? 's' : ''} loaded.`;
}

document.getElementById('photo').addEventListener('change', (e) => addFiles(e.target.files));

document.getElementById('samplePier').addEventListener('click', async () => {
  setPanelPhoto(state.selected, await loadImage('samples/pier.jpg'));
  redraw();
  status.textContent = 'Sample pier photo loaded into the selected panel.';
});
document.getElementById('sampleBoulevard').addEventListener('click', async () => {
  setPanelPhoto(state.selected, await loadImage('samples/boulevard.jpg'));
  redraw();
  status.textContent = 'Sample boulevard photo loaded into the selected panel.';
});

document.getElementById('fillAll').addEventListener('click', () => {
  const src = state.panels[state.selected];
  if (!src.photo) { status.textContent = 'Load a photo into the selected panel first.'; return; }
  for (let i = 0; i < panelCount(); i++) setPanelPhoto(i, src.photo);
  redraw();
  status.textContent = 'One photo now fills every panel.';
});
document.getElementById('clearPanel').addEventListener('click', () => {
  state.panels[state.selected] = newPanel();
  redraw();
  status.textContent = 'Panel cleared.';
});

document.getElementById('layout').addEventListener('change', (e) => {
  state.layout = e.target.value;
  redraw();
});
document.getElementById('grades').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-grade]');
  if (!btn) return;
  state.grade = btn.dataset.grade;
  for (const b of document.querySelectorAll('#grades .swatch')) {
    b.setAttribute('aria-pressed', String(b === btn));
  }
  redraw();
});

function setZoom(zoom) {
  const panel = state.panels[state.selected];
  panel.zoom = Math.min(3, Math.max(0.5, zoom));
  redraw();
}
zoomSlider.addEventListener('input', () => setZoom(Number(zoomSlider.value) / 100));
document.getElementById('zoomIn').addEventListener('click', () => setZoom(state.panels[state.selected].zoom + 0.1));
document.getElementById('zoomOut').addEventListener('click', () => setZoom(state.panels[state.selected].zoom - 0.1));
document.getElementById('fitPanel').addEventListener('click', () => {
  state.panels[state.selected] = { ...state.panels[state.selected], zoom: 1, ox: 0, oy: 0 };
  redraw();
});

function bindText(id, key) {
  document.getElementById(id).addEventListener('input', (e) => {
    state[key] = e.target.value;
    redraw();
  });
}
bindText('title', 'title');
bindText('subtitle', 'subtitle');
bindText('badge', 'badge');

// Panel picking and panning, by pointer on the preview canvas.
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
  const hit = rects.findIndex((r) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h);
  if (hit === -1) return;
  state.selected = hit;
  drag = { x: p.x, y: p.y, moved: false };
  canvas.classList.add('dragging');
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const r = rects[state.selected];
  const panel = state.panels[state.selected];
  const dx = p.x - drag.x;
  const dy = p.y - drag.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  if (panel.photo && r) {
    panel.ox += dx / r.w;
    panel.oy += dy / r.h;
    drag.x = p.x;
    drag.y = p.y;
    redraw();
  }
});
canvas.addEventListener('pointerup', () => {
  drag = null;
  canvas.classList.remove('dragging');
});

// Drag and drop photos onto the cover.
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  addFiles(e.dataTransfer.files);
});

/** Renders the cover at `w` x `h`, downloads it as a PNG, and previews that size. */
export function exportSize(w, h, name) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    if (!blob) { status.textContent = 'Export failed — try again.'; return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    status.textContent = `Saved ${name}`;
  }, 'image/png');
  canvas.width = w;
  canvas.height = h;
  redraw();
}
document.getElementById('exportSquare').addEventListener('click', () => exportSize(1080, 1080, 'vice-press-1080x1080.png'));
document.getElementById('exportPortrait').addEventListener('click', () => exportSize(1080, 1350, 'vice-press-1080x1350.png'));
document.getElementById('exportWide').addEventListener('click', () => exportSize(1920, 1080, 'vice-press-1920x1080.png'));

// Screenshot scenes: ?shot=cover|editor|cover1350|wide sets up a fixed scene instead.
const query = new URLSearchParams(location.search);
const shot = query.get('shot');
if (shot) {
  runShot(shot, query, state, { loadImage, setPanelPhoto, redraw, exportSize });
} else {
  redraw();
}

// Keep the module's public surface small and named: the dossier outline shows these.
export { LAYOUT_NAMES, GRADE_NAMES };
