import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Hide the wordmark and show only the house mark. */
  markOnly?: boolean;
  /**
   * `reversed` is the dark-site treatment: the mark keeps its brand red and
   * everything that is navy in the original becomes bone, because navy on a
   * near-black page is unreadable. `primary` is the original navy-and-red
   * lockup, for anything rendered on white.
   */
  variant?: "reversed" | "primary";
};

/**
 * The Kabura Tiling Group lockup: the house-K mark, the KABURA wordmark with
 * its diagonal two-tone split, and the full registered name beneath.
 *
 * ⚠️  RECONSTRUCTED FROM THE SUPPLIED ARTWORK, NOT THE ORIGINAL FILE. The logo
 * was provided as an image, so the mark below is drawn to match it and the
 * wordmark is set in the site's own display face rather than the original
 * typeface. It is faithful to the structure and the colours; it is not the
 * original vector. Send the real `.svg` or `.ai` export and this component
 * should be pointed at it instead.
 *
 * Drawn rather than loaded so it stays sharp at any size, costs no request,
 * and cannot pop in after the header has painted.
 */

/**
 * The house-K mark.
 *
 * A bold K whose lower-left counter opens into a gabled house — the red is the
 * letter, the light shape is the building, and the small dark square is its
 * window. On the reversed treatment the house takes the page's own ink so it
 * reads as negative space, exactly as the white does on the original.
 */
function Mark({
  className,
  variant,
}: {
  className?: string;
  variant: "reversed" | "primary";
}) {
  const house = variant === "reversed" ? "var(--color-bone)" : "#ffffff";
  const window_ =
    variant === "reversed" ? "var(--color-ink)" : "var(--color-brand-navy)";

  return (
    <svg
      viewBox="0 0 118 140"
      className={cn("h-9 w-auto shrink-0", className)}
      role="img"
      aria-label="Kabura Tiling Group"
      focusable="false"
    >
      {/* The K */}
      <path
        d="M0 0 H32 V56 L84 0 H118 L60 62 L118 140 H84 L32 84 V140 H0 Z"
        fill="var(--color-brand-red)"
      />
      {/* The house, sitting in the K's lower-left counter */}
      <path d="M46 58 L84 96 V140 H8 V96 Z" fill={house} />
      {/* Window */}
      <path d="M34 104 H58 V126 H34 Z" fill={window_} />
      <path d="M46 104 V126 M34 115 H58" stroke={house} strokeWidth="3.5" />
    </svg>
  );
}

export function Logo({
  className,
  markOnly = false,
  variant = "reversed",
}: Props) {
  /**
   * The wordmark's two-tone split, reproduced as a gradient clipped to the
   * text. The original cuts diagonally through the B — a gradient with a hard
   * stop does the same thing at any size, and keeps the wordmark as real text
   * for search engines and screen readers.
   */
  const split =
    variant === "reversed"
      ? "linear-gradient(102deg, var(--color-bone) 0%, var(--color-bone) 43%, var(--color-brand-red) 47%, var(--color-brand-red) 100%)"
      : "linear-gradient(102deg, var(--color-brand-navy) 0%, var(--color-brand-navy) 43%, var(--color-brand-red) 47%, var(--color-brand-red) 100%)";

  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <Mark variant={variant} />

      {markOnly ? null : (
        <span className="flex flex-col leading-none">
          <span
            className="font-display text-[1.35rem] font-bold tracking-[0.12em] uppercase"
            style={{
              backgroundImage: split,
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Kabura
          </span>
          <span
            className={cn(
              "mt-1.5 text-[0.5rem] font-semibold tracking-[0.2em] uppercase",
              variant === "reversed" ? "text-sand/75" : "text-brand-navy",
            )}
          >
            Tiling Group Pty Ltd
          </span>
        </span>
      )}
    </span>
  );
}
