import { useEffect, useLayoutEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger, SplitText);

export { gsap, ScrollTrigger, SplitText };

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export const prefersReducedMotion = () => typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const EASE = 'expo.out';

/** Scoped GSAP setup: everything created inside is reverted on unmount. Skipped entirely for reduced motion. */
export const useGsap = (scope: RefObject<HTMLElement | null>, setup: (root: HTMLElement) => void) => {
  useIsoLayoutEffect(() => {
    if (!scope.current || prefersReducedMotion()) return;
    const root = scope.current;
    const ctx = gsap.context(() => setup(root), root);
    return () => ctx.revert();
  }, []);
};

/** Buttery page scroll. Lenis drives the scroll, GSAP's ticker drives Lenis, ScrollTrigger listens to Lenis. */
export const useSmoothScroll = () => {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    document.documentElement.classList.add('lenis');
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: { offset: -72 } });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => { gsap.ticker.remove(tick); lenis.destroy(); };
  }, []);
};

/** Masked line-by-line reveal, the signature headline motion. */
export const revealLines = (target: Element | string, vars: gsap.TweenVars = {}) => {
  const split = SplitText.create(target, { type: 'lines', mask: 'lines', linesClass: 'line' });
  return gsap.from(split.lines, { yPercent: 110, duration: 1.3, ease: EASE, stagger: 0.09, ...vars });
};
