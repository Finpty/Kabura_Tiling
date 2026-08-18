export type ServiceCategory =
  | "Installation"
  | "Preparation"
  | "Protection"
  | "Renovation"
  | "Maintenance";

export type Service = {
  slug: string;
  title: string;
  /** Short label used in tight UI (nav, chips, form options). */
  short: string;
  category: ServiceCategory;
  /** One line, used on hover panels and meta descriptions. */
  summary: string;
  /** Two or three paragraphs for the service detail page. */
  body: string[];
  /** Concrete, non-boastful scope points. */
  scope: string[];
  /** Image key resolved through `lib/media.ts`. */
  image: string;
  /** Optional short clip shown on hover / on the detail page. */
  video?: string;
};

/**
 * Service copy describes *what the work involves* — it makes no claims about
 * years of experience, awards, licences or volumes, none of which have been supplied.
 */
export const SERVICES: Service[] = [
  {
    slug: "residential-tiling",
    title: "Residential Tiling",
    short: "Residential",
    category: "Installation",
    summary:
      "Whole-home tiling for new builds and renovations — floors, walls, wet areas and living spaces.",
    body: [
      "Residential tiling covers everything from a single laundry through to a complete house. The work is planned around the set-out first: where the full tiles land, where the cuts fall, how the joints line through from room to room, and how the floor meets every doorway, skirting and threshold.",
      "We work to the substrate we are given. Where a floor needs levelling, a wall needs sheeting or a junction needs re-forming, that happens before a single tile is fixed — because no amount of care during installation fixes a surface that was never flat.",
    ],
    scope: [
      "Set-out planning and tile take-off",
      "Substrate checks, levelling and preparation",
      "Floor and wall installation to wet and dry areas",
      "Cutting, mitres, trims and edge details",
      "Grouting, silicone and clean-down",
    ],
    image: "residential",
  },
  {
    slug: "commercial-tiling",
    title: "Commercial Tiling",
    short: "Commercial",
    category: "Installation",
    summary:
      "Tiling for fit-outs, hospitality, retail, amenities and multi-residential projects.",
    body: [
      "Commercial work is as much about sequencing as it is about tiling. Access, trade order, staged handovers and site inductions all shape how the job runs, and we plan the tiling program around the builder's schedule rather than the other way around.",
      "Finishes are specified more tightly on commercial jobs — movement joints, slip ratings, falls to waste, and the transitions between floor coverings all need to be resolved on paper before the first tile goes down.",
    ],
    scope: [
      "Programming around builder and trade sequencing",
      "Amenities, wet areas and back-of-house",
      "Movement joints and expansion detailing",
      "Slip-rated and heavy-traffic floor finishes",
      "Progressive handover and defect close-out",
    ],
    image: "commercial",
  },
  {
    slug: "bathroom-renovations",
    title: "Bathroom Renovations",
    short: "Bathroom",
    category: "Renovation",
    summary:
      "Complete bathrooms — demolition, preparation, waterproofing, screeding, tiling and final finishes.",
    body: [
      "A bathroom is the most technically demanding room in a house. Every surface has to shed water, every junction has to stay sealed, and every line is visible from a metre away. It rewards preparation and punishes shortcuts.",
      "We handle the full sequence — strip-out, rectification of what is found behind the old surfaces, screeding to correct falls, waterproofing to the wet-area standard, then tiling, grouting and sealing. One team carries the room from demolition through to the final silicone bead.",
    ],
    scope: [
      "Strip-out and disposal",
      "Substrate rectification and sheeting",
      "Screeding to correct falls",
      "Wet-area waterproofing",
      "Floor, wall and niche tiling",
      "Grout, silicone and final detailing",
    ],
    image: "bathroom",
  },
  {
    slug: "floor-tiling",
    title: "Floor Tiling",
    short: "Floor tiling",
    category: "Installation",
    summary:
      "Level, lippage-free floors set out so the cuts land where they should.",
    body: [
      "A floor shows every millimetre of error. Lippage between tiles, a joint that drifts across a room, or a cut that finishes at 20mm in the most visible corner — those are set-out decisions, not installation accidents.",
      "We measure the room before we start, dry-lay where it matters, and use levelling systems on large formats so the finished surface reads as one plane.",
    ],
    scope: [
      "Floor levelling and self-levelling compounds",
      "Set-out to balance cuts and align joints",
      "Levelling clip systems on large formats",
      "Thresholds, transitions and trims",
      "Movement joints where required",
    ],
    image: "floor",
  },
  {
    slug: "wall-tiling",
    title: "Wall Tiling",
    short: "Wall tiling",
    category: "Installation",
    summary:
      "Plumb, flat walls with joints that line through and corners that resolve properly.",
    body: [
      "Wall tiling is judged on its lines. Vertical joints have to stay plumb over height, horizontal joints have to run level around the room, and the pattern has to resolve sensibly into corners, niches and around fixtures.",
      "Where a wall is out, it gets corrected before tiling rather than absorbed into the adhesive bed.",
    ],
    scope: [
      "Wall preparation, sheeting and packing",
      "Vertical set-out and course planning",
      "Niches, shelves and recesses",
      "Mitred external corners and trims",
      "Cut-outs around tapware and fixtures",
    ],
    image: "wall",
  },
  {
    slug: "waterproofing",
    title: "Waterproofing",
    short: "Waterproofing",
    category: "Protection",
    summary:
      "Wet-area waterproofing completed properly, before anything covers it up.",
    body: [
      "Waterproofing is the layer nobody sees and the one that decides whether a bathroom lasts. It has to be continuous, correctly detailed at every junction, and given the time it needs to cure before tiling starts.",
      "Corners and wall-to-floor junctions are reinforced, penetrations are sealed, and coats are applied to the required thickness rather than the required appearance.",
    ],
    scope: [
      "Surface preparation and priming",
      "Bond breakers and reinforcing at junctions",
      "Sealing of penetrations and floor wastes",
      "Multi-coat application to wet-area requirements",
      "Cure time before tiling begins",
    ],
    image: "waterproofing",
    video: "waterproofing",
  },
  {
    slug: "screeding",
    title: "Screeding",
    short: "Screeding",
    category: "Preparation",
    summary: "Sand-cement screeds set to accurate falls so water goes where it should.",
    body: [
      "A shower floor that ponds was screeded wrong. Falls need to be consistent to the waste, without dishing, without flat spots and without a sudden ramp at the threshold.",
      "Screeds are set out from the waste and the finished floor level, then worked to a straight edge so the falls hold across the whole area.",
    ],
    scope: [
      "Set-out from waste and finished floor levels",
      "Sand-cement screeds to shower bases and wet areas",
      "Consistent falls checked with a straight edge",
      "Hobs, thresholds and step-downs",
      "Preparation for waterproofing",
    ],
    image: "screed",
  },
  {
    slug: "large-format-tiles",
    title: "Large Format Tiles",
    short: "Large format",
    category: "Installation",
    summary:
      "600×1200, 750×1500 and slab formats installed flat, with minimal joints.",
    body: [
      "Large formats look effortless and are not. They need a flatter substrate than smaller tiles tolerate, full adhesive coverage behind the whole tile, levelling systems through the setting time, and handling gear so the sheet arrives on the wall in one piece.",
      "The payoff is a surface with very few joints, which is exactly why it has to be flat — there is nothing to hide behind.",
    ],
    scope: [
      "Substrate flatness assessment and correction",
      "Back-buttering for full adhesive coverage",
      "Levelling clip and wedge systems",
      "Precision cutting and mitred edges",
      "Minimal, consistent joint widths",
    ],
    image: "largeFormat",
    video: "largeFormat",
  },
  {
    slug: "natural-stone",
    title: "Natural Stone Installation",
    short: "Stone",
    category: "Installation",
    summary:
      "Marble, travertine, limestone and engineered stone — set, sealed and vein-matched.",
    body: [
      "Natural stone behaves differently to porcelain. It is porous, it moves, it stains, and its colour varies from crate to crate. It needs the right adhesive, the right sealer, and dry-laying before installation so the tonal run across a room is deliberate rather than random.",
      "Where slabs are book-matched or vein-matched, the layout is planned first and cut to suit the feature, not the offcut.",
    ],
    scope: [
      "Dry-lay and tonal blending across batches",
      "Vein matching and book-matched features",
      "Stone-appropriate adhesives and grouts",
      "Sealing before and after grouting",
      "Honed, polished and tumbled finishes",
    ],
    image: "stone",
  },
  {
    slug: "outdoor-alfresco-tiling",
    title: "Outdoor / Alfresco Tiling",
    short: "Outdoor",
    category: "Installation",
    summary:
      "Alfrescos, patios, pool surrounds and balconies — detailed for water and movement.",
    body: [
      "Outside, the tiling has to deal with water, heat and movement. Falls have to run away from the building, drainage has to be detailed at the threshold, and movement joints have to be placed where the slab will actually move.",
      "Slip resistance matters here more than anywhere else in the house, particularly around pools and on steps.",
    ],
    scope: [
      "Falls away from the building and to drainage",
      "External waterproofing and drainage details",
      "Movement joints and perimeter gaps",
      "Slip-resistant finishes to wet traffic areas",
      "Step nosings, coping and edge treatments",
    ],
    image: "outdoor",
  },
  {
    slug: "demolition-and-preparation",
    title: "Demolition & Preparation",
    short: "Demolition & prep",
    category: "Preparation",
    summary:
      "Strip-out, disposal and substrate correction — the part that decides the finish.",
    body: [
      "Most tiling problems are inherited. Old beds, failed membranes, unsupported sheeting and out-of-plumb walls are all found during strip-out, and all of them have to be resolved before new work starts.",
      "We strip back to a sound substrate, correct what is found, and leave a surface that is actually ready to be tiled.",
    ],
    scope: [
      "Strip-out of tiles, screeds and old membranes",
      "Waste removal and site protection",
      "Substrate assessment and rectification",
      "Sheeting, packing and levelling",
      "Clean, primed surfaces ready for waterproofing",
    ],
    image: "demolition",
  },
  {
    slug: "regrouting-and-repairs",
    title: "Regrouting & Repairs",
    short: "Repairs",
    category: "Maintenance",
    summary:
      "Failed grout, drummy tiles, cracked joints and tired silicone put right.",
    body: [
      "Not every job needs a full renovation. Grout that has stained or crumbled, a handful of drummy tiles, a cracked joint or perished silicone can often be repaired without touching the rest of the room.",
      "Where the underlying cause is a failed membrane or a movement problem, we will say so rather than grout over it.",
    ],
    scope: [
      "Grout removal and regrouting",
      "Replacement of drummy or cracked tiles",
      "Silicone renewal to junctions and penetrations",
      "Sealing of natural stone and porous grout",
      "Honest assessment where a repair will not hold",
    ],
    image: "repairs",
  },
];

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  "Installation",
  "Preparation",
  "Protection",
  "Renovation",
  "Maintenance",
];

export const getService = (slug: string) =>
  SERVICES.find((service) => service.slug === slug);

/** Options offered in step 1 of the quote wizard. */
export const QUOTE_SERVICE_OPTIONS = [
  { value: "bathroom", label: "Bathroom" },
  { value: "floor-tiling", label: "Floor tiling" },
  { value: "wall-tiling", label: "Wall tiling" },
  { value: "outdoor", label: "Outdoor" },
  { value: "commercial", label: "Commercial" },
  { value: "waterproofing", label: "Waterproofing" },
  { value: "stone", label: "Stone" },
  { value: "repair", label: "Repair" },
  { value: "other", label: "Other" },
] as const;

export type QuoteServiceValue = (typeof QUOTE_SERVICE_OPTIONS)[number]["value"];
