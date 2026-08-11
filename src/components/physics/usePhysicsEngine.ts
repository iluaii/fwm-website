import { useEffect } from 'react';
import gsap from 'gsap';
import { WOBBLE_GRID } from '../../lib/physics/FwmWobble';
import { playKnockSound } from '../../lib/audio/knockSound';
import { drawTriangle } from '../../lib/graphics/drawTriangle';
import { getLocalWindowCoords } from '../../lib/physics/geometry';
import { getWindowTextureCanvas } from '../../lib/graphics/windowTexture';
import { updateBspLayout } from '../../lib/physics/bspUpdater';
import { checkWindowCollisionDamage, processBrokenWindows } from '../../lib/physics/breakableUpdater';
import { testOBBCollision } from '../../lib/physics/collision';
import { calculateBSPLayout } from '../../lib/physics/bsp';
import type { WindowBody } from '../../types/physics';

export interface PhysicsEngineProps {
  desktopRef: React.RefObject<HTMLDivElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  shakeWrapperRef: React.RefObject<HTMLDivElement | null>;
  telemetryRef: React.RefObject<HTMLSpanElement | null>;
  optsRef: React.RefObject<any>;
  windowsRef: React.MutableRefObject<WindowBody[]>;
  windowTextureMapRef: React.MutableRefObject<{ [key: number]: HTMLCanvasElement }>;
  sortedWindowsRef: React.MutableRefObject<WindowBody[]>;
  focusedTitleRef: React.MutableRefObject<string>;
  lastTelemetryTextRef: React.MutableRefObject<string>;
  lastSoundTimeRef: React.MutableRefObject<number>;
  lastTelemetryDataRef: React.MutableRefObject<any>;
  activeDesktop: number;
}

export const usePhysicsEngine = ({
  desktopRef, canvasRef, shakeWrapperRef, telemetryRef, optsRef, windowsRef, windowTextureMapRef, sortedWindowsRef,
  focusedTitleRef, lastTelemetryTextRef, lastSoundTimeRef, lastTelemetryDataRef, activeDesktop
}: PhysicsEngineProps) => {

  useEffect(() => {
    if (!desktopRef.current || !canvasRef.current) return;

    let shakeMag = 0; let shakeT = 0;
    let histX = [0,0,0,0], histY = [0,0,0,0], histTime = [0,0,0,0];
    let histCount = 0;
    let swirlDir = 0, swirlTime = 0, swirlHave = false, swirlAcc = 0, swirlAbs = 0, swirlSpan = 0;
    let pivotX = 0, pivotY = 0, pivotVx = 0, pivotVy = 0, pivotAx = 0, pivotAy = 0;
    let pivotHave = false;
    let activeDragWin: WindowBody | null = null;
    let dragTargetX = 0, dragTargetY = 0, dragCurX = 0, dragCurY = 0;

    const physicsTick = (_time: number, deltaTime: number) => {
      const canvas = canvasRef.current, desk = desktopRef.current;
      if (!canvas || !desk) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const boundsW = desk.clientWidth, boundsH = desk.clientHeight;
      if (canvas.width !== boundsW || canvas.height !== boundsH) {
        canvas.width = boundsW; canvas.height = boundsH;
      }
      
      const dt = Math.min(deltaTime / 1000, 0.033);
      const opts = optsRef.current;
      const currentGravity = opts.gravityOn ? (opts.gravityType === 'earth' ? 981.0 : (opts.gravityType === 'moon' ? 162.0 : 0.0)) : 0.0;
    
      let camOffsetX = 0, camOffsetY = 0;
      if (shakeMag > 0.01) {
        shakeT += dt;
        shakeMag *= Math.exp(-9.0 * dt);
        camOffsetX = Math.round(shakeMag * Math.sin(shakeT * 38.0));
        camOffsetY = Math.round(shakeMag * Math.sin(shakeT * 47.0 + 1.3));
      } else { shakeMag = 0; }
    
      if (shakeWrapperRef.current) { shakeWrapperRef.current.style.transform = `translate(${camOffsetX}px, ${camOffsetY}px)`; }
    
      ctx.clearRect(0, 0, boundsW, boundsH);
      ctx.save();
    
      const winList = windowsRef.current;
    
      // =========================================================================
      // STEP 1: INTEGRATE POSITIONS & VELOCITIES BEFORE SOLVING CONSTRAINTS
      // =========================================================================
      winList.forEach((win) => {
        if (win.activeDesktop !== activeDesktop) return;
        win.mass = opts.massMode === 'ram' ? 342.0 : Math.round(win.w * win.h * 0.0005 * 10) / 10;

        if (win.isDragging) {
          const smoothFactor = 1 - Math.exp(-36 * dt);
          const lerpTargetX = win.x + (dragTargetX - win.x) * smoothFactor;
          const lerpTargetY = win.y + (dragTargetY - win.y) * smoothFactor;

          win.vx = (lerpTargetX - win.x) / dt;
          win.vy = (lerpTargetY - win.y) / dt;

          if (opts.rotationOn && !opts.bspTilingOn) {
            if (!pivotHave) {
              pivotX = dragCurX; pivotY = dragCurY; pivotVx = 0; pivotVy = 0; pivotAx = 0; pivotAy = 0; pivotHave = true;
            } else {
              const nvx = (dragCurX - pivotX) / dt, nvy = (dragCurY - pivotY) / dt;
              const kv = dt / (dt + 0.04);
              const svx = pivotVx + (nvx - pivotVx) * kv, svy = pivotVy + (nvy - pivotVy) * kv;
              const rax = (svx - pivotVx) / dt, ray = (svy - pivotVy) / dt;
              const ka = dt / (dt + 0.08);
              pivotAx += (rax - pivotAx) * ka; pivotAy += (ray - pivotAy) * ka;
              pivotAx = Math.max(-20000, Math.min(20000, pivotAx)); pivotAy = Math.max(-20000, Math.min(20000, pivotAy));
              pivotX = dragCurX; pivotY = dragCurY; pivotVx = svx; pivotVy = svy;

              const c = Math.cos(win.angle), s = Math.sin(win.angle);
              const rx = -(c * win.grabLxCenter - s * win.grabLyCenter), ry = -(s * win.grabLxCenter + c * win.grabLyCenter);
              const gy = currentGravity, ex = -pivotAx, ey = gy - pivotAy;
              const inertia = (win.w * win.w + win.h * win.h) / 12.0 + (rx * rx + ry * ry);
              if (inertia > 1.0) { const alpha = (rx * ey - ry * ex) / inertia; win.angvel += alpha * dt; }
              win.angvel *= Math.exp(-1.2 * dt);
              win.angvel = Math.max(-8.0, Math.min(8.0, win.angvel));
              win.angle += win.angvel * dt;
              win.x = (dragCurX + rx) - win.w / 2; win.y = (dragCurY + ry) - win.h / 2;
            }
          } else {
            win.x = lerpTargetX;
            win.y = lerpTargetY;
          }
        } else {
          if (!opts.bspTilingOn) {
            win.vy += currentGravity * dt;
            const damp = Math.pow(currentGravity > 0 ? 0.985 : 0.995, dt * 60);
            win.vx *= damp; win.vy *= damp;
            win.x += win.vx * dt; win.y += win.vy * dt;

            if (opts.rotationOn) {
              win.angle += win.angvel * dt; win.angvel *= Math.exp(-0.35 * dt);
              win.angvel = Math.max(-8.0, Math.min(8.0, win.angvel));
            } else { win.angle = 0; win.angvel = 0; }
          }
        }
      });

      // Update BSP Layout if enabled
      updateBspLayout(winList, activeDesktop, opts.bspTilingOn, boundsW, boundsH, dt);

      // =========================================================================
      // STEP 2: MULTI-PASS CONSTRAINTS (WINDOW COLLISIONS + FLOOR & BOUNDARIES)
      // =========================================================================
      if (!opts.bspTilingOn) {
        const NUM_ITERATIONS = 4;

        for (let iter = 0; iter < NUM_ITERATIONS; iter++) {
          // A. Window-to-Window Rigid Body Collisions
          for (let i = 0; i < winList.length; i++) {
            for (let j = i + 1; j < winList.length; j++) {
              const w1 = winList[i], w2 = winList[j];
              if (w1.activeDesktop !== activeDesktop || w2.activeDesktop !== activeDesktop) continue;

              const col = testOBBCollision(w1, w2);
              if (!col) continue;
              
              const { normal, depth, contact } = col;

              // 100% Hard Separation (Zero Slop)
              if (depth > 0) {
                if (w1.isDragging && !w2.isDragging) {
                  w2.x -= normal.x * depth;
                  w2.y -= normal.y * depth;
                } else if (!w1.isDragging && w2.isDragging) {
                  w1.x += normal.x * depth;
                  w1.y += normal.y * depth;
                } else if (!w1.isDragging && !w2.isDragging) {
                  const totalMass = w1.mass + w2.mass;
                  const m1Ratio = w2.mass / totalMass;
                  const m2Ratio = w1.mass / totalMass;

                  w1.x += normal.x * depth * m1Ratio;
                  w1.y += normal.y * depth * m1Ratio;
                  w2.x -= normal.x * depth * m2Ratio;
                  w2.y -= normal.y * depth * m2Ratio;
                }
              }

              // Compute Impulse / Resting Velocity on Pass 0
              if (iter === 0) {
                const c1x = w1.x + w1.w / 2, c1y = w1.y + w1.h / 2;
                const c2x = w2.x + w2.w / 2, c2y = w2.y + w2.h / 2;
                const r1x = contact.x - c1x, r1y = contact.y - c1y;
                const r2x = contact.x - c2x, r2y = contact.y - c2y;

                const v1cx = w1.vx - (opts.rotationOn ? w1.angvel * r1y : 0);
                const v1cy = w1.vy + (opts.rotationOn ? w1.angvel * r1x : 0);
                const v2cx = w2.vx - (opts.rotationOn ? w2.angvel * r2y : 0);
                const v2cy = w2.vy + (opts.rotationOn ? w2.angvel * r2x : 0);

                const relVx = v1cx - v2cx;
                const relVy = v1cy - v2cy;
                const velAlongNormal = relVx * normal.x + relVy * normal.y;

                if (velAlongNormal < 0) {
                  const approachSpeed = -velAlongNormal;
                  const totalMass = w1.mass + w2.mass;
                  const m1Ratio = w2.mass / totalMass;
                  const m2Ratio = w1.mass / totalMass;

                  // RESTING CONTACT: Kill normal velocity if approach is slow (< 35 px/s) to prevent shaking
                  if (approachSpeed < 35) {
                    const normVelX = relVx * normal.x * normal.x;
                    const normVelY = relVy * normal.y * normal.y;

                    if (!w1.isDragging) {
                      w1.vx -= normVelX * m1Ratio;
                      w1.vy -= normVelY * m1Ratio;
                      if (Math.abs(w1.vx) < 1) w1.vx = 0;
                      if (Math.abs(w1.vy) < 1) w1.vy = 0;
                    }
                    if (!w2.isDragging) {
                      w2.vx += normVelX * m2Ratio;
                      w2.vy += normVelY * m2Ratio;
                      if (Math.abs(w2.vx) < 1) w2.vx = 0;
                      if (Math.abs(w2.vy) < 1) w2.vy = 0;
                    }
                  } else {
                    // DYNAMIC IMPACT IMPULSE
                    const restitution = approachSpeed > 150 ? 0.25 : 0.0;
                    const invM1 = 1 / w1.mass, invM2 = 1 / w2.mass;
                    const I1 = (w1.mass * (w1.w * w1.w + w1.h * w1.h)) / 12;
                    const I2 = (w2.mass * (w2.w * w2.w + w2.h * w2.h)) / 12;
                    const invI1 = opts.rotationOn ? 1 / I1 : 0;
                    const invI2 = opts.rotationOn ? 1 / I2 : 0;

                    const r1CrossN = r1x * normal.y - r1y * normal.x;
                    const r2CrossN = r2x * normal.y - r2y * normal.x;
                    const invMassSum = invM1 + invM2 + (r1CrossN * r1CrossN) * invI1 + (r2CrossN * r2CrossN) * invI2;

                    const jImpulse = -(1 + restitution) * velAlongNormal / invMassSum;
                    const impulseX = jImpulse * normal.x;
                    const impulseY = jImpulse * normal.y;

                    if (!w1.isDragging) {
                      w1.vx += impulseX * invM1;
                      w1.vy += impulseY * invM1;
                      if (opts.rotationOn) w1.angvel += (r1x * impulseY - r1y * impulseX) * invI1;
                    }
                    if (!w2.isDragging) {
                      w2.vx -= impulseX * invM2;
                      w2.vy -= impulseY * invM2;
                      if (opts.rotationOn) w2.angvel -= (r2x * impulseY - r2y * impulseX) * invI2;
                    }

                    if (approachSpeed > 120 && performance.now() - lastSoundTimeRef.current > 90) {
                      lastSoundTimeRef.current = performance.now();
                      playKnockSound(approachSpeed, opts.soundOn);
                      const f = Math.min(1.0, approachSpeed / 2000.0);
                      const mag = 12.0 * f * f;
                      if (mag > shakeMag) { shakeMag = mag; shakeT = 0; }
                    }
                    checkWindowCollisionDamage(w1, w2, approachSpeed, opts.breakableOn);
                  }
                }
              }
            }
          }

          // B. Window vs Floor / Wall / Ceiling Boundaries
          winList.forEach((win) => {
            if (win.activeDesktop !== activeDesktop || win.isDragging) return;

            const cosA = Math.cos(win.angle);
            const sinA = Math.sin(win.angle);
            const extX = (win.w / 2) * Math.abs(cosA) + (win.h / 2) * Math.abs(sinA);
            const extY = (win.w / 2) * Math.abs(sinA) + (win.h / 2) * Math.abs(cosA);

            let cx = win.x + win.w / 2;
            let cy = win.y + win.h / 2;

            let hit = false;
            let hitSpeed = 0;
            const wallRestitution = currentGravity > 0 ? 0.3 : 0.8;

            if (cx - extX < 0) {
              cx = extX; win.x = cx - win.w / 2;
              if (win.vx < 0) { hitSpeed = Math.abs(win.vx); win.vx = hitSpeed * wallRestitution; hit = true; }
            }
            if (cx + extX > boundsW) {
              cx = boundsW - extX; win.x = cx - win.w / 2;
              if (win.vx > 0) { hitSpeed = Math.abs(win.vx); win.vx = -hitSpeed * wallRestitution; hit = true; }
            }
            if (cy - extY < 0) {
              cy = extY; win.y = cy - win.h / 2;
              if (win.vy < 0) { hitSpeed = Math.abs(win.vy); win.vy = hitSpeed * wallRestitution; hit = true; }
            }
            if (cy + extY > boundsH) {
              cy = boundsH - extY; win.y = cy - win.h / 2;
              if (win.vy > 0) {
                hitSpeed = Math.abs(win.vy);
                win.vy = -hitSpeed * wallRestitution;
                win.vx *= 0.85;
                if (Math.abs(win.vy) < 30) win.vy = 0;
                hit = true;
              }
            }

            // Trigger Knock Sound & Squash/Stretch Drop Animation on Floor Landing
            if (hit && hitSpeed > 120 && iter === 0) {
              win.squashT = 0;
              win.squashAmount = Math.min(0.24, hitSpeed / 900.0);
              win.squashNx = 0;
              win.squashNy = -1;

              const f = Math.min(1.0, hitSpeed / 2000.0);
              const mag = 12.0 * f * f;
              if (mag > shakeMag) { shakeMag = mag; shakeT = 0; }

              if (performance.now() - lastSoundTimeRef.current > 90) {
                lastSoundTimeRef.current = performance.now();
                playKnockSound(hitSpeed, opts.soundOn);
              }
            }
          });
        }
      }

      // =========================================================================
      // STEP 3: RENDER FULLY SOLVED & POSITION-CLAMPED FRAME
      // =========================================================================
      const sortedWindows = sortedWindowsRef.current;
      sortedWindows.length = 0;
      for (let i = 0; i < winList.length; i++) sortedWindows.push(winList[i]);
      sortedWindows.sort((a, b) => a.zIndex - b.zIndex);

      sortedWindows.forEach((win) => {
        if (win.activeDesktop !== activeDesktop) return;

        const moveDx = win.x - win.lastX, moveDy = win.y - win.lastY;
        if (opts.wobbleOn && (moveDx !== 0 || moveDy !== 0)) win.wobble.translate(moveDx, moveDy);
        win.lastX = win.x; win.lastY = win.y;

        if (opts.wobbleOn && !opts.bspTilingOn) win.wobble.step(dt);

        let sx = 1.0, sy = 1.0;
        if (win.squashAmount > 0.001) {
          win.squashT += dt;
          const env = win.squashAmount * Math.exp(-12.0 * win.squashT);
          if (env < 0.004) { win.squashAmount = 0; }
          else {
            const a = Math.min(0.45, Math.max(-0.45, env * Math.cos(14.0 * win.squashT)));
            const ax = Math.abs(win.squashNx), ay = Math.abs(win.squashNy);
            sx = 1.0 - a * ax + a * 0.45 * ay; sy = 1.0 - a * ay + a * 0.45 * ax;
          }
        }

        // Telemetry Update
        const isFocused = win.isDragging || focusedTitleRef.current === win.title;
        if (isFocused) {
          if (win.isDragging) focusedTitleRef.current = win.title;
          const speed = Math.round(Math.hypot(win.vx, win.vy));
          const angle = Math.round(((win.angle * 180) / Math.PI) % 360);
          const td = lastTelemetryDataRef.current;
          if (td.angle !== angle || td.speed !== speed || td.mass !== win.mass || td.title !== win.title) {
            td.angle = angle; td.speed = speed; td.mass = win.mass; td.title = win.title;
            const telemetryText = `${win.title} • ${angle}° • ${speed}px/s • m ${win.mass}`;
            if (telemetryRef.current && lastTelemetryTextRef.current !== telemetryText) {
              telemetryRef.current.textContent = telemetryText; lastTelemetryTextRef.current = telemetryText;
            }
          }
        }

        // Texture Drawing
        const texCanvas = getWindowTextureCanvas(win, windowTextureMapRef.current, isFocused);
        ctx.save();
        ctx.translate(win.x + win.w / 2, win.y + win.h / 2);
        if (opts.rotationOn && win.angle !== 0 && !opts.bspTilingOn) ctx.rotate(win.angle);
        ctx.translate(-win.w / 2, -win.h / 2);

        if (opts.wobbleOn && win.isDragging && !opts.bspTilingOn) {
          const grid = WOBBLE_GRID; const gridStepU = win.w / (grid - 1), gridStepV = win.h / (grid - 1);
          ctx.save(); ctx.scale(sx, sy);
          for (let j = 0; j < grid - 1; j++) {
            for (let i = 0; i < grid - 1; i++) {
              const k00 = j * grid + i, k10 = j * grid + (i + 1), k11 = (j + 1) * grid + (i + 1), k01 = (j + 1) * grid + i;
              const x00 = win.wobble.px[k00], y00 = win.wobble.py[k00], x10 = win.wobble.px[k10], y10 = win.wobble.py[k10];
              const x11 = win.wobble.px[k11], y11 = win.wobble.py[k11], x01 = win.wobble.px[k01], y01 = win.wobble.py[k01];
              const u0 = i * gridStepU, v0 = j * gridStepV, u1 = (i + 1) * gridStepU, v1 = (j + 1) * gridStepV;
              drawTriangle(ctx, texCanvas, x00, y00, u0, v0, x10, y10, u1, v0, x11, y11, u1, v1);
              drawTriangle(ctx, texCanvas, x00, y00, u0, v0, x11, y11, u1, v1, x01, y01, u0, v1);
            }
          }
          ctx.restore();
        } else {
          ctx.scale(sx, sy); ctx.drawImage(texCanvas, 0, 0);
        }
        ctx.restore();
      });
      
      processBrokenWindows(winList, windowTextureMapRef.current);
      ctx.restore();
    };

    gsap.ticker.add(physicsTick);

    const handlePointerDown = (e: PointerEvent) => {
      if (!desktopRef.current || !canvasRef.current) return;
      const deskRect = desktopRef.current.getBoundingClientRect();
      const clickX = e.clientX - deskRect.left, clickY = e.clientY - deskRect.top;
      const winList = windowsRef.current;

      for (let i = winList.length - 1; i >= 0; i--) {
        const win = winList[i];
        if (win.activeDesktop !== activeDesktop) continue;

        const { localX, localY } = getLocalWindowCoords(win, clickX, clickY);
        if (localX >= 0 && localX <= win.w && localY >= 0 && localY <= win.h) {
          win.zIndex = Math.max(...winList.map((w) => w.zIndex), 10) + 1;
          if (localY <= 28 && localX >= win.w - 24 && localX <= win.w - 4) {
            delete windowTextureMapRef.current[win.id]; winList.splice(i, 1); return;
          }
          if (localY <= 28) {
            activeDragWin = win; win.isDragging = true;
            desktopRef.current.style.cursor = 'grabbing';
            win.grabLxCenter = localX - win.w / 2; win.grabLyCenter = localY - win.h / 2;
            win.grabLx = localX; win.grabLy = localY;
            dragTargetX = clickX - localX; dragTargetY = clickY - localY;
            dragCurX = clickX; dragCurY = clickY;
            win.wobble.grab(localX, localY);
            pivotHave = false; histCount = 0; swirlHave = false; swirlAcc = 0; swirlAbs = 0; swirlSpan = 0;
            break;
          }
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!desktopRef.current) return;
      const deskRect = desktopRef.current.getBoundingClientRect();
      const curLx = e.clientX - deskRect.left, curLy = e.clientY - deskRect.top;

      if (!activeDragWin) {
        let hovered = false;
        const winList = windowsRef.current;
        for (let i = winList.length - 1; i >= 0; i--) {
          const win = winList[i];
          if (win.activeDesktop !== activeDesktop) continue;
          const { localX, localY } = getLocalWindowCoords(win, curLx, curLy);
          if (localX >= 0 && localX <= win.w && localY >= 0 && localY <= win.h) {
            if (localY <= 28 && localX >= win.w - 24 && localX <= win.w - 4) { desktopRef.current.style.cursor = 'pointer'; } 
            else if (localY <= 28) { desktopRef.current.style.cursor = 'grab'; } 
            else { desktopRef.current.style.cursor = 'default'; }
            hovered = true; break;
          }
        }
        if (!hovered) desktopRef.current.style.cursor = 'default';
        return;
      }

      dragCurX = curLx; dragCurY = curLy;
      dragTargetX = curLx - activeDragWin.grabLx; dragTargetY = curLy - activeDragWin.grabLy;

      if (optsRef.current.bspTilingOn && desktopRef.current) {
        const winList = windowsRef.current;
        const desktopWindows = winList.filter((w) => w.activeDesktop === activeDesktop);
        const draggedIdx = desktopWindows.indexOf(activeDragWin);

        if (draggedIdx !== -1) {
          const boundsW = desktopRef.current.clientWidth;
          const boundsH = desktopRef.current.clientHeight;
          const rects = calculateBSPLayout(desktopWindows.length, boundsW, boundsH, 10, 8, 36);

          const centerX = activeDragWin.x + activeDragWin.w / 2;
          const centerY = activeDragWin.y + activeDragWin.h / 2;

          let targetIdx = -1;
          for (let k = 0; k < rects.length; k++) {
            const r = rects[k];
            if (
              centerX >= r.x &&
              centerX <= r.x + r.w &&
              centerY >= r.y &&
              centerY <= r.y + r.h
            ) {
              targetIdx = k;
              break;
            }
          }

          if (targetIdx !== -1 && targetIdx !== draggedIdx) {
            const targetWin = desktopWindows[targetIdx];
            const mainDraggedIdx = winList.indexOf(activeDragWin);
            const mainTargetIdx = winList.indexOf(targetWin);

            if (mainDraggedIdx !== -1 && mainTargetIdx !== -1) {
              winList.splice(mainDraggedIdx, 1);
              winList.splice(mainTargetIdx, 0, activeDragWin);
            }
          }
        }
      }

      const now = performance.now() / 1000;
      histX.shift(); histX.push(curLx); histY.shift(); histY.push(curLy); histTime.shift(); histTime.push(now);
      if (histCount < 4) histCount++;

      if (histCount >= 2) {
        const oldest = 4 - histCount; const dtS = now - histTime[oldest];
        if (dtS > 0.001) {
          const vx = (curLx - histX[oldest]) / dtS, vy = (curLy - histY[oldest]) / dtS;
          const speed = Math.hypot(vx, vy);

          if (optsRef.current.rotationOn && speed > 150.0 && !optsRef.current.bspTilingOn) {
            const dir = Math.atan2(vy, vx);
            if (!swirlHave) { swirlDir = dir; swirlTime = now; swirlHave = true; } 
            else {
              const dtSwirl = now - swirlTime;
              if (dtSwirl >= 0.02) {
                let d = dir - swirlDir;
                while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
                if (dtSwirl < 0.2 && Math.abs(d) < Math.PI / 2.0) {
                  const decay = Math.exp(-dtSwirl / 0.2);
                  swirlAcc = swirlAcc * decay + d; swirlAbs = swirlAbs * decay + Math.abs(d); swirlSpan = swirlSpan * decay + dtSwirl;
                  if (swirlSpan > 0.05 && swirlAbs > 1e-6) {
                    const coh = Math.abs(swirlAcc) / swirlAbs;
                    let omega = (swirlAcc / swirlSpan) * 0.7 * coh * coh;
                    omega = Math.max(-6.0, Math.min(6.0, omega));
                    if (Math.abs(omega) >= 0.4) activeDragWin.angvel += (omega - activeDragWin.angvel) * 0.15;
                  }
                }
                swirlDir = dir; swirlTime = now;
              }
            }
          }
        }
      }
    };

    const handlePointerUp = () => {
      if (!activeDragWin) return;
      const win = activeDragWin;
      win.isDragging = false; win.wobble.release();

      const now = performance.now() / 1000;

      if (optsRef.current.bspTilingOn) {
        win.vx = 0;
        win.vy = 0;
      } else {
        let throwVx = 0, throwVy = 0;
        if (histCount >= 2) {
          const oldest = 4 - histCount; const dtS = now - histTime[oldest];
          if (dtS > 0.01) { throwVx = ((dragCurX - histX[oldest]) / dtS) * 0.65; throwVy = ((dragCurY - histY[oldest]) / dtS) * 0.65; }
        }

        const throwSpeed = Math.hypot(throwVx, throwVy);
        if (throwSpeed > 1800) { const scale = 1800 / throwSpeed; throwVx *= scale; throwVy *= scale; }

        win.vx = throwVx; win.vy = throwVy;
        if (optsRef.current.rotationOn) win.angvel = Math.max(-6.0, Math.min(6.0, win.angvel));
      }

      activeDragWin = null; pivotHave = false;
      if (desktopRef.current) desktopRef.current.style.cursor = 'default';
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      gsap.ticker.remove(physicsTick);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeDesktop]);
};