/**
 * Binary Space Partitioning (BSP) layout generator for fwm window tiling.
 * Mirroring src/bsp.c: Recursively splits the largest remaining tile
 * along its longest axis to create non-overlapping grid layouts.
 */

export interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function calculateBSPLayout(
  count: number,
  containerW: number,
  containerH: number,
  padding = 10,
  gap = 8,
  topOffset = 36
): TileRect[] {
  if (count <= 0) return [];

  const availW = Math.max(100, containerW - padding * 2);
  const availH = Math.max(100, containerH - topOffset - padding);

  const rects: TileRect[] = [
    { x: padding, y: topOffset, w: availW, h: availH },
  ];

  while (rects.length < count) {
    // Find the tile with the largest area to split
    let maxIdx = 0;
    let maxArea = rects[0].w * rects[0].h;
    for (let i = 1; i < rects.length; i++) {
      const area = rects[i].w * rects[i].h;
      if (area > maxArea) {
        maxArea = area;
        maxIdx = i;
      }
    }

    const target = rects[maxIdx];

    // Split along the longer dimension
    if (target.w >= target.h) {
      // Vertical split (left & right)
      const halfW = Math.floor((target.w - gap) / 2);
      const r1: TileRect = { x: target.x, y: target.y, w: halfW, h: target.h };
      const r2: TileRect = { x: target.x + halfW + gap, y: target.y, w: halfW, h: target.h };
      rects.splice(maxIdx, 1, r1, r2);
    } else {
      // Horizontal split (top & bottom)
      const halfH = Math.floor((target.h - gap) / 2);
      const r1: TileRect = { x: target.x, y: target.y, w: target.w, h: halfH };
      const r2: TileRect = { x: target.x, y: target.y + halfH + gap, w: target.w, h: halfH };
      rects.splice(maxIdx, 1, r1, r2);
    }
  }

  return rects;
}