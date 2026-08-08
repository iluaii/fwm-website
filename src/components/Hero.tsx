import React, { useState } from 'react';
import { Proximity, ProximityText } from 'z-proximity-engine';

export const Hero: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const installCommand = "curl -sL https://fwm-website.vercel.app/install-fwm.sh | bash";

  const copyCommand = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-6 pt-24 pb-12 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-slate-950 to-slate-950">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.15)_0%,_transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center space-y-8">
        
        {/* Proximity Magnetic Badge */}
        <Proximity preset="tiltCard-magnetic" reach={1.5} duration={0.3} ease="power2.out">
          <div className="prox-item fwm-badge inline-flex items-center space-x-2.5 px-4 py-2 bg-slate-900/90 rounded-full shadow-[0_0_20px_rgba(208,168,44,0.15)] cursor-pointer">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span>FWM • Wayland Compositor • Box2D 3.x</span>
          </div>
        </Proximity>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-light text-slate-100 tracking-tight leading-[1.15] min-h-[2.4em] sm:min-h-[2.2em]">
          Welcome to a world where{' '}
          <span className="inline-block align-baseline min-w-[3.2ch]">
            <ProximityText
              text="physics"
              preset="tiltCard-magnetic-opacity-glow"
              textClassName="fwm-prox-text px-2"
              reach={2}
              duration={1}
              opacity={[0.7, 1]}
              glow={[0, 6]}
              ease="elastic"
              splitBy="letter"
            />
          </span>{' '}
          is not boring anymore.
        </h1>

        <p className="fwm-desc text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
          Windows behave as real physical objects with mass, momentum, inertia, and velocity. Throw windows, stack them under Earth gravity, or watch them tumble in zero-g.
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
          <a
            href="#physics"
            className="group relative px-7 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(208,168,44,0.4)] hover:shadow-[0_0_30px_#d0a82c] flex items-center space-x-2 clip-hex-12"
          >
            <span>🎮 Try Sandbox</span>
            <span className="group-hover:translate-x-1 transition-transform">↓</span>
          </a>

          <button
            onClick={copyCommand}
            className="group relative flex items-center space-x-3 px-6 py-3 bg-slate-900/90 border border-slate-700/80 hover:border-amber-400/80 text-slate-200 font-mono text-xs transition-all cursor-pointer shadow-lg rounded-none clip-hex-12"
          >
            <span className="text-amber-400">📋</span>
            <span>{copied ? '✓ Copied Command!' : 'Copy Install Command'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};