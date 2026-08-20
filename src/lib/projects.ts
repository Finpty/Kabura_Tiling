import { img, type MediaImage } from "./media";

export const PROJECT_CATEGORIES = [
  "Residential",
  "Bathrooms",
  "Commercial",
  "Stone",
  "Outdoor",
  "Large Format",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export type ProjectImage = {
  /** Media key, or an absolute path once real photography is loaded. */
  key: string;
  caption?: string;
};

export type Project = {
  slug: string;
  title: string;
  category: ProjectCategory;
  /** Project metadata shown in the detail panel. */
  projectType: string;
  suburb: string;
  tileType: string;
  tileSize: string;
  servicesCompleted: string[];
  description: string;
  cover: string;
  gallery: ProjectImage[];
  beforeAfter?: { before: string; after: string; label?: string };
  video?: string;
  /**
   * TRUE for every record shipped with the site. These are layout placeholders —
   * the imagery is brand/atmosphere visuals, NOT photographs of completed Kabura
   * customer projects. Every surface that renders a project shows the placeholder
   * treatment while this flag is set. Replace with real records via Supabase.
   */
  isPlaceholder: boolean;
};

/**
 * ⚠️  PLACEHOLDER PROJECT RECORDS — REPLACE BEFORE LAUNCH
 *
 * No completed Kabura project has been supplied, so nothing here describes real
 * work. Suburbs, tile selections and scopes are illustrative examples of the
 * *shape* of a project record, chosen to exercise every field and filter in the
 * UI. They are deliberately generic and are never presented as case studies.
 *
 * The titles read cleanly rather than carrying a "Placeholder —" prefix: the
 * disclosure belongs on the page, where it is stated in full, and on the card's
 * own Sample badge — not smuggled into a project name that then has to be
 * edited out when the real record arrives. `isPlaceholder` stays true, so every
 * surface that renders one still shows the placeholder treatment.
 *
 * To replace: insert rows into the `projects` / `project_media` tables in
 * Supabase (see `supabase/migrations`). `getProjects()` prefers the database
 * whenever it is configured and only falls back to this list otherwise.
 */
export const PLACEHOLDER_PROJECTS: Project[] = [
  {
    slug: "placeholder-coastal-ensuite",
    title: "Coastal Ensuite",
    category: "Bathrooms",
    projectType: "Bathroom renovation",
    suburb: "Suburb to be confirmed",
    tileType: "Stone-look porcelain",
    tileSize: "600 × 1200",
    servicesCompleted: [
      "Demolition & preparation",
      "Screeding",
      "Waterproofing",
      "Wall & floor tiling",
      "Grouting & silicone",
    ],
    description:
      "Layout placeholder for a full ensuite renovation record. Replace the imagery, metadata and description with a completed Kabura project.",
    cover: "bathroom",
    gallery: [
      { key: "bathroom", caption: "Placeholder image" },
      { key: "cornerDetail", caption: "Placeholder image" },
      { key: "heroBathroomAlt", caption: "Placeholder image" },
    ],
    beforeAfter: {
      before: "waterproofing",
      after: "bathroom",
      label: "Kabura Finish",
    },
    isPlaceholder: true,
  },
  {
    slug: "placeholder-large-format-living",
    title: "Large-Format Living",
    category: "Large Format",
    projectType: "New build, ground floor",
    suburb: "Suburb to be confirmed",
    tileType: "Large-format porcelain",
    tileSize: "750 × 1500",
    servicesCompleted: [
      "Substrate levelling",
      "Large format floor tiling",
      "Thresholds & transitions",
      "Grouting",
    ],
    description:
      "Layout placeholder for a large-format floor record. Replace with a completed Kabura installation.",
    cover: "residential",
    gallery: [
      { key: "residential", caption: "Placeholder image" },
      { key: "largeFormat", caption: "Placeholder image" },
      { key: "floorTiling", caption: "Placeholder image" },
    ],
    beforeAfter: {
      before: "demolition",
      after: "residential",
      label: "Kabura Finish",
    },
    isPlaceholder: true,
  },
  {
    slug: "placeholder-stone-feature-wall",
    title: "Stone Feature Wall",
    category: "Stone",
    projectType: "Feature wall installation",
    suburb: "Suburb to be confirmed",
    tileType: "Natural stone, book-matched",
    tileSize: "Slab",
    servicesCompleted: [
      "Dry-lay & vein matching",
      "Substrate preparation",
      "Stone installation",
      "Sealing",
    ],
    description:
      "Layout placeholder for a natural stone record. Replace with a completed Kabura stone installation.",
    cover: "stoneFeature",
    gallery: [
      { key: "stoneFeature", caption: "Placeholder image" },
      { key: "stone", caption: "Placeholder image" },
      { key: "stoneSlab", caption: "Placeholder image" },
    ],
    isPlaceholder: true,
  },
  {
    slug: "placeholder-commercial-amenities",
    title: "Commercial Amenities",
    category: "Commercial",
    projectType: "Commercial fit-out",
    suburb: "Suburb to be confirmed",
    tileType: "Slip-rated porcelain",
    tileSize: "600 × 600",
    servicesCompleted: [
      "Preparation",
      "Waterproofing",
      "Floor & wall tiling",
      "Movement joints",
    ],
    description:
      "Layout placeholder for a commercial record. Replace with a completed Kabura commercial project.",
    cover: "commercial",
    gallery: [
      { key: "commercial", caption: "Placeholder image" },
      { key: "waterproofing", caption: "Placeholder image" },
    ],
    isPlaceholder: true,
  },
  {
    slug: "placeholder-alfresco-terrace",
    title: "Alfresco Terrace",
    category: "Outdoor",
    projectType: "Outdoor / alfresco",
    suburb: "Suburb to be confirmed",
    tileType: "External-grade porcelain",
    tileSize: "600 × 600",
    servicesCompleted: [
      "Falls & drainage detailing",
      "External waterproofing",
      "Outdoor tiling",
      "Movement joints",
    ],
    description:
      "Layout placeholder for an outdoor record. Replace with a completed Kabura alfresco or pool-surround project.",
    cover: "outdoor",
    gallery: [
      { key: "outdoor", caption: "Placeholder image" },
      { key: "screed", caption: "Placeholder image" },
    ],
    isPlaceholder: true,
  },
  {
    slug: "placeholder-whole-home-tiling",
    title: "Whole-Home Floors",
    category: "Residential",
    projectType: "Residential, whole home",
    suburb: "Suburb to be confirmed",
    tileType: "Porcelain",
    tileSize: "600 × 600",
    servicesCompleted: [
      "Set-out planning",
      "Floor & wall tiling",
      "Wet area waterproofing",
      "Grouting & clean-down",
    ],
    description:
      "Layout placeholder for a whole-home record. Replace with a completed Kabura residential project.",
    cover: "floorTiling",
    gallery: [
      { key: "floorTiling", caption: "Placeholder image" },
      { key: "wall", caption: "Placeholder image" },
      { key: "repairs", caption: "Placeholder image" },
    ],
    beforeAfter: {
      before: "screed",
      after: "floorTiling",
      label: "Kabura Finish",
    },
    isPlaceholder: true,
  },
];

/** Resolve a project image key to concrete `next/image` props. */
export function projectImage(key: string): MediaImage {
  return img(key);
}

export const getPlaceholderProject = (slug: string) =>
  PLACEHOLDER_PROJECTS.find((p) => p.slug === slug);
