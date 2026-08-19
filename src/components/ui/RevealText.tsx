"use client";

import { motion, type Variants } from "framer-motion";
import { Fragment, createElement, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  className?: string;
  /** Rendered element. Use the real heading level for the page outline. */
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "div";
  delay?: number;
  stagger?: number;
  /** Split on words (default) or lines separated by `\n`. */
  by?: "word" | "line";
};

/**
 * Masked line/word reveal for display type.
 *
 * The viewport trigger sits on the *container*, not on the masked spans. That
 * is essential rather than stylistic: each span starts translated fully outside
 * its `overflow: hidden` mask, and IntersectionObserver intersects an element
 * against its ancestors' clip rects — so a span watching itself would report
 * "not visible" forever and never animate in. The container is untransformed,
 * so it reports correctly and staggers its children.
 *
 * The whole string stays in the accessibility tree as one label; the animated
 * spans are hidden from assistive technology so a headline is never read out
 * one word at a time.
 */
export function RevealText({
  text,
  className,
  as = "span",
  delay = 0,
  stagger = 0.045,
  by = "word",
}: Props) {
  const reduced = usePrefersReducedMotion();
  const parts = by === "line" ? text.split("\n") : text.split(" ");

  const wrap = (children: ReactNode) =>
    createElement(as, { className }, children);

  if (reduced) {
    return wrap(
      by === "line"
        ? parts.map((line, i) => (
            <Fragment key={line + i}>
              {i > 0 ? <br /> : null}
              {line}
            </Fragment>
          ))
        : text,
    );
  }

  const container: Variants = {
    hidden: {},
    shown: { transition: { delayChildren: delay, staggerChildren: stagger } },
  };

  const part: Variants = {
    hidden: { y: "108%", opacity: 0 },
    shown: {
      y: "0%",
      opacity: 1,
      transition: { duration: 1, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return wrap(
    <>
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden="true"
        className="block"
        /**
         * Each word carries a trailing 0.24em so words do not collide. On a
         * centred heading that trailing space would shift the visible text
         * half of it to the left; pulling the container's right edge in by the
         * same amount cancels it exactly. Left-aligned headings are unaffected —
         * the text still starts at the same place.
         */
        style={by === "word" ? { marginRight: "-0.24em" } : undefined}
        variants={container}
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      >
        {parts.map((piece, index) => (
          <span
            key={`${piece}-${index}`}
            className={cn(
              "overflow-hidden",
              by === "line" ? "block" : "inline-block",
            )}
            style={by === "word" ? { paddingRight: "0.24em" } : undefined}
          >
            <motion.span
              className="inline-block will-change-transform"
              variants={part}
            >
              {piece}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </>,
  );
}
