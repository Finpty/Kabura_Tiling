/**
 * Google Maps JS API loader.
 *
 * A ~40-line loader rather than a dependency: the site needs one map, and the
 * official loader package is mostly features this never uses.
 *
 * THE KEY IS NEVER HARDCODED. It comes from
 * `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, which is a browser key by necessity — the
 * Maps JS API runs in the browser and every Maps key is public in that sense.
 * The protection is an HTTP-referrer restriction on the key in the Google Cloud
 * console, not secrecy. Restrict it to the site's domains, and to the Maps
 * JavaScript API only. It is deliberately a *different* key from
 * `GOOGLE_PLACES_API_KEY`, which is server-side and must stay unrestricted by
 * referrer — mixing the two would either break the map or expose the Places key.
 *
 * Unset, `isMapsConfigured()` is false and the caller renders its fallback.
 * Nothing throws and no script is injected.
 */

export const MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

export const isMapsConfigured = () => Boolean(MAPS_API_KEY.trim());

/* --------------------------- minimal typings ----------------------------- */
/* Structural types for exactly the surface used below. Small enough to keep
   honest, and avoids a types package for one component. */

export type LatLng = { lat: number; lng: number };

export type GMapsMap = {
  fitBounds: (bounds: GMapsBounds, padding?: number) => void;
  setCenter: (position: LatLng) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number | undefined;
  addListener: (event: string, handler: () => void) => void;
};

export type GMapsBounds = { extend: (position: LatLng) => void };

export type GMapsMarker = {
  addListener: (event: string, handler: () => void) => void;
  setMap: (map: GMapsMap | null) => void;
};

export type GMapsInfoWindow = {
  setContent: (content: string | HTMLElement) => void;
  open: (options: { map: GMapsMap; anchor?: GMapsMarker }) => void;
  close: () => void;
};

export type GMapsCircle = { setMap: (map: GMapsMap | null) => void };

export type GoogleMapsApi = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GMapsMap;
  Marker: new (options: Record<string, unknown>) => GMapsMarker;
  Circle: new (options: Record<string, unknown>) => GMapsCircle;
  InfoWindow: new (options?: Record<string, unknown>) => GMapsInfoWindow;
  LatLngBounds: new () => GMapsBounds;
  Point: new (x: number, y: number) => unknown;
  Size: new (width: number, height: number) => unknown;
};

declare global {
  interface Window {
    google?: { maps?: GoogleMapsApi };
  }
}

const SCRIPT_ID = "kabura-google-maps";

let pending: Promise<GoogleMapsApi> | null = null;

/** Loads the Maps JS API once per page, whoever asks and however often. */
export function loadGoogleMaps(): Promise<GoogleMapsApi> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("Google Maps can only load in the browser"),
    );
  }
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (pending) return pending;

  const key = MAPS_API_KEY.trim();
  if (!key)
    return Promise.reject(
      new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"),
    );

  pending = new Promise<GoogleMapsApi>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    const onReady = () => {
      if (window.google?.maps) resolve(window.google.maps);
      else reject(new Error("Google Maps loaded without an API"));
    };

    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Google Maps failed to load")),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src =
      "https://maps.googleapis.com/maps/api/js" +
      `?key=${encodeURIComponent(key)}&loading=async&v=weekly`;
    script.addEventListener("load", onReady, { once: true });
    script.addEventListener(
      "error",
      () => {
        pending = null;
        reject(new Error("Google Maps failed to load"));
      },
      { once: true },
    );
    document.head.appendChild(script);
  });

  return pending;
}

/**
 * Dark map styling that matches the site's palette.
 *
 * Applied through `styles` rather than a cloud-hosted map ID on purpose: a map
 * ID would override this and force the styling into the Google Cloud console,
 * putting the site's own look behind someone else's dashboard.
 */
export const KABURA_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#14120f" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b8177" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0a09" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#3b352e" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a79c90" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1d1a16" }],
  },
  {
    featureType: "road",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#292520" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0b0a09" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3b352e" }],
  },
] as const;
