import { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface UseCursorLogicProps {
  cursorRef: React.RefObject<HTMLDivElement | null>;
  followerRef: React.RefObject<HTMLDivElement | null>;
  outerRef: React.RefObject<HTMLDivElement | null>;
  squeezeRef: React.RefObject<HTMLDivElement | null>;
  polyRef: React.RefObject<SVGPolygonElement | null>;
  circleRef: React.RefObject<SVGCircleElement | null>;
  dotRef: React.RefObject<HTMLDivElement | null>;
  textRef: React.RefObject<HTMLDivElement | null>;
  isHovering: boolean;
  isClicking: boolean;
  isText: boolean;
}

export const useCursorLogic = ({
  cursorRef, followerRef, outerRef, squeezeRef, polyRef, circleRef, dotRef, textRef,
  isHovering, isClicking, isText
}: UseCursorLogicProps) => {
  
  // Keep latest state accessible in the high-frequency ticker without re-binding
  const state = useRef({ isHovering, isClicking, isText });
  useEffect(() => {
    state.current = { isHovering, isClicking, isText };
  }, [isHovering, isClicking, isText]);

  // 1. Ambient Eye-Candy Animations
  useEffect(() => {
    if (!circleRef.current) return;
    // Infinite spin for the inner dashed ring
    gsap.to(circleRef.current, {
      rotation: 360,
      transformOrigin: 'center',
      duration: 8,
      repeat: -1,
      ease: 'none'
    });
  }, []);

  // 2. State-based Visual Morphing
  useEffect(() => {
    if (!outerRef.current || !textRef.current || !dotRef.current || !polyRef.current || !circleRef.current) return;

    if (isText) {
      // Hide natively on inputs
      gsap.to([outerRef.current, dotRef.current, textRef.current], { opacity: 0, scale: 0.5, duration: 0.3, overwrite: 'auto' });
    } else {
      gsap.to(outerRef.current, { opacity: 1, duration: 0.3, overwrite: 'auto' });

      if (isClicking) {
        // Physical Click Impact Ripple
        gsap.to(outerRef.current, { scale: 0.6, duration: 0.15, ease: 'power2.out', overwrite: 'auto' });
        gsap.to(dotRef.current, { scale: 3, opacity: 0, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
      } else if (isHovering) {
        // Magnetic Hover Morph (Cyan/Blue Theme)
        gsap.to(outerRef.current, { scale: 1.3, duration: 0.5, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
        gsap.to(polyRef.current, { stroke: '#2ac3de', strokeWidth: 2, duration: 0.3, overwrite: 'auto' });
        gsap.to(circleRef.current, { stroke: '#2ac3de', opacity: 1, duration: 0.3, overwrite: 'auto' });
        gsap.to(dotRef.current, { scale: 0, opacity: 0, duration: 0.2, overwrite: 'auto' });
        
        // Pop out the HUD Text
        gsap.to(textRef.current, { 
          opacity: 1, 
          x: 18, 
          color: '#2ac3de', 
          borderColor: 'rgba(42,195,222,0.4)', 
          duration: 0.4, 
          ease: 'back.out(2)', 
          overwrite: 'auto' 
        });
      } else {
        // Idle Spring Back to Normal (Amber Theme)
        gsap.to(outerRef.current, { scale: 1, duration: 0.4, ease: 'back.out(1.5)', overwrite: 'auto' });
        gsap.to(polyRef.current, { stroke: '#d0a82c', strokeWidth: 1.5, duration: 0.3, overwrite: 'auto' });
        gsap.to(circleRef.current, { stroke: '#d0a82c', opacity: 0.4, duration: 0.3, overwrite: 'auto' });
        
        gsap.to(dotRef.current, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)', overwrite: 'auto' });
        gsap.to(textRef.current, { opacity: 0, x: 0, duration: 0.2, overwrite: 'auto' });
      }
    }
  }, [isHovering, isClicking, isText]);

  // 3. Frame-Locked Physics Ticker (60/120fps)
  useEffect(() => {
    let isActive = true;
    let hasMoved = false;

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const smooth = { x: mouse.x, y: mouse.y };
    
    // Physics variables
    let currentAngle = 0;
    let currentScaleX = 1;
    let currentScaleY = 1;

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (!hasMoved && cursorRef.current) {
        hasMoved = true;
        document.body.classList.add('custom-cursor-active');
        gsap.to(cursorRef.current, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });

    const ticker = () => {
      if (!isActive || !hasMoved) return;

      const dt = gsap.ticker.deltaRatio(60);

      // 1. Calculate Velocity & Smooth Tracking
      const dx = mouse.x - smooth.x;
      const dy = mouse.y - smooth.y;
      smooth.x += dx * 0.25 * dt;
      smooth.y += dy * 0.25 * dt;

      const dist = Math.hypot(dx, dy);

      // 2. Velocity-based Rotation (Only steer if moving fast enough to avoid jitter)
      if (dist > 1.5) {
        const targetAngle = Math.atan2(dy, dx);
        let dAngle = targetAngle - currentAngle;
        // Find shortest rotation path
        if (dAngle > Math.PI) dAngle -= Math.PI * 2;
        if (dAngle < -Math.PI) dAngle += Math.PI * 2;
        currentAngle += dAngle * 0.3 * dt;
      }

      // 3. Dynamic Squash & Stretch
      let targetScaleX = 1;
      let targetScaleY = 1;

      // Disable stretching while hovering so the target box stays rigid and perfect
      if (!state.current.isHovering && !state.current.isText) {
        targetScaleX = 1 + Math.min(dist * 0.018, 0.6); // Stretch forward
        targetScaleY = 1 - Math.min(dist * 0.007, 0.35); // Squash sides
      }

      currentScaleX += (targetScaleX - currentScaleX) * 0.25 * dt;
      currentScaleY += (targetScaleY - currentScaleY) * 0.25 * dt;

      // 4. Apply Transforms to Nested DOM elements independently
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      }

      if (followerRef.current) {
        const offsetX = smooth.x - mouse.x;
        const offsetY = smooth.y - mouse.y;
        followerRef.current.style.transform = `translate3d(${offsetX}px, ${offsetY}px, 0)`;
      }

      if (squeezeRef.current) {
        squeezeRef.current.style.transform = `rotate(${currentAngle}rad) scaleX(${currentScaleX}) scaleY(${currentScaleY})`;
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
};