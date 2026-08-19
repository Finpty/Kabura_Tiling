"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Section, SectionLabel } from "@/components/ui/Section";
import { BUILD_UP_LAYERS } from "@/lib/build-up-layers";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { centreBlock, centreRow, centreText } from "@/lib/align";
import { cn } from "@/lib/utils";

/**
 * Take it apart.
 *
 * The build-up as something you operate rather than something you watch. A
 * slab sits in isometric; drag the handle and it separates into the five
 * layers underneath, each one naming itself as it clears the one above.
 *
 * Direct manipulation on purpose. The previous version drove the same idea
 * from scroll position, which meant the visitor had to scroll through it at
 * exactly the right speed to see anything and could not go back. A handle you
 * can drag works the same on a trackpad, a phone and a keyboard, holds still
 * while you read, and — because nothing is pinned — takes no scroll distance
 * at all.
 *
 * It also replaces a WebGL canvas with about forty lines of CSS transforms,
 * which is roughly half a megabyte of JavaScript this page no longer ships.
 */

/** How far apart the layers travel, as a share of the plate height. */
const SPREAD = 78;
const AUTO_DEMO_MS = 1500;

export function BuildUp() {
  const reduced = usePrefersReducedMotion();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({
    once: true,
    threshold: 0.35,
  });

  // 0 = one solid slab, 1 = fully separated.
  const [spread, setSpread] = useState(0);
  /**
   * Reduced motion gets the open stack with no animation. Derived rather than
   * written into state, so there is no effect syncing one value into another
   * and no first paint showing the closed stack before it corrects itself.
   */
  const shown = reduced ? 1 : spread;
  const [active, setActive] = useState<string | null>(null);
  const demoed = useRef(false);
  const frame = useRef(0);

  /**
   * A single pass from closed to open the first time the section is seen, so
   * the interaction shows itself. It stops for good after that — and never
   * runs at all under reduced motion, where the stack simply starts open.
   */
  useEffect(() => {
    if (reduced || !inView || demoed.current) return;
    demoed.current = true;

    let start: number | null = null;
    const step = (now: number) => {
      start ??= now;
      const t = Math.min(1, (now - start) / AUTO_DEMO_MS);
      // Ease-out-expo, matching every other transition on the site.
      setSpread(t === 1 ? 1 : 1 - 2 ** (-9 * t));
      if (t < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [inView, reduced]);

  /** Stop the intro the moment the visitor takes over. */
  const takeOver = useCallback((value: number) => {
    cancelAnimationFrame(frame.current);
    demoed.current = true;
    setSpread(value);
  }, []);

  return (
    <Section
      id="under-the-tile"
      spacing="loose"
      className="relative overflow-hidden border-t border-stone/12 bg-ink"
      aria-labelledby="under-the-tile-heading"
    >
      {/* Ambient bronze wash behind the stack */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--color-bronze) 16%, transparent) 0%, transparent 62%)",
        }}
      />

      <div ref={viewRef} className="shell relative">
        <div className={cn("max-w-2xl", centreText, centreBlock)}>
          <SectionLabel
            index="02"
            eyebrow="The build-up"
            className={centreRow}
          />
          <h2
            id="under-the-tile-heading"
            className={cn(
              "mt-6 font-display text-headline text-bone",
              centreBlock,
            )}
          >
            Take it apart.
          </h2>
          <p className={cn("mt-5 text-lead text-sand/75", centreBlock)}>
            A finished floor is five decisions deep. Pull the slab apart and see
            every one of them.
          </p>
        </div>

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          {/* The stack */}
          <div className="perspective relative flex min-h-[24rem] items-center justify-center md:min-h-[30rem]">
            <div
              className="preserve-3d relative h-[15rem] w-[19rem] sm:h-[19rem] sm:w-[26rem]"
              style={{ transform: "rotateX(56deg) rotateZ(-40deg)" }}
            >
              {BUILD_UP_LAYERS.map((layer, index) => {
                const lifted = active === layer.id;
                const depth = index * SPREAD * shown;
                return (
                  <div
                    key={layer.id}
                    className={cn(
                      "absolute inset-x-0 top-1/2 h-24 rounded-[4px] border border-bone/12 backface-hidden",
                      "transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      lifted && "border-bronze-light/70",
                    )}
                    style={{
                      background: `linear-gradient(152deg, ${layer.colour} 0%, ${layer.colour}dd 48%, ${layer.colour}88 100%)`,
                      // `translateZ` moves along the stack's own axis, so the
                      // plates separate straight down rather than sliding
                      // across the screen.
                      transform: `translateY(-50%) translateZ(${-depth - (lifted ? 26 : 0)}px)`,
                      zIndex: BUILD_UP_LAYERS.length - index,
                      boxShadow: lifted
                        ? "0 42px 70px -30px color-mix(in oklab, var(--color-bronze) 70%, transparent)"
                        : "0 34px 56px -32px rgba(0,0,0,0.95)",
                    }}
                  >
                    {/* Light catching the top edge */}
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 top-0 h-px bg-bone/25"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Control + legend */}
          <div className={cn(centreText, centreBlock)}>
            <label className="block">
              <span className="eyebrow text-bronze-light">
                Drag to take it apart
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(shown * 100)}
                onChange={(event) => takeOver(Number(event.target.value) / 100)}
                aria-label="Separate the layers"
                className="kb-range mt-4 w-full"
              />
            </label>

            <ul className="mt-9 flex flex-col">
              {BUILD_UP_LAYERS.map((layer, index) => (
                <li key={layer.id}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(layer.id)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(layer.id)}
                    onBlur={() => setActive(null)}
                    className={cn(
                      "group flex w-full items-baseline gap-3 border-l-2 py-3 pl-4 text-left transition-[border-color,background-color] duration-500",
                      active === layer.id
                        ? "border-bronze-light bg-bone/[0.05]"
                        : "border-stone/22",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="eyebrow shrink-0 text-bronze-light/80 tabular-nums"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "block font-display text-lg tracking-[-0.02em] transition-colors duration-500 md:text-xl",
                          active === layer.id ? "text-bone" : "text-sand/70",
                        )}
                      >
                        {layer.label}
                      </span>
                      <span
                        className={cn(
                          "mt-1 block text-sm leading-relaxed transition-colors duration-500",
                          active === layer.id ? "text-sand/85" : "text-sand/45",
                        )}
                      >
                        {layer.detail}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <p
              className={cn(
                "mt-8 font-serif text-xl text-bronze-light italic md:text-2xl",
                centreText,
              )}
            >
              Kabura does more than lay tiles.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
