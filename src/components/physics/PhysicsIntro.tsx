import React from 'react';
import { ProximityText } from 'z-proximity-engine';

export const PhysicsIntro: React.FC = () => (
  <div className="py-12 px-4 text-center space-y-4 z-10 relative">
    <div className="p-[1px] bg-amber-500/30 clip-hex-10 inline-flex">
      <div className="fwm-badge inline-flex items-center space-x-2 px-3.5 py-1 bg-slate-950/95 clip-hex-10">
        <span>Interactive Compositor Sandbox</span>
      </div>
    </div>

    <h2 className="fwm-title text-3xl sm:text-5xl">
      Scroll down to{' '}
      <span className="inline-block">
        <ProximityText
          text="taste the physics"
          preset="tiltCard-magnetic-opacity-glow"
          textClassName="fwm-prox-text px-1"
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

    <p className="fwm-desc text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
      Experience fwm's Box2D 3.x rigid body dynamics, corner pendulum torque, swirl spin momentum, 9x9 wobble mesh, and collision knock sound.
    </p>

    {/* Disclaimer Banner with Clean Hexagonal Border Wrapper */}
    <div className="pt-2 flex justify-center">
      <div className="p-[1px] bg-amber-500/30 clip-hex-12 shadow-xl max-w-2xl">
        <div className="inline-flex items-center space-x-3 px-5 py-2.5 bg-slate-950/95 text-slate-300 font-mono text-xs text-left clip-hex-12">
          <span className="text-amber-400 font-bold shrink-0 text-sm">💡 Disclaimer:</span>
          <span className="text-[11px] text-slate-400 font-light leading-snug">
            This in-browser sandbox is a web simulation for demonstration purposes. The actual native C11 <code className="text-amber-300 font-mono bg-slate-950 px-1 py-0.5 border border-slate-800">fwm</code> Wayland compositor has significantly more features (3D cylinder Expo workspaces, Tab stacking, real PipeWire CAVA FFT spectrums, and <code className="text-amber-300 font-mono bg-slate-950 px-1 py-0.5 border border-slate-800">fwmctl</code> IPC) unconstrained by browser limits.
          </span>
        </div>
      </div>
    </div>
  </div>
);