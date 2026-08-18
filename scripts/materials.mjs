/**
 * Procedural material swatch generator.
 *
 * These are *representative* stone / porcelain / timber-look surfaces used by the
 * tile-wall and bathroom visualiser so the tools work out of the box. They are NOT
 * photographs of real products and must not be presented as specific tile ranges.
 * Replace `public/media/materials/*.webp` with supplier photography when available.
 */

const rand = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

function veins({ count, colour, minWidth, maxWidth, angle, opacity, size, seed }) {
  const r = rand(seed);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const x = (i / count) * size * 1.6 - size * 0.3 + r() * size * 0.12;
    const dx = Math.tan((angle * Math.PI) / 180) * size * 1.4;
    const w = minWidth + r() * (maxWidth - minWidth);
    const o = opacity * (0.45 + r() * 0.55);
    out.push(
      `<path d="M ${x.toFixed(1)} ${-size * 0.2} C ${(x + dx * 0.25 + r() * 60 - 30).toFixed(1)} ${(size * 0.25).toFixed(1)}, ${(x + dx * 0.6 + r() * 60 - 30).toFixed(1)} ${(size * 0.6).toFixed(1)}, ${(x + dx).toFixed(1)} ${(size * 1.2).toFixed(1)}" stroke="${colour}" stroke-opacity="${o.toFixed(3)}" stroke-width="${w.toFixed(2)}" stroke-linecap="round" fill="none"/>`,
    );
  }
  return out.join('');
}

function chips({ count, palette, size, seed, min, max }) {
  const r = rand(seed);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const cx = r() * size;
    const cy = r() * size;
    const rx = min + r() * (max - min);
    const ry = rx * (0.55 + r() * 0.6);
    const fill = palette[Math.floor(r() * palette.length)];
    out.push(
      `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="${fill}" fill-opacity="${(0.5 + r() * 0.45).toFixed(2)}" transform="rotate(${(r() * 180).toFixed(0)} ${cx.toFixed(1)} ${cy.toFixed(1)})"/>`,
    );
  }
  return out.join('');
}

function planks({ size, seed, base, grain }) {
  const r = rand(seed);
  const out = [];
  const rows = 4;
  const h = size / rows;
  for (let i = 0; i < rows; i += 1) {
    const y = i * h;
    out.push(`<rect x="0" y="${y}" width="${size}" height="${h - 1}" fill="${base}" fill-opacity="${(0.25 + r() * 0.3).toFixed(2)}"/>`);
    for (let g = 0; g < 22; g += 1) {
      const gy = y + r() * h;
      out.push(
        `<path d="M 0 ${gy.toFixed(1)} C ${(size * 0.3).toFixed(0)} ${(gy + r() * 6 - 3).toFixed(1)}, ${(size * 0.7).toFixed(0)} ${(gy + r() * 6 - 3).toFixed(1)}, ${size} ${(gy + r() * 4 - 2).toFixed(1)}" stroke="${grain}" stroke-opacity="${(0.06 + r() * 0.16).toFixed(3)}" stroke-width="${(0.6 + r() * 1.8).toFixed(2)}" fill="none"/>`,
      );
    }
  }
  return out.join('');
}

/** Build the SVG string for one material. */
export function materialSvg(mat, size = 640) {
  const s = size;
  let body = '';
  const dispScale = mat.displace ?? 70;
  const freq = mat.frequency ?? '0.011 0.03';
  const octaves = mat.octaves ?? 6;

  if (mat.kind === 'marble') {
    body = `
      <g filter="url(#disp)">
        ${veins({ count: mat.veinCount ?? 9, colour: mat.vein, minWidth: mat.veinMin ?? 1, maxWidth: mat.veinMax ?? 7, angle: mat.angle ?? 16, opacity: mat.veinOpacity ?? 0.55, size: s, seed: mat.seed })}
        ${veins({ count: (mat.veinCount ?? 9) * 3, colour: mat.vein, minWidth: 0.4, maxWidth: 1.4, angle: (mat.angle ?? 16) + 6, opacity: (mat.veinOpacity ?? 0.55) * 0.45, size: s, seed: mat.seed + 91 })}
      </g>`;
  } else if (mat.kind === 'travertine') {
    body = `
      <g filter="url(#disp)">
        ${veins({ count: 26, colour: mat.vein, minWidth: 1, maxWidth: 5, angle: 86, opacity: 0.34, size: s, seed: mat.seed })}
      </g>
      <g filter="url(#soft)">${chips({ count: 90, palette: [mat.vein], size: s, seed: mat.seed + 7, min: 1, max: 4 })}</g>`;
  } else if (mat.kind === 'terrazzo') {
    body = `<g>${chips({ count: 220, palette: mat.chips, size: s, seed: mat.seed, min: 3, max: 11 })}</g>`;
  } else if (mat.kind === 'timber') {
    body = `<g filter="url(#dispSoft)">${planks({ size: s, seed: mat.seed, base: mat.vein, grain: mat.grain })}</g>`;
  } else {
    // concrete / cement-look: pure grain, no veining
    body = '';
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <filter id="disp" x="-25%" y="-25%" width="150%" height="150%">
      <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${octaves}" seed="${mat.seed}" result="t"/>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="${dispScale}" xChannelSelector="R" yChannelSelector="G"/>
      <feGaussianBlur stdDeviation="${mat.blur ?? 0.7}"/>
    </filter>
    <filter id="dispSoft" x="-15%" y="-15%" width="130%" height="130%">
      <feTurbulence type="fractalNoise" baseFrequency="0.004 0.05" numOctaves="4" seed="${mat.seed + 3}" result="t2"/>
      <feDisplacementMap in="SourceGraphic" in2="t2" scale="16" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="soft"><feGaussianBlur stdDeviation="2.4"/></filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="${mat.grainFreq ?? 0.85}" numOctaves="3" seed="${mat.seed + 41}"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="${mat.sheen ?? 0.05}"/>
      <stop offset="55%" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="${(mat.sheen ?? 0.05) * 1.1}"/>
    </linearGradient>
  </defs>
  <rect width="${s}" height="${s}" fill="${mat.base}"/>
  ${body}
  <rect width="${s}" height="${s}" filter="url(#grain)" opacity="${mat.grainOpacity ?? 0.12}"/>
  <rect width="${s}" height="${s}" fill="url(#sheen)"/>
</svg>`;
}

/**
 * The swatch library. `hex` is the average tone, used for CSS fallbacks and for
 * the lightweight (no-image) rendering path on low-power devices.
 */
export const MATERIALS = [
  { id: 'calacatta-bianco', name: 'Calacatta-look porcelain', family: 'Marble-look', kind: 'marble', base: '#e9e3d7', vein: '#6b665c', hex: '#e2dbcd', seed: 11, veinCount: 7, veinMax: 12, veinOpacity: 0.72, angle: 14, sheen: 0.11 },
  { id: 'carrara-perla', name: 'Carrara-look porcelain', family: 'Marble-look', kind: 'marble', base: '#eeeeea', vein: '#9a9a96', hex: '#e7e7e3', seed: 23, veinCount: 12, veinMax: 4, veinOpacity: 0.4, angle: 22, sheen: 0.08 },
  { id: 'nero-marquina', name: 'Marquina-look porcelain', family: 'Marble-look', kind: 'marble', base: '#1b1a19', vein: '#e8e4dc', hex: '#232120', seed: 31, veinCount: 7, veinMax: 6, veinOpacity: 0.6, angle: 30, sheen: 0.12 },
  { id: 'pietra-grey', name: 'Pietra-look porcelain', family: 'Marble-look', kind: 'marble', base: '#59554f', vein: '#cfc9be', hex: '#5c5852', seed: 47, veinCount: 9, veinMax: 5, veinOpacity: 0.45, angle: 18, sheen: 0.07 },
  { id: 'travertine-sand', name: 'Travertine-look', family: 'Natural stone-look', kind: 'travertine', base: '#dccfba', vein: '#b6a68d', hex: '#d8cbb6', seed: 59, sheen: 0.04, grainOpacity: 0.16 },
  { id: 'limestone-bone', name: 'Limestone-look', family: 'Natural stone-look', kind: 'travertine', base: '#e7e1d5', vein: '#c2b8a6', hex: '#e3ddd1', seed: 67, sheen: 0.03, grainOpacity: 0.15 },
  { id: 'concrete-pearl', name: 'Concrete-look, pearl', family: 'Concrete-look', kind: 'concrete', base: '#d5d2cc', hex: '#d3d0ca', seed: 71, grainFreq: 0.55, grainOpacity: 0.2, sheen: 0.03 },
  { id: 'concrete-ash', name: 'Concrete-look, ash', family: 'Concrete-look', kind: 'concrete', base: '#8e8b85', hex: '#8c8983', seed: 79, grainFreq: 0.55, grainOpacity: 0.22, sheen: 0.03 },
  { id: 'concrete-charcoal', name: 'Concrete-look, charcoal', family: 'Concrete-look', kind: 'concrete', base: '#3a3835', hex: '#393734', seed: 83, grainFreq: 0.6, grainOpacity: 0.26, sheen: 0.04 },
  { id: 'basalt-black', name: 'Basalt-look', family: 'Natural stone-look', kind: 'concrete', base: '#1f1e1c', hex: '#1f1e1c', seed: 89, grainFreq: 0.7, grainOpacity: 0.3, sheen: 0.05 },
  { id: 'terrazzo-bone', name: 'Terrazzo-look, bone', family: 'Terrazzo-look', kind: 'terrazzo', base: '#eae5db', hex: '#e6e1d7', seed: 97, chips: ['#9c9386', '#c9bda9', '#6f6a61', '#d8cfc0'], grainOpacity: 0.1, sheen: 0.05 },
  { id: 'timber-oak', name: 'Timber-look, oak', family: 'Timber-look', kind: 'timber', base: '#c4a982', vein: '#a98a5f', grain: '#6f5535', hex: '#c0a37c', seed: 103, grainOpacity: 0.13, sheen: 0.04 },
];

/* ------------------------------------------------------------------ *
 * Scene fields
 *
 * Where no photograph exists for a slot, we render an architectural
 * *material study* rather than a flat swatch: a lit surface, optionally
 * divided into a tile grid with real grout joints. These are clearly
 * graphic surfaces — they are never presented as photographs of work.
 * ------------------------------------------------------------------ */

/**
 * @param {object} spec
 * @param {string} spec.material   material id from MATERIALS
 * @param {number} spec.width
 * @param {number} spec.height
 * @param {[number, number]} [spec.tile]   tile size in px within the canvas
 * @param {number} [spec.joint]            grout joint width in px
 * @param {string} [spec.grout]            grout colour
 * @param {'stack'|'brick'|'vertical'} [spec.bond]
 * @param {number} [spec.lightAngle]       degrees; direction of the raking light
 * @param {number} [spec.lightStrength]
 * @param {number} [spec.vignette]
 * @param {number} [spec.mottle]           large-scale tonal variation
 * @param {boolean} [spec.edge]            draw a bright straight-edge highlight
 */
export function sceneSvg(spec) {
  const mat = MATERIALS.find((m) => m.id === spec.material);
  if (!mat) throw new Error(`unknown material: ${spec.material}`);

  const { width: w, height: h } = spec;
  const light = spec.lightAngle ?? 118;
  const lightStrength = spec.lightStrength ?? 0.34;
  const vignette = spec.vignette ?? 0.42;
  const mottle = spec.mottle ?? 0.3;
  const joint = spec.joint ?? 0;
  const grout = spec.grout ?? "#6d6760";
  const seed = mat.seed;

  const rad = (light * Math.PI) / 180;
  const lx = 0.5 + Math.cos(rad) * 0.7;
  const ly = 0.5 + Math.sin(rad) * 0.7;

  /* Material body — the same veining language as the swatches, at scene scale. */
  const scale = Math.max(w, h) / 640;
  let body = "";
  if (mat.kind === "marble") {
    body = `<g filter="url(#disp)">
      ${veins({ count: Math.round((mat.veinCount ?? 9) * 0.8), colour: mat.vein, minWidth: 2 * scale, maxWidth: (mat.veinMax ?? 7) * 1.9 * scale, angle: mat.angle ?? 16, opacity: (mat.veinOpacity ?? 0.55) * 1.35, size: Math.max(w, h), seed })}
      ${veins({ count: (mat.veinCount ?? 9) * 3, colour: mat.vein, minWidth: 0.6 * scale, maxWidth: 2.6 * scale, angle: (mat.angle ?? 16) + 8, opacity: (mat.veinOpacity ?? 0.55) * 0.7, size: Math.max(w, h), seed: seed + 91 })}
    </g>`;
  } else if (mat.kind === "travertine") {
    body = `<g filter="url(#disp)">
      ${veins({ count: 34, colour: mat.vein, minWidth: 2 * scale, maxWidth: 9 * scale, angle: 86, opacity: 0.44, size: Math.max(w, h), seed })}
    </g>
    <g filter="url(#soft)">${chips({ count: 150, palette: [mat.vein], size: Math.max(w, h), seed: seed + 7, min: 2 * scale, max: 7 * scale })}</g>`;
  } else if (mat.kind === "terrazzo") {
    body = `<g>${chips({ count: 420, palette: mat.chips, size: Math.max(w, h), seed, min: 4 * scale, max: 13 * scale })}</g>`;
  }

  /* Tile grid: joints are drawn as grout-coloured gaps over the material. */
  let grid = "";
  if (spec.tile && joint > 0) {
    const [tw, th] = spec.tile;
    const lines = [];
    const rows = Math.ceil(h / th) + 1;
    for (let r = 0; r <= rows; r += 1) {
      const y = r * th;
      lines.push(
        `<rect x="0" y="${(y - joint / 2).toFixed(1)}" width="${w}" height="${joint}" fill="${grout}" fill-opacity="0.92"/>`,
        `<rect x="0" y="${(y - joint / 2 - joint * 0.7).toFixed(1)}" width="${w}" height="${(joint * 0.7).toFixed(1)}" fill="#000" fill-opacity="0.18"/>`,
      );
      const offset =
        spec.bond === "brick" && r % 2 === 1 ? tw / 2 : spec.bond === "vertical" ? 0 : 0;
      const cols = Math.ceil(w / tw) + 2;
      for (let c = 0; c <= cols; c += 1) {
        const x = c * tw - offset;
        lines.push(
          `<rect x="${(x - joint / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${joint}" height="${th}" fill="${grout}" fill-opacity="0.92"/>`,
        );
      }
    }
    /* Per-tile tonal variation so the surface does not read as one flat plane. */
    const r2 = rand(seed + 511);
    const tones = [];
    for (let r = 0; r <= rows; r += 1) {
      const offset = spec.bond === "brick" && r % 2 === 1 ? tw / 2 : 0;
      for (let c = -1; c <= Math.ceil(w / tw) + 1; c += 1) {
        const v = (r2() - 0.5) * 0.09;
        tones.push(
          `<rect x="${(c * tw - offset).toFixed(1)}" y="${(r * th).toFixed(1)}" width="${tw}" height="${th}" fill="${v > 0 ? "#ffffff" : "#000000"}" fill-opacity="${Math.abs(v).toFixed(3)}"/>`,
        );
      }
    }
    grid = tones.join("") + lines.join("");
  }

  const edge = spec.edge
    ? `<g>
        <rect x="0" y="${(h * 0.52).toFixed(0)}" width="${w}" height="${Math.max(2, h * 0.012).toFixed(0)}" fill="#f3efe6" fill-opacity="0.5" transform="rotate(-3 ${w / 2} ${h / 2})"/>
        <rect x="0" y="${(h * 0.52 + Math.max(2, h * 0.012)).toFixed(0)}" width="${w}" height="${Math.max(4, h * 0.02).toFixed(0)}" fill="#000" fill-opacity="0.28" transform="rotate(-3 ${w / 2} ${h / 2})"/>
      </g>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <filter id="disp" x="-25%" y="-25%" width="150%" height="150%">
      <feTurbulence type="fractalNoise" baseFrequency="${mat.frequency ?? "0.011 0.03"}" numOctaves="6" seed="${seed}" result="t"/>
      <feDisplacementMap in="SourceGraphic" in2="t" scale="${(mat.displace ?? 70) * 1.6}" xChannelSelector="R" yChannelSelector="G"/>
      <feGaussianBlur stdDeviation="${(mat.blur ?? 0.7) * 1.4}"/>
    </filter>
    <filter id="soft"><feGaussianBlur stdDeviation="${3 * scale}"/></filter>
    <filter id="mottle">
      <feTurbulence type="fractalNoise" baseFrequency="0.0018" numOctaves="4" seed="${seed + 13}"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 1"/></feComponentTransfer>
    </filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="${mat.grainFreq ?? 0.85}" numOctaves="3" seed="${seed + 41}"/>
      <feColorMatrix type="saturate" values="0"/>
    </filter>
    <radialGradient id="light" cx="${lx.toFixed(3)}" cy="${ly.toFixed(3)}" r="0.95">
      <stop offset="0%" stop-color="#fff4e0" stop-opacity="${lightStrength}"/>
      <stop offset="45%" stop-color="#fff2de" stop-opacity="${(lightStrength * 0.32).toFixed(3)}"/>
      <stop offset="100%" stop-color="#fff2de" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vig" cx="0.5" cy="0.46" r="0.78">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#050403" stop-opacity="${vignette}"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="${mat.base}"/>
  ${body}
  <rect width="${w}" height="${h}" filter="url(#mottle)" opacity="${mottle}" fill="#000"/>
  ${grid}
  ${edge}
  <rect width="${w}" height="${h}" fill="url(#light)"/>
  <rect width="${w}" height="${h}" fill="url(#vig)"/>
  <rect width="${w}" height="${h}" filter="url(#grain)" opacity="${((mat.grainOpacity ?? 0.12) * 0.85).toFixed(3)}"/>
</svg>`;
}
