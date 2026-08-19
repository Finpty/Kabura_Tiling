export type ServiceArea = {
  slug: string;
  name: string;
  /** Local government area or district, used in copy and structured data. */
  region: string;
  postcodes: string[];
  /**
   * Suburb centroid, used to place the marker on the coverage map.
   * Public geographic data — nothing here implies a job at that address.
   */
  coords: { lat: number; lng: number };
  /** One or two sentences of genuinely local, non-fabricated context. */
  intro: string;
  /** Housing-stock notes that legitimately shape tiling work in the area. */
  notes: string[];
  /** Nearby suburbs served from the same run. Used for internal linking. */
  nearby: string[];
};

/**
 * ⚠️  Only add a location here once Kabura has confirmed they service it.
 * The site never claims to cover "all of WA" — `/service-areas` renders exactly
 * this list plus an explicit "ask us about anywhere else" prompt.
 *
 * Postcodes and region names are factual Australia Post / LGA data. Nothing here
 * asserts completed work, response times or coverage guarantees.
 */
export const SERVICE_AREAS: ServiceArea[] = [
  {
    slug: "perth",
    name: "Perth",
    region: "Perth metropolitan area",
    postcodes: ["6000", "6003", "6004", "6005", "6006"],
    coords: { lat: -31.9523, lng: 115.8613 },
    intro:
      "Tiling, waterproofing and bathroom work across the Perth metropolitan area, covering apartments and inner-suburban homes as well as commercial fit-outs.",
    notes: [
      "Apartment work usually means strata approval, lift bookings and restricted work hours — all of which change how a bathroom is sequenced.",
      "Inner-suburban housing stock varies enormously in age, so substrates are assessed on site rather than assumed.",
    ],
    nearby: ["rockingham", "baldivis", "mandurah"],
  },
  {
    slug: "rockingham",
    name: "Rockingham",
    region: "City of Rockingham",
    postcodes: ["6168"],
    coords: { lat: -32.2767, lng: 115.7297 },
    intro:
      "Bathroom renovations, floor and wall tiling, and outdoor areas throughout Rockingham and the surrounding coastal suburbs.",
    notes: [
      "Coastal exposure makes sealing and the choice of external finishes matter more than they do inland.",
      "A lot of the local stock is slab-on-ground, which suits large-format floors once the substrate is checked for flatness.",
    ],
    nearby: ["baldivis", "port-kennedy", "secret-harbour"],
  },
  {
    slug: "mandurah",
    name: "Mandurah",
    region: "City of Mandurah",
    postcodes: ["6210"],
    coords: { lat: -32.5269, lng: 115.7217 },
    intro:
      "Tiling and bathroom renovations across Mandurah, including canal-side homes, established housing and new estates.",
    notes: [
      "Waterfront and canal properties often need particular attention to external falls, drainage and movement joints.",
      "Renovation work on older stock frequently uncovers failed membranes that have to be rectified before new tiling.",
    ],
    nearby: ["secret-harbour", "port-kennedy", "baldivis"],
  },
  {
    slug: "baldivis",
    name: "Baldivis",
    region: "City of Rockingham",
    postcodes: ["6171"],
    coords: { lat: -32.3167, lng: 115.8167 },
    intro:
      "New-build and renovation tiling throughout Baldivis, from complete house packages to single bathroom upgrades.",
    notes: [
      "Newer estates mean a lot of builder-standard finishes being upgraded to large-format tiles and full-height wall tiling.",
      "New-build programs are tight, so tiling is scheduled around the preceding trades rather than in isolation.",
    ],
    nearby: ["rockingham", "port-kennedy", "secret-harbour"],
  },
  {
    slug: "secret-harbour",
    name: "Secret Harbour",
    region: "City of Rockingham",
    postcodes: ["6173"],
    coords: { lat: -32.4033, lng: 115.755 },
    intro:
      "Bathrooms, floors, alfrescos and pool surrounds across Secret Harbour and the surrounding coastal estates.",
    notes: [
      "Alfresco and pool-surround tiling needs slip-resistant finishes and falls detailed away from the building.",
      "Salt exposure makes sealing natural stone and choosing the right grout a practical decision, not a cosmetic one.",
    ],
    nearby: ["port-kennedy", "rockingham", "mandurah"],
  },
  {
    slug: "port-kennedy",
    name: "Port Kennedy",
    region: "City of Rockingham",
    postcodes: ["6172"],
    coords: { lat: -32.3789, lng: 115.7539 },
    intro:
      "Residential tiling, waterproofing and bathroom renovations throughout Port Kennedy and neighbouring suburbs.",
    notes: [
      "Bathrooms in the area's established housing often benefit from a full strip-out rather than a surface refresh.",
      "Outdoor and alfresco areas need external-grade detailing to handle sun, wind and rain exposure.",
    ],
    nearby: ["secret-harbour", "rockingham", "baldivis"],
  },
  {
    slug: "gosnells",
    name: "Gosnells",
    region: "City of Gosnells",
    postcodes: ["6110"],
    coords: { lat: -32.0806, lng: 115.9631 },
    intro:
      "Tiling, waterproofing and bathroom renovations throughout Gosnells and the surrounding south-eastern suburbs.",
    notes: [
      "The area mixes long-established homes with newer infill, so a bathroom here can mean anything from a full strip-out to a straightforward new-build fit-off.",
      "Older brick-and-tile stock often hides original screeds and membranes that have to be assessed before anything new goes down.",
    ],
    nearby: ["perth", "cockburn", "rockingham"],
  },
  {
    slug: "cockburn",
    name: "Cockburn",
    region: "City of Cockburn",
    postcodes: ["6163", "6164"],
    coords: { lat: -32.1233, lng: 115.8467 },
    intro:
      "Floor and wall tiling, waterproofing and bathroom work across the City of Cockburn, from the established western suburbs through to the newer estates inland.",
    notes: [
      "Much of the newer housing is slab-on-ground, which suits large-format floors provided the substrate is checked for flatness first.",
      "Homes closer to the coast need the same care with sealing and external finishes that the rest of the coastal strip does.",
    ],
    nearby: ["perth", "rockingham", "gosnells"],
  },
];

export const getServiceArea = (slug: string) =>
  SERVICE_AREAS.find((area) => area.slug === slug);

export const serviceAreaNames = () => SERVICE_AREAS.map((a) => a.name);

/* ------------------------------ coverage map ------------------------------ */

/**
 * Geometry for the coverage map, derived from the list above rather than
 * hand-tuned. Add an area and the map re-centres and re-scales itself — there
 * are no coordinates to keep in sync in a second place.
 */

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres. */
export function distanceBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Mean position of every listed suburb. */
export const serviceRegionCentre = () => {
  const total = SERVICE_AREAS.reduce(
    (acc, area) => ({
      lat: acc.lat + area.coords.lat,
      lng: acc.lng + area.coords.lng,
    }),
    { lat: 0, lng: 0 },
  );
  return {
    lat: total.lat / SERVICE_AREAS.length,
    lng: total.lng / SERVICE_AREAS.length,
  };
};

/**
 * Radius in metres that reaches the furthest listed suburb, plus a margin so
 * the shaded region reads as coverage rather than a boundary claim. It is a
 * visual device: the authoritative list is `SERVICE_AREAS`, and the map says so.
 */
export const serviceRegionRadius = () => {
  const centre = serviceRegionCentre();
  const furthest = SERVICE_AREAS.reduce(
    (max, area) => Math.max(max, distanceBetween(centre, area.coords)),
    0,
  );
  return Math.round(furthest + 6_000);
};
