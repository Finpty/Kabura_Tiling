import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Hide the wordmark and show only the monogram. */
  markOnly?: boolean;
};

/**
 * Wordmark drawn as SVG so it stays razor sharp at any size and inherits the
 * current text colour (the header inverts over the hero).
 *
 * ⚠️  This is a typographic placeholder built for the site. Kabura's official
 * logo file has not been supplied — drop the real artwork in and replace this
 * component. See the asset checklist in README.md.
 */
export function Logo({ className, markOnly = false }: Props) {
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <svg
        viewBox="0 0 40 40"
        className="h-8 w-8 shrink-0"
        role="img"
        aria-label="Kabura Tiling Group"
        focusable="false"
      >
        <circle
          cx="20"
          cy="20"
          r="19"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          opacity="0.55"
        />
        {/* K formed from a stem, a bar and a diagonal — a tile set-out mark */}
        <path
          d="M13.4 11v18M13.4 20h7.4M20.8 11v18M20.8 20l6.2 9M20.8 20l6.2-9"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="square"
        />
      </svg>

      {markOnly ? null : (
        <span className="flex flex-col leading-none">
          <span className="text-[1.02rem] font-semibold tracking-[0.24em] uppercase">
            Kabura
          </span>
          <span className="mt-1 text-[0.54rem] font-medium tracking-[0.34em] text-current/60 uppercase">
            Tiling Group
          </span>
        </span>
      )}
    </span>
  );
}
