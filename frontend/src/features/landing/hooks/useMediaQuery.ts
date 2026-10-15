import { useCallback, useSyncExternalStore } from 'react';

/**
 * Subscribes to a CSS media query without setting state inside an effect.
 * Returns `fallback` where `matchMedia` is unavailable.
 */
export const useMediaQuery = (query: string, fallback = false): boolean => {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || !window.matchMedia) return () => {};
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', onChange);
      return () => mediaQuery.removeEventListener('change', onChange);
    },
    [query]
  );

  const getSnapshot = () =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : fallback;

  return useSyncExternalStore(subscribe, getSnapshot, () => fallback);
};

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

export const useCanHover = () => useMediaQuery('(hover: hover) and (pointer: fine)', true);
