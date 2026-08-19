"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KABURA_MAP_STYLE,
  isMapsConfigured,
  loadGoogleMaps,
  type GMapsMap,
} from "@/lib/google-maps";
import {
  SERVICE_AREAS,
  keyServiceAreas,
  serviceRegionCentre,
  serviceRegionRadius,
} from "@/lib/service-areas";
import { useInView } from "@/hooks/use-in-view";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * Coverage widget.
 *
 * A small card, deliberately: the map is a reassurance that Kabura works near
 * you, not a tool for exploring the metro area. It shows the region, a soft
 * coverage wash and three anchor pins, then hands off to `/service-areas` for
 * the real list. Everything that used to live inside it — the suburb pills,
 * the selected-suburb panel — belongs on that page, where there is room.
 *
 * `gestureHandling: "cooperative"` matters more than it looks: a plain map
 * swallows the wheel, and a widget that eats page scrolling is worse than no
 * widget at all. Scroll passes straight through unless the visitor holds
 * ⌘/Ctrl, and touch needs two fingers.
 *
 * The script is fetched only once the card is near the viewport. Without
 * `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — or if the script fails — the frame keeps
 * its shape and renders a drawn coverage graphic instead.
 */

/** Small bronze dot with a soft halo. A pin marker is too loud at this size. */
const MARKER_ICON =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="9" fill="#cf9d5f" opacity="0.22"/>
      <circle cx="11" cy="11" r="4.5" fill="#cf9d5f" stroke="#0b0a09" stroke-width="1.5"/>
    </svg>`,
  );

const ANCHORS = keyServiceAreas();

/** Drawn coverage graphic. Used when Maps is unconfigured or unavailable. */
function DrawnCoverage() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklab, var(--color-stone) 55%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, var(--color-stone) 55%, transparent) 1px, transparent 1px)",
          backgroundSize: "38px 38px",
          opacity: 0.08,
        }}
      />
      {/* Coverage wash, matching the live map's circle. */}
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 h-[128%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--color-bronze) 30%, transparent) 0%, color-mix(in oklab, var(--color-bronze) 12%, transparent) 55%, transparent 72%)",
          border:
            "1px solid color-mix(in oklab, var(--color-bronze-light) 35%, transparent)",
        }}
      />
      {/* Anchor dots, laid out to echo the real north–south spread. */}
      {[
        { top: "24%", left: "56%" },
        { top: "54%", left: "44%" },
        { top: "78%", left: "42%" },
      ].map((position, index) => (
        <span
          key={ANCHORS[index]?.slug ?? index}
          aria-hidden="true"
          className="absolute block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-bronze-light shadow-[0_0_0_5px_color-mix(in_oklab,var(--color-bronze)_22%,transparent)]"
          style={position}
        />
      ))}
    </div>
  );
}

export function CoverageMap({ className }: { className?: string }) {
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({
    once: true,
    rootMargin: "250px",
    threshold: 0,
  });
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMapsMap | null>(null);
  const baseZoom = useRef<number | null>(null);
  const started = useRef(false);
  const reduced = usePrefersReducedMotion();

  const [live, setLive] = useState(false);
  const configured = isMapsConfigured();

  useEffect(() => {
    if (!configured || !inView || started.current) return;
    started.current = true;
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !mapNode.current) return;

        const centre = serviceRegionCentre();
        const map = new maps.Map(mapNode.current, {
          center: centre,
          zoom: 9,
          styles: KABURA_MAP_STYLE,
          disableDefaultUI: true,
          // Never let the widget capture the page's scroll.
          gestureHandling: "cooperative",
          keyboardShortcuts: false,
          clickableIcons: false,
          backgroundColor: "#14120f",
        });
        mapRef.current = map;

        new maps.Circle({
          map,
          center: centre,
          radius: serviceRegionRadius(),
          strokeColor: "#cf9d5f",
          strokeOpacity: 0.45,
          strokeWeight: 1.25,
          fillColor: "#a9743d",
          fillOpacity: 0.14,
          clickable: false,
        });

        for (const area of ANCHORS) {
          new maps.Marker({
            map,
            position: area.coords,
            title: area.name,
            clickable: false,
            icon: {
              url: MARKER_ICON,
              scaledSize: new maps.Size(22, 22),
              anchor: new maps.Point(11, 11),
            },
          });
        }

        const bounds = new maps.LatLngBounds();
        for (const area of SERVICE_AREAS) bounds.extend(area.coords);
        map.fitBounds(bounds, 34);
        map.addListener("idle", () => {
          baseZoom.current ??= map.getZoom() ?? 9;
        });

        setLive(true);
      })
      .catch(() => {
        // Leave `live` false; the drawn coverage stays. Not an error state the
        // visitor needs to know about.
      });

    return () => {
      cancelled = true;
    };
  }, [configured, inView]);

  /** A half-step zoom on hover. Google animates it; reduced motion skips it. */
  const zoomBy = useCallback(
    (delta: number) => {
      if (reduced || !live) return;
      const map = mapRef.current;
      const base = baseZoom.current;
      if (!map || base === null) return;
      map.setZoom(base + delta);
    },
    [reduced, live],
  );

  return (
    <div ref={viewRef} className={cn("w-full max-w-md", className)}>
      <div
        onMouseEnter={() => zoomBy(0.6)}
        onMouseLeave={() => zoomBy(0)}
        className="group glass relative overflow-hidden rounded-2xl border border-stone/25 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.9)] transition-[transform,border-color,box-shadow] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-bronze-light/45 hover:shadow-[0_32px_70px_-30px_color-mix(in_oklab,var(--color-bronze)_45%,transparent)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-stone/15 px-5 py-3.5">
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="block h-1.5 w-1.5 rounded-full bg-bronze-light shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-bronze)_25%,transparent)]"
            />
            <span className="eyebrow text-stone-light">Service coverage</span>
          </span>
          <span className="text-xs text-stone tabular-nums">
            {SERVICE_AREAS.length} areas
          </span>
        </div>

        {/* Map */}
        <div className="relative aspect-[16/11] w-full">
          <DrawnCoverage />
          <div
            ref={mapNode}
            aria-label="Map of the region Kabura Tiling services"
            role="img"
            className={cn(
              "absolute inset-0 h-full w-full transition-opacity duration-1000",
              live ? "opacity-100" : "opacity-0",
            )}
          />
          {/* Inner vignette keeps the tiles inside the card's own lighting. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 shadow-[inset_0_0_60px_20px_color-mix(in_oklab,var(--color-ink)_55%,transparent)]"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 border-t border-stone/15 px-5 py-4">
          <p className="min-w-0 truncate text-xs text-sand/70">
            {ANCHORS.map((area) => area.name).join(" · ")}
          </p>
          <Link
            href="/service-areas"
            className="group/link inline-flex shrink-0 items-center gap-2 rounded-full border border-stone/30 px-3.5 py-2 text-[0.64rem] font-semibold tracking-[0.13em] text-sand uppercase transition-colors duration-400 hover:border-bronze-light hover:bg-bronze/12 hover:text-bronze-light"
          >
            All areas
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
