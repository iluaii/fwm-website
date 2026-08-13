import React, { useRef } from 'react';
import { useCursorLogic } from './useCursorLogic';
import { useCursorHover } from './useCursorHover';

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const squeezeRef = useRef<HTMLDivElement>(null);
  const polyRef = useRef<SVGPolygonElement>(null);
  const circleRef = useRef<SVGCircleElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const { isHovering, hoverText, isClicking, isText } = useCursorHover();

  useCursorLogic({
    cursorRef,
    followerRef,
    outerRef,
    squeezeRef,
    polyRef,
    circleRef,
    dotRef,
    textRef,
    isHovering,
    isClicking,
    isText,
  });

  return (
    <div 
      ref={cursorRef} 
      className="fixed top-0 left-0 pointer-events-none z-[99999] flex items-center justify-center opacity-0 will-change-transform"
      style={{ width: 0, height: 0 }}
    >
      {/* 1. Follower offsets position smoothly from exact mouse */}
      <div ref={followerRef} className="absolute flex items-center justify-center will-change-transform">
        
        {/* 2. Outer handles GSAP Scale/Rotation for Hover States */}
        <div ref={outerRef} className="absolute flex items-center justify-center will-change-transform">
          
          {/* 3. Squeeze handles 120fps Ticker Rotation & Squash/Stretch */}
          <div ref={squeezeRef} className="absolute flex items-center justify-center will-change-transform">
            
            <svg width="56" height="56" viewBox="0 0 60 60" className="overflow-visible">
              {/* Spinning Inner HUD Dash */}
              <circle 
                ref={circleRef}
                cx="30" cy="30" r="15" 
                fill="none" 
                stroke="#d0a82c" 
                strokeWidth="1" 
                strokeDasharray="4 6" 
                opacity="0.4"
                className="drop-shadow-[0_0_2px_rgba(208,168,44,0.3)]"
              />
              {/* Base Hexagon Frame */}
              <polygon 
                ref={polyRef}
                points="30,3 53.5,16.5 53.5,43.5 30,57 6.5,43.5 6.5,16.5" 
                fill="none" 
                stroke="#d0a82c" 
                strokeWidth="1.5"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_6px_rgba(208,168,44,0.4)]"
              />
            </svg>

          </div>
        </div>
      </div>
      
      {/* Exact Mouse Coordinate Dot */}
      <div 
        ref={dotRef} 
        className="w-2 h-2 bg-amber-400 rounded-full absolute shadow-[0_0_10px_#d0a82c] will-change-transform"
      />
      
      {/* Dynamic Slide-Out HUD Text (Upgraded Size & Responsiveness) */}
      <div 
        ref={textRef} 
        className="absolute left-8 sm:left-10 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-xs sm:text-sm md:text-base tracking-widest text-amber-400 font-bold bg-slate-950/90 px-4 py-2 sm:px-5 sm:py-2.5 border border-amber-500/30 clip-hex-10 opacity-0 will-change-transform backdrop-blur-lg flex items-center gap-2 sm:gap-3 shadow-2xl"
      >
        <div className="w-2 h-2 bg-current rounded-none animate-pulse shrink-0" />
        {hoverText}
      </div>
    </div>
  );
};