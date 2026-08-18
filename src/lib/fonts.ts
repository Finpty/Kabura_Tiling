import localFont from "next/font/local";

/**
 * Fonts are self-hosted (no build-time or runtime call to Google) so builds are
 * deterministic offline and no third-party request is made from a visitor's browser.
 * Source files live in `src/assets/fonts` — see `assets-src/README.md`.
 */
export const interTight = localFont({
  src: [
    {
      path: "../assets/fonts/InterTight-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../assets/fonts/InterTight-VariableItalic.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-inter-tight",
  display: "swap",
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
  preload: true,
});

export const instrumentSerif = localFont({
  src: [
    {
      path: "../assets/fonts/InstrumentSerif-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/InstrumentSerif-Italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
  fallback: ["Iowan Old Style", "Georgia", "serif"],
  preload: false,
});
