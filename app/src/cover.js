// Vice Press cover renderer: multi-panel poster layouts, colour grades and bold poster
// lettering, all drawn on one canvas. No Rockstar art, logo or font: the look comes
// from the panel grid, the grade overlays and heavy system-sans lettering.

/** Panel layouts: each takes the cover size and returns rects {x, y, w, h} in pixels. */
export const LAYOUTS = {
  hero3(w, h, gap) {
    const side = w * 0.62;
    const colX = side + gap;
    const colW = w - colX;
    const third = (h - gap * 2) / 3;
    return [
      { x: 0, y: 0, w: side, h },
      { x: colX, y: 0, w: colW, h: third },
      { x: colX, y: third + gap, w: colW, h: third },
      { x: colX, y: (third + gap) * 2, w: colW, h: third },
    ];
  },
  grid4(w, h, gap) {
    const cw = (w - gap) / 2;
    const ch = (h - gap) / 2;
    return [
      { x: 0, y: 0, w: cw, h: ch },
      { x: cw + gap, y: 0, w: cw, h: ch },
      { x: 0, y: ch + gap, w: cw, h: ch },
      { x: cw + gap, y: ch + gap, w: cw, h: ch },
    ];
  },
  full(w, h) {
    return [{ x: 0, y: 0, w, h }];
  },
  triptych(w, h, gap) {
    const cw = (w - gap * 2) / 3;
    return [
      { x: 0, y: 0, w: cw, h },
      { x: cw + gap, y: 0, w: cw, h },
      { x: (cw + gap) * 2, y: 0, w: cw, h },
    ];
  },
  heroStrip(w, h, gap) {
    const heroH = h * 0.66;
    const stripY = heroH + gap;
    const stripH = h - stripY;
    const cw = (w - gap) / 2;
    return [
      { x: 0, y: 0, w, h: heroH },
      { x: 0, y: stripY, w: cw, h: stripH },
      { x: cw + gap, y: stripY, w: cw, h: stripH },
    ];
  },
};

/** Colour grades: a canvas filter for the photos, overlay washes, and ink colours. */
export const GRADES = {
  sunset: {
    filter: 'saturate(1.32) contrast(1.06) brightness(1.02)',
    washes: [
      { x0: 0, y0: 0.55, x1: 0, y1: 1, stops: [[0, 'rgba(255,122,60,0)'], [1, 'rgba(214,44,110,0.55)']] },
      { x0: 0, y0: 0, x1: 0, y1: 0.3, stops: [[0, 'rgba(255,170,60,0.28)'], [1, 'rgba(255,170,60,0)']] },
    ],
    title: '#ffffff', accent: '#ffb37a', badgeBg: '#ff7a3c', badgeInk: '#241019',
  },
  neon: {
    filter: 'saturate(1.65) contrast(1.18)',
    washes: [
      { x0: 0, y0: 0, x1: 0, y1: 1, stops: [[0, 'rgba(255,46,136,0.34)'], [0.55, 'rgba(120,40,220,0.12)'], [1, 'rgba(0,220,255,0.30)']] },
    ],
    title: '#ffffff', accent: '#ff2e88', badgeBg: '#ff2e88', badgeInk: '#ffffff',
  },
  dusk: {
    filter: 'saturate(1.12) contrast(1.05) brightness(0.92)',
    washes: [
      { x0: 0, y0: 0, x1: 0, y1: 1, stops: [[0, 'rgba(64,32,140,0.34)'], [1, 'rgba(16,8,48,0.55)']] },
    ],
    title: '#efeaff', accent: '#b7a6ff', badgeBg: '#7a5cff', badgeInk: '#ffffff',
  },
  mono: {
    filter: 'grayscale(1) contrast(1.18) brightness(1.04)',
    washes: [
      { x0: 0, y0: 0.6, x1: 0, y1: 1, stops: [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.45)']] },
    ],
    title: '#ffffff', accent: '#d8d8d8', badgeBg: '#f2f2f2', badgeInk: '#141414',
  },
  palm: {
    filter: 'saturate(1.38) contrast(1.05)',
    washes: [
      { x0: 0, y0: 0, x1: 0, y1: 1, stops: [[0, 'rgba(47,214,200,0.30)'], [0.5, 'rgba(47,214,200,0)'], [1, 'rgba(255,80,160,0.42)']] },
    ],
    title: '#ffffff', accent: '#5cf2e4', badgeBg: '#2fd6c8', badgeInk: '#06231f',
  },
};

export const GRADE_NAMES = Object.keys(GRADES);
export const LAYOUT_NAMES = Object.keys(LAYOUTS);

/** Panel rects for a layout at a cover size. */
export function layoutPanels(layout, w, h) {
  const gap = Math.max(4, Math.round(Math.min(w, h) * 0.008));
  return (LAYOUTS[layout] ?? LAYOUTS.hero3)(w, h, gap);
}

/** Draws one photo into a panel rect, cover-fit, panned by (ox, oy) and scaled by zoom. */
function drawPanelPhoto(ctx, photo, rect, zoom, ox, oy) {
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const pw = iw * base;
  const ph = ih * base;
  const dx = rect.x + (rect.w - pw) / 2 + ox * rect.w;
  const dy = rect.y + (rect.h - ph) / 2 + oy * rect.h;
  ctx.drawImage(photo, dx, dy, pw, ph);
}

/** Draws the empty-panel placeholder: a dark field, a plus and a short prompt. */
function drawEmptyPanel(ctx, rect, index) {
  ctx.fillStyle = '#2a2138';
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = Math.max(2, rect.w * 0.008);
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const arm = Math.min(rect.w, rect.h) * 0.09;
  ctx.beginPath();
  ctx.moveTo(cx - arm, cy); ctx.lineTo(cx + arm, cy);
  ctx.moveTo(cx, cy - arm); ctx.lineTo(cx, cy + arm);
  ctx.stroke();
  const size = Math.max(11, Math.min(rect.w, rect.h) * 0.055);
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText(`PANEL ${index + 1}`, cx, cy + arm * 2.2);
}

/** Shrinks a bold font until `text` fits `maxWidth`, then returns the size. */
function fitFont(ctx, text, startSize, maxWidth, weight = 900) {
  let size = startSize;
  ctx.font = `${weight} ${size}px "Arial Black", system-ui, sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px "Arial Black", system-ui, sans-serif`;
  }
  return size;
}

/**
 * Draws the whole cover onto `canvas` from `state`:
 * { layout, grade, title, subtitle, badge, panels: [{photo, zoom, ox, oy}], selected }.
 * `opts.highlight` draws the selected panel's outline (preview only, never on export).
 * Returns the panel rects, for hit-testing.
 */
export function drawCover(canvas, state, opts = {}) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const rects = layoutPanels(state.layout, w, h);
  const gap = Math.max(4, Math.round(Math.min(w, h) * 0.008));

  ctx.save();
  ctx.fillStyle = '#14101c';
  ctx.fillRect(0, 0, w, h);

  rects.forEach((rect, i) => {
    const panel = state.panels[i] ?? { photo: null, zoom: 1, ox: 0, oy: 0 };
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    if (panel.photo) {
      ctx.filter = grade.filter;
      drawPanelPhoto(ctx, panel.photo, rect, panel.zoom, panel.ox, panel.oy);
      ctx.filter = 'none';
    } else {
      drawEmptyPanel(ctx, rect, i);
    }
    ctx.restore();
  });

  // Grade washes over the whole cover.
  for (const wash of grade.washes) {
    const grad = ctx.createLinearGradient(w * wash.x0, h * wash.y0, w * wash.x1, h * wash.y1);
    for (const [at, color] of wash.stops) grad.addColorStop(at, color);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  // Bottom scrim so the lettering always reads.
  const scrim = ctx.createLinearGradient(0, h * 0.62, 0, h);
  scrim.addColorStop(0, 'rgba(10,6,18,0)');
  scrim.addColorStop(1, 'rgba(10,6,18,0.72)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, w, h);

  // Thin poster frame.
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.004);
  ctx.strokeRect(gap / 2, gap / 2, w - gap, h - gap);

  // Badge pill, top-left.
  const badgeText = (state.badge ?? '').trim().toUpperCase();
  if (badgeText) {
    const bSize = Math.max(14, Math.min(w, h) * 0.026);
    ctx.font = `800 ${bSize}px system-ui, sans-serif`;
    const padX = bSize * 0.9;
    const bw = ctx.measureText(badgeText).width + padX * 2;
    const bh = bSize * 2.1;
    const bx = gap * 2;
    const by = gap * 2;
    ctx.fillStyle = grade.badgeBg;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = grade.badgeInk;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, bx + bw / 2, by + bh / 2 + bSize * 0.04);
    ctx.textBaseline = 'alphabetic';
  }

  // Title + subtitle, centred near the foot.
  const title = (state.title ?? '').trim().toUpperCase();
  const subtitle = (state.subtitle ?? '').trim();
  const cx = w / 2;
  const foot = h - h * 0.055;
  if (subtitle) {
    const subSize = Math.max(14, Math.min(w, h) * 0.032);
    ctx.font = `700 ${subSize}px system-ui, sans-serif`;
    try { ctx.letterSpacing = `${Math.round(subSize * 0.22)}px`; } catch { /* older canvas */ }
    ctx.textAlign = 'center';
    ctx.fillStyle = grade.accent;
    ctx.fillText(subtitle.toUpperCase(), cx, foot - Math.min(w, h) * 0.115);
    try { ctx.letterSpacing = '0px'; } catch { /* older canvas */ }
  }
  if (title) {
    const start = Math.min(w, h) * 0.115;
    const size = fitFont(ctx, title, start, w * 0.92);
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(16,8,24,0.85)';
    ctx.lineWidth = Math.max(3, size * 0.14);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.05;
    ctx.strokeText(title, cx, foot);
    ctx.fillStyle = grade.title;
    ctx.fillText(title, cx, foot);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  // Maker mark, bottom-right corner.
  const markSize = Math.max(10, Math.min(w, h) * 0.016);
  ctx.font = `700 ${markSize}px system-ui, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fillText('VICE PRESS', w - gap * 2, h - gap * 1.6);

  // Selected-panel outline (preview only).
  if (opts.highlight && state.selected != null && rects[state.selected]) {
    const r = rects[state.selected];
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, Math.min(w, h) * 0.006);
    ctx.setLineDash([Math.max(8, w * 0.02), Math.max(6, w * 0.012)]);
    ctx.strokeRect(r.x + 2, r.y + 2, r.w - 4, r.h - 4);
    ctx.setLineDash([]);
  }

  ctx.restore();
  return rects;
}
