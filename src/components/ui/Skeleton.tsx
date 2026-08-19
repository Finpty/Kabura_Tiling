import { cn } from "@/lib/utils";

/** Shimmering placeholder used while heavy sections hydrate. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-charcoal-2/70",
        "after:absolute after:inset-0 after:animate-[shimmer_2.2s_cubic-bezier(0.16,1,0.3,1)_infinite]",
        "after:bg-gradient-to-r after:from-transparent after:via-stone/12 after:to-transparent",
        className,
      )}
      aria-hidden="true"
    />
  );
}
