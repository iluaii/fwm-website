import React, { useState, useEffect } from 'react';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.includes('#')) {
      const hash = href.substring(href.indexOf('#'));
      const target = document.querySelector(hash);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
        history.pushState(null, '', hash);
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname === '/' || window.location.pathname === '') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      history.pushState(null, '', '/');
    }
  };

  return (
    <header className="fixed top-3 sm:top-4 left-0 right-0 z-40 flex justify-center px-2 sm:px-4 pointer-events-none">
      <div
        id="navbar-container"
        className={`pointer-events-auto p-[1px] transition-all duration-500 w-full max-w-[720px] clip-hex-16 ${
          scrolled 
            ? 'bg-gradient-to-r from-amber-500/40 via-amber-400/80 to-amber-500/40 shadow-[0_0_25px_rgba(208,168,44,0.2)] backdrop-blur-md' 
            : 'bg-transparent border border-transparent'
        }`}
      >
        <nav className={`flex items-center justify-between px-3 sm:px-6 py-1.5 sm:py-2 transition-colors duration-500 text-slate-200 clip-hex-16 ${
          scrolled ? 'bg-slate-950/80' : 'bg-transparent'
        }`}>
          {/* Logo (Same as before) */}
          <a href="/" onClick={handleLogoClick} aria-label="Home" className="relative flex items-center justify-center p-1 group transition-transform duration-300 hover:scale-115 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer">
            <div id="navbar-logo-slot" className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center shrink-0 relative">
              <svg id="navbar-logo-svg" xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 248 140" className="w-full h-full object-contain pointer-events-none">
                <g fill="none" stroke="#d0a82c" strokeWidth="6" strokeJoin="miter" strokeLinecap="butt">
                  <polygon className="badge-polygon opacity-60" points="66,0 174,0 240,66 174,132 66,132 0,66" />
                  <polyline className="bracket-line opacity-80" points="10,26 -16,66 10,106" />
                  <polyline className="bracket-line opacity-80" points="230,26 256,66 230,106" />
                  <g transform="translate(64,13)">
                    <polyline className="mono-line" points="6,96 6,10 76,10" />
                    <polyline className="mono-line" points="6,46 34,46" />
                    <polyline className="mono-line" points="34,46 46,96 54,62 64,96 76,10" />
                    <polyline className="mono-line" points="76,10 90,54 104,14 104,96" />
                  </g>
                </g>
              </svg>
            </div>
          </a>

          <div className="flex items-center space-x-1 sm:space-x-2">
            {[
              { name: 'Physics', href: '/#physics' },
              { name: 'Features', href: '/#features' },
              { name: 'Docs', href: '/docs' },
              { name: 'Install', href: '/#install'}
            ].map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="relative px-2.5 sm:px-4 py-1 font-mono text-[10px] sm:text-xs uppercase tracking-wider text-slate-300 hover:text-slate-950 font-medium transition-colors duration-300 group overflow-hidden block clip-hex-8"
              >
                <span className="absolute inset-0 bg-amber-400 translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]" />
                <span className="relative z-10">{link.name}</span>
              </a>
            ))}
          </div>

          <a
            href="https://github.com/iluaii/fwm"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] sm:text-xs text-slate-950 font-bold bg-amber-400 hover:bg-amber-300 px-2.5 sm:px-4 py-1 sm:py-1.5 transition-colors shadow-[0_0_10px_#d0a82c] clip-hex-6"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
};