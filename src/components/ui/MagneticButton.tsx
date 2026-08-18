"use client";

import Link from "next/link";
import {
  useCallback,
  useRef,
  type ComponentProps,
  type MouseEvent,
  type ReactNode,
} from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { useIsCoarsePointer } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type Variant = "solid" | "outline" | "ghost" | "bronze";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  solid:
    "bg-bone text-ink hover:bg-paper border border-transparent",
  bronze:
    "bg-bronze text-paper hover:bg-bronze-light hover:text-ink border border-transparent",
  outline:
    "border border-stone/45 text-bone hover:border-bronze-light/80 hover:text-paper bg-transparent",
  ghost:
    "border border-transparent text-bone hover:text-bronze-light bg-transparent",
};

const SIZES: Record<Size, string> = {
  sm: "h-10 px-5 text-[0.78rem] tracking-[0.14em]",
  md: "h-12 px-7 text-[0.8rem] tracking-[0.15em]",
  lg: "h-14 px-9 text-[0.84rem] tracking-[0.16em]",
};

type BaseProps = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  size?: Size;
  /** Magnetic pull radius in px. */
  strength?: number;
  withArrow?: boolean;
};

function useMagnetic(strength: number, enabled: boolean) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  const ref = useRef<HTMLElement | null>(null);

  const onMove = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      x.set((dx / rect.width) * strength);
      y.set((dy / rect.height) * strength);
    },
    [enabled, strength, x, y],
  );

  const onLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { ref, sx, sy, onMove, onLeave };
}

const baseClass =
  "group relative inline-flex items-center justify-center gap-3 rounded-full font-medium uppercase whitespace-nowrap transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:pointer-events-none disabled:opacity-45";

function Arrow() {
  return (
    <span aria-hidden="true" className="relative block h-3 w-3 overflow-hidden">
      <svg
        viewBox="0 0 12 12"
        fill="none"
        className="absolute inset-0 h-3 w-3 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-4 group-hover:-translate-y-4"
      >
        <path d="M1 11 11 1M4 1h7v7" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <svg
        viewBox="0 0 12 12"
        fill="none"
        className="absolute inset-0 h-3 w-3 -translate-x-4 translate-y-4 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0 group-hover:translate-y-0"
      >
        <path d="M1 11 11 1M4 1h7v7" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </span>
  );
}

type LinkProps = BaseProps & Omit<ComponentProps<typeof Link>, "className">;

/** Magnetic call-to-action rendered as a link. */
export function MagneticLink({
  children,
  className,
  variant = "solid",
  size = "md",
  strength = 16,
  withArrow = false,
  ...props
}: LinkProps) {
  const reduced = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();
  const enabled = !reduced && !coarse;
  const { ref, sx, sy, onMove, onLeave } = useMagnetic(strength, enabled);

  return (
    <motion.span
      ref={ref as React.Ref<HTMLSpanElement>}
      style={enabled ? { x: sx, y: sy } : undefined}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="inline-block"
    >
      <Link
        className={cn(baseClass, VARIANTS[variant], SIZES[size], className)}
        {...props}
      >
        {children}
        {withArrow ? <Arrow /> : null}
      </Link>
    </motion.span>
  );
}

type ButtonProps = BaseProps &
  Omit<ComponentProps<"button">, "className" | "children">;

/** Magnetic call-to-action rendered as a button. */
export function MagneticButton({
  children,
  className,
  variant = "solid",
  size = "md",
  strength = 16,
  withArrow = false,
  ...props
}: ButtonProps) {
  const reduced = usePrefersReducedMotion();
  const coarse = useIsCoarsePointer();
  const enabled = !reduced && !coarse;
  const { ref, sx, sy, onMove, onLeave } = useMagnetic(strength, enabled);

  return (
    <motion.span
      ref={ref as React.Ref<HTMLSpanElement>}
      style={enabled ? { x: sx, y: sy } : undefined}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="inline-block"
    >
      <button
        className={cn(baseClass, VARIANTS[variant], SIZES[size], className)}
        {...props}
      >
        {children}
        {withArrow ? <Arrow /> : null}
      </button>
    </motion.span>
  );
}
