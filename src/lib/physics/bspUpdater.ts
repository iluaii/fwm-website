import { calculateBSPLayout } from './bsp';
import type { WindowBody } from '../../types/physics';

export function updateBspLayout(
  winList: WindowBody[],
  activeDesktop: number,
  bspTilingOn: boolean,
  boundsW: number,
  boundsH: number,
  dt: number
) {
  const desktopWindows = winList.filter((w) => w.activeDesktop === activeDesktop);
  if (desktopWindows.length === 0) return;

  if (bspTilingOn) {
    const rects = calculateBSPLayout(desktopWindows.length, boundsW, boundsH, 10, 8, 36);

    desktopWindows.forEach((win, i) => {
      const target = rects[i];
      if (!target) return;

      if (!win.origW) win.origW = win.w;
      if (!win.origH) win.origH = win.h;

      const animSpeed = 12.0;

      // Smoothly animate position towards target slot ONLY if window is not being dragged
      if (!win.isDragging) {
        win.x += (target.x - win.x) * animSpeed * dt;
        win.y += (target.y - win.y) * animSpeed * dt;
      }
      
      // Smoothly animate size towards target slot dimensions
      const dw = target.w - win.w;
      const dh = target.h - win.h;
      win.w += dw * animSpeed * dt;
      win.h += dh * animSpeed * dt;

      // Instantly disable rotation & momentum in BSP mode
      win.angle = 0;
      win.angvel = 0;
      win.vx = 0;
      win.vy = 0;

      // Force reset wobble mesh
      win.wobble.reset(win.w, win.h);
    });
  } else {
    // Restore original floating sizes smoothly if previously tiled
    desktopWindows.forEach((win) => {
      if (win.origW && win.origH) {
        if (win.isDragging) return;

        const animSpeed = 12.0;
        const dw = win.origW - win.w;
        const dh = win.origH - win.h;
        win.w += dw * animSpeed * dt;
        win.h += dh * animSpeed * dt;
        
        if (Math.abs(dw) > 0.1 || Math.abs(dh) > 0.1) {
          win.wobble.reset(win.w, win.h);
        }
        
        if (Math.abs(dw) < 1 && Math.abs(dh) < 1) {
          win.w = win.origW;
          win.h = win.origH;
          win.origW = undefined;
          win.origH = undefined;
          win.wobble.reset(win.w, win.h);
        }
      }
    });
  }
}