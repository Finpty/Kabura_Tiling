"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe media query built on `useSyncExternalStore` rather than
 * effect-then-setState, so there is no cascading render on mount and the value
 * is correct on the very first client render after hydration.
 *
 * The server snapshot is always `false`: markup is rendered for the
 * conservative case, and the heavy path only ever opts in on the client.
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
export const useIsCoarsePointer = () => useMediaQuery("(pointer: coarse)");
export const useIsFinePointer = () => useMediaQuery("(pointer: fine)");
