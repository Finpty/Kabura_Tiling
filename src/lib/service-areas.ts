export type ServiceArea = {
  slug: string;
  name: string;
  /** Local government area or district, used in copy and structured data. */
  region: string;
  postcodes: string[];
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
    intro:
      "Residential tiling, waterproofing and bathroom renovations throughout Port Kennedy and neighbouring suburbs.",
    notes: [
      "Bathrooms in the area's established housing often benefit from a full strip-out rather than a surface refresh.",
      "Outdoor and alfresco areas need external-grade detailing to handle sun, wind and rain exposure.",
    ],
    nearby: ["secret-harbour", "rockingham", "baldivis"],
  },
];

export const getServiceArea = (slug: string) =>
  SERVICE_AREAS.find((area) => area.slug === slug);

export const serviceAreaNames = () => SERVICE_AREAS.map((a) => a.name);
