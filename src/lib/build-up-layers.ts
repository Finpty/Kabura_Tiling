/**
 * The build-up, as plain data.
 *
 * Five layers under a finished floor, top to bottom. Each one carries a real
 * photograph of the material rather than a colour standing in for it — an
 * overhead scan, so it maps onto the face of a plate without fighting the
 * isometric the stack is drawn in. See the `layer*` entries in
 * `scripts/optimise-assets.mjs` for where each scan comes from.
 *
 * `colour` is still here and still used: it paints the extruded edge of the
 * plate, where a photograph of the surface would be wrong.
 *
 * `thickness`, `roughness` and `metalness` are left in place too. They
 * described the material to the 3D renderer this section used to carry, and
 * they still describe it accurately if anything wants them again.
 */
export type BuildUpLayer = {
  id: string;
  label: string;
  detail: string;
  /** Media key for the overhead scan of this material. */
  image: string;
  /** Edge colour of the extruded plate, keyed to the material. */
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
    image: "layerTile",
    colour: "#ddd6c9",
    thickness: 0.09,
    roughness: 0.22,
    metalness: 0.04,
  },
  {
    id: "adhesive",
    label: "Adhesive",
    detail: "Combed and back-buttered for full coverage.",
    image: "layerAdhesive",
    colour: "#8c8880",
    thickness: 0.055,
    roughness: 0.92,
    metalness: 0,
  },
  {
    id: "waterproofing",
    label: "Waterproofing",
    detail: "Continuous, reinforced at every junction.",
    image: "layerWaterproofing",
    colour: "#3f3a34",
    thickness: 0.04,
    roughness: 0.55,
    metalness: 0,
  },
  {
    id: "screed",
    label: "Screed",
    detail: "Set to falls so water reaches the waste.",
    image: "layerScreed",
    colour: "#a49a8c",
    thickness: 0.1,
    roughness: 0.96,
    metalness: 0,
  },
  {
    id: "substrate",
    label: "Substrate",
    detail: "Checked and corrected before anything goes on it.",
    image: "layerSubstrate",
    colour: "#55504a",
    thickness: 0.13,
    roughness: 0.99,
    metalness: 0,
  },
];
