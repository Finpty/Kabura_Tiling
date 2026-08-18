"use client";

import { useMediaQuery } from "./use-media-query";

/**
 * Every animated component reads this. When it is true the component renders
 * its final state directly rather than animating toward it.
 */
export function usePrefersReducedMotion() {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
