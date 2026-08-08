import React, { useState, useMemo } from 'react';
import { Proximity, ProximityText } from 'z-proximity-engine';
import { allFeatures } from '../data/features';

export const PhysicsFeatures: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    const cats = Array.from(new Set(allFeatures.map((f) => f.category)));
    return ['All', ...cats];
  }, []);

  // Filter features based on tab selection
  const filteredFeatures = useMemo(() => {
    if (selectedCategory === 'All') return allFeatures;
    return allFeatures.filter((f) => f.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <section id="features" className="relative z-10 py-24 px-4 sm:px-6 max-w-6xl mx-auto flex flex-col justify-center min-h-[800px] [content-visibility:auto]">
      <div className="text-center mb-12 space-y-4">
        <div className="fwm-badge inline-flex items-center space-x-2 px-4 py-1.5 bg-amber-500/10 clip-hex-10">
          <span>Feature Index</span>
        </div>
        <h2 className="fwm-title text-4xl sm:text-6xl min-h-[1.2em]">
          Everything{' '}
          <span className="inline-block align-baseline min-w-[2.2ch]">
            <ProximityText
              text="fwm"
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
          Can Do
        </h2>
        <p className="fwm-desc text-sm sm:text-base max-w-xl mx-auto min-h-[3em]">
          Browse features by system architecture, physics engine details, and window management controls.
        </p>
      </div>

      {/* SINGLE PROXIMITY WRAPPER FOR ALL TABS & CARDS */}
      <Proximity preset="tiltCard-magnetic" reach={1.2} duration={0.3} ease="power2.out">
        <div className="w-full space-y-10">
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {categories.map((cat) => {
              const count = cat === 'All' ? allFeatures.length : allFeatures.filter((f) => f.category === cat).length;
              const isActive = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`prox-item px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center space-x-2 border clip-hex-8 ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-bold border-amber-400 shadow-[0_0_15px_#d0a82c]'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  <span>{cat}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 ${isActive ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-300">
            {filteredFeatures.map((item) => (
              <div
                key={item.title}
                className="prox-item p-6 bg-slate-900/95 border border-slate-800 hover:border-amber-500/40 transition-colors duration-300 shadow-xl group flex flex-col justify-between h-full will-change-transform transform-gpu clip-hex-14"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">{item.category}</span>
                    <span className="font-mono text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-0.5 border border-amber-500/20">{item.bind}</span>
                  </div>
                  <h3 className="font-body text-xl font-semibold text-slate-100 mb-2 group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="fwm-desc text-xs leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Proximity>
    </section>
  );
};