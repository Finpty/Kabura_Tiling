"use client";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type Props = {
  items: string[];
  className?: string;
  separator?: string;
};

/**
 * CSS-only marquee — no JS on the main thread. With reduced motion it becomes a
 * static, wrapping list.
 */
export function Marquee({ items, className, separator = "—" }: Props) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <ul className={cn("flex flex-wrap gap-x-6 gap-y-2", className)}>
        {items.map((item) => (
          <li key={item} className="eyebrow text-stone-light">
            {item}
          </li>
        ))}
      </ul>
    );
  }

  const run = (
    <span className="flex shrink-0 items-center">
      {items.map((item) => (
        <span key={item} className="flex items-center">
          <span className="eyebrow px-6 text-stone-light whitespace-nowrap">
            {item}
          </span>
          <span aria-hidden="true" className="text-bronze/70">
            {separator}
          </span>
        </span>
      ))}
    </span>
  );

  return (
    <div
      className={cn("flex w-full overflow-hidden select-none", className)}
      role="presentation"
    >
      <div className="flex animate-[marquee_42s_linear_infinite] will-change-transform">
        {run}
        <span aria-hidden="true" className="flex shrink-0 items-center">
          {run}
        </span>
      </div>
    </div>
  );
}
