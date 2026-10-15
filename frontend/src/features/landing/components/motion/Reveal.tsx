import React, { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

export interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms before the transition starts (use for staggering siblings). */
  delay?: number;
  as?: 'div' | 'li' | 'section' | 'article';
}

/**
 * Scroll-triggered fade-up, modeled on React Bits' FadeContent/AnimatedContent
 * but dependency-free (IntersectionObserver + CSS transitions, transform only).
 * Plays once; renders fully visible when reduced motion is preferred.
 */
export const Reveal: React.FC<RevealProps> = ({ children, className = '', delay = 0, as: Tag = 'div' }) => {
  const ref = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const canObserve = typeof window !== 'undefined' && 'IntersectionObserver' in window;
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || prefersReducedMotion || !canObserve) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [prefersReducedMotion, canObserve]);

  const visible = inView || prefersReducedMotion || !canObserve;

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      } ${className}`}
      style={{ transitionDelay: visible && delay ? `${delay}ms` : undefined }}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
