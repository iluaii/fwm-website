import type { WindowBody } from '../../types/physics';

const _cPool = [[{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}], [{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}]];
let _cIdx = 0;

export function getBoxCorners(win: WindowBody) {
  const cx = win.x + win.w / 2;
  const cy = win.y + win.h / 2;
  const hw = win.w / 2;
  const hh = win.h / 2;

  const cos = Math.cos(win.angle || 0);
  const sin = Math.sin(win.angle || 0);

  const out = _cPool[_cIdx];
  _cIdx = (_cIdx + 1) % 2;

  out[0].x = cx + (-hw * cos - -hh * sin); out[0].y = cy + (-hw * sin + -hh * cos);
  out[1].x = cx + ( hw * cos - -hh * sin); out[1].y = cy + ( hw * sin + -hh * cos);
  out[2].x = cx + ( hw * cos -  hh * sin); out[2].y = cy + ( hw * sin +  hh * cos);
  out[3].x = cx + (-hw * cos -  hh * sin); out[3].y = cy + (-hw * sin +  hh * cos);
  
  return out;
}

const _aPool = [[{x:0,y:0},{x:0,y:0}], [{x:0,y:0},{x:0,y:0}]];
let _aIdx = 0;

export function getBoxAxes(win: WindowBody) {
  const cos = Math.cos(win.angle || 0);
  const sin = Math.sin(win.angle || 0);
  
  const out = _aPool[_aIdx];
  _aIdx = (_aIdx + 1) % 2;
  
  out[0].x = cos; out[0].y = sin;
  out[1].x = -sin; out[1].y = cos;
  
  return out;
}

export function projectBox(corners: { x: number; y: number }[], axis: { x: number; y: number }) {
  let min = corners[0].x * axis.x + corners[0].y * axis.y;
  let max = min;
  for (let i = 1; i < corners.length; i++) {
    const p = corners[i].x * axis.x + corners[i].y * axis.y;
    if (p < min) min = p;
    if (p > max) max = p;
  }
  return { min, max };
}

const _combinedAxes = [{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}];

export function testOBBCollision(w1: WindowBody, w2: WindowBody) {
  const corners1 = getBoxCorners(w1);
  const corners2 = getBoxCorners(w2);

  const axes1 = getBoxAxes(w1);
  const axes2 = getBoxAxes(w2);
  
  const axes = _combinedAxes;
  axes[0] = axes1[0]; axes[1] = axes1[1]; axes[2] = axes2[0]; axes[3] = axes2[1];

  let minOverlap = Infinity;
  let mtvAxis = { x: 0, y: 0 };

  for (const axis of axes) {
    const len = Math.hypot(axis.x, axis.y);
    if (len < 1e-6) continue;
    const ax = axis.x / len;
    const ay = axis.y / len;

    const proj1 = projectBox(corners1, { x: ax, y: ay });
    const proj2 = projectBox(corners2, { x: ax, y: ay });

    const overlap = Math.min(proj1.max, proj2.max) - Math.max(proj1.min, proj2.min);

    if (overlap <= 0) return null; // Separating axis found

    if (overlap < minOverlap) {
      minOverlap = overlap;
      mtvAxis = { x: ax, y: ay };
    }
  }

  const c1x = w1.x + w1.w / 2, c1y = w1.y + w1.h / 2;
  const c2x = w2.x + w2.w / 2, c2y = w2.y + w2.h / 2;

  const dirX = c1x - c2x, dirY = c1y - c2y;
  if (dirX * mtvAxis.x + dirY * mtvAxis.y < 0) {
    mtvAxis.x = -mtvAxis.x; mtvAxis.y = -mtvAxis.y;
  }

  let bestContact = { x: (c1x + c2x) / 2, y: (c1y + c2y) / 2 };
  let maxPen = -Infinity;

  corners1.forEach((p) => {
    const d = (p.x - c2x) * -mtvAxis.x + (p.y - c2y) * -mtvAxis.y;
    if (d > maxPen) { maxPen = d; bestContact = { x: p.x, y: p.y }; }
  });

  corners2.forEach((p) => {
    const d = (p.x - c1x) * mtvAxis.x + (p.y - c1y) * mtvAxis.y;
    if (d > maxPen) { maxPen = d; bestContact = { x: p.x, y: p.y }; }
  });

  return { normal: mtvAxis, depth: minOverlap, contact: bestContact };
}