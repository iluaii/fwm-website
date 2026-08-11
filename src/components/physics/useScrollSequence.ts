import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export interface UseScrollSequenceProps {
  sectionRef: React.RefObject<HTMLDivElement | null>;
  desktopRef: React.RefObject<HTMLDivElement | null>;
  textStep1Ref: React.RefObject<HTMLDivElement | null>;
  textStep2Ref: React.RefObject<HTMLDivElement | null>;
  instructionRef: React.RefObject<HTMLDivElement | null>;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
}

export const useScrollSequence = ({ sectionRef, desktopRef, textStep1Ref, textStep2Ref, instructionRef, progressBarRef }: UseScrollSequenceProps) => {
  useEffect(() => {
    if (!sectionRef.current || !desktopRef.current || !textStep1Ref.current || !textStep2Ref.current || !instructionRef.current) return;
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=1200',
          scrub: 0.6,
          pin: true,
          onUpdate: (self) => {
            if (progressBarRef.current) {
              const progressPct = Math.min(100, Math.max(0, self.progress * 100));
              progressBarRef.current.style.width = `${progressPct}%`;
            }
          },
        },
      });

      tl.to(desktopRef.current, { width: '88vw', height: '80vh', x: 0, y: 0, borderRadius: '0px', borderColor: 'rgba(245, 158, 11, 0.5)', duration: 0.8, ease: 'power2.inOut' })
        .to(instructionRef.current, { opacity: 1, duration: 0.3 }, '-=0.3')
        .to({}, { duration: 0.3 })
        .to(instructionRef.current, { opacity: 0, duration: 0.3 });

      if (isMobile) {
        tl.to(desktopRef.current, { height: '42vh', y: '-18vh', x: 0, duration: 1, ease: 'power2.inOut' })
          .fromTo(textStep1Ref.current, { opacity: 0, y: 25 }, { opacity: 1, y: '10vh', duration: 1, ease: 'power2.out' }, '<');
      } else {
        tl.to(desktopRef.current, { width: '46vw', height: '66vh', x: '20vw', y: 0, duration: 1, ease: 'power2.inOut' })
          .fromTo(textStep1Ref.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, '<');
      }

      tl.to({}, { duration: 0.4 });
      tl.to(textStep1Ref.current, { opacity: 0, y: -25, duration: 0.6, ease: 'power2.in' })
        .fromTo(textStep2Ref.current, { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' });
      tl.to({}, { duration: 0.4 });
    }, sectionRef);

    return () => ctx.revert();
  }, []);
};