"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * True once the page has scrolled past `threshold` pixels.
 *
 * Reads the live scroll position on every render through
 * `useSyncExternalStore`, which means a page restored mid-scroll is correct
 * immediately rather than after an effect fires.
 */
export function useScrollPast(threshold: number) {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange, { passive: true });
    return () => {
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.scrollY > threshold,
    () => false,
  );
}
