"use client";

import Link from "next/link";
import { useState } from "react";
import {
  SERVICE_AREAS,
  distanceBetween,
  serviceRegionCentre,
} from "@/lib/service-areas";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn, fixed } from "@/lib/utils";

/**
 * Coverage, plotted rather than mapped.
 *
 * This replaces a Google Maps widget. A map needs a browser key, a billed
 * cloud project, the right APIs switched on and a referrer allowlist that
 * matches wherever the site happens to be running — and when any one of those
 * is wrong, Maps does not fail quietly: it greys the tile out and puts
 * "This page can't load Google Maps correctly" over the top of it. That is a
 * broken-looking panel on the marketing site of a business that is not broken,
 * caused by billing settings rather than by anything on the page.
 *
 * So nothing is fetched here. Every mark is computed from the coordinates
 * already in `service-areas.ts`: true bearing and true great-circle distance
 * from the middle of the serviced region, drawn north-up over labelled
 * distance rings. It is a real plan of where Kabura works, it is accurate to
 * the same data the rest of the site uses, and there is no request in it that
 * can fail.
 *
 * It is also more use than the map was. A basemap at this size is mostly
 * unreadable street names; rings answer the question a visitor actually has,
 * which is how far out the business comes.
 *
 * The names sit under the plot rather than beside their dots. Eight labels
 * around a 350px card is roughly twice the text the margins hold, and four of
 * these suburbs are within nine kilometres of each other — labelled in place
 * they land on top of one another. Below, they are a legible index that hover
 * and focus tie back to the plot in both directions.
 */

/* --------------------------- plot geometry ------------------------------ */

/** Half the SVG's square viewBox — everything is drawn around this. */
const HALF = 120;
/** Radius the furthest suburb sits at. */
const PLOT_R = 86;

type Marker = {
  slug: string;
  name: string;
  km: number;
  /** Dot position, in viewBox units. */
  x: number;
  y: number;
};

/**
 * Bearing and distance from the centroid, projected north-up.
 *
 * Computed once at module scope: the coordinates are static, so this is a
 * constant, not work to redo on every render.
 */
const MARKERS: Marker[] = (() => {
  const centre = serviceRegionCentre();
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const placed = SERVICE_AREAS.map((area) => {
    const metres = distanceBetween(centre, area.coords);
    // Equirectangular bearing — exact enough over 35 km, and it keeps north up.
    const east =
      toRad(area.coords.lng - centre.lng) * Math.cos(toRad(centre.lat));
    const north = toRad(area.coords.lat - centre.lat);
    return { area, metres, bearing: Math.atan2(east, north) };
  });

  const furthest = Math.max(...placed.map((p) => p.metres));

  return placed.map(({ area, metres, bearing }) => {
    const r = (metres / furthest) * PLOT_R;
    return {
      slug: area.slug,
      name: area.name,
      km: Math.round(metres / 1000),
      // Rounded: these end up in `left`/`top` percentages, and the trigonometry
      // behind them is implementation-approximated. See `fixed`.
      x: fixed(Math.sin(bearing) * r),
      y: fixed(-Math.cos(bearing) * r),
    };
  });
})();

/** The furthest suburb, in whole kilometres — the outermost ring. */
const REACH_KM = Math.max(...MARKERS.map((m) => m.km));

/**
 * Distance rings, at a round interval that gives three or four of them.
 * Derived from the reach so adding a further suburb re-scales the plot rather
 * than running off the edge of it.
 */
const RING_STEP = REACH_KM > 60 ? 20 : 10;
const RINGS = Array.from(
  { length: Math.floor(REACH_KM / RING_STEP) },
  (_, i) => (i + 1) * RING_STEP,
).map((km) => ({ km, r: fixed((km / REACH_KM) * PLOT_R) }));

/* ------------------------------ component -------------------------------- */

export function CoverageBoard({ className }: { className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>({
    once: true,
    threshold: 0.3,
  });
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState<string | null>(null);

  /** Drawn straight away when motion is reduced — nothing to reveal. */
  const revealed = reduced || inView;

  return (
    <div ref={ref} className={cn("w-full max-w-[22rem]", className)}>
      <div className="group glass overflow-hidden rounded-2xl border border-stone/25 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.9)] transition-[transform,border-color,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-bronze-light/45 hover:shadow-[0_32px_70px_-30px_color-mix(in_oklab,var(--color-bronze)_45%,transparent)]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-stone/15 px-4 py-3">
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="block h-1.5 w-1.5 rounded-full bg-bronze-light shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-bronze)_25%,transparent)]"
            />
            <span className="eyebrow text-stone-light">Areas we service</span>
          </span>
          <span className="text-xs text-stone tabular-nums">
            {SERVICE_AREAS.length}
          </span>
        </div>

        {/* Plot */}
        <div className="relative aspect-[5/4] w-full">
          <svg
            viewBox={`0 0 ${HALF * 2} ${HALF * 2}`}
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={`Plan of the ${SERVICE_AREAS.length} areas Kabura Tiling services, within ${REACH_KM} kilometres`}
          >
            <defs>
              <radialGradient id="kb-coverage-field">
                <stop
                  offset="0%"
                  stopColor="var(--color-bronze)"
                  stopOpacity="0.32"
                />
                <stop
                  offset="70%"
                  stopColor="var(--color-bronze)"
                  stopOpacity="0.09"
                />
                <stop
                  offset="100%"
                  stopColor="var(--color-bronze)"
                  stopOpacity="0"
                />
              </radialGradient>
            </defs>

            {/* Serviced region */}
            <circle
              cx={HALF}
              cy={HALF}
              r={PLOT_R + 10}
              fill="url(#kb-coverage-field)"
              className={cn(
                "origin-center transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                revealed ? "scale-100" : "scale-0",
              )}
            />

            {/* Distance rings */}
            {RINGS.map((ring, i) => (
              <g
                key={ring.km}
                className={cn(
                  "origin-center transition-[transform,opacity] ease-[cubic-bezier(0.16,1,0.3,1)]",
                  revealed ? "scale-100 opacity-100" : "scale-75 opacity-0",
                )}
                style={{
                  transitionDuration: "1100ms",
                  transitionDelay: reduced ? "0ms" : `${i * 110}ms`,
                }}
              >
                <circle
                  cx={HALF}
                  cy={HALF}
                  r={ring.r}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.75"
                  strokeDasharray="2 4"
                  className="text-stone/45"
                />
                {/* Due east: the one radial the suburbs leave clear, so a
                    ring label never lands on a dot. */}
                <text
                  x={HALF + ring.r + 3}
                  y={HALF + 2.5}
                  className="fill-stone/70 text-[6.5px] tracking-[0.12em]"
                >
                  {ring.km}km
                </text>
              </g>
            ))}

            {/* North */}
            <g className="text-stone/60">
              <line
                x1={HALF}
                y1={HALF - PLOT_R - 22}
                x2={HALF}
                y2={HALF - PLOT_R - 12}
                stroke="currentColor"
                strokeWidth="0.75"
              />
              <text
                x={HALF}
                y={HALF - PLOT_R - 26}
                textAnchor="middle"
                className="fill-stone-light text-[8px] tracking-[0.2em]"
              >
                N
              </text>
            </g>

            {/* Base of operations */}
            <g
              className={cn(
                "origin-center transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                revealed ? "scale-100 opacity-100" : "scale-0 opacity-0",
              )}
            >
              <circle
                cx={HALF}
                cy={HALF}
                r="7"
                fill="none"
                stroke="var(--color-bronze-light)"
                strokeWidth="0.8"
                opacity="0.55"
              />
              <circle
                cx={HALF}
                cy={HALF}
                r="2.6"
                fill="var(--color-bronze-light)"
              />
            </g>
          </svg>

          {/* Suburb dots, over the plot. Decorative: the index below carries
              the names, the links and everything a screen reader needs. */}
          {MARKERS.map((m, i) => (
            <span
              key={m.slug}
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute block rounded-full transition-[transform,background-color,box-shadow,opacity] ease-[cubic-bezier(0.16,1,0.3,1)]",
                active === m.slug
                  ? "h-2.5 w-2.5 bg-bronze-light shadow-[0_0_0_5px_color-mix(in_oklab,var(--color-bronze)_30%,transparent)]"
                  : "h-1.5 w-1.5 bg-sand/85",
                revealed ? "scale-100 opacity-100" : "scale-0 opacity-0",
              )}
              style={{
                left: `${fixed(((HALF + m.x) / (HALF * 2)) * 100)}%`,
                top: `${fixed(((HALF + m.y) / (HALF * 2)) * 100)}%`,
                transform: "translate(-50%, -50%)",
                transitionDuration: "600ms",
                transitionDelay: reduced ? "0ms" : `${380 + i * 70}ms`,
              }}
            />
          ))}
        </div>

        {/* The index. Hovering a name lights its dot, and the other way round. */}
        <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-stone/15 px-3 py-3">
          {MARKERS.map((m) => (
            <li key={m.slug}>
              <Link
                href={`/service-areas/${m.slug}`}
                onMouseEnter={() => setActive(m.slug)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(m.slug)}
                onBlur={() => setActive(null)}
                className={cn(
                  "flex items-center gap-1.5 rounded px-1 py-1 outline-offset-2 transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-bronze-light",
                  active === m.slug && "bg-bone/[0.05]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "block h-1 w-1 shrink-0 rounded-full transition-colors duration-300",
                    active === m.slug ? "bg-bronze-light" : "bg-stone/70",
                  )}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[0.66rem] transition-colors duration-300",
                    active === m.slug ? "text-bone" : "text-sand/75",
                  )}
                >
                  {m.name}
                </span>
                <span className="shrink-0 text-[0.6rem] text-stone tabular-nums">
                  {m.km}km
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-stone/15 px-4 py-3">
          <span className="flex items-center gap-2 text-[0.68rem] text-stone">
            <span
              aria-hidden="true"
              className="block h-2 w-2 shrink-0 rounded-full bg-bronze-light/80"
            />
            Within {REACH_KM}km
          </span>
          <Link
            href="/service-areas"
            className="group/link inline-flex shrink-0 items-center gap-2 rounded-full border border-stone/30 px-3.5 py-1.5 text-[0.62rem] font-semibold tracking-[0.13em] text-sand uppercase transition-colors duration-400 hover:border-bronze-light hover:bg-bronze/12 hover:text-bronze-light"
          >
            View all areas
            <svg
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              className="h-2.5 w-2.5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/link:translate-x-0.5"
            >
              <path
                d="M1 6h9M6 1.5 10.5 6 6 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
