"use client";

import { useMemo, useState } from "react";
import { Section, SectionLabel } from "@/components/ui/Section";
import { PlaceholderNotice } from "@/components/ui/PlaceholderNotice";
import { MATERIAL_LIST } from "@/lib/media";
import { cn } from "@/lib/utils";

/**
 * Interactive tile layout demonstrator.
 *
 * Every tile is a positioned `div` with a shared background image, so changing
 * format or bond re-renders pure CSS — no canvas, no images refetched, and it
 * stays crisp at any zoom. Sizes are real Australian tile formats in millimetres.
 */

const FORMATS = [
  { id: "300x600", label: "300 × 600", w: 300, h: 600 },
  { id: "600x600", label: "600 × 600", w: 600, h: 600 },
  { id: "600x1200", label: "600 × 1200", w: 600, h: 1200 },
  { id: "750x1500", label: "750 × 1500", w: 750, h: 1500 },
  { id: "1200x2400", label: "Large format", w: 1200, h: 2400 },
] as const;

const PATTERNS = [
  { id: "stack", label: "Stack bond" },
  { id: "brick", label: "Brick bond" },
  { id: "vertical", label: "Vertical" },
  { id: "herringbone", label: "Herringbone" },
  { id: "french", label: "French pattern" },
] as const;

type PatternId = (typeof PATTERNS)[number]["id"];

const GROUTS = [
  { id: "ivory", label: "Ivory", hex: "#e2dbcd" },
  { id: "warm-grey", label: "Warm grey", hex: "#9c9287" },
  { id: "mid-grey", label: "Mid grey", hex: "#6b665f" },
  { id: "charcoal", label: "Charcoal", hex: "#2b2724" },
] as const;

type Tile = { x: number; y: number; w: number; h: number };

/** The demonstration wall, in millimetres. */
const AREA = { w: 3600, h: 2400 };

/** Lay out one wall's worth of tiles, in millimetres, for the chosen pattern. */
function layout(pattern: PatternId, w: number, h: number, area: { w: number; h: number }): Tile[] {
  const tiles: Tile[] = [];

  if (pattern === "herringbone") {
    // 90° herringbone built from a repeating L-shaped unit.
    const long = Math.max(w, h);
    const short = Math.min(w, h);
    const step = long + short;
    for (let row = -1; row * short < area.h + step; row += 1) {
      for (let col = -1; col * step < area.w + step; col += 1) {
        const ox = col * step + row * short;
        const oy = row * short;
        tiles.push({ x: ox, y: oy, w: long, h: short });
        tiles.push({ x: ox + long, y: oy - long + short, w: short, h: long });
      }
    }
    return tiles;
  }

  if (pattern === "french") {
    // French/versailles pattern: a repeating module of four related sizes.
    const u = Math.max(w, h) / 2;
    const block = u * 3;
    for (let row = 0; row * block < area.h + block; row += 1) {
      for (let col = 0; col * block < area.w + block; col += 1) {
        const ox = col * block;
        const oy = row * block;
        tiles.push({ x: ox, y: oy, w: u * 2, h: u * 2 });
        tiles.push({ x: ox + u * 2, y: oy, w: u, h: u });
        tiles.push({ x: ox + u * 2, y: oy + u, w: u, h: u * 2 });
        tiles.push({ x: ox, y: oy + u * 2, w: u, h: u });
        tiles.push({ x: ox + u, y: oy + u * 2, w: u, h: u });
      }
    }
    return tiles;
  }

  const tw = pattern === "vertical" ? Math.min(w, h) : w;
  const th = pattern === "vertical" ? Math.max(w, h) : h;

  for (let row = 0; row * th < area.h + th; row += 1) {
    const offset = pattern === "brick" ? (row % 2) * (tw / 2) : 0;
    for (let col = -1; col * tw - offset < area.w + tw; col += 1) {
      tiles.push({ x: col * tw - offset, y: row * th, w: tw, h: th });
    }
  }
  return tiles;
}

export function TileWall() {
  const [formatId, setFormatId] = useState<string>("600x1200");
  const [patternId, setPatternId] = useState<PatternId>("stack");
  const [groutId, setGroutId] = useState<string>("warm-grey");
  const [materialId, setMaterialId] = useState(
    MATERIAL_LIST[0]?.id ?? "calacatta-bianco",
  );

  const format = FORMATS.find((f) => f.id === formatId) ?? FORMATS[2];
  const grout = GROUTS.find((g) => g.id === groutId) ?? GROUTS[1];
  const material =
    MATERIAL_LIST.find((m) => m.id === materialId) ?? MATERIAL_LIST[0];

  /* Tiles are positioned as a percentage of AREA. */
  const tiles = useMemo(
    () => layout(patternId, format.w, format.h, AREA),
    [patternId, format.w, format.h],
  );

  const jointPct = 0.28;

  return (
    <Section
      id="tile-wall"
      spacing="loose"
      className="border-t border-stone/12 bg-ink"
      aria-labelledby="tile-wall-heading"
    >
      <div className="shell">
        <div className="max-w-2xl">
          <SectionLabel index="09" eyebrow="Layout studio" />
          <h2
            id="tile-wall-heading"
            className="mt-6 font-display text-headline text-bone"
          >
            See the set-out before we set out.
          </h2>
          <p className="mt-5 text-lead text-sand/70">
            Format and pattern change a room more than colour does. Try a few
            combinations, then tell us which one you had in mind.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
          {/* The wall */}
          <div
            className="relative aspect-[3/2] w-full overflow-hidden rounded-sm"
            style={{ backgroundColor: grout.hex }}
            role="img"
            aria-label={`${material?.name ?? "Tile"} in ${format.label} millimetre format, ${
              PATTERNS.find((p) => p.id === patternId)?.label
            }, with ${grout.label.toLowerCase()} grout.`}
          >
            <div className="absolute inset-0 overflow-hidden">
              {tiles.map((tile, index) => (
                <span
                  key={index}
                  className="absolute block"
                  style={{
                    left: `${(tile.x / AREA.w) * 100}%`,
                    top: `${(tile.y / AREA.h) * 100}%`,
                    width: `calc(${(tile.w / AREA.w) * 100}% - ${jointPct}%)`,
                    height: `calc(${(tile.h / AREA.h) * 100}% - ${jointPct * 1.5}%)`,
                    backgroundImage: `url(${material?.src})`,
                    backgroundSize: "cover",
                    backgroundPosition: `${(index * 37) % 100}% ${(index * 61) % 100}%`,
                  }}
                />
              ))}
            </div>

            {/* Raking light so the wall reads as a lit surface */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 90% at 18% 0%, rgba(255,244,224,0.22), rgba(255,244,224,0) 58%), linear-gradient(to bottom, rgba(0,0,0,0) 45%, rgba(5,4,3,0.42) 100%)",
              }}
            />

            <span className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-bone/20 bg-ink/60 px-3 py-1.5 text-[0.62rem] font-medium tracking-[0.16em] text-bone/85 uppercase backdrop-blur-sm">
              {format.label} mm · {PATTERNS.find((p) => p.id === patternId)?.label}
            </span>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-8">
            <Group label="Tile size">
              {FORMATS.map((item) => (
                <Chip
                  key={item.id}
                  active={item.id === formatId}
                  onClick={() => setFormatId(item.id)}
                >
                  {item.label}
                </Chip>
              ))}
            </Group>

            <Group label="Pattern">
              {PATTERNS.map((item) => (
                <Chip
                  key={item.id}
                  active={item.id === patternId}
                  onClick={() => setPatternId(item.id)}
                >
                  {item.label}
                </Chip>
              ))}
            </Group>

            <Group label="Surface">
              {MATERIAL_LIST.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMaterialId(item.id)}
                  aria-pressed={item.id === materialId}
                  title={item.name}
                  className={cn(
                    "h-9 w-9 rounded-full border-2 transition-transform duration-300 hover:scale-110",
                    item.id === materialId
                      ? "border-bronze-light scale-110"
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
            </Group>

            <Group label="Grout tone">
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
            </Group>
          </div>
        </div>

        <PlaceholderNotice className="mt-10 max-w-3xl">
          Surfaces shown are representative material swatches for demonstrating
          layout and scale — they are not specific tile ranges and colours will
          differ from any product you select.
        </PlaceholderNotice>
      </div>
    </Section>
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="eyebrow mb-3 text-stone-light">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-4 py-2 text-[0.72rem] font-medium tracking-[0.12em] uppercase transition-colors duration-300",
        active
          ? "border-bronze-light bg-bronze-light/12 text-bronze-light"
          : "border-stone/30 text-sand/65 hover:border-stone/60 hover:text-bone",
      )}
    >
      {children}
    </button>
  );
}
