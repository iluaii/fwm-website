import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="relative z-10 mt-32 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 248 140" className="w-10 h-10">
              <g fill="none" stroke="#d0a82c" strokeWidth="6" strokeLinejoin="miter" strokeLinecap="butt">
                <polygon points="66,0 174,0 240,66 174,132 66,132 0,66" />
                <g transform="translate(64,13)">
                  <polyline points="6,96 6,10 76,10" />
                  <polyline points="6,46 34,46" />
                  <polyline points="34,46 46,96 54,62 64,96 76,10" />
                  <polyline points="76,10 90,54 104,14 104,96" />
                </g>
              </g>
            </svg>
            <span className="fwm-title text-2xl">fwm</span>
          </div>
          <p className="fwm-desc text-sm max-w-sm">
            The Physics Window Manager for Wayland. Open source, C11, and heavily opinionated.
          </p>
        </div>

        {/* Links Columns */}
        <div className="space-y-4">
          <h4 className="fwm-badge inline-block px-2 py-1">Resources</h4>
          <ul className="space-y-2 font-mono text-sm text-slate-400">
            <li><a href="/docs" className="hover:text-amber-400 transition-colors">Documentation</a></li>
            <li><a href="/docs/configuration" className="hover:text-amber-400 transition-colors">Configuration</a></li>
            <li><a href="/docs/architecture" className="hover:text-amber-400 transition-colors">Architecture</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="fwm-badge inline-block px-2 py-1">Community</h4>
          <ul className="space-y-2 font-mono text-sm text-slate-400">
            <li><a href="https://github.com/iluaii/fwm" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">GitHub</a></li>
            <li><a href="https://github.com/iluaii/fwm/issues" target="_blank" rel="noreferrer" className="hover:text-amber-400 transition-colors">Report Bug</a></li>
            <li><a href="#install" className="hover:text-amber-400 transition-colors">Install</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-900 py-6 px-6 flex flex-col sm:flex-row justify-between items-center text-xs font-mono text-slate-600">
        <span>© {new Date().getFullYear()} fwm. All rights reserved.</span>
        <span>Built with Astro, React, and Box2D 3.x</span>
      </div>
    </footer>
  );
};