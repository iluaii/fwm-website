import React, { useEffect, useRef, useState } from 'react';
import { FwmWobble } from '../lib/physics/FwmWobble';
import type { WindowBody } from '../types/physics';

import { PhysicsIntro } from './physics/PhysicsIntro';
import { PhysicsTextSteps } from './physics/PhysicsTextSteps';
import { DesktopHeader } from './physics/DesktopHeader';
import { useScrollSequence } from './physics/useScrollSequence';
import { usePhysicsEngine } from './physics/usePhysicsEngine';

export const PhysicsSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const shakeWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const textStep1Ref = useRef<HTMLDivElement>(null);
  const textStep2Ref = useRef<HTMLDivElement>(null);
  const instructionRef = useRef<HTMLDivElement>(null);
  const telemetryRef = useRef<HTMLSpanElement>(null);

  const windowTextureMapRef = useRef<{ [key: number]: HTMLCanvasElement }>({});
  const focusedTitleRef = useRef<string>('fwm-terminal');
  const lastTelemetryTextRef = useRef<string>('');
  const lastSoundTimeRef = useRef<number>(0);
  const lastTelemetryDataRef = useRef({ angle: -1, speed: -1, mass: -1, title: '' });
  const sortedWindowsRef = useRef<WindowBody[]>([]);
  const windowsRef = useRef<WindowBody[]>([]);

  const [clock, setClock] = useState('');
  const [activeDesktop, setActiveDesktop] = useState(0);

  const [gravityOn, setGravityOn] = useState(true);
  const [gravityType, setGravityType] = useState<'earth' | 'moon' | 'space'>('earth');
  const [rotationOn, setRotationOn] = useState(true);
  const [wobbleOn, setWobbleOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [bspTilingOn, setBspTilingOn] = useState(false);
  const [breakableOn, setBreakableOn] = useState(false);
  const [massMode, setMassMode] = useState<'size' | 'ram'>('size');
  const [showModes, setShowModes] = useState(false);

  // Sync physics toggles internally for the hook
  const optsRef = useRef({ gravityOn, gravityType, rotationOn, wobbleOn, soundOn, massMode, bspTilingOn, breakableOn });
  useEffect(() => {
    optsRef.current = { gravityOn, gravityType, rotationOn, wobbleOn, soundOn, massMode, bspTilingOn, breakableOn };
  }, [gravityOn, gravityType, rotationOn, wobbleOn, soundOn, massMode, bspTilingOn, breakableOn]);

  useEffect(() => {
    const wob = new FwmWobble();
    wob.reset(280, 180);
    windowsRef.current = [
      { id: 101, title: 'fwm-terminal', x: 180, y: 60, vx: 0, vy: 0, w: 280, h: 180, angle: 0, angvel: 0, mass: Math.round((280 * 180 * 0.0005) * 10) / 10, isDragging: false, grabLxCenter: 0, grabLyCenter: -76, grabLx: 140, grabLy: 14, squashT: 0, squashAmount: 0, squashNx: 0, squashNy: 0, wobble: wob, activeDesktop: 0, zIndex: 10, lastX: 180, lastY: 60 },
    ];
  }, []);

  useEffect(() => {
    const updateTime = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    updateTime(); const interval = setInterval(updateTime, 1000); return () => clearInterval(interval);
  }, []);

  const spawnWindow = () => {
    if (!desktopRef.current || windowsRef.current.length >= 4) return;
    const deskW = desktopRef.current.clientWidth;
    const wob = new FwmWobble(); wob.reset(270, 170);
    const titles = ['kitty ~ zsh', 'mpv - video.mp4', 'htop • fwm', 'cargo build'];
    windowsRef.current.push({
      id: Date.now(), title: titles[windowsRef.current.length % titles.length], x: Math.random() * (deskW - 290) + 10, y: 50, vx: (Math.random() - 0.5) * 350, vy: 80, w: 270, h: 170, angle: 0, angvel: (Math.random() - 0.5) * 2, mass: Math.round((270 * 170 * 0.0005) * 10) / 10, isDragging: false, grabLxCenter: 0, grabLyCenter: -71, grabLx: 135, grabLy: 14, squashT: 0, squashAmount: 0, squashNx: 0, squashNy: 0, wobble: wob, activeDesktop: activeDesktop, zIndex: Math.max(...windowsRef.current.map((w) => w.zIndex), 10) + 1, lastX: 0, lastY: 0
    });
  };

  useScrollSequence({ sectionRef, desktopRef, textStep1Ref, textStep2Ref, instructionRef, progressBarRef });
  usePhysicsEngine({ activeDesktop, desktopRef, canvasRef, shakeWrapperRef, telemetryRef, optsRef, windowsRef, windowTextureMapRef, sortedWindowsRef, focusedTitleRef, lastTelemetryTextRef, lastSoundTimeRef, lastTelemetryDataRef });

  return (
    <>
      <PhysicsIntro />
      <section id="physics" ref={sectionRef} className="relative w-full h-screen">
        <div className="w-full h-screen flex items-center justify-center overflow-hidden relative">
          
          <PhysicsTextSteps textStep1Ref={textStep1Ref} textStep2Ref={textStep2Ref} />

          <div ref={desktopRef} className="relative w-[340px] h-[230px] bg-slate-900/95 border border-slate-800 rounded-none overflow-hidden z-20 will-change-transform select-none shadow-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-950/80 z-50 overflow-hidden">
              <div ref={progressBarRef} className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 w-0 transition-all duration-75 shadow-[0_0_10px_#d0a82c]" />
            </div>

            <div ref={shakeWrapperRef} className="relative w-full h-full flex flex-col justify-between items-center will-change-transform">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.06)_0%,_transparent_75%)] pointer-events-none" />

              <DesktopHeader 
                telemetryRef={telemetryRef} clock={clock} activeDesktop={activeDesktop} setActiveDesktop={setActiveDesktop} showModes={showModes} setShowModes={setShowModes} gravityOn={gravityOn} setGravityOn={setGravityOn} gravityType={gravityType} setGravityType={setGravityType} massMode={massMode} setMassMode={setMassMode} rotationOn={rotationOn} setRotationOn={setRotationOn} wobbleOn={wobbleOn} setWobbleOn={setWobbleOn} soundOn={soundOn} setSoundOn={setSoundOn} bspTilingOn={bspTilingOn} setBspTilingOn={setBspTilingOn} breakableOn={breakableOn} setBreakableOn={setBreakableOn} spawnWindow={spawnWindow} 
              />

              <div ref={instructionRef} className="absolute top-14 px-5 py-1.5 bg-slate-950/90 backdrop-blur-sm border border-amber-500/40 rounded-none font-mono text-xs text-amber-300 opacity-0 pointer-events-none z-20 transition-opacity shadow-lg">
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