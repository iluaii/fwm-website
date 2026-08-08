import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ProximityText } from 'z-proximity-engine';

import { FwmWobble, WOBBLE_GRID } from '../lib/physics/FwmWobble';
import { playKnockSound } from '../lib/audio/knockSound';
import { drawTriangle } from '../lib/graphics/drawTriangle';
import { getLocalWindowCoords } from '../lib/physics/geometry';
import { getWindowTextureCanvas } from '../lib/graphics/windowTexture';
import type { WindowBody } from '../types/physics';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// --- SAT OBB RIGID BODY COLLISION HELPERS ---
function getBoxCorners(win: WindowBody) {
  const cx = win.x + win.w / 2;
  const cy = win.y + win.h / 2;
  const hw = win.w / 2;
  const hh = win.h / 2;

  const cos = Math.cos(win.angle || 0);
  const sin = Math.sin(win.angle || 0);

  return [
    { x: cx + (-hw * cos - -hh * sin), y: cy + (-hw * sin + -hh * cos) },
    { x: cx + ( hw * cos - -hh * sin), y: cy + ( hw * sin + -hh * cos) },
    { x: cx + ( hw * cos -  hh * sin), y: cy + ( hw * sin +  hh * cos) },
    { x: cx + (-hw * cos -  hh * sin), y: cy + (-hw * sin +  hh * cos) },
  ];
}

function getBoxAxes(win: WindowBody) {
  const cos = Math.cos(win.angle || 0);
  const sin = Math.sin(win.angle || 0);
  return [
    { x: cos, y: sin },
    { x: -sin, y: cos },
  ];
}

function projectBox(corners: { x: number; y: number }[], axis: { x: number; y: number }) {
  let min = corners[0].x * axis.x + corners[0].y * axis.y;
  let max = min;
  for (let i = 1; i < corners.length; i++) {
    const p = corners[i].x * axis.x + corners[i].y * axis.y;
    if (p < min) min = p;
    if (p > max) max = p;
  }
  return { min, max };
}

function testOBBCollision(w1: WindowBody, w2: WindowBody) {
  const corners1 = getBoxCorners(w1);
  const corners2 = getBoxCorners(w2);

  const axes1 = getBoxAxes(w1);
  const axes2 = getBoxAxes(w2);
  const axes = [...axes1, ...axes2];

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

    if (overlap <= 0) {
      return null; // Separating axis found -> No collision
    }

    if (overlap < minOverlap) {
      minOverlap = overlap;
      mtvAxis = { x: ax, y: ay };
    }
  }

  // Ensure MTV points from w2 towards w1
  const c1x = w1.x + w1.w / 2;
  const c1y = w1.y + w1.h / 2;
  const c2x = w2.x + w2.w / 2;
  const c2y = w2.y + w2.h / 2;

  const dirX = c1x - c2x;
  const dirY = c1y - c2y;
  if (dirX * mtvAxis.x + dirY * mtvAxis.y < 0) {
    mtvAxis.x = -mtvAxis.x;
    mtvAxis.y = -mtvAxis.y;
  }

  // Deepest penetrating contact point
  let bestContact = { x: (c1x + c2x) / 2, y: (c1y + c2y) / 2 };
  let maxPen = -Infinity;

  corners1.forEach((p) => {
    const d = (p.x - c2x) * -mtvAxis.x + (p.y - c2y) * -mtvAxis.y;
    if (d > maxPen) {
      maxPen = d;
      bestContact = { x: p.x, y: p.y };
    }
  });

  corners2.forEach((p) => {
    const d = (p.x - c1x) * mtvAxis.x + (p.y - c1y) * mtvAxis.y;
    if (d > maxPen) {
      maxPen = d;
      bestContact = { x: p.x, y: p.y };
    }
  });

  return {
    normal: mtvAxis,
    depth: minOverlap,
    contact: bestContact,
  };
}

export const PhysicsSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const shakeWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const textStep1Ref = useRef<HTMLDivElement>(null);
  const textStep2Ref = useRef<HTMLDivElement>(null);
  const instructionRef = useRef<HTMLDivElement>(null);

  const windowTextureMapRef = useRef<{ [key: number]: HTMLCanvasElement }>({});

  const [clock, setClock] = useState('');
  const [activeDesktop, setActiveDesktop] = useState(0);

  const [gravityOn, setGravityOn] = useState(true);
  const [gravityType, setGravityType] = useState<'earth' | 'moon' | 'space'>('earth');
  const [rotationOn, setRotationOn] = useState(true);
  const [wobbleOn, setWobbleOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [massMode, setMassMode] = useState<'size' | 'ram'>('size');
  const [showModes, setShowModes] = useState(false);

  const telemetryRef = useRef<HTMLSpanElement>(null);
  const focusedTitleRef = useRef<string>('fwm-terminal');
  const lastTelemetryTextRef = useRef<string>('');
  const lastSoundTimeRef = useRef<number>(0);
  
  const deskRectRef = useRef<DOMRect | null>(null);
  
  useEffect(() => {
    const updateRect = () => {
      if (desktopRef.current) {
        deskRectRef.current = desktopRef.current.getBoundingClientRect();
      }
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, { passive: true });
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, []);
  
  const optsRef = useRef({ gravityOn, gravityType, rotationOn, wobbleOn, soundOn, massMode });
  useEffect(() => {
    optsRef.current = { gravityOn, gravityType, rotationOn, wobbleOn, soundOn, massMode };
  }, [gravityOn, gravityType, rotationOn, wobbleOn, soundOn, massMode]);

  const windowsRef = useRef<WindowBody[]>([]);

  // Initialize terminal window on initial load
  useEffect(() => {
    const wob = new FwmWobble();
    wob.reset(280, 180);
    windowsRef.current = [
      {
        id: 101,
        title: 'fwm-terminal',
        x: 180,
        y: 60,
        vx: 0,
        vy: 0,
        w: 280,
        h: 180,
        angle: 0,
        angvel: 0,
        mass: Math.round((280 * 180 * 0.0005) * 10) / 10,
        isDragging: false,
        grabLxCenter: 0,
        grabLyCenter: -76,
        grabLx: 140,
        grabLy: 14,
        squashT: 0,
        squashAmount: 0,
        squashNx: 0,
        squashNy: 0,
        wobble: wob,
        activeDesktop: 0,
        zIndex: 10,
        lastX: 180,
        lastY: 60,
      },
    ];
  }, []);

  // Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Tight GSAP ScrollTrigger Sequence — No Dead White Space
    useEffect(() => {
      if (
        !sectionRef.current ||
        !desktopRef.current ||
        !textStep1Ref.current ||
        !textStep2Ref.current ||
        !instructionRef.current
      )
        return;
  
      const isMobile = window.innerWidth < 768;
  
      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top top',
            end: '+=1200', // 📉 REDUCED from 1800 to eliminate dead scroll space!
            scrub: 0.6,
            pin: true,
            onUpdate: (self) => {
              if (progressBarRef.current) {
                const progressPct = Math.min(100, Math.max(0, self.progress * 100));
                progressBarRef.current.style.width = `${progressPct}%`;
              }
            },
          },
        });
  
        // Stage 1: Expand to full view
        tl.to(desktopRef.current, {
          width: '88vw',
          height: '80vh',
          x: 0,
          y: 0,
          borderRadius: '0px',
          borderColor: 'rgba(245, 158, 11, 0.5)',
          duration: 0.8,
          ease: 'power2.inOut',
        })
          .to(instructionRef.current, { opacity: 1, duration: 0.3 }, '-=0.3')
          .to({}, { duration: 0.3 }) // 📉 Reduced hold time
          .to(instructionRef.current, { opacity: 0, duration: 0.3 });
  
        // Stage 2: Move WM Window to the RIGHT & Fade in Text Step 1 on the LEFT
        if (isMobile) {
          tl.to(desktopRef.current, {
            height: '42vh',
            y: '-18vh',
            x: 0,
            duration: 1,
            ease: 'power2.inOut',
          }).fromTo(
            textStep1Ref.current,
            { opacity: 0, y: 25 },
            { opacity: 1, y: '10vh', duration: 1, ease: 'power2.out' },
            '<'
          );
        } else {
          tl.to(desktopRef.current, {
            width: '46vw',
            height: '66vh',
            x: '20vw',
            y: 0,
            duration: 1,
            ease: 'power2.inOut',
          }).fromTo(
            textStep1Ref.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
            '<'
          );
        }
  
        tl.to({}, { duration: 0.4 }); // 📉 Reduced hold time
  
        // Stage 3: Step 1 Out, Step 2 In
        tl.to(textStep1Ref.current, {
          opacity: 0,
          y: -25,
          duration: 0.6,
          ease: 'power2.in',
        }).fromTo(
          textStep2Ref.current,
          { opacity: 0, y: 25 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
        );
  
        tl.to({}, { duration: 0.4 }); // 📉 Reduced hold time before unpinning
      }, sectionRef);
  
      return () => ctx.revert();
    }, []);

  // Spawn extra window on demand
  const spawnWindow = () => {
    if (!desktopRef.current || windowsRef.current.length >= 4) return;
    const deskW = desktopRef.current.clientWidth;
    const id = Date.now();
    const wob = new FwmWobble();
    wob.reset(270, 170);
    const titles = ['kitty ~ zsh', 'mpv - video.mp4', 'htop • fwm', 'cargo build'];
    const title = titles[windowsRef.current.length % titles.length];

    const maxZ = Math.max(...windowsRef.current.map((w) => w.zIndex), 10);
    const spawnX = Math.random() * (deskW - 290) + 10;
    const spawnY = 50;
    windowsRef.current.push({
      id,
      title,
      x: spawnX,
      y: spawnY,
      vx: (Math.random() - 0.5) * 350,
      vy: 80,
      w: 270,
      h: 170,
      angle: 0,
      angvel: (Math.random() - 0.5) * 2,
      mass: Math.round((270 * 170 * 0.0005) * 10) / 10,
      isDragging: false,
      grabLxCenter: 0,
      grabLyCenter: -71,
      grabLx: 135,
      grabLy: 14,
      squashT: 0,
      squashAmount: 0,
      squashNx: 0,
      squashNy: 0,
      wobble: wob,
      activeDesktop: activeDesktop,
      zIndex: maxZ + 1,
      lastX: spawnX,
      lastY: spawnY,
    });
  };

  // Main Canvas & Physics Loop
  useEffect(() => {
    if (!desktopRef.current || !canvasRef.current) return;

    let shakeMag = 0;
    let shakeT = 0;

    let histX = [0, 0, 0, 0];
    let histY = [0, 0, 0, 0];
    let histTime = [0, 0, 0, 0];
    let histCount = 0;
    let swirlDir = 0;
    let swirlTime = 0;
    let swirlHave = false;
    let swirlAcc = 0;
    let swirlAbs = 0;
    let swirlSpan = 0;

    let pivotX = 0,
      pivotY = 0;
    let pivotVx = 0,
      pivotVy = 0;
    let pivotAx = 0,
      pivotAy = 0;
    let pivotHave = false;

    let activeDragWin: WindowBody | null = null;
    let dragTargetX = 0;
    let dragTargetY = 0;
    let dragCurX = 0;
    let dragCurY = 0;

    const physicsTick = (_time: number, deltaTime: number) => {
      const canvas = canvasRef.current;
      const desk = desktopRef.current;
      if (!canvas || !desk) return;
    
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
    
      const boundsW = desk.clientWidth;
      const boundsH = desk.clientHeight;
    
      if (canvas.width !== boundsW || canvas.height !== boundsH) {
        canvas.width = boundsW;
        canvas.height = boundsH;
      }
    
      const dt = Math.min(deltaTime / 1000, 0.033);
      const opts = optsRef.current;
    
      const currentGravity = opts.gravityOn
        ? opts.gravityType === 'earth'
          ? 981.0
          : opts.gravityType === 'moon'
          ? 162.0
          : 0.0
        : 0.0;
    
      let camOffsetX = 0;
      let camOffsetY = 0;
      if (shakeMag > 0.01) {
        shakeT += dt;
        shakeMag *= Math.exp(-9.0 * dt);
        camOffsetX = Math.round(shakeMag * Math.sin(shakeT * 38.0));
        camOffsetY = Math.round(shakeMag * Math.sin(shakeT * 47.0 + 1.3));
      } else {
        shakeMag = 0;
      }
    
      if (shakeWrapperRef.current) {
        shakeWrapperRef.current.style.transform = `translate(${camOffsetX}px, ${camOffsetY}px)`;
      }
    
      ctx.clearRect(0, 0, boundsW, boundsH);
      ctx.save();
    
      const winList = windowsRef.current;
    
      // =========================================================
      // 1. SAT OBB RIGID BODY WINDOW-TO-WINDOW COLLISION SOLVER
      // =========================================================
      for (let i = 0; i < winList.length; i++) {
        for (let j = i + 1; j < winList.length; j++) {
          const w1 = winList[i];
          const w2 = winList[j];
          if (w1.activeDesktop !== activeDesktop || w2.activeDesktop !== activeDesktop) continue;
    
          const col = testOBBCollision(w1, w2);
          if (!col) continue;
    
          const { normal, depth, contact } = col;
    
          // Baumgarte Positional Separation with Slop
          const slop = 0.5; // 0.5px tolerance
          const penToCorrect = Math.max(0, depth - slop);
          const percent = 0.6; // 60% separation per frame
          const sepX = normal.x * penToCorrect * percent;
          const sepY = normal.y * penToCorrect * percent;
    
          if (w1.isDragging && !w2.isDragging) {
            w2.x -= sepX * 2;
            w2.y -= sepY * 2;
          } else if (!w1.isDragging && w2.isDragging) {
            w1.x += sepX * 2;
            w1.y += sepY * 2;
          } else if (!w1.isDragging && !w2.isDragging) {
            w1.x += sepX;
            w1.y += sepY;
            w2.x -= sepX;
            w2.y -= sepY;
          }
    
          // Exact Corner Contact Vectors
          const c1x = w1.x + w1.w / 2;
          const c1y = w1.y + w1.h / 2;
          const c2x = w2.x + w2.w / 2;
          const c2y = w2.y + w2.h / 2;
    
          const r1x = contact.x - c1x;
          const r1y = contact.y - c1y;
          const r2x = contact.x - c2x;
          const r2y = contact.y - c2y;
    
          // Contact point velocities (Linear + Angular)
          const v1cx = w1.vx - (opts.rotationOn ? w1.angvel * r1y : 0);
          const v1cy = w1.vy + (opts.rotationOn ? w1.angvel * r1x : 0);
    
          const v2cx = w2.vx - (opts.rotationOn ? w2.angvel * r2y : 0);
          const v2cy = w2.vy + (opts.rotationOn ? w2.angvel * r2x : 0);
    
          const relVx = v1cx - v2cx;
          const relVy = v1cy - v2cy;
    
          const velAlongNormal = relVx * normal.x + relVy * normal.y;
    
          // Apply impulse only if moving toward each other at contact point
          if (velAlongNormal < 0) {
            const approachSpeed = -velAlongNormal;
            const restitution = approachSpeed > 150 ? 0.25 : 0.0;
    
            const invM1 = 1 / w1.mass;
            const invM2 = 1 / w2.mass;
    
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
              if (opts.rotationOn) {
                w1.angvel += (r1x * impulseY - r1y * impulseX) * invI1;
              }
            }
            if (!w2.isDragging) {
              w2.vx -= impulseX * invM2;
              w2.vy -= impulseY * invM2;
              if (opts.rotationOn) {
                w2.angvel -= (r2x * impulseY - r2y * impulseX) * invI2;
              }
            }
    
            // Tangent Friction along contact edge
            const tx = -normal.y;
            const ty = normal.x;
            const velAlongTangent = relVx * tx + relVy * ty;
    
            const r1CrossT = r1x * ty - r1y * tx;
            const r2CrossT = r2x * ty - r2y * tx;
            const invMassSumTan = invM1 + invM2 + (r1CrossT * r1CrossT) * invI1 + (r2CrossT * r2CrossT) * invI2;
    
            const friction = 0.25;
            const maxFriction = Math.abs(jImpulse) * friction;
            const jTangent = Math.max(-maxFriction, Math.min(maxFriction, -velAlongTangent / invMassSumTan));
    
            const tanImpulseX = jTangent * tx;
            const tanImpulseY = jTangent * ty;
    
            if (!w1.isDragging) {
              w1.vx += tanImpulseX * invM1;
              w1.vy += tanImpulseY * invM1;
              if (opts.rotationOn) {
                w1.angvel += (r1x * tanImpulseY - r1y * tanImpulseX) * invI1;
              }
            }
            if (!w2.isDragging) {
              w2.vx -= tanImpulseX * invM2;
              w2.vy -= tanImpulseY * invM2;
              if (opts.rotationOn) {
                w2.angvel -= (r2x * tanImpulseY - r2y * tanImpulseX) * invI2;
              }
            }
    
            w1.angvel = Math.max(-6.0, Math.min(6.0, w1.angvel));
            w2.angvel = Math.max(-6.0, Math.min(6.0, w2.angvel));
    
            // Sound & Screen Shake
            if (approachSpeed > 150 && performance.now() - lastSoundTimeRef.current > 90) {
              lastSoundTimeRef.current = performance.now();
              playKnockSound(approachSpeed, opts.soundOn);
    
              const f = Math.min(1.0, approachSpeed / 2000.0);
              const mag = 12.0 * f * f;
              if (mag > shakeMag) {
                shakeMag = mag;
                shakeT = 0;
              }
            }
          }
    
          // Resting Damping
          if (Math.abs(velAlongNormal) < 80) {
            if (!w1.isDragging) {
              w1.angvel *= 0.85;
              if (Math.abs(w1.angvel) < 0.05) w1.angvel = 0;
            }
            if (!w2.isDragging) {
              w2.angvel *= 0.85;
              if (Math.abs(w2.angvel) < 0.05) w2.angvel = 0;
            }
          }
        }
      }
    
      // ==========================================
      // 2. WINDOW STEP, WALL BOUNDS & RENDERING
      // ==========================================
      const sortedWindows = [...winList].sort((a, b) => a.zIndex - b.zIndex);
    
      sortedWindows.forEach((win) => {
        if (win.activeDesktop !== activeDesktop) return;
    
        if (opts.massMode === 'ram') {
          win.mass = 342.0;
        } else {
          win.mass = Math.round(win.w * win.h * 0.0005 * 10) / 10;
        }
    
        const moveDx = win.x - win.lastX;
        const moveDy = win.y - win.lastY;
        if (opts.wobbleOn && (moveDx !== 0 || moveDy !== 0)) {
          win.wobble.translate(moveDx, moveDy);
        }
        win.lastX = win.x;
        win.lastY = win.y;
    
        if (win.isDragging) {
          const px = dragCurX;
          const py = dragCurY;
    
          win.vx = (dragTargetX - win.x) / dt;
          win.vy = (dragTargetY - win.y) / dt;
    
          if (opts.rotationOn) {
            if (!pivotHave) {
              pivotX = px;
              pivotY = py;
              pivotVx = 0;
              pivotVy = 0;
              pivotAx = 0;
              pivotAy = 0;
              pivotHave = true;
            } else {
              const nvx = (px - pivotX) / dt;
              const nvy = (py - pivotY) / dt;
              const kv = dt / (dt + 0.04);
              const svx = pivotVx + (nvx - pivotVx) * kv;
              const svy = pivotVy + (nvy - pivotVy) * kv;
    
              const rax = (svx - pivotVx) / dt;
              const ray = (svy - pivotVy) / dt;
              const ka = dt / (dt + 0.08);
              pivotAx += (rax - pivotAx) * ka;
              pivotAy += (ray - pivotAy) * ka;
    
              pivotAx = Math.max(-20000, Math.min(20000, pivotAx));
              pivotAy = Math.max(-20000, Math.min(20000, pivotAy));
    
              pivotX = px;
              pivotY = py;
              pivotVx = svx;
              pivotVy = svy;
    
              const c = Math.cos(win.angle),
                s = Math.sin(win.angle);
              const rx = -(c * win.grabLxCenter - s * win.grabLyCenter);
              const ry = -(s * win.grabLxCenter + c * win.grabLyCenter);
    
              const gy = currentGravity;
              const ex = -pivotAx;
              const ey = gy - pivotAy;
    
              const inertia = (win.w * win.w + win.h * win.h) / 12.0 + (rx * rx + ry * ry);
              if (inertia > 1.0) {
                const alpha = (rx * ey - ry * ex) / inertia;
                win.angvel += alpha * dt;
              }
    
              win.angvel *= Math.exp(-1.2 * dt);
              win.angvel = Math.max(-8.0, Math.min(8.0, win.angvel));
              win.angle += win.angvel * dt;
    
              const cx = px + rx;
              const cy = py + ry;
              win.x = cx - win.w / 2;
              win.y = cy - win.h / 2;
            }
          } else {
            win.x = dragTargetX;
            win.y = dragTargetY;
          }
        } else {
          win.vy += currentGravity * dt;
    
          const airDamping = currentGravity > 0 ? 0.985 : 0.995;
          const damp = Math.pow(airDamping, dt * 60);
          win.vx *= damp;
          win.vy *= damp;
    
          win.x += win.vx * dt;
          win.y += win.vy * dt;
    
          if (opts.rotationOn) {
            win.angle += win.angvel * dt;
            win.angvel *= Math.exp(-0.35 * dt);
            win.angvel = Math.max(-8.0, Math.min(8.0, win.angvel));
          } else {
            win.angle = 0;
            win.angvel = 0;
          }
    
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
            cx = extX;
            win.x = cx - win.w / 2;
            if (win.vx < 0) {
              win.vx = Math.abs(win.vx) * wallRestitution;
              if (opts.rotationOn) {
                win.angvel = Math.max(-8.0, Math.min(8.0, win.angvel + (Math.random() - 0.5) * 0.8));
              }
              hit = true;
              hitSpeed = Math.abs(win.vx);
            }
          }
    
          if (cx + extX > boundsW) {
            cx = boundsW - extX;
            win.x = cx - win.w / 2;
            if (win.vx > 0) {
              win.vx = -Math.abs(win.vx) * wallRestitution;
              if (opts.rotationOn) {
                win.angvel = Math.max(-8.0, Math.min(8.0, win.angvel + (Math.random() - 0.5) * 0.8));
              }
              hit = true;
              hitSpeed = Math.abs(win.vx);
            }
          }
    
          if (cy - extY < 0) {
            cy = extY;
            win.y = cy - win.h / 2;
            if (win.vy < 0) {
              win.vy = Math.abs(win.vy) * wallRestitution;
              hit = true;
              hitSpeed = Math.abs(win.vy);
            }
          }
    
          if (cy + extY > boundsH) {
            cy = boundsH - extY;
            win.y = cy - win.h / 2;
    
            if (win.vy > 0) {
              win.vy = -Math.abs(win.vy) * wallRestitution;
              win.vx *= 0.85;
              hit = true;
              hitSpeed = Math.abs(win.vy);
            }
    
            if (opts.rotationOn) {
              let normAngle = win.angle % (Math.PI * 2);
              if (normAngle > Math.PI) normAngle -= Math.PI * 2;
              if (normAngle < -Math.PI) normAngle += Math.PI * 2;
    
              const targets = [-Math.PI, -Math.PI / 2, 0, Math.PI / 2, Math.PI];
              let nearestTarget = 0;
              let minDiff = Infinity;
              for (const target of targets) {
                const diff = Math.abs(normAngle - target);
                if (diff < minDiff) {
                  minDiff = diff;
                  nearestTarget = target;
                }
              }
    
              const angleDiff = nearestTarget - normAngle;
    
              if (currentGravity > 0) {
                win.angvel += 14.0 * Math.sin(angleDiff) * dt;
              }
              win.angvel *= Math.exp(-4.0 * dt);
    
              if (Math.abs(angleDiff) < 0.15 && Math.abs(win.angvel) < 0.8 && Math.abs(win.vy) < 25) {
                win.angle = nearestTarget;
                win.angvel = 0;
                if (Math.abs(win.vy) < 15) win.vy = 0;
              }
            }
          }
    
          win.angvel = Math.max(-8.0, Math.min(8.0, win.angvel));
    
          if (hit && hitSpeed > 120) {
            win.squashT = 0;
            win.squashAmount = Math.min(0.24, hitSpeed / 900.0);
            win.squashNx = 0;
            win.squashNy = -1;
    
            const f = Math.min(1.0, hitSpeed / 2000.0);
            const mag = 12.0 * f * f;
            if (mag > shakeMag) {
              shakeMag = mag;
              shakeT = 0;
            }
    
            playKnockSound(hitSpeed, opts.soundOn);
          }
        }
    
        if (opts.wobbleOn) {
          win.wobble.step(dt);
        }
    
        let sx = 1.0,
          sy = 1.0;
        if (win.squashAmount > 0.001) {
          win.squashT += dt;
          const env = win.squashAmount * Math.exp(-12.0 * win.squashT);
          if (env < 0.004) {
            win.squashAmount = 0;
          } else {
            const a = Math.min(0.45, Math.max(-0.45, env * Math.cos(14.0 * win.squashT)));
            const ax = Math.abs(win.squashNx);
            const ay = Math.abs(win.squashNy);
            sx = 1.0 - a * ax + a * 0.45 * ay;
            sy = 1.0 - a * ay + a * 0.45 * ax;
          }
        }
    
        // ==========================================
        // 3. TELEMETRY DISPLAY (DIRECT DOM UPDATE)
        // ==========================================
        const isFocused = win.isDragging || focusedTitleRef.current === win.title;
        if (isFocused) {
          if (win.isDragging) {
            focusedTitleRef.current = win.title;
          }
          const speed = Math.round(Math.hypot(win.vx, win.vy));
          const angle = Math.round(((win.angle * 180) / Math.PI) % 360);
          const telemetryText = `${win.title} • ${angle}° • ${speed}px/s • m ${win.mass}`;
    
          if (telemetryRef.current && lastTelemetryTextRef.current !== telemetryText) {
            telemetryRef.current.textContent = telemetryText;
            lastTelemetryTextRef.current = telemetryText;
          }
        }
    
        // ==========================================
        // 4. CANVAS TEXTURE RENDERING & DRAWING
        // ==========================================
        const texCanvas = getWindowTextureCanvas(win, windowTextureMapRef.current, isFocused);
    
        ctx.save();
        ctx.translate(win.x + win.w / 2, win.y + win.h / 2);
    
        if (opts.rotationOn && win.angle !== 0) {
          ctx.rotate(win.angle);
        }
        ctx.translate(-win.w / 2, -win.h / 2);
    
        if (opts.wobbleOn && win.isDragging) {
          const grid = WOBBLE_GRID;
          const gridStepU = win.w / (grid - 1);
          const gridStepV = win.h / (grid - 1);
    
          ctx.save();
          ctx.scale(sx, sy);
    
          for (let j = 0; j < grid - 1; j++) {
            for (let i = 0; i < grid - 1; i++) {
              const k00 = j * grid + i;
              const k10 = j * grid + (i + 1);
              const k11 = (j + 1) * grid + (i + 1);
              const k01 = (j + 1) * grid + i;
    
              const x00 = win.wobble.px[k00],
                y00 = win.wobble.py[k00];
              const x10 = win.wobble.px[k10],
                y10 = win.wobble.py[k10];
              const x11 = win.wobble.px[k11],
                y11 = win.wobble.py[k11];
              const x01 = win.wobble.px[k01],
                y01 = win.wobble.py[k01];
    
              const u0 = i * gridStepU,
                v0 = j * gridStepV;
              const u1 = (i + 1) * gridStepU,
                v1 = (j + 1) * gridStepV;
    
              drawTriangle(ctx, texCanvas, x00, y00, u0, v0, x10, y10, u1, v0, x11, y11, u1, v1);
              drawTriangle(ctx, texCanvas, x00, y00, u0, v0, x11, y11, u1, v1, x01, y01, u0, v1);
            }
          }
          ctx.restore();
        } else {
          ctx.scale(sx, sy);
          ctx.drawImage(texCanvas, 0, 0);
        }
    
        ctx.restore();
      });
    
      ctx.restore();
    };

    gsap.ticker.add(physicsTick);

    const handlePointerDown = (e: PointerEvent) => {
      if (!desktopRef.current || !canvasRef.current) return;
      const deskRect = desktopRef.current.getBoundingClientRect();
      const clickX = e.clientX - deskRect.left;
      const clickY = e.clientY - deskRect.top;

      const winList = windowsRef.current;
      for (let i = winList.length - 1; i >= 0; i--) {
        const win = winList[i];
        if (win.activeDesktop !== activeDesktop) continue;

        const { localX, localY } = getLocalWindowCoords(win, clickX, clickY);

        if (localX >= 0 && localX <= win.w && localY >= 0 && localY <= win.h) {
          const maxZ = Math.max(...winList.map((w) => w.zIndex), 10);
          win.zIndex = maxZ + 1;

          if (localY <= 28 && localX >= win.w - 24 && localX <= win.w - 4) {
            delete windowTextureMapRef.current[win.id];
            winList.splice(i, 1);
            return;
          }

          if (localY <= 28) {
            activeDragWin = win;
            win.isDragging = true;
            desktopRef.current.style.cursor = 'grabbing';

            win.grabLxCenter = localX - win.w / 2;
            win.grabLyCenter = localY - win.h / 2;

            win.grabLx = localX;
            win.grabLy = localY;

            dragTargetX = clickX - localX;
            dragTargetY = clickY - localY;
            dragCurX = clickX;
            dragCurY = clickY;

            win.wobble.grab(localX, localY);

            pivotHave = false;
            histCount = 0;
            swirlHave = false;
            swirlAcc = 0;
            swirlAbs = 0;
            swirlSpan = 0;
            break;
          }
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!desktopRef.current) return;
      if (!deskRectRef.current) {
         deskRectRef.current = desktopRef.current.getBoundingClientRect();
       }
       const deskRect = deskRectRef.current;
       const curLx = e.clientX - deskRect.left;
       const curLy = e.clientY - deskRect.top;

      if (!activeDragWin) {
        let hovered = false;
        const winList = windowsRef.current;
        for (let i = winList.length - 1; i >= 0; i--) {
          const win = winList[i];
          if (win.activeDesktop !== activeDesktop) continue;
          const { localX, localY } = getLocalWindowCoords(win, curLx, curLy);
          if (localX >= 0 && localX <= win.w && localY >= 0 && localY <= win.h) {
            if (localY <= 28 && localX >= win.w - 24 && localX <= win.w - 4) {
              desktopRef.current.style.cursor = 'pointer';
            } else if (localY <= 28) {
              desktopRef.current.style.cursor = 'grab';
            } else {
              desktopRef.current.style.cursor = 'default';
            }
            hovered = true;
            break;
          }
        }
        if (!hovered) desktopRef.current.style.cursor = 'default';
        return;
      }

      dragCurX = curLx;
      dragCurY = curLy;
      dragTargetX = curLx - activeDragWin.grabLx;
      dragTargetY = curLy - activeDragWin.grabLy;

      const now = performance.now() / 1000;
      histX.shift();
      histX.push(curLx);
      histY.shift();
      histY.push(curLy);
      histTime.shift();
      histTime.push(now);
      if (histCount < 4) histCount++;

      if (histCount >= 2) {
        const oldest = 4 - histCount;
        const dtS = now - histTime[oldest];
        if (dtS > 0.001) {
          const vx = (curLx - histX[oldest]) / dtS;
          const vy = (curLy - histY[oldest]) / dtS;
          const speed = Math.hypot(vx, vy);

          if (optsRef.current.rotationOn && speed > 150.0) {
            const dir = Math.atan2(vy, vx);
            if (!swirlHave) {
              swirlDir = dir;
              swirlTime = now;
              swirlHave = true;
            } else {
              const dtSwirl = now - swirlTime;
              if (dtSwirl >= 0.02) {
                let d = dir - swirlDir;
                while (d > Math.PI) d -= 2 * Math.PI;
                while (d < -Math.PI) d += 2 * Math.PI;

                if (dtSwirl < 0.2 && Math.abs(d) < Math.PI / 2.0) {
                  const decay = Math.exp(-dtSwirl / 0.2);
                  swirlAcc = swirlAcc * decay + d;
                  swirlAbs = swirlAbs * decay + Math.abs(d);
                  swirlSpan = swirlSpan * decay + dtSwirl;

                  if (swirlSpan > 0.05 && swirlAbs > 1e-6) {
                    const coh = Math.abs(swirlAcc) / swirlAbs;
                    let omega = (swirlAcc / swirlSpan) * 0.7 * coh * coh;
                    omega = Math.max(-6.0, Math.min(6.0, omega));

                    if (Math.abs(omega) >= 0.4) {
                      activeDragWin.angvel += (omega - activeDragWin.angvel) * 0.15;
                    }
                  }
                }
                swirlDir = dir;
                swirlTime = now;
              }
            }
          }
        }
      }
    };

    const handlePointerUp = () => {
      if (!activeDragWin) return;
      const win = activeDragWin;
      win.isDragging = false;
      win.wobble.release();

      const now = performance.now() / 1000;

      let throwVx = 0;
      let throwVy = 0;
      if (histCount >= 2) {
        const oldest = 4 - histCount;
        const dtS = now - histTime[oldest];
        if (dtS > 0.01) {
          throwVx = ((dragCurX - histX[oldest]) / dtS) * 0.65;
          throwVy = ((dragCurY - histY[oldest]) / dtS) * 0.65;
        }
      }

      const throwSpeed = Math.hypot(throwVx, throwVy);
      if (throwSpeed > 1800) {
        const scale = 1800 / throwSpeed;
        throwVx *= scale;
        throwVy *= scale;
      }

      win.vx = throwVx;
      win.vy = throwVy;

      if (optsRef.current.rotationOn) {
        win.angvel = Math.max(-6.0, Math.min(6.0, win.angvel));
      }

      activeDragWin = null;
      pivotHave = false;
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

  return (
    <>
    <div className="py-12 px-4 text-center space-y-4 z-10 relative">
      <div className="inline-flex items-center space-x-2 px-3.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs uppercase tracking-widest rounded-none">
        <span>Interactive Compositor Sandbox</span>
      </div>
    
      <h2 className="font-display italic text-3xl sm:text-5xl font-bold text-slate-100">
        Scroll down to{' '}
        <span className="inline-block">
          <ProximityText
            text="taste the physics"
            preset="tiltCard-magnetic-opacity-glow"
            textClassName="font-display italic font-bold text-amber-400 px-1 cursor-pointer hover:text-amber-300 transition-colors drop-shadow-[0_0_25px_rgba(208,168,44,0.45)]"
            reach={2}
            duration={1}
            opacity={[0.7, 1]}
            glow={[0, 6]}
            ease="elastic"
            splitBy="letter"
          />
        </span>{' '}
        yourself
      </h2>
    
      <p className="font-body text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-light leading-relaxed">
        Experience fwm's Box2D 3.x rigid body dynamics, corner pendulum torque, swirl spin momentum, 9x9 wobble mesh, and collision knock sound.
      </p>
    
      {/* DISCLAIMER BANNER */}
      <div className="pt-2 flex justify-center">
        <div
          className="inline-flex items-center space-x-3 px-5 py-2.5 bg-slate-900/90 border border-amber-500/25 text-slate-300 font-mono text-xs max-w-2xl text-left shadow-xl"
          style={{ clipPath: 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)' }}
        >
          <span className="text-amber-400 font-bold shrink-0 text-sm">💡 Disclaimer:</span>
          <span className="text-[11px] text-slate-400 font-light leading-snug">
            This in-browser sandbox is a web simulation for demonstration purposes. The actual native C11 <code className="text-amber-300 font-mono bg-slate-950 px-1 py-0.5 border border-slate-800">fwm</code> Wayland compositor has significantly more features (3D cylinder Expo workspaces, Tab stacking, real PipeWire CAVA FFT spectrums, and <code className="text-amber-300 font-mono bg-slate-950 px-1 py-0.5 border border-slate-800">fwmctl</code> IPC) unconstrained by browser limits.
          </span>
        </div>
      </div>
    </div>

      <section id="physics" ref={sectionRef} className="relative w-full h-screen">
        <div className="w-full h-screen flex items-center justify-center overflow-hidden relative">
          {/* MULTI-STEP EXPLANATION TEXT COLUMN (LEFT SIDE) */}
          <div className="absolute left-[4vw] top-[18vh] w-[90vw] md:w-[40vw] z-30 pointer-events-none">
            {/* Step 1: Real-World Dynamics */}
            <div ref={textStep1Ref} className="opacity-0 space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs uppercase tracking-widest rounded-none">
                <span>01 • Rigid Body Dynamics</span>
              </div>
              <h3 className="font-display italic text-3xl md:text-5xl font-bold text-slate-100 drop-shadow-md">
                Physics-First <span className="text-amber-400">Window Control</span>
              </h3>
              <p className="font-body text-slate-300 text-sm md:text-base font-light leading-relaxed">
                In <strong className="text-slate-100">fwm</strong>, window bodies are driven by Box2D 3.x via <code className="text-amber-300 font-mono text-xs bg-slate-900 px-1.5 py-0.5 border border-slate-800">src/physics.c</code>. Every window is an impulse-driven body rather than a static coordinate assignment.
              </p>
              <ul className="space-y-2.5 pt-1 font-body text-xs md:text-sm text-slate-300">
                <li className="flex items-start space-x-2.5">
                  <span className="text-amber-400 font-mono font-bold">✓</span>
                  <span><strong className="text-slate-100">Mass Modes:</strong> Area ratio (<code className="text-amber-300 font-mono text-xs">mass_density = 0.0005</code>) or dynamic application RSS footprint from <code className="text-amber-300 font-mono text-xs">/proc/$PID/stat</code> (<code className="text-amber-300 font-mono text-xs">mass = "ram"</code>).</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-amber-400 font-mono font-bold">✓</span>
                  <span><strong className="text-slate-100">Zero-G Start & Gravity:</strong> Sessions boot in zero-g. <code className="text-amber-300 font-mono text-xs">Super+G</code> cycles gravity steps (<code className="text-amber-300 font-mono text-xs">gravity = 981.0 px/s²</code> at 100 px/m scale).</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-amber-400 font-mono font-bold">✓</span>
                  <span><strong className="text-slate-100">Impulse & Friction:</strong> Impulse-based Box2D collisions with 0.3 restitution and contact friction stop sliding windows naturally.</span>
                </li>
              </ul>
            </div>
            
            {/* Step 2: Under The Hood Architecture */}
            <div ref={textStep2Ref} className="opacity-0 absolute top-0 left-0 w-full space-y-4">
              <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs uppercase tracking-widest rounded-none">
                <span>02 • Under The Hood</span>
              </div>
              <h3 className="font-display italic text-3xl md:text-5xl font-bold text-slate-100 drop-shadow-md">
                Engineered in C for <span className="text-amber-400">Wayland</span>
              </h3>
              <p className="font-body text-slate-300 text-sm md:text-base font-light leading-relaxed">
                Built natively in C11 on <code className="text-amber-300 font-mono text-xs bg-slate-900 px-1.5 py-0.5 border border-slate-800">wlroots 0.20</code> and <code className="text-amber-300 font-mono text-xs bg-slate-900 px-1.5 py-0.5 border border-slate-800">Box2D 3.x</code> for zero sub-pixel jitter.
              </p>
              <ul className="space-y-2.5 pt-1 font-body text-xs md:text-sm text-slate-300">
                <li className="flex items-start space-x-2.5">
                  <span className="text-amber-400 font-mono font-bold">✓</span>
                  <span><strong className="text-slate-100">Box2D Integration:</strong> Fixed 1/60s simulation tick with accumulator. Real impulse collisions, resting contact, and proper mass ratios.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-amber-400 font-mono font-bold">✓</span>
                  <span><strong className="text-slate-100">9x9 Spring Lattice:</strong> Hooke's Law mesh (<code className="text-amber-300 font-mono text-xs">src/wobble.c</code>) deforms dragged windows using fixed 2.08ms sub-steps.</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-amber-400 font-mono font-bold">✓</span>
                  <span><strong className="text-slate-100">CAVA Physical Bars:</strong> Real-time FFT audio loopback turns floor bars into solid bodies that toss windows into the air!</span>
                </li>
                <li className="flex items-start space-x-2.5">
                  <span className="text-amber-400 font-mono font-bold">✓</span>
                  <span><strong className="text-slate-100">Procedural Audio Knock:</strong> In-engine audio synthesis (<code className="text-amber-300 font-mono text-xs">src/sound.c</code>) generates collision clicks based on approach velocity.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* SIMULATED WM WINDOW (GLIDES TO THE RIGHT SIDE) */}
          <div
            ref={desktopRef}
            className="relative w-[340px] h-[230px] bg-slate-900/95 border border-slate-800 rounded-none overflow-hidden z-20 will-change-transform select-none shadow-2xl"
          >
            {/* SCROLL PROGRESS BAR AT TOP OF SIMULATED WM WINDOW */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-950/80 z-50 overflow-hidden">
              <div
                ref={progressBarRef}
                className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 w-0 transition-all duration-75 shadow-[0_0_10px_#d0a82c]"
              />
            </div>

            <div
              ref={shakeWrapperRef}
              className="relative w-full h-full flex flex-col justify-between items-center will-change-transform"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.06)_0%,_transparent_75%)] pointer-events-none" />

              <header className="w-full px-3 pt-3 flex items-center justify-between z-30 pointer-events-auto select-none">
                <div
                  className="px-3 py-1 bg-[#131519]/90 border border-slate-700/50 text-amber-400 font-mono text-[10px] flex items-center space-x-1.5"
                  style={{
                    clipPath:
                      'polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-none bg-amber-400 animate-pulse" />
                  <span ref={telemetryRef}>
                    fwm-terminal • 0° • 0px/s • m 25.2
                  </span>
                </div>

                <div
                  className="px-3 py-1 bg-[#131519]/90 border border-slate-700/50 flex items-center space-x-1.5 relative"
                  style={{
                    clipPath:
                      'polygon(10px 0%, calc(100% - 10px) 0%, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0% 50%)',
                  }}
                >
                  {Array.from({ length: 10 }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveDesktop(i)}
                      aria-label={`Switch to Desktop ${i + 1}`}
                      className={`w-5 h-5 cursor-pointer flex items-center justify-center transition-all ${
                        activeDesktop === i ? 'scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 transition-all flex items-center justify-center text-[7px] font-mono font-bold ${
                          activeDesktop === i
                            ? 'bg-[#e8ecf0] text-slate-950 shadow-[0_0_8px_#ffffff]'
                            : 'bg-slate-700 text-transparent'
                        }`}
                      >
                        {activeDesktop === i ? '•' : ''}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1.5 relative">
                  <div
                    className="px-2.5 py-1 bg-[#131519]/90 border border-slate-700/50 text-[#e8ecf0] font-mono text-[10px] font-bold"
                    style={{
                      clipPath:
                        'polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)',
                    }}
                  >
                    <span>{clock || '21:42'}</span>
                  </div>

                  <button
                    onClick={() => setShowModes(!showModes)}
                    className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-[10px] font-bold transition-colors cursor-pointer"
                    style={{
                      clipPath:
                        'polygon(8px 0%, calc(100% - 8px) 0%, 100% 50%, calc(100% - 8px) 100%, 8px 100%, 0% 50%)',
                    }}
                  >
                    ⚙ Modes
                  </button>

                  {showModes && (
                    <div
                      className="absolute top-9 right-0 w-60 bg-[#131519]/95 border border-amber-500/40 p-3 z-40 font-mono text-xs space-y-2.5 text-[#e8ecf0]"
                      style={{
                        clipPath:
                          'polygon(12px 0%, calc(100% - 12px) 0%, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0% 50%)',
                      }}
                    >
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Gravity</span>
                        <button
                          onClick={() => setGravityOn(!gravityOn)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-none cursor-pointer ${
                            gravityOn ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {gravityOn ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span>Preset</span>
                        <div className="flex space-x-1">
                          {(['earth', 'moon', 'space'] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => {
                                setGravityType(type);
                                setGravityOn(type !== 'space');
                              }}
                              className={`px-1.5 py-0.5 text-[9px] uppercase font-bold rounded-none cursor-pointer ${
                                gravityType === type && gravityOn
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span>Mass Mode</span>
                        <div className="flex space-x-1">
                          {(['size', 'ram'] as const).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setMassMode(mode)}
                              className={`px-1.5 py-0.5 text-[9px] uppercase font-bold rounded-none cursor-pointer ${
                                massMode === mode
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span>Free Rotation</span>
                        <button
                          onClick={() => setRotationOn(!rotationOn)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-none cursor-pointer ${
                            rotationOn ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {rotationOn ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span>Wobble Jelly</span>
                        <button
                          onClick={() => setWobbleOn(!wobbleOn)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-none cursor-pointer ${
                            wobbleOn ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {wobbleOn ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span>Collision Knock</span>
                        <button
                          onClick={() => setSoundOn(!soundOn)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-none cursor-pointer ${
                            soundOn ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {soundOn ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      <button
                        onClick={spawnWindow}
                        className="w-full py-1 mt-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-none cursor-pointer text-center text-[10px]"
                      >
                        + Spawn Extra Window
                      </button>
                    </div>
                  )}
                </div>
              </header>

              <div
                ref={instructionRef}
                className="absolute top-14 px-5 py-1.5 bg-slate-950/90 backdrop-blur-sm border border-amber-500/40 rounded-none font-mono text-xs text-amber-300 opacity-0 pointer-events-none z-20 transition-opacity shadow-lg"
              >
                Drag titlebar to throw, click red dot to close window, or stir cursor to spin!
              </div>

              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-auto" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
