"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  KABURA_MAP_STYLE_LIGHT,
  isMapsConfigured,
  loadGoogleMaps,
  type GMapsMap,
} from "@/lib/google-maps";
import {
  SERVICE_AREAS,
  serviceRegionCentre,
  serviceRegionRadius,
} from "@/lib/service-areas";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

/**
 * Coverage radius widget.
 *
 * A square, pale map with the serviced region shaded over it and a pin on every
 * suburb — the shape a coverage map is expected to take, so it is read at a
 * glance rather than studied. The radius is the subject; the basemap is only
 * there to tell you where you are.
 *
 * The frame stays dark to sit in the site, the map inside stays light so the
 * shaded region reads. That contrast is the point: on a dark basemap a
 * translucent wash disappears into the background.
 *
 * `gestureHandling: "cooperative"` matters more than it looks — a plain map
 * swallows the wheel, and a widget that eats page scrolling is worse than no
 * widget at all. Scroll passes straight through unless ⌘/Ctrl is held, and
 * touch needs two fingers.
 */

/* ------------------------------- markers -------------------------------- */

const pin = (fill: string) =>
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
      <path d="M15 39C15 39 28 24.5 28 15A13 13 0 1 0 2 15C2 24.5 15 39 15 39Z"
            fill="${fill}" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round"/>
      <circle cx="15" cy="14.5" r="5" fill="#ffffff"/>
    </svg>`,
  );

/** Suburbs we service. */
const AREA_PIN = pin("#4f8ff7");
/** The centre of the region, called out so the radius has an obvious origin. */
const BASE_PIN = pin("#f0b429");

/* ------------------------------- fallback ------------------------------- */

/**
 * Drawn coverage. Used when Maps is unconfigured or the script fails — same
 * square, same pale ground, same shaded radius, so the card never changes
 * shape and never shows an error.
 */
function DrawnCoverage() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#f4f4f5]">
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 2px, transparent 2px), linear-gradient(90deg, #ffffff 2px, transparent 2px), linear-gradient(#e6e6ec 1px, transparent 1px), linear-gradient(90deg, #e6e6ec 1px, transparent 1px)",
          backgroundSize: "96px 96px, 96px 96px, 24px 24px, 24px 24px",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#4b45c6]/50 bg-[#6c63e8]/45"
      />
      {[
        { top: "26%", left: "58%" },
        { top: "40%", left: "40%" },
        { top: "56%", left: "62%" },
        { top: "68%", left: "38%" },
        { top: "80%", left: "52%" },
      ].map((position) => (
        <span
          key={`${position.top}-${position.left}`}
          aria-hidden="true"
          className="absolute block h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#4f8ff7]"
          style={position}
        />
      ))}
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 block h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#f0b429]"
      />
    </div>
  );
}

/* -------------------------------- widget -------------------------------- */

export function CoverageMap({ className }: { className?: string }) {
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({
    once: true,
    rootMargin: "250px",
    threshold: 0,
  });
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMapsMap | null>(null);
  const started = useRef(false);
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
          styles: KABURA_MAP_STYLE_LIGHT,
          disableDefaultUI: true,
          zoomControl: true,
          // Never let the widget capture the page's scroll.
          gestureHandling: "cooperative",
          keyboardShortcuts: false,
          clickableIcons: false,
          backgroundColor: "#f4f4f5",
        });
        mapRef.current = map;

        new maps.Circle({
          map,
          center: centre,
          radius: serviceRegionRadius(),
          strokeColor: "#4b45c6",
          strokeOpacity: 0.55,
          strokeWeight: 1.5,
          fillColor: "#6c63e8",
          fillOpacity: 0.45,
          clickable: false,
        });

        // Origin of the radius.
        new maps.Marker({
          map,
          position: centre,
          title: "Kabura Tiling Group",
          clickable: false,
          zIndex: 30,
          icon: {
            url: BASE_PIN,
            scaledSize: new maps.Size(32, 43),
            anchor: new maps.Point(16, 43),
          },
        });

        const bounds = new maps.LatLngBounds();
        for (const area of SERVICE_AREAS) {
          bounds.extend(area.coords);
          new maps.Marker({
            map,
            position: area.coords,
            title: area.name,
            clickable: false,
            zIndex: 20,
            icon: {
              url: AREA_PIN,
              scaledSize: new maps.Size(26, 35),
              anchor: new maps.Point(13, 35),
            },
          });
        }

        map.fitBounds(bounds, 28);
        setLive(true);
      })
      .catch(() => {
        // Leave `live` false; the drawn coverage stays. Not something the
        // visitor needs to be told about.
      });

    return () => {
      cancelled = true;
    };
  }, [configured, inView]);

  return (
    <div ref={viewRef} className={cn("w-full max-w-[22rem]", className)}>
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

        {/* Square map */}
        <div className="relative aspect-square w-full">
          <DrawnCoverage />
          <div
            ref={mapNode}
            aria-label={`Map of the ${SERVICE_AREAS.length} areas Kabura Tiling services`}
            role="img"
            className={cn(
              "absolute inset-0 h-full w-full transition-opacity duration-1000",
              live ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-stone/15 px-4 py-3">
          <span className="flex items-center gap-2 text-[0.68rem] text-stone">
            <span
              aria-hidden="true"
              className="block h-2 w-2 shrink-0 rounded-full bg-[#6c63e8]"
            />
            Coverage
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
