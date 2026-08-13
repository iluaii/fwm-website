import { useEffect, useState } from 'react';

export const useCursorHover = () => {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverText, setHoverText] = useState('');
  const [isClicking, setIsClicking] = useState(false);
  const [isText, setIsText] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target || !target.closest) return;

      // 1. Check if hovering over native text inputs
      const textInput = target.closest('input, textarea, [contenteditable="true"]');
      if (textInput) {
        setIsText(true);
        setIsHovering(false);
        setHoverText('');
        return;
      } else {
        setIsText(false);
      }

      // 2. Check for clickables and specific data-cursor overrides
      const clickable = target.closest('a, button, [role="button"], .cursor-pointer, .prox-item, [data-cursor]');
      
      if (clickable) {
        setIsHovering(true);
        let text = clickable.getAttribute('data-cursor');
        if (!text) {
          if (clickable.tagName === 'A') text = 'LINK';
          else if (clickable.tagName === 'BUTTON') text = 'ACTION';
          else if (clickable.classList.contains('prox-item')) text = 'INTERACT';
          else text = 'HOVER';
        }
        // Safely update state without forcing redundant re-renders
        setHoverText((prev) => (prev !== text ? (text as string) : prev));
      } else {
        setIsHovering(false);
        setHoverText('');
      }
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
      setHoverText('');
      setIsText(false);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return { isHovering, hoverText, isClicking, isText };
};