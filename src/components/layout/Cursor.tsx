"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { useIsFinePointer } from "@/hooks/use-media-query";

/**
 * Desktop-only cursor companion. It is purely decorative: the native cursor is
 * never hidden, so pointer affordances and accessibility are unaffected.
 * Never mounted on touch devices or under reduced motion.
 */
export function Cursor() {
  const reduced = usePrefersReducedMotion();
  const finePointer = useIsFinePointer();
  const enabled = finePointer && !reduced;
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 340, damping: 34, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 340, damping: 34, mass: 0.35 });

  useEffect(() => {
    if (!enabled) return;

    const onMove = (event: PointerEvent) => {
      x.set(event.clientX);
      y.set(event.clientY);
      setVisible(true);

      const target = event.target as HTMLElement | null;
      setActive(
        Boolean(
          target?.closest(
            'a, button, [role="button"], input, textarea, select, [data-cursor="active"]',
          ),
        ),
      );
    };
    const onLeave = () => setVisible(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[70] hidden lg:block"
      style={{ x: sx, y: sy }}
    >
      <motion.span
        className="block rounded-full border border-bronze-light/70"
        animate={{
          width: active ? 44 : 20,
          height: active ? 44 : 20,
          opacity: visible ? (active ? 0.95 : 0.5) : 0,
          x: active ? -22 : -10,
          y: active ? -22 : -10,
          backgroundColor: active
            ? "rgba(207,157,95,0.12)"
            : "rgba(207,157,95,0)",
        }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
      />
    </motion.div>
  );
}
