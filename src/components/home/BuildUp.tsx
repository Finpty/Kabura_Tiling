"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Section, SectionLabel } from "@/components/ui/Section";
import { BUILD_UP_LAYERS, type BuildUpLayer } from "@/lib/build-up-layers";
import { imageFill } from "@/lib/media";
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
 *
 * Every plate carries a photograph of the material it is — a tile face, a
 * combed adhesive bed, a membrane, a screed, a slab — rather than a coloured
 * rectangle standing in for one. The scans are shot straight down so they map
 * onto a plate without arguing with the isometric, and each plate is extruded
 * to a real thickness so the closed stack reads as a cross-section through a
 * floor rather than five sheets of paper.
 */

/** How far apart the layers travel, as a share of the plate height. */
const SPREAD = 78;
/**
 * Extruded depth of a plate, and the gap the stack keeps even when closed.
 * They are the same number on purpose: at rest the edges meet exactly and the
 * slab reads as one solid section through a floor.
 */
const THICKNESS = 15;
/**
 * How much of a step along the stack's axis shows up as downward movement on
 * screen: sin(56°), the tilt the stack is drawn at. The stack separates
 * downwards from its top plate, so without lifting the whole group by half its
 * own travel it grows out of the bottom of its box and lands on the legend.
 */
const AXIS_TO_SCREEN = Math.sin((56 * Math.PI) / 180);
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
          <div className="perspective relative flex min-h-[30rem] items-center justify-center md:min-h-[34rem]">
            <div
              className="preserve-3d pointer-events-none relative h-[15rem] w-[19rem] sm:h-[19rem] sm:w-[26rem] lg:w-[30rem]"
              style={{
                transform: `translateY(${
                  -((BUILD_UP_LAYERS.length - 1) *
                    (THICKNESS + SPREAD * shown) *
                    AXIS_TO_SCREEN) / 2
                }px) rotateX(56deg) rotateZ(-40deg)`,
              }}
            >
              {BUILD_UP_LAYERS.map((layer, index) => (
                <Plate
                  key={layer.id}
                  layer={layer}
                  index={index}
                  shown={shown}
                  lifted={active === layer.id}
                  onEnter={() => setActive(layer.id)}
                  onLeave={() => setActive(null)}
                />
              ))}
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

/**
 * One layer of the stack, as a slab rather than a sheet.
 *
 * The top face is a photograph of the material. The two faces below it are the
 * extrusion: strips folded 90° out of the plate's own plane, so they are real
 * geometry in the same 3D context and stay correct at every point of the drag
 * instead of being a painted-on fake edge. They take the material's colour,
 * because the scan is of the surface and an edge does not look like a surface.
 */
function Plate({
  layer,
  index,
  shown,
  lifted,
  onEnter,
  onLeave,
}: {
  layer: BuildUpLayer;
  index: number;
  shown: number;
  lifted: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  // The closed stack keeps one thickness between plates so the edges meet
  // rather than fight for the same depth.
  const depth = index * (THICKNESS + SPREAD * shown) + (lifted ? 26 : 0);

  return (
    <div
      className="preserve-3d pointer-events-auto absolute inset-x-0 top-1/2 h-24 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
      style={{
        // `translateZ` moves along the stack's own axis, so the plates separate
        // straight down rather than sliding across the screen.
        transform: `translateY(-50%) translateZ(${-depth}px)`,
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Top face — the material itself */}
      <div
        className={cn(
          "absolute inset-0 overflow-hidden rounded-[3px] border backface-hidden",
          "transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
          lifted ? "border-bronze-light/70" : "border-bone/12",
        )}
        style={{
          boxShadow: lifted
            ? "0 42px 70px -30px color-mix(in oklab, var(--color-bronze) 70%, transparent)"
            : "0 34px 56px -32px rgba(0,0,0,0.95)",
        }}
      >
        <Image
          {...imageFill(layer.image)}
          alt=""
          fill
          sizes="(min-width: 1024px) 30rem, (min-width: 640px) 26rem, 19rem"
          className={cn(
            "object-cover transition-[filter,transform] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            lifted ? "scale-[1.04] saturate-100" : "saturate-[0.92]",
          )}
        />

        {/* Raking light across the face, so five plates read as one lit object
            rather than five separate photographs. */}
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(152deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 44%, rgba(0,0,0,0.3) 100%)",
          }}
        />
        <span
          aria-hidden="true"
          className={cn(
            "absolute inset-0 bg-ink transition-opacity duration-500",
            lifted ? "opacity-0" : "opacity-[0.12]",
          )}
        />

        {/* Light catching the top edge */}
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-bone/25"
        />
      </div>

      {/* Extruded edges. `rotateX(-90deg)` about the bottom edge and
          `rotateY(90deg)` about the right edge both fold downwards in Z, which
          is the direction the stack separates in. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-full origin-top backface-hidden"
        style={{
          height: THICKNESS,
          transform: "rotateX(-90deg)",
          // Shaded, but never so dark that the band stops reading as this
          // material: closed, the five edges are the cross-section, and that
          // is the whole point of the closed state.
          background: `linear-gradient(to bottom, color-mix(in oklab, ${layer.colour} 92%, #0b0b0c), color-mix(in oklab, ${layer.colour} 66%, #0b0b0c))`,
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-full origin-left backface-hidden"
        style={{
          width: THICKNESS,
          transform: "rotateY(90deg)",
          background: `linear-gradient(to right, color-mix(in oklab, ${layer.colour} 74%, #0b0b0c), color-mix(in oklab, ${layer.colour} 50%, #0b0b0c))`,
        }}
      />
    </div>
  );
}
