import React, { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';

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
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    // Trigger entrance on the next tick so the initial blurred state paints first
    const timer = setTimeout(() => setInView(true), 50);
    return () => clearTimeout(timer);
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
    <span className={`inline-block ${className}`}>
      {/* Screen readers get the full phrase once; the animated fragments are hidden from them */}
      <span className="sr-only">{text}</span>
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
