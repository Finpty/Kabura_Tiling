"use client";

import { motion } from "framer-motion";
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

  return wrap(
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {parts.map((part, index) => (
          <span
            key={`${part}-${index}`}
            className={cn(
              "overflow-hidden",
              by === "line" ? "block" : "inline-block",
            )}
            style={by === "word" ? { paddingRight: "0.24em" } : undefined}
          >
            <motion.span
              className="inline-block will-change-transform"
              initial={{ y: "108%", opacity: 0 }}
              whileInView={{ y: "0%", opacity: 1 }}
              viewport={{ once: true, margin: "0px 0px -10% 0px" }}
              transition={{
                duration: 1,
                delay: delay + index * stagger,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {part}
            </motion.span>
          </span>
        ))}
      </span>
    </>,
  );
}
