"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Distance travelled, in px. */
  distance?: number;
  direction?: "up" | "down" | "left" | "right";
  as?: "div" | "section" | "li" | "article" | "span";
};

/**
 * The site's single scroll-reveal primitive. Reduced motion collapses it to a
 * plain element — no opacity fade, no transform, no observer.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 28,
  direction = "up",
  as = "div",
}: Props) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const horizontal = direction === "left" || direction === "right";
  const sign = direction === "down" || direction === "right" ? 1 : -1;
  const offset = -sign * distance;

  const variants: Variants = {
    hidden: horizontal ? { opacity: 0, x: offset } : { opacity: 0, y: offset },
    shown: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] },
    },
  };

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={cn(className)}
      variants={variants}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
    >
      {children}
    </MotionTag>
  );
}
