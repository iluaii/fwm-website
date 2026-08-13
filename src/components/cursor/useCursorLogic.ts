import { useEffect } from 'react';
import gsap from 'gsap';

interface UseCursorLogicProps {
  cursorRef: React.RefObject<HTMLDivElement | null>;
  dotRef: React.RefObject<HTMLDivElement | null>;
  outerRef: React.RefObject<HTMLDivElement | null>;
  textRef: React.RefObject<HTMLDivElement | null>;
  isHovering: boolean;
  isClicking: boolean;
  isText: boolean;
}

export const useCursorLogic = ({ cursorRef, dotRef, outerRef, textRef, isHovering, isClicking, isText }: UseCursorLogicProps) => {
  // Movement tracking 
  useEffect(() => {
    if (!cursorRef.current || !dotRef.current || !outerRef.current) return;

    let hasMoved = false;
    let isActive = true;

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const smooth = { x: mouse.x, y: mouse.y };
    
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      
      if (!hasMoved && cursorRef.current) {
        hasMoved = true;
        smooth.x = mouse.x;
        smooth.y = mouse.y;
        
        // ONLY hide the native cursor once we are 100% sure a mouse is moving
        document.body.classList.add('custom-cursor-active');
        
        // GSAP controls the opacity fade-in
        gsap.to(cursorRef.current, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      }
    };

    window.addEventListener('mousemove', onMouseMove);

    // Frame-locked Animation loop
    const ticker = () => {
      if (!isActive || !hasMoved) return;
      
      const dt = gsap.ticker.deltaRatio(60); 
      smooth.x += (mouse.x - smooth.x) * 0.25 * dt;
      smooth.y += (mouse.y - smooth.y) * 0.25 * dt;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      }

      const offsetX = smooth.x - mouse.x;
      const offsetY = smooth.y - mouse.y;

      if (outerRef.current) {
        outerRef.current.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
      }
    };

    gsap.ticker.add(ticker);

    return () => {
      isActive = false;
      window.removeEventListener('mousemove', onMouseMove);
      gsap.ticker.remove(ticker);
      document.body.classList.remove('custom-cursor-active');
    };
  }, []);

  // Visual Transitions
  useEffect(() => {
    if (!outerRef.current || !textRef.current || !dotRef.current) return;

    if (isText) {
      gsap.to(outerRef.current, { opacity: 0, scale: 0.5, duration: 0.2, overwrite: 'auto' });
      gsap.to(dotRef.current, { scale: 1, opacity: 0, duration: 0.2, overwrite: 'auto' });
      gsap.to(textRef.current, { opacity: 0, duration: 0.2, overwrite: 'auto' });
    } else {
      gsap.to(outerRef.current, { opacity: 1, overwrite: 'auto' });
      
      if (isClicking) {
        gsap.to(outerRef.current, { scale: 0.8, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(dotRef.current, { scale: 0.5, opacity: 1, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
      } else {
        if (isHovering) {
          gsap.to(outerRef.current, { scale: 1.5, rotate: 90, duration: 0.4, ease: 'back.out(1.5)', overwrite: 'auto' });
          gsap.to(outerRef.current.querySelector('polygon'), { strokeWidth: 1, duration: 0.4, overwrite: 'auto' });
          gsap.to(dotRef.current, { scale: 0, opacity: 0, duration: 0.2, overwrite: 'auto' });
          gsap.to(textRef.current, { opacity: 1, x: 5, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        } else {
          gsap.to(outerRef.current, { scale: 1, rotate: 0, duration: 0.4, ease: 'back.out(1.5)', overwrite: 'auto' });
          gsap.to(outerRef.current.querySelector('polygon'), { strokeWidth: 1.5, duration: 0.4, overwrite: 'auto' });
          gsap.to(dotRef.current, { scale: 1, opacity: 1, duration: 0.2, overwrite: 'auto' });
          gsap.to(textRef.current, { opacity: 0, x: -5, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
        }
      }
    }
  }, [isHovering, isClicking, isText]);
};