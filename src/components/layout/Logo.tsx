import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Hide the wordmark and show only the house-K mark. */
  markOnly?: boolean;
  /**
   * `reversed` is the dark-site treatment. The supplied artwork is navy and
   * red on transparent, and navy on a near-black page is unreadable — so the
   * reversed files carry the same mark with every navy pixel remapped to bone,
   * the red untouched. `primary` is the original, for anything on white.
   */
  variant?: "reversed" | "primary";
};

/**
 * The Kabura Tiling Group lockup.
 *
 * Rendered from the supplied artwork in `public/media/brand/`, generated from
 * `logo.png` at the repository root:
 *
 *   kabura-logo.png        the original, navy + red
 *   kabura-logo-light.png  navy remapped to bone, for the dark site
 *   kabura-mark.png        just the house-K, cropped from the original
 *   kabura-mark-light.png  the same, reversed
 *
 * `unoptimized` on purpose: these are small transparent PNGs that must stay
 * crisp and must never wait on an image-optimiser round trip in the header.
 */

/** Intrinsic sizes of the generated files, so nothing reflows while loading. */
const ART = {
  full: { src: "kabura-logo", width: 1600, height: 343 },
  mark: { src: "kabura-mark", width: 254, height: 343 },
} as const;

export function Logo({
  className,
  markOnly = false,
  variant = "reversed",
}: Props) {
  const art = markOnly ? ART.mark : ART.full;
  const file = variant === "reversed" ? `${art.src}-light` : art.src;

  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src={`/media/brand/${file}.png`}
        alt="Kabura Tiling Group Pty Ltd"
        width={art.width}
        height={art.height}
        priority
        unoptimized
        className={cn("w-auto", markOnly ? "h-9" : "h-10 md:h-11")}
      />
    </span>
  );
}
