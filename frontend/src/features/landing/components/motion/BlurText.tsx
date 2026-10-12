import React, { useEffect, useState, useRef } from 'react';

export interface BlurTextProps {
  text: string;
  delay?: number;
  className?: string;
  animateBy?: 'words' | 'letters';
  direction?: 'top' | 'bottom';
  threshold?: number;
  rootMargin?: string;
  onAnimationComplete?: () => void;
}

export const BlurText: React.FC<BlurTextProps> = ({
  text,
  delay = 70,
  className = '',
  animateBy = 'words',
  direction = 'top',
  onAnimationComplete,
}) => {
  const [inView, setInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const ref = useRef<HTMLHeadingElement | HTMLSpanElement | null>(null);

  useEffect(() => {
    // Check user's motion preferences
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      mediaQuery.addEventListener('change', handleChange);

      // Trigger entrance
      const timer = setTimeout(() => {
        setInView(true);
      }, 50);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
        clearTimeout(timer);
      };
    }
  }, []);

  const elements = animateBy === 'words' ? text.split(' ') : text.split('');

  useEffect(() => {
    if (inView && onAnimationComplete) {
      const totalDuration = elements.length * delay + 500;
      const timeout = setTimeout(onAnimationComplete, totalDuration);
      return () => clearTimeout(timeout);
    }
  }, [inView, elements.length, delay, onAnimationComplete]);

  // If user prefers reduced motion, render immediately with zero animation delay or filter
  if (prefersReducedMotion) {
    return <span className={`inline-block ${className}`}>{text}</span>;
  }

  const yOffset = direction === 'top' ? '-12px' : '12px';

  return (
    <span ref={ref} className={`inline-block ${className}`} aria-label={text}>
      {elements.map((item, index) => (
        <span
          key={index}
          className="inline-block transition-all duration-700 ease-out will-change-[filter,opacity,transform]"
          style={{
            opacity: inView ? 1 : 0,
            filter: inView ? 'blur(0px)' : 'blur(10px)',
            transform: inView ? 'translateY(0)' : `translateY(${yOffset})`,
            transitionDelay: `${index * delay}ms`,
            marginRight: animateBy === 'words' && index < elements.length - 1 ? '0.28em' : undefined,
            fontWeight: 'inherit',
            fontFamily: 'inherit',
          }}
          aria-hidden="true"
        >
          {item}
        </span>
      ))}
    </span>
  );
};

export default BlurText;
