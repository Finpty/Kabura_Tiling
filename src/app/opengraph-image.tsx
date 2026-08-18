import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { site } from "@/lib/site";

export const alt = `${site.legalName} — ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Site-wide social card, rendered at build time from the self-hosted fonts so
 * no network request is made and the result is deterministic.
 */
export default async function OpengraphImage() {
  const fontDir = path.join(process.cwd(), "src", "assets", "fonts");
  const [regular, semibold, serif] = await Promise.all([
    readFile(path.join(fontDir, "InterTight-Regular.ttf")),
    readFile(path.join(fontDir, "InterTight-SemiBold.ttf")),
    readFile(path.join(fontDir, "InstrumentSerif-Regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0b0a09 0%, #14120f 46%, #241d15 100%)",
          padding: "72px 80px",
          fontFamily: "Inter Tight",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 999,
              border: "2px solid #cf9d5f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#cf9d5f",
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            K
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                color: "#f1ece2",
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: 6,
              }}
            >
              KABURA
            </span>
            <span style={{ color: "#8b8177", fontSize: 13, letterSpacing: 5 }}>
              TILING GROUP
            </span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              color: "#f1ece2",
              fontSize: 92,
              fontWeight: 600,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            CRAFTED IN TILE.
          </span>
          <span
            style={{
              color: "#f1ece2",
              fontSize: 92,
              fontWeight: 600,
              letterSpacing: -4,
              lineHeight: 1,
            }}
          >
            BUILT TO LAST.
          </span>
          <span
            style={{
              marginTop: 26,
              color: "#cf9d5f",
              fontSize: 34,
              fontFamily: "Instrument Serif",
            }}
          >
            {site.tagline}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: "1px solid rgba(139,129,119,0.35)",
            paddingTop: 24,
          }}
        >
          <span style={{ color: "#c9bca8", fontSize: 22, maxWidth: 720 }}>
            Premium tiling, waterproofing, stone and bathroom finishes.
          </span>
          <span style={{ color: "#8b8177", fontSize: 18, letterSpacing: 3 }}>
            {site.state.toUpperCase()}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter Tight", data: regular, weight: 400, style: "normal" },
        { name: "Inter Tight", data: semibold, weight: 600, style: "normal" },
        { name: "Instrument Serif", data: serif, weight: 400, style: "normal" },
      ],
    },
  );
}
