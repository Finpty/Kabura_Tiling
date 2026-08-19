/**
 * The build-up, as plain data.
 *
 * Five layers under a finished floor, top to bottom. `thickness`, `roughness`
 * and `metalness` are left in place: they described the material to the 3D
 * renderer this section used to carry, and they still describe the material
 * accurately if anything wants them again.
 */
export type BuildUpLayer = {
  id: string;
  label: string;
  detail: string;
  /** Base colour, also used by the CSS fallback. */
  colour: string;
  thickness: number;
  roughness: number;
  metalness: number;
};

export const BUILD_UP_LAYERS: BuildUpLayer[] = [
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
