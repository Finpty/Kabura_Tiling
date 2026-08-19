/**
 * The build-up, as plain data.
 *
 * Deliberately its own module with no three.js imports. `SlabStage` needs these
 * layers to render its HTML labels and its CSS fallback, and if it read them
 * from `SlabScene` the static import would pull the entire three.js bundle into
 * the main chunk — defeating the dynamic import and costing every page on the
 * site a quarter of a megabyte it never uses.
 */
export type SlabLayer = {
  id: string;
  label: string;
  detail: string;
  /** Base colour, also used by the CSS fallback. */
  colour: string;
  thickness: number;
  roughness: number;
  metalness: number;
};

export const SLAB_LAYERS: SlabLayer[] = [
  {
    id: "tile",
    label: "Tile",
    detail: "The only layer anyone ever sees.",
    colour: "#ddd6c9",
    thickness: 0.09,
    roughness: 0.22,
    metalness: 0.04,
  },
  {
    id: "adhesive",
    label: "Adhesive",
    detail: "Combed and back-buttered for full coverage.",
    colour: "#8c8880",
    thickness: 0.055,
    roughness: 0.92,
    metalness: 0,
  },
  {
    id: "waterproofing",
    label: "Waterproofing",
    detail: "Continuous, reinforced at every junction.",
    colour: "#3f3a34",
    thickness: 0.04,
    roughness: 0.55,
    metalness: 0,
  },
  {
    id: "screed",
    label: "Screed",
    detail: "Set to falls so water reaches the waste.",
    colour: "#a49a8c",
    thickness: 0.1,
    roughness: 0.96,
    metalness: 0,
  },
  {
    id: "substrate",
    label: "Substrate",
    detail: "Checked and corrected before anything goes on it.",
    colour: "#55504a",
    thickness: 0.13,
    roughness: 0.99,
    metalness: 0,
  },
];
