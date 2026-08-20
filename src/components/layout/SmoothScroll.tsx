"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Lenis smooth scrolling on its own rAF loop.
 *
 * Loaded dynamically so it stays out of the initial bundle, and skipped
 * entirely under `prefers-reduced-motion` or on a coarse pointer — a phone's
 * native momentum scrolling is better than anything re-implemented on top of it,
 * and intercepting it costs battery for nothing.
 *
 * Note on GSAP: the project brief listed it, and it was wired in here to drive
 * ScrollTrigger. It has been removed because nothing on the site used it —
 * every scroll-linked effect runs on Framer Motion's `useScroll`, which is
 * already in the bundle. Carrying GSAP + ScrollTrigger meant roughly 50 KB
 * gzipped of dead weight on every page load. Re-add it here if you later want
 * ScrollTrigger-specific behaviour, and register `lenis.on("scroll",
 * ScrollTrigger.update)` alongside the raf loop below.
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
      const { default: Lenis } = await import("lenis");
      if (cancelled) return;

      const lenis = new Lenis({
        /**
         * Measure the BODY, not the default documentElement. This site sets
         * `h-full` on <html>, so that element's border box is always exactly
         * the viewport — it never grows with content, which means Lenis's
         * ResizeObserver never fires and its page height goes stale the
         * moment fonts, images or embeds finish after the first measure.
         * A stale height is a clamp: scrolling hits an invisible floor short
         * of the real end of the page and only "up" still works. The body's
         * box does grow, so observing it keeps the limit honest.
         */
        content: document.body,
        duration: 1.05,
        easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
        touchMultiplier: 1.6,
      });

      let frame = 0;
      const raf = (time: number) => {
        lenis.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);

      cleanup = () => {
        cancelAnimationFrame(frame);
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
