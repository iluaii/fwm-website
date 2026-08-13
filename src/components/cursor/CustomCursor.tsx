import React, { useRef } from 'react';
import { useCursorLogic } from './useCursorLogic';
import { useCursorHover } from './useCursorHover';

export const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const { isHovering, hoverText, isClicking, isText } = useCursorHover();

  useCursorLogic({
    cursorRef,
    dotRef,
    outerRef,
    textRef,
    isHovering,
    isClicking,
    isText,
  });

  return (
    <div 
      ref={cursorRef} 
      // Removed CSS transition-opacity so GSAP has full control
      className="fixed top-0 left-0 pointer-events-none z-[99999] flex items-center justify-center opacity-0 will-change-transform"
      style={{ width: 0, height: 0 }}
    >
      <div 
        ref={outerRef} 
        className="absolute flex items-center justify-center will-change-transform"
      >
        <svg width="40" height="40" viewBox="0 0 40 40" className="w-full h-full overflow-visible">
          <polygon 
            points="20,2 35.5,11 35.5,29 20,38 4.5,29 4.5,11" 
            fill="none" 
            stroke="#d0a82c" 
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_4px_rgba(208,168,44,0.4)] transition-colors"
          />
        </svg>
      </div>
      
      <div 
        ref={dotRef} 
        className="w-1.5 h-1.5 bg-amber-400 rounded-full absolute shadow-[0_0_8px_#d0a82c] will-change-transform"
      />
      
      <div 
        ref={textRef} 
        className="absolute left-6 top-1/2 -translate-y-1/2 whitespace-nowrap font-mono text-[9px] sm:text-[10px] uppercase tracking-widest text-amber-400 font-bold bg-slate-950/80 px-2.5 py-1 border border-amber-500/30 clip-hex-6 opacity-0 will-change-transform backdrop-blur-md"
      >
        {hoverText}
      </div>
    </div>
  );
};