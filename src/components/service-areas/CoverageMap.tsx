"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  KABURA_MAP_STYLE,
  isMapsConfigured,
  loadGoogleMaps,
  type GMapsMap,
} from "@/lib/google-maps";
import {
  SERVICE_AREAS,
  serviceRegionCentre,
  serviceRegionRadius,
  type ServiceArea,
} from "@/lib/service-areas";
import { useInView } from "@/hooks/use-in-view";
import { cn } from "@/lib/utils";

/**
 * Compact coverage map.
 *
 * Shows the suburbs Kabura has actually confirmed, and says so. The shaded
 * radius is a visual aid around those points — the card states in as many words
 * that the list is the authority, because a circle drawn on a map is not a
 * coverage promise and should never be read as one. Nothing here claims the
 * whole state.
 *
 * The Maps script is only fetched once the card scrolls into view, so a visitor
 * who never reaches it pays nothing. With no API key configured — or if the
 * script fails — the fallback panel renders instead and the page is unaffected.
 */

const MARKER_ICON =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">
      <path d="M13 33C13 33 24 21.6 24 13A11 11 0 1 0 2 13c0 8.6 11 20 11 20Z" fill="#cf9d5f" stroke="#0b0a09" stroke-width="1.4"/>
      <circle cx="13" cy="13" r="4" fill="#0b0a09"/>
    </svg>`,
  );

function AreaChips({
  active,
  onSelect,
}: {
  active: string | null;
  onSelect?: (area: ServiceArea) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {SERVICE_AREAS.map((area) =>
        onSelect ? (
          <li key={area.slug}>
            <button
              type="button"
              onClick={() => onSelect(area)}
              aria-pressed={active === area.slug}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs transition-colors duration-300",
                active === area.slug
                  ? "border-bronze-light bg-bronze-light/15 text-bronze-light"
                  : "border-stone/25 text-sand/80 hover:border-stone/50 hover:text-bone",
              )}
            >
              {area.name}
            </button>
          </li>
        ) : (
          <li key={area.slug}>
            <Link
              href={`/service-areas/${area.slug}`}
              className="inline-block rounded-full border border-stone/25 px-3.5 py-1.5 text-xs text-sand/80 transition-colors duration-300 hover:border-bronze-light hover:text-bronze-light"
            >
              {area.name}
            </Link>
          </li>
        ),
      )}
    </ul>
  );
}

/** Shown when Maps is unconfigured or unavailable. Never an error message. */
function CoverageFallback() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-stone/20 bg-charcoal">
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 35%, color-mix(in oklab, var(--color-bronze) 26%, transparent), transparent 58%), radial-gradient(circle at 72% 68%, color-mix(in oklab, var(--color-slate) 40%, transparent), transparent 60%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-stone) 1px, transparent 1px), linear-gradient(90deg, var(--color-stone) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="relative p-6 sm:p-8">
        <p className="eyebrow text-bronze-light">Coverage</p>
        <p className="mt-4 max-w-md text-lead text-bone">
          The suburbs we have confirmed we service.
        </p>
        <div className="mt-6">
          <AreaChips active={null} />
        </div>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-sand/65">
          Somewhere nearby that is not on the list? Send us the address — we
          will tell you honestly whether we can get there.
        </p>
      </div>
    </div>
  );
}

export function CoverageMap({ className }: { className?: string }) {
  const { ref: viewRef, inView } = useInView<HTMLDivElement>({
    once: true,
    rootMargin: "200px",
    threshold: 0,
  });
  const mapNode = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GMapsMap | null>(null);

  // Starts as "loading": the placeholder is what should be on screen until the
  // map is actually drawn, whether or not the script has been asked for yet.
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const started = useRef(false);
  const [active, setActive] = useState<ServiceArea | null>(null);

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
          zoom: 10,
          styles: KABURA_MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
          clickableIcons: false,
          backgroundColor: "#14120f",
        });
        mapRef.current = map;

        new maps.Circle({
          map,
          center: centre,
          radius: serviceRegionRadius(),
          strokeColor: "#cf9d5f",
          strokeOpacity: 0.5,
          strokeWeight: 1.5,
          fillColor: "#a9743d",
          fillOpacity: 0.12,
          clickable: false,
        });

        const bounds = new maps.LatLngBounds();
        for (const area of SERVICE_AREAS) {
          bounds.extend(area.coords);
          const marker = new maps.Marker({
            map,
            position: area.coords,
            title: area.name,
            icon: {
              url: MARKER_ICON,
              scaledSize: new maps.Size(26, 34),
              anchor: new maps.Point(13, 33),
            },
          });
          marker.addListener("click", () => setActive(area));
        }

        map.fitBounds(bounds, 56);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [configured, inView]);

  if (!configured || status === "error") {
    return (
      <div ref={viewRef} className={className}>
        <CoverageFallback />
      </div>
    );
  }

  const focus = (area: ServiceArea) => {
    setActive(area);
    const map = mapRef.current;
    if (!map) return;
    map.setCenter(area.coords);
    map.setZoom(Math.max(map.getZoom() ?? 10, 12));
  };

  return (
    <div ref={viewRef} className={className}>
      <div className="overflow-hidden rounded-xl border border-stone/20 bg-charcoal">
        {/* Fixed aspect so the card never shifts the page while the map loads. */}
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-[3/2]">
          <div
            ref={mapNode}
            className="absolute inset-0 h-full w-full"
            aria-label="Map of the suburbs Kabura Tiling services"
            role="application"
          />

          {status !== "ready" ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 grid place-items-center bg-charcoal"
            >
              <span className="flex items-center gap-3 text-xs tracking-[0.16em] text-stone uppercase">
                <span className="block h-1.5 w-1.5 animate-pulse rounded-full bg-bronze-light" />
                Loading map
              </span>
            </div>
          ) : null}

          {/* Selected suburb, styled in the site's own palette rather than an
              InfoWindow, which cannot be themed to match. */}
          {active && status === "ready" ? (
            <div className="glass pointer-events-auto absolute inset-x-3 bottom-3 rounded-lg border border-stone/25 p-4 sm:inset-x-auto sm:left-4 sm:max-w-xs">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow text-bronze-light">{active.region}</p>
                  <p className="mt-1.5 font-display text-xl font-medium tracking-[-0.02em] text-bone">
                    {active.name}
                  </p>
                  <p className="mt-1 text-xs text-stone tabular-nums">
                    {active.postcodes.join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-stone/30 text-sand transition-colors hover:border-bronze-light hover:text-bronze-light"
                >
                  <span className="sr-only">Close</span>
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" aria-hidden="true">
                    <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.7" />
                  </svg>
                </button>
              </div>
              <Link
                href={`/service-areas/${active.slug}`}
                className="link-underline mt-3 inline-block text-sm text-bronze-light"
              >
                {active.name} tiling
              </Link>
            </div>
          ) : null}
        </div>

        {/* Suburb shortcuts — also the accessible, non-map route to every area. */}
        <div className="border-t border-stone/15 p-4 sm:p-5">
          <AreaChips active={active?.slug ?? null} onSelect={focus} />
          <p className="mt-4 text-xs leading-relaxed text-stone">
            The shaded area is a guide. The suburbs listed above are the ones we
            have confirmed — ask us about anywhere else.
          </p>
        </div>
      </div>
    </div>
  );
}
