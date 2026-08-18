import manifest from "./media-manifest.json";

/**
 * Typed access to the output of `scripts/optimise-assets.mjs`.
 *
 * Components only ever reference a *key* (`"heroBathroom"`), never a path, so
 * swapping the underlying source — a client photograph replacing a generated
 * visual, for example — is a pipeline change, not a code change.
 */

export type MediaImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
  blurDataURL: string;
  /** Where the pixels came from. Surfaced in the admin asset notes. */
  source: "higgsfield" | "supplied" | "procedural";
};

export type MediaVideo = {
  mp4: string;
  webm?: string;
  poster: string;
  width: number;
  height: number;
  alt: string;
  blurDataURL: string;
  source: "higgsfield" | "supplied";
};

export type MaterialSwatch = {
  id: string;
  name: string;
  family: string;
  hex: string;
  src: string;
  width: number;
  height: number;
};

const images = manifest.images as unknown as Record<string, MediaImage>;
const videos = manifest.videos as unknown as Record<string, MediaVideo>;
const materials = manifest.materials as unknown as Record<string, MaterialSwatch>;

export type ImageKey = keyof typeof manifest.images;
export type VideoKey = keyof typeof manifest.videos;

/** Every image key resolves — the pipeline guarantees a source for each one. */
export function img(key: string): MediaImage {
  const found = images[key];
  if (!found) {
    throw new Error(
      `Unknown image key "${key}". Add it to IMAGES in scripts/optimise-assets.mjs and re-run "npm run assets:optimise".`,
    );
  }
  return found;
}

/** Videos are optional: a slot with no footage yet returns null. */
export function video(key: string): MediaVideo | null {
  return videos[key] ?? null;
}

export function material(id: string): MaterialSwatch | null {
  return materials[id] ?? null;
}

export const MATERIAL_LIST: MaterialSwatch[] = Object.values(materials);

/** Props spread straight onto `next/image`. */
export function imageProps(key: string, altOverride?: string) {
  const m = img(key);
  return {
    src: m.src,
    width: m.width,
    height: m.height,
    alt: altOverride ?? m.alt,
    placeholder: "blur" as const,
    blurDataURL: m.blurDataURL,
  };
}
