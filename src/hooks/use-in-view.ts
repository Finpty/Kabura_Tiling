"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Support never changes within a session, so there is nothing to subscribe to. */
const NEVER_CHANGES = () => () => {};

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
 * Starts `false` on the server and on the client's first render alike. It has
 * to: React compares the two, and a component that reads `inView` while
 * rendering gets a hydration mismatch — "some attributes of the server
 * rendered HTML didn't match the client properties" — the moment the two
 * disagree. Seeding from `typeof IntersectionObserver` disagrees by
 * construction, because the server has no such global and every browser does.
 *
 * The case that seeding was there to cover — no IntersectionObserver, so
 * nothing would ever be revealed — is handled by `useSyncExternalStore`
 * instead. That is the primitive for a value the server cannot know: it
 * renders the server snapshot, then swaps in the client's without treating the
 * difference as a mismatch. The server assumes the API is present, because
 * every browser since 2019 has it; the handful that do not re-render once and
 * get the content unconditionally.
 */
export function useInView<T extends HTMLElement = HTMLDivElement>({
  once = false,
  rootMargin = "0px",
  threshold = 0.15,
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  const unobservable = useSyncExternalStore(
    NEVER_CHANGES,
    () => typeof IntersectionObserver === "undefined",
    () => false,
  );

  // Nothing to watch with means show it, rather than hide it forever.
  const inView = seen || unobservable;

  useEffect(() => {
    const node = ref.current;
    if (!node || unobservable) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setSeen(false);
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, rootMargin, threshold, unobservable]);

  return { ref, inView } as const;
}
