/**
 * Kabura Tiling — asset pipeline.
 *
 *   npm run assets:optimise
 *
 * Reads originals from `assets-src/` and writes web-ready media into
 * `public/media/`, then emits `src/lib/media-manifest.json` with dimensions and
 * blur placeholders so `next/image` never causes layout shift.
 *
 * Every photograph goes through the same warm-charcoal grade so imagery from
 * different sources reads as one art direction.
 *
 * Source precedence per output: a Higgsfield generation in
 * `assets-src/higgsfield/` wins, then a client-supplied original in
 * `assets-src/raw/`, then a procedural material field. The site therefore never
 * renders a missing image, and dropping the Higgsfield files in and re-running
 * this script upgrades the whole site with no code change.
 */
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";
import { MATERIALS, materialSvg, sceneSvg } from "./materials.mjs";

const require = createRequire(import.meta.url);
const execFileAsync = promisify(execFile);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW = path.join(ROOT, "assets-src", "raw");
const HF = path.join(ROOT, "assets-src", "higgsfield");
const OUT = path.join(ROOT, "public", "media");

const log = (...a) => console.log("  ", ...a);

function ffmpegBin() {
  try {
    return require("ffmpeg-static");
  } catch {
    return null;
  }
}

/* ---------------- Grading: one look across every photograph ---------------- */
/**
 * One grade, applied once.
 *
 * sharp's `modulate` and `linear` set pipeline parameters rather than stacking,
 * so a second call replaces the first. Both corrections are therefore composed
 * analytically here: two successive linear ramps a1·x+b1 then a2·x+b2 collapse
 * to (a1·a2)·x + (a2·b1 + b2).
 *
 * `cast` neutralises the heavy brand overlays baked into two of the supplied
 * originals (a blue wash on the wall-tiling photo, a red wash on one render) so
 * every photograph lands in the same palette.
 */
const CASTS = {
  cool: { a: [1.1, 1.03, 0.9], b: [-4, -2, 4], saturation: 0.18 },
  warm: { a: [0.95, 1.02, 1.06], b: [4, 0, -2], saturation: 0.24 },
};

function grade(pipeline, { strength = 1, cast } = {}) {
  const s = strength;
  const pre = cast ? CASTS[cast] : { a: [1, 1, 1], b: [0, 0, 0], saturation: 1 };

  // shared look: warm highlights, deepened and slightly cooled shadows
  const a2 = [1 + 0.09 * s, 1 + 0.05 * s, 1 - 0.02 * s];
  const b2 = [-9 * s, -9 * s, -5 * s];

  const a = a2.map((v, i) => v * pre.a[i]);
  const b = a2.map((v, i) => v * pre.b[i] + b2[i]);

  return pipeline
    .modulate({
      saturation: pre.saturation * (1 - 0.2 * s),
      brightness: 1 - 0.02 * s,
    })
    .linear(a, b)
    .gamma(1 + 0.06 * s);
}

async function blurDataUrl(input) {
  const buf = await sharp(input).resize(20, 20, { fit: "inside" }).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

/* ------------------------------- Images ---------------------------------- */
const IMAGES = [
  { key: "heroBathroom", file: "hero-bathroom.jpg", width: 2560, ratio: 16 / 9,
    alt: "Luxury bathroom finished in large-format warm stone tiles, with a freestanding bath and frameless glass shower.",
    hf: "01-hero-bathroom.png",
    from: ["master-bathroom-modern-bathroom-interior-design-white-bathtub-with-marble-tile-dark-stone-wall-3drender.jpg"],
    crop: [0, 0, 1, 0.72] },

  { key: "heroBathroomAlt", file: "hero-bathroom-alt.jpg", width: 2400, ratio: 16 / 9, gradeStrength: 1.5,
    alt: "Softly lit bathroom finished in warm off-white large-format tiles.",
    hf: "11-hero-bathroom-light.png",
    from: ["3d-rendering-classic-modern-bathroom-with-luxury-tile-decor.jpg"],
    crop: [0, 0, 1, 0.56], cast: "warm" },

  { key: "bathroomReveal", file: "bathroom-reveal.jpg", width: 2000, ratio: 16 / 9,
    alt: "Dark stone bathroom with a backlit feature wall and a sculptural freestanding bath.",
    hf: "02-bathroom-reveal-dark.png", from: ["13.jpg"], crop: [0, 0, 1, 0.55] },

  { key: "stoneFeature", file: "stone-feature.jpg", width: 2000, ratio: 3 / 2,
    alt: "Book-matched natural stone feature wall lit from below by a concealed floor slot.",
    hf: "04-stone-feature.png", from: ["3d-rendering-luxury-modern-kitchen.jpg"], crop: [0, 0, 0.62, 0.7] },

  { key: "stoneSlab", file: "stone-slab.jpg", width: 2048, ratio: 16 / 9,
    alt: "Large-format natural stone slab surface with soft grey and bronze veining.",
    hf: "03-stone-slab.png",
    scene: { material: "calacatta-bianco", lightAngle: 125, lightStrength: 0.3, vignette: 0.34, mottle: 0.22 } },

  { key: "waterproofing", file: "waterproofing.jpg", width: 1920, ratio: 16 / 9,
    alt: "Waterproofing membrane applied to a shower recess, with a reinforced wall-to-floor junction.",
    hf: "05-waterproofing.png",
    scene: { material: "concrete-charcoal", lightAngle: 145, lightStrength: 0.2, vignette: 0.62, mottle: 0.3, edge: true } },

  { key: "largeFormat", file: "large-format.jpg", width: 1920, ratio: 3 / 2, gradeStrength: 1.6,
    alt: "A large-format porcelain slab being set onto combed adhesive.",
    hf: "06-large-format.png", from: ["worker-putting-tiles-wall-kitchen.jpg"],
    crop: [0.02, 0.02, 0.96, 0.56], cast: "cool" },

  { key: "screed", file: "screed.jpg", width: 1920, ratio: 16 / 9,
    alt: "A tile edge lowered onto a bed of combed adhesive.",
    hf: "07-screed.png",
    from: ["tiler-is-putting-spacer-ceramic-tiles.jpg"], crop: [0.42, 0.3, 0.56, 0.42],
    scene: { material: "concrete-ash", lightAngle: 160, lightStrength: 0.42, vignette: 0.5, mottle: 0.44, edge: true } },

  { key: "outdoor", file: "outdoor.jpg", width: 1920, ratio: 16 / 9,
    alt: "Alfresco terrace paved in large-format limestone-look porcelain beside a lap pool.",
    hf: "08-alfresco.png",
    scene: { material: "limestone-bone", tile: [430, 430], joint: 5, grout: "#9d907c", bond: "stack", lightAngle: 122, lightStrength: 0.55, vignette: 0.5, mottle: 0.36 } },

  { key: "commercial", file: "commercial.jpg", width: 1920, ratio: 16 / 9,
    alt: "Commercial lobby with a large-format stone-look porcelain floor laid in stack bond.",
    hf: "09-commercial.png",
    scene: { material: "pietra-grey", tile: [400, 800], joint: 4, grout: "#3d3a35", bond: "stack", lightAngle: 105, lightStrength: 0.3, vignette: 0.5, mottle: 0.3 } },

  { key: "cornerDetail", file: "corner-detail.jpg", width: 1600, ratio: 3 / 2,
    alt: "Macro detail of a mitred external tile corner with a razor-straight grout joint.",
    hf: "10-corner-detail.png",
    from: ["master-bathroom-modern-bathroom-interior-design-white-bathtub-with-marble-tile-dark-stone-wall-3drender.jpg"],
    crop: [0.66, 0.05, 0.34, 0.5],
    scene: { material: "travertine-sand", tile: [760, 1520], joint: 4, grout: "#9b8f7c", bond: "stack", lightAngle: 168, lightStrength: 0.5, vignette: 0.46, mottle: 0.32 } },

  { key: "floorTiling", file: "floor-tiling.jpg", width: 2200, ratio: 3 / 2,
    alt: "Floor tiles being set into combed adhesive with spacers at the joints.",
    from: ["tiler-is-putting-spacer-ceramic-tiles.jpg"], crop: [0, 0, 1, 0.72] },

  { key: "residential", file: "residential.jpg", width: 2200, ratio: 16 / 9, gradeStrength: 1.4,
    alt: "Living space finished in large-format tiles, running out through full-height glass to the terrace.",
    hf: "08-alfresco.png", hfCrop: [0.0, 0.06, 0.44, 0.92],
    from: ["modern-contemporary-white-kitchen.jpg"], crop: [0, 0, 1, 0.58] },

  { key: "wall", file: "wall.jpg", width: 1600, ratio: 3 / 4, gradeStrength: 1.6,
    alt: "Adhesive combed onto a wall in even ridges before tiling.",
    from: ["worker-putting-tiles-wall-kitchen.jpg"], crop: [0, 0, 1, 0.44], cast: "cool" },

  { key: "bathroom", file: "bathroom.jpg", width: 1800, ratio: 3 / 2,
    alt: "Bathroom finished in large-format stone-look tiles with a stone feature wall.",
    hf: "01-hero-bathroom.png", hfCrop: [0.30, 0.05, 0.55, 0.88],
    from: ["master-bathroom-modern-bathroom-interior-design-white-bathtub-with-marble-tile-dark-stone-wall-3drender.jpg"],
    crop: [0.18, 0, 0.64, 0.7] },

  { key: "stone", file: "stone.jpg", width: 1800, ratio: 3 / 2,
    alt: "Natural stone surface with pronounced veining.",
    hf: "04-stone-feature.png", hfCrop: [0.10, 0.04, 0.33, 0.62],
    scene: { material: "nero-marquina", lightAngle: 130, lightStrength: 0.3, vignette: 0.5, mottle: 0.34 } },

  { key: "demolition", file: "demolition.jpg", width: 1600, ratio: 3 / 2,
    alt: "Combed adhesive over a bare substrate, with the first tile being set.",
    from: ["tiler-is-putting-spacer-ceramic-tiles.jpg"], crop: [0.04, 0.42, 0.5, 0.4],
    scene: { material: "concrete-pearl", lightAngle: 150, lightStrength: 0.36, vignette: 0.5, mottle: 0.52 } },

  { key: "repairs", file: "repairs.jpg", width: 1600, ratio: 3 / 2,
    alt: "Close detail of the grout joint and trim where two large-format tiles meet.",
    hf: "10-corner-detail.png", hfCrop: [0.02, 0.46, 0.56, 0.52],
    scene: { material: "carrara-perla", tile: [520, 1040], joint: 7, grout: "#8c8479", bond: "brick", lightAngle: 158, lightStrength: 0.44, vignette: 0.4, mottle: 0.26 } },
];

async function resolveSource(spec) {
  if (spec.hf) {
    const p = path.join(HF, spec.hf);
    // `hfCrop` lets one generation serve several slots at different framings —
    // without it, e.g. the stone feature wall appears twice, identically.
    if (existsSync(p)) return { input: p, kind: "higgsfield", crop: spec.hfCrop ?? null };
  }
  for (const name of spec.from ?? []) {
    const p = path.join(RAW, name);
    if (existsSync(p)) return { input: p, kind: "supplied", crop: spec.crop ?? null };
  }
  if (spec.scene) {
    const height = spec.ratio ? Math.round(spec.width / spec.ratio) : spec.width;
    return {
      input: Buffer.from(sceneSvg({ width: spec.width, height, ...spec.scene })),
      kind: "procedural",
      crop: null,
    };
  }
  return null;
}

async function buildImages() {
  const dir = path.join(OUT, "scenes");
  await fs.mkdir(dir, { recursive: true });
  const manifest = {};

  for (const spec of IMAGES) {
    const resolved = await resolveSource(spec);
    if (!resolved) {
      console.warn(`   ! no source for image "${spec.key}" — skipped`);
      continue;
    }

    let pipe = sharp(resolved.input, { limitInputPixels: false }).rotate();
    const meta = await pipe.metadata();

    if (resolved.crop) {
      const [l, t, w, h] = resolved.crop;
      pipe = pipe.extract({
        left: Math.round(meta.width * l),
        top: Math.round(meta.height * t),
        width: Math.max(1, Math.round(meta.width * w)),
        height: Math.max(1, Math.round(meta.height * h)),
      });
    }

    const height = spec.ratio ? Math.round(spec.width / spec.ratio) : null;
    pipe = pipe.resize(spec.width, height ?? undefined,
      height ? { fit: "cover", position: "attention" } : { fit: "inside" });

    if (resolved.kind !== "procedural") {
      pipe = grade(pipe, {
        strength: spec.gradeStrength ?? 1,
        cast: resolved.kind === "supplied" ? spec.cast : undefined,
      });
    }

    const outPath = path.join(dir, spec.file);
    const info = await pipe.jpeg({ quality: 82, mozjpeg: true }).toFile(outPath);

    manifest[spec.key] = {
      src: `/media/scenes/${spec.file}`,
      width: info.width,
      height: info.height,
      alt: spec.alt,
      blurDataURL: await blurDataUrl(outPath),
      source: resolved.kind,
    };
    log(`image  ${spec.key.padEnd(18)} ${info.width}×${info.height}  (${resolved.kind})`);
  }
  return manifest;
}

/* ----------------------------- Materials --------------------------------- */
async function buildMaterials() {
  const dir = path.join(OUT, "materials");
  await fs.mkdir(dir, { recursive: true });
  const manifest = {};
  for (const mat of MATERIALS) {
    const file = `${mat.id}.webp`;
    const info = await sharp(Buffer.from(materialSvg(mat, 640))).webp({ quality: 78 })
      .toFile(path.join(dir, file));
    manifest[mat.id] = {
      id: mat.id, name: mat.name, family: mat.family, hex: mat.hex,
      src: `/media/materials/${file}`, width: info.width, height: info.height,
    };
  }
  log(`materials  ${MATERIALS.length} swatches`);
  return manifest;
}

/* ------------------------------- Grain ----------------------------------- */
async function buildGrain() {
  const dir = path.join(OUT, "texture");
  await fs.mkdir(dir, { recursive: true });
  const size = 180;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="4" seed="19"/>
    <feColorMatrix type="saturate" values="0"/></filter>
    <rect width="${size}" height="${size}" filter="url(#n)"/></svg>`;
  await sharp(Buffer.from(svg)).ensureAlpha().png({ compressionLevel: 9, palette: true })
    .toFile(path.join(dir, "grain.png"));
  log("grain      180×180");
}

/* ------------------------------- Videos ---------------------------------- */
const VIDEOS = [
  { key: "heroBathroom", file: "hero-bathroom", maxWidth: 1920, crf: 27,
    alt: "Slow architectural camera move through a luxury bathroom finished in large-format stone tiles.",
    hf: "kabura-hero-bathroom.mp4" },
  { key: "waterproofing", file: "waterproofing", maxWidth: 1440, crf: 28,
    alt: "Close-up of waterproofing membrane applied to a shower recess.",
    hf: "kabura-waterproofing.mp4" },
  { key: "largeFormat", file: "large-format", maxWidth: 1440, crf: 28,
    alt: "A large-format porcelain slab being lowered onto combed adhesive.",
    hf: "kabura-large-format.mp4" },
  { key: "bathroomReveal", file: "bathroom-reveal", maxWidth: 1440, crf: 28,
    alt: "Cinematic reveal of a dark stone bathroom with a backlit feature wall.",
    hf: "kabura-bathroom-reveal.mp4" },
  { key: "stoneSlabs", file: "stone-slabs", maxWidth: 720, crf: 28,
    alt: "Natural stone slabs on transport frames at a stone yard.",
    raw: "286743063_189118220474736_748697276975831729_n.mp4",
    // trim the intro, drop the burnt-in caption band and the editing-app outro
    trim: { start: 0.4, duration: 8.6 },
    cropFilter: "crop=iw:trunc(ih*0.735/2)*2:0:0" },
];

async function buildVideos() {
  const ff = ffmpegBin();
  const dir = path.join(OUT, "video");
  await fs.mkdir(dir, { recursive: true });
  const manifest = {};

  for (const spec of VIDEOS) {
    let input = null;
    let kind = null;
    if (spec.hf && existsSync(path.join(HF, spec.hf))) {
      input = path.join(HF, spec.hf);
      kind = "higgsfield";
    } else if (spec.raw && existsSync(path.join(RAW, spec.raw))) {
      input = path.join(RAW, spec.raw);
      kind = "supplied";
    }
    if (!input) { log(`video  ${spec.key.padEnd(18)} — no source, skipped`); continue; }
    if (!ff) { console.warn("   ! ffmpeg-static not installed — cannot transcode video"); continue; }

    const mp4 = path.join(dir, `${spec.file}.mp4`);
    const webm = path.join(dir, `${spec.file}.webm`);
    const poster = path.join(dir, `${spec.file}-poster.jpg`);

    const vf = [
      spec.cropFilter,
      `scale='min(${spec.maxWidth},iw)':-2:flags=lanczos`,
      "eq=saturation=0.78:contrast=1.05:brightness=-0.012",
      "colorbalance=rs=0.02:gs=0.005:bs=-0.025:rm=0.015:bm=-0.02",
    ].filter(Boolean).join(",");

    const trimArgs = spec.trim ? ["-ss", String(spec.trim.start), "-t", String(spec.trim.duration)] : [];

    await execFileAsync(ff, ["-hide_banner", "-loglevel", "error", "-y",
      ...trimArgs, "-i", input, "-an", "-vf", vf,
      "-c:v", "libx264", "-profile:v", "high", "-preset", "slow",
      "-crf", String(spec.crf), "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", "-g", "60", mp4]);

    await execFileAsync(ff, ["-hide_banner", "-loglevel", "error", "-y",
      ...trimArgs, "-i", input, "-an", "-vf", vf,
      "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(spec.crf + 4),
      "-row-mt", "1", "-deadline", "good", "-cpu-used", "3", webm]);

    await execFileAsync(ff, ["-hide_banner", "-loglevel", "error", "-y",
      "-i", mp4, "-frames:v", "1", "-q:v", "3", poster]);

    const { width, height } = await sharp(poster).metadata();
    const [mp4Stat, webmStat] = await Promise.all([fs.stat(mp4), fs.stat(webm)]);

    // VP9 does not always beat x264 at these sizes. Only ship the webm when it
    // is meaningfully smaller — otherwise it is dead weight in the repo and a
    // worse first byte for the browsers that prefer it.
    const keepWebm = webmStat.size < mp4Stat.size * 0.9;
    if (!keepWebm) await fs.rm(webm, { force: true });

    manifest[spec.key] = {
      mp4: `/media/video/${spec.file}.mp4`,
      ...(keepWebm ? { webm: `/media/video/${spec.file}.webm` } : {}),
      poster: `/media/video/${spec.file}-poster.jpg`,
      width, height, alt: spec.alt,
      blurDataURL: await blurDataUrl(poster),
      source: kind,
    };
    log(
      `video  ${spec.key.padEnd(18)} ${width}×${height}  mp4 ${(mp4Stat.size / 1048576).toFixed(2)}MB` +
        (keepWebm ? ` / webm ${(webmStat.size / 1048576).toFixed(2)}MB` : " (webm dropped, larger than mp4)") +
        `  (${kind})`,
    );
  }
  return manifest;
}

/* -------------------------------- main ----------------------------------- */
async function main() {
  console.log("\nKabura asset pipeline\n");
  await fs.mkdir(OUT, { recursive: true });

  const images = await buildImages();
  const materials = await buildMaterials();
  const videos = await buildVideos();
  await buildGrain();

  const manifest = {
    generatedAt: new Date().toISOString(),
    note: "Generated by scripts/optimise-assets.mjs — do not edit by hand.",
    images, materials, videos,
  };

  await fs.writeFile(path.join(ROOT, "src", "lib", "media-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`);
  console.log("\n   wrote src/lib/media-manifest.json\n");
}

main().catch((error) => { console.error(error); process.exit(1); });
