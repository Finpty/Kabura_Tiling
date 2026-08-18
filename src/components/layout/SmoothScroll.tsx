"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Lenis smooth scrolling, wired to GSAP's ScrollTrigger so pinned sections stay
 * in sync with the eased scroll position.
 *
 * Skipped entirely under `prefers-reduced-motion` — the browser's native scroll
 * is left alone rather than being intercepted and re-eased.
 */
export function SmoothScroll() {
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    if (reduced) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ default: Lenis }, { gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.6,
      });

      lenis.on("scroll", ScrollTrigger.update);

      const onRaf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(onRaf);
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
        gsap.ticker.remove(onRaf);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [reduced]);

  // A route change must land at the top; Lenis keeps its own scroll position.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}
