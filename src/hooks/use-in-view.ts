"use client";

import { useEffect, useRef, useState } from "react";

type Options = {
  /** Stop observing once it has been seen. */
  once?: boolean;
  rootMargin?: string;
  threshold?: number | number[];
};

/**
 * Thin IntersectionObserver wrapper. Used for reveal animations and — more
 * importantly — for pausing offscreen video.
 *
 * Where IntersectionObserver is unavailable the initial state is `true`, so
 * content is shown rather than hidden forever. That decision is made in the
 * initialiser rather than in an effect, so there is no extra render.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>({
  once = false,
  rootMargin = "0px",
  threshold = 0.15,
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold]);

  return { ref, inView } as const;
}
