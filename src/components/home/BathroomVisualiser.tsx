"use client";

import { useMemo, useState } from "react";
import { Section, SectionLabel } from "@/components/ui/Section";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { MagneticLink } from "@/components/ui/MagneticButton";
import { MATERIAL_LIST } from "@/lib/media";
import { centreBlock, centreRow, centreText } from "@/lib/align";
import { cn } from "@/lib/utils";

/**
 * Lightweight bathroom visualiser.
 *
 * Deliberately not a CAD tool: the room is a single inline SVG in one-point
 * perspective, and the finishes are CSS patterns painted into its faces. That
 * keeps it under a few kilobytes, resolution-independent, instant to interact
 * with, and fully described to assistive technology through the summary text —
 * none of which a canvas or a WebGL room would be.
 */

const GROUTS = [
  { id: "ivory", label: "Ivory", hex: "#e6e0d3" },
  { id: "warm-grey", label: "Warm grey", hex: "#9b9186" },
  { id: "mid-grey", label: "Mid grey", hex: "#6a655e" },
  { id: "charcoal", label: "Charcoal", hex: "#2b2724" },
] as const;

const ORIENTATIONS = [
  { id: "horizontal", label: "Horizontal", w: 260, h: 130 },
  { id: "vertical", label: "Vertical", w: 130, h: 260 },
  { id: "square", label: "Square", w: 170, h: 170 },
] as const;

type Surface = "floor" | "wall" | "feature";

/** Repeating tile pattern painted into an SVG face. */
function TilePattern({
  id,
  src,
  tileW,
  tileH,
  grout,
}: {
  id: string;
  src: string;
  tileW: number;
  tileH: number;
  grout: string;
}) {
  return (
    <pattern id={id} width={tileW} height={tileH} patternUnits="userSpaceOnUse">
      <rect width={tileW} height={tileH} fill={grout} />
      <image
        href={src}
        x="1.5"
        y="1.5"
        width={tileW - 3}
        height={tileH - 3}
        preserveAspectRatio="xMidYMid slice"
      />
    </pattern>
  );
}

export function BathroomVisualiser() {
  const [floor, setFloor] = useState(MATERIAL_LIST[6]?.id ?? "concrete-pearl");
  const [wall, setWall] = useState(MATERIAL_LIST[1]?.id ?? "carrara-perla");
  const [feature, setFeature] = useState(MATERIAL_LIST[3]?.id ?? "pietra-grey");
  const [groutId, setGroutId] = useState<string>("warm-grey");
  const [orientationId, setOrientationId] = useState<string>("horizontal");
  const [editing, setEditing] = useState<Surface>("feature");

  const grout = GROUTS.find((g) => g.id === groutId) ?? GROUTS[1];
  const orientation =
    ORIENTATIONS.find((o) => o.id === orientationId) ?? ORIENTATIONS[0];

  const get = (id: string) =>
    MATERIAL_LIST.find((m) => m.id === id) ?? MATERIAL_LIST[0];

  const floorMat = get(floor);
  const wallMat = get(wall);
  const featureMat = get(feature);

  const current =
    editing === "floor" ? floor : editing === "wall" ? wall : feature;
  const setCurrent =
    editing === "floor" ? setFloor : editing === "wall" ? setWall : setFeature;

  const summary = useMemo(
    () =>
      `Bathroom preview: ${floorMat.name} floor, ${wallMat.name} walls, ${featureMat.name} feature wall, ${grout.label.toLowerCase()} grout, ${orientation.label.toLowerCase()} tile orientation.`,
    [floorMat, wallMat, featureMat, grout, orientation],
  );

  return (
    <Section
      id="visualiser"
      spacing="loose"
      className="border-t border-stone/12 bg-charcoal"
      aria-labelledby="visualiser-heading"
    >
      <div className="shell">
        <div className={cn("max-w-2xl", centreText, centreBlock)}>
          <SectionLabel
            index="10"
            eyebrow="Bathroom visualiser"
            className={centreRow}
          />
          <h2
            id="visualiser-heading"
            className="mt-6 font-display text-headline text-bone"
          >
            Try it on the room.
          </h2>
          <p className="mt-5 text-lead text-sand/70">
            Pick a surface, then a finish. It is a quick way to work out what
            you like before anyone measures anything.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
          <figure className="m-0">
            <div className="overflow-hidden rounded-sm bg-ink">
              <svg
                viewBox="0 0 1200 800"
                className="block h-auto w-full"
                role="img"
                aria-label={summary}
              >
                <defs>
                  <TilePattern
                    id="pat-floor"
                    src={floorMat.src}
                    tileW={orientation.w}
                    tileH={orientation.h}
                    grout={grout.hex}
                  />
                  <TilePattern
                    id="pat-wall"
                    src={wallMat.src}
                    tileW={orientation.w}
                    tileH={orientation.h}
                    grout={grout.hex}
                  />
                  <TilePattern
                    id="pat-feature"
                    src={featureMat.src}
                    tileW={orientation.w}
                    tileH={orientation.h}
                    grout={grout.hex}
                  />

                  <linearGradient id="shade-left" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#050403" stopOpacity="0.62" />
                    <stop
                      offset="100%"
                      stopColor="#050403"
                      stopOpacity="0.18"
                    />
                  </linearGradient>
                  <linearGradient id="shade-right" x1="1" y1="0" x2="0" y2="0">
                    <stop offset="0%" stopColor="#050403" stopOpacity="0.7" />
                    <stop
                      offset="100%"
                      stopColor="#050403"
                      stopOpacity="0.24"
                    />
                  </linearGradient>
                  <linearGradient id="shade-floor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#050403" stopOpacity="0.42" />
                    <stop
                      offset="100%"
                      stopColor="#050403"
                      stopOpacity="0.08"
                    />
                  </linearGradient>
                  <linearGradient id="glow" x1="0.5" y1="0" x2="0.5" y2="1">
                    <stop offset="0%" stopColor="#fff2dc" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#fff2dc" stopOpacity="0" />
                  </linearGradient>
                  <radialGradient
                    id="room-vignette"
                    cx="0.5"
                    cy="0.42"
                    r="0.75"
                  >
                    <stop offset="55%" stopColor="#050403" stopOpacity="0" />
                    <stop offset="100%" stopColor="#050403" stopOpacity="0.6" />
                  </radialGradient>
                </defs>

                {/* Ceiling */}
                <polygon points="0,0 1200,0 890,150 310,150" fill="#1b1815" />
                {/* Left wall */}
                <polygon
                  points="0,0 310,150 310,620 0,800"
                  fill="url(#pat-wall)"
                />
                <polygon
                  points="0,0 310,150 310,620 0,800"
                  fill="url(#shade-left)"
                />
                {/* Right wall */}
                <polygon
                  points="1200,0 890,150 890,620 1200,800"
                  fill="url(#pat-wall)"
                />
                <polygon
                  points="1200,0 890,150 890,620 1200,800"
                  fill="url(#shade-right)"
                />
                {/* Back / feature wall */}
                <rect
                  x="310"
                  y="150"
                  width="580"
                  height="470"
                  fill="url(#pat-feature)"
                />
                {/* Floor */}
                <polygon
                  points="310,620 890,620 1200,800 0,800"
                  fill="url(#pat-floor)"
                />
                <polygon
                  points="310,620 890,620 1200,800 0,800"
                  fill="url(#shade-floor)"
                />

                {/* Concealed cove light above the feature wall */}
                <rect
                  x="330"
                  y="150"
                  width="540"
                  height="120"
                  fill="url(#glow)"
                />

                {/* Suggested joinery — flat silhouettes, never the subject */}
                <rect
                  x="430"
                  y="470"
                  width="340"
                  height="70"
                  rx="4"
                  fill="#0d0c0b"
                  opacity="0.82"
                />
                <rect
                  x="452"
                  y="486"
                  width="120"
                  height="10"
                  rx="5"
                  fill="#cf9d5f"
                  opacity="0.5"
                />
                <rect
                  x="560"
                  y="300"
                  width="80"
                  height="8"
                  rx="4"
                  fill="#cf9d5f"
                  opacity="0.55"
                />
                <ellipse
                  cx="1010"
                  cy="700"
                  rx="150"
                  ry="46"
                  fill="#0d0c0b"
                  opacity="0.55"
                />

                <rect width="1200" height="800" fill="url(#room-vignette)" />
              </svg>
            </div>
            <figcaption className="sr-only">{summary}</figcaption>
          </figure>

          <div className="flex flex-col gap-8">
            <fieldset className="border-0 p-0">
              <legend className="eyebrow mb-3 text-stone-light">Surface</legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["feature", "Feature wall"],
                    ["wall", "Wall tile"],
                    ["floor", "Floor tile"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setEditing(id)}
                    aria-pressed={editing === id}
                    className={cn(
                      "rounded-full border px-4 py-2 text-[0.72rem] font-medium tracking-[0.12em] uppercase transition-colors duration-300",
                      editing === id
                        ? "border-bronze-light bg-bronze-light/12 text-bronze-light"
                        : "border-stone/30 text-sand/65 hover:border-stone/60 hover:text-bone",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="border-0 p-0">
              <legend className="eyebrow mb-3 text-stone-light">
                Finish — {MATERIAL_LIST.find((m) => m.id === current)?.name}
              </legend>
              <div className="grid grid-cols-6 gap-2">
                {MATERIAL_LIST.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrent(item.id)}
                    aria-pressed={item.id === current}
                    title={item.name}
                    className={cn(
                      "aspect-square rounded-sm border-2 transition-transform duration-300 hover:scale-105",
                      item.id === current
                        ? "border-bronze-light scale-105"
                        : "border-transparent",
                    )}
                    style={{
                      backgroundImage: `url(${item.src})`,
                      backgroundSize: "cover",
                    }}
                  >
                    <span className="sr-only">{item.name}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="border-0 p-0">
              <legend className="eyebrow mb-3 text-stone-light">
                Grout tone
              </legend>
              <div className="flex flex-wrap gap-2">
                {GROUTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setGroutId(item.id)}
                    aria-pressed={item.id === groutId}
                    className={cn(
                      "h-9 w-9 rounded-full border-2 transition-transform duration-300 hover:scale-110",
                      item.id === groutId
                        ? "border-bronze-light scale-110"
                        : "border-stone/30",
                    )}
                    style={{ backgroundColor: item.hex }}
                  >
                    <span className="sr-only">{item.label} grout</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="border-0 p-0">
              <legend className="eyebrow mb-3 text-stone-light">
                Tile orientation
              </legend>
              <div className="flex flex-wrap gap-2">
                {ORIENTATIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOrientationId(item.id)}
                    aria-pressed={item.id === orientationId}
                    className={cn(
                      "rounded-full border px-4 py-2 text-[0.72rem] font-medium tracking-[0.12em] uppercase transition-colors duration-300",
                      item.id === orientationId
                        ? "border-bronze-light bg-bronze-light/12 text-bronze-light"
                        : "border-stone/30 text-sand/65 hover:border-stone/60 hover:text-bone",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <MagneticLink href="/quote" variant="bronze" size="md" withArrow>
              Quote this combination
            </MagneticLink>
          </div>
        </div>

        <PlaceholderNotice className="mt-10 max-w-3xl">
          A visual guide only. Finishes are representative swatches, not
          specific products, and on-screen colour will not match a physical
          sample.
        </PlaceholderNotice>
      </div>
    </Section>
  );
}
