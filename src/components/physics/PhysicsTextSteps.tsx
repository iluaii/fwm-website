import React from 'react';

interface PhysicsTextStepsProps {
  textStep1Ref: React.RefObject<HTMLDivElement | null>;
  textStep2Ref: React.RefObject<HTMLDivElement | null>;
}

export const PhysicsTextSteps: React.FC<PhysicsTextStepsProps> = ({ textStep1Ref, textStep2Ref }) => (
  <div className="absolute left-[4vw] top-[18vh] w-[90vw] md:w-[40vw] z-30 pointer-events-none">
    {/* Step 1 */}
    <div ref={textStep1Ref} className="opacity-0 space-y-4">
      <div className="fwm-badge inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 rounded-none">
        <span>01 • Rigid Body Dynamics</span>
      </div>
      <h3 className="fwm-title text-3xl md:text-5xl drop-shadow-md">
        Physics-First <span className="text-amber-400">Window Control</span>
      </h3>
      <p className="fwm-desc text-slate-300 text-sm md:text-base leading-relaxed">
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
    
    {/* Step 2 */}
    <div ref={textStep2Ref} className="opacity-0 absolute top-0 left-0 w-full space-y-4">
      <div className="fwm-badge inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 rounded-none">
        <span>02 • Under The Hood</span>
      </div>
      <h3 className="fwm-title text-3xl md:text-5xl drop-shadow-md">
        Engineered in C for <span className="text-amber-400">Wayland</span>
      </h3>
      <p className="fwm-desc text-slate-300 text-sm md:text-base leading-relaxed">
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
);